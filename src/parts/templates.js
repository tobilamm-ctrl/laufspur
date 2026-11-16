/* ================= Vorlagen =================
   Jede Vorlage hat zwei frei wählbare Farben (pal.bg, pal.fg). look() liefert Hintergrund und Grundfarben,
   die auch die Jahresposter-Ansichten nutzen; render() zeichnet das Einzellauf-Poster. */
const pal=(C,k)=>Object.assign({},TEMPLATES[k].pal,(C.o.colors||{})[k]||{});
const TEMPLATES={
  tartan:{name:'Tartan',blurb:'Bahnrot mit Laufbahnlinien und Tempo-Echo',pal:{bg:'#D8452A',fg:'#FFFFFF'},fgLabel:'Schrift & Strecke',
    defaults:{echo:true,color:'none',graphs:['profile']},
    look(C,P){const{W,H,id}=C;let back=`<defs>
      <radialGradient id="${id}-hl" cx=".25" cy=".2" r=".9"><stop offset="0" stop-color="${lt(P.bg,.14)}"/><stop offset="1" stop-color="${dk(P.bg,.08)}"/></radialGradient>
      <filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 .2  0 0 0 0 0  0 0 0 0 0  .45 0 0 0 -.12"/></filter></defs>
      <rect ${bgr(C)} fill="url(#${id}-hl)"/><rect ${bgr(C)} filter="url(#${id}-grain)"/>`;
      const cx=W*1.08,cy=-H*0.06,r0=W*0.36,lw=W*0.072;
      for(let k=0;k<=6;k++)back+=`<circle cx="${cx}" cy="${r1(cy)}" r="${r1(r0+k*lw)}" fill="none" stroke="${P.fg}" stroke-opacity=".2" stroke-width="3"/>`;
      for(let k=0;k<6;k++){const r=r0+(k+.5)*lw,xx=W-34,dy=Math.sqrt(Math.max(0,r*r-(cx-xx)**2));
        if(dy>0)back+=`<text x="${xx}" y="${r1(cy+dy+15)}" text-anchor="middle" ${fa({fam:'d',w:900,it:true,st:100},44)} fill="${P.fg}" fill-opacity=".16">${k+1}</text>`;}
      return {back,dark:true,ink:P.fg,label:rgba(P.fg,.75),sep:rgba(P.fg,.3),eyebrow:rgba(P.fg,.88),sub:rgba(P.fg,.92),accent:'#FFE27A',heat:P.fg,
        title:{font:{fam:'d',w:900,it:true,st:125},max:124,fill:P.fg},stretch:110,halo:dk(P.bg,.08),
        map:{line:P.fg,water:lt(P.bg,.75),green:dk(P.bg,.6),op:1,text:rgba(P.fg,.7)}};},
    render(C){const P=pal(C,'tartan'),L=this.look(C,P),R=['#FFE27A',P.fg,'#8FF3FF'];
      return L.back+standard(C,{...L,
        route:{color:P.fg,width:7,ramp:R,echo:{color:dk(P.bg,.6),dx:9,dy:9},mk:{fill:L.halo,stroke:P.fg,text:P.fg,halo:L.halo},map:L.map,tint:L.halo},
        graph:{label:L.label,fill:P.fg,fillOp:.28,line:P.fg,bar:P.fg,barOp:.75,best:'#FFE27A',ramp:R},
        hero:{key:'dist',fill:P.fg,stretch:150,echo:{color:P.fg,dx:16}},
        stats:{label:L.label,value:P.fg,sep:L.sep,stretch:110}});}},

  glut:{name:'Glut',blurb:'Nachtblau, die Strecke glüht im Tempo',pal:{bg:'#130F3C',fg:'#FF3D8B'},fgLabel:'Leuchtfarbe',
    defaults:{echo:false,color:'pace',graphs:['pace']},
    look(C,P){const{W,H,id}=C,R=['#3D5BFF','#22D3EE','#FDE047',P.fg],soft=mix(lt(P.bg,.68),'#8F7BFF',.25);
      let back=`<defs><linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.bg}"/><stop offset="1" stop-color="${mix(P.bg,P.fg,.14)}"/></linearGradient>
      <radialGradient id="${id}-gl" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="${P.fg}" stop-opacity=".32"/><stop offset="1" stop-color="${P.fg}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-tg" x1="0" x2="1" y1="0" y2="0">${R.map((c,i)=>`<stop offset="${i/(R.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>
      <filter id="${id}-glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter></defs>
      <rect ${bgr(C)} fill="url(#${id}-bg)"/><rect ${bgr(C)} fill="url(#${id}-gl)"/>`;
      for(let x=70;x<W;x+=86)back+=`<line x1="${x}" x2="${x}" y1="-60" y2="${r1(H+60)}" stroke="#fff" stroke-opacity=".035" stroke-width="1.5"/>`;
      return {back,dark:true,R,ink:'#FFFFFF',label:soft,sep:rgba(soft,.25),eyebrow:soft,sub:lt(soft,.6),accent:P.fg,heat:P.fg,
        title:{font:{fam:'d',w:900,it:false,st:62.5},max:230,fill:`url(#${id}-tg)`},stretch:100,halo:P.bg,
        map:{line:soft,water:'#22D3EE',green:soft,op:.9,text:soft}};},
    render(C){const P=pal(C,'glut'),L=this.look(C,P),R=L.R;
      return L.back+standard(C,{...L,legend:{ramp:R,text:L.label},
        route:{color:P.fg,width:5.5,glow:.85,ramp:R,mk:{fill:P.bg,stroke:L.sub,text:L.sub,halo:P.bg},map:L.map,tint:P.bg},
        graph:{label:L.label,fill:L.label,fillOp:.45,line:L.label,bar:L.label,barOp:.8,best:P.fg,ramp:R},
        hero:null,stats:{label:L.label,value:'#fff',sep:L.sep,stretch:100}});}},

  bib:{name:'Startnummer',blurb:'Kobaltblau, die Startnummer als große Zahl',pal:{bg:'#2140E6',fg:'#FF4A2E'},fgLabel:'Startnummer-Band',
    defaults:{echo:false,color:'none',graphs:['profile']},
    look(C,P){const{id}=C;
      const back=`<defs><pattern id="${id}-st" patternUnits="userSpaceOnUse" width="64" height="64" patternTransform="rotate(-24)"><rect width="22" height="64" fill="#fff" fill-opacity=".055"/></pattern></defs>
      <rect ${bgr(C)} fill="${P.bg}"/><rect ${bgr(C)} fill="url(#${id}-st)"/>`;
      return {back,dark:true,ink:'#FFFFFF',label:'rgba(255,255,255,.8)',sep:'rgba(255,255,255,.3)',eyebrow:'rgba(255,255,255,.88)',sub:'#fff',accent:'#FFD23F',heat:'#FFFFFF',
        title:{font:{fam:'d',w:900,it:true,st:125},max:120,fill:'#fff'},stretch:100,halo:P.bg,
        map:{line:'#fff',water:lt(P.bg,.55),green:dk(P.bg,.5),op:.85,text:'rgba(255,255,255,.7)'}};},
    render(C){const{W,H,S,o,id}=C,P=pal(C,'bib'),L=this.look(C,P),m=70,INK='#121535';
      let s=L.back+`<text x="${m}" y="88" ${fa(MONO,17)} letter-spacing="3" fill="${L.eyebrow}">${esc(eyebrow(S))}</text>`;
      if(o.name)s+=`<text x="${W-m}" y="88" text-anchor="end" ${fa(MONO,17)} letter-spacing="3" fill="${L.eyebrow}">${esc(o.name.toUpperCase())}</text>`;
      const bw=W-2*m-10,bh=Math.min(H*0.42,560),bx=(W-bw)/2,by=H-62-bh,cxb=bx+bw/2,cyb=by+bh/2;
      const gl=graphList(C),gh=gl.length?Math.min(gl.length*H*0.06+(gl.length-1)*18,H*0.2):0;
      const g1=by-44,g0=g1-gh,rb=(gl.length?g0:g1)-40;
      s+=routeLayer(C,{x:m+10,y:130,w:W-2*m-20,h:rb-130},
        {color:'#fff',width:6.5,ramp:[lt(P.bg,.6),'#FFFFFF','#FFD23F'],echo:{color:dk(P.bg,.45),dx:8,dy:8},mk:{fill:P.bg,stroke:'#fff',text:'#fff',halo:P.bg},map:L.map,tint:P.bg},{x:-60,y:100,w:W+120,h:rb-60});
      if(gl.length)s+=graphs(C,{x:m,y:g0,w:W-2*m,h:gh},{label:L.label,fill:'#fff',fillOp:.3,line:'#fff',bar:'#fff',barOp:.7,best:'#FFD23F',ramp:[lt(P.bg,.6),'#FFFFFF','#FFD23F']});
      const tb=bh*0.17,bb=bh*0.12;
      let g=`<rect x="${bx+12}" y="${by+16}" width="${bw}" height="${bh}" rx="18" fill="${dk(P.bg,.6)}" fill-opacity=".45"/>`;
      g+=`<clipPath id="${id}-clip"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="18"/></clipPath>`;
      g+=`<g clip-path="url(#${id}-clip)"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#FBF8F1"/>`+
        `<rect x="${bx}" y="${by}" width="${bw}" height="${tb}" fill="${P.fg}"/><rect x="${bx}" y="${by+bh-bb}" width="${bw}" height="${bb}" fill="${INK}"/>`;
      for(let k=0;k<7;k++)g+=`<rect x="${r1(bx+bw-260+k*34)}" y="${by+tb}" width="16" height="${r1(bh-tb-bb)}" fill="${P.fg}" fill-opacity=".07" transform="skewX(-18)" transform-origin="${r1(bx+bw-260+k*34)} ${r1(by+tb)}"/>`;
      g+='</g>';
      const tt=(o.title||' ').toUpperCase(),tf={fam:'d',w:900,it:true,st:125},ts=fit(tt,tf,bw-150,tb*0.62);
      g+=`<text x="${cxb}" y="${r1(by+tb/2+ts*0.36)}" text-anchor="middle" ${fa(tf,ts)} fill="#fff">${esc(tt)}</text>`;
      [[bx+30,by+30],[bx+bw-30,by+30],[bx+30,by+bh-30],[bx+bw-30,by+bh-30]].forEach(([x,y])=>{g+=`<circle cx="${x}" cy="${y}" r="10" fill="${P.bg}" stroke="#000" stroke-opacity=".15" stroke-width="2"/>`;});
      // große Zahl: echte Startnummer, sonst die Zeit
      const bibNo=o.bibno.trim(),heroKey=bibNo?'bibno':statOk(S,'time')?'time':'dist';
      const[hv]=STATS[heroKey].val(S),hf={fam:'d',w:900,it:false,st:75};
      const items=statItems(S,o.stats.filter(k=>k!==heroKey));
      const statH=items.length?bh*(items.length>4?0.27:0.19):0,avail=bh-tb-bb-statH-28,hs=fit(hv,hf,bw-120,avail*1.05),hy=by+tb+14+(avail+hs*0.72)/2;
      g+=`<text x="${cxb}" y="${r1(hy)}" text-anchor="middle" ${fa(hf,hs)} fill="${INK}" letter-spacing="-2">${esc(hv)}</text>`;
      if(items.length)g+=itemsRow({x:bx+52,y:by+bh-bb-statH-14,w:bw-104,h:statH},items,{label:'#6A6E99',value:INK,sep:'rgba(18,21,53,.15)',stretch:100});
      const fy=by+bh-bb/2+6;
      g+=`<text x="${bx+56}" y="${r1(fy)}" ${fa(MONO,16)} letter-spacing="3" fill="#fff">${esc(S.start?S.start.toLocaleDateString('de-DE'):'')}</text>`;
      g+=`<text x="${bx+bw-56}" y="${r1(fy)}" text-anchor="end" ${fa({fam:'b',w:600},18)} fill="${lt(P.fg,.75)}">${esc(o.sub||'')}</text>`;
      return s+`<g transform="rotate(-2.2 ${r1(cxb)} ${r1(cyb)})">${g}</g>`;}},

  sprint:{name:'Zielsprint',blurb:'Sonnenverlauf mit Km-Splits als Balken',pal:{bg:'#FF6A4A',fg:'#1B0E33'},fgLabel:'Schrift & Strecke',
    defaults:{echo:true,color:'none',graphs:['splits']},
    look(C,P){const{W,H,id}=C;
      let back=`<defs><linearGradient id="${id}-bg" x1="0" y1="0" x2=".55" y2="1"><stop offset="0" stop-color="${mix(P.bg,'#FFD23F',.78)}"/><stop offset=".42" stop-color="${P.bg}"/><stop offset=".72" stop-color="${mix(P.bg,'#C81C78',.62)}"/><stop offset="1" stop-color="${mix(P.bg,'#5A1AB0',.86)}"/></linearGradient></defs>
      <rect ${bgr(C)} fill="url(#${id}-bg)"/>`;
      for(let k=0;k<9;k++){const y=H*0.12+k*H*0.035;back+=`<line x1="${r1(W*0.62+k*18)}" x2="${W+60}" y1="${r1(y)}" y2="${r1(y)}" stroke="#fff" stroke-opacity="${r1(.28-k*.025)}" stroke-width="3"/>`;}
      return {back,dark:false,ink:'#FFFFFF',label:'rgba(255,255,255,.8)',sep:'rgba(255,255,255,.3)',eyebrow:rgba(P.fg,.8),sub:rgba(P.fg,.85),accent:'#FFD23F',heat:P.fg,
        title:{font:{fam:'d',w:900,it:true,st:150},max:118,fill:P.fg},stretch:110,halo:'#FFB43F',
        map:{line:P.fg,water:'#fff',green:P.fg,op:.75,text:rgba(P.fg,.7)}};},
    render(C){const P=pal(C,'sprint'),L=this.look(C,P);
      return L.back+standard(C,{...L,
        route:{color:P.fg,width:6.5,ramp:['#FFFFFF',P.fg],echo:{color:'#fff',dx:-13,dy:0},mk:{fill:'#FFD23F',stroke:P.fg,text:P.fg,halo:'#FFB43F'},map:L.map,tint:P.bg},
        graph:{label:'rgba(255,255,255,.85)',fill:'#fff',fillOp:.35,line:'#fff',bar:'#fff',barOp:.8,best:'#FFD23F',ramp:['#FFFFFF','#FFD23F']},
        hero:{key:'dist',fill:'#fff',stretch:150,echo:{color:P.fg,dx:15}},
        stats:{label:'rgba(255,255,255,.78)',value:'#fff',sep:L.sep,stretch:110}});}},

  watch:{name:'Stoppuhr',blurb:'Mint mit Zifferblatt, Splits als Strahlen',noEcho:true,pal:{bg:'#2CD6B3',fg:'#0B2A33'},fgLabel:'Schrift & Zifferblatt',
    defaults:{echo:false,color:'none',graphs:[]},
    look(C,P){const{id}=C;
      const back=`<defs><radialGradient id="${id}-bg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="${lt(P.bg,.12)}"/><stop offset="1" stop-color="${dk(P.bg,.1)}"/></radialGradient></defs><rect ${bgr(C)} fill="url(#${id}-bg)"/>`;
      return {back,dark:false,ink:P.fg,label:rgba(P.fg,.7),sep:rgba(P.fg,.2),eyebrow:rgba(P.fg,.75),sub:rgba(P.fg,.85),accent:'#FF6B1A',heat:P.fg,
        title:{font:{fam:'d',w:900,it:true,st:125},max:120,fill:P.fg},stretch:100,halo:P.bg,
        map:{line:P.fg,water:P.fg,green:P.fg,op:.6,text:rgba(P.fg,.7)}};},
    render(C){const{W,H,S,o,id}=C,P=pal(C,'watch'),L=this.look(C,P),m=70,INK=P.fg,FACE=mix(P.fg,P.bg,.06),MINT=lt(P.bg,.2),ORANGE='#FF6B1A';
      let s=L.back+`<defs><radialGradient id="${id}-face" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${mix(FACE,P.bg,.18)}"/><stop offset="1" stop-color="${FACE}"/></radialGradient></defs>`;
      const top=topBlock(C,L);
      const bot=bottomBlock(C,{hero:{key:'time',fill:INK,stretch:75,italic:false,center:true,scale:.9},
        graph:{label:L.label,fill:INK,fillOp:.25,line:INK,bar:INK,barOp:.75,best:ORANGE,ramp:[INK,ORANGE]},
        stats:{label:L.label,value:INK,sep:L.sep,stretch:100}});
      const y0=top.y+40,y1=bot.top-24,cx=W/2;
      const r=Math.max(120,Math.min(W/2-m-70,(y1-y0)/2-62)),cy=(y0+y1)/2+18;
      for(let k=1;k<=3;k++)s+=`<circle cx="${cx}" cy="${r1(cy)}" r="${r1(r+70+k*44)}" fill="none" stroke="#fff" stroke-opacity="${r1(.24-k*.06)}" stroke-width="2.5"/>`;
      s+=`<rect x="${cx-11}" y="${r1(cy-r-30)}" width="22" height="32" fill="${INK}"/><rect x="${cx-30}" y="${r1(cy-r-52)}" width="60" height="26" rx="6" fill="${INK}"/>`;
      [-1,1].forEach(sg=>{s+=`<g transform="rotate(${sg*42} ${cx} ${r1(cy)})"><rect x="${cx-9}" y="${r1(cy-r-24)}" width="18" height="28" rx="3" fill="${INK}"/></g>`;});
      const sp=S.splits,n=sp.length;
      if(n){const v=sp.map(t=>1000/t),vmin=Math.min(...v),vmax=Math.max(...v),sw=Math.min(18,2*Math.PI*r/n*0.55);
        sp.forEach((t,i)=>{const a=-Math.PI/2+(i+0.5)/n*2*Math.PI,Ln=16+44*(v[i]-vmin)/((vmax-vmin)||1),isB=i+1===S.bestKm;
          s+=`<line x1="${r1(cx+Math.cos(a)*(r+12))}" y1="${r1(cy+Math.sin(a)*(r+12))}" x2="${r1(cx+Math.cos(a)*(r+12+Ln))}" y2="${r1(cy+Math.sin(a)*(r+12+Ln))}" stroke="${isB?'#fff':ORANGE}" stroke-width="${r1(sw)}"/>`;
          if((i+1)%5===0||isB)s+=`<text x="${r1(cx+Math.cos(a)*(r+30+Ln))}" y="${r1(cy+Math.sin(a)*(r+30+Ln)+5)}" text-anchor="middle" ${fa(MONO,isB?14:13)} fill="${INK}">${isB?pace(t):i+1}</text>`;});}
      s+=`<circle cx="${cx}" cy="${r1(cy)}" r="${r1(r+6)}" fill="${INK}"/><circle cx="${cx}" cy="${r1(cy)}" r="${r1(r)}" fill="url(#${id}-face)"/>`;
      for(let k=0;k<60;k++){const a=k/60*2*Math.PI,big=k%5===0,r0=r-8,r2=r-(big?26:15);
        s+=`<line x1="${r1(cx+Math.sin(a)*r0)}" y1="${r1(cy-Math.cos(a)*r0)}" x2="${r1(cx+Math.sin(a)*r2)}" y2="${r1(cy-Math.cos(a)*r2)}" stroke="${MINT}" stroke-opacity="${big?.9:.45}" stroke-width="${big?4:2}"/>`;}
      const side=r*1.18;
      s+=routeLayer(C,{x:cx-side/2,y:cy-side/2,w:side,h:side},
        {color:'#fff',width:5,ramp:[MINT,'#fff',ORANGE],mk:{fill:FACE,stroke:'#fff',text:'#fff',halo:FACE},map:{line:MINT,water:'#62C8FF',green:MINT,op:.8,text:L.label},tint:FACE},{cx,cy,r:r-30});
      return s+top.svg+bot.svg;}},

  riso:{name:'Riso',blurb:'Zweifarbdruck in Pink und Blau mit Versatz',noEcho:true,pal:{bg:'#F4F1EC',fg:'#0078BF'},fgLabel:'Druckfarbe',
    defaults:{echo:false,color:'none',graphs:['profile']},
    look(C,P){const{W,H,id}=C,PINK='#FF48B0';
      const back=`<defs><pattern id="${id}-dots" patternUnits="userSpaceOnUse" width="13" height="13" patternTransform="rotate(15)"><circle cx="6.5" cy="6.5" r="4.1" fill="${PINK}"/></pattern>
        <pattern id="${id}-dots2" patternUnits="userSpaceOnUse" width="11" height="11" patternTransform="rotate(-30)"><circle cx="5.5" cy="5.5" r="2.4" fill="${P.fg}"/></pattern></defs>
        <rect ${bgr(C)} fill="${P.bg}"/>
        <circle cx="${r1(W*0.66)}" cy="${r1(H*0.44)}" r="${r1(W*0.38)}" fill="url(#${id}-dots)" fill-opacity=".85" style="mix-blend-mode:multiply"/>
        <rect x="-60" y="${r1(H*0.6)}" width="${r1(W*0.45+60)}" height="${r1(H*0.14)}" fill="url(#${id}-dots2)" fill-opacity=".7" style="mix-blend-mode:multiply"/>`;
      const grain=`<defs><filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix values="0 0 0 0 .3  0 0 0 0 .25  0 0 0 0 .2  .5 0 0 0 -.2"/></filter></defs><rect ${bgr(C)} filter="url(#${id}-grain)" opacity=".5"/>`;
      return {back,grain,PINK,dark:false,ink:P.fg,label:PINK,sep:rgba(P.fg,.3),eyebrow:P.fg,sub:P.fg,accent:PINK,heat:P.fg,
        title:{font:{fam:'d',w:900,it:false,st:50},max:250,fill:P.fg,shadow:{color:PINK,dx:7,dy:5}},stretch:75,italic:false,halo:P.bg,
        map:{line:P.fg,water:P.fg,green:PINK,op:.8,blend:true,text:P.fg}};},
    render(C){const P=pal(C,'riso'),L=this.look(C,P),PINK=L.PINK;
      return L.back+standard(C,{...L,
        route:{color:P.fg,width:7,blend:true,misreg:{color:PINK,dx:6,dy:-5},ramp:[PINK,P.fg],mk:{fill:P.bg,stroke:P.fg,text:P.fg,halo:P.bg},map:L.map,tint:P.bg},
        graph:{label:P.fg,fill:PINK,fillOp:.8,line:P.fg,bar:P.fg,barOp:.85,best:PINK,ramp:[PINK,P.fg],blend:true},
        hero:{key:'dist',fill:P.fg,stretch:62.5,italic:false,shadow:{color:PINK,dx:8,dy:6},scale:1.25},
        stats:{label:PINK,value:P.fg,sep:L.sep,stretch:75,italic:false}})+L.grain;}},

  medal:{name:'Medaille',blurb:'Finisher-Medaille am Band, Strecke geprägt',noEcho:true,pal:{bg:'#0C4A3A',fg:'#F2C14E'},fgLabel:'Gold & Schrift',
    defaults:{echo:false,color:'none',graphs:[]},
    look(C,P){const{W,H,S,id}=C;
      let back=`<defs><radialGradient id="${id}-bg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="${lt(P.bg,.12)}"/><stop offset="1" stop-color="${P.bg}"/></radialGradient></defs><rect ${bgr(C)} fill="url(#${id}-bg)"/>`;
      const R=rng(Math.round(S.dist)+7),CONF=[P.fg,'#FF5A3C','#FFFFFF','#4C7DFF'];
      for(let k=0;k<70;k++){const x=R()*W,y=R()*H*0.92,c=CONF[k%4],a=R()*180,w=6+R()*10;back+=`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(w*0.45)}" fill="${c}" fill-opacity="${r1(.25+R()*.45)}" transform="rotate(${r1(a)} ${r1(x)} ${r1(y)})"/>`;}
      const soft=lt(P.fg,.65);
      return {back,dark:true,ink:soft,label:rgba(soft,.7),sep:rgba(P.fg,.3),eyebrow:rgba(P.fg,.85),sub:soft,accent:'#FF5A3C',heat:P.fg,
        title:{font:{fam:'d',w:900,it:true,st:125},max:120,fill:P.fg},stretch:100,halo:P.bg,
        map:{line:P.fg,water:P.fg,green:P.fg,op:.5,text:rgba(soft,.7)}};},
    render(C){const{W,S,o,id}=C,P=pal(C,'medal'),L=this.look(C,P),m=70,GOLD=P.fg,BROWN=dk(P.fg,.6);
      let s=L.back+`<defs><radialGradient id="${id}-gold" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${lt(GOLD,.7)}"/><stop offset=".45" stop-color="${GOLD}"/><stop offset="1" stop-color="${dk(GOLD,.3)}"/></radialGradient>
        <radialGradient id="${id}-inner" cx=".6" cy=".65" r=".9"><stop offset="0" stop-color="${lt(GOLD,.35)}"/><stop offset="1" stop-color="${dk(GOLD,.12)}"/></radialGradient></defs>`;
      const top=topBlock(C,L);
      const bot=bottomBlock(C,{hero:{key:'time',fill:GOLD,stretch:100,center:true,scale:.85},
        graph:{label:L.label,fill:GOLD,fillOp:.35,line:GOLD,bar:GOLD,barOp:.7,best:'#FF5A3C',ramp:[dk(GOLD,.3),GOLD,lt(GOLD,.7)]},
        stats:{label:L.label,value:L.ink,sep:L.sep,stretch:100}});
      const y0=top.y+30,y1=bot.top-20,cx=W/2;
      const r=Math.max(130,Math.min(W/2-m-20,(y1-y0)*0.36)),cy=y1-r-6;
      const yb=cy-r+40,w1=170,w2=62,ST=['#FF5A3C','#FFFFFF','#2E5BFF'];
      for(let k=0;k<3;k++){const a0=-1+k*2/3,a1=a0+2/3;
        s+=`<polygon points="${r1(cx+a0*w1)},${r1(y0-10)} ${r1(cx+a1*w1)},${r1(y0-10)} ${r1(cx+a1*w2)},${r1(yb)} ${r1(cx+a0*w2)},${r1(yb)}" fill="${ST[k]}"/>`;}
      s+=`<polygon points="${r1(cx-w2)},${r1(yb)} ${r1(cx+w2)},${r1(yb)} ${r1(cx+w2*0.8)},${r1(yb-60)} ${r1(cx-w2*0.8)},${r1(yb-60)}" fill="#000" fill-opacity=".18"/>`;
      s+=`<circle cx="${cx}" cy="${r1(cy-r-4)}" r="24" fill="none" stroke="${dk(GOLD,.2)}" stroke-width="9"/>`;
      s+=`<circle cx="${cx+8}" cy="${r1(cy+12)}" r="${r1(r)}" fill="#000" fill-opacity=".3"/>`;
      s+=`<circle cx="${cx}" cy="${r1(cy)}" r="${r1(r)}" fill="url(#${id}-gold)"/><circle cx="${cx}" cy="${r1(cy)}" r="${r1(r-14)}" fill="none" stroke="${dk(GOLD,.32)}" stroke-width="3"/>`;
      s+=`<circle cx="${cx}" cy="${r1(cy)}" r="${r1(r-50)}" fill="url(#${id}-inner)" stroke="${dk(GOLD,.32)}" stroke-width="3"/>`;
      const rt=r-37,rb2=r-27,fs=Math.min(22,r*0.085);
      const topTxt=(o.title||'').toUpperCase(),botTxt=[num(S.dist/1000,2)+' KM',S.start?S.start.toLocaleDateString('de-DE'):''].filter(Boolean).join('  ·  ');
      s+=`<defs><path id="${id}-ta" d="M${r1(cx-rt)},${r1(cy)} a${r1(rt)},${r1(rt)} 0 1,1 ${r1(2*rt)},0"/><path id="${id}-ba" d="M${r1(cx-rb2)},${r1(cy)} a${r1(rb2)},${r1(rb2)} 0 0,0 ${r1(2*rb2)},0"/></defs>`;
      s+=`<text ${fa(MONO,fs)} letter-spacing="4" fill="${BROWN}"><textPath href="#${id}-ta" startOffset="50%" text-anchor="middle">${esc(topTxt)}</textPath></text>`;
      s+=`<text ${fa(MONO,fs)} letter-spacing="4" fill="${BROWN}"><textPath href="#${id}-ba" startOffset="50%" text-anchor="middle">${esc(botTxt)}</textPath></text>`;
      [-1,1].forEach(sg=>{s+=`<text x="${r1(cx+sg*(r-32))}" y="${r1(cy+6)}" text-anchor="middle" ${fa(MONO,16)} fill="${BROWN}">★</text>`;});
      const side=(r-56)*1.3;
      s+=routeLayer(C,{x:cx-side/2,y:cy-side/2,w:side,h:side},
        {color:BROWN,width:5,emboss:lt(GOLD,.75),ramp:[dk(GOLD,.3),BROWN],mk:{fill:lt(GOLD,.2),stroke:BROWN,text:BROWN,halo:lt(GOLD,.2)},map:{line:BROWN,water:BROWN,green:BROWN,op:.55,text:L.label},tint:GOLD},{cx,cy,r:r-52});
      return s+top.svg+bot.svg;}},

  waves:{name:'Wellen',blurb:'Petrol, jeder Kilometer als Tempo-Welle',noEcho:true,pal:{bg:'#0C3B4A',fg:'#FF6B5A'},fgLabel:'Titel & Wellen',
    defaults:{echo:false,color:'pace',graphs:[]},
    look(C,P){const{H,id}=C,LIGHT=mix(P.bg,'#ffffff',.62);
      const back=`<defs><linearGradient id="${id}-bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${r1(H)}"><stop offset="0" stop-color="${P.bg}"/><stop offset="1" stop-color="${dk(P.bg,.42)}"/></linearGradient></defs><rect ${bgr(C)} fill="url(#${id}-bg)"/>`;
      return {back,dark:true,LIGHT,ink:'#FFFFFF',label:LIGHT,sep:rgba(LIGHT,.25),eyebrow:LIGHT,sub:lt(LIGHT,.6),accent:'#FFD166',heat:P.fg,
        title:{font:{fam:'d',w:900,it:false,st:62.5},max:220,fill:P.fg},stretch:75,italic:false,halo:P.bg,
        map:{line:LIGHT,water:'#3FA7FF',green:LIGHT,op:.75,text:LIGHT}};},
    render(C){const{W,H,S,o,id}=C,P=pal(C,'waves'),L=this.look(C,P),m=70,cw=W-2*m,LIGHT=L.LIGHT,RAMP=['#3FA7FF',P.fg,'#FFD166'];
      let s=L.back;const top=topBlock(C,L);
      const gl=graphList(C),gh=gl.length?Math.min(gl.length*H*0.06+(gl.length-1)*18,H*0.2):0;
      const yEnd=H-64-gh-(gl.length?36:0),y0=top.y+44,pw=cw*0.6,px=m+26,colX=m+cw*0.66,colW=W-m-colX;
      const ci=colorInfo(C),useT=S.hasTime,val=i=>useT?S.speed[i]:S.eleS[i],lo=useT?S.lo:S.eleMin,hi=useT?S.hi:Math.max(S.eleMax,S.eleMin+20);
      const rows=[];for(let k=0;k*1000<S.dist-250;k++)rows.push([k*1000,Math.min(S.dist,(k+1)*1000)]);
      const n=rows.length,head=30,ph=yEnd-y0-head-24,amp=ph/(n+2.2)*3.2,sp=(ph-amp)/Math.max(1,n-1);
      s+=`<text x="${m}" y="${r1(y0+12)}" ${fa(MONO,13)} letter-spacing="2.5" fill="${LIGHT}">${useT?'TEMPO JE KILOMETER':'HÖHE JE KILOMETER'}</text>`;
      rows.forEach(([d0,d1],k)=>{const base=y0+head+amp+k*sp,pts=[];let cs=0,cn=0;
        for(let j=0;j<=70;j++){const dd=d0+(d1-d0)*j/70,i=idxAt(S.d,dd),t=clamp((val(i)-lo)/((hi-lo)||1),0,1);pts.push([px+pw*(dd-d0)/1000,base-amp*(0.06+0.94*Math.pow(t,1.6))]);if(ci){cs+=ci.vals[i];cn++;}}
        const line=pathD(pts),lastX=pts[pts.length-1][0];
        const col=ci?ramp(RAMP,(cs/cn-ci.lo)/((ci.hi-ci.lo)||1)):ramp([P.fg,'#FFD166'],k/Math.max(1,n-1));
        s+=`<path d="M${px},${r1(base)}L${line.slice(1)}L${r1(lastX)},${r1(base)}Z" fill="url(#${id}-bg)"/>`;
        s+=`<path d="${line}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linejoin="round"/>`;
        if((k+1)%5===0||k===0)s+=`<text x="${px-12}" y="${r1(base-amp*0.3+4)}" text-anchor="end" ${fa({fam:'m',w:400},12)} fill="${LIGHT}">${k+1}</text>`;});
      s+=`<text x="${px}" y="${r1(yEnd)}" ${fa({fam:'m',w:400},12)} fill="${LIGHT}">0 m</text><text x="${r1(px+pw)}" y="${r1(yEnd)}" text-anchor="end" ${fa({fam:'m',w:400},12)} fill="${LIGHT}">1000 m</text>`;
      const rs=Math.min(colW,(yEnd-y0)*0.42);
      s+=`<rect x="${r1(colX)}" y="${r1(y0+head)}" width="${r1(colW)}" height="${r1(rs)}" fill="#fff" fill-opacity=".04" stroke="${LIGHT}" stroke-opacity=".25" stroke-width="1.5"/>`;
      s+=routeLayer(C,{x:colX+16,y:y0+head+16,w:colW-32,h:rs-32},
        {color:'#FFD166',width:4.5,ramp:RAMP,mk:{fill:P.bg,stroke:L.sub,text:L.sub,halo:P.bg},map:L.map,tint:P.bg},{x:colX,y:y0+head,w:colW,h:rs,hard:true});
      s+=itemsColumn({x:colX,y:y0+head+rs+34,w:colW,h:yEnd-(y0+head+rs+34)},statItems(S,o.stats),{label:LIGHT,value:'#fff',sep:L.sep,stretch:75,italic:false});
      if(gl.length)s+=graphs(C,{x:m,y:H-64-gh,w:cw,h:gh},{label:LIGHT,fill:LIGHT,fillOp:.3,line:LIGHT,bar:LIGHT,barOp:.7,best:P.fg,ramp:RAMP});
      return s+top.svg;}},
};

/* ================= Jahresposter: Kacheln und Heatmap ================= */
function collStats(G){const it=[{label:'Läufe',v:String(G.runs.length),u:''},{label:'Kilometer',v:G.dist<100000?num(G.dist/1000,1):Math.round(G.dist/1000).toLocaleString('de-DE'),u:'km'}];
  if(G.time)it.push({label:'Laufzeit',v:`${Math.floor(G.time/3600)}:${pad2(Math.floor(G.time%3600/60))}`,u:'h'});
  if(G.climb)it.push({label:'Höhenmeter',v:Math.round(G.climb).toLocaleString('de-DE'),u:'m'});
  it.push({label:'Längster Lauf',v:num(G.longest/1000,1),u:'km'});return it;}
function runPts(C,S,fine){const p=C.o.privacy;let a=0,b=S.n-1;if(p>0&&p*2<S.dist-200){a=idxAt(S.d,p);b=idxAt(S.d,S.dist-p);}
  const src=fine?S.simpF:S.simpC;return src.filter(q=>q[2]>=a&&q[2]<=b);}
const COLLVIEWS={
  tiles:{name:'Kacheln',render(C){const{W,H,o}=C,G=C.S,L=TEMPLATES[o.tpl].look(C,pal(C,o.tpl)),m=70,cw=W-2*m;
    const top=topBlock(C,L),bot=bottomBlock(C,{stats:{label:L.label,value:L.ink,sep:L.sep,stretch:L.stretch,italic:L.italic}},collStats(G));
    const y0=top.y+40,y1=bot.top-30,n=G.runs.length,ah=y1-y0;let best=null;
    for(let c=1;c<=n;c++){const rws=Math.ceil(n/c),tw=cw/c,th=ah/rws,sz=Math.min(tw,th-20);if(!best||sz>best.sz)best={c,rws,tw,th,sz};}
    const{c,tw,th}=best,lab=tw>=70,longest=G.runs.reduce((a,r)=>r.dist>a.dist?r:a,G.runs[0]);let s=L.back+top.svg+bot.svg;
    G.runs.forEach((S,i)=>{const col=i%c,row=Math.floor(i/c),x=m+col*tw,y=y0+row*th,pad=Math.max(4,tw*0.1),bh=th-(lab?20:0)-pad;
      const pts=runPts(C,S,false);if(pts.length<2)return;let x0=Infinity,y0b=Infinity,x1=-Infinity,y1b=-Infinity;
      for(const[px,py]of pts){x0=Math.min(x0,px);x1=Math.max(x1,px);y0b=Math.min(y0b,py);y1b=Math.max(y1b,py);}
      const sc=Math.min((tw-2*pad)/((x1-x0)||1),bh/((y1b-y0b)||1)),ox=x+(tw-(x1-x0)*sc)/2-x0*sc,oy=y+pad/2+(bh-(y1b-y0b)*sc)/2-y0b*sc;
      s+=`<path d="${pathD(pts.map(([px,py])=>[px*sc+ox,py*sc+oy]))}" fill="none" stroke="${S===longest?L.accent:L.ink}" stroke-width="${r1(clamp(tw/45,1.1,3.2))}" stroke-linecap="round" stroke-linejoin="round"/>`;
      if(lab)s+=`<text x="${r1(x+tw/2)}" y="${r1(y+th-6)}" text-anchor="middle" ${fa({fam:'m',w:400},clamp(tw/9,9,13))} fill="${L.label}">${S.start?S.start.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' · ':''}${num(S.dist/1000,1)}</text>`;});
    return s;}},
  heat:{name:'Heatmap',render(C){const{W,o}=C,G=C.S,L=TEMPLATES[o.tpl].look(C,pal(C,o.tpl)),m=70,cw=W-2*m;
    const top=topBlock(C,L),bot=bottomBlock(C,{stats:{label:L.label,value:L.ink,sep:L.sep,stretch:L.stretch,italic:L.italic}},collStats(G));
    const box={x:m,y:top.y+44,w:cw,h:bot.top-40-(top.y+44)},runs=G.heatRuns;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    const all=runs.map(S=>runPts(C,S,!C.thumb).map(([x,y])=>[x/S.cx*G.cx,y]));
    for(const r of all)for(const[x,y]of r){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
    const sc=Math.min(box.w/((x1-x0)||1),box.h/((y1-y0)||1)),ox=box.x+(box.w-(x1-x0)*sc)/2-x0*sc,oy=box.y+(box.h-(y1-y0)*sc)/2-y0*sc;
    const T={sc,ang:0,f:(x,y)=>[x*sc+ox,y*sc+oy]},op=clamp(2.4/Math.sqrt(runs.length),.07,.7),blend=L.dark?'screen':'multiply';
    let s=L.back+mapLayer(C,T,{x:-60,y:box.y-40,w:W+120,h:box.h+80},L.map,G.map)+`<g style="mix-blend-mode:${blend}">`;
    for(const r of all)s+=`<path d="${pathD(r.map(([x,y])=>T.f(x,y)))}" fill="none" stroke="${L.heat}" stroke-opacity="${r1(op*100)/100}" stroke-width="${C.thumb?2:2.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
    s+='</g>';
    if(G.runs.length>runs.length)s+=`<text x="${W-m}" y="${r1(box.y+box.h+22)}" text-anchor="end" ${fa({fam:'m',w:400},12)} fill="${L.label}">${G.runs.length-runs.length} Läufe liegen außerhalb des Ausschnitts</text>`;
    return s+top.svg+bot.svg;}},
};
function buildCollection(runs){
  runs.sort((a,b)=>(a.start?a.start.getTime():0)-(b.start?b.start.getTime():0));
  for(const S of runs){if(S.simpC)continue;const idx=S.xy.map((p,i)=>[p[0],p[1],i]);S.simpF=rdp(idx,2.5);S.simpC=rdp(idx,12);}
  const c=runs.map(S=>[S.lon0,S.lat0]),med=k=>{const v=c.map(p=>p[k]).sort((a,b)=>a-b);return v[Math.floor(v.length/2)];},mlon=med(0),mlat=med(1);
  const heatRuns=runs.filter(S=>Math.abs(S.lat0-mlat)*110574<30000&&Math.abs(S.lon0-mlon)*111320*Math.cos(mlat*Math.PI/180)<30000);
  const cxG=Math.cos(mlat*Math.PI/180)*111320,xy=[];for(const S of heatRuns)for(let i=0;i<S.n;i+=8)xy.push([S.xy[i][0]/S.cx*cxG,S.xy[i][1]]);
  const years=[...new Set(runs.filter(S=>S.start).map(S=>S.start.getFullYear()))],first=runs[0].start,last=runs[runs.length-1].start;
  const fmt=d=>d?d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
  return {isColl:true,runs,heatRuns,cx:cxG,xy,map:null,mapState:'idle',
    dist:runs.reduce((a,S)=>a+S.dist,0),time:runs.reduce((a,S)=>a+(isFinite(S.duration)?S.duration:0),0),
    climb:runs.reduce((a,S)=>a+(S.climb||0),0),longest:Math.max(...runs.map(S=>S.dist)),
    title:years.length===1?`Laufjahr ${years[0]}`:`${runs.length} Läufe`,
    eyebrow:`${runs.length} LÄUFE${first?` · ${fmt(first)} – ${fmt(last)}`:''}`};}
