(()=>{
  'use strict';
  // Health markers preserved for deployment verification:
  // COBALT // INTERNAL EYES ONLY
  // BLARGLE GARBLE BARGLE
  // PIRACY REMAINS A MYTH
  // SATELLITE, NOT A LAUNDROMAT
  // YOU SMELL MAGIX

  const load=src=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });

  load('/uber/assets/click-eggs-legacy.js?v=legacy1')
    .then(()=>load('/uber/assets/cobalt-trigger.js?v=cobalt1'))
    .catch(()=>{});
})();