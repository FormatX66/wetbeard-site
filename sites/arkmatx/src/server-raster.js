const base=import.meta.env.BASE_URL || '/';
const serverSrc=`${base}scenes/servers-render.jpg`;

function applyServerRaster(){
 const location=document.querySelector('#location');
 const background=document.querySelector('#sceneBg');
 if(!location||!background)return;
 const inServerRoom=(location.textContent||'').startsWith('SERVERS');
 if(inServerRoom&&!background.src.includes('servers-render.jpg'))background.src=serverSrc;
}

const observer=new MutationObserver(applyServerRaster);
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src']});
addEventListener('DOMContentLoaded',applyServerRaster,{once:true});
queueMicrotask(applyServerRaster);
