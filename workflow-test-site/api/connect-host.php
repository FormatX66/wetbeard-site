<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function out(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(['ok' => false, 'error' => 'POST required'], 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) out(['ok' => false, 'error' => 'Invalid JSON'], 400);

$host = strtolower(trim((string)($data['host'] ?? '')));
$user = trim((string)($data['username'] ?? ''));
$pass = (string)($data['password'] ?? '');

$host = preg_replace('~^https?://~i', '', $host);
$host = preg_replace('~/.*$~', '', $host);
$host = preg_replace('~:\d+$~', '', $host);

if ($host === '' || strlen($host) > 253 || !preg_match('/^[a-z0-9.-]+$/i', $host)) {
    out(['ok' => false, 'error' => 'Enter a valid host or domain'], 400);
}
if ($user === '' || $pass === '') {
    out(['ok' => false, 'error' => 'Username and password are required'], 400);
}

$ip = gethostbyname($host);
if ($ip === $host && !filter_var($host, FILTER_VALIDATE_IP)) {
    out(['ok' => false, 'error' => 'Host could not be resolved'], 400);
}

$ports = [
    22 => 'SSH / SFTP',
    21 => 'FTP',
    990 => 'FTPS',
    2083 => 'cPanel',
    8443 => 'Plesk',
    2222 => 'DirectAdmin / alternate SSH',
    443 => 'HTTPS / host API',
];

$found = [];
foreach ($ports as $port => $label) {
    $errno = 0; $errstr = '';
    $sock = @fsockopen($host, $port, $errno, $errstr, 1.6);
    if (is_resource($sock)) {
        fclose($sock);
        $found[] = ['port' => $port, 'label' => $label, 'reachable' => true];
    }
}

$auth = [];

// FTP auth test when PHP FTP support is available. Credentials exist only for this request.
if (function_exists('ftp_connect') && in_array(21, array_column($found, 'port'), true)) {
    $ftp = @ftp_connect($host, 21, 4);
    if ($ftp) {
        $logged = @ftp_login($ftp, $user, $pass);
        $auth[] = ['method' => 'FTP', 'authenticated' => (bool)$logged];
        @ftp_close($ftp);
    }
}

if (function_exists('ftp_ssl_connect') && in_array(21, array_column($found, 'port'), true)) {
    $ftp = @ftp_ssl_connect($host, 21, 4);
    if ($ftp) {
        $logged = @ftp_login($ftp, $user, $pass);
        $auth[] = ['method' => 'Explicit FTPS', 'authenticated' => (bool)$logged];
        @ftp_close($ftp);
    }
}

// SFTP auth via cURL when libcurl has SFTP support.
if (function_exists('curl_init') && in_array(22, array_column($found, 'port'), true)) {
    $version = curl_version();
    $protocols = array_map('strtolower', $version['protocols'] ?? []);
    if (in_array('sftp', $protocols, true)) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => 'sftp://' . $host . '/',
            CURLOPT_USERPWD => $user . ':' . $pass,
            CURLOPT_NOBODY => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 6,
        ]);
        $result = curl_exec($ch);
        $auth[] = ['method' => 'SFTP', 'authenticated' => $result !== false];
        curl_close($ch);
    }
}

$preferred = null;
foreach (['SFTP', 'Explicit FTPS', 'FTP'] as $method) {
    foreach ($auth as $a) {
        if ($a['method'] === $method && $a['authenticated']) { $preferred = $method; break 2; }
    }
}
if ($preferred === null) {
    if (in_array(22, array_column($found, 'port'), true)) $preferred = 'SSH / SFTP available — password auth not confirmed';
    elseif (in_array(2083, array_column($found, 'port'), true)) $preferred = 'cPanel available';
    elseif (in_array(8443, array_column($found, 'port'), true)) $preferred = 'Plesk available';
    elseif ($found) $preferred = $found[0]['label'];
}

// Deliberately do not log or persist $pass.
$pass = str_repeat('*', min(strlen($pass), 8));
unset($pass);

out([
    'ok' => true,
    'host' => $host,
    'resolved_ip' => $ip,
    'reachable_services' => $found,
    'authentication_tests' => $auth,
    'preferred_connection' => $preferred,
    'credentials_stored' => false,
]);
