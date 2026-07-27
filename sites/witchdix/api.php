<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out($data,$status=200){http_response_code($status);echo json_encode($data,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);exit;}
function body(){return json_decode(file_get_contents('php://input'),true) ?: [];}
function authed(){return !empty($_SESSION['witchdix_auth']);}
function require_auth(){if(!authed())out(['ok'=>false,'error'=>'The private book is locked.'],401);}
function store_path(){
  $dir=__DIR__.'/data'; if(!is_dir($dir))@mkdir($dir,0700,true);
  $deny=$dir.'/.htaccess'; if(!file_exists($deny))@file_put_contents($deny,"Require all denied\nDeny from all\n");
  return $dir.'/grimoire.jsonl';
}
function all_entries(){
  $path=store_path(); if(!file_exists($path))return [];$rows=[];
  $fh=fopen($path,'r');if(!$fh)return [];
  while(($line=fgets($fh))!==false){$j=json_decode(trim($line),true);if(is_array($j))$rows[]=$j;}fclose($fh);
  usort($rows,fn($a,$b)=>strcmp($b['created_at']??'',$a['created_at']??''));return $rows;
}
function append_entry($e){$path=store_path();$fh=fopen($path,'a');if(!$fh)throw new Exception('Could not open grimoire storage.');flock($fh,LOCK_EX);fwrite($fh,json_encode($e,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)."\n");fflush($fh);flock($fh,LOCK_UN);fclose($fh);}
function ai_catalog($raw,$title,$hint){
  $key=getenv('OPENAI_API_KEY'); if(!$key)return null;
  $model=getenv('WITCHDIX_AI_MODEL') ?: 'gpt-5.6-luna';
  $schema=['type'=>'object','properties'=>[
    'title'=>['type'=>'string'],'category'=>['type'=>'string','enum'=>['herbs-plants','spells-rituals','moon-seasons','dreams-divination','recipes-remedies','stones-tools-curiosities','field-notes','stories-lore','other']],
    'summary'=>['type'=>'string'],'tags'=>['type'=>'array','items'=>['type'=>'string'],'maxItems'=>12],
    'cross_references'=>['type'=>'array','items'=>['type'=>'string'],'maxItems'=>8],
    'search_terms'=>['type'=>'array','items'=>['type'=>'string'],'maxItems'=>20],
    'safety_note'=>['type'=>'string']
  ],'required'=>['title','category','summary','tags','cross_references','search_terms','safety_note'],'additionalProperties'=>false];
  $payload=['model'=>$model,'instructions'=>'You are the cataloging spirit for Heather\'s private witchcraft field grimoire. Preserve her meaning. Do not invent factual claims. Categorize the note for retrieval, create concise tags and useful search synonyms. If the note discusses ingestion, medicine, poisonous plants, fire, or other practical hazards, put a brief factual caution in safety_note; otherwise use an empty string. Output only the requested schema.','input'=>"Optional title: {$title}\nOptional author hint: {$hint}\nRaw note:\n{$raw}",'text'=>['format'=>['type'=>'json_schema','name'=>'grimoire_catalog','strict'=>true,'schema'=>$schema]]];
  $ch=curl_init('https://api.openai.com/v1/responses');curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$key,'Content-Type: application/json'],CURLOPT_POSTFIELDS=>json_encode($payload),CURLOPT_TIMEOUT=>45]);
  $resp=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);if($resp===false||$code<200||$code>=300)return null;
  $j=json_decode($resp,true);$text='';foreach(($j['output']??[]) as $o){foreach(($o['content']??[]) as $c){if(($c['type']??'')==='output_text')$text.=$c['text']??'';}}
  $data=json_decode($text,true);return is_array($data)?$data:null;
}
function fallback_catalog($raw,$title,$hint){
  $hay=strtolower($hint.' '.$title.' '.$raw);$cat='field-notes';$rules=['herbs-plants'=>['herb','plant','mushroom','flower','root','leaf','garden'],'spells-rituals'=>['spell','ritual','ward','altar','candle','intention'],'moon-seasons'=>['moon','solstice','equinox','season'],'dreams-divination'=>['dream','tarot','divination','omen'],'recipes-remedies'=>['recipe','tea','tincture','salve','remedy'],'stones-tools-curiosities'=>['stone','crystal','tool','charm','talisman']];foreach($rules as $k=>$words){foreach($words as $w){if(strpos($hay,$w)!==false){$cat=$k;break 2;}}}
  $clean=preg_replace('/\s+/',' ',trim($raw));$words=preg_split('/[^a-z0-9\-]+/i',strtolower($title.' '.$hint.' '.$raw));$stop=['the','and','for','with','that','this','from','have','into','about','then','when','where','what','your','her','she'];$freq=[];foreach($words as $w){if(strlen($w)>3&&!in_array($w,$stop,true))$freq[$w]=($freq[$w]??0)+1;}arsort($freq);$tags=array_slice(array_keys($freq),0,8);
  return ['title'=>$title?:mb_substr($clean,0,60),'category'=>$cat,'summary'=>mb_substr($clean,0,260),'tags'=>$tags,'cross_references'=>[],'search_terms'=>$tags,'safety_note'=>''];
}
function search_entries($items,$q,$publicOnly=false){
  if($publicOnly)$items=array_values(array_filter($items,fn($e)=>!empty($e['published'])));
  $q=mb_strtolower(trim((string)$q));if($q==='')return $items;$terms=preg_split('/\s+/', $q);
  return array_values(array_filter($items,function($e)use($terms){$hay=mb_strtolower(implode(' ',[$e['title']??'',$e['category']??'',$e['summary']??'',implode(' ',$e['tags']??[]),implode(' ',$e['search_terms']??[]),implode(' ',$e['cross_references']??[]),$e['raw']??'']));foreach($terms as $t){if($t!==''&&mb_strpos($hay,$t)===false)return false;}return true;}));
}
function public_view($e){return ['id'=>$e['id']??'','created_at'=>$e['created_at']??'','title'=>$e['title']??'Untitled page','category'=>$e['category']??'other','summary'=>$e['summary']??'','tags'=>$e['tags']??[],'cross_references'=>$e['cross_references']??[],'safety_note'=>$e['safety_note']??''];}
$d=body();$action=$d['action']??'';
if($action==='login'){$configured=getenv('WITCHDIX_ADMIN_PASSWORD');if(!$configured)out(['ok'=>false,'error'=>'Admin password is not configured on the server.'],503);$given=(string)($d['password']??'');if(!hash_equals($configured,$given))out(['ok'=>false,'error'=>'That does not open the book.'],403);$_SESSION['witchdix_auth']=true;session_regenerate_id(true);out(['ok'=>true]);}
if($action==='logout'){$_SESSION=[];session_destroy();out(['ok'=>true]);}
if($action==='session')out(['ok'=>true,'authenticated'=>authed()]);
if($action==='public_search'){$items=search_entries(all_entries(),$d['q']??'',true);out(['ok'=>true,'items'=>array_map('public_view',array_slice($items,0,100))]);}
if($action==='public_recent'){$items=search_entries(all_entries(),'',true);out(['ok'=>true,'items'=>array_map('public_view',array_slice($items,0,30))]);}
require_auth();
if($action==='add'){
  $raw=trim((string)($d['raw']??''));$title=trim((string)($d['title']??''));$hint=trim((string)($d['hint']??''));$published=!empty($d['published']);if($raw==='')out(['ok'=>false,'error'=>'The page is blank.'],422);if(strlen($raw)>20000)out(['ok'=>false,'error'=>'That page is too long; split it into smaller entries.'],422);
  $ai=ai_catalog($raw,$title,$hint);$cat=$ai ?: fallback_catalog($raw,$title,$hint);$entry=['id'=>bin2hex(random_bytes(8)),'created_at'=>gmdate('c'),'raw'=>$raw,'author_title'=>$title,'author_hint'=>$hint,'title'=>$cat['title']?:($title?:'Untitled page'),'category'=>$cat['category'],'summary'=>$cat['summary'],'tags'=>array_values(array_unique($cat['tags']??[])),'cross_references'=>$cat['cross_references']??[],'search_terms'=>$cat['search_terms']??[],'safety_note'=>$cat['safety_note']??'','ai_catalogued'=>(bool)$ai,'published'=>$published];
  append_entry($entry);out(['ok'=>true,'entry'=>$entry]);
}
if($action==='list'){out(['ok'=>true,'items'=>array_slice(all_entries(),0,50)]);}
if($action==='search'){out(['ok'=>true,'items'=>array_slice(search_entries(all_entries(),$d['q']??'',false),0,100)]);}
out(['ok'=>false,'error'=>'Unknown action.'],400);