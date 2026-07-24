<?php
declare(strict_types=1);

const IMPORT_MAX_FILES = 2500;
const IMPORT_MAX_JSON_BYTES = 20_000_000;
const IMPORT_MAX_TOTAL_JSON_BYTES = 350_000_000;

function import_history(): array {
    $rows = array_values(read_json_file('imports.json', []));
    usort($rows, fn($a,$b)=>strcmp((string)($b['created_at']??''),(string)($a['created_at']??'')));
    return $rows;
}

function record_import(array $row): void {
    update_json_file('imports.json', function(array &$data) use ($row): void {
        $key = (string)($row['id'] ?? bin2hex(random_bytes(8)));
        $data[$key] = $row;
        if (count($data) > 250) {
            uasort($data, fn($a,$b)=>strcmp((string)($b['created_at']??''),(string)($a['created_at']??'')));
            $data = array_slice($data, 0, 250, true);
        }
    });
}

function scalar_text(mixed $v): string {
    if (is_string($v)) return trim($v);
    if (is_int($v) || is_float($v)) return (string)$v;
    return '';
}

function flatten_export_record(mixed $value, string $prefix = '', int $depth = 0, array &$out = []): array {
    if ($depth > 8) return $out;
    if (is_array($value)) {
        foreach ($value as $k => $v) {
            $key = $prefix === '' ? (string)$k : $prefix . '.' . (string)$k;
            if (is_array($v)) {
                flatten_export_record($v, $key, $depth + 1, $out);
            } else {
                $s = scalar_text($v);
                if ($s !== '') $out[$key] = $s;
            }
        }
    }
    return $out;
}

function pick_flat_value(array $flat, array $needles, int $maxLen = 0): string {
    foreach ($needles as $needle) {
        foreach ($flat as $key => $value) {
            $lk = strtolower((string)$key);
            if (str_contains($lk, $needle)) {
                $s = trim((string)$value);
                if ($s !== '' && ($maxLen <= 0 || strlen($s) <= $maxLen)) return $s;
            }
        }
    }
    return '';
}

function pick_export_timestamp(array $flat): string {
    foreach ($flat as $key => $value) {
        $lk = strtolower((string)$key);
        if (!preg_match('/(?:^|\.)(timestamp|created_time|creation_time|time)$/', $lk)) continue;
        if (ctype_digit($value)) {
            $n = (int)$value;
            if ($n > 10_000_000_000) $n = (int)floor($n / 1000);
            if ($n > 946684800 && $n < 4102444800) return gmdate('c', $n);
        }
        $t = strtotime($value);
        if ($t !== false) return gmdate('c', $t);
    }
    return '';
}

function comment_candidate_from_record(string $platform, string $sourceFile, string $recordPath, mixed $record, string $target = ''): ?array {
    if (!is_array($record)) return null;
    $flat = [];
    flatten_export_record($record, '', 0, $flat);
    if (!$flat) return null;

    $flatKeys = strtolower(implode(' ', array_keys($flat)));
    $commentish = str_contains(strtolower($sourceFile), 'comment') || str_contains($flatKeys, 'comment');
    if (!$commentish) return null;

    $raw = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($raw === false) return null;
    if ($target !== '' && stripos($raw . ' ' . $sourceFile, $target) === false) return null;

    $text = pick_flat_value($flat, ['comment.value','comment_text','comment text','comment','message','body','text.value','content.value','text']);
    if ($text === '' || strlen($text) > 20000) return null;

    $username = pick_flat_value($flat, ['username','author','from.name','from.username','profile_name','media owner','owner','name'], 250);
    if ($username === '') {
        foreach (['title','string_list_data.0.value'] as $fallback) {
            foreach ($flat as $key=>$value) {
                if (strtolower($key) === $fallback && strlen($value) <= 250) { $username = $value; break 2; }
            }
        }
    }

    $url = pick_flat_value($flat, ['permalink','href','uri','url','link'], 3000);
    $timestamp = pick_export_timestamp($flat);
    $userId = pick_flat_value($flat, ['user_id','account_id','profile_id','author_id','from.id'], 250);
    $mediaId = pick_flat_value($flat, ['media_id','post_id','reel_id','media.id','post.id'], 500);
    if ($mediaId === '' && $url !== '') $mediaId = $url;

    $fingerprint = hash('sha256', $platform.'|'.$sourceFile.'|'.$recordPath.'|'.$username.'|'.$timestamp.'|'.$text);
    $analysis = analyze_comment($text);
    return [
        'platform' => $platform,
        'external_comment_id' => 'export:' . substr($fingerprint, 0, 40),
        'external_media_id' => $mediaId !== '' ? $mediaId : ('export:' . substr(hash('sha256',$sourceFile),0,20)),
        'parent_external_id' => '',
        'user_id' => $userId,
        'username' => $username,
        'text' => $text,
        'created_time' => $timestamp,
        'like_count' => 0,
        'permalink' => $url,
        'risk_level' => $analysis['risk_level'],
        'flags_json' => json_encode($analysis['flags'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        'raw_json' => $raw,
        'source_type' => 'meta_export',
        'source_file' => $sourceFile,
        'source_path' => $recordPath,
    ];
}

function walk_export_json(string $platform, string $sourceFile, mixed $node, string $target, string $path, int $depth, array &$stats): void {
    if ($depth > 16 || !is_array($node)) return;

    $candidate = comment_candidate_from_record($platform, $sourceFile, $path, $node, $target);
    if ($candidate !== null) {
        comment_upsert($candidate);
        $stats['comments_imported']++;
        if ($candidate['risk_level'] === 'high') $stats['high_risk']++;
        elseif ($candidate['risk_level'] === 'medium') $stats['medium_risk']++;
    }

    foreach ($node as $k => $child) {
        if (!is_array($child)) continue;
        $childPath = $path === '' ? (string)$k : $path . '.' . (string)$k;
        walk_export_json($platform, $sourceFile, $child, $target, $childPath, $depth + 1, $stats);
    }
}

function process_export_json_bytes(string $platform, string $sourceFile, string $bytes, string $target, array &$stats): void {
    $stats['json_files_seen']++;
    $stats['json_bytes_seen'] += strlen($bytes);
    if (strlen($bytes) > IMPORT_MAX_JSON_BYTES) { $stats['skipped_files'][] = $sourceFile . ' (too large)'; return; }
    $decoded = json_decode($bytes, true, 512, JSON_BIGINT_AS_STRING);
    if (!is_array($decoded)) { $stats['skipped_files'][] = $sourceFile . ' (invalid JSON)'; return; }
    walk_export_json($platform, $sourceFile, $decoded, $target, '', 0, $stats);
}

function import_meta_export_file(string $path, string $originalName, string $platform, string $target = '', string $label = ''): array {
    if (!in_array($platform, ['instagram','facebook'], true)) throw new InvalidArgumentException('Platform must be instagram or facebook.');
    if (!is_file($path)) throw new RuntimeException('Import file is missing.');

    $stats = [
        'id' => bin2hex(random_bytes(10)), 'platform'=>$platform, 'label'=>$label, 'filename'=>$originalName,
        'target'=>$target, 'comments_imported'=>0, 'high_risk'=>0, 'medium_risk'=>0,
        'json_files_seen'=>0, 'json_bytes_seen'=>0, 'skipped_files'=>[], 'created_at'=>gmdate('c'),
    ];
    $lower = strtolower($originalName);

    if (str_ends_with($lower, '.json')) {
        $bytes = file_get_contents($path);
        if ($bytes === false) throw new RuntimeException('Unable to read JSON import.');
        process_export_json_bytes($platform, $originalName, $bytes, $target, $stats);
    } elseif (str_ends_with($lower, '.zip')) {
        if (!class_exists('ZipArchive')) throw new RuntimeException('ZIP support is not enabled on this PHP server. Upload JSON files individually.');
        $zip = new ZipArchive();
        $rc = $zip->open($path);
        if ($rc !== true) throw new RuntimeException('Unable to open ZIP export (code '.$rc.').');
        try {
            $processed = 0;
            for ($i=0; $i<$zip->numFiles && $processed<IMPORT_MAX_FILES; $i++) {
                $st = $zip->statIndex($i);
                if (!is_array($st)) continue;
                $name = (string)($st['name'] ?? '');
                if ($name === '' || str_ends_with($name, '/') || !str_ends_with(strtolower($name), '.json')) continue;
                $size = (int)($st['size'] ?? 0);
                if ($size > IMPORT_MAX_JSON_BYTES || ($stats['json_bytes_seen'] + $size) > IMPORT_MAX_TOTAL_JSON_BYTES) {
                    $stats['skipped_files'][] = $name . ' (size limit)';
                    continue;
                }
                $bytes = $zip->getFromIndex($i, IMPORT_MAX_JSON_BYTES + 1);
                if (!is_string($bytes)) { $stats['skipped_files'][] = $name . ' (read failed)'; continue; }
                process_export_json_bytes($platform, $name, $bytes, $target, $stats);
                $processed++;
            }
        } finally { $zip->close(); }
    } else {
        throw new InvalidArgumentException('Upload a Meta export ZIP or JSON file.');
    }

    $stats['skipped_files'] = array_slice($stats['skipped_files'], 0, 50);
    record_import($stats);
    append_jsonl('import-log.jsonl', $stats);
    return $stats;
}

function ensure_shortcut_token(): string {
    $token = setting('shortcut_upload_token', '') ?? '';
    if ($token === '') { $token = bin2hex(random_bytes(24)); set_setting('shortcut_upload_token', $token); }
    return $token;
}

function shortcut_authorized(): bool {
    $expected = setting('shortcut_upload_token', '') ?? '';
    if ($expected === '') return false;
    $header = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (!preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) return false;
    return hash_equals($expected, trim($m[1]));
}

function process_inbox_files(): array {
    ensure_storage();
    $dir = storage_path('inbox');
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $done = storage_path('inbox/processed');
    $failed = storage_path('inbox/failed');
    @mkdir($done, 0700, true); @mkdir($failed, 0700, true);
    $results=[];
    foreach (glob($dir.'/*') ?: [] as $path) {
        if (!is_file($path)) continue;
        $name = basename($path);
        if (!preg_match('/\.(zip|json)$/i', $name)) continue;
        $platform = str_starts_with(strtolower($name), 'facebook') ? 'facebook' : 'instagram';
        try {
            $stats = import_meta_export_file($path, $name, $platform, '', 'scheduled inbox');
            $dest = $done . '/' . gmdate('Ymd-His') . '-' . preg_replace('/[^A-Za-z0-9._-]/','_',$name);
            rename($path, $dest);
            $results[]=['file'=>$name,'ok'=>true,'comments'=>$stats['comments_imported']];
        } catch (Throwable $e) {
            $dest = $failed . '/' . gmdate('Ymd-His') . '-' . preg_replace('/[^A-Za-z0-9._-]/','_',$name);
            @rename($path, $dest);
            $results[]=['file'=>$name,'ok'=>false,'error'=>$e->getMessage()];
        }
    }
    return $results;
}
