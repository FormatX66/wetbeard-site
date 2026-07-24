(()=>{
  'use strict';
  const NS='uberEasterStable';
  let buffer='',clearTimer=0,active=null;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const remove=()=>{document.getElementById(NS)?.remove();document.getElementById(NS+'Style')?.remove();active=null;};
  const base=`
    #${NS}{position:fixed;inset:0;z-index:2147482500;overflow:hidden;pointer-events:none;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #${NS} .card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,760px);padding:28px;border:1px solid #65707b;background:#080a0eee;color:#f6f7f8;box-shadow:0 34px 110px #000e}
    #${NS} .k{font:900 10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.17em;color:#cbd8e4}
    #${NS} h2{font-size:clamp(38px,8vw,80px);line-height:.86;letter-spacing:-.055em;margin:10px 0}
    #${NS} p{color:#aab4be;max-width:62ch}
    #${NS} .hint{position:absolute;right:12px;bottom:10px;color:#6d7680;font:800 8px ui-monospace,monospace;letter-spacing:.12em}
    @media(max-width:600px){#${NS} .card{padding:20px}#${NS} p{font-size:13px}}
  `;
  function mount(css,html,ms=6500){
    remove();
    const s=document.createElement('style');s.id=NS+'Style';s.textContent=base+css;document.head.appendChild(s);
    const d=document.createElement('div');d.id=NS;d.innerHTML=html+'<span class="hint">ESC TO CLOSE</span>';document.body.appendChild(d);active=d;
    if(ms)setTimeout(()=>{if(active===d)remove()},ms);
  }
  function starWars(){
    const stars=Array.from({length:86},(_,i)=>`<i style="left:${(i*37)%100}%;top:${(i*61)%100}%;animation-delay:-${(i%17)/3}s"></i>`).join('');
    mount(`
      #${NS}{background:#000;perspective:520px}
      #${NS} .stars i{position:absolute;width:2px;height:2px;background:#fff;opacity:.8;animation:eeTwinkle 1.8s infinite alternate}
      #${NS} .crawl{position:absolute;left:8%;right:8%;bottom:-120%;transform-origin:50% 100%;transform:rotateX(25deg);color:#ffe66b;text-align:justify;font-weight:850;font-size:clamp(20px,4vw,44px);line-height:1.35;animation:eeCrawl 10s linear forwards}
      #${NS} .crawl h2{text-align:center;font-size:1.4em}
      @keyframes eeTwinkle{to{opacity:.16;transform:scale(.5)}}@keyframes eeCrawl{to{bottom:125%}}
    `,`<div class="stars">${stars}</div><div class="crawl"><h2>Übercorp QUARTERLY REPORT<br>EPISODE XXV</h2><p>It is a period of aggressive vertical integration. Rebel musicians aboard a suspicious touring vessel have disrupted several perfectly profitable sectors.</p><p>Corporate security maintains there is no galactic conflict. The laser invoices remain classified.</p><p>Remain calm. Continue consuming. The quarterly numbers are strong with this one.</p></div>`,10500);
  }
  function detritus(){
    mount(`
      #${NS}{background:linear-gradient(180deg,transparent,#05070be8)}
      #${NS} .ship{position:absolute;left:-260px;top:36%;font-size:122px;filter:drop-shadow(0 15px 10px #000);animation:eeShip 6s cubic-bezier(.2,.7,.3,1) forwards}
      #${NS} .ship:after{content:'♫  ♫  ♫';position:absolute;left:-20px;top:90px;color:#ff4052;font:900 28px ui-monospace,monospace;letter-spacing:22px;white-space:nowrap}
      #${NS} .warning{position:absolute;left:50%;top:12%;transform:translateX(-50%) rotate(-2deg);padding:12px 18px;border:3px solid #ff4052;color:#ff4052;background:#07080be8;font:900 clamp(16px,4vw,34px) ui-monospace,monospace;text-align:center}
      @keyframes eeShip{0%{transform:translate(0,100px) rotate(-8deg)}45%{transform:translate(60vw,-40px) rotate(5deg)}100%{transform:translate(calc(100vw + 420px),40px) rotate(-2deg)}}
    `,`<div class="warning">UNAUTHORIZED VESSEL DETECTED<br>DETRITUS // EXTREMELY MUSICAL</div><div class="ship">🛸</div>`);
  }
  function p1klz(){
    mount(`
      #${NS}{background:radial-gradient(circle at 50% 45%,#0b2f5bdd,#02050af2)}
      #${NS} .eye{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);width:180px;height:180px;border-radius:50%;border:18px solid #202833;background:#061426;box-shadow:0 0 40px #4ca8ff,0 0 110px #0d4d99 inset;display:grid;place-items:center}
      #${NS} .eye:after{content:'';width:56px;height:56px;border-radius:50%;background:#bce9ff;box-shadow:0 0 16px #fff,0 0 40px #4ca8ff;animation:eeBlink 2.2s infinite}
      #${NS} .copy{position:absolute;left:50%;top:68%;transform:translateX(-50%);width:min(88vw,720px);text-align:center;color:#cfe8ff;font:800 14px ui-monospace,monospace;letter-spacing:.08em}.copy b{display:block;font-size:clamp(25px,5vw,50px);color:#fff;margin-bottom:10px}
      @keyframes eeBlink{0%,46%,54%,100%{transform:scaleY(1)}50%{transform:scaleY(.08)}}
    `,`<div class="eye"></div><div class="copy"><b>P1-KLS // PICKLES ONLINE</b>I HAVE REVIEWED YOUR BROWSING HISTORY.<br><br>BOLD CHOICES.<br><br>Also, this website is very nice.</div>`);
  }
  function year1887(){
    mount(`
      #${NS}{background:#261a0de3;backdrop-filter:sepia(1) contrast(.9)}
      #${NS} .old{background:#e9d5a7;color:#2f2114;border:8px double #4b3722;font-family:Georgia,serif;text-align:center}.old .k{color:#6b4d2b}.old p{color:#5a422a;font-size:17px}.old .bottle{font-size:76px}.old .stamp{display:inline-block;border:2px solid #51371d;padding:7px 10px;font-weight:800;transform:rotate(-2deg)}
    `,`<div class="card old"><div class="k">RICHMOND, VIRGINIA // ANNO DOMINI 1887</div><h2>ÜBER’S MIRACULOUS TONIC</h2><div class="bottle">⚗️</div><p>For fatigue, melancholy, unruly imagination, space piracy, guitar enthusiasm, and other modern ailments.</p><div class="stamp">THE FUTURE, NOW AVAILABLE BY THE SPOONFUL</div></div>`);
  }
  function octopus(){
    mount(`
      #${NS}{background:radial-gradient(circle at 50% 42%,rgba(221,239,255,.17),rgba(3,5,8,.92) 55%)}
      #${NS} .octo{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);width:min(92vw,900px);aspect-ratio:840/260;background:url('/uber/assets/ubercorp-wordmark-final.svg') center/contain no-repeat;filter:drop-shadow(0 0 16px rgba(223,244,255,.30)) drop-shadow(0 0 38px rgba(206,225,255,.14));animation:eeOcto .9s ease-in-out infinite alternate}
      #${NS} .msg{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);width:min(92vw,900px);color:#fff;text-align:center;font:900 clamp(18px,4vw,38px) ui-monospace,monospace;letter-spacing:.09em;text-shadow:0 0 16px #dff4ff55}
      @keyframes eeOcto{to{transform:translate(-50%,-50%) scale(1.018)}}
    `,`<div class="octo"></div><div class="msg">BRAND COMPLIANCE: 100%<br>THE TENTACLES ARE WORKING AS INTENDED</div>`);
  }
  function coffee(){
    mount(`
      #${NS}{background:#080706ed}#${NS} .cup{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:150px;animation:eeCup .18s 8 alternate}#${NS} .steam{position:absolute;left:50%;top:15%;transform:translateX(-50%);font-size:70px;color:#eee;opacity:.55;animation:eeSteam 2s infinite}#${NS} .coffee{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);color:#e5cfb2;text-align:center;font:900 14px ui-monospace,monospace;letter-spacing:.09em}@keyframes eeCup{to{transform:translate(-50%,-50%) rotate(4deg)}}@keyframes eeSteam{to{transform:translate(-50%,-40px);opacity:.08}}
    `,`<div class="steam">〰</div><div class="cup">☕</div><div class="coffee">PRODUCTIVITY SERUM<br>BREAK TIME HAS BEEN SUCCESSFULLY ELIMINATED</div>`);
  }
  function fortyTwo(){
    mount(`#${NS}{background:#02050af4}#${NS} .answer{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);font-size:min(45vw,420px);font-weight:950;line-height:.75;color:#f3f5f8;text-shadow:0 0 40px #a8c9ff55}#${NS} .ac{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);color:#9aa8bb;text-align:center;font:900 12px ui-monospace,monospace;letter-spacing:.12em;white-space:nowrap}`,`<div class="answer">42</div><div class="ac">CORPORATE ANSWER CONFIRMED<br>THE QUESTION REMAINS CLASSIFIED</div>`);
  }
  function richmond(){
    mount(`
      #${NS}{background:linear-gradient(0deg,#111b16dd,transparent 62%)}#${NS} .possum{position:absolute;left:-190px;bottom:11%;font-size:110px;animation:eePossum 5.5s linear forwards}#${NS} .possum:after{content:'RICHMOND SECTOR WILDLIFE UNIT';display:block;color:#fff;font:900 10px ui-monospace,monospace;white-space:nowrap;text-shadow:2px 2px #000}#${NS} .rva{position:absolute;right:6%;top:12%;border:2px solid #cdd5d0;color:#cdd5d0;padding:10px 14px;background:#080b09d8;font:900 11px ui-monospace,monospace;letter-spacing:.1em;transform:rotate(2deg)}@keyframes eePossum{0%{transform:translateX(0) rotate(-5deg)}50%{transform:translateX(55vw) rotate(5deg)}100%{transform:translateX(calc(100vw + 350px)) rotate(-3deg)}}
    `,`<div class="rva">EARTH NODE // RICHMOND<br>LOCAL OPERATIVE DEPLOYED</div><div class="possum">🐀</div>`);
  }
  function konami(){
    const coins=Array.from({length:24},(_,i)=>`<span style="left:${(i*43)%100}%;animation-delay:${(i%8)*.15}s">✦</span>`).join('');
    mount(`#${NS}{background:#020306ed}#${NS} .pixel{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);width:min(92vw,680px);text-align:center;color:#73ff8d;font:900 14px ui-monospace,monospace;letter-spacing:.08em;text-shadow:0 0 8px #31ff5b}.pixel b{display:block;font-size:clamp(35px,8vw,76px);margin-bottom:16px}.coin span{position:absolute;top:-40px;font-size:28px;animation:eeCoin 3s linear forwards}@keyframes eeCoin{to{transform:translateY(110vh) rotate(720deg)}}`,`<div class="pixel"><b>EXECUTIVE MODE</b>30 EXTRA COMPLIANCE POINTS HAVE BEEN ADDED.<br><br>They are imaginary.</div><div class="coin">${coins}</div>`);
  }
  const eggs={STARWARS:starWars,FORCE:starWars,DETRITUS:detritus,PICKLES:p1klz,P1KLS:p1klz,'P1-KLS':p1klz,P1KLZ:p1klz,'P1-KLZ':p1klz,'1887':year1887,OCTOPUS:octopus,COFFEE:coffee,'42':fortyTwo,RICHMOND:richmond};
  function check(value){const u=String(value||'').trim().toUpperCase();for(const [word,fn] of Object.entries(eggs)){if(u.endsWith(word)){fn();buffer='';return true}}return false}
  addEventListener('keydown',e=>{
    if(e.key==='Escape'){remove();return}
    if(e.key.length!==1)return;
    clearTimeout(clearTimer);buffer=(buffer+e.key).slice(-22);check(buffer);clearTimer=setTimeout(()=>buffer='',2400);
  });
  addEventListener('input',e=>{if(e.target&&'value' in e.target)check(e.target.value)});
  const code=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let ci=0;
  addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===code[ci]){ci++;if(ci===code.length){ci=0;konami()}}else ci=k===code[0]?1:0});
  if(reduced){document.documentElement.classList.add('ee-reduced-motion')}
})();
