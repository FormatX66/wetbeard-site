function dispatchHotspotClick(polygon){
  polygon.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
}

function initInteractionPolish(){
  const hint=document.querySelector('#hint');
  const hotspots=document.querySelector('#hotspots');
  const readout=document.querySelector('#readout');
  const modal=document.querySelector('#modal');
  const close=document.querySelector('#close');
  const title=document.querySelector('#title');
  const actions=document.querySelector('#actions');
  if(!hint||!hotspots||!readout||!modal||!close||!title||!actions){setTimeout(initInteractionPolish,50);return}

  readout.setAttribute('aria-live','polite');
  readout.setAttribute('aria-atomic','true');
  hotspots.setAttribute('role','group');
  hotspots.setAttribute('aria-label','Interactive room objects');
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','title');
  close.setAttribute('aria-label','Close information panel');

  let restoreText=readout.textContent||'';
  let lastTrigger=null;

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
  const polygons=()=>[...hotspots.querySelectorAll('polygon')];
  const moveFocus=(current,key)=>{
   const items=polygons();
   if(!items.length)return;
   const index=Math.max(0,items.indexOf(current));
   let next=index;
   if(key==='ArrowRight'||key==='ArrowDown')next=(index+1)%items.length;
   if(key==='ArrowLeft'||key==='ArrowUp')next=(index-1+items.length)%items.length;
   if(key==='Home')next=0;
   if(key==='End')next=items.length-1;
   items[next].focus();
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
  hotspots.addEventListener('click',event=>{
   const polygon=event.target.closest?.('polygon');
   if(polygon)lastTrigger=polygon;
  },true);
  hotspots.addEventListener('keydown',event=>{
   const polygon=event.target.closest?.('polygon');
   if(!polygon)return;
   if(event.key===' '){
    event.preventDefault();
    lastTrigger=polygon;
    dispatchHotspotClick(polygon);
    return;
   }
   if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();
    moveFocus(polygon,event.key);
   }
  });

  const focusModal=()=>{
   const target=actions.querySelector('button,[href],[tabindex]:not([tabindex="-1"])')||close;
   target.focus();
  };
  new MutationObserver(()=>{
   if(modal.classList.contains('show'))queueMicrotask(focusModal);
   else if(lastTrigger?.isConnected)queueMicrotask(()=>lastTrigger.focus());
  }).observe(modal,{attributes:true,attributeFilter:['class']});

  modal.addEventListener('click',event=>{if(event.target===modal)close.click()});
  document.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   if(modal.classList.contains('show'))close.click();
   else if(document.body.classList.contains('reveal'))reveal(false);
  });
}

if(document.readyState==='complete')queueMicrotask(initInteractionPolish);
else window.addEventListener('load',initInteractionPolish,{once:true});