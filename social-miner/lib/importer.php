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

function import_progress_job_id(?string $candidate = null): string {
    $candidate = trim((string)$candidate);
    if ($candidate !== '' && preg_match('/^[A-Za-z0-9_-]{8,80}$/', $candidate)) return $candidate;
    return bin2hex(random_bytes(12));
}

function import_progress_set(string $jobId, string $source, string $stage, int $percent, string $message, array $extra = []): void {
    if ($jobId === '') return;
    $percent = max(0, min(100, $percent));
    $now = gmdate('c');
    update_json_file('import-progress.json', function(array &$data) use ($jobId,$source,$stage,$percent,$message,$extra,$now): void {
        $jobs = is_array($data['jobs'] ?? null) ? $data['jobs'] : [];
        $existing = is_array($jobs[$jobId] ?? null) ? $jobs[$jobId] : [];
        $row = array_merge($existing, $extra, [
            'job_id'=>$jobId,
            'source'=>$source,
            'stage'=>$stage,
            'percent'=>$percent,
            'message'=>$message,
            'updated_at'=>$now,
            'started_at'=>$existing['started_at'] ?? $now,
            'status'=>($extra['status'] ?? ($percent >= 100 ? 'complete' : 'running')),
        ]);
        $jobs[$jobId] = $row;
        uasort($jobs, fn($a,$b)=>strcmp((string)($b['updated_at']??''),(string)($a['updated_at']??'')));
        $jobs = array_slice($jobs, 0, 25, true);
        $data = ['current_job'=>$jobId,'jobs'=>$jobs];
    });
}

function import_progress_get(?string $jobId = null): ?array {
    $data = read_json_file('import-progress.json', []);
    $jobs = is_array($data['jobs'] ?? null) ? $data['jobs'] : [];
    if ($jobId !== null && $jobId !== '') return isset($jobs[$jobId]) && is_array($jobs[$jobId]) ? $jobs[$jobId] : null;
    $current = (string)($data['current_job'] ?? '');
    if ($current !== '' && isset($jobs[$current]) && is_array($jobs[$current])) return $jobs[$current];
    if (!$jobs) return null;
    $first = reset($jobs);
    return is_array($first) ? $first : null;
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

    $hasDirectCommentSignal = false;
    foreach ($record as $key => $value) {
        $lk = strtolower((string)$key);
        if (!is_array($value) && preg_match('/(^|_)(comment|message|text|body|content)($|_)/', $lk)) {
            $hasDirectCommentSignal = true; break;
        }
    }
    $hasStructuredPayload = isset($record['string_map_data']) || isset($record['string_list_data']);
    if (!$hasDirectCommentSignal && !$hasStructuredPayload) return null;

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

    $username = '';
    foreach ($flat as $key=>$value) {
        if (strtolower($key) === 'title' && strlen($value) <= 250) { $username = $value; break; }
    }
    if ($username === '') $username = pick_flat_value($flat, ['username','author','from.name','from.username','profile_name','name'], 250);
    if ($username === '') {
        foreach ($flat as $key=>$value) {
            if (strtolower($key) === 'string_list_data.0.value' && strlen($value) <= 250) { $username = $value; break; }
        }
    }

    $url = pick_flat_value($flat, ['permalink','href','uri','url','link'], 3000);
    $timestamp = pick_export_timestamp($flat);
    $userId = pick_flat_value($flat, ['user_id','account_id','profile_id','author_id','from.id'], 250);
    $mediaId = pick_flat_value($flat, ['media_id','post_id','reel_id','media.id','post.id'], 500);
    if ($mediaId === '' && $url !== '') $mediaId = $url;

    $fallbackIdentity = ($username === '' && $timestamp === '' && $url === '') ? ($sourceFile.'|'.$recordPath) : '';
    $fingerprint = hash('sha256', $platform.'|'.$username.'|'.$timestamp.'|'.$text.'|'.$url.'|'.$mediaId.'|'.$fallbackIdentity);
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

function import_meta_export_file(string $path, string $originalName, string $platform, string $target = '', string $label = '', string $jobId = '', string $source = 'manual'): array {
    if (!in_array($platform, ['instagram','facebook'], true)) throw new InvalidArgumentException('Platform must be instagram or facebook.');
    if (!is_file($path)) throw new RuntimeException('Import file is missing.');
    $jobId = import_progress_job_id($jobId);

    $stats = [
        'id' => bin2hex(random_bytes(10)), 'job_id'=>$jobId, 'platform'=>$platform, 'label'=>$label, 'filename'=>$originalName,
        'target'=>$target, 'comments_imported'=>0, 'high_risk'=>0, 'medium_risk'=>0,
        'json_files_seen'=>0, 'json_bytes_seen'=>0, 'skipped_files'=>[], 'created_at'=>gmdate('c'),
    ];
    $lower = strtolower($originalName);
    import_progress_set($jobId,$source,'inspect',42,'Upload received — inspecting Meta export…',['filename'=>$originalName,'platform'=>$platform,'comments'=>0]);

    if (str_ends_with($lower, '.json')) {
        import_progress_set($jobId,$source,'parse',50,'Reading JSON export…',['filename'=>$originalName]);
        $bytes = file_get_contents($path);
        if ($bytes === false) throw new RuntimeException('Unable to read JSON import.');
        process_export_json_bytes($platform, $originalName, $bytes, $target, $stats);
        import_progress_set($jobId,$source,'risk_analysis',82,'Comment and risk analysis complete.',['filename'=>$originalName,'comments'=>$stats['comments_imported'],'high_risk'=>$stats['high_risk'],'medium_risk'=>$stats['medium_risk'],'json_files_seen'=>$stats['json_files_seen']]);
    } elseif (str_ends_with($lower, '.zip')) {
        if (!class_exists('ZipArchive')) throw new RuntimeException('ZIP support is not enabled on this PHP server. Upload JSON files individually.');
        $zip = new ZipArchive();
        $rc = $zip->open($path);
        if ($rc !== true) throw new RuntimeException('Unable to open ZIP export (code '.$rc.').');
        try {
            $eligible = [];
            for ($i=0; $i<$zip->numFiles && count($eligible)<IMPORT_MAX_FILES; $i++) {
                $st = $zip->statIndex($i);
                if (!is_array($st)) continue;
                $name = (string)($st['name'] ?? '');
                if ($name === '' || str_ends_with($name, '/') || !str_ends_with(strtolower($name), '.json')) continue;
                $eligible[] = $i;
            }
            $total = count($eligible);
            import_progress_set($jobId,$source,'unpack',46,$total > 0 ? 'Archive opened — found '.$total.' JSON files.' : 'Archive opened — looking for comment data…',['filename'=>$originalName,'json_files_total'=>$total]);
            $processed = 0;
            foreach ($eligible as $i) {
                $st = $zip->statIndex($i);
                if (!is_array($st)) continue;
                $name = (string)($st['name'] ?? '');
                $size = (int)($st['size'] ?? 0);
                if ($size > IMPORT_MAX_JSON_BYTES || ($stats['json_bytes_seen'] + $size) > IMPORT_MAX_TOTAL_JSON_BYTES) {
                    $stats['skipped_files'][] = $name . ' (size limit)';
                    $processed++;
                } else {
                    $bytes = $zip->getFromIndex($i, IMPORT_MAX_JSON_BYTES + 1);
                    if (!is_string($bytes)) {
                        $stats['skipped_files'][] = $name . ' (read failed)';
                    } else {
                        process_export_json_bytes($platform, $name, $bytes, $target, $stats);
                    }
                    $processed++;
                }
                $fraction = $total > 0 ? $processed / $total : 1;
                $pct = 46 + (int)floor(34 * $fraction);
                import_progress_set($jobId,$source,'parse',$pct,'Scanning export files: '.$processed.' / '.max(1,$total),[
                    'filename'=>$originalName,
                    'json_files_seen'=>$stats['json_files_seen'],
                    'json_files_total'=>$total,
                    'comments'=>$stats['comments_imported'],
                    'high_risk'=>$stats['high_risk'],
                    'medium_risk'=>$stats['medium_risk'],
                ]);
            }
        } finally { $zip->close(); }
        import_progress_set($jobId,$source,'risk_analysis',82,'Comment and risk analysis complete.',['filename'=>$originalName,'comments'=>$stats['comments_imported'],'high_risk'=>$stats['high_risk'],'medium_risk'=>$stats['medium_risk'],'json_files_seen'=>$stats['json_files_seen']]);
    } else {
        throw new InvalidArgumentException('Upload a Meta export ZIP or JSON file.');
    }

    $botCount = null;
    if (function_exists('build_bot_reports')) {
        import_progress_set($jobId,$source,'bot_analysis',90,'Running bot / automation behavior analysis…',['filename'=>$originalName,'comments'=>$stats['comments_imported']]);
        $botCount = count(build_bot_reports(comments_all()));
        import_progress_set($jobId,$source,'finalize',98,'Bot analysis complete — finalizing report.',['filename'=>$originalName,'comments'=>$stats['comments_imported'],'accounts_analyzed'=>$botCount]);
    } else {
        import_progress_set($jobId,$source,'finalize',96,'Finalizing import report…',['filename'=>$originalName,'comments'=>$stats['comments_imported']]);
    }

    $stats['accounts_analyzed'] = $botCount;
    $stats['skipped_files'] = array_slice($stats['skipped_files'], 0, 50);
    record_import($stats);
    append_jsonl('import-log.jsonl', $stats);
    import_progress_set($jobId,$source,'complete',100,'Import and analysis complete.',['status'=>'complete','filename'=>$originalName,'comments'=>$stats['comments_imported'],'high_risk'=>$stats['high_risk'],'medium_risk'=>$stats['medium_risk'],'accounts_analyzed'=>$botCount,'completed_at'=>gmdate('c')]);
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
        $jobId = import_progress_job_id();
        try {
            import_progress_set($jobId,'server-inbox','queued',38,'Server inbox export found — starting analysis.',['filename'=>$name,'platform'=>$platform]);
            $stats = import_meta_export_file($path, $name, $platform, '', 'scheduled inbox', $jobId, 'server-inbox');
            $dest = $done . '/' . gmdate('Ymd-His') . '-' . preg_replace('/[^A-Za-z0-9._-]/','_',$name);
            rename($path, $dest);
            $results[]=['file'=>$name,'ok'=>true,'comments'=>$stats['comments_imported']];
        } catch (Throwable $e) {
            import_progress_set($jobId,'server-inbox','failed',100,'Import failed: '.$e->getMessage(),['status'=>'error','filename'=>$name]);
            $dest = $failed . '/' . gmdate('Ymd-His') . '-' . preg_replace('/[^A-Za-z0-9._-]/','_',$name);
            @rename($path, $dest);
            $results[]=['file'=>$name,'ok'=>false,'error'=>$e->getMessage()];
        }
    }
    return $results;
}
