<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/analyzer.php';
require __DIR__ . '/lib/importer.php';

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$results = process_inbox_files();
foreach ($results as $row) echo json_encode($row, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE).PHP_EOL;
