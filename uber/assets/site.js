(()=>{
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const toast=q('#toast');
  function showToast(t){if(!toast)return;toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200)}

  const modal=q('#hijack');
  qa('[data-pirate]').forEach(b=>b.addEventListener('click',()=>modal?.showModal()));
  q('[data-close-hijack]')?.addEventListener('click',()=>modal.close());
  let seq='';
  addEventListener('keydown',e=>{if(e.key.length===1){seq=(seq+e.key.toUpperCase()).slice(-6);if(seq==='PIRATE')modal?.showModal()}});
  qa('[data-apply]').forEach(b=>b.addEventListener('click',()=>showToast('APPLICATION RECORDED. YOUR CURRENT EMPLOYER HAS BEEN NOTIFIED.')));
  q('[data-mobile]')?.addEventListener('click',()=>showToast('MOBILE NAVIGATION REQUEST LOGGED FOR COMPLIANCE REVIEW.'));

  function launchTrogdor(){
    document.getElementById('trogdor-event')?.remove();
    document.getElementById('trogdor-audio')?.remove();
    document.getElementById('trogdor-style')?.remove();

    const style=document.createElement('style');
    style.id='trogdor-style';
    style.textContent=`
      #trogdor-event{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden;background:linear-gradient(0deg,rgba(96,15,0,.25),transparent 45%)}
      #trogdor-event .burnination-alert{position:absolute;top:13%;left:50%;transform:translateX(-50%) rotate(-2deg);font:900 clamp(30px,7vw,82px)/.9 Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.03em;color:#ffdf49;text-shadow:4px 4px 0 #a40c00,-3px -3px 0 #111;white-space:nowrap;animation:trogFlash .48s steps(2,end) 8}
      #trogdor-event .country{position:absolute;left:0;right:0;bottom:5vh;height:160px;border-bottom:8px solid #35250c;background:linear-gradient(transparent 58%,rgba(87,101,35,.85) 59%,rgba(67,75,24,.92));}
      #trogdor-event .cottage{position:absolute;right:8vw;bottom:22px;font-size:76px;filter:drop-shadow(0 5px 2px #0008);animation:cottageBurn 7s 2.5s forwards}
      #trogdor-event .villager{position:absolute;bottom:65px;left:-150px;font-size:72px;filter:drop-shadow(0 5px 2px #0008);animation:villagerRun 7s linear forwards}
      #trogdor-event .villager:after{content:'VILLAGER';display:block;margin-top:-10px;text-align:center;color:#fff;font:900 12px ui-monospace,monospace;letter-spacing:.12em;text-shadow:2px 2px #000}
      #trogdor-event .dragon{position:absolute;bottom:50px;left:-360px;width:250px;height:150px;filter:drop-shadow(0 8px 3px #0009);animation:trogdorRun 7s .25s linear forwards}
      #trogdor-event .dragon-label{position:absolute;left:44px;top:-14px;color:#ffdf49;font:900 21px Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.07em;text-shadow:2px 2px #8c0c00;transform:rotate(-5deg)}
      #trogdor-event .flame{position:absolute;bottom:92px;left:-250px;font-size:58px;opacity:0;animation:flameRun 7s 1.25s linear forwards}
      #trogdor-event .stamp{position:absolute;right:20px;top:20px;border:3px solid #ff3549;padding:8px 11px;color:#ff3549;background:#07080adb;font:900 11px ui-monospace,monospace;letter-spacing:.12em;transform:rotate(3deg)}
      #trogdor-audio{position:fixed;right:12px;bottom:12px;width:260px;height:146px;border:2px solid #ff3549;z-index:2147483001;background:#000;box-shadow:0 12px 45px #000c}
      @keyframes villagerRun{0%{transform:translateX(0) rotate(-7deg)}12%{transform:translateX(16vw) rotate(7deg)}24%{transform:translateX(32vw) rotate(-7deg)}36%{transform:translateX(48vw) rotate(7deg)}48%{transform:translateX(64vw) rotate(-7deg)}60%{transform:translateX(80vw) rotate(7deg)}72%{transform:translateX(96vw) rotate(-7deg)}100%{transform:translateX(calc(100vw + 220px)) rotate(7deg)}}
      @keyframes trogdorRun{0%{transform:translateX(0) rotate(-2deg)}12%{transform:translateX(16vw) rotate(2deg)}24%{transform:translateX(32vw) rotate(-2deg)}36%{transform:translateX(48vw) rotate(2deg)}48%{transform:translateX(64vw) rotate(-2deg)}60%{transform:translateX(80vw) rotate(2deg)}72%{transform:translateX(96vw) rotate(-2deg)}100%{transform:translateX(calc(100vw + 460px)) rotate(2deg)}}
      @keyframes flameRun{0%,12%{opacity:0;transform:translateX(0) scale(.6)}20%{opacity:1;transform:translateX(32vw) scale(1)}70%{opacity:1;transform:translateX(94vw) scale(1.2)}100%{opacity:0;transform:translateX(calc(100vw + 300px)) scale(1.6)}}
      @keyframes cottageBurn{0%{filter:drop-shadow(0 5px 2px #0008)}25%{filter:drop-shadow(0 0 10px #ff7b00)}100%{filter:grayscale(1) brightness(.35) drop-shadow(0 0 18px #ff4500);transform:rotate(5deg)}}
      @keyframes trogFlash{50%{opacity:.35;transform:translateX(-50%) rotate(2deg) scale(1.04)}}
      @media(max-width:600px){#trogdor-audio{width:180px;height:101px}#trogdor-event .villager{font-size:54px}#trogdor-event .dragon{width:190px;height:115px}#trogdor-event .cottage{font-size:58px}}
    `;
    document.head.appendChild(style);

    const overlay=document.createElement('div');
    overlay.id='trogdor-event';
    overlay.innerHTML=`
      <div class="burnination-alert">BURNINATION DETECTED</div>
      <div class="stamp">ÜBERCORP EMERGENCY // TROGDOR</div>
      <div class="country"><div class="cottage">🏠</div></div>
      <div class="villager">🏃‍♂️</div>
      <div class="flame">🔥🔥🔥</div>
      <div class="dragon" aria-label="Trogdor the Burninator">
        <div class="dragon-label">TROGDOR!</div>
        <svg viewBox="0 0 260 150" width="100%" height="100%" role="img" aria-label="cartoon dragon">
          <path d="M65 28 C112 5 159 18 169 49 C178 76 142 86 119 74 C99 64 94 91 122 106 C147 120 189 109 210 79" fill="none" stroke="#17120b" stroke-width="17" stroke-linecap="round"/>
          <path d="M70 31 C111 14 149 24 154 49 C159 65 137 69 121 61" fill="none" stroke="#69a431" stroke-width="11" stroke-linecap="round"/>
          <path d="M118 75 C98 69 85 86 97 102 C111 122 158 128 197 94" fill="none" stroke="#69a431" stroke-width="13" stroke-linecap="round"/>
          <path d="M91 54 L53 16 L103 32 Z" fill="#93c94f" stroke="#17120b" stroke-width="5"/>
          <path d="M127 86 C147 57 177 52 203 63 L178 79 L205 92 C172 101 147 98 127 86 Z" fill="#d5e8ae" stroke="#17120b" stroke-width="5"/>
          <path d="M148 76 C168 82 186 101 187 121 C172 123 162 112 158 101 C150 119 137 124 126 117 C132 101 139 86 148 76 Z" fill="#e8bc72" stroke="#17120b" stroke-width="6"/>
          <path d="M166 105 C181 99 196 105 203 116 C196 125 181 129 170 123" fill="none" stroke="#17120b" stroke-width="9" stroke-linecap="round"/>
          <circle cx="151" cy="44" r="4" fill="#111"/>
          <path d="M162 53 L174 48 L169 60 Z" fill="#fff" stroke="#111" stroke-width="2"/>
          <path d="M67 25 L45 22 M64 35 L42 40 M61 45 L44 55" stroke="#17120b" stroke-width="5" stroke-linecap="round"/>
        </svg>
      </div>`;
    document.body.appendChild(overlay);

    const player=document.createElement('iframe');
    player.id='trogdor-audio';
    player.title='Official Homestar Runner Trogdor video';
    player.allow='autoplay; encrypted-media; picture-in-picture';
    player.referrerPolicy='strict-origin-when-cross-origin';
    player.src='https://www.youtube-nocookie.com/embed/90X5NJleYJQ?autoplay=1&start=150&controls=1&rel=0';
    document.body.appendChild(player);

    setTimeout(()=>overlay.remove(),8500);
    setTimeout(()=>{player.remove();style.remove()},70000);
  }

  const form=q('#complianceForm');
  if(form){
    const name=q('#citizenName'),score=q('#scoreValue'),ring=q('#scoreRing'),state=q('#scanState'),status=q('#statusValue'),risk=q('#riskValue'),action=q('#actionValue');
    function fallback(n){
      let h=0;for(const c of n.toUpperCase())h=((h<<5)-h)+c.charCodeAt(0);let s=18+Math.abs(h%78);
      if(/rusty|orlock|chroma|mungo|parrot|pavo|pirate|p1klz|p1-k/i.test(n))return{score:Math.min(s,14),status:'EXTREMELY INTERESTING',risk:'UNACCEPTABLY MUSICAL',action:'REMAIN WHERE YOU ARE'};
      if(s>=86)return{score:s,status:'MODEL CITIZEN',risk:'MINIMAL',action:'CONTINUE CONSUMING'};
      if(s>=65)return{score:s,status:'PROVISIONALLY ALIGNED',risk:'MANAGEABLE',action:'WATCH MORE CORPORATE MEDIA'};
      if(s>=40)return{score:s,status:'REQUIRES GUIDANCE',risk:'CONCERNING',action:'REPORT UNUSUAL THOUGHTS'};
      return{score:s,status:'NON-COMPLIANT',risk:'SPICY',action:'AVOID GUITARS & SMALL MOONS'}
    }
    async function scan(n){
      try{const r=await fetch('/uber/api/compliance-score.php?name='+encodeURIComponent(n),{headers:{Accept:'application/json'}});if(!r.ok)throw 0;const d=await r.json();if(typeof d.score!=='number')throw 0;return d}catch{return fallback(n)}
    }
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const n=name.value.trim();if(!n)return;
      const isTrogdor=/^trogdor$/i.test(n);
      if(isTrogdor)launchTrogdor();
      state.textContent=isTrogdor?'BURNINATING…':'SCANNING…';score.textContent='..';
      await new Promise(r=>setTimeout(r,480));
      const d=isTrogdor?{score:0,status:'BURNINATION DETECTED',risk:'PEASANT-LEVEL CATASTROPHE',action:'RUN FOR THE THATCHED-ROOF COTTAGES'}:await scan(n);
      const s=Math.max(0,Math.min(100,d.score));
      score.textContent=String(s).padStart(2,'0');ring.style.background=`conic-gradient(var(--red) ${s*3.6}deg,#252a31 0deg)`;status.textContent=d.status||'CORPORATE REVIEW';risk.textContent=d.risk||'UNASSESSED';action.textContent=d.action||'AWAIT INSTRUCTIONS';state.textContent=isTrogdor?'OH NO':'COMPLETE';
    });
  }
})();
