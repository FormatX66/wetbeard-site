(()=>{
  const q=s=>document.querySelector(s);
  const form=q('#labForm'),prompt=q('#prompt'),go=q('#generate'),status=q('#status'),result=q('#result'),frame=q('#preview'),summary=q('#summary'),files=q('#files'),submit=q('#submit');
  let currentId='';
  let visitor=localStorage.getItem('ubercorpLabVisitor');
  if(!visitor){visitor=(crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36));localStorage.setItem('ubercorpLabVisitor',visitor)}
  const setStatus=(text,type='')=>{status.textContent=text;status.className='status'+(type?' '+type:'')};
  const previewPage=page=>{if(!currentId)return;frame.src='/uber/api/lab-preview.php?id='+encodeURIComponent(currentId)+'&page='+encodeURIComponent(page);document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page))};
  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>previewPage(b.dataset.page)));
  form.addEventListener('submit',async e=>{
    e.preventDefault();const text=prompt.value.trim();if(!text)return;
    go.disabled=true;submit.disabled=true;result.classList.remove('show');setStatus('CONSULTING THE CORPORATE IMPROVEMENT ALGORITHM…');
    try{
      const r=await fetch('/uber/api/lab-create.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:text,visitor})});
      const d=await r.json();
      if(!r.ok||!d.ok)throw new Error(d.message||'Generation failed.');
      currentId=d.id;summary.textContent=d.summary;files.textContent='CHANGED: '+(d.changed_files?.join(' • ')||'none');result.classList.add('show');submit.disabled=false;previewPage('index.html');setStatus('SANDBOX '+currentId.toUpperCase()+' CREATED. PRODUCTION REMAINS UNHARMED.','good');
    }catch(err){setStatus(err.message||'The improvement algorithm refused to improve.','bad')}finally{go.disabled=false}
  });
  submit.addEventListener('click',async()=>{
    if(!currentId)return;submit.disabled=true;setStatus('SUBMITTING TO ÜBERCORP CENTRAL AUTHORITY…');
    try{const r=await fetch('/uber/api/lab-submit.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:currentId})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.message||'Submission failed.');setStatus(d.message,'good');submit.textContent='SUBMITTED'}catch(err){setStatus(err.message,'bad');submit.disabled=false}
  });
})();
