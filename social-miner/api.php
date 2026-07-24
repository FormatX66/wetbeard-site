<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/analyzer.php';
require __DIR__ . '/lib/meta.php';
require __DIR__ . '/lib/importer.php';
require __DIR__ . '/lib/cloud.php';
require __DIR__ . '/lib/bot.php';
$action = $_GET['action'] ?? '';

try {
    if ($action === 'health') {
        ensure_storage();
        $probe = storage_path('.health');
        $ok = @file_put_contents($probe, gmdate('c')) !== false;
        if ($ok) @unlink($probe);
        json_response([
            'ok'=>$ok,
            'version'=>MINER_VERSION,
            'php'=>PHP_VERSION,
            'storage'=>'json+flock',
            'storage_writable'=>$ok,
            'zip_available'=>class_exists('ZipArchive'),
            'curl_available'=>function_exists('curl_init'),
            'bot_analysis'=>true,
        ], $ok?200:500);
    }

    require_session_auth();

    if ($action === 'status') {
        $shortcutToken = ensure_shortcut_token();
        json_response([
            'ok'=>true,
            'csrf'=>csrf_token(),
            'watches'=>watches_all(),
            'counts'=>comment_counts(),
            'imports'=>array_slice(import_history(),0,20),
            'settings'=>[
                'meta_api_version'=>setting('meta_api_version','v23.0'),
                'instagram_host'=>setting('instagram_host','graph.instagram.com'),
                'instagram_token'=>redact_token(setting('instagram_token','')),
                'facebook_token'=>redact_token(setting('facebook_token','')),
                'meta_app_secret'=>redact_token(setting('meta_app_secret','')),
                'webhook_verify_token'=>setting('webhook_verify_token',''),
                'custom_flag_terms'=>setting('custom_flag_terms',''),
                'shortcut_upload_token'=>$shortcutToken,
                'gdrive_enabled'=>setting('gdrive_enabled','0'),
                'gdrive_client_id'=>setting('gdrive_client_id',''),
                'gdrive_client_secret'=>redact_token(setting('gdrive_client_secret','')),
                'gdrive_refresh_token'=>redact_token(setting('gdrive_refresh_token','')),
                'gdrive_folder_id'=>setting('gdrive_folder_id',''),
                'dropbox_enabled'=>setting('dropbox_enabled','0'),
                'dropbox_app_key'=>setting('dropbox_app_key',''),
                'dropbox_app_secret'=>redact_token(setting('dropbox_app_secret','')),
                'dropbox_refresh_token'=>redact_token(setting('dropbox_refresh_token','')),
                'dropbox_folder'=>setting('dropbox_folder',''),
            ]
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') require_csrf();

    if ($action === 'settings' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = body_json();
        foreach (['meta_api_version','instagram_host','custom_flag_terms','gdrive_client_id','gdrive_folder_id','dropbox_app_key','dropbox_folder'] as $key) {
            if (array_key_exists($key,$data)) set_setting($key, trim((string)$data[$key]));
        }
        foreach (['gdrive_enabled','dropbox_enabled'] as $key) {
            if (array_key_exists($key,$data)) set_setting($key, !empty($data[$key]) ? '1' : '0');
        }
        foreach (['instagram_token','facebook_token','meta_app_secret','gdrive_client_secret','gdrive_refresh_token','dropbox_app_secret','dropbox_refresh_token'] as $key) {
            if (isset($data[$key]) && trim((string)$data[$key]) !== '') set_setting($key, trim((string)$data[$key]));
        }
        if ((setting('webhook_verify_token','')??'') === '') set_setting('webhook_verify_token', bin2hex(random_bytes(18)));
        ensure_shortcut_token();
        json_response(['ok'=>true]);
    }

    if ($action === 'rotate_shortcut_token' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = bin2hex(random_bytes(24));
        set_setting('shortcut_upload_token',$token);
        json_response(['ok'=>true,'token'=>$token]);
    }

    if ($action === 'cloud_sync' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        json_response(['ok'=>true,'results'=>poll_cloud_sources()]);
    }

    if ($action === 'imports') {
        json_response(['ok'=>true,'imports'=>import_history()]);
    }

    if ($action === 'watch' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = body_json();
        $platform = strtolower(trim((string)($data['platform']??'')));
        $externalId = trim((string)($data['external_id']??''));
        if (!in_array($platform,['instagram','facebook'],true)) throw new InvalidArgumentException('Platform must be instagram or facebook.');
        if ($externalId === '' || !preg_match('/^[0-9_]+$/',$externalId)) throw new InvalidArgumentException('Enter the Meta media/post ID, not only the public URL.');
        $watch = watch_upsert($platform,$externalId,trim((string)($data['label']??'')),trim((string)($data['url']??'')));
        json_response(['ok'=>true,'watch'=>$watch]);
    }

    if ($action === 'sync' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = body_json(); $watch = watch_by_id((int)($data['id']??0));
        if (!$watch) throw new RuntimeException('Watch not found.');
        try {
            $count = sync_watch($watch);
            append_jsonl('sync-log.jsonl',['platform'=>$watch['platform'],'external_media_id'=>$watch['external_id'],'status'=>'ok','detail'=>'','imported_count'=>$count,'created_at'=>gmdate('c')]);
            json_response(['ok'=>true,'imported'=>$count]);
        } catch (Throwable $e) {
            append_jsonl('sync-log.jsonl',['platform'=>$watch['platform'],'external_media_id'=>$watch['external_id'],'status'=>'error','detail'=>$e->getMessage(),'imported_count'=>0,'created_at'=>gmdate('c')]);
            throw $e;
        }
    }

    if ($action === 'comments') {
        $risk = (string)($_GET['risk']??''); $q = strtolower(trim((string)($_GET['q']??'')));
        $rows = array_values(array_filter(comments_all(), function(array $r) use ($risk,$q): bool {
            if (in_array($risk,['none','low','medium','high'],true) && ($r['risk_level']??'none') !== $risk) return false;
            if ($q !== '') {
                $hay = strtolower((string)($r['text']??'').' '.(string)($r['username']??'').' '.(string)($r['source_file']??'').' '.(string)($r['permalink']??''));
                if (strpos($hay,$q) === false) return false;
            }
            return true;
        }));
        usort($rows, fn($a,$b)=>strcmp((string)($b['created_time']??$b['collected_at']??''),(string)($a['created_time']??$a['collected_at']??'')));
        $rows = array_slice($rows,0,1000);
        foreach ($rows as &$row) $row['flags'] = json_decode((string)($row['flags_json']??'[]'),true) ?: [];
        json_response(['ok'=>true,'comments'=>$rows]);
    }

    if ($action === 'users') {
        $groups=[];
        foreach (comments_all() as $r) {
            $key=(string)($r['platform']??'').':'.(string)($r['user_id']??'').':'.(string)($r['username']??'');
            if(!isset($groups[$key]))$groups[$key]=['platform'=>$r['platform']??'','username'=>$r['username']??'','user_id'=>$r['user_id']??'','comment_count'=>0,'high_count'=>0,'medium_count'=>0,'latest'=>''];
            $groups[$key]['comment_count']++;
            if(($r['risk_level']??'')==='high')$groups[$key]['high_count']++;
            if(($r['risk_level']??'')==='medium')$groups[$key]['medium_count']++;
            $t=(string)($r['created_time']??$r['collected_at']??''); if($t>$groups[$key]['latest'])$groups[$key]['latest']=$t;
        }
        $rows=array_values($groups); usort($rows,fn($a,$b)=>[$b['high_count'],$b['medium_count'],$b['comment_count']]<=>[$a['high_count'],$a['medium_count'],$a['comment_count']]);
        json_response(['ok'=>true,'users'=>array_slice($rows,0,1000)]);
    }

    if ($action === 'bot_users') {
        $reports = build_bot_reports(comments_all());
        $summary = array_map(fn($r) => [
            'report_id'=>$r['report_id'],
            'platform'=>$r['platform'],
            'username'=>$r['username'],
            'user_id'=>$r['user_id'],
            'bot_percentage'=>$r['bot_percentage'],
            'label'=>$r['label'],
            'confidence'=>$r['confidence'],
            'comment_count'=>$r['comment_count'],
            'high_risk_count'=>$r['high_risk_count'],
            'medium_risk_count'=>$r['medium_risk_count'],
            'latest_activity'=>$r['latest_activity'],
            'top_signals'=>array_slice($r['signals'],0,3),
        ], array_slice($reports,0,1000));
        json_response(['ok'=>true,'accounts'=>$summary]);
    }

    if ($action === 'bot_report') {
        $id = trim((string)($_GET['id'] ?? ''));
        if ($id === '') throw new InvalidArgumentException('Report ID is required.');
        $report = find_bot_report(comments_all(), $id);
        if (!$report) json_response(['ok'=>false,'error'=>'Bot report not found'],404);
        json_response(['ok'=>true,'report'=>$report]);
    }

    if ($action === 'bot_export') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="social-miner-bot-report-'.gmdate('Ymd-His').'.csv"');
        header('Cache-Control: no-store');
        $out=fopen('php://output','wb');
        fputcsv($out,['platform','username','user_id','bot_percentage','label','confidence','comment_count','high_risk_count','medium_risk_count','duplicate_ratio','cross_account_shared_ratio','link_ratio','median_interval_seconds','minimum_interval_seconds','burst_10s_ratio','burst_60s_ratio','interval_cv','top_signals']);
        foreach(build_bot_reports(comments_all()) as $r) {
            $m=$r['metrics'];
            $signals=implode(' | ',array_map(fn($s)=>$s['name'].' +'.$s['points'].' ('.$s['value'].')',$r['signals']));
            fputcsv($out,[$r['platform'],$r['username'],$r['user_id'],$r['bot_percentage'],$r['label'],$r['confidence'],$r['comment_count'],$r['high_risk_count'],$r['medium_risk_count'],$m['duplicate_ratio'],$m['cross_account_shared_ratio'],$m['link_ratio'],$m['median_interval_seconds'],$m['minimum_interval_seconds'],$m['burst_10s_ratio'],$m['burst_60s_ratio'],$m['interval_cv'],$signals]);
        }
        fclose($out); exit;
    }

    if ($action === 'export') {
        header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="social-miner-comments-'.gmdate('Ymd-His').'.csv"'); header('Cache-Control: no-store');
        $out=fopen('php://output','wb');
        fputcsv($out,['platform','post_id','comment_id','parent_comment_id','username','user_id','text','created_time','like_count','risk_level','flags','permalink','source_type','source_file','source_path','collected_at']);
        $rows=comments_all(); usort($rows,fn($a,$b)=>strcmp((string)($a['created_time']??$a['collected_at']??''),(string)($b['created_time']??$b['collected_at']??'')));
        foreach($rows as $r) fputcsv($out,[$r['platform']??'',$r['external_media_id']??'',$r['external_comment_id']??'',$r['parent_external_id']??'',$r['username']??'',$r['user_id']??'',$r['text']??'',$r['created_time']??'',$r['like_count']??0,$r['risk_level']??'none',implode('|',json_decode((string)($r['flags_json']??'[]'),true)?:[]),$r['permalink']??'',$r['source_type']??'api',$r['source_file']??'',$r['source_path']??'',$r['collected_at']??'']);
        fclose($out); exit;
    }
    json_response(['ok'=>false,'error'=>'Unknown action'],404);
} catch (InvalidArgumentException $e) { json_response(['ok'=>false,'error'=>$e->getMessage()],400); }
catch (Throwable $e) { json_response(['ok'=>false,'error'=>$e->getMessage()],500); }
