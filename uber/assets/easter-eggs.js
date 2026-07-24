(()=>{
  const NS='uberEaster';
  let buffer='', timer=0, active=null;
  const removeActive=()=>{document.getElementById(NS)?.remove();document.getElementById(NS+'Style')?.remove();active=null;};
  const styleBase=`
    #${NS}{position:fixed;inset:0;z-index:2147482500;pointer-events:none;overflow:hidden;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #${NS} .ee-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,720px);padding:28px;border:1px solid #68717d;background:#080a0eea;box-shadow:0 30px 100px #000d;color:#f7f7f4}
    #${NS} .ee-kicker{font:900 10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;color:#d8e5f3}
    #${NS} .ee-title{margin:8px 0 10px;font-size:clamp(34px,8vw,78px);line-height:.9;letter-spacing:-.05em}
    #${NS} .ee-copy{color:#aab2bc;font-size:15px}
    #${NS} .ee-stamp{display:inline-block;margin-top:16px;padding:7px 10px;border:2px solid currentColor;font:900 10px ui-monospace,monospace;letter-spacing:.12em;transform:rotate(-2deg)}
    #${NS} .ee-closehint{position:absolute;right:14px;bottom:12px;color:#6f7780;font:800 8px ui-monospace,monospace;letter-spacing:.12em}
    @media(max-width:600px){#${NS} .ee-card{padding:22px}#${NS} .ee-copy{font-size:13px}}
  `;
  function mount(extraCss='', html='', ms=6200){
    removeActive();
    const s=document.createElement('style');s.id=NS+'Style';s.textContent=styleBase+extraCss;document.head.appendChild(s);
    const d=document.createElement('div');d.id=NS;d.innerHTML=html;document.body.appendChild(d);active=d;
    if(ms) setTimeout(()=>{if(active===d)removeActive()},ms);
    return d;
  }
  function jimothy(){
    mount(`
      #${NS}{background:linear-gradient(135deg,#d8d2c4cc,#8f988fcc);backdrop-filter:blur(2px)}
      #${NS} .jim-card{background:#e9e5da;color:#111;border:14px solid #dad4c6;box-shadow:0 40px 100px #0009;transform:translate(-50%,-50%) rotate(-1.2deg)}
      #${NS} .jim-photo{width:92px;height:112px;background:linear-gradient(#b9bec0,#7e8589);display:grid;place-items:center;font-size:54px;float:right;margin-left:20px;border:5px solid #fff;box-shadow:0 4px 12px #0003}
      #${NS} .jim-grid{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #222;margin-top:18px}.jim-grid div{padding:10px;border-right:1px solid #777;border-bottom:1px solid #777}.jim-grid b,.jim-grid span{display:block}.jim-grid span{font:800 9px ui-monospace,monospace;color:#5c6266}
      #${NS} .jim-meter{height:10px;background:#bbb;margin-top:6px;overflow:hidden}.jim-meter i{display:block;height:100%;width:7%;background:#111;animation:jimKpi 3s ease-in-out infinite alternate}@keyframes jimKpi{to{width:103%}}
    `,`<div class="ee-card jim-card"><div class="jim-photo">👔</div><div class="ee-kicker" style="color:#555">ÜBERCORP HUMAN RESOURCES // PERSONNEL FILE</div><div class="ee-title" style="font-size:clamp(44px,8vw,76px)">JIMOTHY</div><div class="ee-copy" style="color:#333">Employee name appears to have been entered incorrectly. HR has elected to preserve the error permanently.</div><div class="jim-grid"><div><span>JOB TITLE</span><b>Assistant to the Regional Galactic Manager</b></div><div><span>EMPLOYEE STATUS</span><b>TECHNICALLY PRESENT</b></div><div><span>PRODUCTIVITY</span><b>7%</b><div class="jim-meter"><i></i></div></div><div><span>MANAGEMENT NOTE</span><b>“Who is Jimothy?”</b></div></div><div class="ee-stamp">EMPLOYEE OF THE MINUTE</div></div>`);
  }
  function starWars(){
    const stars=Array.from({length:90},(_,i)=>`<i style="left:${(i*37)%100}%;top:${(i*61)%100}%;animation-delay:-${(i%17)/3}s"></i>`).join('');
    mount(`
      #${NS}{background:#000;perspective:480px}
      #${NS} .stars i{position:absolute;width:2px;height:2px;background:#fff;opacity:.8;animation:twinkle 1.8s infinite alternate}@keyframes twinkle{to{opacity:.18;transform:scale(.4)}}
      #${NS} .crawl{position:absolute;left:8%;right:8%;bottom:-100%;transform-origin:50% 100%;transform:rotateX(24deg);color:#ffe66b;text-align:justify;font-weight:800;font-size:clamp(20px,4vw,46px);line-height:1.35;animation:crawlUp 10s linear forwards}
      #${NS} .crawl h2{text-align:center;font-size:1.5em;margin-bottom:1em}.crawl p{margin:0 0 1.4em}
      #${NS} .sabers{position:absolute;inset:auto 8% 8% 8%;display:flex;justify-content:space-between}.saber{width:38%;height:5px;background:#eef8ff;box-shadow:0 0 8px #fff,0 0 18px currentColor,0 0 34px currentColor}.saber:first-child{color:#53d8ff;transform:rotate(12deg)}.saber:last-child{color:#ff5467;transform:rotate(-12deg)}
      @keyframes crawlUp{0%{bottom:-115%}100%{bottom:125%}}
    `,`<div class="stars">${stars}</div><div class="crawl"><h2>ÜBERCORP QUARTERLY REPORT<br>EPISODE XXV</h2><p>It is a period of aggressive vertical integration. Rebel musicians, operating from a suspicious touring vessel, have disrupted several perfectly profitable sectors.</p><p>Corporate security insists there is no galactic conflict. The enormous laser invoices suggest otherwise.</p><p>Remain calm. Continue consuming. The quarterly numbers are strong with this one.</p></div><div class="sabers"><span class="saber"></span><span class="saber"></span></div>`,10500);
  }
  function detritus(){
    mount(`
      #${NS}{background:linear-gradient(180deg,transparent,#05070bcf)}
      #${NS} .ship{position:absolute;left:-260px;top:34%;font-size:120px;filter:drop-shadow(0 15px 10px #000);animation:shipFly 6s cubic-bezier(.2,.7,.3,1) forwards}
      #${NS} .ship:after{content:'♫  ♫  ♫';position:absolute;left:-20px;top:90px;color:#ff4052;font:900 28px ui-monospace,monospace;letter-spacing:22px;white-space:nowrap;animation:notes 1s infinite alternate}
      #${NS} .warning{position:absolute;left:50%;top:12%;transform:translateX(-50%) rotate(-2deg);padding:12px 18px;border:3px solid #ff4052;color:#ff4052;background:#07080be8;font:900 clamp(16px,4vw,34px) ui-monospace,monospace;letter-spacing:.08em;text-align:center}
      @keyframes shipFly{0%{transform:translate(0,100px) rotate(-8deg)}45%{transform:translate(60vw,-40px) rotate(5deg)}100%{transform:translate(calc(100vw + 420px),40px) rotate(-2deg)}}@keyframes notes{to{transform:translateY(-16px);opacity:.35}}
    `,`<div class="warning">UNAUTHORIZED VESSEL DETECTED<br>DETRITUS // EXTREMELY MUSICAL</div><div class="ship">🛸</div>`);
  }
  function p1klz(){
    mount(`
      #${NS}{background:radial-gradient(circle at 50% 45%,#0b2f5bcc,#02050ae8)}
      #${NS} .eye{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);width:180px;height:180px;border-radius:50%;border:18px solid #202833;background:#061426;box-shadow:0 0 40px #4ca8ff,0 0 110px #0d4d99 inset;display:grid;place-items:center}
      #${NS} .eye:after{content:'';width:56px;height:56px;border-radius:50%;background:#bce9ff;box-shadow:0 0 16px #fff,0 0 40px #4ca8ff;animation:blinkEye 2.2s infinite}
      #${NS} .ai-copy{position:absolute;left:50%;top:68%;transform:translateX(-50%);width:min(88vw,720px);text-align:center;color:#cfe8ff;font:800 14px ui-monospace,monospace;letter-spacing:.08em}.ai-copy b{display:block;font-size:clamp(25px,5vw,50px);color:#fff;margin-bottom:10px}
      @keyframes blinkEye{0%,46%,54%,100%{transform:scaleY(1)}50%{transform:scaleY(.08)}}
    `,`<div class="eye"></div><div class="ai-copy"><b>P1KLZ ONLINE</b>I HAVE REVIEWED YOUR BROWSING HISTORY.<br><br>BOLD CHOICES.<br><br>Also, this website is very nice.</div>`);
  }
  function year1887(){
    mount(`
      #${NS}{background:#261a0ddd;backdrop-filter:sepia(1) contrast(.9)}
      #${NS} .old{background:#e9d5a7;color:#2f2114;border:8px double #4b3722;font-family:Georgia,serif;text-align:center;box-shadow:0 30px 90px #000b}.old .ee-kicker{color:#6b4d2b}.old .ee-title{font-family:Georgia,serif;letter-spacing:-.03em}.old .ee-copy{color:#5a422a;font-size:17px}.old hr{border:0;border-top:2px solid #5c4329;margin:20px 0}.old .bottle{font-size:76px;filter:sepia(1)}
    `,`<div class="ee-card old"><div class="ee-kicker">RICHMOND, VIRGINIA // ANNO DOMINI 1887</div><div class="ee-title">ÜBER’S MIRACULOUS TONIC</div><div class="bottle">⚗️</div><hr><div class="ee-copy">For fatigue, melancholy, unruly imagination, space piracy, guitar enthusiasm, and other modern ailments.</div><div class="ee-stamp">THE FUTURE, NOW AVAILABLE BY THE SPOONFUL</div></div>`);
  }
  function octopus(){
    document.body.classList.add('octo-overdrive');
    const d=mount(`
      #${NS}{background:radial-gradient(circle at 50% 35%,rgba(225,241,255,.14),transparent 45%)}
      #${NS} .big-octo{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:min(72vw,620px);aspect-ratio:1;background:url('/uber/assets/ubercorp-octopus-metallic.svg') center/contain no-repeat;filter:drop-shadow(0 0 30px #dff4ff66);animation:octoBeat .8s ease-in-out infinite alternate}
      #${NS} .octo-msg{position:absolute;left:50%;bottom:8%;transform:translateX(-50%);color:#fff;font:900 clamp(18px,4vw,38px) ui-monospace,monospace;letter-spacing:.1em;text-align:center;text-shadow:0 0 18px #dff4ff}
      @keyframes octoBeat{to{transform:translate(-50%,-50%) scale(1.035);filter:drop-shadow(0 0 50px #effaffaa)}}
    `,`<div class="big-octo"></div><div class="octo-msg">BRAND COMPLIANCE: 100%<br>THE TENTACLES ARE WORKING AS INTENDED</div>`);
    setTimeout(()=>document.body.classList.remove('octo-overdrive'),6300);
  }
  function coffee(){
    mount(`
      #${NS}{background:#080706e8}
      #${NS} .cup{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:150px;animation:cupShake .18s 8 alternate}.cup:before{content:'PRODUCTIVITY SERUM';position:absolute;left:50%;top:-42px;transform:translateX(-50%);white-space:nowrap;color:#d7b185;font:900 12px ui-monospace,monospace;letter-spacing:.16em}
      #${NS} .steam{position:absolute;left:50%;top:15%;transform:translateX(-50%);font-size:70px;color:#eee;opacity:.55;animation:steamUp 2s infinite}.coffee-msg{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);color:#e5cfb2;text-align:center;font:900 14px ui-monospace,monospace;letter-spacing:.09em}
      @keyframes cupShake{to{transform:translate(-50%,-50%) rotate(4deg)}}@keyframes steamUp{to{transform:translate(-50%,-40px);opacity:.08}}
    `,`<div class="steam">〰</div><div class="cup">☕</div><div class="coffee-msg">CAFFEINE LEVEL: CORPORATE<br>BREAK TIME HAS BEEN SUCCESSFULLY ELIMINATED</div>`);
  }
  function fortyTwo(){
    mount(`
      #${NS}{background:#02050af2}.answer{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);font-size:min(45vw,420px);font-weight:950;line-height:.75;color:#f3f5f8;text-shadow:0 0 40px #a8c9ff55}.answer-copy{position:absolute;left:50%;bottom:10%;transform:translateX(-50%);color:#9aa8bb;text-align:center;font:900 12px ui-monospace,monospace;letter-spacing:.12em;white-space:nowrap}
    `,`<div class="answer">42</div><div class="answer-copy">CORPORATE ANSWER CONFIRMED<br>THE QUESTION REMAINS CLASSIFIED</div>`);
  }
  function richmond(){
    mount(`
      #${NS}{background:linear-gradient(0deg,#111b16cc,transparent 62%)}
      #${NS} .possum{position:absolute;left:-190px;bottom:11%;font-size:110px;animation:possumRun 5.5s linear forwards}.possum:after{content:'RICHMOND SECTOR WILDLIFE UNIT';display:block;font:900 10px ui-monospace,monospace;letter-spacing:.1em;color:#fff;white-space:nowrap;text-shadow:2px 2px #000}
      #${NS} .rva{position:absolute;right:6%;top:12%;border:2px solid #cdd5d0;color:#cdd5d0;padding:10px 14px;background:#080b09d8;font:900 11px ui-monospace,monospace;letter-spacing:.1em;transform:rotate(2deg)}
      @keyframes possumRun{0%{transform:translateX(0) rotate(-5deg)}50%{transform:translateX(55vw) rotate(5deg)}100%{transform:translateX(calc(100vw + 350px)) rotate(-3deg)}}
    `,`<div class="rva">EARTH NODE // RICHMOND<br>LOCAL OPERATIVE DEPLOYED</div><div class="possum">🐀</div>`);
  }
  function konami(){
    mount(`
      #${NS}{background:#020306e8}.pixel{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);width:min(92vw,680px);text-align:center;color:#73ff8d;font:900 14px ui-monospace,monospace;letter-spacing:.08em;text-shadow:0 0 8px #31ff5b}.pixel b{display:block;font-size:clamp(35px,8vw,76px);margin-bottom:16px}.coin-rain span{position:absolute;top:-40px;font-size:28px;animation:coinFall 3s linear forwards}@keyframes coinFall{to{transform:translateY(110vh) rotate(720deg)}}
    `,`<div class="pixel"><b>EXECUTIVE MODE</b>30 EXTRA COMPLIANCE POINTS HAVE BEEN ADDED.<br><br>They are imaginary.</div><div class="coin-rain">${Array.from({length:24},(_,i)=>`<span style="left:${(i*43)%100}%;animation-delay:${(i%8)*.15}s">✦</span>`).join('')}</div>`);
  }
  const eggs={JIMOTHY:jimothy,STARWARS:starWars,FORCE:starWars,DETRITUS:detritus,P1KLZ:p1klz,'P1-KLZ':p1klz,'1887':year1887,OCTOPUS:octopus,COFFEE:coffee,'42':fortyTwo,RICHMOND:richmond};
  function checkText(v){
    const u=String(v||'').trim().toUpperCase();
    for(const [word,fn] of Object.entries(eggs)) if(u.endsWith(word)){fn();buffer='';return true}
    return false;
  }
  addEventListener('keydown',e=>{
    if(e.key==='Escape'){removeActive();return}
    if(e.key.length!==1)return;
    clearTimeout(timer);buffer=(buffer+e.key).slice(-20);checkText(buffer);timer=setTimeout(()=>buffer='',2400);
  });
  addEventListener('input',e=>{if(e.target&&('value' in e.target))checkText(e.target.value)});
  const code=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let ci=0;
  addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===code[ci]){ci++;if(ci===code.length){ci=0;konami()}}else ci=k===code[0]?1:0});
})();