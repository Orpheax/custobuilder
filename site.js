(function(){
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // emblems
  document.querySelectorAll('[data-emb]').forEach(el=>{ el.innerHTML=Emblem({cls:el.dataset.emb}); });
  // embers
  const cv=document.getElementById('embers');
  if(cv&&!reduce){
    const x=cv.getContext('2d'); let W,H,P=[]; const N=innerWidth<700?28:60;
    const size=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;}; size(); addEventListener('resize',size);
    const mk=(init)=>({x:Math.random()*W,y:init?Math.random()*H:H+10,r:Math.random()*1.8+.4,v:Math.random()*.5+.15,d:Math.random()*Math.PI*2,a:Math.random()*.6+.2});
    for(let i=0;i<N;i++)P.push(mk(true));
    (function loop(){
      x.clearRect(0,0,W,H); x.globalCompositeOperation='lighter';
      for(const p of P){ p.y-=p.v; p.d+=.01; p.x+=Math.sin(p.d)*.35; if(p.y<-10){Object.assign(p,mk(false));}
        const g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3.2); g.addColorStop(0,'rgba(251,226,140,'+(p.a*.8)+')'); g.addColorStop(1,'rgba(230,189,79,0)');
        x.fillStyle=g; x.beginPath(); x.arc(p.x,p.y,p.r*3.2,0,7); x.fill(); }
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
})();
