import './style.css';

const base=import.meta.env.BASE_URL || '/';
const asset=path=>`${base}${String(path).replace(/^\/+/, '')}`;
const worlds={morri:{label:'MORRI',url:'https://madmorrigan.com/morri/'},witch:{label:'WITCHDIX',url:'https://madmorrigan.com/witchdix/'},xander:{label:'XANDER ZOMBIE',url:'https://xanderzombie.com/'}};
const repoUrl='https://github.com/FormatX66/wetbeard-site';
const memoryUrl=`${repoUrl}/tree/main/gpt-workflow-memory`;
const stagingUrl='https://arkmatx.com/staging/';
const key='realm-passport';
const incoming=(new URLSearchParams(location.search).get('rp')||'').split(',').filter(Boolean);
const passport=new Set([...(localStorage.getItem(key)||'').split(',').filter(Boolean),...incoming]);
const save=()=>localStorage.setItem(key,[...passport].join(','));
const jump=url=>{const u=new URL(url);u.searchParams.set('rp',[...passport].join(','));location.href=u.toString()};
const openExternal=url=>location.href=url;
const stateUrl=asset('world-state.php');
let worldState=null,activity=null,githubStatus=null,sceneName='workshop',workshopRender=null;
const logic={a:false,b:false,c:false};
const radio=[];
const has=f=>passport.has(f)||Boolean(worldState?.flags?.[f]);
async function loadWorld(){try{const r=await fetch(stateUrl,{cache:'no-store'});if(r.ok){worldState=await r.json();for(const [f,on] of Object.entries(worldState.flags||{}))if(on)passport.add(f);save()}}catch{}}
async function pushWorld(flag){passport.add(flag);save();try{const r=await fetch(stateUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({flag,source:'arkmatx'})});if(r.ok){const j=await r.json();worldState=j.state||worldState}}catch{}}
async function loadWorkshopRender(){
  const parts=await Promise.all([0,1,2].map(i=>fetch(asset(`scenes/workshop-render.part${i}.txt`),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`render chunk ${i}: ${r.status}`);return r.text()})));
  workshopRender=`data:image/jpeg;base64,${parts.join('')}`;
  return workshopRender;
}

const scenes={
 workshop:{bg:null,hot:[
  ['terminal','BRAIN CONNECT CRT','165,315 610,315 610,520 165,520','project-terminal'],
  ['bench','HARDWARE BENCH','0,415 625,415 625,735 0,735','project-bench'],
  ['bike','WET BEARD BIKE','650,350 1285,350 1285,685 650,685','project-bike'],
  ['rack','ÜBERCORP RACK','1010,20 1215,20 1215,390 1010,390','project-rack'],
  ['map','WORLD MAP','625,70 1025,70 1025,370 625,370','map'],
  ['radio','RADIO','1215,545 1595,545 1595,895 1215,895','radio'],
  ['red','DO NOT PUSH','575,635 790,635 790,845 575,845','red'],
  ['servers','SERVER CLOSET','1370,145 1595,145 1595,535 1370,535','scene-servers'],
  ['paradox','PARADOX TERMINAL','1230,85 1435,85 1435,315 1230,315','scene-paradox']
 ]},
 servers:{bg:asset('scenes/servers.svg'),hot:[
  ['morri','MOSS NODE','140,145 440,145 445,700 140,700','server-morri'],
  ['witch','PAPER NODE','485,145 785,145 790,700 485,700','server-witch'],
  ['xander','INK NODE','830,145 1130,145 1135,700 830,700','server-xander'],
  ['ark','LOOPBACK','1175,145 1460,145 1460,700 1175,700','server-ark'],
  ['back','WORKSHOP','20,745 270,745 270,890 20,890','scene-workshop'],
  ['next','PARADOX','1330,745 1580,745 1580,890 1330,890','scene-paradox']
 ]},
 paradox:{bg:asset('scenes/paradox.svg'),hot:[
  ['a','TERMINAL A','120,160 545,160 545,625 120,625','logic-a'],
  ['b','TERMINAL B','585,160 1015,160 1015,625 585,625','logic-b'],
  ['c','TERMINAL C','1055,160 1485,160 1485,625 1055,625','logic-c'],
  ['door','MAINTENANCE CHANNEL','570,650 1030,650 1030,785 570,785','logic-door'],
  ['back','WORKSHOP','20,745 270,745 270,890 20,890','scene-workshop'],
  ['servers','SERVER CLOSET','1330,745 1580,745 1580,890 1330,890','scene-servers']
 ]}
};

const app=document.querySelector('#app');
app.innerHTML=`<main class="experience"><div id="viewport" class="viewport"><img id="sceneBg" class="scene-bg" alt=""><div class="ambient ambient-a"></div><div class="ambient ambient-b"></div><svg id="hotspots" class="hotspots" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"></svg><div class="scanlines"></div></div><header><b>ARKMATX</b><span id="location">WORKSHOP</span></header><aside id="readout">Booting actual systems…</aside><button id="hint" aria-label="show clickable areas">?</button><div id="modal" class="modal"><div><button id="close">×</button><small id="tag"></small><h1 id="title"></h1><pre id="copy"></pre><div id="actions"></div></div></div><div id="transition" class="transition"></div></main>`;
const bg=document.querySelector('#sceneBg'),svg=document.querySelector('#hotspots'),readout=document.querySelector('#readout'),modal=document.querySelector('#modal'),title=document.querySelector('#title'),copy=document.querySelector('#copy'),tag=document.querySelector('#tag'),actions=document.querySelector('#actions'),transition=document.querySelector('#transition');
const show=(t,c,k='WORKSHOP OBJECT',buttons='')=>{title.textContent=t;copy.textContent=c;tag.textContent=k;actions.innerHTML=buttons;modal.classList.add('show')};
document.querySelector('#close').onclick=()=>modal.classList.remove('show');

function bindProjectLinks(){
 const source=document.querySelector('#sourceBtn'); if(source)source.onclick=()=>openExternal(`${repoUrl}/tree/main/sites/arkmatx`);
 const memory=document.querySelector('#memoryBtn'); if(memory)memory.onclick=()=>openExternal(memoryUrl);
 const review=document.querySelector('#reviewBtn'); if(review)review.onclick=()=>openExternal(stagingUrl);
}

actionLoad();
async function actionLoad(){
 await Promise.allSettled([loadWorld(),loadWorkshopRender(),fetch(asset('activity.json'),{cache:'no-store'}).then(r=>r.json()).then(j=>activity=j),fetch(asset('github-status.json'),{cache:'no-store'}).then(r=>r.json()).then(j=>githubStatus=j)]);
 readout.textContent=worldState?'WORLD BUS ONLINE // persistent state acquired':'WORLD BUS DEGRADED // local passport';
 renderScene('workshop');
}

function renderScene(name){sceneName=name;const s=scenes[name];transition.classList.add('flash');setTimeout(()=>transition.classList.remove('flash'),380);bg.src=name==='workshop'?(workshopRender||asset('scenes/workshop.svg')):s.bg;bg.alt=`ArkmatX ${name}`;document.querySelector('#location').textContent=name.toUpperCase();svg.innerHTML=s.hot.map(h=>`<polygon tabindex="0" aria-label="${h[1]}" data-target="${h[3]}" points="${h[2]}"/>`).join('');svg.querySelectorAll('polygon').forEach(p=>{p.onclick=()=>act(p.dataset.target);p.onkeydown=e=>{if(e.key==='Enter')p.click()}})}
function travel(url,label){transition.textContent=label;transition.classList.add('traveling');setTimeout(()=>jump(url),800)}
function worklog(){const p=(activity?.projects||[]).map(x=>`${x.name.padEnd(14,'.')} ${x.status}\n${x.detail}`).join('\n\n');return `${activity?.headline||'ARKMATX WEEKLY LOG'}\n\n${activity?.summary||''}\n\n${p||'No feed loaded.'}`}
function gitlog(){return `${githubStatus?.repository||'GITHUB'} // ${githubStatus?.status||'OFFLINE'}\nUPDATED: ${githubStatus?.updated_at||'unknown'}\n\n${(githubStatus?.recent_commits||[]).slice(0,7).map(x=>`${x.sha} ${x.message}`).join('\n')}`}
function diagnostics(){return `MORRI ......... ${has('morri-chess')?'ROOK HANDSHAKE':'UNRESOLVED'}\nWITCHDIX ...... ${has('witch-moon')?'MOON SIGIL':'LISTENING'}\nXANDER ........ ${has('xander-woods')?'INK PATH OPEN':'CANON STABLE'}\nARK RADIO ..... ${has('ark-radio')?'LOCKED':'UNTUNED'}\nWORLD BUS ..... ${worldState?'PERSISTENT':'LOCAL FALLBACK'}`}
function act(target){
 if(target.startsWith('scene-'))return renderScene(target.slice(6));
 if(target==='project-terminal'){
  show('BRAIN CONNECT',`AI orchestration / machines / experiments\n\n${diagnostics()}\n\n${worklog()}`,'REAL PROJECT TERMINAL',`<button id="gitBtn">GIT TELEMETRY</button><button id="sourceBtn">ARKMATX SOURCE</button><button id="memoryBtn">WORKFLOW MEMORY</button>`);
  queueMicrotask(()=>{document.querySelector('#gitBtn').onclick=()=>show('GIT TELEMETRY',gitlog(),'SOURCE OF TRUTH',`<button id="sourceBtn">ARKMATX SOURCE</button><button id="memoryBtn">WORKFLOW MEMORY</button>`);bindProjectLinks()});
  return;
 }
 if(target==='project-bench'){
  show('WORKBENCH','Raspberry Pi · hardware · network experiments\n\nPhysical systems, remote-control experiments, security appliance ideas, and anything that required a cable before it required a website.','HARDWARE PROJECTS',`<button id="sourceBtn">ARKMATX SOURCE</button><button id="memoryBtn">WORKFLOW MEMORY</button>`);
  queueMicrotask(bindProjectLinks); return;
 }
 if(target==='project-bike')return show('WET BEARD','Quest engine escaped into the real world. Rider game logic, quests, admin tools, deployments, and an actual bicycle.','PROJECT LINK',`<button id="wetBtn">OPEN WET BEARD</button>`),queueMicrotask(()=>document.querySelector('#wetBtn').onclick=()=>jump('https://wetbeard.madmorrigan.com/'));
 if(target==='project-rack'){
  show('ÜBERCORP','Space Pirates infrastructure and corporate interference. The rack claims all services are mission critical. The rack is a liar.\n\nThe useful part of this rack is the real engineering memory behind the worlds.','INFRASTRUCTURE',`<button id="memoryBtn">WORKFLOW MEMORY</button><button id="sourceBtn">ARKMATX SOURCE</button><button id="reviewBtn">STAGING REVIEW</button>`);
  queueMicrotask(bindProjectLinks); return;
 }
 if(target==='map'){show('WORLD MAP','Three unstable destinations are pinned to the wall.','TRANSPORT BUS',`<button data-world="morri">MORRI</button><button data-world="witch">WITCHDIX</button><button data-world="xander">XANDER</button>`);queueMicrotask(()=>document.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>travel(worlds[b.dataset.world].url,`ROUTING TO ${worlds[b.dataset.world].label}…`)));return}
 if(target==='radio'){show('WORLD BUS RADIO','Tune three frequencies in sequence.','ANALOG INTERFACE',`<button data-f="1">1 / MOSS</button><button data-f="2">2 / PAPER</button><button data-f="3">3 / INK</button>`);queueMicrotask(()=>document.querySelectorAll('[data-f]').forEach(b=>b.onclick=async()=>{radio.push(+b.dataset.f);if(radio.length>3)radio.shift();readout.textContent=`RADIO SEQUENCE: ${radio.join(' → ')}`;if(radio.join('')==='123'){await pushWorld('ark-radio');readout.textContent='WORLD BUS LOCKED // MOSS PAPER INK';modal.classList.remove('show')}}));return}
 if(target==='red'){document.body.classList.toggle('alarm');pushWorld('ark-red');readout.textContent='BAD IDEA BROADCAST TO ALL REALMS.';return}
 if(target.startsWith('server-')){const s=target.slice(7);const msg={morri:`MOSS NODE\n${has('morri-chess')?'ROOK HANDSHAKE ACCEPTED':'AWAITING CHESS EVENT'}`,witch:`PAPER NODE\n${has('witch-moon')?'MOON SIGIL ACTIVE':'GRIMOIRE LISTENING'}`,xander:`INK NODE\n${has('xander-woods')?'IMPOSSIBLE PATH OPEN':'CANON STABLE'}`,ark:`LOOPBACK\n${diagnostics()}`}[s];return show(s.toUpperCase()+' NODE',msg,'LIVE MACHINE')}
 if(target.startsWith('logic-')){const k=target.slice(6);if(k==='door'){if(logic.a&&!logic.b&&logic.c){pushWorld('ark-paradox');show('MAINTENANCE CHANNEL 0',`RULE 1: If it looks like project information, it should be real.\nRULE 2: If it is fake, it should be part of a puzzle.\nRULE 3: A system that documents itself changes what it documents.\nRULE 4: There is no Rule 4.\n\nFLAGS: ${[...passport].join(', ')||'none'}`,'UNAUTHORIZED ACCESS')}else readout.textContent='ACCESS DENIED // terminals disagree';return}logic[k]=!logic[k];readout.textContent=`PARADOX STATE A:${+logic.a} B:${+logic.b} C:${+logic.c}`;return}
}

document.querySelector('#hint').onpointerdown=()=>document.body.classList.add('reveal');
document.querySelector('#hint').onpointerup=document.querySelector('#hint').onpointerleave=()=>document.body.classList.remove('reveal');
save();
