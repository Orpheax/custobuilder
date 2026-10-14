/* Game help: rules, stratagems and datasheets of the list being played. Reads the roster the builder keeps in this browser. */
(function(){
'use strict';
var D=window.DATA||{}, DETS=D.DETS||[], ENH=D.ENH||[], U=D.U||[], DSD=D.DSD||{}, KT=D.KT||[], WG=D.WG||{}, CORE=D.CORE||[];
var UM={},DM={},EM={}; U.forEach(function(u){UM[u.id]=u}); DETS.forEach(function(d){DM[d.id]=d}); ENH.forEach(function(e){EM[e.id]=e});
var KEY='custodes11-list-v3', LS='custodes11-saved-v1';
var PHASES=['Command','Movement','Shooting','Charge','Fight','Any phase'];
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var root=document.getElementById('gh'); if(!root) return;
var ST={sel:'cur',scope:'list',turn:'any'};

/* ---- read the lists ---- */
function clean(name,dets,units,limit,id){
  units=(Array.isArray(units)?units:[]).filter(function(u){return u&&UM[u.id]});
  return {id:id,name:String(name||'My roster').slice(0,40),limit:+limit||0,dets:(Array.isArray(dets)?dets:[]).filter(function(x){return DM[x]}),units:units};
}
function readCur(){ try{ var o=JSON.parse(localStorage.getItem(KEY)||'null'); if(o&&Array.isArray(o.list)){ var l=clean(o.name,o.dets,o.list.map(function(i){return {id:i.id,opt:i.opt,custom:i.custom,enh:i.enh,upg:i.upg,wg:i.wg,w:i.w}}),o.limit,'cur'); if(l.units.length) return l; } }catch(e){} return null; }
function readSaved(){ try{ var o=JSON.parse(localStorage.getItem(LS)||'{}'); return Object.keys(o).map(function(id){ var d=o[id]; var l=clean(d.name,d.dets,d.units,d.limit,id); l.at=d.updatedAt||''; return l; }).filter(function(l){return l.units.length}).sort(function(a,b){return String(b.at).localeCompare(String(a.at))}); }catch(e){ return []; } }

/* ---- points ---- */
function points(l){
  var seen={}, tot=0;
  l.units.forEach(function(it){
    var u=UM[it.id], o=u.opts[Math.min(it.opt|0,u.opts.length-1)]||u.opts[0];
    var p=o.p!=null?o.p:(+it.custom||0); var sk=u.po?it.id+':'+(it.opt|0):it.id; seen[sk]=(seen[sk]||0)+1;
    if(u.ups){ var s=0; Object.keys(u.ups).map(Number).sort(function(a,b){return a-b}).forEach(function(k){ if(seen[sk]>=k) s=u.ups[k]; }); p+=s; }
    if(it.enh&&EM[it.enh]) p+=EM[it.enh].p; if(it.upg&&EM[it.upg]) p+=EM[it.upg].p;
    tot+=p;
  });
  return tot;
}
function optOf(it){ var u=UM[it.id]; return u.opts[Math.min(it.opt|0,u.opts.length-1)]||u.opts[0]; }
function wargear(it){
  var L=[], nm=(function(){ var m=/(\d+) models?/.exec(optOf(it).l); return m?+m[1]:1; })();
  (WG[it.id]||[]).filter(function(g){return g.opt==null||g.opt===(it.opt|0)}).forEach(function(g){
    var v=it.wg&&it.wg[g.id];
    if(g.k==='one'){ if(v>0&&g.c[v]) L.push(g.c[v].replace(/ \(replaces.*\)$/,'')); }
    else if(g.k==='tog'){ if(v) L.push(g.c[0]); }
    else if(Array.isArray(v)) v.forEach(function(n,i){ if(n>0&&g.c[i]) L.push(n+'× '+g.c[i]); });
  });
  return L;
}

/* ---- strata: phase and turn ---- */
function phases(p){ var pl=String(p).toLowerCase(), o=[]; [['command','Command'],['movement','Movement'],['shooting','Shooting'],['charge','Charge'],['fight','Fight']].forEach(function(x){ if(pl.indexOf(x[0])>=0) o.push(x[1]); }); if(pl.indexOf('any')>=0||!o.length) o.push('Any phase'); return o; }
function turnOf(p){ return String(p).toLowerCase().indexOf('opponent')>=0?'opp':'you'; }
function ktEff(k){ return k.e+(k.l?'<ul>'+k.l.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>':''); }
function ktPhases(w){ var t=String(w).replace(/<[^>]+>/g,''); return phases(t); }

/* ---- card builders ---- */
function stratCard(c){
  return '<article class="cx-box cx-st sg"><span class="cp">'+c.cp+' CP</span><b>'+esc(c.n)+'</b><i>'+esc(c.w)+'</i><p>'+esc(c.t)+'</p><small>'+c.tag+'</small></article>';
}
function dsKw(a){ return (a||[]).map(function(k){return '<span class="ds-kw">'+esc(k.replace(/^\[|\]$/g,''))+'</span>'}).join(' '); }
function dsTxt(t){ return esc(t).replace(/\n- /g,'<br>• ').replace(/\n/g,'<br>').replace(/\?(?= (?:ADEPTUS|models|\?))/g,'<i class="tv">[to verify]</i>'); }
function dsWeapons(list,melee){
  if(!list||!list.length) return '';
  return '<table class="ds-wt"><thead><tr><th>'+(melee?'MELEE WEAPONS':'RANGED WEAPONS')+'</th><th>RANGE</th><th>A</th><th>'+(melee?'WS':'BS')+'</th><th>S</th><th>AP</th><th>D</th></tr></thead><tbody>'
   +list.map(function(w){return '<tr><td class="ds-wn">'+esc(w.name)+(w.kw&&w.kw.length?'<div>'+dsKw(w.kw)+'</div>':'')+'</td><td>'+esc(w.range)+'</td><td>'+esc(w.A)+'</td><td>'+esc(melee?w.WS:w.BS)+'</td><td>'+esc(w.S)+'</td><td>'+esc(w.AP)+'</td><td>'+esc(w.D)+'</td></tr>'}).join('')+'</tbody></table>';
}
function sheet(k){
  var d=DSD[k]; if(!d) return ''; var s=d.stats;
  var st=function(l,v){return '<div class="ds-st"><small>'+l+'</small><b>'+esc(v)+'</b></div>'};
  return '<article class="cx-d ds-d" id="gh-ds-'+k+'"><header class="ds-h"><h2>'+esc(d.name)+'</h2><a class="perma" href="ds-'+k+'.html" title="Permanent link to this datasheet">link</a>'
   +'<div class="ds-stats">'+st('M',s.M)+st('T',s.T)+st('SV',s.Sv)+st('W',s.W)+st('LD',s.Ld)+st('OC',s.OC)+(s.Inv?'<div class="ds-inv"><small>INSV</small><b>'+esc(s.Inv)+'</b></div>':'')+'</div></header>'
   +'<div class="ds-body"><div class="ds-l">'+dsWeapons(d.melee,true)+dsWeapons(d.ranged,false)+'</div>'
   +'<div class="ds-r">'+(((d.core&&d.core.length)||(d.army&&d.army.length))?'<div class="ds-ca">'+(d.core&&d.core.length?'<div><span>CORE ABILITIES</span><b>'+d.core.map(esc).join(', ')+'</b></div>':'')+(d.army&&d.army.length?'<div><span>ARMY RULES</span><b>'+d.army.map(esc).join(', ')+'</b></div>':'')+'</div>':'')
   +(d.abilities&&d.abilities.length?'<div class="ds-sh">ABILITIES</div>'+d.abilities.map(function(a){return '<p class="ds-ab"><b>'+esc(a.name)+(a.text?':':'')+'</b> '+dsTxt(a.text||'')+'</p>'}).join(''):'')+'</div></div></article>';
}
var SHEETS=function(id){ return id==='aquilon'?['aquilon_g','aquilon_t']:[id]; };

/* ---- the view ---- */
function view(){
  var cur=readCur(), saved=readSaved(), l=null;
  if(ST.sel==='cur') l=cur; else l=saved.filter(function(x){return x.id===ST.sel})[0]||null;
  if(!l&&ST.sel!=='cur'){ ST.sel='cur'; l=cur; }
  var all=ST.scope==='all'||!l;
  var dets=all?DETS:l.dets.map(function(i){return DM[i]});
  var h='';

  /* picker + scope */
  h+='<div class="gh-bar" role="group" aria-label="List to play">';
  h+='<label class="gh-sel"><span>List</span><select id="gh-list">'+(cur?'<option value="cur"'+(ST.sel==='cur'?' selected':'')+'>Builder list: '+esc(cur.name)+'</option>':'<option value="cur">No list in the builder</option>')
    +saved.map(function(x){return '<option value="'+esc(x.id)+'"'+(ST.sel===x.id?' selected':'')+'>Saved: '+esc(x.name)+'</option>'}).join('')+'</select></label>';
  h+='<div class="gh-sc"><button type="button" class="chip" data-gh="scope" data-v="list" aria-pressed="'+(!all)+'"'+(l?'':' disabled')+'>My list</button><button type="button" class="chip" data-gh="scope" data-v="all" aria-pressed="'+all+'">All detachments</button></div>';
  h+='<div class="gh-sc"><button type="button" class="chip" data-gh="turn" data-v="any" aria-pressed="'+(ST.turn==='any')+'">Both turns</button><button type="button" class="chip" data-gh="turn" data-v="you" aria-pressed="'+(ST.turn==='you')+'">My turn</button><button type="button" class="chip" data-gh="turn" data-v="opp" aria-pressed="'+(ST.turn==='opp')+'">Opponent’s turn</button></div></div>';

  /* summary */
  if(l){
    var counts={}; l.units.forEach(function(i){counts[i.id]=(counts[i.id]||0)+1});
    h+='<section class="gh-sum" id="gh-top"><h2>'+esc(l.name)+'</h2><p class="muted">'+points(l)+(l.limit?' / '+l.limit:'')+' pts · '+l.units.length+' unit'+(l.units.length>1?'s':'')+' · '+(l.dets.length?l.dets.map(function(i){return esc(DM[i].name)}).join(', '):'no detachment chosen')+'</p></section>';
  } else {
    h+='<section class="gh-sum" id="gh-top"><h2>No list yet</h2><p class="muted">Build a list in the <a href="builder.html">builder</a> and this page fills itself with its stratagems, rules and datasheets. Saved lists appear in the picker above. Meanwhile it shows every detachment.</p></section>';
  }

  /* jump nav */
  var jump=PHASES.map(function(p){return '<a href="#gh-ph-'+p.split(' ')[0].toLowerCase()+'">'+p+'</a>'}).join('')+'<a href="#gh-rules">Rules</a><a href="#gh-katah">Ka’tah</a>'+(l?'<a href="#gh-enh">Enhancements</a><a href="#gh-units">Datasheets</a>':'');
  h+='<nav class="sg-jump gh-jump" aria-label="Sections">'+jump+'</nav>';

  /* phases: stratagems + ka'tah */
  var kts=KT.map(function(k){ return {k:k,ph:ktPhases(k.w),fav:!all&&l&&l.dets.indexOf(k.d)>=0}; });
  PHASES.forEach(function(p){
    var cards=[];
    dets.forEach(function(d){ (d.strats||[]).forEach(function(s){
      if(phases(s[2]).indexOf(p)<0) return; if(ST.turn!=='any'&&turnOf(s[2])!==ST.turn) return;
      cards.push(stratCard({n:s[0],cp:s[1],w:s[2],t:s[3],tag:'<a href="det-'+d.id+'.html">'+esc(d.name)+'</a>'}));
    }); });
    CORE.forEach(function(c){
      if(c.ph.indexOf(p)<0) return; if(ST.turn!=='any'&&c.s!==ST.turn) return;
      cards.push(stratCard({n:c.n,cp:c.cp,w:c.w,t:c.t,tag:'Core stratagem <i class="tv">[to verify]</i>'}));
    });
    var kc=[]; if(ST.turn!=='opp') kts.forEach(function(x){ if(x.ph.indexOf(p)>=0) kc.push('<article class="cx-box cx-st sg gh-kt"><b>Ka’tah '+esc(x.k.n)+'</b>'+(x.fav?' <span class="cx-tag u">favoured</span>':'')+'<i>'+x.k.w+'</i><p>'+ktEff(x.k)+'</p>'+(x.fav?'<p><b>Favoured:</b> '+esc(x.k.f)+'</p>':'')+'</article>'); });
    h+='<section class="sg-sec gh-ph" id="gh-ph-'+p.split(' ')[0].toLowerCase()+'"><h2 class="sg-h">'+p+'<small>'+(cards.length+kc.length)+' reminder'+(cards.length+kc.length==1?'':'s')+'</small></h2>';
    h+=(cards.length+kc.length)?'<div class="sg-grid">'+cards.join('')+kc.join('')+'</div>':'<p class="muted">Nothing in this phase for this selection.</p>';
    h+='</section>';
  });

  /* rules */
  h+='<section class="sg-sec" id="gh-rules"><h2 class="sg-h">Rules of the army<small>detachment and army-wide</small></h2><div class="sg-grid">';
  dets.forEach(function(d){ h+='<article class="cx-box"><b>'+esc(d.name)+'</b> <span class="cx-tag">'+esc(d.fd)+'</span><p><b>'+esc(d.rule.n)+'.</b> '+esc(d.rule.t)+'</p><small><a href="det-'+d.id+'.html">Open detachment</a></small></article>'; });
  if(l){
    var ids={}, aeg=[], core={}; l.units.forEach(function(i){ if(ids[i.id]) return; ids[i.id]=1; SHEETS(i.id).forEach(function(k){ var d=DSD[k]; if(!d) return;
      if((d.army||[]).some(function(a){return /^Aegis/i.test(a)})) aeg.push(d.name);
      (d.core||[]).forEach(function(c){ (core[c]=core[c]||[]).push(d.name); }); }); });
    if(aeg.length) h+='<article class="cx-box"><b>Aegis of the Emperor</b><p>Carried by: '+aeg.map(esc).join(', ')+'.</p><small>The rule text is not in this site’s data: read it in your codex.</small></article>';
    h+='<article class="cx-box"><b>Martial Ka’tah</b><p>Each readied unit may adopt one ka’tah when its trigger comes up (see the phases above and the Ka’tah section).</p></article>';
    var ck=Object.keys(core).sort();
    if(ck.length) h+='<article class="cx-box"><b>Core abilities in your list</b><p>'+ck.map(function(c){return '<b>'+esc(c)+'</b> ('+core[c].map(esc).join(', ')+')'}).join(' · ')+'</p><small><a href="rules.html">All army rules</a></small></article>';
  }
  h+='</div></section>';

  /* ka'tah */
  h+='<section class="sg-sec" id="gh-katah"><h2 class="sg-h">Ka’tah<small>all six</small></h2><div class="sg-grid">';
  kts.forEach(function(x){ h+='<article class="cx-box cx-st sg"><b>'+esc(x.k.n)+'</b>'+(x.fav?' <span class="cx-tag u">favoured by your detachment</span>':'')+'<i>'+x.k.w+'</i><p><b>Target.</b> '+x.k.tg+'</p><p>'+ktEff(x.k)+'</p><p><b>Favoured:</b> '+esc(x.k.f)+'</p></article>'; });
  h+='</div></section>';

  if(l){
    /* enhancements */
    var er=[]; l.units.forEach(function(it){ [it.enh,it.upg].forEach(function(e){ if(e&&EM[e]) er.push('<article class="cx-box"><span class="cp">'+EM[e].p+' pts</span><b>'+esc(EM[e].name)+'</b><i>'+esc(UM[it.id].name)+(it.w?' · Warlord':'')+'</i><p>'+esc(EM[e].t)+'</p></article>'); }); });
    var wl=l.units.filter(function(i){return i.w}).map(function(i){return UM[i.id].name})[0];
    h+='<section class="sg-sec" id="gh-enh"><h2 class="sg-h">Enhancements and upgrades<small>'+er.length+'</small></h2>'+(wl?'<p class="muted">Warlord: '+esc(wl)+'.</p>':'')+(er.length?'<div class="sg-grid">'+er.join('')+'</div>':'<p class="muted">No enhancement or upgrade in this list.</p>')+'</section>';

    /* datasheets */
    var order=[], n={}, enhBy={}; l.units.forEach(function(it){ if(!n[it.id]){ n[it.id]=0; order.push(it); } n[it.id]++; });
    h+='<section class="sg-sec" id="gh-units"><h2 class="sg-h">Datasheets<small>'+order.length+' different unit'+(order.length==1?'':'s')+'</small></h2>';
    order.forEach(function(first){
      var u=UM[first.id], copies=l.units.filter(function(i){return i.id===first.id});
      var lines=copies.map(function(it){ var bits=[optOf(it).l]; var wg=wargear(it); if(wg.length) bits.push(wg.join(', ')); if(it.enh&&EM[it.enh]) bits.push(EM[it.enh].name); if(it.upg&&EM[it.upg]) bits.push(EM[it.upg].name); if(it.w) bits.push('Warlord'); return '<li>'+esc(bits.join(' · '))+'</li>'; }).join('');
      h+='<details class="gh-un" open><summary><b>'+esc(u.name)+'</b>'+(copies.length>1?' <span class="cx-tag u">× '+copies.length+'</span>':'')+'</summary><ul class="gh-lines">'+lines+'</ul>'+SHEETS(first.id).map(sheet).join('')+'</details>';
    });
    h+='</section>';
  }
  root.innerHTML=h;
}
root.addEventListener('click',function(e){ var b=e.target.closest('[data-gh]'); if(!b||b.disabled) return; ST[b.dataset.gh]=b.dataset.v; view(); });
root.addEventListener('change',function(e){ if(e.target.id==='gh-list'){ ST.sel=e.target.value; if(ST.scope==='all'&&ST.sel!=='cur') ST.scope='list'; view(); } });
window.addEventListener('storage',function(e){ if(e.key===KEY||e.key===LS) view(); });
document.addEventListener('visibilitychange',function(){ if(!document.hidden) view(); });
view();
})();
