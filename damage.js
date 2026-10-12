/* Damage simulator (UnitCrunch-style): analytic expectation + Monte Carlo spread. Engine mirrors dmg.py. */
(function(){
var D=JSON.parse(document.getElementById('dmgdata').textContent),$=function(s){return document.querySelector(s)},$$=function(s){return[].slice.call(document.querySelectorAll(s))};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function dist(d){var m=/^D(3|6)(?:\+(\d+))?$/.exec(String(d));if(m){var n=+m[1],k=+(m[2]||0),a=[];for(var i=1;i<=n;i++)a.push(k+i);return a}return[parseInt(d)]}
function needW(S,T){return S>=2*T?2:S>T?3:S===T?4:S*2<=T?6:5}
function roll(need,mod,crit,rr){var pc=0,ps=0,pf=0;for(var f=1;f<=6;f++){if(f>=crit)pc+=1/6;else if(f!==1&&f+mod>=need)ps+=1/6;else pf+=1/6}
 if(rr==='failed')return[pc+pf*pc,ps+pf*ps,pf*pf];if(rr==='ones')return[pc+pc/6,ps+ps/6,pf-1/6+pf/6];return[pc,ps,pf]}
function cond(c,kw){c=(c||'').trim().toLowerCase();if(!c)return true;var k=kw.map(function(x){return x.toLowerCase()}),mv=k.indexOf('monster')>=0||k.indexOf('vehicle')>=0;if(c==='non-monster/vehicle')return!mv;if(c==='monster/vehicle')return mv;return k.indexOf(c)>=0}
function pk(kws){var o={};kws.forEach(function(k){var i=k.indexOf(':'),b=(i<0?k:k.slice(0,i)).trim(),c=i<0?'':k.slice(i+1).trim(),m;
 if(b.indexOf('ANTI-')===0){m=/^ANTI-([A-Z]+) (\d)\+$/.exec(b);if(m)o.anti=[m[1].toLowerCase(),+m[2]]}
 else if(b.indexOf('SUSTAINED HITS')===0)o.sus=[+b.split(' ').pop(),c];
 else if(b.indexOf('RAPID FIRE')===0)o.rf=+b.split(' ').pop();
 else if(b.indexOf('MELTA')===0)o.melta=+b.split(' ').pop();
 else if(b==='LETHAL HITS')o.lethal=c;else if(b==='DEVASTATING WOUNDS')o.dev=c;
 else if(b==='TWIN-LINKED')o.twin=1;else if(b==='TORRENT')o.torrent=1;else if(b==='LANCE')o.lance=1});return o}
var DEF={half:false,charge:false,hit:0,wound:0,rrh:'none',rrw:'none',ch:6,cw:6,addA:0,addS:0,addAP:0,addD:0,sus:0,lethal:false,dev:false,cover:false,ignCover:false,thit:0,twound:0};
function prep(w,t,m){m=Object.assign({},DEF,m||{});var kw=t.kw||[],k=pk(w.kw),A=+w.A+m.addA+(m.half&&k.rf?k.rf:0),sk=w.BS||w.WS,tor=!!k.torrent||sk==='-',nh=tor?0:parseInt(sk),mh=clamp(m.hit+m.thit,-1,1),h=tor?[0,1,0]:roll(nh,mh,m.ch,m.rrh);
 var kwl=kw.map(function(x){return x.toLowerCase()}),sus=m.sus+((k.sus&&cond(k.sus[1],kw))?k.sus[0]:0),lethal=m.lethal||(k.lethal!==undefined&&cond(k.lethal,kw)),dev=m.dev||(k.dev!==undefined&&cond(k.dev,kw));
 var S=+w.S+m.addS,nw=needW(S,t.T),mw=clamp(m.wound+m.twound+((m.charge&&k.lance)?1:0),-1,1),cw=m.cw;if(k.anti&&kwl.indexOf(k.anti[0])>=0)cw=Math.min(cw,k.anti[1]);
 var rrw=(k.twin||m.rrw==='failed')?'failed':m.rrw,wr=roll(nw,mw,cw,rrw),apabs=-(+w.AP)+m.addAP,ns=t.Sv+apabs;
 if(m.cover&&!m.ignCover&&(w.t||'R')==='R'&&!(apabs===0&&t.Sv<=3))ns-=1;var pas=clamp((7-ns)/6,0,5/6);if(t.Inv)pas=Math.max(pas,clamp((7-t.Inv)/6,0,5/6));
 var melta=(m.half&&k.melta)?k.melta:0,ds=dist(w.D).map(function(x){return x+m.addD+melta});
 return{A:A,hc:h[0],hs:h[1],sus:sus,lethal:lethal,dev:dev,wc:wr[0],ws:wr[1],pas:pas,ds:ds,W:t.W,dr:t.dr||0,fnp:t.Fnp||0}}
function ev(p){var N=p.A,crit=N*p.hc,norm=N*p.hs,rolled=norm+crit*p.sus+(p.lethal?0:crit),auto=p.lethal?crit:0,pw=p.wc+p.ws,wounds=auto+rolled*pw,devc=p.dev?rolled*p.wc:0,W=p.W,fn=p.fnp?1-(7-p.fnp)/6:1,n=p.ds.length,dn=0,dm=0;
 p.ds.forEach(function(d){dn+=Math.min(Math.max(1,d-p.dr),W);dm+=Math.min(d,W)});dn/=n;dm/=n;var dmg=((wounds-devc)*(1-p.pas)*dn+devc*dm)*fn;return[dmg,dmg/W]}
window.__dmg={prep:prep,ev:ev};
/* Monte Carlo: same probabilities, real dice, damage allocated one model at a time (no spill-over between models). */
function ri(n){return Math.floor(Math.random()*n)}
function simOnce(ps,models,W,fnp){var left=models,cur=W;
 function dealOne(d,mortal){ if(left<=0)return; var dd=0;for(var i=0;i<d;i++){if(fnp&&ri(6)+1>=fnp)continue;dd++} cur-=dd; if(cur<=0){left--;cur=W} }
 for(var g=0;g<ps.length;g++){var p=ps[g].p,cnt=ps[g].n,N=Math.round(p.A)===p.A?p.A:p.A;
  var att=Math.floor(N)+(Math.random()<N-Math.floor(N)?1:0);att*=cnt;
  for(var a=0;a<att&&left>0;a++){var r=Math.random(),hits=0,autoW=0;
   if(r<p.hc){hits=p.lethal?0:1;autoW=p.lethal?1:0;hits+=p.sus}else if(r<p.hc+p.hs)hits=1;
   var nW=autoW,nDev=0;for(var h=0;h<hits;h++){var q=Math.random();if(q<p.wc){nW++;if(p.dev)nDev++}else if(q<p.wc+p.ws)nW++}
   for(var w=0;w<nW&&left>0;w++){var d=p.ds[ri(p.ds.length)];
    if(w<nDev){dealOne(Math.min(d,W),true)}else{if(Math.random()<p.pas)continue;dealOne(Math.min(Math.max(1,d-p.dr),W),false)}}}}
 return models-left}
var sel=$('#dx-u');
Object.keys(D.u).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=D.u[k].n;sel.appendChild(o)});
function fillW(){var b=$('#dx-wl');b.innerHTML='';D.u[sel.value].w.forEach(function(w,i){var sk=w.BS||w.WS,tr=document.createElement('tr');
 tr.innerHTML='<td><input type="number" min="0" max="30" value="'+(i===0?1:0)+'" data-i="'+i+'" aria-label="Number of models using '+w.name+'"></td><th scope="row"><i class="rm'+(w.t==='M'?' m':'')+'">'+w.t+'</i>'+w.name+'</th><td class="pf">'+w.A+'A '+sk+' S'+w.S+' AP'+w.AP+' D'+w.D+(w.kw.length?' · '+w.kw.join(', '):'')+'</td>';b.appendChild(tr)});
 $$('#dx-wl input').forEach(function(e){e.addEventListener('input',run)})}
function num(id){return +$(id).value}
function target(){var kw=[];['infantry','monster','vehicle','psyker'].forEach(function(k){if($('#dx-k-'+k).checked)kw.push(k.toUpperCase())});
 return{T:num('#dx-t'),Sv:num('#dx-sv'),Inv:+$('#dx-inv').value||0,Fnp:+$('#dx-fnp').value||0,W:num('#dx-wd'),dr:num('#dx-dr'),kw:kw}}
function mods(){return{half:$('#dx-half').checked,charge:$('#dx-charge').checked,hit:num('#dx-mh'),wound:num('#dx-mw'),rrh:$('#dx-rrh').value,rrw:$('#dx-rrw').value,ch:num('#dx-ch'),cw:num('#dx-cw'),addA:num('#dx-aa'),addS:num('#dx-as'),addAP:num('#dx-ap'),addD:num('#dx-ad'),sus:num('#dx-sus'),lethal:$('#dx-leth').checked,dev:$('#dx-dev').checked,cover:$('#dx-cover').checked,ignCover:$('#dx-ign').checked,thit:num('#dx-th'),twound:num('#dx-tw')}}
function chosen(){var u=D.u[sel.value],o=[];$$('#dx-wl input').forEach(function(e){var n=+e.value;if(n>0)o.push({w:u.w[+e.dataset.i],n:n})});return o}
var cols=['#1a1210','#3a1a14','#5a2316','#7a2f14','#a04a12','#c9791a','#e6a92e','#f3d36b'];
function shade(v,mx){return cols[mx>0?Math.min(7,Math.floor(v/mx*7.999)):0]}
var timer=null;
function run(){var t=target(),m=mods(),ch=chosen(),N=Math.max(1,num('#dx-n')),tot=0,ps=[];
 ch.forEach(function(c){var p=prep(c.w,t,m);ps.push({p:p,n:c.n});tot+=ev(p)[0]*c.n});
 var emod=tot/t.W;
 $('#dx-out').innerHTML=ch.length?'<span class="big"><b>'+tot.toFixed(2)+'</b> expected damage</span><span class="big"><b id="dx-km">…</b> of '+N+' models destroyed on average</span>':'Select at least one weapon (set a number above 0).';
 clearTimeout(timer);timer=setTimeout(function(){mc(ps,t,N)},60);heat(ch,t,m)}
function mc(ps,t,N){if(!ps.length){$('#dx-hist').innerHTML='';return}var R=4000,h=new Array(N+1).fill(0);for(var i=0;i<R;i++)h[Math.min(N,simOnce(ps,N,t.W,t.Fnp))]++;
 var mean=0;for(var q=0;q<=N;q++)mean+=q*h[q]/R;$('#dx-km').textContent=mean.toFixed(2);var mx=Math.max.apply(null,h),cum=0,ge1=1-h[0]/R,half=0;for(var k=Math.ceil(N/2);k<=N;k++)half+=h[k]/R;
 var html='<p class="dx-pr">Chance to destroy at least one model: <b>'+(ge1*100).toFixed(0)+'%</b> · at least half ('+Math.ceil(N/2)+'): <b>'+(half*100).toFixed(0)+'%</b> · all '+N+': <b>'+(h[N]/R*100).toFixed(0)+'%</b> <small>(4,000 simulated rounds, one model damaged at a time)</small></p><div class="dx-bars" role="img" aria-label="Distribution of models destroyed">';
 for(var j=0;j<=N;j++)html+='<div class="dx-b"><i style="height:'+(mx?h[j]/mx*100:0)+'%"></i><span>'+j+'</span></div>';
 $('#dx-hist').innerHTML=html+'</div>'}
function heat(ch,t,m){if(!ch.length){$('#dx-hm').innerHTML='';return}var Ts=[2,3,4,5,6,7,8,9,10,11,12,13,14],Sv=[2,3,4,5,6,7],mx=0,cells={};
 Sv.forEach(function(s){Ts.forEach(function(T){var tt=Object.assign({},t,{T:T,Sv:s}),v=0;ch.forEach(function(c){v+=ev(prep(c.w,tt,m))[0]*c.n});cells[s+'_'+T]=v;mx=Math.max(mx,v)})});
 var h='<table class="dx-hm"><caption>Expected damage of the selected weapons by Toughness (columns) and Save (rows), with the invulnerable save, Feel No Pain, wounds and modifiers set above</caption><thead><tr><th scope="col">Sv \\ T</th>'+Ts.map(function(T){return'<th scope="col">'+T+'</th>'}).join('')+'</tr></thead><tbody>';
 Sv.forEach(function(s){h+='<tr><th scope="row">'+(s===7?'none':s+'+')+'</th>'+Ts.map(function(T){var v=cells[s+'_'+T];return'<td style="background:'+shade(v,mx)+';color:'+(v/mx>.55?'#120c08':'#f2e8cc')+'">'+v.toFixed(2)+'</td>'}).join('')+'</tr>'});
 $('#dx-hm').innerHTML=h+'</tbody></table>'}
sel.addEventListener('change',function(){fillW();run()});
$$('#dx input,#dx select').forEach(function(e){if(e.closest('#dx-wl'))return;e.addEventListener('input',run);e.addEventListener('change',run)});
$('#dx-pre').addEventListener('change',function(){var p=D.p[this.value];if(!p)return;$('#dx-t').value=p.T;$('#dx-sv').value=p.Sv;$('#dx-inv').value=p.Inv||'';$('#dx-fnp').value=p.Fnp||'';$('#dx-wd').value=p.W;$('#dx-dr').value=p.dr||0;
 ['infantry','monster','vehicle','psyker'].forEach(function(k){$('#dx-k-'+k).checked=p.kw.indexOf(k.toUpperCase())>=0});run()});
/* sortable tables */
$$('table.sortable').forEach(function(tb){$$('#'+tb.id+' thead th').forEach(function(th,ci){if(!th.dataset.s)return;th.tabIndex=0;th.setAttribute('role','columnheader');th.style.cursor='pointer';
 function go(){var d=th.dataset.dir==='asc'?'desc':'asc';$$('#'+tb.id+' thead th').forEach(function(x){x.removeAttribute('aria-sort');delete x.dataset.dir});th.dataset.dir=d;th.setAttribute('aria-sort',d==='asc'?'ascending':'descending');
  var rows=[].slice.call(tb.tBodies[0].rows);rows.sort(function(a,b){var x=a.cells[ci].dataset.v,y=b.cells[ci].dataset.v;if(x===undefined||y===undefined){x=a.cells[ci].textContent;y=b.cells[ci].textContent;return d==='asc'?x.localeCompare(y):y.localeCompare(x)}x=parseFloat(x);y=parseFloat(y);return d==='asc'?x-y:y-x});rows.forEach(function(r){tb.tBodies[0].appendChild(r)})}
 th.addEventListener('click',go);th.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})})});
fillW();run();
})();
