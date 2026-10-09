/* Procedural Custodes-style heraldry: winged eagle medallion, laurel, orbit ring. All original geometry. */
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

  function eagleHead(){
    // original heraldic eagle head, faces left, drawn in a 100x100 box
    let neck='';
    for(let r=0;r<7;r++){ const y=58+r*8;
      for(let x=(r%2?40:45); x<100; x+=10){
        neck+='<path d="M'+x+' '+y+' C'+(x+6)+' '+(y+1)+' '+(x+7)+' '+(y+9)+' '+x+' '+(y+15)+' C'+(x-7)+' '+(y+9)+' '+(x-6)+' '+(y+1)+' '+x+' '+y+'Z" fill="url(#gf)" stroke="#2a1706" stroke-width=".7"/>'+
              '<path d="M'+x+' '+(y+3)+' L'+x+' '+(y+11)+'" stroke="#7a5412" stroke-width=".6" opacity=".8"/>';
      }
    }
    let neck2='';
    for(let r=0;r<8;r++){ const y=50+r*7.5;
      for(let x=(r%2?42:47); x<100; x+=9){ if(r<2&&x<56) continue;
        neck2+='<path d="M'+x+' '+y+' C'+(x+5.5)+' '+(y+1)+' '+(x+6.5)+' '+(y+8)+' '+x+' '+(y+13)+' C'+(x-6.5)+' '+(y+8)+' '+(x-5.5)+' '+(y+1)+' '+x+' '+y+'Z" fill="url(#gf)" stroke="#5a3a08" stroke-width=".8"/>'+
               '<path d="M'+x+' '+(y+2.5)+' L'+x+' '+(y+9.5)+'" stroke="#8a5c10" stroke-width=".6"/>';
      }
    }
    const crest='<path d="M60 20 L86 4 L74 24Z M66 26 L94 16 L78 34Z M70 34 L98 32 L80 44Z" fill="url(#gf)" stroke="#2a1706" stroke-width=".8"/>';
    const head='<path d="M64 18 C52 12 38 16 33 28 C30 33 30 37 31 40 C22 41 14 47 13 58 C12 66 15 73 20 79 C19 70 22 64 29 61 L40 63 C38 67 37 71 40 75 C44 83 50 92 56 102 L92 102 L82 60 C86 40 80 24 64 18Z" fill="url(#gf)" stroke="#2a1706" stroke-width="1.3"/>';
    const cheek='<path d="M52 44 l7 5 -9 1 M64 34 l7 6 -9 1 M62 44 l8 5 -10 2" fill="none" stroke="#7a5412" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M46 24 C52 22 58 24 62 30" fill="none" stroke="#fff3b8" stroke-width="1.4" opacity=".6" stroke-linecap="round"/>';
    const beak='<path d="M31 40 C22 41 14 47 13 58 C12 66 15 73 20 79 C19 70 22 64 29 61 L38 59 C38 51 35 44 31 40Z" fill="url(#gb)" stroke="#2a1706" stroke-width="1.1"/>'+
      '<path d="M29 61 L40 63" stroke="#2a1706" stroke-width="1.4" stroke-linecap="round"/><path d="M30 41 C33 44 36 50 36 58" fill="none" stroke="#6b470c" stroke-width="1.2"/>'+
      '<ellipse cx="28.5" cy="47" rx="1.7" ry="2.6" transform="rotate(-20 28.5 47)" fill="#2a1706"/><path d="M16 56 C15 62 17 68 20 73" fill="none" stroke="#fff6c8" stroke-width="1.2" opacity=".8" stroke-linecap="round"/>';
    const eye='<path d="M30 33 C37 26 48 27 54 35 L50 38 C45 33 38 33 32 38Z" fill="#241408" stroke="#2a1706" stroke-width=".8"/>'+
      '<circle cx="42" cy="38.5" r="4.3" fill="#ffd23a" stroke="#2a1706" stroke-width="1"/><circle cx="42" cy="38.5" r="2.1" fill="#0d0705"/><circle cx="41" cy="37.5" r=".8" fill="#fff"/>';
    const hp='M64 18 C52 12 38 16 33 28 C30 33 30 37 31 40 C22 41 14 47 13 58 C12 66 15 73 20 79 C19 70 22 64 29 61 L40 63 C38 67 37 71 40 75 C44 83 50 92 56 102 L92 102 L82 60 C86 40 80 24 64 18Z';
    return '<g transform="translate(160.5 91) scale(.74)"><clipPath id="ghc"><path d="'+hp+'"/></clipPath>'+crest+head+'<g clip-path="url(#ghc)">'+neck2+'</g>'+cheek+beak+eye+'</g>';
  }
  window.Emblem=function(opt){
    opt=opt||{}; const id='e'+Math.random().toString(36).slice(2,6);
    const defs='<defs>'+
     '<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe9a0"/><stop offset=".5" stop-color="#e3b94a"/><stop offset="1" stop-color="#9a6d14"/></linearGradient>'+
     '<linearGradient id="gw1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc86"/><stop offset="1" stop-color="#a87618"/></linearGradient>'+
     '<linearGradient id="gw2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c765"/><stop offset="1" stop-color="#8f6212"/></linearGradient>'+
     '<linearGradient id="gw3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7b04f"/><stop offset="1" stop-color="#76500e"/></linearGradient>'+
     '<linearGradient id="gf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe9a0"/><stop offset=".45" stop-color="#d9a93a"/><stop offset="1" stop-color="#8a5c10"/></linearGradient><linearGradient id="gb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".6" stop-color="#eec24f"/><stop offset="1" stop-color="#b98a22"/></linearGradient>'+
     '<radialGradient id="gm" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f1ece0"/><stop offset=".7" stop-color="#c9c2b2"/><stop offset="1" stop-color="#8d8677"/></radialGradient><clipPath id="gclip"><circle cx="200" cy="132" r="39"/></clipPath>'+
     '<radialGradient id="gc" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#8e1a20"/><stop offset="1" stop-color="#2d0709"/></radialGradient></defs>';
    const eye='<path d="M170 132 Q200 108 230 132 Q200 156 170 132Z" fill="#12090a" stroke="url(#gl)" stroke-width="2"/><circle cx="200" cy="132" r="9" fill="url(#gl)"/><circle cx="200" cy="132" r="3.6" fill="#12090a"/>';
    const star='<path d="M200 98 L206 124 L232 132 L206 140 L200 166 L194 140 L168 132 L194 124Z" fill="none" stroke="url(#gl)" stroke-width=".8" opacity=".7"/>';
    const svg='<svg class="emb '+(opt.cls||'')+'" viewBox="0 0 400 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'+defs+
      '<g class="emb-rays">'+rays(48,50,82)+'</g>'+
      '<g class="emb-wings">'+wing(-1)+wing(1)+'</g>'+
      '<g class="emb-ring">'+ring(46,60)+'</g>'+
      '<g clip-path="url(#gclip)"><circle cx="200" cy="132" r="42" fill="url(#gm)"/>'+
      '<path d="M178 100 L190 118 L186 124 M222 98 L212 116 L218 126 L210 138 M170 150 L188 142 L196 150 M226 152 L214 146" fill="none" stroke="#5b5448" stroke-width=".8" opacity=".65"/>'+
      '<path d="M200 92 L206 108 M175 128 L190 126 M231 128 L220 130" fill="none" stroke="#5b5448" stroke-width=".6" opacity=".5"/>'+
      eagleHead()+'</g>'+
      '<circle cx="200" cy="132" r="41" fill="none" stroke="url(#gl)" stroke-width="5"/><circle cx="200" cy="132" r="37.5" fill="none" stroke="#3a2508" stroke-width="1"/>'+
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
