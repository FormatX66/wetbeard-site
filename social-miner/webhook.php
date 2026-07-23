<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/analyzer.php';
require __DIR__ . '/lib/meta.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $mode = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? '';
        $verify = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '';
        $expected = setting('webhook_verify_token', '') ?? '';
        if ($mode === 'subscribe' && $expected !== '' && hash_equals($expected, (string)$verify)) {
            header('Content-Type: text/plain'); echo (string)$challenge; exit;
        }
        http_response_code(403); echo 'Forbidden'; exit;
    }

    $rawBody = file_get_contents('php://input') ?: '';
    $appSecret = setting('meta_app_secret', '') ?? '';
    if ($appSecret === '') {
        json_response(['ok' => false, 'error' => 'Meta App Secret is not configured; webhook ingestion is disabled.'], 503);
    }
    $providedSignature = (string)($_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '');
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $rawBody, $appSecret);
    if ($providedSignature === '' || !hash_equals($expectedSignature, $providedSignature)) {
        json_response(['ok' => false, 'error' => 'Invalid Meta webhook signature.'], 403);
    }

    $payload = json_decode($rawBody !== '' ? $rawBody : '{}', true);
    if (!is_array($payload)) throw new RuntimeException('Invalid webhook JSON');
    $object = (string)($payload['object'] ?? '');
    $platform = $object === 'instagram' ? 'instagram' : 'facebook';
    $imported = 0;

    foreach (($payload['entry'] ?? []) as $entry) {
        if (!is_array($entry)) continue;
        foreach (($entry['changes'] ?? []) as $change) {
            if (!is_array($change)) continue;
            $value = is_array($change['value'] ?? null) ? $change['value'] : [];
            $mediaId = (string)($value['media']['id'] ?? $value['post_id'] ?? $value['post']['id'] ?? '');
            $commentId = (string)($value['id'] ?? $value['comment_id'] ?? '');
            $text = (string)($value['text'] ?? $value['message'] ?? '');
            $from = is_array($value['from'] ?? null) ? $value['from'] : [];
            if ($commentId === '' || $mediaId === '') continue;
            $analysis = analyze_comment($text);
            comment_upsert([
                'platform' => $platform,
                'external_comment_id' => $commentId,
                'external_media_id' => $mediaId,
                'parent_external_id' => (string)($value['parent_id'] ?? ''),
                'user_id' => (string)($from['id'] ?? ''),
                'username' => (string)($from['username'] ?? $from['name'] ?? ''),
                'text' => $text,
                'created_time' => isset($entry['time']) ? gmdate('c', (int)$entry['time']) : '',
                'like_count' => 0,
                'permalink' => '',
                'risk_level' => $analysis['risk_level'],
                'flags_json' => json_encode($analysis['flags'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'raw_json' => json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ]);
            $imported++;
        }

        if ($platform === 'instagram' && isset($entry['field'], $entry['value']) && is_array($entry['value'])) {
            $value = $entry['value'];
            $mediaId = (string)($value['media']['id'] ?? '');
            $commentId = (string)($value['id'] ?? '');
            if ($commentId !== '' && $mediaId !== '') {
                $from = is_array($value['from'] ?? null) ? $value['from'] : [];
                $text = (string)($value['text'] ?? '');
                $analysis = analyze_comment($text);
                comment_upsert([
                    'platform' => 'instagram', 'external_comment_id' => $commentId, 'external_media_id' => $mediaId,
                    'parent_external_id' => '', 'user_id' => (string)($from['id'] ?? ''),
                    'username' => (string)($from['username'] ?? ''), 'text' => $text,
                    'created_time' => isset($entry['time']) ? gmdate('c', (int)$entry['time']) : '', 'like_count' => 0,
                    'permalink' => '', 'risk_level' => $analysis['risk_level'],
                    'flags_json' => json_encode($analysis['flags'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                    'raw_json' => json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                ]);
                $imported++;
            }
        }
    }

    json_response(['ok' => true, 'imported' => $imported]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], 500);
}
