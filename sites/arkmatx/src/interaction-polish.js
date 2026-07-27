function initInteractionPolish(){
 const hint=document.querySelector('#hint');
 const hotspots=document.querySelector('#hotspots');
 const readout=document.querySelector('#readout');
 const modal=document.querySelector('#modal');
 const close=document.querySelector('#close');
 if(!hint||!hotspots||!readout||!modal||!close){setTimeout(initInteractionPolish,50);return}

 let restoreText=readout.textContent||'';
 const reveal=enabled=>{
  document.body.classList.toggle('reveal',enabled);
  hint.setAttribute('aria-pressed',String(enabled));
  hint.setAttribute('aria-label',enabled?'hide clickable areas':'show clickable areas');
 };
 const describe=polygon=>{
  if(!polygon)return;
  if(!readout.textContent.startsWith('TARGET //'))restoreText=readout.textContent;
  readout.textContent=`TARGET // ${polygon.getAttribute('aria-label')||'UNKNOWN'}`;
 };
 const restore=()=>{
  if(readout.textContent.startsWith('TARGET //'))readout.textContent=restoreText;
 };

 hint.onpointerdown=null;
 hint.onpointerup=null;
 hint.onpointerleave=null;
 hint.setAttribute('aria-pressed','false');
 hint.title='Toggle clickable areas';
 hint.onclick=event=>{event.preventDefault();reveal(!document.body.classList.contains('reveal'))};

 hotspots.addEventListener('pointerover',event=>describe(event.target.closest?.('polygon')));
 hotspots.addEventListener('pointerout',event=>{
  const from=event.target.closest?.('polygon');
  const to=event.relatedTarget?.closest?.('polygon');
  if(from&&from!==to)restore();
 });
 hotspots.addEventListener('focusin',event=>describe(event.target.closest?.('polygon')));
 hotspots.addEventListener('focusout',event=>{
  if(event.target.closest?.('polygon'))restore();
 });

 modal.addEventListener('click',event=>{if(event.target===modal)close.click()});
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  if(modal.classList.contains('show'))close.click();
  else if(document.body.classList.contains('reveal'))reveal(false);
 });
}

if(document.readyState==='complete')queueMicrotask(initInteractionPolish);
else window.addEventListener('load',initInteractionPolish,{once:true});
