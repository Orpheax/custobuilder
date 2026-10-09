/* Procedural Custodes-style heraldry: winged sun-eye emblem, laurel, orbit ring. All original geometry. */
(function(){
  const f=n=>n.toFixed(1);
  function feather(cx,cy,ang,len,w){
    const a=ang*Math.PI/180, ux=Math.cos(a), uy=Math.sin(a), px=-uy, py=ux;
    const tx=cx+ux*len, ty=cy+uy*len;
    const m1x=cx+ux*len*.55+px*w, m1y=cy+uy*len*.55+py*w;
    const m2x=cx+ux*len*.55-px*w*.55, m2y=cy+uy*len*.55-py*w*.55;
    return 'M'+f(cx)+' '+f(cy)+' Q'+f(m1x)+' '+f(m1y)+' '+f(tx)+' '+f(ty)+' Q'+f(m2x)+' '+f(m2y)+' '+f(cx)+' '+f(cy)+'Z';
  }
  function wing(side){
    const s=side, cx=200+s*34, cy=132; let out='';
    // three tiers of feathers, long to short
    const tiers=[{n:11,a0:-96,a1:-6,l0:150,l1:196,w:11,fill:'url(#gw1)'},{n:9,a0:-84,a1:-2,l0:108,l1:148,w:9,fill:'url(#gw2)'},{n:7,a0:-70,a1:8,l0:66,l1:96,w:7,fill:'url(#gw3)'}];
    tiers.forEach(t=>{
      for(let i=0;i<t.n;i++){
        const k=i/(t.n-1), ang=t.a0+(t.a1-t.a0)*k, len=t.l0+(t.l1-t.l0)*(1-Math.abs(k-.35)*.9);
        const A=s>0?ang:180-ang;
        out+='<path d="'+feather(cx,cy+(i%2?2:0),A,len,t.w)+'" fill="'+t.fill+'" stroke="#2a1706" stroke-width=".8"/>';
      }
    });
    return out;
  }
  function laurel(side){
    let o=''; for(let i=0;i<9;i++){
      const t=i/8, ang=(70+t*95)*Math.PI/180, r=58;
      const x=200+side*Math.sin(ang)*r*1.0, y=130+Math.cos(ang)*r*-1+ -0;
      const rot=side>0? (ang*180/Math.PI)+20 : -(ang*180/Math.PI)-20;
      o+='<ellipse cx="'+f(x)+'" cy="'+f(190-t*0+ -Math.cos(ang)*0)+'" rx="0" ry="0"/>';
    } return o;
  }
  function laurelLeaves(){
    let o='';
    for(const s of[-1,1]){
      for(let i=0;i<10;i++){
        const t=i/9, a=(Math.PI*.95)*(0.12+t*.78);          // sweep from bottom up the side
        const r=70, x=200+s*Math.sin(a)*r, y=140+Math.cos(a)*r*.9+2;
        const rot=(s>0?1:-1)*(a*180/Math.PI)*-1+ (s>0?-35:35);
        o+='<path transform="translate('+f(x)+' '+f(y)+') rotate('+f(s>0?-(180-a*180/Math.PI)+90:(180-a*180/Math.PI)-90)+')" d="M0 0 C5 -5 11 -4 15 0 C11 4 5 5 0 0Z" fill="url(#gl)" stroke="#2a1706" stroke-width=".6"/>';
      }
    }
    return o;
  }
  function rays(n,r0,r1){
    let o=''; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, long=i%2===0, r=long?r1:(r0+r1)/2;
      o+='<path d="M'+f(200+Math.cos(a)*r0)+' '+f(132+Math.sin(a)*r0)+' L'+f(200+Math.cos(a)*r)+' '+f(132+Math.sin(a)*r)+'" stroke="url(#gl)" stroke-width="'+(long?2:1)+'" stroke-linecap="round"/>'; }
    return o;
  }
  function ring(r,n){
    let o='<circle cx="200" cy="132" r="'+r+'" fill="none" stroke="url(#gl)" stroke-width="1.2"/>';
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, l=i%5===0?7:3.5;
      o+='<path d="M'+f(200+Math.cos(a)*r)+' '+f(132+Math.sin(a)*r)+' L'+f(200+Math.cos(a)*(r+l))+' '+f(132+Math.sin(a)*(r+l))+'" stroke="url(#gl)" stroke-width="1"/>'; }
    return o;
  }
  window.Emblem=function(opt){
    opt=opt||{}; const id='e'+Math.random().toString(36).slice(2,6);
    const defs='<defs>'+
     '<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9a0"/><stop offset=".5" stop-color="#e3b94a"/><stop offset="1" stop-color="#9a6d14"/></linearGradient>'+
     '<linearGradient id="gw1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc86"/><stop offset="1" stop-color="#a87618"/></linearGradient>'+
     '<linearGradient id="gw2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c765"/><stop offset="1" stop-color="#8f6212"/></linearGradient>'+
     '<linearGradient id="gw3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7b04f"/><stop offset="1" stop-color="#76500e"/></linearGradient>'+
     '<radialGradient id="gc" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#8e1a20"/><stop offset="1" stop-color="#2d0709"/></radialGradient></defs>';
    const eye='<path d="M170 132 Q200 108 230 132 Q200 156 170 132Z" fill="#12090a" stroke="url(#gl)" stroke-width="2"/><circle cx="200" cy="132" r="9" fill="url(#gl)"/><circle cx="200" cy="132" r="3.6" fill="#12090a"/>';
    const star='<path d="M200 98 L206 124 L232 132 L206 140 L200 166 L194 140 L168 132 L194 124Z" fill="none" stroke="url(#gl)" stroke-width=".8" opacity=".7"/>';
    const svg='<svg class="emb '+(opt.cls||'')+'" viewBox="0 0 400 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'+defs+
      '<g class="emb-rays">'+rays(48,50,82)+'</g>'+
      '<g class="emb-wings">'+wing(-1)+wing(1)+'</g>'+
      '<g class="emb-ring">'+ring(46,60)+'</g>'+
      '<circle cx="200" cy="132" r="42" fill="url(#gc)" stroke="url(#gl)" stroke-width="3"/>'+star+eye+
      laurelLeaves()+
      '<path d="M200 178 L214 196 L200 222 L186 196Z" fill="url(#gl)" stroke="#2a1706" stroke-width="1"/>'+
    '</svg>';
    return svg;
  };
  window.Glyphs={
    builder:'<svg viewBox="0 0 48 48"><path d="M8 40V12l16-6 16 6v28M16 40V22h16v18M12 40h24" /><path d="M24 22v-8M20 18h8"/></svg>',
    detach:'<svg viewBox="0 0 48 48"><path d="M24 5l16 6v12c0 10-7 17-16 20C15 40 8 33 8 23V11z"/><path d="M24 14v16M16 22h16"/></svg>',
    sheets:'<svg viewBox="0 0 48 48"><rect x="9" y="6" width="30" height="36"/><path d="M15 15h18M15 22h18M15 29h11M15 36h7"/></svg>',
    katah:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><path d="M24 8v32M8 24h32M13 13l22 22M35 13L13 35"/></svg>',
    aow:'<svg viewBox="0 0 48 48"><path d="M6 8h36v24H20l-9 8v-8H6z"/><path d="M14 16h20M14 24h12"/></svg>',
    meta:'<svg viewBox="0 0 48 48"><path d="M8 40V22M18 40V10M28 40V28M38 40V16M5 40h38"/></svg>',
    notes:'<svg viewBox="0 0 48 48"><path d="M12 6h22a4 4 0 014 4v32H16a4 4 0 01-4-4z"/><path d="M12 38a4 4 0 014-4h22"/></svg>'
  };
})();
