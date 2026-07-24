<?php
declare(strict_types=1);
require __DIR__ . '/lab-common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') lab_json(['ok' => false, 'error' => 'method_not_allowed'], 405);

try {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) lab_json(['ok' => false, 'error' => 'invalid_json'], 400);
    $prompt = trim((string)($body['prompt'] ?? ''));
    $visitor = (string)($body['visitor'] ?? 'anonymous');
    if ($prompt === '' || mb_strlen($prompt) > LAB_MAX_PROMPT) {
        lab_json(['ok' => false, 'error' => 'invalid_prompt', 'message' => 'Prompt must be between 1 and ' . LAB_MAX_PROMPT . ' characters.'], 400);
    }

    $visitorHash = lab_visitor_hash($visitor);
    lab_rate_limit($visitorHash);
    $patch = lab_call_openai($prompt, $visitorHash);

    $id = lab_new_id();
    $dir = lab_copy_source_to_sandbox($id);
    $changed = lab_write_patch($dir, $patch);
    $meta = [
        'id' => $id,
        'created_at' => gmdate('c'),
        'prompt' => $prompt,
        'summary' => (string)($patch['summary'] ?? 'Sandbox revision'),
        'changed_files' => $changed,
        'visitor_hash' => substr($visitorHash, 0, 24),
        'status' => 'draft',
    ];
    file_put_contents($dir . '/metadata.json', json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);

    lab_json([
        'ok' => true,
        'id' => $id,
        'summary' => $meta['summary'],
        'changed_files' => $changed,
        'preview_url' => '/uber/api/lab-preview.php?id=' . rawurlencode($id) . '&page=index.html',
    ]);
} catch (Throwable $e) {
    error_log('Übercorp lab-create: ' . $e->getMessage());
    lab_json(['ok' => false, 'error' => 'generation_failed', 'message' => $e->getMessage()], 500);
}
