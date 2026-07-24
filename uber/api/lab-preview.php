<?php
declare(strict_types=1);
require __DIR__ . '/lab-common.php';

try {
    $id = lab_clean_id((string)($_GET['id'] ?? ''));
    $page = (string)($_GET['page'] ?? 'index.html');
    if (!in_array($page, ['index.html', 'citizen.html', 'careers.html'], true)) $page = 'index.html';
    $dir = lab_data_root() . '/' . $id;
    $html = (string)file_get_contents($dir . '/' . $page);
    $css = (string)file_get_contents($dir . '/assets/site.css');
    $js = (string)file_get_contents($dir . '/assets/site.js');

    $self = '/uber/api/lab-preview.php?id=' . rawurlencode($id) . '&page=';
    foreach (['index.html', 'citizen.html', 'careers.html'] as $linked) {
        $html = str_replace('href="' . $linked . '"', 'href="' . $self . rawurlencode($linked) . '"', $html);
    }
    $html = preg_replace('#<link[^>]+href=["\']assets/site\.css[^"\']*["\'][^>]*>#i', '<style>' . $css . '</style>', $html) ?? $html;
    $html = preg_replace('#<script[^>]+src=["\']assets/site\.js[^"\']*["\'][^>]*></script>#i', '<script>' . str_replace('</script>', '<\\/script>', $js) . '</script>', $html) ?? $html;
    $banner = '<div style="position:fixed;z-index:2147483647;left:8px;top:8px;padding:6px 9px;background:#ffdf49;color:#111;border:2px solid #111;font:800 10px monospace;letter-spacing:.08em">SANDBOX ' . htmlspecialchars($id, ENT_QUOTES) . ' // NOT PRODUCTION</div>';
    $html = preg_replace('/<body([^>]*)>/i', '<body$1>' . $banner, $html, 1) ?? $html;

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    header("Content-Security-Policy: default-src 'self' https: data: blob:; script-src 'unsafe-inline' https:; style-src 'unsafe-inline' https:; img-src https: data: blob:; media-src https: data: blob:; connect-src https:; frame-src https:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
    header('X-Content-Type-Options: nosniff');
    echo $html;
} catch (Throwable $e) {
    http_response_code(404);
    echo '<!doctype html><meta charset="utf-8"><title>Sandbox unavailable</title><body style="background:#08090b;color:white;font-family:system-ui;padding:30px"><h1>Sandbox unavailable.</h1></body>';
}
