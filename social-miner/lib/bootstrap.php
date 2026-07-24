<?php
declare(strict_types=1);

const MINER_VERSION = '0.3.0';

function app_root(): string { return dirname(__DIR__); }
function storage_dir(): string { return app_root() . '/storage'; }
function storage_path(string $name): string { return storage_dir() . '/' . $name; }

function ensure_storage(): void {
    $dir = storage_dir();
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new RuntimeException('Unable to create storage directory.');
    }
    @chmod($dir, 0700);
}

function local_config(): array {
    $path = app_root() . '/config.local.php';
    if (!is_file($path)) return [];
    $cfg = require $path;
    return is_array($cfg) ? $cfg : [];
}

function read_json_file(string $file, array $default = []): array {
    ensure_storage();
    $path = storage_path($file);
    if (!is_file($path)) return $default;
    $fh = fopen($path, 'rb');
    if (!$fh) return $default;
    try {
        flock($fh, LOCK_SH);
        $raw = stream_get_contents($fh) ?: '';
        flock($fh, LOCK_UN);
    } finally { fclose($fh); }
    if ($raw === '') return $default;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $default;
}

function update_json_file(string $file, callable $mutator, array $default = []): mixed {
    ensure_storage();
    $path = storage_path($file);
    $fh = fopen($path, 'c+b');
    if (!$fh) throw new RuntimeException('Unable to open storage file: ' . $file);
    try {
        if (!flock($fh, LOCK_EX)) throw new RuntimeException('Unable to lock storage file.');
        rewind($fh);
        $raw = stream_get_contents($fh) ?: '';
        $data = $raw !== '' ? json_decode($raw, true) : $default;
        if (!is_array($data)) $data = $default;
        $result = $mutator($data);
        rewind($fh);
        ftruncate($fh, 0);
        $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($encoded === false || fwrite($fh, $encoded . "\n") === false) throw new RuntimeException('Unable to write storage file.');
        fflush($fh);
        @chmod($path, 0600);
        flock($fh, LOCK_UN);
        return $result;
    } finally { fclose($fh); }
}

function append_jsonl(string $file, array $row): void {
    ensure_storage();
    $path = storage_path($file);
    $fh = fopen($path, 'ab');
    if (!$fh) throw new RuntimeException('Unable to open log file.');
    try {
        flock($fh, LOCK_EX);
        fwrite($fh, json_encode($row, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
        fflush($fh);
        @chmod($path, 0600);
        flock($fh, LOCK_UN);
    } finally { fclose($fh); }
}

function setting(string $key, ?string $default = null): ?string {
    $settings = read_json_file('settings.json', []);
    return array_key_exists($key, $settings) ? (string)$settings[$key] : $default;
}

function set_setting(string $key, string $value): void {
    update_json_file('settings.json', function(array &$data) use ($key, $value): void { $data[$key] = $value; });
}

function watches_all(): array {
    $rows = array_values(read_json_file('watches.json', []));
    usort($rows, fn($a,$b) => ((int)($b['id']??0)) <=> ((int)($a['id']??0)));
    return $rows;
}

function watch_upsert(string $platform, string $externalId, string $label, string $url): array {
    return update_json_file('watches.json', function(array &$data) use ($platform,$externalId,$label,$url) {
        $key = $platform . ':' . $externalId;
        if (isset($data[$key])) {
            $data[$key]['label'] = $label;
            $data[$key]['url'] = $url;
            $data[$key]['active'] = true;
        } else {
            $max = 0; foreach ($data as $row) $max = max($max, (int)($row['id'] ?? 0));
            $data[$key] = ['id'=>$max+1,'platform'=>$platform,'external_id'=>$externalId,'label'=>$label,'url'=>$url,'active'=>true,'last_sync_at'=>null,'created_at'=>gmdate('c')];
        }
        return $data[$key];
    });
}

function watch_by_id(int $id): ?array {
    foreach (watches_all() as $row) if ((int)($row['id'] ?? 0) === $id && !empty($row['active'])) return $row;
    return null;
}

function watch_touch_sync(int $id): void {
    update_json_file('watches.json', function(array &$data) use ($id): void {
        foreach ($data as &$row) if ((int)($row['id'] ?? 0) === $id) $row['last_sync_at'] = gmdate('c');
    });
}

function comments_all(): array {
    return array_values(read_json_file('comments.json', []));
}

function comment_upsert(array $row): void {
    $key = (string)$row['platform'] . ':' . (string)$row['external_comment_id'];
    if ($row['external_comment_id'] === '') return;
    update_json_file('comments.json', function(array &$data) use ($key,$row): void {
        $existing = $data[$key] ?? [];
        $row['collected_at'] = $existing['collected_at'] ?? gmdate('c');
        $row['updated_at'] = gmdate('c');
        $data[$key] = array_merge($existing, $row);
    });
}

function comment_counts(): array {
    $out = ['total'=>0,'high'=>0,'medium'=>0,'low'=>0];
    foreach (comments_all() as $r) {
        $out['total']++;
        $risk = (string)($r['risk_level'] ?? 'none');
        if (isset($out[$risk])) $out[$risk]++;
    }
    return $out;
}

function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function body_json(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return $_POST;
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

function require_session_auth(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (empty($_SESSION['miner_auth'])) json_response(['ok'=>false,'error'=>'Authentication required'], 401);
}

function csrf_token(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
    return (string)$_SESSION['csrf'];
}

function require_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf'] ?? '');
    if (!hash_equals(csrf_token(), (string)$token)) json_response(['ok'=>false,'error'=>'Invalid CSRF token'], 403);
}

function redact_token(?string $value): string {
    if (!$value) return '';
    $len = strlen($value);
    if ($len <= 10) return str_repeat('•', $len);
    return substr($value, 0, 5) . str_repeat('•', min(18, $len - 9)) . substr($value, -4);
}
