(()=>{
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const toast=q('#toast');
  function showToast(t){if(!toast)return;toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200)}

  const modal=q('#hijack');
  qa('[data-pirate]').forEach(b=>b.addEventListener('click',()=>modal?.showModal()));
  q('[data-close-hijack]')?.addEventListener('click',()=>modal?.close());
  let seq='';
  addEventListener('keydown',e=>{if(e.key.length===1){seq=(seq+e.key.toUpperCase()).slice(-6);if(seq==='PIRATE')modal?.showModal()}});
  qa('[data-apply]').forEach(b=>b.addEventListener('click',()=>showToast('APPLICATION RECORDED. YOUR CURRENT EMPLOYER HAS BEEN NOTIFIED.')));
  q('[data-mobile]')?.addEventListener('click',()=>showToast('MOBILE NAVIGATION REQUEST LOGGED FOR COMPLIANCE REVIEW.'));

  function launchTrogdor(){
    document.getElementById('trogdor-event')?.remove();
    document.getElementById('trogdor-style')?.remove();
    const style=document.createElement('style');
    style.id='trogdor-style';
    style.textContent=`
      #trogdor-event{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:linear-gradient(0deg,rgba(96,15,0,.38),rgba(0,0,0,.08) 50%,transparent);pointer-events:none}
      #trogdor-event .burnination-alert{position:absolute;top:10%;left:50%;transform:translateX(-50%) rotate(-2deg);font:900 clamp(32px,8vw,88px)/.9 Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.03em;color:#ffdf49;text-shadow:5px 5px 0 #a40c00,-3px -3px 0 #111;white-space:nowrap;animation:trogFlash .48s steps(2,end) 8}
      #trogdor-event .country{position:absolute;left:0;right:0;bottom:0;height:190px;border-bottom:10px solid #35250c;background:linear-gradient(transparent 45%,rgba(87,101,35,.9) 46%,rgba(67,75,24,.96));}
      #trogdor-event .cottage{position:absolute;right:7vw;bottom:27px;font-size:82px;filter:drop-shadow(0 5px 2px #0008);animation:cottageBurn 7s 2.4s forwards}
      #trogdor-event .villager{position:absolute;bottom:75px;left:-150px;font-size:72px;filter:drop-shadow(0 5px 2px #0008);animation:villagerRun 7s linear forwards}
      #trogdor-event .villager:after{content:'VILLAGER';display:block;margin-top:-10px;text-align:center;color:#fff;font:900 12px ui-monospace,monospace;letter-spacing:.12em;text-shadow:2px 2px #000}
      #trogdor-event .dragon{position:absolute;bottom:55px;left:-360px;width:260px;height:150px;filter:drop-shadow(0 8px 3px #0009);animation:trogdorRun 7s .2s linear forwards}
      #trogdor-event .dragon-label{position:absolute;left:48px;top:-17px;color:#ffdf49;font:900 23px Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.07em;text-shadow:2px 2px #8c0c00;transform:rotate(-5deg)}
      #trogdor-event .flame{position:absolute;bottom:102px;left:-250px;font-size:60px;opacity:0;animation:flameRun 7s 1.2s linear forwards}
      #trogdor-event .stamp{position:absolute;right:18px;top:18px;border:3px solid #ff3549;padding:8px 11px;color:#ff3549;background:#07080de6;font:900 11px ui-monospace,monospace;letter-spacing:.12em;transform:rotate(3deg)}
      #trogdor-event .audio-card{pointer-events:auto;position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:9px 12px;border:2px solid #ff3549;background:#08090bf2;box-shadow:0 12px 40px #000c;max-width:94vw}
      #trogdor-event .audio-card span{color:#fff;font:900 10px ui-monospace,monospace;letter-spacing:.08em;white-space:nowrap}
      #trogdor-event .audio-card a{color:#ffdf49;border:1px solid #ffdf49;padding:6px 9px;text-decoration:none;font:900 10px ui-monospace,monospace;letter-spacing:.08em}
      #trogdor-audio{position:absolute;left:-9999px;width:1px;height:1px;opacity:.01}
      @keyframes villagerRun{0%{transform:translateX(0) rotate(-7deg)}12%{transform:translateX(16vw) rotate(7deg)}24%{transform:translateX(32vw) rotate(-7deg)}36%{transform:translateX(48vw) rotate(7deg)}48%{transform:translateX(64vw) rotate(-7deg)}60%{transform:translateX(80vw) rotate(7deg)}72%{transform:translateX(96vw) rotate(-7deg)}100%{transform:translateX(calc(100vw + 220px)) rotate(7deg)}}
      @keyframes trogdorRun{0%{transform:translateX(0) rotate(-2deg)}12%{transform:translateX(16vw) rotate(2deg)}24%{transform:translateX(32vw) rotate(-2deg)}36%{transform:translateX(48vw) rotate(2deg)}48%{transform:translateX(64vw) rotate(-2deg)}60%{transform:translateX(80vw) rotate(2deg)}72%{transform:translateX(96vw) rotate(-2deg)}100%{transform:translateX(calc(100vw + 470px)) rotate(2deg)}}
      @keyframes flameRun{0%,12%{opacity:0;transform:translateX(0) scale(.6)}20%{opacity:1;transform:translateX(32vw) scale(1)}70%{opacity:1;transform:translateX(94vw) scale(1.2)}100%{opacity:0;transform:translateX(calc(100vw + 300px)) scale(1.6)}}
      @keyframes cottageBurn{0%{filter:drop-shadow(0 5px 2px #0008)}25%{filter:drop-shadow(0 0 10px #ff7b00)}100%{filter:grayscale(1) brightness(.35) drop-shadow(0 0 18px #ff4500);transform:rotate(5deg)}}
      @keyframes trogFlash{50%{opacity:.35;transform:translateX(-50%) rotate(2deg) scale(1.04)}}
      @media(max-width:600px){#trogdor-event .villager{font-size:52px}#trogdor-event .dragon{width:195px;height:115px;bottom:70px}#trogdor-event .cottage{font-size:58px}#trogdor-event .audio-card{bottom:10px;flex-direction:column;gap:5px}#trogdor-event .audio-card span{white-space:normal;text-align:center}}
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
        </svg>
      </div>
      <div class="audio-card"><span>🎵 TROGDOR SONG SHOULD START AUTOMATICALLY</span><a href="https://www.youtube.com/watch?v=90X5NJleYJQ&t=150s" target="_blank" rel="noopener">TAP IF SILENT</a></div>`;
    document.body.appendChild(overlay);

    const player=document.createElement('iframe');
    player.id='trogdor-audio';
    player.title='Official Homestar Runner Trogdor video';
    player.allow='autoplay; encrypted-media; picture-in-picture';
    player.referrerPolicy='strict-origin-when-cross-origin';
    player.src='https://www.youtube.com/embed/90X5NJleYJQ?autoplay=1&start=150&playsinline=1&controls=0&rel=0';
    overlay.appendChild(player);

    setTimeout(()=>overlay.remove(),10000);
    setTimeout(()=>style.remove(),11000);
  }

  const form=q('#complianceForm');
  if(form){
    const name=q('#citizenName'),score=q('#scoreValue'),ring=q('#scoreRing'),state=q('#scanState'),status=q('#statusValue'),risk=q('#riskValue'),action=q('#actionValue');
    let trogdorActive=false;

    function setTrogdorResult(){
      if(!trogdorActive){
        trogdorActive=true;
        launchTrogdor();
        setTimeout(()=>{trogdorActive=false},10500);
      }
      score.textContent='00';
      ring.style.background='conic-gradient(var(--red) 0deg,#252a31 0deg)';
      status.textContent='BURNINATION DETECTED';
      risk.textContent='PEASANT-LEVEL CATASTROPHE';
      action.textContent='RUN FOR THE THATCHED-ROOF COTTAGES';
      state.textContent='OH NO';
    }

    name.addEventListener('input',()=>{
      if(/^trogdor$/i.test(name.value.trim())) setTrogdorResult();
    });

    function fallback(n){
      let h=0;for(const c of n.toUpperCase())h=((h<<5)-h)+c.charCodeAt(0);let s=18+Math.abs(h%78);
      if(/^trogdor$/i.test(n))return{score:0,status:'BURNINATION DETECTED',risk:'PEASANT-LEVEL CATASTROPHE',action:'RUN FOR THE THATCHED-ROOF COTTAGES',event:'trogdor'};
      if(/rusty|orlock|chroma|mungo|parrot|pavo|pirate|p1klz|p1-k/i.test(n))return{score:Math.min(s,14),status:'EXTREMELY INTERESTING',risk:'UNACCEPTABLY MUSICAL',action:'REMAIN WHERE YOU ARE'};
      if(s>=86)return{score:s,status:'MODEL CITIZEN',risk:'MINIMAL',action:'CONTINUE CONSUMING'};
      if(s>=65)return{score:s,status:'PROVISIONALLY ALIGNED',risk:'MANAGEABLE',action:'WATCH MORE CORPORATE MEDIA'};
      if(s>=40)return{score:s,status:'REQUIRES GUIDANCE',risk:'CONCERNING',action:'REPORT UNUSUAL THOUGHTS'};
      return{score:s,status:'NON-COMPLIANT',risk:'SPICY',action:'AVOID GUITARS & SMALL MOONS'};
    }

    async function scan(n){
      try{const r=await fetch('/uber/api/compliance-score.php?name='+encodeURIComponent(n)+'&_='+Date.now(),{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw 0;const d=await r.json();if(typeof d.score!=='number')throw 0;return d}catch{return fallback(n)}
    }

    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const n=name.value.trim();if(!n)return;
      if(/^trogdor$/i.test(n)){setTrogdorResult();return}
      state.textContent='SCANNING…';score.textContent='..';
      const d=await scan(n);
      if(d.event==='trogdor'){setTrogdorResult();return}
      await new Promise(r=>setTimeout(r,300));
      const s=Math.max(0,Math.min(100,d.score));
      score.textContent=String(s).padStart(2,'0');
      ring.style.background=`conic-gradient(var(--red) ${s*3.6}deg,#252a31 0deg)`;
      status.textContent=d.status||'CORPORATE REVIEW';risk.textContent=d.risk||'UNASSESSED';action.textContent=d.action||'AWAIT INSTRUCTIONS';state.textContent='COMPLETE';
    });
  }
})();