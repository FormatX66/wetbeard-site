<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/importer.php';
require __DIR__ . '/lib/bot.php';

session_start();
if (empty($_SESSION['miner_auth'])) { header('Location: ./'); exit; }

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function flags_for(array $row): array { return json_decode((string)($row['flags_json'] ?? '[]'), true) ?: []; }

$id = trim((string)($_GET['id'] ?? ''));
$import = import_find($id);
if (!$import) { http_response_code(404); echo 'Import review not found.'; exit; }
$comments = import_comments($id);
$bots = build_bot_reports($comments);
$flagged = array_values(array_filter($comments, fn($r)=>in_array((string)($r['risk_level']??''),['high','medium'],true)));
$automation = array_values(array_filter($bots, fn($r)=>(int)($r['bot_percentage']??0)>=50));

$download = (string)($_GET['download'] ?? '');
if ($download === 'comments') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="social-miner-import-'.$id.'-comments.csv"');
    header('Cache-Control: no-store');
    $out=fopen('php://output','wb');
    fputcsv($out,['platform','post_id','comment_id','username','user_id','text','created_time','risk_level','flags','permalink','source_file','source_path']);
    foreach($comments as $r) fputcsv($out,[$r['platform']??'',$r['external_media_id']??'',$r['external_comment_id']??'',$r['username']??'',$r['user_id']??'',$r['text']??'',$r['created_time']??'',$r['risk_level']??'none',implode('|',flags_for($r)),$r['permalink']??'',$r['source_file']??'',$r['source_path']??'']);
    fclose($out); exit;
}
if ($download === 'bots') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="social-miner-import-'.$id.'-bots.csv"');
    header('Cache-Control: no-store');
    $out=fopen('php://output','wb');
    fputcsv($out,['platform','username','user_id','bot_percentage','label','confidence','comment_count','high_risk_count','medium_risk_count','top_signals']);
    foreach($bots as $r) {
        $signals=implode(' | ',array_map(fn($s)=>($s['name']??'').' +'.($s['points']??0).' '.($s['value']??''),$r['signals']??[]));
        fputcsv($out,[$r['platform']??'',$r['username']??'',$r['user_id']??'',$r['bot_percentage']??0,$r['label']??'',$r['confidence']??'',$r['comment_count']??0,$r['high_risk_count']??0,$r['medium_risk_count']??0,$signals]);
    }
    fclose($out); exit;
}

$risk = trim((string)($_GET['risk'] ?? ''));
$q = strtolower(trim((string)($_GET['q'] ?? '')));
$page = max(1,(int)($_GET['page'] ?? 1));
$perPage = 100;
$filtered = array_values(array_filter($comments,function(array $r) use($risk,$q): bool {
    if (in_array($risk,['none','low','medium','high'],true) && (string)($r['risk_level']??'none') !== $risk) return false;
    if ($q !== '') {
        $hay = strtolower((string)($r['text']??'').' '.(string)($r['username']??'').' '.(string)($r['source_file']??''));
        if (!str_contains($hay,$q)) return false;
    }
    return true;
}));
$totalFiltered=count($filtered);
$totalPages=max(1,(int)ceil($totalFiltered/$perPage));
$page=min($page,$totalPages);
$paged=array_slice($filtered,($page-1)*$perPage,$perPage);
$accountCount=count($bots);
$label=(string)($import['label']??'');
$title=$label!==''?$label:(string)($import['filename']??'Processed Meta export');
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?=h($title)?> — Social Miner Review</title>
<style>
:root{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:dark;background:#111;color:#eee}body{margin:0;background:#111}main{max-width:1180px;margin:auto;padding:20px}.card{background:#1c1c1c;border:1px solid #333;border-radius:14px;padding:16px;margin:0 0 16px}.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.metric{background:#0e0e0e;border:1px solid #333;border-radius:10px;padding:12px}.metric strong{display:block;font-size:1.45rem}.muted{color:#aaa}.small{font-size:.86rem}.badge{display:inline-block;padding:3px 8px;border-radius:999px;background:#333;font-size:.8rem}.risk-high{font-weight:800}.bot{font-size:1.05rem;font-weight:800}.tablewrap{overflow:auto;max-height:62vh}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid #333}th{position:sticky;top:0;background:#1c1c1c}a,button{color:inherit}a.button,button{display:inline-block;background:#2a2a2a;border:1px solid #444;border-radius:8px;padding:8px 10px;text-decoration:none}input,select{font:inherit;background:#0f0f0f;color:#eee;border:1px solid #444;border-radius:8px;padding:8px}details{margin-top:6px}.nav{justify-content:space-between;margin-bottom:16px}@media(max-width:700px){main{padding:12px}table{font-size:.82rem}}
</style></head><body><main>
<div class="row nav"><a class="button" href="./">← Dashboard</a><div class="row"><a class="button" href="?id=<?=h(rawurlencode($id))?>&download=comments">Download comments CSV</a><a class="button" href="?id=<?=h(rawurlencode($id))?>&download=bots">Download bot report CSV</a></div></div>
<div class="card">
  <h1 style="margin-bottom:4px"><?=h($title)?></h1>
  <div class="muted"><?=h((string)($import['filename']??''))?> · <?=h((string)($import['platform']??''))?> · <?=h((string)($import['source']??'meta export'))?></div>
  <div class="small muted" style="margin-top:6px">Processed <?=h((string)($import['completed_at']??$import['created_at']??''))?><?php if(!empty($import['target'])): ?> · Target <?=h((string)$import['target'])?><?php endif; ?></div>
</div>
<div class="card"><div class="grid">
  <div class="metric"><span class="muted">Comments</span><strong><?=count($comments)?></strong></div>
  <div class="metric"><span class="muted">High risk</span><strong><?=count(array_filter($comments,fn($r)=>(string)($r['risk_level']??'')==='high'))?></strong></div>
  <div class="metric"><span class="muted">Medium risk</span><strong><?=count(array_filter($comments,fn($r)=>(string)($r['risk_level']??'')==='medium'))?></strong></div>
  <div class="metric"><span class="muted">Accounts analyzed</span><strong><?=$accountCount?></strong></div>
  <div class="metric"><span class="muted">Automation ≥50%</span><strong><?=count($automation)?></strong></div>
</div></div>

<div class="card">
  <h2>Bot / automation analysis</h2>
  <p class="muted small">Behavioral estimate only. It does not prove an account is automated.</p>
  <?php if(!$bots): ?><p class="muted">No account data in this import.</p><?php else: ?>
  <div class="tablewrap"><table><thead><tr><th>Bot %</th><th>Account</th><th>Confidence</th><th>Comments</th><th>Risk</th><th>Signals</th></tr></thead><tbody>
  <?php foreach(array_slice($bots,0,250) as $b): ?>
    <tr><td><span class="bot"><?=((int)($b['bot_percentage']??0))?>%</span><br><small><?=h((string)($b['label']??''))?></small></td>
    <td><strong><?=h((string)($b['username']??'(unknown)'))?></strong><br><small><?=h((string)($b['user_id']??''))?></small></td>
    <td><?=h((string)($b['confidence']??''))?></td><td><?=((int)($b['comment_count']??0))?></td>
    <td><?=((int)($b['high_risk_count']??0))?> high · <?=((int)($b['medium_risk_count']??0))?> med</td>
    <td><?php foreach(array_slice($b['signals']??[],0,4) as $s): ?><span class="badge"><?=h((string)($s['name']??''))?> +<?=((int)($s['points']??0))?></span> <?php endforeach; ?>
    <details><summary>Full account evidence</summary><div class="small" style="margin-top:6px"><?php foreach($b['signals']??[] as $s): ?><p><strong><?=h((string)($s['name']??''))?> +<?=((int)($s['points']??0))?></strong> — <?=h((string)($s['value']??''))?><br><span class="muted"><?=h((string)($s['explanation']??''))?></span></p><?php endforeach; ?></div></details></td></tr>
  <?php endforeach; ?></tbody></table></div><?php endif; ?>
</div>

<div class="card">
  <h2>Flagged comments</h2>
  <?php if(!$flagged): ?><p class="muted">No high- or medium-risk comments in this import.</p><?php else: ?>
  <div class="tablewrap" style="max-height:420px"><table><thead><tr><th>Risk</th><th>User</th><th>Time</th><th>Comment</th><th>Flags</th></tr></thead><tbody>
  <?php foreach(array_slice($flagged,0,250) as $r): ?><tr><td class="risk-<?=h((string)($r['risk_level']??''))?>"><?=h((string)($r['risk_level']??''))?></td><td><strong><?=h((string)($r['username']??'(unknown)'))?></strong></td><td><?=h((string)($r['created_time']??''))?></td><td><?=h((string)($r['text']??''))?></td><td><?php foreach(flags_for($r) as $f): ?><span class="badge"><?=h((string)$f)?></span> <?php endforeach; ?></td></tr><?php endforeach; ?>
  </tbody></table></div><?php endif; ?>
</div>

<div class="card">
  <div class="row" style="justify-content:space-between"><h2 style="margin:0">All comments</h2><span class="muted"><?=$totalFiltered?> matching</span></div>
  <form method="get" class="row" style="margin:12px 0"><input type="hidden" name="id" value="<?=h($id)?>"><select name="risk"><option value="">All risk levels</option><?php foreach(['high','medium','low','none'] as $opt): ?><option value="<?=$opt?>" <?=$risk===$opt?'selected':''?>><?=ucfirst($opt)?></option><?php endforeach; ?></select><input name="q" value="<?=h((string)($_GET['q']??''))?>" placeholder="Search user or comment" style="min-width:230px"><button type="submit">Filter</button></form>
  <?php if(!$comments): ?><p class="muted">This is a legacy import or no comment records were associated with this processed file. New imports automatically create review membership.</p><?php else: ?>
  <div class="tablewrap"><table><thead><tr><th>Risk</th><th>User</th><th>Time</th><th>Comment</th><th>Source</th></tr></thead><tbody>
  <?php foreach($paged as $r): ?><tr><td><?=h((string)($r['risk_level']??'none'))?></td><td><strong><?=h((string)($r['username']??'(unknown)'))?></strong><br><small><?=h((string)($r['user_id']??''))?></small></td><td><?=h((string)($r['created_time']??''))?></td><td><?=h((string)($r['text']??''))?></td><td><small><?=h((string)($r['source_file']??''))?></small></td></tr><?php endforeach; ?>
  </tbody></table></div>
  <div class="row" style="justify-content:space-between;margin-top:12px"><span class="muted">Page <?=$page?> of <?=$totalPages?></span><div class="row"><?php if($page>1): ?><a class="button" href="?id=<?=h(rawurlencode($id))?>&risk=<?=h(rawurlencode($risk))?>&q=<?=h(rawurlencode((string)($_GET['q']??'')))?>&page=<?=$page-1?>">Previous</a><?php endif; ?><?php if($page<$totalPages): ?><a class="button" href="?id=<?=h(rawurlencode($id))?>&risk=<?=h(rawurlencode($risk))?>&q=<?=h(rawurlencode((string)($_GET['q']??'')))?>&page=<?=$page+1?>">Next</a><?php endif; ?></div></div>
  <?php endif; ?>
</div>
</main></body></html>
