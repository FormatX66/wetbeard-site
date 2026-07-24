<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/analyzer.php';
require __DIR__ . '/lib/importer.php';
require __DIR__ . '/lib/cloud.php';
require __DIR__ . '/lib/bot.php';

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$results = array_merge(process_inbox_files(), poll_cloud_sources());
foreach ($results as $row) echo json_encode($row, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE).PHP_EOL;
