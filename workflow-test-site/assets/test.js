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
  const form=$('hostConnectForm');
  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const btn=$('hostConnectButton'),box=$('hostConnectResult');
      btn.disabled=true;btn.textContent='CHECKING…';box.hidden=false;box.className='connection-result';box.textContent='Testing common host connections…';
      try{
        const payload={host:$('hostField').value.trim(),username:$('hostUser').value.trim(),password:$('hostPass').value};
        const r=await fetch('api/connect-host.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
        const d=await r.json();
        $('hostPass').value='';
        if(!r.ok||!d.ok)throw new Error(d.error||`HTTP ${r.status}`);
        const services=(d.reachable_services||[]).map(s=>`<li>${s.label} — port ${s.port}</li>`).join('');
        const auth=(d.authentication_tests||[]).map(a=>`<li>${a.method}: ${a.authenticated?'LOGIN OK':'login not confirmed'}</li>`).join('');
        box.classList.add('ok');
        box.innerHTML=`<strong>HOST FOUND</strong><div>${d.host}</div><div>Best connection: <b>${d.preferred_connection||'Manual setup needed'}</b></div>${services?`<ul>${services}</ul>`:''}${auth?`<ul>${auth}</ul>`:''}<div class="note">Password stored: NO</div>`;
      }catch(err){
        $('hostPass').value='';box.classList.add('bad');box.innerHTML=`<strong>COULD NOT CONNECT</strong><div>${String(err.message||err)}</div>`;
      }finally{btn.disabled=false;btn.textContent='CONNECT HOST';}
    });
  }
  addEventListener('resize',paint,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(paint,100),{passive:true});
  paint();loadStatus();
})();