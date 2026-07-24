<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$name = trim((string)($_GET['name'] ?? ''));
if ($name === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'name_required']);
    exit;
}

if (strcasecmp($name, 'trogdor') === 0) {
    echo json_encode([
        'ok' => true,
        'score' => 0,
        'status' => 'BURNINATION DETECTED',
        'risk' => 'PEASANT-LEVEL CATASTROPHE',
        'action' => 'RUN FOR THE THATCHED-ROOF COTTAGES',
        'event' => 'trogdor',
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$hash = hexdec(substr(hash('sha256', strtoupper($name)), 0, 6));
$score = 18 + ($hash % 78);

if (preg_match('/rusty|orlock|chroma|mungo|parrot|pavo|pirate|p1klz|p1-k/i', $name)) {
    $score = min($score, 14);
    $status = 'EXTREMELY INTERESTING';
    $risk = 'UNACCEPTABLY MUSICAL';
    $action = 'REMAIN WHERE YOU ARE';
} elseif ($score >= 86) {
    $status = 'MODEL CITIZEN';
    $risk = 'MINIMAL';
    $action = 'CONTINUE CONSUMING';
} elseif ($score >= 65) {
    $status = 'PROVISIONALLY ALIGNED';
    $risk = 'MANAGEABLE';
    $action = 'WATCH MORE CORPORATE MEDIA';
} elseif ($score >= 40) {
    $status = 'REQUIRES GUIDANCE';
    $risk = 'CONCERNING';
    $action = 'REPORT UNUSUAL THOUGHTS';
} else {
    $status = 'NON-COMPLIANT';
    $risk = 'SPICY';
    $action = 'AVOID GUITARS & SMALL MOONS';
}

echo json_encode([
    'ok' => true,
    'score' => $score,
    'status' => $status,
    'risk' => $risk,
    'action' => $action,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
