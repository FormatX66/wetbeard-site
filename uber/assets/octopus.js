(()=>{
  const SVG_NS='http://www.w3.org/2000/svg';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let svg=null, traces=[], nodes=[], pulses=[], raf=0, resizeTimer=0;

  const el=(name,attrs={})=>{
    const n=document.createElementNS(SVG_NS,name);
    Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));
    return n;
  };

  function pageHeight(){
    return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,window.innerHeight);
  }

  function pageWidth(){
    return Math.max(document.documentElement.clientWidth,window.innerWidth||0);
  }

  function logoOrigin(){
    const logo=document.querySelector('.brand-octo');
    if(!logo) return {x:52,y:88};
    const r=logo.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.bottom+window.scrollY-1};
  }

  function sectionBands(){
    return [...document.querySelectorAll('main>section')].map((s,i)=>{
      const r=s.getBoundingClientRect();
      const top=r.top+window.scrollY;
      return {top,bottom:top+r.height,index:i};
    });
  }

  function laneSet(w){
    if(w<560) return [.05,.12,.2,.31,.69,.8,.88,.95].map(v=>w*v);
    if(w<900) return [.04,.1,.18,.28,.72,.82,.9,.96].map(v=>w*v);
    return [.035,.085,.15,.235,.765,.85,.915,.965].map(v=>w*v);
  }

  function clampX(x,w){ return Math.max(10,Math.min(w-10,x)); }

  function circuitPath(index,w,h,origin,bands,lanes){
    const left=index<4;
    const baseLane=lanes[index];
    const innerLane=left
      ? Math.min(w*.38,baseLane+w*(.08+(index%2)*.035))
      : Math.max(w*.62,baseLane-w*(.08+(index%2)*.035));
    const farLane=left
      ? Math.min(w*.46,innerLane+w*(.07+(index%3)*.02))
      : Math.max(w*.54,innerLane-w*(.07+(index%3)*.02));

    let d=`M ${origin.x.toFixed(1)} ${origin.y.toFixed(1)}`;
    let y=origin.y+32+index*5;
    d+=` V ${y.toFixed(1)} H ${clampX(baseLane,w).toFixed(1)}`;

    bands.forEach((b,j)=>{
      const entry=Math.max(y+20,b.top+30+(index%3)*11);
      const mid=Math.min(b.bottom-38,entry+Math.max(80,(b.bottom-b.top)*(.36+((index+j)%3)*.08)));
      const exit=Math.max(mid+30,b.bottom-24-(index%2)*12);
      const laneA=((j+index)%2===0)?innerLane:baseLane;
      const laneB=((j+index)%3===0)?farLane:baseLane;
      d+=` V ${entry.toFixed(1)} H ${clampX(laneA,w).toFixed(1)} V ${mid.toFixed(1)} H ${clampX(laneB,w).toFixed(1)} V ${exit.toFixed(1)}`;
      y=exit;
    });

    d+=` V ${(h-45-index*6).toFixed(1)}`;
    return d;
  }

  function addNode(group,x,y,r=4){
    const c=el('circle',{cx:x,cy:y,r,class:'circuit-node'});
    group.appendChild(c);
    nodes.push({el:c,y:Number(y)});
    return c;
  }

  function build(){
    document.body.classList.add('octo-enabled');
    svg?.remove();
    traces=[];nodes=[];pulses=[];

    const w=pageWidth(),h=pageHeight(),origin=logoOrigin(),bands=sectionBands(),lanes=laneSet(w);
    svg=el('svg',{id:'octopusCircuit',class:'octopus-circuit','aria-hidden':'true',viewBox:`0 0 ${w} ${h}`,preserveAspectRatio:'none'});
    svg.style.height=`${h}px`;

    const defs=el('defs');
    const glow=el('filter',{id:'octoGlow',x:'-50%',y:'-50%',width:'200%',height:'200%'});
    glow.innerHTML='<feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
    defs.appendChild(glow);svg.appendChild(defs);

    for(let i=0;i<8;i++){
      const g=el('g',{'data-tentacle':i});
      const d=circuitPath(i,w,h,origin,bands,lanes);
      const base=el('path',{d,class:'trace-base'});
      const live=el('path',{d,class:'trace-live'});
      const hot=el('path',{d,class:'trace-hot'});
      g.append(base,live,hot);
      svg.appendChild(g);

      const len=Math.max(1,live.getTotalLength());
      live.style.strokeDasharray=`${len}`;
      live.style.strokeDashoffset=`${len}`;
      hot.style.strokeDasharray=i%2?'10 19':'5 15';
      traces.push({live,hot,len,index:i});

      bands.forEach((b,j)=>{
        if((j+i)%2!==0) return;
        const targetLen=len*Math.min(.96,.08+(j+1)/(bands.length+1)*.82+(i%3)*.012);
        const p=live.getPointAtLength(targetLen);
        addNode(g,p.x,p.y,window.innerWidth<560?3.2:4);
      });

      if(i%2===0&&!reduced){
        const pulse=el('circle',{r:window.innerWidth<560?2.8:3.5,class:'data-pulse'});
        g.appendChild(pulse);
        pulses.push({el:pulse,path:live,len,index:i});
      }
    }

    document.body.insertBefore(svg,document.body.firstChild);
    update();
  }

  function update(){
    raf=0;
    if(!svg) return;
    const h=pageHeight();
    const max=Math.max(1,h-window.innerHeight);
    const progress=Math.max(0,Math.min(1,window.scrollY/max));
    const viewMid=window.scrollY+window.innerHeight*.5;

    traces.forEach(t=>{
      const lead=Math.min(1,progress*1.08+t.index*.018+.06);
      t.live.style.strokeDashoffset=String(t.len*(1-lead));
      t.hot.style.strokeDashoffset=String((t.index%2?-1:1)*progress*520-t.index*17);
      const sway=(progress-.5)*(t.index<4?1:-1)*(5+t.index%4*2);
      t.hot.style.transform=`translateX(${sway.toFixed(1)}px)`;
    });

    nodes.forEach(n=>{
      const dist=Math.abs(n.y-viewMid);
      n.el.classList.toggle('active',dist<window.innerHeight*.34);
      n.el.setAttribute('r',dist<window.innerHeight*.34?(window.innerWidth<560?4.1:5.2):(window.innerWidth<560?3.2:4));
    });

    if(!reduced){
      pulses.forEach(p=>{
        const phase=(progress*.92+p.index*.087)%1;
        const point=p.path.getPointAtLength(p.len*phase);
        p.el.setAttribute('cx',point.x.toFixed(1));
        p.el.setAttribute('cy',point.y.toFixed(1));
      });
      const logo=document.querySelector('.brand-octo');
      if(logo){
        const pulse=1+Math.sin(progress*Math.PI*12)*.018;
        logo.style.transform=`scale(${pulse.toFixed(3)}) rotate(${((progress-.5)*3).toFixed(2)}deg)`;
      }
    }
  }

  function schedule(){ if(!raf) raf=requestAnimationFrame(update); }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(build,180)},{passive:true});
  addEventListener('load',()=>setTimeout(build,60),{once:true});
  if(document.readyState==='complete') setTimeout(build,0);
  else setTimeout(build,100);
})();