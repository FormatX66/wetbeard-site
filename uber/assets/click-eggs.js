(()=>{
  'use strict';
  const NS='uberClickEgg';
  const state=new WeakMap();
  const remove=()=>{document.getElementById(NS)?.remove();document.getElementById(NS+'Style')?.remove();};
  const base=`
    #${NS}{position:fixed;inset:0;z-index:2147483200;background:rgba(2,4,7,.91);display:grid;place-items:center;padding:18px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #${NS} .box{position:relative;width:min(92vw,720px);padding:52px 24px 24px;border:1px solid #65707b;background:linear-gradient(145deg,#0b0f14f7,#05070af7);color:#f5f7f9;box-shadow:0 35px 110px #000e}
    #${NS} .k{font:900 10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;color:#9eabb6}
    #${NS} h2{font-size:clamp(34px,7vw,68px);line-height:.9;letter-spacing:-.05em;margin:10px 0 16px}
    #${NS} p{color:#b1bac4;line-height:1.55;margin:0;max-width:62ch}
    #${NS} .stamp{display:inline-block;margin-top:18px;padding:7px 10px;border:2px solid currentColor;font:900 10px ui-monospace,monospace;letter-spacing:.1em;transform:rotate(-1deg)}
    #${NS} .x{position:absolute;right:0;top:0;border:0;border-left:1px solid #65707b;border-bottom:1px solid #65707b;background:#11161c;color:#fff;width:42px;height:42px;font:900 20px/42px ui-monospace,monospace;cursor:pointer}
    #${NS}.blue .box{border-color:#466f91;box-shadow:0 35px 110px #000e,0 0 55px #1d6daa22}#${NS}.blue h2{color:#c8eaff}
    #${NS}.red .box{border-color:#9b3948}#${NS}.red h2{color:#ff7d8d}
    #${NS}.gold .box{border-color:#8a7045}#${NS}.gold h2{color:#f2d7a0}
    #${NS}.green .box{border-color:#427a58}#${NS}.green h2{color:#9ee6b8}
    @media(max-width:600px){#${NS} .box{padding:50px 18px 20px}#${NS} p{font-size:14px}}
  `;
  function show(theme,kicker,title,copy,stamp){
    remove();
    const s=document.createElement('style');s.id=NS+'Style';s.textContent=base;document.head.appendChild(s);
    const d=document.createElement('div');d.id=NS;d.className=theme||'';
    d.innerHTML=`<div class="box"><button class="x" type="button" aria-label="Close">×</button><div class="k">${kicker}</div><h2>${title}</h2><p>${copy}</p>${stamp?`<div class="stamp">${stamp}</div>`:''}</div>`;
    document.body.appendChild(d);
    d.querySelector('.x')?.addEventListener('click',remove);
  }
  addEventListener('keydown',e=>{if(e.key==='Escape')remove()});

  function multi(el,count,fn,windowMs=2600){
    if(!el)return;
    el.style.cursor='pointer';
    el.addEventListener('click',()=>{
      const now=Date.now();
      let s=state.get(el)||{n:0,t:now};
      if(now-s.t>windowMs)s={n:0,t:now};
      s.n++;s.t=now;state.set(el,s);
      if(s.n>=count){state.set(el,{n:0,t:now});fn();}
    });
  }
  function firstByText(selector,needle){
    return [...document.querySelectorAll(selector)].find(el=>(el.textContent||'').toUpperCase().includes(needle.toUpperCase()));
  }

  function bind(){
    const cobaltTrigger=firstByText('.brand small,header small','ORDER');
    if(cobaltTrigger){
      cobaltTrigger.style.touchAction='manipulation';
      multi(cobaltTrigger,8,()=>show('blue','COBALT // INTERNAL EYES ONLY','THE BLUE BOTTLE PROTOCOL','The public company sells products. Cobalt keeps a much older promise. Albrecht Über named the inner circle for the cobalt-blue medicine bottles that carried his patent remedies—and entrusted it with the continuing search for the true source of übergeist.','PUBLIC HISTORY: REDACTED'),8000);
    }

    const orb=document.querySelector('.orb,.octo-orb');
    multi(orb,3,()=>show('green','DETRITUS BRIDGE // TRANSLATION BUFFER','BLARGLE GARBLE BARGLE','Bridgebot confirms it followed the Captain’s instructions exactly. The destination remains unknown. Parrot would like everyone to stop giving the navigation system vague emotional commands.','ROUTE QUALITY: TECHNICALLY COMPLIANT'));

    const pirates=firstByText('.metrics div,.metric','CONFIRMED PIRATES');
    multi(pirates,2,()=>show('red','NEWSMÖBIUS // SPONSORED CORRECTION','PIRACY REMAINS A MYTH','Reports of a League of Space Pirates are unsubstantiated. Please ignore the touring vessel, the guitar riffs, and any suspiciously catchy anti-corporate messaging. This correction is brought to you by Xqwx Blue Shift. You will drink it.','NEWS + BEVERAGE SYNERGY'));

    const history=document.querySelector('#history .timeline > div,#history .archive-card');
    multi(history,2,()=>show('gold','ARCHIVE 1887 // UNAUTHORIZED FOOTNOTE','THE MIRACLE ACTUALLY WORKED','Über’s Patented Snake Oil Compound was unusual for one inconvenient reason: it did what the advertisement promised. The secret ingredient was übergeist. Corporate Legal requests that you forget this footnote immediately.','MINOR SIDE EFFECTS APPLY'));

    const threat=document.querySelector('#security .threat-card,#security figure,.threat-card');
    multi(threat,3,()=>show('red','SECURITY FOOTAGE // CREW IDENTIFICATION','THEY’RE A BAND!','Rusty has once again helpfully disclosed operational information while Captain Orlok performs the universal hand-across-the-throat signal for “please stop talking.” Rusty has returned the gesture and added a thumbs-up.','OPSEC TRAINING: FAILED SUCCESSFULLY'));

    const ticker=document.querySelector('.ticker');
    multi(ticker,2,()=>show('blue','P1-KLS CULTURAL CACHE // 20TH CENTURY OVERFLOW','I WANT MY MTV','P1-KLS spent a century receiving Übercorp feeds with a hard drive born in 1979. The resulting personality is less “advanced intelligence” and more “every television catchphrase at once.”','TOUGH CROWD'));

    const footerBrand=firstByText('.footer b,.footer strong,footer b,footer strong','ÜBERCORP');
    multi(footerBrand,4,()=>show('gold','MAXMILLION’S DEN // CUSTOMER EXPERIENCE','YOU SMELL MAGIX','The casino’s copyrighted scent is engineered to trigger warm childhood nostalgia and keep customers inside. Some guests describe the effect as comforting. Others describe it as rancid oil. Both responses are billable.','MEMORY™ IS A SERVICE'));

    const online=document.querySelector('.utility .online');
    multi(online,3,()=>show('green','ADVERTISING BOT // METADATA DEEPDIVE','AWW. IT KNOWS TOO MUCH.','Übercorp advertising bots are designed to be aggressively adorable while they scan your metadata and recommend products you did not know you had already agreed to need.','WE MAKE IT. YOU BUY IT.'));

    const citizen=firstByText('.portal,.console,.panel','COMPLIANCE');
    multi(citizen,5,()=>show('blue','P1-KLS // MAINTENANCE DISPUTE','I’M A SATELLITE, NOT A LAUNDROMAT','Rusty insists the items fit perfectly in the exhaust port. P1-KLS disputes both the maintenance procedure and the implied job description. Corporate Facilities has declined to mediate.','LAUNDRY TICKET: CLOSED'));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();