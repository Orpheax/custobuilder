
/* ============ DATA ============ */
const CU = 'ADEPTUS CUSTODES', AP = 'ANATHEMA PSYKANA';
// Data lives in data/*.json (source of truth), bundled into data.js by mkdata.py
const {DETS,ENH,CATS,U,WG,NOTES,WR,KT,DSD} = window.DATA;

// Detachments (PDF pages 92-105)


// Enhancements (enh) and Upgrades (upg). req = required keywords; any = at least one; not = excluded


// Display categories


// Units. p = points (null = not provided). r = to be confirmed. ups = surcharge from the nth copy.


// Wargear options (codex datasheets). k: 'one' = pick one loadout (c[0] = default), 'tog' = optional add-on (0/1),
// 'each' = each model may swap f (default weapon) for one of c; counts per alternative, total up to the model count.
// None of these options has a points cost in the datasheets. opt = only for that unit option index.

const UM = Object.fromEntries(U.map(u=>[u.id,u]));
const DM = Object.fromEntries(DETS.map(d=>[d.id,d]));
const EM = Object.fromEntries(ENH.map(e=>[e.id,e]));
const DP_COST = {gott:3}; // tous les autres : 1
DETS.forEach(d=>d.dp = DP_COST[d.id]||1);
const DP_DEFAULT = 3;

/* ============ STATE ============ */
const KEY = 'custodes11-list-v3';
let S = {limit:2000, dpMax:DP_DEFAULT, dets:[], list:[], warlord:null, tab:'cat', name:'My roster', currentId:null, savedSig:null};
let uidSeq = 1;

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return;
    const o = JSON.parse(raw);
    if(typeof o.limit==='number' && o.limit>0) S.limit=o.limit;
    if(typeof o.dpMax==='number' && o.dpMax>0) S.dpMax=o.dpMax;
    if(Array.isArray(o.dets)) S.dets=o.dets.filter(id=>DM[id]);
    if(Array.isArray(o.list)) S.list=o.list.filter(it=>UM[it.id]).map(it=>({uid:uidSeq++,id:it.id,opt:Math.min(it.opt|0,UM[it.id].opts.length-1),custom:+it.custom||0,enh:it.enh||null,upg:it.upg||null,wg:it.wg||{},_w:!!it.w}));
    const w=S.list.find(i=>i._w); S.warlord = w?w.uid:null; S.list.forEach(i=>delete i._w);
    if(['cat','roster','notes','codex','ds','kt','meta'].includes(o.tab)) S.tab=o.tab;
    if(typeof o.name==='string' && o.name) S.name=o.name.slice(0,40);
    if(typeof o.currentId==='string') S.currentId=o.currentId;
    if(typeof o.savedSig==='string') S.savedSig=o.savedSig;
  }catch(e){}
}
function save(){
  try{
    localStorage.setItem(KEY, JSON.stringify({currentId:S.currentId,savedSig:S.savedSig,name:S.name,limit:S.limit,dpMax:S.dpMax,dets:S.dets,tab:S.tab,
      list:S.list.map(i=>({id:i.id,opt:i.opt,custom:i.custom,enh:i.enh,upg:i.upg,wg:i.wg||{},w:i.uid===S.warlord}))}));
  }catch(e){}
}

/* ============ RULES ============ */
const basePts = it => { const o=UM[it.id].opts[it.opt]; return o.p!=null ? o.p : (it.custom||0); };
// Later copies cost more: u.ups = {n: surcharge from the nth copy of the datasheet}
const copyIdx = it => { let n=0; const po=UM[it.id].po; for(const i of S.list){ if(i.id===it.id&&(!po||i.opt===it.opt)){ n++; if(i===it) return n; } } return n; };
const surcharge = it => { const u=UM[it.id]; if(!u.ups) return 0; const n=copyIdx(it); let s=0; Object.keys(u.ups).map(Number).sort((a,b)=>a-b).forEach(k=>{ if(n>=k) s=u.ups[k]; }); return s; };
const enhPts = it => (it.enh?EM[it.enh].p:0) + (it.upg?EM[it.upg].p:0);
// Wargear lines may carry points: group.pc[i] = cost of choice i (kind 'one')
const wgPts = it => wgGroups(it).reduce((s,g)=>s+(g.k==='one'&&g.pc?(g.pc[(it.wg&&it.wg[g.id])|0]||0):0),0);
const pts = it => basePts(it) + surcharge(it) + enhPts(it) + wgPts(it);
const dpUsed = () => S.dets.reduce((a,id)=>a+DM[id].dp,0);
const optLabel = o => o.l + (o.r?' (to be confirmed)':'');
const priced = it => UM[it.id].opts[it.opt].p!=null || it.custom>0;
const total = () => S.list.reduce((a,i)=>a+pts(i),0);
const uniqueSel = () => S.dets.find(id=>DM[id].unique);

function eligible(u,e){
  const k=new Set(u.kw);
  if(e.k==='enh' && k.has('EPIC HERO')) return false;
  if(e.req && !e.req.every(x=>k.has(x))) return false;
  if(e.any && !e.any.some(x=>k.has(x))) return false;
  if(e.not && e.not.some(x=>k.has(x))) return false;
  return true;
}
function detLock(id){
  if(S.dets.includes(id)) return null;
  if(dpUsed()+DM[id].dp>S.dpMax) return 'Not enough detachment points: '+dpUsed()+'/'+S.dpMax+' used, this detachment costs '+DM[id].dp+'.';
  if(DM[id].unique){ const u=uniqueSel(); if(u) return 'Only one Unique Shield Host allowed: '+DM[u].name+' is already selected.'; }
  return null;
}
function canWarlord(it){
  const u=UM[it.id];
  if(!u.kw.includes('CHARACTER')) return false;
  if(u.kw.includes(CU)) return true;
  return u.kw.includes(AP) && S.dets.includes('nmv');
}
function usedEnh(exceptUid){
  const s=new Set(); S.list.forEach(i=>{ if(i.uid!==exceptUid){ if(i.enh) s.add(i.enh); if(i.upg) s.add(i.upg);} }); return s;
}
function availEnh(it,k){
  const u=UM[it.id], used=usedEnh(it.uid);
  return ENH.filter(e=>e.k===k && S.dets.includes(e.det) && eligible(u,e) && !used.has(e.id));
}

// ---- wargear helpers ----
const nModels = it => { const m=/(\d+) models?/.exec(UM[it.id].opts[it.opt].l); return m?+m[1]:1; };
const wgGroups = it => (WG[it.id]||[]).filter(g=>g.opt==null||g.opt===it.opt);
function wgClean(it){
  const out={};
  wgGroups(it).forEach(g=>{
    const v=it.wg&&it.wg[g.id];
    if(g.k==='one'){ const n=v|0; if(n>0&&n<g.c.length) out[g.id]=n; }
    else if(g.k==='tog'){ if(v) out[g.id]=1; }
    else { let left=nModels(it); const a=g.c.map((_,i)=>{ const n=Math.max(0,Math.min(left,(Array.isArray(v)?v[i]:0)|0)); left-=n; return n; }); if(a.some(x=>x>0)) out[g.id]=a; }
  });
  it.wg=out;
}
function wgDesc(it){
  const L=[];
  wgGroups(it).forEach(g=>{
    const v=it.wg&&it.wg[g.id];
    if(g.k==='one'){ if(v>0) L.push(g.c[v].replace(/ \(replaces.*\)$/,'')); }
    else if(g.k==='tog'){ if(v) L.push(g.c[0]); }
    else if(Array.isArray(v)) v.forEach((n,i)=>{ if(n>0) L.push(n+'× '+g.c[i]); });
  });
  return L;
}

// Restore a valid state after every change
function normalize(){
  const notes=[];
  // detachments: within the DP budget, one unique only
  const keep=[]; let uniq=false, dp=0;
  S.dets.forEach(id=>{ if(!DM[id]||keep.includes(id)) return; if(dp+DM[id].dp>S.dpMax) return; if(DM[id].unique){ if(uniq) return; uniq=true; } dp+=DM[id].dp; keep.push(id); });
  S.dets=keep;
  const seen=new Set();
  S.list.forEach(it=>{
    ['enh','upg'].forEach(k=>{
      const id=it[k]; if(!id) return;
      const e=EM[id];
      let bad = !e || e.k!==k || !S.dets.includes(e.det) || !eligible(UM[it.id],e) || seen.has(id);
      if(bad){ if(e) notes.push(e.name+' removed from '+UM[it.id].name+'.'); it[k]=null; } else seen.add(id);
    });
  });
  S.list.forEach(wgClean);
  // warlord
  const hasT = S.list.find(i=>i.id==='trajann');
  if(hasT) S.warlord = hasT.uid;
  const w = S.list.find(i=>i.uid===S.warlord);
  if(!w || !canWarlord(w)){ if(w) notes.push('Warlord removed: '+UM[w.id].name+' is no longer eligible.'); S.warlord=null; }
  if(notes.length) UI.msg=notes.join(' ');
}

function issues(){
  const out=[]; const t=total();
  if(t>S.limit) out.push(['err','Over the '+S.limit+' pts limit by '+(t-S.limit)+' pts.']);
  if(!S.dets.length) out.push(['warn','No detachment selected.']);
  if(S.list.length){
    if(!S.warlord){
      const any=S.list.some(canWarlord);
      out.push(['warn', any?'No Warlord selected.':'No Character eligible as Warlord. Add an ADEPTUS CUSTODES Character.']);
    }
  }
  const np=S.list.filter(i=>!priced(i));
  if(np.length) out.push(['warn',np.length+' unit(s) without listed points: counted at '+(np.every(i=>!i.custom)?'0':'your value')+'.']);
  if(S.list.some(i=>i.id==='trajann')) out.push(['info','Trajann Valoris: Supreme Commander, he must be your Warlord.']);
  if(S.list.some(i=>UM[i.id].kw.includes(AP)) ) out.push(['info','Anathema Psykana: units allowed in the army, never Warlord except with Null Maiden Vigil.']);
  if(S.list.some(i=>i.id==='prosec') && !S.dets.includes('nmv')) out.push(['info','Prosecutor Squad: Battleline only with Null Maiden Vigil.']);
  const tbc=S.list.filter(i=>UM[i.id].opts[i.opt].r);
  if(tbc.length) out.push(['info','Prices to confirm: '+[...new Set(tbc.map(i=>UM[i.id].name))].join(', ')+'.']);
  const sur=S.list.filter(i=>surcharge(i)>0);
  if(sur.length) out.push(['info','Later copies cost more: '+sur.map(i=>UM[i.id].name+' +'+surcharge(i)).join(', ')+'.']);
  if(!out.some(o=>o[0]==='err'||o[0]==='warn') && S.list.length) out.unshift(['ok','List is valid according to the rules implemented in this tool.']);
  return out;
}

/* ============ RENDER ============ */
const $ = s => document.querySelector(s);
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IC = {
 plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
 eye:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
 trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
 gear:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
 down:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6"/></svg>',
 helm:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20v-9a6 6 0 0 1 12 0v9M9 20v-5h6v5M12 5V2"/></svg>',
 tank:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15l3-6h9l3 4h3v2zM6 18h12"/></svg>'
};
const SIZES = {500:'Combat Patrol',1000:'Incursion',2000:'Strike Force',3000:'Onslaught'};
let UI = {open:{}, msg:'', manual:{}, q:'', showNo:true, eye:{}, exp:{}, closed:{}, panel:null, confirm:false, pending:null};

const ibtn = (act,attrs,icon,label,cls='',dis=false)=>'<button class="ib '+cls+'" data-act="'+act+'" '+attrs+' aria-label="'+esc(label)+'" title="'+esc(label)+'"'+(dis?' disabled':'')+'>'+icon+'</button>';
const unitIcon = u => u.kw.includes('VEHICLE') ? IC.tank : IC.helm;

function renderTop(){
  const t=total(), d=t-S.limit;
  $('#pts').innerHTML = t+' / '+S.limit+' pts <span class="'+(d>0?'bad':'')+'">('+(d>0?'+':'')+d+')</span>'+(S.currentId&&isDirty()?' · <span style="color:#ffd27a">modified</span>':'');
  const m=$('#meter'); m.className='meter'+(t>S.limit?' over':''); m.firstElementChild.style.width=Math.min(100,t/S.limit*100)+'%';
  const rn=$('#rname'); if(document.activeElement!==rn) rn.value=S.name;
  $('#mt-roster').textContent='Roster ('+S.list.length+')';
}

/* ---- left: catalogue ---- */
function secHead(id,label,tot){
  const closed=!!UI.closed[id];
  return '<h2 class="sh" data-closed="'+(closed?1:0)+'"><button data-act="sec" data-id="'+id+'" aria-expanded="'+(!closed)+'">'+IC.down+'<span>'+esc(label)+'</span>'+(tot?'<span class="tot">'+tot+'</span>':'')+'</button></h2>';
}
function rulesHtml(d){
  const enhs=ENH.filter(e=>e.det===d.id).map(e=>'<p class="it"><b>'+esc(e.name)+(e.k==='upg'?' <span class="tg">upgrade</span>':'')+'<span class="cpb">'+e.p+' pts</span></b>'+esc(e.t)+'</p>').join('');
  const strats=d.strats.map(s=>'<p class="it"><b>'+esc(s[0])+'<span class="cpb">'+s[1]+' CP</span></b><i>'+esc(s[2])+'.</i> '+esc(s[3])+'</p>').join('');
  return '<h4>Detachment rule</h4><p class="it"><b>'+esc(d.rule.n)+'</b>'+esc(d.rule.t)+'</p>'
   +(d.ka?'<h4>Favoured Ka’tah</h4><p class="it"><b>'+esc(d.ka.n)+'</b>'+esc(d.ka.t)+'</p>':'')
   +'<h4>Enhancements</h4>'+enhs+'<h4>Stratagems</h4>'+strats;
}
function detRow(d){
  const sel=S.dets.includes(d.id), lock=detLock(d.id), open=!!UI.eye['d:'+d.id];
  return '<div class="cr'+(sel?' has':'')+(lock?' locked':'')+'"><div class="cr-main"><span class="cr-pts">'+d.dp+' DP</span><span class="cr-name">'+esc(d.name)+'</span><span class="cr-cnt">('+(sel?1:0)+'/1)</span></div>'
   +'<div class="cr-act">'+ibtn('eyeD','data-id="'+d.id+'"',IC.eye,'View rules of '+d.name)
   +(sel?ibtn('det','data-id="'+d.id+'"',IC.trash,'Remove '+d.name,''):ibtn('det','data-id="'+d.id+'"',IC.plus,lock?lock:'Add '+d.name,'pl',!!lock))+'</div></div>'
   +(open?'<div class="cr-x"><p>'+esc(d.gist)+'</p>'+(lock?'<p class="warnl">'+esc(lock)+'</p>':'')+rulesHtml(d)+'</div>':'');
}
function unitRows(u){
  const q=UI.q.trim().toLowerCase();
  const allNo=u.opts.every(o=>o.p==null);
  if(allNo && !UI.showNo) return '';
  let out='';
  u.opts.forEach((o,i)=>{
    const label=u.name+(u.opts.length>1?' — '+optLabel(o):'');
    const hay=(label+' '+u.kw.join(' ')+' '+(o.p!=null?o.p+' pts':'')+' '+u.cat).toLowerCase();
    if(q && !hay.includes(q)) return;
    const key=u.id+':'+i, cnt=S.list.filter(x=>x.id===u.id&&x.opt===i).length, open=!!UI.eye[key];
    const man=UI.manual[u.id]||0;
    const addOk = o.p!=null || man>0;
    out+='<div class="cr'+(cnt?' has':'')+'"><div class="cr-main"><span class="cr-pts">'+(o.p!=null?o.p+' pts':'? pts')+'</span><span class="cr-name">'+esc(label)+'</span><span class="cr-cnt">('+cnt+')</span></div>'
      +'<div class="cr-act">'+(o.p==null?'<input class="mini" type="number" min="0" step="5" data-act="manual" data-id="'+u.id+'" value="'+(man||'')+'" placeholder="pts" aria-label="Points for '+esc(u.name)+'">':'')
      +ibtn('eyeU','data-key="'+key+'"',IC.eye,'Details of '+label)
      +ibtn('add','data-id="'+u.id+'" data-opt="'+i+'"',IC.plus,addOk?'Add '+label:'Enter points to add','pl',!addOk)+'</div></div>'
      +(open?'<div class="cr-x"><p><b>'+esc(u.st)+'</b></p><p>'+esc(u.kw.filter(k=>k!==CU&&k!==AP&&k!=='IMPERIUM').join(' · '))+'</p>'+(u.ups?'<p class="warnl">'+esc('Later copies cost more: '+Object.keys(u.ups).map(k=>'from copy '+k+': +'+u.ups[k]+' pts').join(', ')+'.')+'</p>':'')+(u.flag?'<p class="warnl">'+esc(u.flag)+'</p>':'')+(o.p==null?'<p class="warnl">Points not provided: enter a value.</p>':'')+'</div>':'');
  });
  return out;
}
function renderLeft(){
  $('#lp-head').innerHTML='<b>Imperium — Adeptus Custodes</b><span>'+total()+' / '+S.limit+' pts · '+dpUsed()+' / '+S.dpMax+' detachment points</span>';
  const uniq=DETS.filter(d=>d.unique), oth=DETS.filter(d=>!d.unique);
  const q=UI.q.trim().toLowerCase();
  const dmatch=d=>!q||(d.name+' '+d.dp+' dp detachement shield host').toLowerCase().includes(q);
  let html='';
  const du=uniq.filter(dmatch), dd=oth.filter(dmatch);
  if(du.length||dd.length){
    html+=secHead('s-det','Detachments',dpUsed()+'/'+S.dpMax+' DP');
    if(!UI.closed['s-det']) html+=du.map(detRow).join('')+dd.map(detRow).join('');
  }
  CATS.forEach(([cid,label])=>{
    const rows=U.filter(u=>u.cat===cid).map(unitRows).join('');
    if(!rows) return;
    html+=secHead('c-'+cid,label);
    if(!UI.closed['c-'+cid]) html+=rows;
  });
  $('#lp-body').innerHTML = html || '<div class="empty">No results.</div>';
  $('#toggleNo').setAttribute('aria-pressed',String(UI.showNo));
}

/* ---- right: roster ---- */
function optsHtml(it){
  const u=UM[it.id], o=u.opts[it.opt], isW=S.warlord===it.uid;
    const optSel=u.opts.length>1?'<label>Option<select data-act="opt" data-uid="'+it.uid+'">'+u.opts.map((x,i)=>'<option value="'+i+'"'+(i===it.opt?' selected':'')+'>'+esc(optLabel(x))+(x.p!=null?' — '+x.p+' pts':'')+'</option>').join('')+'</select></label>':'';
    const custom=o.p==null?'<label>Points (to be confirmed)<input type="number" min="0" step="5" data-act="custom" data-uid="'+it.uid+'" value="'+(it.custom||'')+'" placeholder="0"></label>':'';
    const lockedW=S.list.some(i=>i.id==='trajann')&&it.id!=='trajann';
    const CK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
    const row=(chk,dis,act,attrs,label,ptsTxt,cntTxt,eyeKey,desc)=>{
      const open=eyeKey&&UI.eye[eyeKey];
      return '<div class="cr'+(chk?' has':'')+'"><button class="cbx" role="checkbox" aria-checked="'+chk+'" aria-label="'+esc(label)+'" data-act="'+act+'" '+attrs+(dis?' disabled':'')+'>'+CK+'</button>'
       +'<div class="cr-main"><span class="cr-name">'+esc(label)+'</span>'+(ptsTxt?'<span class="cr-pts">'+ptsTxt+'</span>':'')+'<span class="cr-cnt">('+cntTxt+')</span></div>'
       +(eyeKey?'<div class="cr-act">'+ibtn('eyeE','data-key="'+eyeKey+'"',IC.eye,'Details of '+label)+'</div>':'')+'</div>'
       +(open?'<div class="cr-x"><p>'+esc(desc)+'</p></div>':'');
    };
    const sec=(id,label,cnt,body)=>'<div class="opt-sec"><h2 class="sh" data-closed="'+(UI.closed[id]?1:0)+'"><button data-act="sec" data-id="'+id+'" aria-expanded="'+!UI.closed[id]+'">'+IC.down+'<span>'+label+' <span class="cnt">('+cnt+')</span></span></button></h2>'+(UI.closed[id]?'':body)+'</div>';
    const mkSec=(k,label)=>{
      const av=availEnh(it,k), cur=it[k]?EM[it[k]]:null, list=cur?[cur,...av.filter(e=>e.id!==cur.id)]:av;
      if(!list.length) return '';
      const body=list.map(e=>row(!!(cur&&cur.id===e.id),false,'pick','data-k="'+k+'" data-uid="'+it.uid+'" data-id="'+e.id+'"',e.name,e.p+' pts',(cur&&cur.id===e.id?1:0)+'/1','e:'+it.uid+':'+e.id,'['+DM[e.det].name+'] '+e.t)).join('');
      return sec('o-'+k+'-'+it.uid,label,(cur?1:0)+'/1',body);
    };
    const wlSec=canWarlord(it)?row(isW,lockedW||it.id==='trajann','wl','data-uid="'+it.uid+'"','Warlord','',(isW?1:0)+'/1',null,''):'';
    const wgBody=g=>{
      const v=(it.wg&&it.wg[g.id]), pre='<h4 class="wg-t">'+esc(g.t)+(g.f&&g.k==='each'?' <span>(default: '+esc(g.f)+')</span>':'')+'</h4>';
      if(g.k==='one') return pre+g.c.map((c,i)=>row((v|0)===i,false,'wg1','data-uid="'+it.uid+'" data-g="'+g.id+'" data-c="'+i+'"',c,(g.pc&&g.pc[i]?'+'+g.pc[i]+' pts':''),((v|0)===i?1:0)+'/1',null,'')).join('');
      if(g.k==='tog') return pre+row(!!v,false,'wgt','data-uid="'+it.uid+'" data-g="'+g.id+'"',g.c[0],'',(v?1:0)+'/1',null,'');
      const n=nModels(it), a=Array.isArray(v)?v:g.c.map(()=>0), used=a.reduce((x,y)=>x+y,0);
      return pre+g.c.map((c,i)=>'<div class="cr'+(a[i]?' has':'')+'"><div class="cr-main"><span class="cr-name">'+esc(c)+'</span><span class="cr-cnt">('+a[i]+'/'+n+')</span></div><div class="cr-act"><button class="ib step" data-act="wgs" data-uid="'+it.uid+'" data-g="'+g.id+'" data-c="'+i+'" data-d="-1" aria-label="Fewer '+esc(c)+'"'+(a[i]<=0?' disabled':'')+'>−</button><button class="ib step" data-act="wgs" data-uid="'+it.uid+'" data-g="'+g.id+'" data-c="'+i+'" data-d="1" aria-label="More '+esc(c)+'"'+(used>=n?' disabled':'')+'>+</button></div></div>').join('');
    };
    const wgs=wgGroups(it), wgSec=wgs.length?sec('o-wg-'+it.uid,'Wargear',wgDesc(it).length?wgDesc(it).length+' changed':'default',wgs.map(wgBody).join('')+(wgs.some(g=>g.flag)?'<div class="cr-x"><p class="warnl">This wargear line is not fully confirmed; check it against the codex.</p></div>':'')+'<div class="cr-x"><p>'+(wgs.some(g=>g.pc)?'Options with a price are included in the unit’s points; the others are free.':'Wargear options have no points cost in the datasheets.')+'</p></div>'):'';
    return '<div class="edit">'+optSel+custom+'<div class="full"><span>'+esc(u.st)+'</span></div></div>'+wlSec+mkSec('enh','Enhancements')+mkSec('upg','Upgrades')+wgSec;
}
const selUid=()=>{ if(S.list.some(i=>i.uid===UI.sel)) return UI.sel; if(UI.sel===null) return null; const l=S.list[S.list.length-1]; return l?l.uid:null; };
function entryRow(it){
  const u=UM[it.id], o=u.opts[it.opt], isW=S.warlord===it.uid, open=selUid()===it.uid;
  const sub=[optLabel(o)]; if(it.enh) sub.push(EM[it.enh].name+' +'+EM[it.enh].p); if(it.upg) sub.push(EM[it.upg].name+' (upgrade) +'+EM[it.upg].p);
  wgDesc(it).forEach(x=>sub.push(x));
  if(wgPts(it)) sub.push('wargear : +'+wgPts(it)+' pts');
  if(surcharge(it)) sub.push('copy #'+copyIdx(it)+' : +'+surcharge(it)+' pts');
  let h='<div class="er'+(isW?' wl':'')+(open?' sel':'')+'"><span class="ico">'+unitIcon(u)+'</span><div class="er-main" data-act="selu" data-uid="'+it.uid+'"><div class="er-t"><b>'+esc(u.name)+'</b><i>'+pts(it)+' pts</i>'+(isW?'<em>Warlord</em>':'')+'</div><div class="er-s">'+esc(sub.join(' · '))+'</div></div>'
   +'<div class="er-act">'+ibtn('rexp','data-uid="'+it.uid+'"',IC.eye,open?'Hide options':'Show options')
   +ibtn('dup','data-uid="'+it.uid+'"',IC.copy,'Duplicate')+ibtn('rm','data-uid="'+it.uid+'"',IC.trash,'Remove')+'</div></div>';
  if(open) h+='<div class="inl">'+optsHtml(it)+'</div>';
  return h;
}
function exportText(){
  const L=[], t=total();
  L.push(S.name+' — ADEPTUS CUSTODES — '+t+' / '+S.limit+' pts');
  L.push('Detachments ('+dpUsed()+'/'+S.dpMax+' DP): '+(S.dets.length?S.dets.map(id=>DM[id].name+' ['+DM[id].fd+']'+(DM[id].unique?' (Unique Shield Host)':'')).join(', '):'none'));
  const w=S.list.find(i=>i.uid===S.warlord); L.push('Warlord: '+(w?UM[w.id].name:'not selected')); L.push('');
  CATS.forEach(([cid,label])=>{
    const its=S.list.filter(i=>UM[i.id].cat===cid); if(!its.length) return;
    L.push('['+label+']');
    its.forEach(i=>{ const u=UM[i.id], o=u.opts[i.opt];
      L.push(u.name+' — '+o.l+' ('+pts(i)+' pts)'+(i.uid===S.warlord?' [Warlord]':''));
      if(i.enh) L.push('  + '+EM[i.enh].name+' ('+EM[i.enh].p+' pts)');
      if(i.upg) L.push('  + '+EM[i.upg].name+' (upgrade, '+EM[i.upg].p+' pts)');
      wgDesc(i).forEach(x=>L.push('  • '+x)); });
    L.push('');
  });
  L.push('','Built with: https://orpheax.github.io/custobuilder/');
  return L.join('\n').trim();
}
function renderRight(){
  let h='';
  if(UI.panel==='opts'){
    h+='<div class="panelbox"><h3>List options</h3>'
     +'<div><div class="muted">Battle size</div><div class="chips">'+Object.keys(SIZES).map(k=>'<button class="chip" data-act="size" data-v="'+k+'" aria-pressed="'+(S.limit===+k)+'">'+SIZES[k]+' · '+k+'</button>').join('')+'</div></div>'
     +'<div class="row"><label class="muted" for="limitIn">Custom limit</label><input type="number" id="limitIn" min="50" step="50" value="'+S.limit+'"><label class="muted" for="dpMax">Max detachment points</label><input type="number" id="dpMax" min="1" max="12" value="'+S.dpMax+'"></div>'
     +'<div class="row">'+(UI.confirm?'<button class="btn danger" data-act="reset-yes">Confirm: clear everything</button><button class="btn" data-act="reset-no">Cancel</button>':'<button class="btn danger" data-act="reset">Clear list</button>')+'</div></div>';
  }
  if(UI.panel==='lists') h+=listsHtml();
  if(UI.panel==='export'){
    h+='<div class="panelbox"><h3>Text export</h3><textarea id="exp" readonly>'+esc(exportText())+'</textarea><div class="row"><button class="btn pri" data-act="copy">Copy</button><span class="muted" id="copied"></span></div><h3>Roster file (JSON)</h3><textarea id="expj" readonly>'+esc(JSON.stringify(docNow(),null,1))+'</textarea><div class="row"><button class="btn" data-act="copyjson">Copy JSON</button><button class="btn" data-act="copylink">Copy share link</button><span class="muted" id="copiedj"></span></div><h3>Import a roster</h3><textarea id="impj" placeholder="Paste a roster JSON here"></textarea><div class="row"><button class="btn" data-act="import">Import</button><span class="muted" id="impmsg"></span></div></div>';
  }
  const iss=issues();
  h+='<div class="notice">'+(UI.msg?'<p class="warn">'+esc(UI.msg)+'</p>':'')+iss.map(x=>'<p class="'+x[0]+'">'+esc(x[1])+'</p>').join('')+(!iss.length&&!UI.msg?'<p class="info">No messages.</p>':'')+'</div>';
  // Configuration
  const sizeName=SIZES[S.limit]?SIZES[S.limit]+' ('+S.limit+' pts)':'Custom ('+S.limit+' pts)';
  h+=secHead('r-conf','Configuration');
  if(!UI.closed['r-conf']){
    h+='<div class="er"><span class="ico">'+IC.gear+'</span><div class="er-main"><div class="er-t"><b>Battle size</b></div><div class="er-s">'+esc(sizeName)+'</div></div></div>';
    h+='<div class="er"><span class="ico">'+IC.gear+'</span><div class="er-main"><div class="er-t"><b>Detachment points</b><i>'+dpUsed()+' / '+S.dpMax+' DP</i></div><div class="er-s">'+(S.dets.length?'':'No detachment selected. Add one from the catalogue.')+'</div></div></div>';
    S.dets.forEach(id=>{ const d=DM[id], open=!!UI.eye['d:'+id];
      h+='<div class="er"><span class="ico">'+IC.gear+'</span><div class="er-main"><div class="er-t"><b>'+esc(d.name)+'</b><i>'+d.dp+' DP</i>'+(d.unique?'<em>Unique Shield Host</em>':'')+'</div><div class="er-s">'+esc(d.fd)+' · '+esc(d.rule.n)+(d.ka?' · '+esc(d.ka.n):'')+'</div></div>'
       +'<div class="er-act">'+ibtn('eyeD','data-id="'+id+'"',IC.eye,'Rules')+ibtn('det','data-id="'+id+'"',IC.trash,'Remove')+'</div></div>'
       +(open?'<div class="cr-x"><p>'+esc(d.gist)+'</p>'+rulesHtml(d)+'</div>':'');
    });
  }
  // categories
  const any=S.list.length;
  CATS.forEach(([cid,label])=>{
    const its=S.list.filter(i=>UM[i.id].cat===cid); if(!its.length) return;
    h+=secHead('r-'+cid,label,its.reduce((a,i)=>a+pts(i),0)+' pts');
    if(!UI.closed['r-'+cid]) h+=its.map(entryRow).join('');
  });
  if(!any) h+='<div class="empty">Empty roster. Add units with the + button in the catalogue.</div>';
  $('#rp').innerHTML=h;
}


function renderOpts(){
  const uid=selUid(), it=S.list.find(i=>i.uid===uid), el=$('#op');
  if(!it){ el.innerHTML='<div class="op-h"><b>Unit options</b></div><div class="empty">Select a unit in the roster to see its options, enhancements and upgrades.</div>'; return; }
  el.innerHTML='<div class="op-h"><b>'+esc(UM[it.id].name)+'</b><span>'+pts(it)+' pts</span></div>'+optsHtml(it);
}
/* ---- codex page: every detachment ---- */
function reqText(e){
  const nice=k=>k.split(' ').map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(' ');
  const parts=[]; if(e.req) parts.push(e.req.map(nice).join(' · '));
  if(e.any) parts.push('one of: '+e.any.map(nice).join(' / ')); if(e.not) parts.push('not '+e.not.map(nice).join(' / '));
  return parts.join(' — ');
}
function renderCodex(){
  const f=UI.cxf||'all';
  const list=DETS.filter(d=>f==='all'||(f==='unique'?d.unique:!d.unique));
  let h='<div class="cx-top"><h2 class="cx-t">Detachments</h2><div class="orn">&#10022;</div><p>Adeptus Custodes · 11th edition. '+DETS.length+' detachments: '+DETS.filter(d=>d.unique).length+' Unique Shield Hosts (only one per army) and '+DETS.filter(d=>!d.unique).length+' others. Budget: '+dpUsed()+' / '+S.dpMax+' DP used.</p>'
   +'<div class="cx-nav">'+[['all','All'],['unique','Unique Shield Hosts'],['other','Other detachments']].map(x=>'<button data-act="cxf" data-f="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+'</button>').join('')+'</div>'
   +'<div class="cx-nav">'+list.map(d=>'<a href="#cx-'+d.id+'" data-act="cxgo" data-id="'+d.id+'">'+esc(d.name)+'</a>').join('')+'</div></div>';
  list.forEach(d=>{
    const sel=S.dets.includes(d.id), lock=detLock(d.id), enhs=ENH.filter(e=>e.det===d.id);
    h+='<article class="cx-d" id="cx-'+d.id+'"><header class="cx-h"><h2>'+esc(d.name)+'</h2><a class="perma" href="det-'+d.id+'.html" title="Permanent link to this detachment">link</a>'
     +(d.unique?'<span class="cx-tag u">Unique Shield Host</span>':'<span class="cx-tag">Detachment</span>')+'<span class="cx-tag">'+d.dp+' DP</span>'+'<span class="cx-tag fd">Force disposition: '+esc(d.fd)+'</span>'+'</header>'
     +'<p class="cx-gist">'+esc(d.gist)+'</p><div class="cx-body"><div>'
     +'<h3>Detachment rule</h3><div class="cx-box"><b>'+esc(d.rule.n)+'</b><p>'+esc(d.rule.t)+'</p></div>'
     +(d.ka?'<h3>Favoured Ka’tah</h3><div class="cx-box"><b>'+esc(d.ka.n)+'</b><p>'+esc(d.ka.t)+'</p></div>':'')
     +'<h3>Enhancements &amp; upgrades</h3>'+enhs.map(e=>'<div class="cx-box"><span class="pp">'+e.p+' pts</span><b>'+esc(e.name)+(e.k==='upg'?' <span class="cx-tag">Upgrade</span>':'')+'</b><small>'+esc(reqText(e))+'</small><p>'+esc(e.t)+'</p></div>').join('')
     +'</div><div><h3>Stratagems</h3>'+d.strats.map(x=>'<div class="cx-box cx-st" id="st-'+d.id+'-'+slug(x[0])+'"><span class="cp">'+x[1]+' CP</span><b>'+esc(x[0])+'</b><i>'+esc(x[2])+'</i><p>'+esc(x[3])+'</p></div>').join('')+'</div></div>'
     +'<footer class="cx-foot">'+(sel?'<button class="btn" data-act="det" data-id="'+d.id+'">Remove from my list</button><span class="muted">In your list.</span>'
       :'<button class="btn pri" data-act="det" data-id="'+d.id+'"'+(lock?' disabled':'')+'>Add to my list ('+d.dp+' DP)</button>'+(lock?'<span class="warnl">'+esc(lock)+'</span>':''))+'</footer></article>';
  });
  $('#cx').innerHTML=h;
}
/* ---- Ka'tah tab (base effects: Warhammer Community preview; favoured effects: codex) ---- */

function renderKt(){
  let h='<div class="cx-top"><h2 class="cx-t">Ka’tah</h2><div class="orn">&#10022;</div><p>Custodian units become <b>readied</b> at the start of the Command phase. A readied unit can use one ka’tah when its trigger occurs, then it is no longer readied. Card text follows the <a target="_blank" rel="noopener" href="https://www.warhammer-community.com/en-gb/articles/vygelghy/new-army-rules-from-codex-adeptus-custodes/">Warhammer Community preview</a>; the Favoured line is the Additional Effect printed in the codex for the six Unique Shield Hosts.</p></div>'
   +'<div class="kt-g">'+KT.map(k=>{ const d=DM[k.d]; const on=S.dets.includes(k.d);
     return '<div class="kt-w"><article class="kt-c"><h3>'+esc(k.n)+'</h3><div class="kt-band">KA’TAH ABILITY</div>'
      +'<div class="kt-r"><b>WHEN:</b> '+k.w+'</div><div class="kt-r"><b>TARGET:</b> '+k.tg+'</div>'
      +'<div class="kt-r"><b>EFFECT:</b> '+k.e+(k.l?'<ul>'+k.l.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'</div></article>'
      +'<p class="kt-fv"><b>Favoured by '+esc(d.name)+'</b> ('+esc(d.fd)+(on?', in your list':'')+'): '+esc(k.f)+'</p></div>'; }).join('')+'</div>';
  $('#kt').innerHTML=h;
}
/* ---- Win rates (Listhammer snapshot; Wilson 95% interval from games played) ---- */
function wilson(p,n){ if(!n||p==null) return null; p/=100; const z=1.96,d=1+z*z/n,c=p+z*z/(2*n),m=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return [Math.max(0,(c-m)/d)*100,Math.min(1,(c+m)/d)*100]; }
function renderMeta(){
  const o=WR.overall, src=WR.source;
  const bar=(v,lo,hi,n)=>v==null?'<span class="muted">n/a</span>':'<span class="wr-bar" role="img" aria-label="'+v+'% win rate'+(lo!=null?', 95% interval '+lo.toFixed(0)+' to '+hi.toFixed(0):'')+'"><i style="left:'+lo+'%;width:'+(hi-lo)+'%"></i><b style="left:'+v+'%"></b><u></u></span>';
  const row=m=>{ const w=wilson(m.wr,m.g); const low=m.g<30; return '<tr'+(low?' class="wr-low"':'')+'><th scope="row">'+esc(m.f)+'</th><td class="n">'+(m.wr==null?'—':m.wr.toFixed(1)+'%')+'</td><td>'+(m.wr==null?'':bar(m.wr,w[0],w[1]))+'</td><td class="n">'+(w?w[0].toFixed(0)+'–'+w[1].toFixed(0)+'%':'—')+'</td><td class="n">'+(m.diff==null?'—':(m.diff>0?'+':'')+m.diff)+'</td><td class="n">'+m.g+'</td></tr>'; };
  const dm={}; DETS.forEach(d=>dm[d.name]=d.id);
  const dl=n=>n.split(' + ').map(x=>dm[x]?'<a href="det-'+dm[x]+'.html">'+esc(x)+'</a>':esc(x)).join(' + ');
  let h='<div class="cx-top"><h2 class="cx-t">Win rates</h2><div class="orn">&#10022;</div><p>Tournament results for Adeptus Custodes in 11th edition, <b>'+esc(src.period)+'</b>. Data compiled by <a target="_blank" rel="noopener" href="'+src.url+'">'+esc(src.name)+'</a>: '+esc(src.method)+'. Snapshot taken '+esc(src.fetched)+'. A win rate on a small sample means little, so the table shows the 95% Wilson interval; rows under 30 games are dimmed.</p>'
   +'<div class="cx-nav"><a href="#mt-det" data-act="mtgo" data-id="det">Detachments</a><a href="#mt-mu" data-act="mtgo" data-id="mu">Matchups</a><a href="#mt-ds" data-act="mtgo" data-id="ds">Dispositions</a></div></div>';
  h+='<div class="strip wr-strip"><div><b>'+o.wr+'%</b><span>Win rate</span></div><div><b>'+o.games+'</b><span>Games</span></div><div><b>'+o.players+'</b><span>Players</span></div><div><b>'+o.overrep+'×</b><span>Overrepresentation</span></div></div>';
  h+='<article class="cx-d" id="mt-det"><header class="cx-h"><h2>Win rate by detachment</h2></header><div class="mt-body"><p class="muted">“Field” is the share of lists. The source gives no game count per detachment, so no interval is computed; treat everything under 5% of the field as noise. A dash means too few games to report. Names are as reported by the source.</p><div class="tbl-wrap"><table class="wr-t"><thead><tr><th scope="col">Detachment</th><th scope="col">Field</th><th scope="col">Win rate</th></tr></thead><tbody>'
   +WR.detachments.map(d=>'<tr'+(d.field<5?' class="wr-low"':'')+'><th scope="row">'+dl(d.n)+'</th><td class="n">'+d.field+'%</td><td class="n">'+(d.wr==null?'—':d.wr+'%')+'</td></tr>').join('')+'</tbody></table></div></div></article>';
  h+='<article class="cx-d" id="mt-mu"><header class="cx-h"><h2>Matchups by opposing faction</h2></header><div class="mt-body"><p class="muted">Sorted by win rate. “Diff” is the average score difference.</p><div class="tbl-wrap"><table class="wr-t"><thead><tr><th scope="col">Opponent</th><th scope="col">Win rate</th><th scope="col"><span class="sr">Interval chart</span></th><th scope="col">95% interval</th><th scope="col">Diff</th><th scope="col">Games</th></tr></thead><tbody>'
   +WR.matchups.slice().sort((a,b)=>(a.wr==null)-(b.wr==null)||b.wr-a.wr).map(row).join('')+'</tbody></table></div></div></article>';
  h+='<article class="cx-d" id="mt-ds"><header class="cx-h"><h2>Force dispositions played</h2></header><div class="mt-body"><div class="tbl-wrap"><table class="wr-t"><thead><tr><th scope="col">Disposition</th><th scope="col">Lists</th><th scope="col">Share</th></tr></thead><tbody>'
   +WR.dispositions.map(d=>'<tr><th scope="row">'+esc(d.n)+'</th><td class="n">'+d.lists+'</td><td class="n">'+d.pct+'%</td></tr>').join('')+'</tbody></table></div></div></article>';
  $('#mt').innerHTML=h;
}


/* ---- Datasheets tab (Wahapedia-style; transcribed from the codex PDF) ---- */
const DS_SHEETS=u=>u.id==='aquilon'?['aquilon_g','aquilon_t']:[u.id];
const dsTxt=t=>esc(t).replace(/\n- /g,'<br>• ').replace(/\n/g,'<br>').replace(/\?(?= (?:ADEPTUS|models|\?))/g,'<i class="tv">[to verify]</i>');
const dsKw=a=>(a||[]).map(k=>'<span class="ds-kw">'+esc(k.replace(/^\[|\]$/g,''))+'</span>').join(' ');
function dsWeapons(list,melee){
  if(!list||!list.length) return '';
  return '<table class="ds-wt"><thead><tr><th>'+(melee?'MELEE WEAPONS':'RANGED WEAPONS')+'</th><th>RANGE</th><th>A</th><th>'+(melee?'WS':'BS')+'</th><th>S</th><th>AP</th><th>D</th></tr></thead><tbody>'
   +list.map(w=>'<tr><td class="ds-wn">'+esc(w.name)+(w.kw&&w.kw.length?'<div>'+dsKw(w.kw)+'</div>':'')+'</td><td>'+esc(w.range)+'</td><td>'+esc(w.A)+'</td><td>'+esc(melee?w.WS:w.BS)+'</td><td>'+esc(w.S)+'</td><td>'+esc(w.AP)+'</td><td>'+esc(w.D)+'</td></tr>').join('')+'</tbody></table>';
}
function dsSheet(u,k,first){
  const d=DSD[k], s=d.stats, cnt=S.list.filter(i=>i.id===u.id).length;
  const stat=(l,v)=>'<div class="ds-st"><small>'+l+'</small><b>'+esc(v)+'</b></div>';
  const costs=first?u.opts.map((o,i)=>o.p==null?'':'<div class="ds-cost"><span>'+esc(o.l)+'</span><b>'+o.p+' pts</b><button class="btn pri" data-act="add" data-id="'+u.id+'" data-opt="'+i+'">Add to roster</button></div>').join(''):'';
  return '<article class="cx-d ds-d" id="ds-'+k+'"><header class="ds-h"><h2>'+esc(d.name)+'</h2><a class="perma" href="ds-'+k+'.html" title="Permanent link to this datasheet">link</a>'+(first&&cnt?'<span class="cx-tag u">'+cnt+' in roster</span>':'')
   +'<div class="ds-stats">'+stat('M',s.M)+stat('T',s.T)+stat('SV',s.Sv)+stat('W',s.W)+stat('LD',s.Ld)+stat('OC',s.OC)+(s.Inv?'<div class="ds-inv"><small>INSV</small><b>'+esc(s.Inv)+'</b></div>':'')+'</div></header>'
   +'<div class="ds-body"><div class="ds-l">'+dsWeapons(d.ranged,false)+dsWeapons(d.melee,true)
   +(d.wargear&&d.wargear.length?'<div class="ds-sh">WARGEAR OPTIONS</div><ul class="ds-ul">'+d.wargear.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'</div>'
   +'<div class="ds-r">'+((d.core&&d.core.length)||(d.army&&d.army.length)?'<div class="ds-ca">'+(d.core&&d.core.length?'<div><span>CORE ABILITIES</span><b>'+d.core.map(esc).join(', ')+'</b></div>':'')+(d.army&&d.army.length?'<div><span>ARMY RULES</span><b>'+d.army.map(esc).join(', ')+'</b></div>':'')+'</div>':'')
   +(d.abilities&&d.abilities.length?'<div class="ds-sh">ABILITIES</div>'+d.abilities.map(a=>'<p class="ds-ab"><b>'+esc(a.name)+(a.text?':':'')+'</b> '+dsTxt(a.text||'')+'</p>').join(''):'')
   +'<div class="ds-sh">UNIT COMPOSITION</div><p class="ds-ab">'+esc(d.composition||'')+'<br><b>'+esc((d.equipped||'').split(':')[0]+(d.equipped&&d.equipped.includes(':')?':':''))+'</b>'+esc((d.equipped||'').includes(':')?(d.equipped.split(':').slice(1).join(':')):'')+'</p>'
   +(costs?'<div class="ds-sh">YOUR UNIT COSTS</div>'+costs:'')+'</div></div>'
   +'<footer class="ds-f"><div><span class="ds-fl">KEYWORDS</span>'+(d.keywords||[]).map(k=>'<span class="ds-kw ds-uk">'+esc(k)+'</span>').join('')+'</div><div><span class="ds-fl">FACTION KEYWORDS</span>'+(d.faction||[]).map(k=>'<span class="ds-kw ds-fk">'+esc(k)+'</span>').join('')+'</div></footer></article>';
}
function dsInit(){
  if(UI.dsf!==undefined) return;
  let p; try{ p=new URLSearchParams(location.search); }catch(e){ p=new URLSearchParams(''); }
  UI.dsf=CATS.some(c=>c[0]===p.get('role'))?p.get('role'):'all';
  UI.dsq=(p.get('q')||'').slice(0,60); UI.dss=p.get('sort')==='pts'?'pts':'name';
}
function dsUrl(){
  if(document.body.dataset.tab!=='ds') return;
  const p=new URLSearchParams();
  if(UI.dsf&&UI.dsf!=='all') p.set('role',UI.dsf); if(UI.dsq) p.set('q',UI.dsq); if(UI.dss==='pts') p.set('sort','pts');
  const qs=p.toString(); try{ history.replaceState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash); }catch(e){}
}
const dsHay=u=>DS_SHEETS(u).map(k=>{ const d=DSD[k]; return [d.name].concat(d.keywords||[],d.faction||[],(d.ranged||[]).map(w=>w.name),(d.melee||[]).map(w=>w.name),(d.abilities||[]).map(a=>a.name)).join(' '); }).concat([u.name],u.kw).join(' ').toLowerCase();
const minPts=u=>{ const o=u.opts.find(o=>o.p!=null); return o?o.p:1e9; };
function renderDs(){
  dsInit();
  const f=UI.dsf, q=(UI.dsq||'').trim().toLowerCase(), cats=CATS.filter(c=>f==='all'||f===c[0]);
  const pick=c=>{ let us=U.filter(u=>u.cat===c[0]&&DS_SHEETS(u).every(k=>DSD[k])&&(!q||q.split(/\s+/).every(w=>dsHay(u).includes(w)))); if(UI.dss==='pts') us=us.slice().sort((a,b)=>minPts(a)-minPts(b)); return us; };
  const total=cats.reduce((n,c)=>n+pick(c).length,0);
  let h='<div class="cx-top"><h2 class="cx-t">Datasheets</h2><div class="orn">&#10022;</div><p>Adeptus Custodes · 11th edition. Profiles, weapons, abilities and wargear options as printed in the codex. Points come from this tool’s data.</p>'
   +'<div class="cx-nav">'+[['all','All']].concat(CATS).map(c=>'<button data-act="dsf" data-f="'+c[0]+'" aria-pressed="'+(f===c[0])+'">'+c[1]+'</button>').join('')+'</div>'
   +'<div class="cx-nav ds-tools"><label class="sr" for="dsq">Search datasheets</label><input id="dsq" type="search" placeholder="Search name, keyword, weapon, ability" value="'+esc(UI.dsq||'')+'" autocomplete="off"><label class="sr" for="dss">Sort order</label><select id="dss"><option value="name"'+(UI.dss==='pts'?'':' selected')+'>Sort: book order</option><option value="pts"'+(UI.dss==='pts'?' selected':'')+'>Sort: points (low to high)</option></select></div>'
   +'<p class="muted" id="dscount">'+total+' datasheet'+(total===1?'':'s')+' shown</p>'
   +'<div class="cx-nav">'+cats.flatMap(c=>pick(c)).map(u=>'<a href="#ds-'+DS_SHEETS(u)[0]+'" data-act="dsgo" data-id="'+DS_SHEETS(u)[0]+'">'+esc(u.name.replace(/ (Sodality|Squad|Dreadnought)$/,'').replace(' — ',' · '))+'</a>').join('')+'</div></div>';
  cats.forEach(c=>{ const us=pick(c); if(!us.length) return;
    h+='<h2 class="aw-sec">'+esc(c[1])+'</h2>'+us.map(u=>DS_SHEETS(u).map((k,i)=>dsSheet(u,k,i===0)).join('')).join(''); });
  if(!total) h+='<p class="muted" style="text-align:center;padding:30px">No datasheet matches this search.</p>';
  $('#ds').innerHTML=h;
}

function renderNotes(){
  $('#np').innerHTML='<div class="notes">'+NOTES.map(n=>'<article><h2>'+esc(n[1])+'</h2><ul>'+n[2].map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></article>').join('')+'</div>';
}
function renderTabs(){
  document.body.dataset.tab=S.tab;
  document.querySelectorAll('#mtabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===S.tab)));
}
function renderAll(){ renderTop(); renderLeft(); renderRight(); renderOpts(); renderCodex(); renderDs(); renderKt(); renderMeta(); renderNotes(); renderTabs(); }
function commit(){ normalize(); save(); renderAll(); }

/* ============ SAVED LISTS ============ */
const LS_SAVED='custodes11-saved-v1';
const Saved={kind:'local',items:[],ready:false,msg:'',note:'',busy:false};
let _db=null,_uid=null;
const sigNow=()=>JSON.stringify([S.name,S.limit,S.dpMax,S.dets,S.list.map(i=>[i.id,i.opt,i.custom,i.enh,i.upg,i.wg||{},i.uid===S.warlord])]);
const isDirty=()=>S.list.length>0 && sigNow()!==S.savedSig;
function docNow(){
  return {name:S.name,updatedAt:new Date().toISOString(),limit:S.limit,dpMax:S.dpMax,dets:S.dets.slice(),total:total(),count:S.list.length,
    units:S.list.map(i=>({id:i.id,opt:i.opt,custom:i.custom,enh:i.enh,upg:i.upg,wg:i.wg||{},w:i.uid===S.warlord}))};
}
function localRead(){ try{ const o=JSON.parse(localStorage.getItem(LS_SAVED)||'{}'); return Object.keys(o).map(id=>Object.assign({id},o[id])); }catch(e){ return []; } }
function localWrite(id,doc){ try{ const o=JSON.parse(localStorage.getItem(LS_SAVED)||'{}'); if(doc) o[id]=doc; else delete o[id]; localStorage.setItem(LS_SAVED,JSON.stringify(o)); return true; }catch(e){ return false; } }
const cloudCol=()=>_db.collection('data/users/'+_uid);
async function refreshSaved(){
  try{
    if(Saved.kind==='cloud'){ const snap=await cloudCol().get(); Saved.items=snap.docs.filter(d=>d.exists).map(d=>Object.assign({id:d.id},d.data())); }
    else Saved.items=localRead();
    Saved.items.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  }catch(e){ Saved.items=[]; Saved.note='Could not read lists ('+((e&&e.code)||'error')+').'; }
  Saved.ready=true; if(UI.panel==='lists') renderRight();
}
async function initStore(){
  try{
    const c=window.claude;
    if(c&&c.use){
      const db=await c.use('db'), user=await c.use('user');
      const uid=user?await user.id():null;
      if(db&&uid){ _db=db; _uid=uid; Saved.kind='cloud'; }
    }
  }catch(e){}
  await refreshSaved();
}
async function storeSet(id,doc){
  if(Saved.kind==='cloud'){
    try{ await cloudCol().doc(id).set(doc); return true; }
    catch(e){ Saved.kind='local'; Saved.note='Write refused on your account ('+((e&&e.code)||'error')+'): saved in this browser instead.'; }
  }
  return localWrite(id,doc);
}
async function storeDel(id){
  if(Saved.kind==='cloud'){ try{ await cloudCol().doc(id).delete(); return true; }catch(e){ Saved.note='Deletion refused ('+((e&&e.code)||'error')+').'; return false; } }
  return localWrite(id,null);
}
async function doSave(id){
  if(Saved.busy) return; Saved.busy=true; Saved.note='';
  const doc=docNow(), nid=id||('r_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
  const ok=await storeSet(nid,doc);
  if(ok){ S.currentId=nid; S.savedSig=sigNow(); Saved.msg='List "'+doc.name+'" saved.'; save(); } else Saved.msg='Could not save: storage unavailable.';
  Saved.busy=false; await refreshSaved(); renderTop(); renderRight();
}
async function doDelete(id){
  if(Saved.busy) return; Saved.busy=true; Saved.note='';
  const it=Saved.items.find(x=>x.id===id);
  if(await storeDel(id)){ Saved.msg='List "'+(it?it.name:'')+'" deleted.'; if(S.currentId===id){ S.currentId=null; S.savedSig=null; save(); } }
  Saved.busy=false; await refreshSaved(); renderTop(); renderRight();
}
function applyDoc(d,id){
  const units=(Array.isArray(d.units)?d.units:[]).filter(u=>UM[u.id]);
  S.name=(d.name||'My roster').slice(0,40);
  S.limit=+d.limit>0?+d.limit:2000; S.dpMax=+d.dpMax>0?+d.dpMax:DP_DEFAULT;
  S.dets=(Array.isArray(d.dets)?d.dets:[]).filter(x=>DM[x]);
  S.list=units.map(u=>({uid:uidSeq++,id:u.id,opt:Math.min(u.opt|0,UM[u.id].opts.length-1),custom:+u.custom||0,enh:u.enh||null,upg:u.upg||null,wg:u.wg||{}}));
  const wi=units.findIndex(u=>u.w); S.warlord=wi>=0?S.list[wi].uid:null;
  S.currentId=id; UI.msg=''; normalize(); S.savedSig=sigNow(); Saved.msg='List "'+S.name+'" loaded.'; save(); renderAll();
}
function fmtDate(iso){ try{ return new Date(iso).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
function listsHtml(){
  const cur=Saved.items.find(x=>x.id===S.currentId);
  let h='<div class="panelbox"><h3>My lists</h3>';
  h+='<p class="muted" style="margin:0">'+(Saved.kind==='cloud'?'Lists saved to your account, private to you. They stay available on your next visit and on your other devices.':'Lists are saved in this browser only. To use them on another device, make a code in the box below.')+'</p>';
  if(Saved.note) h+='<p class="muted" style="margin:0;color:var(--warn)">'+esc(Saved.note)+'</p>';
  h+='<div class="row"><button class="btn pri" data-act="saveNew"'+(Saved.busy||!S.list.length?' disabled':'')+'>Save as new list</button>'
   +(cur?'<button class="btn" data-act="saveCur"'+(Saved.busy||!S.list.length?' disabled':'')+'>Update "'+esc(cur.name)+'"</button>':'')+'</div>';
  if(!S.list.length) h+='<p class="muted" style="margin:0">Add at least one unit to save.</p>';
  if(Saved.msg) h+='<p class="muted" style="margin:0;color:var(--ok)">'+esc(Saved.msg)+'</p>';
  h+='</div>';
  h+=syncHtml();
  if(!Saved.ready) return h+'<div class="empty">Loading lists…</div>';
  if(!Saved.items.length) return h+'<div class="empty">No saved lists.</div>';
  h+=secHead('r-saved','Saved lists',Saved.items.length+'');
  if(!UI.closed['r-saved']) Saved.items.forEach(it=>{
    const pend=UI.pending&&UI.pending.id===it.id?UI.pending.type:null, isCur=it.id===S.currentId;
    h+='<div class="er'+(isCur?' wl':'')+'"><div class="er-main"><div class="er-t"><b>'+esc(it.name||'Untitled')+'</b><i>'+(it.total||0)+' / '+(it.limit||0)+' pts</i>'+(isCur?'<em>Loaded</em>':'')+'</div>'
     +'<div class="er-s">'+(it.count||0)+' unit'+((it.count||0)>1?'s':'')+' · '+esc((it.dets||[]).map(x=>DM[x]?DM[x].name:x).join(', ')||'no detachment')+' · '+esc(fmtDate(it.updatedAt))+'</div>'
     +(pend==='load'?'<div class="chips"><span class="muted">Replace the current unsaved list?</span><button class="btn pri" data-act="confirmLoad" data-id="'+it.id+'">Confirm</button><button class="btn" data-act="pendNo">Cancel</button></div>':'')
     +(pend==='del'?'<div class="chips"><span class="muted">Delete this list?</span><button class="btn danger" data-act="confirmDel" data-id="'+it.id+'">Delete</button><button class="btn" data-act="pendNo">Cancel</button></div>':'')
     +'</div><div class="er-act"><button class="btn" data-act="loadList" data-id="'+it.id+'" style="margin-right:4px">Load</button>'+ibtn('delList','data-id="'+it.id+'"',IC.trash,'Delete this list')+'</div></div>';
  });
  return h;
}


/* ============ SYNC BETWEEN DEVICES (no account: a code, a link or a file) ============ */
const Sync={msg:'',code:''};
async function zipB64(t){
  if(window.CompressionStream){ try{ const cs=new CompressionStream('deflate-raw'); const w=cs.writable.getWriter(); w.write(new TextEncoder().encode(t)); w.close();
    const buf=new Uint8Array(await new Response(cs.readable).arrayBuffer()); let b=''; buf.forEach(x=>b+=String.fromCharCode(x)); return 'CB2.'+btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }catch(e){} }
  return 'CB1.'+b64u.enc(t);
}
async function unzipB64(c){
  c=c.trim(); const m=/(?:CB[12]\.[A-Za-z0-9_-]+)/.exec(c); if(!m) throw new Error('bad'); c=m[0];
  if(c.startsWith('CB1.')) return b64u.dec(c.slice(4));
  if(!window.DecompressionStream) throw new Error('nodecomp');
  const raw=atob(c.slice(4).replace(/-/g,'+').replace(/_/g,'/')), u=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) u[i]=raw.charCodeAt(i);
  const ds=new DecompressionStream('deflate-raw'); const w=ds.writable.getWriter(); w.write(u); w.close();
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
}
async function syncPack_async(){ Sync.code=await zipB64(JSON.stringify(syncPack())); syncSay('Code ready: copy it, then paste it into the same panel on the other device.'); }
function syncPack(){
  const lists={}; localRead().forEach(x=>{ const id=x.id; const d=Object.assign({},x); delete d.id; lists[id]=d; });
  return {v:1,app:'custodes-builder',at:new Date().toISOString(),lists,current:S.list.length?docNow():null};
}
async function syncMerge(pack){
  if(!pack||typeof pack!=='object'||!pack.lists||typeof pack.lists!=='object') throw new Error('bad');
  let added=0,updated=0,kept=0; const have=Object.fromEntries(localRead().map(x=>[x.id,x]));
  Object.keys(pack.lists).forEach(id=>{ const d=pack.lists[id]; if(!d||!Array.isArray(d.units)) return;
    const cur=have[id]; if(!cur){ localWrite(id,d); added++; }
    else if(String(d.updatedAt||'')>String(cur.updatedAt||'')){ localWrite(id,d); updated++; } else kept++; });
  if(pack.current&&Array.isArray(pack.current.units)&&pack.current.units.length&&!S.list.length){ applyDoc(pack.current,null); }
  await refreshSaved();
  return 'Import done: '+added+' new, '+updated+' updated, '+kept+' already up to date.';
}
async function syncImportText(t){
  t=t.trim(); if(!t) throw new Error('empty');
  let pack; if(t[0]==='{'){ pack=JSON.parse(t); if(Array.isArray(pack.units)){ applyDoc(pack,null); return 'List "'+S.name+'" loaded.'; } }
  else pack=JSON.parse(await unzipB64(t));
  return syncMerge(pack);
}
function syncHtml(){
  const n=Saved.items.length;
  return '<div class="panelbox"><h3>Use my lists on another device</h3>'
   +'<p class="muted" style="margin:0">Lists live in this browser. There is no account, so nothing leaves it unless you send it. Make a code here, paste it into the same panel on your phone or another computer, and your '+n+' saved list'+(n==1?'':'s')+(S.list.length?' and the list being edited':'')+' follow. Importing merges: the most recent copy of each list wins, nothing is deleted.</p>'
   +'<div class="row"><button class="btn pri" data-act="syncCode">Make a code</button><button class="btn" data-act="syncLink">Copy a link</button><button class="btn" data-act="syncFile">Download a backup file</button></div>'
   +(Sync.code?'<textarea id="synccode" readonly rows="3" aria-label="Sync code">'+esc(Sync.code)+'</textarea><div class="row"><button class="btn" data-act="syncCopy">Copy the code</button></div>':'')
   +'<label class="muted" for="syncin" style="margin-top:8px;display:block">Import: paste a code, a link or a backup text, or choose a file.</label>'
   +'<textarea id="syncin" rows="3" placeholder="CB2.…" aria-label="Code to import"></textarea>'
   +'<div class="row"><button class="btn pri" data-act="syncImport">Import</button><label class="btn" for="syncfile" style="cursor:pointer">Choose a file…</label><input id="syncfile" type="file" accept=".json,.txt,application/json,text/plain" hidden></div>'
   +(Sync.msg?'<p class="muted" id="syncmsg" style="margin:0;color:var(--ok)" role="status">'+esc(Sync.msg)+'</p>':'')
   +'</div>';
}
const syncSay=m=>{ Sync.msg=m; if(UI.panel==='lists') renderRight(); };
const syncCopyText=async(t,ok)=>{ try{ await navigator.clipboard.writeText(t); syncSay(ok); }catch(e){ syncSay('Copy was refused: select the text and copy it by hand.'); } };

/* ============ EVENTS ============ */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]'); if(!b || b.disabled) return;
  const a=b.dataset.act, id=b.dataset.id, uid=+b.dataset.uid;
  if(a==='tab'){ let t=b.dataset.tab; if(t==='notesToggle') t=S.tab==='notes'?'roster':'notes'; if(t==='codexToggle') t=S.tab==='codex'?'roster':'codex'; if(t==='dsToggle') t=S.tab==='ds'?'roster':'ds'; if(t==='ktToggle') t=S.tab==='kt'?'roster':'kt'; if(t==='metaToggle') t=S.tab==='meta'?'roster':'meta'; S.tab=t; save(); renderTabs(); return; }
  if(a==='panel'){ const p=b.dataset.p; UI.panel=UI.panel===p?null:p; UI.confirm=false; if(S.tab==='cat'&&window.innerWidth<1000) S.tab='roster'; if(['notes','codex','ds','kt','meta'].includes(S.tab)) S.tab='roster'; renderRight(); renderTabs(); return; }
  if(a==='sec'){ UI.closed[id]=!UI.closed[id]; renderLeft(); renderRight(); renderOpts(); return; }
  if(a==='eyeD'){ UI.eye['d:'+id]=!UI.eye['d:'+id]; renderLeft(); renderRight(); return; }
  if(a==='cxf'){ UI.cxf=b.dataset.f; renderCodex(); return; }
  if(a==='dsf'){ UI.dsf=b.dataset.f; renderDs(); dsUrl(); return; }
  if(a==='dsgo'){ e.preventDefault(); const el=document.getElementById('ds-'+id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if(a==='mtgo'){ e.preventDefault(); const el=document.getElementById('mt-'+id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if(a==='cxgo'){ e.preventDefault(); const el=document.getElementById('cx-'+id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if(a==='eyeE'){ UI.eye[b.dataset.key]=!UI.eye[b.dataset.key]; renderRight(); renderOpts(); return; }
  if(a==='pick'){ const it=S.list.find(i=>i.uid===uid); if(!it) return; const k=b.dataset.k; it[k]=it[k]===id?null:id; UI.msg=''; commit(); return; }
  if(a==='eyeU'){ UI.eye[b.dataset.key]=!UI.eye[b.dataset.key]; renderLeft(); return; }
  if(a==='toggleNo'){ UI.showNo=!UI.showNo; renderLeft(); return; }
  if(a==='size'){ S.limit=+b.dataset.v; UI.msg=''; commit(); return; }
  if(a==='det'){ UI.msg=''; if(S.dets.includes(id)) S.dets=S.dets.filter(x=>x!==id); else if(!detLock(id)) S.dets.push(id); commit(); return; }
  if(a==='add'){
    UI.msg=''; const u=UM[id], opt=+b.dataset.opt;
    S.list.push({uid:uidSeq++,id,opt,custom:u.opts[opt].p==null?(UI.manual[id]||0):0,enh:null,upg:null,wg:{}}); UI.sel=S.list[S.list.length-1].uid;
    if(id==='trajann') S.warlord=S.list[S.list.length-1].uid;
    commit(); return;
  }
  if(a==='syncCode'){ syncPack_async(); return; }
  if(a==='syncLink'){ (async()=>{ const c=await zipB64(JSON.stringify(syncPack())); Sync.code=c; syncCopyText(location.origin+location.pathname.replace(/[^/]*$/,'builder.html')+'#sync='+c,'Link copied. Open it on the other device.'); })(); return; }
  if(a==='syncCopy'){ syncCopyText(Sync.code,'Code copied.'); return; }
  if(a==='syncFile'){ try{ const blob=new Blob([JSON.stringify(syncPack(),null,1)],{type:'application/json'}); const l=document.createElement('a'); l.href=URL.createObjectURL(blob); l.download='custodes-lists-'+new Date().toISOString().slice(0,10)+'.json'; document.body.appendChild(l); l.click(); setTimeout(()=>{ URL.revokeObjectURL(l.href); l.remove(); },500); syncSay('Backup file downloaded.'); }catch(x){ syncSay('Download refused: use "Make a code" instead.'); } return; }
  if(a==='syncImport'){ const ta=$('#syncin'); syncImportText(ta?ta.value:'').then(syncSay,()=>syncSay('This is not a valid code, link or backup.')); return; }
  if(a==='saveNew'){ doSave(null); return; }
  if(a==='saveCur'){ doSave(S.currentId); return; }
  if(a==='loadList'){ const it=Saved.items.find(x=>x.id===id); if(!it) return; if(isDirty()){ UI.pending={type:'load',id}; renderRight(); } else applyDoc(it,id); return; }
  if(a==='confirmLoad'){ const it=Saved.items.find(x=>x.id===id); UI.pending=null; if(it) applyDoc(it,id); return; }
  if(a==='delList'){ UI.pending={type:'del',id}; renderRight(); return; }
  if(a==='confirmDel'){ UI.pending=null; doDelete(id); return; }
  if(a==='pendNo'){ UI.pending=null; renderRight(); return; }
  if(a==='rexp'){ UI.sel=selUid()===uid?null:uid; renderRight(); renderOpts(); return; }
  if(a==='selu'){ UI.sel=uid; renderRight(); renderOpts(); return; }
  if(a==='rm'){ UI.msg=''; S.list=S.list.filter(i=>i.uid!==uid); if(S.warlord===uid) S.warlord=null; commit(); return; }
  if(a==='dup'){
    UI.msg=''; const it=S.list.find(i=>i.uid===uid); if(!it) return;
    if(it.id==='trajann'){ UI.msg='Trajann Valoris is an Epic Hero: only one copy.'; renderRight(); return; }
    S.list.push({uid:uidSeq++,id:it.id,opt:it.opt,custom:it.custom,enh:null,upg:null,wg:JSON.parse(JSON.stringify(it.wg||{}))}); UI.sel=S.list[S.list.length-1].uid; commit(); return;
  }
  if(a==='wg1'||a==='wgt'||a==='wgs'){
    const it=S.list.find(i=>i.uid===uid); if(!it) return; const g=wgGroups(it).find(x=>x.id===b.dataset.g); if(!g) return; it.wg=it.wg||{};
    if(a==='wg1'){ it.wg[g.id]=+b.dataset.c; }
    else if(a==='wgt'){ it.wg[g.id]=it.wg[g.id]?0:1; }
    else { const arr=Array.isArray(it.wg[g.id])?it.wg[g.id].slice():g.c.map(()=>0); const i=+b.dataset.c; arr[i]=Math.max(0,arr[i]+(+b.dataset.d)); it.wg[g.id]=arr; }
    UI.msg=''; commit(); return;
  }
  if(a==='wl'){ UI.msg=''; S.warlord=S.warlord===uid?null:uid; commit(); return; }
  if(a==='reset'){ UI.confirm=true; renderRight(); return; }
  if(a==='reset-no'){ UI.confirm=false; renderRight(); return; }
  if(a==='reset-yes'){ UI.confirm=false; UI.msg=''; S.list=[]; S.warlord=null; commit(); return; }
  if(a==='copy'){
    const ta=$('#exp'), done=m=>{ const c=$('#copied'); if(c) c.textContent=m; };
    const fallback=()=>{ ta.focus(); ta.select(); done('Text selected: copy it with Ctrl+C.'); };
    try{ navigator.clipboard.writeText(ta.value).then(()=>done('Copied.'),fallback); }catch(err){ fallback(); }
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='syncfile'){ const f=e.target.files&&e.target.files[0]; if(f){ const r=new FileReader(); r.onload=()=>syncImportText(String(r.result)).then(syncSay,()=>syncSay('This file is not a valid backup.')); r.readAsText(f); } return; }
  const t=e.target, a=t.dataset&&t.dataset.act;
  if(t.id==='rname'){ S.name=(t.value.trim()||'My roster').slice(0,40); t.value=S.name; save(); if(UI.panel==='export') renderRight(); return; }
  if(t.id==='dpMax'){ const v=Math.round(+t.value); if(v>=1&&v<=12){ S.dpMax=v; UI.msg=''; commit(); } return; }
  if(t.id==='limitIn'){ const v=Math.round(+t.value); if(v>=50){ S.limit=v; UI.msg=''; commit(); } return; }
  if(!a) return;
  const uid=+t.dataset.uid, it=S.list.find(i=>i.uid===uid);
  if(a==='manual'){ UI.manual[t.dataset.id]=Math.max(0,Math.round(+t.value)||0); renderLeft(); return; }
  if(a==='opt'&&it){ it.opt=+t.value; UI.msg=''; commit(); return; }
  if(a==='custom'&&it){ it.custom=Math.max(0,Math.round(+t.value)||0); commit(); return; }
  if(a==='enh'&&it){ it[t.dataset.k]=t.value||null; UI.msg=''; commit(); return; }
});
$('#q').addEventListener('input',e=>{ UI.q=e.target.value; renderLeft(); });

/* ============ INIT ============ */
load(); normalize();
if(window.SITE_TAB){ if(Array.isArray(SITE_TAB)){ if(!SITE_TAB.includes(S.tab)) S.tab=SITE_TAB[0]; } else S.tab=SITE_TAB; }
renderAll();
initStore();

/* ---- datasheet search/sort, roster JSON, share link ---- */
document.addEventListener('input',e=>{
  if(e.target.id==='dsq'){ const pos=e.target.selectionStart; UI.dsq=e.target.value.slice(0,60); renderDs(); dsUrl(); const i=$('#dsq'); if(i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(x){} } }
});
document.addEventListener('change',e=>{
  if(e.target.id==='dss'){ UI.dss=e.target.value==='pts'?'pts':'name'; renderDs(); dsUrl(); const i=$('#dss'); if(i) i.focus(); }
});
const b64u={enc:t=>btoa(unescape(encodeURIComponent(t))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),dec:t=>decodeURIComponent(escape(atob(t.replace(/-/g,'+').replace(/_/g,'/'))))};
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act;
  const done=(id,m)=>{ const c=$('#'+id); if(c) c.textContent=m; };
  const copy=(ta,id)=>{ const fb=()=>{ ta.focus(); ta.select(); done(id,'Text selected: copy it with Ctrl+C.'); }; try{ navigator.clipboard.writeText(ta.value).then(()=>done(id,'Copied.'),fb); }catch(x){ fb(); } };
  if(a==='copyjson'){ copy($('#expj'),'copiedj'); }
  if(a==='copylink'){ const url=location.origin+location.pathname.replace(/[^/]*$/,'builder.html')+'#list='+b64u.enc(JSON.stringify(docNow())); const t=document.createElement('textarea'); t.value=url; document.body.appendChild(t); copy(t,'copiedj'); setTimeout(()=>t.remove(),1500); }
  if(a==='import'){ const ta=$('#impj'); try{ const d=JSON.parse(ta.value); if(!d||!Array.isArray(d.units)) throw new Error('bad'); applyDoc(d,null); UI.panel='export'; renderRight(); }catch(x){ done('impmsg','This is not a valid roster file.'); } }
});
(function loadSync(){ try{ const m=/[#&]sync=([^&]+)/.exec(location.hash); if(!m) return; history.replaceState(null,'',location.pathname+location.search); syncImportText(m[1]).then(r=>{ UI.panel='lists'; Sync.msg=r; renderRight(); },()=>{}); }catch(x){} })();
(function loadShared(){ try{ const m=/[#&]list=([^&]+)/.exec(location.hash); if(!m) return; const d=JSON.parse(b64u.dec(m[1])); if(d&&Array.isArray(d.units)){ applyDoc(d,null); try{ history.replaceState(null,'',location.pathname+location.search); }catch(x){} } }catch(x){} })();
