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
?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Social Comment Miner</title>
<style>
:root{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:dark;background:#111;color:#eee}body{margin:0;background:#111}main{max-width:1180px;margin:auto;padding:20px}.card{background:#1c1c1c;border:1px solid #333;border-radius:14px;padding:16px;margin:0 0 16px}h1,h2{margin-top:0}input,select,textarea,button{font:inherit;background:#0f0f0f;color:#eee;border:1px solid #444;border-radius:8px;padding:9px}input,select,textarea{width:100%;box-sizing:border-box}button{cursor:pointer;background:#2a2a2a}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.muted{color:#aaa}.error{color:#ff9d9d}.good{color:#9dffb4}.badge{padding:3px 8px;border-radius:999px;background:#333;font-size:.8rem}.risk-high{font-weight:700}.tablewrap{overflow:auto;max-height:58vh}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid #333}th{position:sticky;top:0;background:#1c1c1c}code{word-break:break-all}.login{max-width:420px;margin:12vh auto}a{color:inherit}</style></head><body><main>
<?php if(!$authed): ?>
<div class="card login"><h1>Social Comment Miner</h1><p class="muted">Private admin login.</p><?php if($error):?><p class="error"><?=htmlspecialchars($error)?></p><?php endif;?><form method="post"><label>Admin key<input type="password" name="admin_key" autocomplete="current-password" required></label><p><button type="submit">Sign in</button></p></form></div>
<?php else: ?>
<div class="row" style="justify-content:space-between"><div><h1 style="margin-bottom:4px">Social Comment Miner</h1><div class="muted">Facebook + Instagram comment evidence collector</div></div><form method="post"><button name="logout" value="1">Log out</button></form></div>

<div class="card"><h2>Status</h2><div id="status">Loading…</div></div>

<div class="card"><h2>Meta API settings</h2><div class="grid"><label>API version<input id="apiVersion" value="v23.0"></label><label>Instagram host<select id="igHost"><option>graph.instagram.com</option><option>graph.facebook.com</option></select></label><label>Instagram access token<input id="igToken" type="password" placeholder="Leave blank to keep existing token"></label><label>Facebook Page access token<input id="fbToken" type="password" placeholder="Leave blank to keep existing token"></label></div><p><label>Custom flag terms<textarea id="customTerms" rows="3" placeholder="One per line or comma-separated"></textarea></label></p><div class="row"><button onclick="saveSettings()">Save settings</button><span id="settingsMsg" class="muted"></span></div><p class="muted">Webhook URL: <code><?=htmlspecialchars((isset($_SERVER['HTTPS'])?'https':'http').'://'.($_SERVER['HTTP_HOST']??'').rtrim(dirname($_SERVER['SCRIPT_NAME']??'/'),'/').'/webhook.php')?></code><br>Verification token: <code id="verifyToken">save settings once to generate</code></p></div>

<div class="card"><h2>Add watched post</h2><div class="grid"><label>Platform<select id="watchPlatform"><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></label><label>Meta media/post ID<input id="watchId" placeholder="Numeric ID or PageID_PostID"></label><label>Label<input id="watchLabel" placeholder="e.g. July 2026 reel"></label><label>Public URL<input id="watchUrl" placeholder="https://..."></label></div><p><button onclick="addWatch()">Add / update</button> <span id="watchMsg" class="muted"></span></p><div id="watches"></div></div>

<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Comments</h2><div class="row"><select id="risk" onchange="loadComments()"><option value="">All risk levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">None</option></select><input id="search" placeholder="Search text or username" style="width:220px"><button onclick="loadComments()">Search</button><a href="api.php?action=export">Export CSV</a></div></div><div class="tablewrap"><table><thead><tr><th>Risk</th><th>User</th><th>Time</th><th>Comment</th><th>Flags</th><th>Platform</th></tr></thead><tbody id="comments"></tbody></table></div></div>
<script>
let csrf='';
async function api(action, opts={}){const headers={'Accept':'application/json'}; if(opts.body){headers['Content-Type']='application/json';headers['X-CSRF-Token']=csrf;} const r=await fetch('api.php?action='+encodeURIComponent(action),{...opts,headers:{...headers,...(opts.headers||{})}}); const j=await r.json(); if(!r.ok||!j.ok) throw new Error(j.error||('HTTP '+r.status)); return j;}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadStatus(){try{const j=await api('status');csrf=j.csrf;document.getElementById('status').innerHTML=`<span class="good">Online</span> · ${j.counts.total||0} comments · ${j.counts.high||0} high-risk · ${j.counts.medium||0} medium-risk`; document.getElementById('apiVersion').value=j.settings.meta_api_version||'v23.0';document.getElementById('igHost').value=j.settings.instagram_host||'graph.instagram.com';document.getElementById('customTerms').value=j.settings.custom_flag_terms||'';document.getElementById('verifyToken').textContent=j.settings.webhook_verify_token||'save settings once to generate'; renderWatches(j.watches||[]);}catch(e){document.getElementById('status').innerHTML='<span class="error">'+esc(e.message)+'</span>';}}
function renderWatches(rows){document.getElementById('watches').innerHTML=rows.length?rows.map(w=>`<div class="row" style="padding:8px 0;border-top:1px solid #333"><span class="badge">${esc(w.platform)}</span><strong>${esc(w.label||w.external_id)}</strong><code>${esc(w.external_id)}</code><span class="muted">${esc(w.last_sync_at||'never synced')}</span><button onclick="syncWatch(${Number(w.id)})">Sync now</button></div>`).join(''):'<span class="muted">No watched posts yet.</span>';}
async function saveSettings(){const el=document.getElementById('settingsMsg');try{el.textContent='Saving…';await api('settings',{method:'POST',body:JSON.stringify({meta_api_version:apiVersion.value,instagram_host:igHost.value,instagram_token:igToken.value,facebook_token:fbToken.value,custom_flag_terms:customTerms.value})});el.textContent='Saved';igToken.value='';fbToken.value='';await loadStatus();}catch(e){el.textContent=e.message;}}
async function addWatch(){const el=document.getElementById('watchMsg');try{el.textContent='Saving…';await api('watch',{method:'POST',body:JSON.stringify({platform:watchPlatform.value,external_id:watchId.value,label:watchLabel.value,url:watchUrl.value})});el.textContent='Added';watchId.value='';await loadStatus();}catch(e){el.textContent=e.message;}}
async function syncWatch(id){try{document.getElementById('status').textContent='Syncing Meta comments…';const j=await api('sync',{method:'POST',body:JSON.stringify({id})});document.getElementById('status').textContent=`Sync complete: ${j.imported} records received`;await loadStatus();await loadComments();}catch(e){document.getElementById('status').innerHTML='<span class="error">'+esc(e.message)+'</span>';}}
async function loadComments(){try{const qs=new URLSearchParams({action:'comments'});if(risk.value)qs.set('risk',risk.value);if(search.value)qs.set('q',search.value);const r=await fetch('api.php?'+qs.toString());const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Load failed');comments.innerHTML=(j.comments||[]).map(c=>`<tr><td class="risk-${esc(c.risk_level)}">${esc(c.risk_level)}</td><td><strong>${esc(c.username||'(unknown)')}</strong><br><small>${esc(c.user_id)}</small></td><td>${esc(c.created_time||c.collected_at)}</td><td>${esc(c.text)}</td><td>${(c.flags||[]).map(x=>`<span class="badge">${esc(x)}</span>`).join(' ')}</td><td>${esc(c.platform)}</td></tr>`).join('');}catch(e){comments.innerHTML='<tr><td colspan="6" class="error">'+esc(e.message)+'</td></tr>';}}
loadStatus().then(loadComments);
</script>
<?php endif; ?>
</main></body></html>
