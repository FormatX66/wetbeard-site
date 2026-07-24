(()=>{
  'use strict';
  const status=document.querySelector('.utility .online');
  if(!status)return;

  const phrase='STILL IMPROVING YOU';
  const text=status.textContent||'';
  const start=text.toUpperCase().indexOf(phrase);
  if(start<0)return;

  const before=text.slice(0,start);
  const target=text.slice(start,start+phrase.length);
  const after=text.slice(start+phrase.length);
  status.textContent='';
  status.append(document.createTextNode(before));
  const hot=document.createElement('span');
  hot.textContent=target;
  hot.style.cursor='pointer';
  hot.style.touchAction='manipulation';
  status.append(hot,document.createTextNode(after));

  let taps=0,last=0;
  hot.addEventListener('click',e=>{
    e.stopPropagation();
    const now=Date.now();
    if(now-last>8000)taps=0;
    last=now;
    taps++;
    if(taps<8)return;
    taps=0;

    document.getElementById('uberCobaltPatch')?.remove();
    const d=document.createElement('div');
    d.id='uberCobaltPatch';
    d.style.cssText='position:fixed;inset:0;z-index:2147483300;background:rgba(2,4,7,.93);display:grid;place-items:center;padding:18px;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
    d.innerHTML='<div style="position:relative;width:min(92vw,720px);padding:52px 24px 24px;border:1px solid #466f91;background:linear-gradient(145deg,#0b0f14f7,#05070af7);color:#f5f7f9;box-shadow:0 35px 110px #000e,0 0 55px #1d6daa22"><button type="button" aria-label="Close" style="position:absolute;right:0;top:0;border:0;border-left:1px solid #65707b;border-bottom:1px solid #65707b;background:#11161c;color:#fff;width:42px;height:42px;font:900 20px/42px ui-monospace,monospace;cursor:pointer">×</button><div style="font:900 10px ui-monospace,monospace;letter-spacing:.16em;color:#9eabb6">COBALT // INTERNAL EYES ONLY</div><h2 style="font-size:clamp(34px,7vw,68px);line-height:.9;letter-spacing:-.05em;margin:10px 0 16px;color:#c8eaff">THE BLUE BOTTLE PROTOCOL</h2><p style="color:#b1bac4;line-height:1.55;margin:0">The public company sells products. Cobalt keeps a much older promise. Albrecht Über named the inner circle for the cobalt-blue medicine bottles that carried his patent remedies—and entrusted it with the continuing search for the true source of übergeist.</p><div style="display:inline-block;margin-top:18px;padding:7px 10px;border:2px solid #c8eaff;color:#c8eaff;font:900 10px ui-monospace,monospace;letter-spacing:.1em;transform:rotate(-1deg)">PUBLIC HISTORY: REDACTED</div></div>';
    document.body.appendChild(d);
    d.querySelector('button')?.addEventListener('click',()=>d.remove());
  });
})();