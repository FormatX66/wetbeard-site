<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

session_start();
$config = local_config();
$error = '';
if (isset($_POST['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: ./'); exit;
}
if (empty($_SESSION['miner_auth']) && isset($_POST['admin_key'])) {
    $hash = (string)($config['admin_password_hash'] ?? '');
    if ($hash !== '' && password_verify((string)$_POST['admin_key'], $hash)) {
        session_regenerate_id(true);
        $_SESSION['miner_auth'] = true;
        header('Location: ./'); exit;
    }
    $error = 'Invalid admin key.';
}
$authed = !empty($_SESSION['miner_auth']);
$baseUrl = (isset($_SERVER['HTTPS'])?'https':'http').'://'.($_SERVER['HTTP_HOST']??'').rtrim(dirname($_SERVER['SCRIPT_NAME']??'/'),'/');
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Social Comment Miner</title>
<style>
:root{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:dark;background:#111;color:#eee}body{margin:0;background:#111}main{max-width:1180px;margin:auto;padding:20px}.card{background:#1c1c1c;border:1px solid #333;border-radius:14px;padding:16px;margin:0 0 16px}h1,h2,h3{margin-top:0}input,select,textarea,button{font:inherit;background:#0f0f0f;color:#eee;border:1px solid #444;border-radius:8px;padding:9px}input,select,textarea{width:100%;box-sizing:border-box}input[type=checkbox]{width:auto}button{cursor:pointer;background:#2a2a2a}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.muted{color:#aaa}.error{color:#ff9d9d}.good{color:#9dffb4}.badge{padding:3px 8px;border-radius:999px;background:#333;font-size:.8rem}.risk-high{font-weight:700}.tablewrap{overflow:auto;max-height:58vh}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid #333}th{position:sticky;top:0;background:#1c1c1c}code{word-break:break-all}.login{max-width:420px;margin:12vh auto}.secret{background:#0b0b0b;padding:8px;border-radius:8px;display:block;overflow:auto}.split{display:grid;grid-template-columns:1fr 1fr;gap:16px}.small{font-size:.86rem}a{color:inherit}@media(max-width:760px){.split{grid-template-columns:1fr}}
</style></head><body><main>
<?php if(!$authed): ?>
<div class="card login"><h1>Social Comment Miner</h1><p class="muted">Private admin login.</p><?php if($error):?><p class="error"><?=htmlspecialchars($error)?></p><?php endif;?><form method="post"><label>Admin key<input type="password" name="admin_key" autocomplete="current-password" required></label><p><button type="submit">Sign in</button></p></form></div>
<?php else: ?>
<div class="row" style="justify-content:space-between"><div><h1 style="margin-bottom:4px">Social Comment Miner</h1><div class="muted">Facebook + Instagram comment evidence collector</div></div><form method="post"><button name="logout" value="1">Log out</button></form></div>

<div class="card"><h2>Status</h2><div id="status">Loading…</div></div>

<div class="card">
  <h2>Import a Meta data export</h2>
  <p class="muted">Upload the ZIP Meta gives you, or an individual JSON file. The importer scans comment-like records, deduplicates them, preserves the raw record, and runs the same risk flags as API-collected comments.</p>
  <div class="grid">
    <label>Platform<select id="importPlatform"><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></label>
    <label>Target post URL / ID (optional)<input id="importTarget" placeholder="Leave blank to import all comment records"></label>
    <label>Label<input id="importLabel" placeholder="e.g. July reel export"></label>
    <label>ZIP or JSON<input id="importFile" type="file" accept=".zip,.json,application/zip,application/json"></label>
  </div>
  <p><button onclick="uploadExport()">Upload & analyze</button> <span id="importMsg" class="muted"></span></p>
</div>

<div class="card">
  <h2>iPhone Shortcut uploader</h2>
  <p class="muted">Use this as the backup path when Meta gives you a download on your phone. The Shortcut can receive the ZIP from the Share Sheet and POST it directly here.</p>
  <div class="grid">
    <label>Upload URL<code class="secret" id="shortcutUrl"><?=htmlspecialchars($baseUrl.'/import.php')?></code></label>
    <label>Bearer token<code class="secret" id="shortcutToken">Loading…</code></label>
  </div>
  <p class="small">Shortcut recipe: <strong>Receive Files from Share Sheet → Get Contents of URL</strong>; method POST; request body Form; field <code>archive</code> = Shortcut Input; field <code>platform</code> = instagram or facebook; header <code>Authorization</code> = <code>Bearer TOKEN</code>. Add optional form fields <code>target</code> and <code>label</code>.</p>
  <div class="row"><button onclick="copyText('shortcutUrl')">Copy URL</button><button onclick="copyText('shortcutToken')">Copy token</button><button onclick="rotateShortcutToken()">Rotate token</button><span id="shortcutMsg" class="muted"></span></div>
</div>

<div class="card">
  <h2>Recurring cloud export automation</h2>
  <p class="muted">Point Meta's recurring export at a dedicated Google Drive or Dropbox folder. Once the OAuth refresh credentials below are configured, Bluehost checks for new ZIP/JSON files automatically and imports each file once.</p>
  <div class="split">
    <div>
      <h3>Google Drive</h3>
      <label class="row"><input type="checkbox" id="gdriveEnabled"> Enable scheduled polling</label>
      <p><label>OAuth client ID<input id="gdriveClientId"></label></p>
      <p><label>OAuth client secret<input id="gdriveClientSecret" type="password" placeholder="Leave blank to keep existing"></label></p>
      <p><label>OAuth refresh token<input id="gdriveRefreshToken" type="password" placeholder="Leave blank to keep existing"></label></p>
      <p><label>Folder ID<input id="gdriveFolderId" placeholder="Drive folder ID"></label></p>
    </div>
    <div>
      <h3>Dropbox</h3>
      <label class="row"><input type="checkbox" id="dropboxEnabled"> Enable scheduled polling</label>
      <p><label>App key<input id="dropboxAppKey"></label></p>
      <p><label>App secret<input id="dropboxAppSecret" type="password" placeholder="Leave blank to keep existing"></label></p>
      <p><label>OAuth refresh token<input id="dropboxRefreshToken" type="password" placeholder="Leave blank to keep existing"></label></p>
      <p><label>Folder path<input id="dropboxFolder" placeholder="/Meta Exports"></label></p>
    </div>
  </div>
  <div class="row"><button onclick="saveCloudSettings()">Save cloud settings</button><button onclick="cloudSyncNow()">Check cloud now</button><span id="cloudMsg" class="muted"></span></div>
</div>

<div class="card"><h2>Recent export imports</h2><div class="tablewrap"><table><thead><tr><th>Time</th><th>Platform</th><th>File</th><th>Comments</th><th>High</th><th>Medium</th><th>Target</th></tr></thead><tbody id="imports"></tbody></table></div></div>

<div class="card"><h2>Meta API settings</h2><div class="grid"><label>API version<input id="apiVersion" value="v23.0"></label><label>Instagram host<select id="igHost"><option>graph.instagram.com</option><option>graph.facebook.com</option></select></label><label>Instagram access token<input id="igToken" type="password" placeholder="Leave blank to keep existing token"></label><label>Facebook Page access token<input id="fbToken" type="password" placeholder="Leave blank to keep existing token"></label><label>Meta App Secret<input id="appSecret" type="password" placeholder="Required for verified webhooks"></label></div><p><label>Custom flag terms<textarea id="customTerms" rows="3" placeholder="One per line or comma-separated"></textarea></label></p><div class="row"><button onclick="saveMetaSettings()">Save API settings</button><span id="settingsMsg" class="muted"></span></div><p class="muted">Webhook URL: <code><?=htmlspecialchars($baseUrl.'/webhook.php')?></code><br>Verification token: <code id="verifyToken">save settings once to generate</code></p></div>

<div class="card"><h2>Add watched API post</h2><div class="grid"><label>Platform<select id="watchPlatform"><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></label><label>Meta media/post ID<input id="watchId" placeholder="Numeric ID or PageID_PostID"></label><label>Label<input id="watchLabel" placeholder="e.g. July 2026 reel"></label><label>Public URL<input id="watchUrl" placeholder="https://..."></label></div><p><button onclick="addWatch()">Add / update</button> <span id="watchMsg" class="muted"></span></p><div id="watches"></div></div>

<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Comments</h2><div class="row"><select id="risk" onchange="loadComments()"><option value="">All risk levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">None</option></select><input id="search" placeholder="Search text, user, source file" style="width:240px"><button onclick="loadComments()">Search</button><a href="api.php?action=export">Export CSV</a></div></div><div class="tablewrap"><table><thead><tr><th>Risk</th><th>User</th><th>Time</th><th>Comment</th><th>Flags</th><th>Source</th></tr></thead><tbody id="comments"></tbody></table></div></div>

<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Flagged users</h2><button onclick="loadUsers()">Refresh</button></div><div class="tablewrap"><table><thead><tr><th>User</th><th>Platform</th><th>Comments</th><th>High</th><th>Medium</th><th>Latest</th></tr></thead><tbody id="users"></tbody></table></div></div>

<script>
let csrf='';
async function api(action, opts={}){const headers={'Accept':'application/json'};if(opts.body){headers['Content-Type']='application/json';headers['X-CSRF-Token']=csrf;}const r=await fetch('api.php?action='+encodeURIComponent(action),{...opts,headers:{...headers,...(opts.headers||{})}});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));return j;}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function setv(id,v){const e=document.getElementById(id);if(e)e.value=v??'';}
function setc(id,v){const e=document.getElementById(id);if(e)e.checked=String(v)==='1'||v===true;}
function copyText(id){navigator.clipboard.writeText(document.getElementById(id).textContent).catch(()=>{});}

async function loadStatus(){try{const j=await api('status');csrf=j.csrf;status.innerHTML=`<span class="good">Online</span> · ${j.counts.total||0} comments · ${j.counts.high||0} high-risk · ${j.counts.medium||0} medium-risk`;setv('apiVersion',j.settings.meta_api_version||'v23.0');setv('igHost',j.settings.instagram_host||'graph.instagram.com');setv('customTerms',j.settings.custom_flag_terms||'');verifyToken.textContent=j.settings.webhook_verify_token||'save settings once to generate';shortcutToken.textContent=j.settings.shortcut_upload_token||'';setc('gdriveEnabled',j.settings.gdrive_enabled);setv('gdriveClientId',j.settings.gdrive_client_id);setv('gdriveFolderId',j.settings.gdrive_folder_id);setc('dropboxEnabled',j.settings.dropbox_enabled);setv('dropboxAppKey',j.settings.dropbox_app_key);setv('dropboxFolder',j.settings.dropbox_folder);renderWatches(j.watches||[]);renderImports(j.imports||[]);}catch(e){status.innerHTML='<span class="error">'+esc(e.message)+'</span>';}}
function renderWatches(rows){watches.innerHTML=rows.length?rows.map(w=>`<div class="row" style="padding:8px 0;border-top:1px solid #333"><span class="badge">${esc(w.platform)}</span><strong>${esc(w.label||w.external_id)}</strong><code>${esc(w.external_id)}</code><span class="muted">${esc(w.last_sync_at||'never synced')}</span><button onclick="syncWatch(${Number(w.id)})">Sync now</button></div>`).join(''):'<span class="muted">No watched posts yet.</span>';}
function renderImports(rows){imports.innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.created_at)}</td><td>${esc(r.platform)}</td><td>${esc(r.filename)}</td><td>${Number(r.comments_imported)||0}</td><td>${Number(r.high_risk)||0}</td><td>${Number(r.medium_risk)||0}</td><td>${esc(r.target||'all')}</td></tr>`).join(''):'<tr><td colspan="7" class="muted">No exports imported yet.</td></tr>';}

async function uploadExport(){const file=importFile.files[0];if(!file){importMsg.textContent='Choose a ZIP or JSON first.';return;}const fd=new FormData();fd.append('archive',file,file.name);fd.append('platform',importPlatform.value);fd.append('target',importTarget.value);fd.append('label',importLabel.value);try{importMsg.textContent='Uploading and analyzing…';const r=await fetch('import.php',{method:'POST',headers:{'X-CSRF-Token':csrf},body:fd});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Import failed');importMsg.textContent=`Imported ${j.import.comments_imported} comments; ${j.import.high_risk} high-risk.`;importFile.value='';await Promise.all([loadStatus(),loadComments(),loadUsers()]);}catch(e){importMsg.textContent=e.message;}}
async function rotateShortcutToken(){try{const j=await api('rotate_shortcut_token',{method:'POST',body:'{}'});shortcutToken.textContent=j.token;shortcutMsg.textContent='Token rotated. Update the Shortcut header.';}catch(e){shortcutMsg.textContent=e.message;}}

async function saveCloudSettings(){try{cloudMsg.textContent='Saving…';await api('settings',{method:'POST',body:JSON.stringify({gdrive_enabled:gdriveEnabled.checked,gdrive_client_id:gdriveClientId.value,gdrive_client_secret:gdriveClientSecret.value,gdrive_refresh_token:gdriveRefreshToken.value,gdrive_folder_id:gdriveFolderId.value,dropbox_enabled:dropboxEnabled.checked,dropbox_app_key:dropboxAppKey.value,dropbox_app_secret:dropboxAppSecret.value,dropbox_refresh_token:dropboxRefreshToken.value,dropbox_folder:dropboxFolder.value})});gdriveClientSecret.value='';gdriveRefreshToken.value='';dropboxAppSecret.value='';dropboxRefreshToken.value='';cloudMsg.textContent='Saved';await loadStatus();}catch(e){cloudMsg.textContent=e.message;}}
async function cloudSyncNow(){try{cloudMsg.textContent='Checking cloud folders…';const j=await api('cloud_sync',{method:'POST',body:'{}'});if(!j.results.length)cloudMsg.textContent='No new files found (or no cloud source enabled).';else cloudMsg.textContent=j.results.map(x=>x.ok?`${x.provider}: ${x.file||'sync'} (${x.comments||0} comments)`: `${x.provider}: ${x.error}`).join(' · ');await Promise.all([loadStatus(),loadComments(),loadUsers()]);}catch(e){cloudMsg.textContent=e.message;}}

async function saveMetaSettings(){try{settingsMsg.textContent='Saving…';await api('settings',{method:'POST',body:JSON.stringify({meta_api_version:apiVersion.value,instagram_host:igHost.value,instagram_token:igToken.value,facebook_token:fbToken.value,meta_app_secret:appSecret.value,custom_flag_terms:customTerms.value})});settingsMsg.textContent='Saved';igToken.value='';fbToken.value='';appSecret.value='';await loadStatus();}catch(e){settingsMsg.textContent=e.message;}}
async function addWatch(){try{watchMsg.textContent='Saving…';await api('watch',{method:'POST',body:JSON.stringify({platform:watchPlatform.value,external_id:watchId.value,label:watchLabel.value,url:watchUrl.value})});watchMsg.textContent='Added';watchId.value='';await loadStatus();}catch(e){watchMsg.textContent=e.message;}}
async function syncWatch(id){try{status.textContent='Syncing Meta comments…';const j=await api('sync',{method:'POST',body:JSON.stringify({id})});status.textContent=`Sync complete: ${j.imported} records received`;await loadStatus();await Promise.all([loadComments(),loadUsers()]);}catch(e){status.innerHTML='<span class="error">'+esc(e.message)+'</span>';}}
async function loadUsers(){try{const j=await api('users');users.innerHTML=(j.users||[]).filter(u=>Number(u.high_count)>0||Number(u.medium_count)>0).map(u=>`<tr><td><strong>${esc(u.username||'(unknown)')}</strong><br><small>${esc(u.user_id)}</small></td><td>${esc(u.platform)}</td><td>${Number(u.comment_count)||0}</td><td>${Number(u.high_count)||0}</td><td>${Number(u.medium_count)||0}</td><td>${esc(u.latest)}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">No flagged users yet.</td></tr>';}catch(e){users.innerHTML='<tr><td colspan="6" class="error">'+esc(e.message)+'</td></tr>';}}
async function loadComments(){try{const qs=new URLSearchParams({action:'comments'});if(risk.value)qs.set('risk',risk.value);if(search.value)qs.set('q',search.value);const r=await fetch('api.php?'+qs.toString());const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Load failed');comments.innerHTML=(j.comments||[]).map(c=>`<tr><td class="risk-${esc(c.risk_level)}">${esc(c.risk_level)}</td><td><strong>${esc(c.username||'(unknown)')}</strong><br><small>${esc(c.user_id)}</small></td><td>${esc(c.created_time||c.collected_at)}</td><td>${esc(c.text)}</td><td>${(c.flags||[]).map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</td><td>${esc(c.source_type||'api')}<br><small>${esc(c.source_file||c.platform)}</small></td></tr>`).join('')||'<tr><td colspan="6" class="muted">No matching comments.</td></tr>';}catch(e){comments.innerHTML='<tr><td colspan="6" class="error">'+esc(e.message)+'</td></tr>';}}
loadStatus().then(()=>Promise.all([loadComments(),loadUsers()]));
</script>
<?php endif; ?>
</main></body></html>
