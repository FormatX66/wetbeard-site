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
      #trogdor-event{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:linear-gradient(0deg,rgba(96,15,0,.42),rgba(0,0,0,.08) 52%,transparent);pointer-events:none}
      #trogdor-event .burnination-alert{position:absolute;top:8%;left:50%;transform:translateX(-50%) rotate(-2deg);font:900 clamp(32px,8vw,88px)/.9 Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.03em;color:#ffdf49;text-shadow:5px 5px 0 #a40c00,-3px -3px 0 #111;white-space:nowrap;animation:trogFlash .48s steps(2,end) 8}
      #trogdor-event .country{position:absolute;left:0;right:0;bottom:0;height:200px;border-bottom:10px solid #35250c;background:linear-gradient(transparent 44%,rgba(87,101,35,.9) 45%,rgba(67,75,24,.97));}
      #trogdor-event .cottage{position:absolute;right:7vw;bottom:28px;font-size:84px;filter:drop-shadow(0 5px 2px #0008);animation:cottageBurn 7s 2.4s forwards}
      #trogdor-event .villager{position:absolute;bottom:78px;left:-150px;font-size:72px;filter:drop-shadow(0 5px 2px #0008);animation:villagerRun 7s linear forwards}
      #trogdor-event .villager:after{content:'PEASANT';display:block;margin-top:-10px;text-align:center;color:#fff;font:900 12px ui-monospace,monospace;letter-spacing:.12em;text-shadow:2px 2px #000}
      #trogdor-event .dragon{position:absolute;bottom:26px;left:-330px;width:285px;height:245px;filter:drop-shadow(0 9px 3px #000b);animation:trogdorRun 7s .18s linear forwards}
      #trogdor-event .dragon-label{position:absolute;left:72px;top:-9px;color:#ffdf49;font:900 24px Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.07em;text-shadow:2px 2px #8c0c00;transform:rotate(-5deg)}
      #trogdor-event .stamp{position:absolute;right:18px;top:18px;border:3px solid #ff3549;padding:8px 11px;color:#ff3549;background:#07080de6;font:900 11px ui-monospace,monospace;letter-spacing:.12em;transform:rotate(3deg)}
      #trogdor-event .audio-card{pointer-events:auto;position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:9px;padding:8px 10px;border:2px solid #ff3549;background:#08090bf5;box-shadow:0 12px 40px #000c;max-width:94vw}
      #trogdor-event .audio-card span{color:#fff;font:900 10px ui-monospace,monospace;letter-spacing:.08em;white-space:nowrap}
      #trogdor-event .audio-card a{color:#ffdf49;border:1px solid #ffdf49;padding:6px 9px;text-decoration:none;font:900 10px ui-monospace,monospace;letter-spacing:.08em}
      #trogdor-audio{position:absolute;left:-9999px;width:1px;height:1px;opacity:.01}
      @keyframes villagerRun{0%{transform:translateX(0) rotate(-7deg)}12%{transform:translateX(16vw) rotate(7deg)}24%{transform:translateX(32vw) rotate(-7deg)}36%{transform:translateX(48vw) rotate(7deg)}48%{transform:translateX(64vw) rotate(-7deg)}60%{transform:translateX(80vw) rotate(7deg)}72%{transform:translateX(96vw) rotate(-7deg)}100%{transform:translateX(calc(100vw + 220px)) rotate(7deg)}}
      @keyframes trogdorRun{0%{transform:translateX(0) rotate(-2deg)}12%{transform:translateX(16vw) rotate(2deg)}24%{transform:translateX(32vw) rotate(-2deg)}36%{transform:translateX(48vw) rotate(2deg)}48%{transform:translateX(64vw) rotate(-2deg)}60%{transform:translateX(80vw) rotate(2deg)}72%{transform:translateX(96vw) rotate(-2deg)}100%{transform:translateX(calc(100vw + 490px)) rotate(2deg)}}
      @keyframes cottageBurn{0%{filter:drop-shadow(0 5px 2px #0008)}22%{filter:drop-shadow(0 0 12px #ff7b00)}100%{filter:grayscale(1) brightness(.32) drop-shadow(0 0 20px #ff4500);transform:rotate(5deg)}}
      @keyframes trogFlash{50%{opacity:.35;transform:translateX(-50%) rotate(2deg) scale(1.04)}}
      @media(max-width:600px){#trogdor-event .villager{font-size:50px}#trogdor-event .dragon{width:225px;height:195px;bottom:45px}#trogdor-event .cottage{font-size:58px}#trogdor-event .audio-card{bottom:8px;flex-direction:column;gap:5px}#trogdor-event .audio-card span{white-space:normal;text-align:center}}
    `;
    document.head.appendChild(style);

    const overlay=document.createElement('div');
    overlay.id='trogdor-event';
    overlay.innerHTML=`
      <div class="burnination-alert">BURNINATION DETECTED</div>
      <div class="stamp">ÜBERCORP EMERGENCY // WINGALING EVENT</div>
      <div class="country"><div class="cottage">🏠</div></div>
      <div class="villager">🏃‍♂️</div>
      <div class="dragon" aria-label="Trogdor the Burninator">
        <div class="dragon-label">TROGDOR!</div>
        <svg viewBox="0 0 300 250" width="100%" height="100%" role="img" aria-label="Trogdor-style green S-shaped dragon with one beefy arm">
          <g stroke="#121212" stroke-linejoin="round" stroke-linecap="round">
            <!-- S-shaped dragon body -->
            <path d="M200 41 C151 12 91 31 91 72 C91 104 145 103 164 123 C183 143 165 178 128 193 C96 206 76 199 64 188" fill="none" stroke="#2f9f2f" stroke-width="45"/>
            <path d="M200 41 C151 12 91 31 91 72 C91 104 145 103 164 123 C183 143 165 178 128 193 C96 206 76 199 64 188" fill="none" stroke="#111" stroke-width="57" opacity=".95"/>
            <path d="M200 41 C151 12 91 31 91 72 C91 104 145 103 164 123 C183 143 165 178 128 193 C96 206 76 199 64 188" fill="none" stroke="#2f9f2f" stroke-width="43"/>
            <!-- squared-off head -->
            <path d="M181 22 L242 35 L244 77 L194 78 L176 61 Z" fill="#2f9f2f" stroke-width="7"/>
            <circle cx="222" cy="47" r="5" fill="#fff" stroke-width="3"/>
            <circle cx="223" cy="47" r="2" fill="#111" stroke="none"/>
            <!-- consummate V teeth -->
            <path d="M198 67 l8 10 l8 -10 l8 10 l8 -10" fill="#fff" stroke-width="3"/>
            <!-- tiny wingaling wings -->
            <path d="M111 71 L63 27 L105 37 L111 14 L129 62 Z" fill="#58bc46" stroke-width="7"/>
            <path d="M119 72 L79 51 L91 86 Z" fill="#7dd05e" stroke-width="5"/>
            <!-- absurd beefy arm from neck -->
            <path d="M105 68 C75 62 53 73 43 93 C34 112 41 133 58 137 C72 141 80 132 85 118 C91 135 108 142 122 133 C134 125 133 108 123 98 C115 91 110 82 105 68 Z" fill="#efb0a2" stroke-width="8"/>
            <path d="M49 95 C27 91 20 103 27 116 C34 128 46 126 57 118" fill="#efb0a2" stroke-width="7"/>
            <!-- stick legs -->
            <path d="M127 194 L126 230 L108 230" fill="none" stroke-width="6"/>
            <path d="M151 181 L158 224 L178 224" fill="none" stroke-width="6"/>
            <!-- consummate V spines -->
            <path d="M96 202 l8 -16 l8 13 l8 -18 l8 12" fill="#fff" stroke-width="4"/>
            <!-- smoke + flame -->
            <path d="M241 54 C262 47 273 56 268 67 C283 63 291 70 286 80" fill="none" stroke="#ddd" stroke-width="6"/>
            <path d="M245 72 C267 77 277 88 294 87 C281 95 286 105 264 103 C270 113 255 118 241 105 Z" fill="#ffca2b" stroke="#e46218" stroke-width="5"/>
          </g>
        </svg>
      </div>
      <div class="audio-card"><span>OFFICIAL TROGDOR AUDIO</span><a href="https://trogdorboardgame.homestarrunner.com/soundboard/" target="_blank" rel="noopener">OPEN SOUNDBOARD</a><a href="https://www.youtube.com/watch?v=90X5NJleYJQ&t=150s" target="_blank" rel="noopener">PLAY SONG</a></div>`;
    document.body.appendChild(overlay);

    const player=document.createElement('iframe');
    player.id='trogdor-audio';
    player.title='Official Homestar Runner Strong Bad Email Dragon';
    player.allow='autoplay; encrypted-media; picture-in-picture';
    player.referrerPolicy='strict-origin-when-cross-origin';
    player.src='https://www.youtube.com/embed/90X5NJleYJQ?autoplay=1&start=150&playsinline=1&controls=0&rel=0';
    overlay.appendChild(player);

    setTimeout(()=>overlay.remove(),10500);
    setTimeout(()=>style.remove(),11500);
  }

  const form=q('#complianceForm');
  if(form){
    const name=q('#citizenName'),score=q('#scoreValue'),ring=q('#scoreRing'),state=q('#scanState'),status=q('#statusValue'),risk=q('#riskValue'),action=q('#actionValue');
    let trogdorActive=false;

    function setTrogdorResult(){
      if(!trogdorActive){
        trogdorActive=true;
        launchTrogdor();
        setTimeout(()=>{trogdorActive=false},11000);
      }
      score.textContent='00';
      ring.style.background='conic-gradient(var(--red) 0deg,#252a31 0deg)';
      status.textContent='BURNINATION DETECTED';
      risk.textContent='PEASANT-LEVEL CATASTROPHE';
      action.textContent='PROTECT THE THATCHED-ROOF COTTAGES';
      state.textContent='OH NO';
    }

    name.addEventListener('input',()=>{
      if(/^trogdor$/i.test(name.value.trim())) setTrogdorResult();
    });

    function fallback(n){
      let h=0;for(const c of n.toUpperCase())h=((h<<5)-h)+c.charCodeAt(0);let s=18+Math.abs(h%78);
      if(/^trogdor$/i.test(n))return{score:0,status:'BURNINATION DETECTED',risk:'PEASANT-LEVEL CATASTROPHE',action:'PROTECT THE THATCHED-ROOF COTTAGES',event:'trogdor'};
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