<?php
declare(strict_types=1);

function cloud_http(string $method, string $url, array $headers = [], ?string $body = null, array $form = []): array {
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => array_merge(['User-Agent: SocialMiner/'.MINER_VERSION], $headers),
    ];
    if ($form) {
        $opts[CURLOPT_POSTFIELDS] = http_build_query($form, '', '&', PHP_QUERY_RFC3986);
        $opts[CURLOPT_HTTPHEADER][] = 'Content-Type: application/x-www-form-urlencoded';
    } elseif ($body !== null) {
        $opts[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($ch, $opts);
    $resp = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($resp === false) throw new RuntimeException('Cloud request failed: '.$err);
    if ($status < 200 || $status >= 300) throw new RuntimeException('Cloud request returned HTTP '.$status.': '.substr((string)$resp,0,500));
    return ['status'=>$status,'body'=>(string)$resp];
}

function oauth_refresh_token(string $tokenUrl, string $clientId, string $clientSecret, string $refreshToken): string {
    $res = cloud_http('POST', $tokenUrl, [], null, [
        'client_id'=>$clientId,
        'client_secret'=>$clientSecret,
        'refresh_token'=>$refreshToken,
        'grant_type'=>'refresh_token',
    ]);
    $json = json_decode($res['body'], true);
    if (!is_array($json) || empty($json['access_token'])) throw new RuntimeException('Cloud OAuth refresh did not return an access token.');
    return (string)$json['access_token'];
}

function cloud_seen_key(string $provider, string $id, string $version): string { return $provider.':'.$id.':'.$version; }
function cloud_seen(): array { return read_json_file('cloud-seen.json', []); }
function mark_cloud_seen(string $key, array $meta): void {
    update_json_file('cloud-seen.json', function(array &$data) use ($key,$meta): void {
        $data[$key] = $meta + ['processed_at'=>gmdate('c')];
        if (count($data) > 1000) {
            uasort($data, fn($a,$b)=>strcmp((string)($b['processed_at']??''),(string)($a['processed_at']??'')));
            $data = array_slice($data,0,1000,true);
        }
    });
}

function import_downloaded_cloud_file(string $tmp, string $name, string $provider, string $remoteId, string $version, string $jobId): array {
    $platform = str_contains(strtolower($name),'facebook') ? 'facebook' : 'instagram';
    $stats = import_meta_export_file($tmp, $name, $platform, '', $provider.' recurring export', $jobId, $provider);
    $key = cloud_seen_key($provider,$remoteId,$version);
    mark_cloud_seen($key,['provider'=>$provider,'remote_id'=>$remoteId,'version'=>$version,'name'=>$name,'comments_imported'=>$stats['comments_imported']]);
    return $stats;
}

function poll_google_drive(): array {
    if ((setting('gdrive_enabled','0')??'0') !== '1') return [];
    $clientId = setting('gdrive_client_id','') ?? '';
    $clientSecret = setting('gdrive_client_secret','') ?? '';
    $refreshToken = setting('gdrive_refresh_token','') ?? '';
    $folderId = setting('gdrive_folder_id','') ?? '';
    if ($clientId===''||$clientSecret===''||$refreshToken===''||$folderId==='') return [['provider'=>'gdrive','ok'=>false,'error'=>'Google Drive is enabled but OAuth/folder settings are incomplete.']];
    $access = oauth_refresh_token('https://oauth2.googleapis.com/token',$clientId,$clientSecret,$refreshToken);
    $q = "'".str_replace("'","\\'",$folderId)."' in parents and trashed = false";
    $url = 'https://www.googleapis.com/drive/v3/files?'.http_build_query([
        'q'=>$q,
        'fields'=>'files(id,name,mimeType,modifiedTime,size,md5Checksum)',
        'pageSize'=>'1000',
        'orderBy'=>'modifiedTime desc',
    ],'','&',PHP_QUERY_RFC3986);
    $res = cloud_http('GET',$url,['Authorization: Bearer '.$access,'Accept: application/json']);
    $json = json_decode($res['body'],true);
    $seen = cloud_seen(); $out=[];
    foreach (($json['files']??[]) as $file) {
        if (!is_array($file)) continue;
        $name=(string)($file['name']??''); $id=(string)($file['id']??'');
        if ($id==='' || !preg_match('/\.(zip|json)$/i',$name)) continue;
        $version=(string)($file['md5Checksum']??$file['modifiedTime']??'');
        $key=cloud_seen_key('gdrive',$id,$version);
        if (isset($seen[$key])) continue;
        $jobId = import_progress_job_id();
        import_progress_set($jobId,'gdrive','download',5,'Google Drive export found — downloading…',['filename'=>$name]);
        $tmp=tempnam(sys_get_temp_dir(),'sminer-gd-');
        if ($tmp===false) throw new RuntimeException('Unable to allocate cloud temp file.');
        try {
            $download=cloud_http('GET','https://www.googleapis.com/drive/v3/files/'.rawurlencode($id).'?alt=media',['Authorization: Bearer '.$access]);
            if (file_put_contents($tmp,$download['body'])===false) throw new RuntimeException('Unable to store Google Drive download.');
            import_progress_set($jobId,'gdrive','downloaded',35,'Google Drive download complete — starting analysis.',['filename'=>$name,'size_bytes'=>strlen($download['body'])]);
            $stats=import_downloaded_cloud_file($tmp,$name,'gdrive',$id,$version,$jobId);
            $out[]=['provider'=>'gdrive','ok'=>true,'file'=>$name,'comments'=>$stats['comments_imported']];
        } catch (Throwable $e) {
            import_progress_set($jobId,'gdrive','failed',100,'Google Drive import failed: '.$e->getMessage(),['status'=>'error','filename'=>$name]);
            $out[]=['provider'=>'gdrive','ok'=>false,'file'=>$name,'error'=>$e->getMessage()];
        } finally { @unlink($tmp); }
    }
    return $out;
}

function poll_dropbox(): array {
    if ((setting('dropbox_enabled','0')??'0') !== '1') return [];
    $appKey = setting('dropbox_app_key','') ?? '';
    $appSecret = setting('dropbox_app_secret','') ?? '';
    $refreshToken = setting('dropbox_refresh_token','') ?? '';
    $folder = setting('dropbox_folder','') ?? '';
    if ($appKey===''||$appSecret===''||$refreshToken==='') return [['provider'=>'dropbox','ok'=>false,'error'=>'Dropbox is enabled but OAuth settings are incomplete.']];
    $access = oauth_refresh_token('https://api.dropboxapi.com/oauth2/token',$appKey,$appSecret,$refreshToken);
    $res = cloud_http('POST','https://api.dropboxapi.com/2/files/list_folder',[
        'Authorization: Bearer '.$access,'Content-Type: application/json'
    ],json_encode(['path'=>$folder,'recursive'=>false,'include_deleted'=>false,'limit'=>2000],JSON_UNESCAPED_SLASHES));
    $json=json_decode($res['body'],true); $seen=cloud_seen(); $out=[];
    foreach (($json['entries']??[]) as $file) {
        if (!is_array($file) || ($file['.tag']??'')!=='file') continue;
        $name=(string)($file['name']??''); $id=(string)($file['id']??''); $path=(string)($file['path_lower']??''); $rev=(string)($file['rev']??'');
        if ($path==='' || !preg_match('/\.(zip|json)$/i',$name)) continue;
        $key=cloud_seen_key('dropbox',$id!==''?$id:$path,$rev);
        if (isset($seen[$key])) continue;
        $jobId = import_progress_job_id();
        import_progress_set($jobId,'dropbox','download',5,'Dropbox export found — downloading…',['filename'=>$name]);
        $tmp=tempnam(sys_get_temp_dir(),'sminer-db-'); if($tmp===false) throw new RuntimeException('Unable to allocate cloud temp file.');
        try {
            $download=cloud_http('POST','https://content.dropboxapi.com/2/files/download',[
                'Authorization: Bearer '.$access,
                'Dropbox-API-Arg: '.json_encode(['path'=>$path],JSON_UNESCAPED_SLASHES),
            ]);
            if(file_put_contents($tmp,$download['body'])===false) throw new RuntimeException('Unable to store Dropbox download.');
            import_progress_set($jobId,'dropbox','downloaded',35,'Dropbox download complete — starting analysis.',['filename'=>$name,'size_bytes'=>strlen($download['body'])]);
            $stats=import_downloaded_cloud_file($tmp,$name,'dropbox',$id!==''?$id:$path,$rev,$jobId);
            $out[]=['provider'=>'dropbox','ok'=>true,'file'=>$name,'comments'=>$stats['comments_imported']];
        } catch(Throwable $e){
            import_progress_set($jobId,'dropbox','failed',100,'Dropbox import failed: '.$e->getMessage(),['status'=>'error','filename'=>$name]);
            $out[]=['provider'=>'dropbox','ok'=>false,'file'=>$name,'error'=>$e->getMessage()];
        } finally{@unlink($tmp);}
    }
    return $out;
}

function poll_cloud_sources(): array {
    $out=[];
    foreach ([fn()=>poll_google_drive(), fn()=>poll_dropbox()] as $fn) {
        try { $out=array_merge($out,$fn()); }
        catch(Throwable $e){$out[]=['provider'=>'cloud','ok'=>false,'error'=>$e->getMessage()];}
    }
    append_jsonl('cloud-sync-log.jsonl',['created_at'=>gmdate('c'),'results'=>$out]);
    return $out;
}
