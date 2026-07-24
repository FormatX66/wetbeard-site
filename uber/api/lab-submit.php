<?php
declare(strict_types=1);
require __DIR__ . '/lab-common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') lab_json(['ok' => false, 'error' => 'method_not_allowed'], 405);
try {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $id = lab_clean_id((string)($body['id'] ?? ''));
    $meta = lab_read_metadata($id);
    $meta['status'] = 'submitted';
    $meta['submitted_at'] = gmdate('c');
    file_put_contents(lab_metadata_path($id), json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);

    $queue = lab_data_root() . '/proposals';
    if (!is_dir($queue)) mkdir($queue, 0700, true);
    file_put_contents($queue . '/' . $id . '.json', json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
    lab_json(['ok' => true, 'id' => $id, 'status' => 'submitted', 'message' => 'Proposal submitted to Übercorp Central Authority.']);
} catch (Throwable $e) {
    lab_json(['ok' => false, 'error' => 'submit_failed', 'message' => 'Unable to submit this proposal.'], 400);
}
