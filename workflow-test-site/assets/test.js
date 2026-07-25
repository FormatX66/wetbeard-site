(()=>{
  const $=id=>document.getElementById(id);
  function paint(){
    const w=window.innerWidth,h=window.innerHeight,d=window.devicePixelRatio||1;
    const o=screen.orientation?.type||((w>h)?'landscape':'portrait');
    $('vw').textContent=`${w}px`;$('vh').textContent=`${h}px`;$('dpr').textContent=d.toFixed(2);$('orientation').textContent=o;
    $('viewport').textContent=`${w}×${h} @${d.toFixed(2)}x`;
    const overflow=document.documentElement.scrollWidth>document.documentElement.clientWidth;
    $('overflowState').textContent=overflow?'FAIL':'PASS';
    $('overflowState').style.color=overflow?'#ff6978':'#6ee7a1';
  }
  async function loadStatus(){
    try{
      const r=await fetch(`deployment.json?ts=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      $('deployState').textContent=d.status||'UNKNOWN';
      $('releaseId').textContent=(d.release_id||'–').slice(0,12);
      $('deployedAt').textContent=d.deployed_at_utc||'–';
      $('branchName').textContent=d.branch||'–';
      $('statusLamp').classList.add(d.status==='verified-live'?'ok':'bad');
    }catch(e){
      $('deployState').textContent='STATUS FILE UNAVAILABLE';$('statusLamp').classList.add('bad');
    }
  }
  addEventListener('resize',paint,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(paint,100),{passive:true});
  paint();loadStatus();
})();
