(()=>{
  const KEY='realm-passport';
  const BUS='https://arkmatx.com/world-state.php';
  const allowed=new Set(['morri-chess','morri-wire','witch-moon','witch-public-entry','xander-woods','xander-knight','xander-episode','ark-red','ark-radio','ark-paradox','ark-basement','ark-maintenance']);
  const local=()=>new Set((localStorage.getItem(KEY)||'').split(',').filter(Boolean));
  const save=s=>localStorage.setItem(KEY,[...s].join(','));
  const posted=new Set();
  async function pull(){
    try{
      const r=await fetch(BUS,{cache:'no-store',mode:'cors'});if(!r.ok)return;
      const j=await r.json();const s=local();let changed=false;
      for(const [f,on] of Object.entries(j.flags||{})){if(on&&allowed.has(f)&&!s.has(f)){s.add(f);changed=true}}
      if(changed){save(s);window.dispatchEvent(new CustomEvent('realm-state-change',{detail:j}));const k='realm-bus-reloaded';if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');location.reload()}}
    }catch{}
  }
  async function push(){
    for(const f of local()){
      if(!allowed.has(f)||posted.has(f))continue;
      try{const r=await fetch(BUS,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({flag:f,source:location.hostname.replace(/\W/g,'-')})});if(r.ok)posted.add(f)}catch{}
    }
  }
  window.RealmBus={pull,push};
  pull().then(push);
  setInterval(()=>{push();pull()},15000);
})();