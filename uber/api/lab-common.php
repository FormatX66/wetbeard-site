<?php
declare(strict_types=1);

const LAB_ALLOWED_FILES = [
    'index.html',
    'citizen.html',
    'careers.html',
    'assets/site.css',
    'assets/site.js',
];
const LAB_MAX_PROMPT = 2400;
const LAB_MAX_FILE_BYTES = 180000;
const LAB_MAX_GENERATIONS_PER_HOUR = 5;

function lab_json(array $payload, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function lab_site_root(): string {
    return dirname(__DIR__);
}

function lab_data_root(): string {
    $root = lab_site_root() . '/sandbox-data';
    if (!is_dir($root) && !mkdir($root, 0700, true) && !is_dir($root)) {
        throw new RuntimeException('Unable to initialize sandbox storage.');
    }
    return $root;
}

function lab_clean_id(string $id): string {
    if (!preg_match('/^[a-f0-9]{16}$/', $id)) {
        throw new InvalidArgumentException('Invalid sandbox id.');
    }
    return $id;
}

function lab_new_id(): string {
    return bin2hex(random_bytes(8));
}

function lab_read_source(string $path): string {
    if (!in_array($path, LAB_ALLOWED_FILES, true)) {
        throw new InvalidArgumentException('File not allowed.');
    }
    $full = lab_site_root() . '/' . $path;
    $content = @file_get_contents($full);
    if ($content === false) {
        throw new RuntimeException('Unable to read source file: ' . $path);
    }
    return $content;
}

function lab_copy_source_to_sandbox(string $id): string {
    $dir = lab_data_root() . '/' . lab_clean_id($id);
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new RuntimeException('Unable to create sandbox.');
    }
    foreach (LAB_ALLOWED_FILES as $path) {
        $target = $dir . '/' . $path;
        $parent = dirname($target);
        if (!is_dir($parent)) {
            mkdir($parent, 0700, true);
        }
        if (file_put_contents($target, lab_read_source($path), LOCK_EX) === false) {
            throw new RuntimeException('Unable to seed sandbox file.');
        }
    }
    return $dir;
}

function lab_load_api_key(): string {
    $env = trim((string)getenv('OPENAI_API_KEY'));
    if ($env !== '') return $env;

    $docRoot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    $candidates = [];
    if ($docRoot !== '') $candidates[] = dirname($docRoot) . '/.ubercorp-openai-key';
    $home = trim((string)getenv('HOME'));
    if ($home !== '') $candidates[] = rtrim($home, '/') . '/.ubercorp-openai-key';

    foreach ($candidates as $file) {
        if (is_readable($file)) {
            $key = trim((string)file_get_contents($file));
            if ($key !== '') return $key;
        }
    }
    return '';
}

function lab_visitor_hash(string $visitor): string {
    $visitor = preg_replace('/[^a-zA-Z0-9_-]/', '', $visitor) ?: 'anonymous';
    $visitor = substr($visitor, 0, 96);
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    return hash('sha256', $visitor . '|' . $ip . '|ubercorp-lab-v1');
}

function lab_rate_limit(string $visitorHash): void {
    $dir = lab_data_root() . '/.rate';
    if (!is_dir($dir)) mkdir($dir, 0700, true);
    $file = $dir . '/' . $visitorHash . '.json';
    $now = time();
    $events = [];
    if (is_readable($file)) {
        $decoded = json_decode((string)file_get_contents($file), true);
        if (is_array($decoded)) $events = array_values(array_filter($decoded, fn($t) => is_int($t) && $t > $now - 3600));
    }
    if (count($events) >= LAB_MAX_GENERATIONS_PER_HOUR) {
        lab_json(['ok' => false, 'error' => 'rate_limited', 'message' => 'Corporate creativity quota reached. Try again later.'], 429);
    }
    $events[] = $now;
    file_put_contents($file, json_encode($events), LOCK_EX);
}

function lab_extract_output_text(array $response): string {
    if (isset($response['output_text']) && is_string($response['output_text'])) {
        return $response['output_text'];
    }
    foreach (($response['output'] ?? []) as $item) {
        if (($item['type'] ?? '') !== 'message') continue;
        foreach (($item['content'] ?? []) as $content) {
            if (($content['type'] ?? '') === 'output_text' && isset($content['text'])) {
                return (string)$content['text'];
            }
        }
    }
    return '';
}

function lab_call_openai(string $prompt, string $visitorHash): array {
    $apiKey = lab_load_api_key();
    if ($apiKey === '') {
        lab_json([
            'ok' => false,
            'error' => 'ai_not_configured',
            'message' => 'The sandbox is installed, but its OpenAI API key has not been configured yet.'
        ], 503);
    }

    $source = [];
    foreach (LAB_ALLOWED_FILES as $path) {
        $source[$path] = lab_read_source($path);
    }

    $instructions = <<<'TXT'
You are the isolated Übercorp Website Improvement Terminal. Modify only the supplied website source files in response to the visitor request.
Return only files that should change. Preserve the exact brand spelling “Übercorp” (capital Ü, lowercase c) unless the user is explicitly discussing the spelling itself.
Never produce PHP, .htaccess, server configuration, credentials, secrets, shell commands, redirects to credential forms, or code intended to escape an iframe/sandbox.
Do not add analytics, fingerprinting, crypto-mining, credential collection, browser storage harvesting, or calls to private/internal endpoints.
Keep the result usable on mobile. Existing League of Space Pirates and Trogdor easter eggs should remain functional unless the prompt explicitly asks to change them.
TXT;

    $input = $instructions . "\n\nVISITOR REQUEST:\n" . $prompt . "\n\nCURRENT FILES:\n" . json_encode($source, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    $schema = [
        'type' => 'object',
        'properties' => [
            'summary' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 600],
            'files' => [
                'type' => 'array',
                'maxItems' => 5,
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'path' => ['type' => 'string', 'enum' => LAB_ALLOWED_FILES],
                        'content' => ['type' => 'string', 'maxLength' => LAB_MAX_FILE_BYTES],
                    ],
                    'required' => ['path', 'content'],
                    'additionalProperties' => false,
                ],
            ],
        ],
        'required' => ['summary', 'files'],
        'additionalProperties' => false,
    ];

    $body = [
        'model' => 'gpt-5.6',
        'store' => false,
        'safety_identifier' => 'ubercorp_' . substr($visitorHash, 0, 40),
        'input' => $input,
        'text' => [
            'format' => [
                'type' => 'json_schema',
                'name' => 'ubercorp_sandbox_patch',
                'strict' => true,
                'schema' => $schema,
            ],
        ],
    ];

    $ch = curl_init('https://api.openai.com/v1/responses');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 12,
        CURLOPT_TIMEOUT => 75,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);
    $raw = curl_exec($ch);
    $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $curlError !== '') {
        throw new RuntimeException('AI connection failed.');
    }
    $response = json_decode($raw, true);
    if (!is_array($response) || $http < 200 || $http >= 300) {
        $message = is_array($response) ? (string)($response['error']['message'] ?? 'AI request failed.') : 'AI request failed.';
        throw new RuntimeException($message);
    }

    $text = lab_extract_output_text($response);
    $patch = json_decode($text, true);
    if (!is_array($patch) || !isset($patch['files']) || !is_array($patch['files'])) {
        throw new RuntimeException('AI returned an invalid sandbox patch.');
    }
    return $patch;
}

function lab_validate_generated_content(string $path, string $content): void {
    if (!in_array($path, LAB_ALLOWED_FILES, true)) throw new RuntimeException('Disallowed file path.');
    if (strlen($content) > LAB_MAX_FILE_BYTES) throw new RuntimeException('Generated file too large.');
    $blocked = ['<?php', '<%=', '<script language="php"', 'document.cookie', 'window.parent', 'window.top', 'parent.location', 'top.location'];
    foreach ($blocked as $needle) {
        if (stripos($content, $needle) !== false) throw new RuntimeException('Generated content failed sandbox validation.');
    }
}

function lab_write_patch(string $dir, array $patch): array {
    $changed = [];
    foreach ($patch['files'] as $file) {
        $path = (string)($file['path'] ?? '');
        $content = (string)($file['content'] ?? '');
        lab_validate_generated_content($path, $content);
        $target = $dir . '/' . $path;
        $parent = dirname($target);
        if (!is_dir($parent)) mkdir($parent, 0700, true);
        if (file_put_contents($target, $content, LOCK_EX) === false) throw new RuntimeException('Unable to write sandbox patch.');
        $changed[] = $path;
    }
    return $changed;
}

function lab_metadata_path(string $id): string {
    return lab_data_root() . '/' . lab_clean_id($id) . '/metadata.json';
}

function lab_read_metadata(string $id): array {
    $file = lab_metadata_path($id);
    if (!is_readable($file)) throw new RuntimeException('Sandbox not found.');
    $data = json_decode((string)file_get_contents($file), true);
    if (!is_array($data)) throw new RuntimeException('Sandbox metadata is invalid.');
    return $data;
}
