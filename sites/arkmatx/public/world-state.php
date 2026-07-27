<?php
// Shared, low-risk state bus for the connected ArkmatX realms.
// Stores only allow-listed symbolic flags/counters; no personal data.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$allowedOrigins = [
  'https://arkmatx.com',
  'https://www.arkmatx.com',
  'https://witchdix.com',
  'https://www.witchdix.com',
  'https://xanderzombie.com',
  'https://www.xanderzombie.com',
  'https://madmorrigan.com',
  'https://www.madmorrigan.com'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
  header('Access-Control-Allow-Origin: '.$origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-World-Key');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function respond($data, $status=200){ http_response_code($status); echo json_encode($data, JSON_UNESCAPED_SLASHES); exit; }
function state_path(){
  $dir = __DIR__.'/state';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  $deny = $dir.'/.htaccess';
  if (!file_exists($deny)) @file_put_contents($deny, "Require all denied\nDeny from all\n");
  return $dir.'/world.json';
}
function default_state(){ return [
  'version'=>1,
  'updated_at'=>gmdate('c'),
  'flags'=>[],
  'counters'=>[],
  'events'=>[]
]; }
function read_state(){
  $path=state_path(); if(!file_exists($path)) return default_state();
  $j=json_decode((string)@file_get_contents($path), true); return is_array($j)?$j:default_state();
}
function write_state($state){
  $path=state_path(); $tmp=$path.'.tmp'; $state['updated_at']=gmdate('c');
  $fh=fopen($tmp,'c'); if(!$fh) throw new Exception('state unavailable');
  flock($fh,LOCK_EX); ftruncate($fh,0); fwrite($fh,json_encode($state,JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT)); fflush($fh); flock($fh,LOCK_UN); fclose($fh); rename($tmp,$path);
}
$flagAllow = [
 'morri-chess','morri-wire','witch-moon','witch-public-entry','xander-woods','xander-knight','xander-episode',
 'ark-red','ark-radio','ark-paradox','ark-basement','ark-maintenance'
];
$counterAllow = ['morri_solves','witch_published','xander_episodes','ark_paradox_solves'];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
  $s=read_state();
  respond(['ok'=>true,'version'=>$s['version']??1,'updated_at'=>$s['updated_at']??null,'flags'=>$s['flags']??[],'counters'=>$s['counters']??[],'events'=>array_slice($s['events']??[], -20)]);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(['ok'=>false,'error'=>'method'],405);

$body=json_decode((string)file_get_contents('php://input'), true) ?: [];
$flag=(string)($body['flag']??''); $counter=(string)($body['counter']??''); $source=(string)($body['source']??'unknown');
if ($flag==='' && $counter==='') respond(['ok'=>false,'error'=>'missing state change'],422);
if ($flag!=='' && !in_array($flag,$flagAllow,true)) respond(['ok'=>false,'error'=>'flag not allowed'],422);
if ($counter!=='' && !in_array($counter,$counterAllow,true)) respond(['ok'=>false,'error'=>'counter not allowed'],422);
try {
  $s=read_state();
  if($flag!=='') $s['flags'][$flag]=true;
  if($counter!=='') $s['counters'][$counter]=(int)($s['counters'][$counter]??0)+1;
  $s['events'][]=['at'=>gmdate('c'),'source'=>preg_replace('/[^a-z0-9_-]/i','',substr($source,0,30)),'flag'=>$flag?:null,'counter'=>$counter?:null];
  $s['events']=array_slice($s['events'],-100);
  write_state($s);
  respond(['ok'=>true,'state'=>$s]);
} catch(Throwable $e){ respond(['ok'=>false,'error'=>'state bus unavailable'],503); }
