(()=>{
  const NS='uberJimothy';
  let buffer='', active=false, clearTimer=0;

  function cleanup(){
    document.getElementById(NS)?.remove();
    document.getElementById(NS+'Style')?.remove();
    active=false;
  }

  function launch(){
    if(active) return;
    active=true;
    document.getElementById(NS)?.remove();
    document.getElementById(NS+'Style')?.remove();

    const style=document.createElement('style');
    style.id=NS+'Style';
    style.textContent=`
      #${NS}{position:fixed;inset:0;z-index:2147483600;pointer-events:none;overflow:hidden;background:linear-gradient(180deg,rgba(3,5,8,.05),rgba(3,5,8,.76));font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      #${NS} .jim-banner{position:absolute;left:50%;top:7%;transform:translateX(-50%) rotate(-1deg);padding:10px 15px;border:2px solid #dfe8ef;background:#080b0eea;color:#eef5fa;font:900 clamp(12px,2.8vw,22px) ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-align:center;box-shadow:0 14px 42px #0008}
      #${NS} .jim-floor{position:absolute;left:0;right:0;bottom:0;height:31%;background:linear-gradient(transparent,rgba(12,15,17,.88) 34%,#111518);border-top:1px solid #46505a}
      #${NS} .jimothy{position:absolute;left:-190px;bottom:9%;font-size:clamp(86px,16vw,145px);line-height:1;filter:drop-shadow(0 12px 7px #0009);transform-origin:50% 90%;animation:jimWaddle 6.4s linear forwards}
      #${NS} .jimothy .raccoon{display:block;transform:scaleX(1.34) scaleY(.73)}
      #${NS} .jimothy:after{content:'JIMOTHY // ASSET RECOVERY';display:block;margin-top:-5px;color:#dbe6ee;text-align:center;font:900 9px ui-monospace,monospace;letter-spacing:.1em;text-shadow:2px 2px #000}
      #${NS} .trash{position:absolute;bottom:9%;font-size:56px;filter:drop-shadow(0 6px 4px #0008)}
      #${NS} .t1{left:27%}.t2{left:55%}.t3{left:79%}
      #${NS} .paw{position:absolute;bottom:7%;font-size:25px;opacity:0;animation:pawPop 6.2s linear forwards}.p1{left:18%;animation-delay:.7s}.p2{left:34%;animation-delay:1.5s}.p3{left:51%;animation-delay:2.5s}.p4{left:68%;animation-delay:3.4s}.p5{left:84%;animation-delay:4.4s}
      #${NS} .badge{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) scale(.82) rotate(-1deg);width:min(90vw,710px);padding:22px;background:#e8e4d9;color:#151719;border:12px solid #d7d1c3;box-shadow:0 30px 100px #000c;opacity:0;animation:badgeIn .5s 5.8s cubic-bezier(.18,.88,.23,1.2) forwards}
      #${NS} .badge .kicker{font:900 9px ui-monospace,monospace;letter-spacing:.16em;color:#555d61}.badge h2{margin:8px 0 4px;font-size:clamp(42px,9vw,80px);line-height:.9;letter-spacing:-.05em}.badge .sub{font:800 13px ui-monospace,monospace;color:#596168;margin-bottom:15px}.badge .grid{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #222}.badge .grid div{padding:9px;border-right:1px solid #777;border-bottom:1px solid #777}.badge .grid span,.badge .grid b{display:block}.badge .grid span{font:800 8px ui-monospace,monospace;letter-spacing:.09em;color:#697078}.badge .grid b{font-size:13px;margin-top:3px}.badge .stamp{display:inline-block;margin-top:14px;padding:7px 10px;border:3px solid #1d2226;color:#1d2226;font:950 11px ui-monospace,monospace;letter-spacing:.1em;transform:rotate(-2deg)}.badge .wildlife{margin-top:10px;font:700 9px ui-monospace,monospace;color:#697078}
      @keyframes jimWaddle{0%{transform:translateX(0) rotate(-8deg)}12%{transform:translateX(18vw) rotate(7deg)}25%{transform:translateX(36vw) rotate(-7deg)}39%{transform:translateX(53vw) rotate(7deg)}54%{transform:translateX(70vw) rotate(-7deg)}70%{transform:translateX(88vw) rotate(7deg)}86%,100%{transform:translateX(calc(100vw + 280px)) rotate(-5deg)}}
      @keyframes pawPop{0%,12%{opacity:0;transform:rotate(-18deg) scale(.5)}18%,70%{opacity:.75;transform:rotate(8deg) scale(1)}100%{opacity:0;transform:rotate(18deg) scale(.8)}}
      @keyframes badgeIn{to{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-1deg)}}
      @media(max-width:600px){#${NS} .jim-floor{height:27%}#${NS} .trash{font-size:38px}#${NS} .badge{padding:16px;border-width:8px}.badge .grid{grid-template-columns:1fr}.badge .grid div{border-right:0}.badge .wildlife{font-size:8px}}
      @media(prefers-reduced-motion:reduce){#${NS} .jimothy{animation-duration:.01ms;left:42%;bottom:9%}#${NS} .badge{animation-delay:.4s}.paw{display:none}}
    `;
    document.head.appendChild(style);

    const d=document.createElement('div');
    d.id=NS;
    d.innerHTML=`
      <div class="jim-banner">ÜBERCORP TALENT ACQUISITION // SEATTLE FIELD OFFICE<br>WE HAVE HIRED THE INTERNET.</div>
      <div class="jim-floor"></div>
      <div class="trash t1">🗑️</div><div class="trash t2">🗑️</div><div class="trash t3">🗑️</div>
      <div class="paw p1">🐾</div><div class="paw p2">🐾</div><div class="paw p3">🐾</div><div class="paw p4">🐾</div><div class="paw p5">🐾</div>
      <div class="jimothy"><span class="raccoon">🦝</span></div>
      <div class="badge">
        <div class="kicker">ÜBERCORP HUMAN RESOURCES // NEW HIRE // JULY 2026</div>
        <h2>JIMOTHY</h2>
        <div class="sub">CORPORATE PERSONNEL FILE // BALLARD ANNEX</div>
        <div class="grid">
          <div><span>JOB TITLE</span><b>Urban Asset Recovery Specialist</b></div>
          <div><span>DEPARTMENT</span><b>Waste Management & Dumpster Intelligence</b></div>
          <div><span>FIELD OFFICE</span><b>Seattle // Ballard Sector</b></div>
          <div><span>PERFORMANCE REVIEW</span><b>Recovered 14 snacks, 1 lanyard, 0 regrets</b></div>
          <div><span>CORPORATE STATUS</span><b>INTERNET-CRITICAL ASSET</b></div>
          <div><span>MANAGEMENT NOTE</span><b>Do not restructure. He is perfect.</b></div>
        </div>
        <div class="stamp">EMPLOYEE OF THE SUMMER</div>
        <div class="wildlife">REAL-WORLD NOTICE: Admire wild raccoons from a respectful distance and do not feed or approach them.</div>
      </div>`;
    document.body.appendChild(d);
    setTimeout(cleanup,11500);
  }

  function endsJimothy(value){return String(value||'').trim().toUpperCase().endsWith('JIMOTHY')}

  addEventListener('keydown',e=>{
    if(e.key==='Escape'&&active){cleanup();return}
    if(e.key.length!==1)return;
    clearTimeout(clearTimer);
    const next=(buffer+e.key).slice(-20);
    if(next.toUpperCase().endsWith('JIMOTHY')){
      e.stopImmediatePropagation();
      buffer='';
      setTimeout(launch,0);
      return;
    }
    buffer=next;
    clearTimer=setTimeout(()=>buffer='',2400);
  },true);

  addEventListener('input',e=>{
    if(!e.target||!('value' in e.target)||!endsJimothy(e.target.value))return;
    e.stopImmediatePropagation();
    if(!active)launch();
  },true);
})();
