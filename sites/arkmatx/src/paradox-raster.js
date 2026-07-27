const paradoxPoints={
 'TERMINAL A':'20,90 360,90 360,750 20,750',
 'TERMINAL B':'360,80 820,80 820,770 360,770',
 'TERMINAL C':'820,45 1270,45 1270,790 820,790',
 'MAINTENANCE CHANNEL':'1270,110 1595,110 1595,820 1270,820',
 'WORKSHOP':'20,760 285,760 285,895 20,895',
 'SERVER CLOSET':'650,760 970,760 970,895 650,895'
};

function applyParadoxHotspots(){
 const location=document.querySelector('#location');
 const hotspots=document.querySelector('#hotspots');
 if(!location||!hotspots)return;
 if(!(location.textContent||'').startsWith('PARADOX'))return;
 hotspots.querySelectorAll('polygon').forEach(p=>{
  const points=paradoxPoints[p.getAttribute('aria-label')];
  if(points&&p.getAttribute('points')!==points)p.setAttribute('points',points);
 });
}

const observer=new MutationObserver(applyParadoxHotspots);
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['points']});
addEventListener('DOMContentLoaded',applyParadoxHotspots,{once:true});
queueMicrotask(applyParadoxHotspots);
