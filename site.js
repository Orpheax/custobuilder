(function(){
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // emblems
  
  // ash of war: falling grey ash + a few rising embers
  const cv=document.getElementById('embers');
  if(cv&&!reduce){
    const x=cv.getContext('2d'); let W,H,A=[],E=[]; const small=innerWidth<700;
    const NA=small?55:130, NE=small?10:22;
    const size=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;}; size(); addEventListener('resize',size);
    const ash=(init)=>({x:Math.random()*W*1.2-W*.1,y:init?Math.random()*H:-12,s:Math.random()*3.2+.8,v:Math.random()*.7+.25,w:Math.random()*.5+.15,rot:Math.random()*6.3,vr:(Math.random()-.5)*.05,a:Math.random()*.45+.12,t:Math.random()*6.3,k:Math.random()});
    const emb=(init)=>({x:Math.random()*W,y:init?Math.random()*H:H+10,r:Math.random()*1.6+.5,v:Math.random()*.55+.2,d:Math.random()*6.3,a:Math.random()*.7+.3});
    for(let i=0;i<NA;i++)A.push(ash(true)); for(let i=0;i<NE;i++)E.push(emb(true));
    let wind=0,tw=0;
    (function loop(){
      x.clearRect(0,0,W,H); tw+=.004; wind=Math.sin(tw)*.35+.45;
      x.globalCompositeOperation='source-over';
      for(const p of A){ p.t+=.02; p.y+=p.v; p.x+=wind*p.w*2+Math.sin(p.t)*.3; p.rot+=p.vr;
        if(p.y>H+12||p.x>W+30){Object.assign(p,ash(false));}
        x.save(); x.translate(p.x,p.y); x.rotate(p.rot); x.globalAlpha=p.a;
        x.fillStyle=p.k>.8?'#b9a98a':(p.k>.4?'#8d8780':'#5d5853');
        x.beginPath(); x.moveTo(-p.s,-p.s*.4); x.lineTo(p.s*.2,-p.s*.9); x.lineTo(p.s,p.s*.1); x.lineTo(-p.s*.3,p.s*.8); x.closePath(); x.fill(); x.restore(); }
      x.globalAlpha=1; x.globalCompositeOperation='lighter';
      for(const p of E){ p.y-=p.v; p.d+=.012; p.x+=Math.sin(p.d)*.4+wind*.3; if(p.y<-10||p.x>W+20){Object.assign(p,emb(false));}
        const fl=.6+Math.sin(p.d*5)*.4; const g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3.4);
        g.addColorStop(0,'rgba(255,196,96,'+(p.a*fl)+')'); g.addColorStop(.4,'rgba(222,86,34,'+(p.a*fl*.5)+')'); g.addColorStop(1,'rgba(142,17,24,0)');
        x.fillStyle=g; x.beginPath(); x.arc(p.x,p.y,p.r*3.4,0,7); x.fill(); }
      requestAnimationFrame(loop);
    })();
  }
  // reveal on scroll: only elements that start below the fold are hidden, all are shown by a safety timer
  const els=[...document.querySelectorAll('.rv')];
  const vh=innerHeight;
  els.forEach(e=>{ if(e.getBoundingClientRect().top>vh*0.95) e.classList.add('pre'); else e.classList.add('in'); });
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); en.target.classList.remove('pre'); io.unobserve(en.target);} }),{rootMargin:'0px 0px -8% 0px'});
    els.forEach(e=>{ if(e.classList.contains('pre')) io.observe(e); });
  }
  setTimeout(()=>els.forEach(e=>{e.classList.add('in');e.classList.remove('pre');}),7000);
  // pointer parallax on hero emblem
  const hero=document.querySelector('.hm-hero .emb');
  if(hero&&!reduce){ addEventListener('pointermove',e=>{ const dx=(e.clientX/innerWidth-.5), dy=(e.clientY/innerHeight-.5); hero.style.transform='translate('+dx*16+'px,'+dy*10+'px) rotate('+dx*1.2+'deg)'; }); }
  // ka'tah wheel
  const KT=[
   {n:'Conservai',ph:'Your Command phase',t:'Until the end of the turn, being engaged or battle-shocked does not stop your unit starting an action, and starting an action does not stop it shooting.',fav:'Emissaries Imperatus: being selected to advance or fall back does not prevent starting an action.'},
   {n:'Calistus',ph:'Your Movement phase',t:'When your unit makes a normal, advance or fall-back move, it can move through all types of model.',fav:'Solar Watch: your unit has +2" M.'},
   {n:'Salvus',ph:'Your Shooting phase',t:'Your unit can ignore modifiers to its BS, hit rolls and wound rolls.',fav:'Aquilan Shield: ranged attacks have +6" R.'},
   {n:'Dacatarai',ph:'Start of the Fight phase',t:'Melee attacks that target an enemy unit (excluding MONSTER/VEHICLE) can re-roll hit rolls of 1.',fav:'Dread Host: an engaged enemy unit’s pile-in and consolidation moves are reduced by 2".'},
   {n:'Kaptaris',ph:'Start of the Fight phase',t:'Melee attacks that target your unit have -1 to hit rolls.',fav:'Shadowkeepers: an engaged enemy unit must take a battle-shock roll with -1.'},
   {n:'Rendax',ph:'Fight phase, when selected to fight',t:'Your unit’s melee attacks have [LETHAL HITS: MONSTER/VEHICLE].',fav:'Emperor’s Chosen: roll a D6 against an engaged MONSTER/VEHICLE for 1, D3 or 3 mortal wounds.'}];
  const wh=document.getElementById('wheel'), rd=document.getElementById('ktread');
  if(wh&&rd){
    const cx=200,cy=200,R1=88,R2=186; let g='';
    KT.forEach((k,i)=>{ const a0=(i/6)*Math.PI*2-Math.PI/2-Math.PI/6*0+0, a1=((i+1)/6)*Math.PI*2-Math.PI/2, gap=.02;
      const p=(r,a)=>(cx+Math.cos(a)*r).toFixed(1)+' '+(cy+Math.sin(a)*r).toFixed(1);
      const d='M'+p(R1,a0+gap)+' L'+p(R2,a0+gap)+' A'+R2+' '+R2+' 0 0 1 '+p(R2,a1-gap)+' L'+p(R1,a1-gap)+' A'+R1+' '+R1+' 0 0 0 '+p(R1,a0+gap)+'Z';
      const am=(a0+a1)/2, tx=cx+Math.cos(am)*(R1+R2)/2, ty=cy+Math.sin(am)*(R1+R2)/2;
      g+='<g tabindex="0" role="button" aria-label="'+k.n+'" data-i="'+i+'"><path class="seg" d="'+d+'"/><text x="'+tx.toFixed(1)+'" y="'+ty.toFixed(1)+'" text-anchor="middle" dominant-baseline="middle">'+k.n+'</text></g>'; });
    wh.innerHTML='<defs><radialGradient id="hubg"><stop offset="0" stop-color="#8e1a20"/><stop offset="1" stop-color="#1a0507"/></radialGradient></defs><circle class="spin" cx="200" cy="200" r="196" fill="none" stroke="#e6bd4f" stroke-width="1" stroke-dasharray="2 7"/>'+g+'<circle class="hub" cx="200" cy="200" r="70" fill="url(#hubg)"/><text x="200" y="196" text-anchor="middle" style="font-size:15px">Martial</text><text x="200" y="216" text-anchor="middle" style="font-size:15px">Ka’tah</text>';
    const show=i=>{ const k=KT[i]; rd.innerHTML='<h3>'+k.n+'</h3><div class="ph">'+k.ph+'</div><p>'+k.t+'</p><div class="fav"><b>Favoured effect.</b> '+k.fav+'</div>';
      wh.querySelectorAll('.seg').forEach((s,j)=>s.classList.toggle('on',j===i)); };
    wh.addEventListener('click',e=>{ const g=e.target.closest('g[data-i]'); if(g) show(+g.dataset.i); });
    wh.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ const g=e.target.closest('g[data-i]'); if(g){e.preventDefault();show(+g.dataset.i);} } });
    wh.addEventListener('pointerover',e=>{ const g=e.target.closest('g[data-i]'); if(g) show(+g.dataset.i); });
    show(4);
  }

  // announce result counts after a filter/search (screen readers)
  const live=document.getElementById('live');
  if(live){
    [['ds','ds-','datasheets'],['cx','cx-','detachments']].forEach(([id,pre,label])=>{
      const root=document.getElementById(id); if(!root) return; let t,first=true;
      new MutationObserver(()=>{ clearTimeout(t); t=setTimeout(()=>{
        if(root.offsetParent===null) return;
        const n=[...root.querySelectorAll('[id^="'+pre+'"]')].filter(e=>e.offsetParent!==null&&e.tagName==='ARTICLE').length;
        if(first){first=false;return;} live.textContent=n+' '+label+' shown';
      },350); }).observe(root,{childList:true,subtree:true});
    });
  }
})();
