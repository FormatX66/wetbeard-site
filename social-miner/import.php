<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/analyzer.php';
require __DIR__ . '/lib/importer.php';
require __DIR__ . '/lib/bot.php';

$jobId = '';
$source = 'manual';
try {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    $sessionOk = !empty($_SESSION['miner_auth']);
    $shortcutOk = shortcut_authorized();
    if (!$sessionOk && !$shortcutOk) json_response(['ok'=>false,'error'=>'Authentication required'],401);
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['ok'=>false,'error'=>'POST required'],405);
    if ($sessionOk && !$shortcutOk) require_csrf();
    $source = $shortcutOk ? 'iphone-shortcut' : 'manual-upload';
    $jobId = import_progress_job_id($_POST['job_id'] ?? '');
    if ($sessionOk) session_write_close();

    if (!isset($_FILES['archive']) || !is_array($_FILES['archive'])) throw new InvalidArgumentException('Attach a ZIP or JSON file in the archive field.');
    $f = $_FILES['archive'];
    if ((int)($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) throw new RuntimeException('Upload failed with code '.(int)$f['error'].'.');
    $tmp = (string)($f['tmp_name'] ?? '');
    $name = basename((string)($f['name'] ?? 'meta-export.zip'));
    $size = (int)($f['size'] ?? 0);
    if ($size <= 0 || $size > 250_000_000) throw new InvalidArgumentException('File must be between 1 byte and 250 MB.');
    $platform = strtolower(trim((string)($_POST['platform'] ?? 'instagram')));
    $target = trim((string)($_POST['target'] ?? ''));
    $label = trim((string)($_POST['label'] ?? ''));

    import_progress_set($jobId,$source,'uploaded',40,'Upload complete — handing file to analyzer.',['filename'=>$name,'platform'=>$platform,'size_bytes'=>$size]);
    $stats = import_meta_export_file($tmp, $name, $platform, $target, $label, $jobId, $source);
    json_response(['ok'=>true,'job_id'=>$jobId,'import'=>$stats]);
} catch (InvalidArgumentException $e) {
    if ($jobId !== '') import_progress_set($jobId,$source,'failed',100,'Import failed: '.$e->getMessage(),['status'=>'error']);
    json_response(['ok'=>false,'error'=>$e->getMessage()],400);
} catch (Throwable $e) {
    if ($jobId !== '') import_progress_set($jobId,$source,'failed',100,'Import failed: '.$e->getMessage(),['status'=>'error']);
    json_response(['ok'=>false,'error'=>$e->getMessage()],500);
}
