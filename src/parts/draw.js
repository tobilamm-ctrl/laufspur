/* ================= Zeichenbausteine ================= */
function trimmed(C){const S=C.S,p=C.o.privacy;let a=0,b=S.n-1;
  if(p>0&&p*2<S.dist-200){a=idxAt(S.d,p);b=idxAt(S.d,S.dist-p);}return [a,b];}
function bboxRot(S,a,b,ang,step){const c=Math.cos(ang),s=Math.sin(ang);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let i=a;i<=b;i+=step){const[x,y]=S.xy[i],X=x*c-y*s,Y=x*s+y*c;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y;}
  const[x,y]=S.xy[b],X=x*c-y*s,Y=x*s+y*c;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y;return [x0,y0,x1,y1];}
/* Strecke in einen Kasten einpassen, optional gedreht (Grad, im Uhrzeigersinn) */
function fitBox(S,a,b,box,rotDeg,auto){
  let ang=(rotDeg||0)*Math.PI/180;
  if(auto){const step=Math.max(1,Math.floor((b-a)/600));let best=-1;
    for(let deg=-90;deg<90;deg+=5){const r=deg*Math.PI/180,[x0,y0,x1,y1]=bboxRot(S,a,b,r,step),sc=Math.min(box.w/((x1-x0)||1),box.h/((y1-y0)||1));
      if(sc>best*1.02){best=sc;ang=r;}}}
  const[x0,y0,x1,y1]=bboxRot(S,a,b,ang,1),c=Math.cos(ang),s=Math.sin(ang);
  const sc=Math.min(box.w/((x1-x0)||1),box.h/((y1-y0)||1));
  const ox=box.x+(box.w-(x1-x0)*sc)/2-x0*sc,oy=box.y+(box.h-(y1-y0)*sc)/2-y0*sc;
  const f=(x,y)=>[(x*c-y*s)*sc+ox,(x*s+y*c)*sc+oy];
  return {sc,ang,f,P:i=>f(S.xy[i][0],S.xy[i][1])};}
function pathD(pts,close){let s='',lx=null,ly=null,c=0;for(const[x,y]of pts){const X=r1(x),Y=r1(y);if(X===lx&&Y===ly)continue;s+=(s?'L':'M')+X+','+Y;lx=X;ly=Y;c++;}return c>1?s+(close?'Z':''):'';}
function rdp(pts,eps){if(pts.length<3)return pts;const keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;const st=[[0,pts.length-1]];
  while(st.length){const[a,b]=st.pop();const[ax,ay]=pts[a],[bx,by]=pts[b];const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1;let md=0,mi=-1;
    for(let i=a+1;i<b;i++){const dd=Math.abs(dy*pts[i][0]-dx*pts[i][1]+bx*ay-by*ax)/L;if(dd>md){md=dd;mi=i;}}
    if(md>eps){keep[mi]=1;st.push([a,mi],[mi,b]);}}return pts.filter((_,i)=>keep[i]);}

/* Ausschnitt: Rechteck mit weichem Rand oder Kreis */
function regionClip(C,R,key){const id=`${C.id}-${key}`;
  if(R.r)return {defs:`<clipPath id="${id}"><circle cx="${r1(R.cx)}" cy="${r1(R.cy)}" r="${r1(R.r)}"/></clipPath>`,attr:`clip-path="url(#${id})"`};
  if(R.hard)return {defs:`<clipPath id="${id}"><rect x="${r1(R.x)}" y="${r1(R.y)}" width="${r1(R.w)}" height="${r1(R.h)}"/></clipPath>`,attr:`clip-path="url(#${id})"`};
  return {defs:`<linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".14" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>`+
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="${r1(R.x)}" y="${r1(R.y)}" width="${r1(R.w)}" height="${r1(R.h)}"><rect x="${r1(R.x)}" y="${r1(R.y)}" width="${r1(R.w)}" height="${r1(R.h)}" fill="url(#${id}-f)"/></mask>`,
    attr:`mask="url(#${id})"`};}

/* ---- Foto hinter der Strecke ---- */
function photoLayer(C,R,tint){
  const ph=C.o.photo;if(!ph||C.thumb||C.coll)return '';
  const x=R.r?R.cx-R.r:R.x,y=R.r?R.cy-R.r:R.y,w=R.r?2*R.r:R.w,h=R.r?2*R.r:R.h,cl=regionClip(C,R,'ph');
  return `<defs>${cl.defs}</defs><g ${cl.attr}><image href="${ph.url}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" preserveAspectRatio="xMidYMid slice"/>`+
    `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${tint}" fill-opacity=".5"/></g>`;}

/* ---- Kartengrundlage (OpenStreetMap) ---- */
function mapLayer(C,T,R,ms,M){
  if(!M||!C.o.map||!ms||C.thumb)return '';
  const rx0=R.r?R.cx-R.r:R.x,rx1=R.r?R.cx+R.r:R.x+R.w,ry0=R.r?R.cy-R.r:R.y,ry1=R.r?R.cy+R.r:R.y+R.h;
  const by={};
  for(const w of M.ways){const c=[T.f(w.b[0],w.b[1]),T.f(w.b[2],w.b[1]),T.f(w.b[0],w.b[3]),T.f(w.b[2],w.b[3])];
    if(Math.max(...c.map(p=>p[0]))<rx0||Math.min(...c.map(p=>p[0]))>rx1||Math.max(...c.map(p=>p[1]))<ry0||Math.min(...c.map(p=>p[1]))>ry1)continue;
    let d='';for(const ring of w.r)d+=pathD(ring.map(([x,y])=>T.f(x,y)),w.a);
    if(d)(by[w.k]=by[w.k]||[]).push(d);}
  const op=ms.op||1,P=(k,attrs)=>by[k]?`<path d="${by[k].join('')}" ${attrs}/>`:'',o2=v=>r1(v*op*100)/100;
  const line=(k,c,w,o,extra='')=>P(k,`fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o2(o)}" stroke-linecap="round" stroke-linejoin="round" ${extra}`);
  const g=P('green',`fill="${ms.green}" fill-opacity="${o2(.13)}" fill-rule="evenodd"`)+
    P('water',`fill="${ms.water}" fill-opacity="${o2(.32)}" fill-rule="evenodd"`)+
    P('building',`fill="${ms.line}" fill-opacity="${o2(.14)}"`)+
    line('stream',ms.water,1.8,.6)+line('river',ms.water,4.5,.65)+
    line('rail',ms.line,2,.4,'stroke-dasharray="7 5"')+line('path',ms.line,1.1,.32,'stroke-dasharray="3 3"')+
    line('minor',ms.line,2.2,.4)+line('major',ms.line,4.2,.58);
  const cl=regionClip(C,R,'mm');C.attr=ms.text||ms.line;
  return `<defs>${cl.defs}</defs><g ${cl.attr}${ms.blend?' style="mix-blend-mode:multiply"':''}>${g}</g>`;
}

function routeLayer(C,box,st,mapR){
  const S=C.S,o=C.o,[a,b]=trimmed(C),T=fitBox(S,a,b,box,o.rot,o.rotAuto),P=T.P,w=st.width;
  const all=[];for(let i=a;i<=b;i++)all.push(P(i));
  if(C.id==='p')C.hit={pts:all,a};
  const full=pathD(rdp(all,0.35));
  const common=`fill="none" stroke-linecap="round" stroke-linejoin="round"`,blend=st.blend?' style="mix-blend-mode:multiply"':'';
  let out='';
  if(mapR){out+=photoLayer(C,mapR,st.tint||st.mk.halo);out+=mapLayer(C,T,mapR,st.map,S.map);}
  if(o.echo&&st.echo){[[3,.13],[2,.26],[1,.45]].forEach(([k,op])=>{
    out+=`<path d="${full}" transform="translate(${st.echo.dx*k} ${st.echo.dy*k})" ${common} stroke="${st.echo.color}" stroke-opacity="${op}" stroke-width="${w}"/>`;});}
  if(st.emboss)out+=`<path d="${full}" transform="translate(1.6 1.8)" ${common} stroke="${st.emboss}" stroke-opacity=".7" stroke-width="${w}"/>`;
  if(st.misreg)out+=`<path d="${full}" transform="translate(${st.misreg.dx} ${st.misreg.dy})" ${common} stroke="${st.misreg.color}" stroke-width="${w}"${blend}/>`;
  let main='';const ci=colorInfo(C);
  if(ci){let seg=[P(a)],segStart=S.d[a],sum=0,cnt=0;
    const flush=()=>{if(seg.length>1){const v=sum/cnt;main+=`<path d="${pathD(seg)}" ${common} stroke="${ramp(st.ramp,(v-ci.lo)/((ci.hi-ci.lo)||1))}" stroke-width="${w}"${blend}/>`;}};
    for(let i=a+1;i<=b;i++){seg.push(P(i));sum+=ci.vals[i];cnt++;
      if(S.d[i]-segStart>=55||i===b){flush();seg=[P(i)];segStart=S.d[i];sum=0;cnt=0;}}
  } else main=`<path d="${full}" ${common} stroke="${st.color}" stroke-width="${w}"${blend}/>`;
  if(st.glow)out+=`<g filter="url(#${C.id}-glow)" opacity="${st.glow}">${main}</g>`;
  out+=main;
  const placed=[];
  const place=(x,y)=>{let yy=y;for(let g=0;g<6&&placed.some(([px,py])=>Math.abs(px-x)<70&&Math.abs(py-yy)<22);g++)yy+=22;placed.push([x,yy]);return yy;};
  const kw=Math.max(w,4);
  if(o.km){markers(S).forEach(({i,km,big})=>{if(i<a||i>b)return;const[x,y]=P(i);
    out+=`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(big?kw*1.05:kw*0.62)}" fill="${st.mk.fill}" stroke="${st.mk.stroke}" stroke-width="${big?3:2}"/>`;
    if(big)out+=`<text x="${r1(x+kw+8)}" y="${r1(place(x+kw+8,y-kw-6))}" ${fa(MONO,19)} fill="${st.mk.text}" stroke="${st.mk.halo}" stroke-width="5" paint-order="stroke" stroke-linejoin="round">${km}</text>`;});}
  if(o.ends){const[sx,sy]=P(a),[ex,ey]=P(b),close=Math.hypot(sx-ex,sy-ey)<90;
    out+=`<circle cx="${r1(sx)}" cy="${r1(sy)}" r="${r1(kw*1.3)}" fill="${st.mk.halo}" stroke="${st.mk.stroke}" stroke-width="3.5"/>`;
    const s=kw*1.15;out+=`<g transform="translate(${r1(ex+(close?kw*2.6:0))} ${r1(ey)})"><rect x="${-s}" y="${-s}" width="${2*s}" height="${2*s}" fill="${st.mk.stroke}"/>`+
      `<rect x="${-s}" y="${-s}" width="${s}" height="${s}" fill="${st.mk.halo}"/><rect x="0" y="0" width="${s}" height="${s}" fill="${st.mk.halo}"/></g>`;
    if(!close){out+=lbl(sx,place(sx,sy-kw*2.4),'START',st)+lbl(ex,place(ex,ey-kw*2.4),'ZIEL',st);}else out+=lbl(sx,place(sx,sy-kw*2.8),'START · ZIEL',st);}
  // eigene Markierungen
  (o.marks||[]).forEach(mk=>{const i=idxAt(S.d,mk.d);if(i<a||i>b||!mk.text.trim())return;const[x,y]=P(i),left=x>box.x+box.w*0.62;
    const tx=left?x-26:x+26,ty=place(tx,y-22),fs=Math.max(15,Math.min(20,box.w/40));
    out+=`<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(tx+(left?6:-6))}" y2="${r1(ty-fs*0.3)}" stroke="${st.mk.text}" stroke-width="2"/>`+
      `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(kw*0.9)}" fill="${st.mk.text}" stroke="${st.mk.halo}" stroke-width="3"/>`+
      `<text x="${r1(tx)}" y="${r1(ty)}" ${left?'text-anchor="end" ':''}${fa({fam:'b',w:700},fs)} fill="${st.mk.text}" stroke="${st.mk.halo}" stroke-width="6" paint-order="stroke" stroke-linejoin="round">${esc(mk.text.trim())}</text>`;});
  // Nordpfeil, wenn gedreht
  if(Math.abs(T.ang)>0.01){const nx=box.x+box.w-14,ny=box.y+18,[x0,y0]=T.f(0,0),[x1,y1]=T.f(0,-100),L=Math.hypot(x1-x0,y1-y0)||1,ux=(x1-x0)/L,uy=(y1-y0)/L;
    out+=`<g><line x1="${r1(nx-ux*14)}" y1="${r1(ny-uy*14)}" x2="${r1(nx+ux*14)}" y2="${r1(ny+uy*14)}" stroke="${st.mk.text}" stroke-width="2.5"/>`+
      `<polygon points="${r1(nx+ux*20)},${r1(ny+uy*20)} ${r1(nx+ux*8-uy*6)},${r1(ny+uy*8+ux*6)} ${r1(nx+ux*8+uy*6)},${r1(ny+uy*8-ux*6)}" fill="${st.mk.text}"/>`+
      `<text x="${r1(nx+ux*34)}" y="${r1(ny+uy*34+5)}" text-anchor="middle" ${fa(MONO,13)} fill="${st.mk.text}">N</text></g>`;}
  return out;
}
function lbl(x,y,t,st){return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="middle" ${fa(MONO,14)} letter-spacing="2" fill="${st.mk.text}" stroke="${st.mk.halo}" stroke-width="5" paint-order="stroke">${t}</text>`;}

/* ---- Diagramme ---- */
const GRAPHS=[['profile','Höhenprofil'],['pace','Tempo-Kurve'],['hr','Puls-Kurve'],['splits','Abschnitte']];
const graphOk=(S,g)=>g==='profile'?S.hasEle:g==='pace'?S.hasTime:g==='hr'?S.hasHR:seg(S).times.length>1;
function graphList(C){return GRAPHS.map(g=>g[0]).filter(g=>C.o.graphs.includes(g)&&graphOk(C.S,g));}
function graphs(C,box,st){const L=graphList(C);if(!L.length)return '';const gap=18,h=(box.h-gap*(L.length-1))/L.length;let out='';
  L.forEach((g,i)=>{const b={x:box.x,y:box.y+i*(h+gap),w:box.w,h};out+=({profile:gProfile,pace:gPace,hr:gHR,splits:gSplits})[g](C,b,st);});return out;}
function bandHead(b,l,r,st){return `<text x="${b.x}" y="${b.y+12}" ${fa(MONO,13)} letter-spacing="2.5" fill="${st.label}">${esc(l)}</text>`+
  `<text x="${b.x+b.w}" y="${b.y+12}" text-anchor="end" ${fa({fam:'m',w:400},13)} letter-spacing="1" fill="${st.label}">${esc(r)}</text>`;}
const bl=st=>st.blend?' style="mix-blend-mode:multiply"':'';
function gProfile(C,b,st){const S=C.S,top=b.y+22,hh=b.h-22,N=260,span=Math.max(S.eleMax-S.eleMin,25);let pts=[];
  for(let k=0;k<=N;k++){const i=idxAt(S.d,S.dist*k/N);pts.push([b.x+b.w*k/N,top+hh-(S.eleS[i]-S.eleMin)/span*hh*0.92]);}
  const line=pathD(pts),area=`M${b.x},${top+hh}L`+line.slice(1)+`L${b.x+b.w},${top+hh}Z`;
  return bandHead(b,'HÖHENPROFIL',`${Math.round(S.eleMin)}–${Math.round(S.eleMax)} m ü. NN`,st)+
    `<path d="${area}" fill="${st.fill}" fill-opacity="${st.fillOp}"${bl(st)}/><path d="${line}" fill="none" stroke="${st.line}" stroke-width="2.5" stroke-linejoin="round"${bl(st)}/>`;}
function curveBand(C,b,st,vals,lo,hi,colored,head,right,key){const S=C.S,top=b.y+22,hh=b.h-22,N=220,lo2=lo-(hi-lo)*0.25;let pts=[],stops='';
  for(let k=0;k<=N;k++){const i=idxAt(S.d,S.dist*k/N),v=vals[i];pts.push([b.x+b.w*k/N,top+hh-clamp((v-lo2)/((hi-lo2)||1),0,1)*hh]);
    if(k%5===0)stops+=`<stop offset="${r1(k/N*100)}%" stop-color="${ramp(st.ramp||['#ffffff','#ffffff'],(v-lo)/((hi-lo)||1))}"/>`;}
  const line=pathD(pts),area=`M${b.x},${top+hh}L`+line.slice(1)+`L${b.x+b.w},${top+hh}Z`,gid=`${C.id}-${key}${Math.round(b.y)}`;
  return bandHead(b,head,right,st)+
    (colored&&st.ramp?`<defs><linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="0">${stops}</linearGradient></defs><path d="${area}" fill="url(#${gid})"${bl(st)}/>`
            :`<path d="${area}" fill="${st.fill}" fill-opacity="${st.fillOp}"${bl(st)}/><path d="${line}" fill="none" stroke="${st.line}" stroke-width="2.5" stroke-linejoin="round"${bl(st)}/>`);}
function gPace(C,b,st){const S=C.S;return curveBand(C,b,st,S.speedG,S.lo,S.hi,C.o.color==='pace',isPace(S)?'PACE':'TEMPO',`Ø ${fmtVs(S,S.dist/S.duration)}`,'pg');}
function gHR(C,b,st){const S=C.S;return curveBand(C,b,st,S.hrS,S.hrLo,S.hrHi,C.o.color==='hr','PULS',`Ø ${Math.round(S.hrAvg)} · max. ${Math.round(S.hrMax)} bpm`,'hg');}
function gSplits(C,b,st){const S=C.S,G=seg(S),sp=G.times,n=sp.length,top=b.y+44,bot=b.y+b.h-18,hh=bot-top,slot=b.w/n,bw=slot*0.68,lab=(G.len/1000)*(n>12?5:1);
  const v=sp.map(s=>G.len/s),vmin=Math.min(...v),vmax=Math.max(...v);let out=bandHead(b,G.len===1000?'KM-SPLITS':`ABSCHNITTE JE ${G.name.toUpperCase()}`,`schnellster: ${G.label(G.bestK)} · ${fmtVs(S,G.len/G.best)}`,st);
  sp.forEach((s,i)=>{const h=hh*(0.18+0.82*(v[i]-vmin)/((vmax-vmin)||1)),x=b.x+i*slot+(slot-bw)/2,isB=i+1===G.bestK,kmEnd=(i+1)*G.len/1000;
    out+=`<rect x="${r1(x)}" y="${r1(bot-h)}" width="${r1(bw)}" height="${r1(h)}" fill="${isB?st.best:st.bar}" fill-opacity="${isB?1:st.barOp}"${bl(st)}/>`;
    if(Math.abs(kmEnd/lab-Math.round(kmEnd/lab))<1e-6||i===0)out+=`<text x="${r1(x+bw/2)}" y="${r1(bot+15)}" text-anchor="middle" ${fa({fam:'m',w:400},12)} fill="${st.label}">${kmEnd}</text>`;
    if(isB)out+=`<text x="${r1(x+bw/2)}" y="${r1(bot-h-7)}" text-anchor="middle" ${fa(MONO,14)} fill="${st.best}">${fmtV(S,G.len/s)[0]}</text>`;});
  return out;}

/* ---- Kennzahlen ---- */
const statLabel=(S,k)=>STATS[k].lab?STATS[k].lab(S):STATS[k].label;
const statItems=(S,keys)=>keys.filter(k=>statOk(S,k)).map(k=>{const[v,u]=STATS[k].val(S);return {label:statLabel(S,k),v,u};});
function itemsRow(box,items,st){if(!items.length)return '';
  const n=items.length,cols=n<=4?n:Math.ceil(n/2),rows=Math.ceil(n/cols),cw=box.w/cols,ch=box.h/rows;
  const vf={fam:'d',w:800,it:st.italic!==false,st:st.stretch||100},uf={fam:'b',w:600};let out='';
  const size=Math.min(...items.map(({v,u})=>{const wv=measure(v,vf),wu=u?measure(u,uf)*0.38+8:0;return Math.min(ch-34,(cw-22)*100/(wv+wu));}));
  items.forEach(({label,v,u},i)=>{const c=i%cols,r=Math.floor(i/cols),x=box.x+c*cw+(c?16:0),y=box.y+r*ch;
    if(c)out+=`<line x1="${r1(box.x+c*cw)}" x2="${r1(box.x+c*cw)}" y1="${r1(y+4)}" y2="${r1(y+ch-6)}" stroke="${st.sep}" stroke-width="2"/>`;
    out+=`<text x="${r1(x)}" y="${r1(y+14)}" ${fa(MONO,14)} letter-spacing="2.5" fill="${st.label}">${esc(label.toUpperCase())}</text>`;
    out+=valueText(x,y+22+size*0.8,v,u,vf,size,st.value,'');});
  return out;}
const statsRow=(C,box,keys,st)=>itemsRow(box,statItems(C.S,keys),st);
const rowsFor=n=>n?Math.ceil(n/(n<=4?n:Math.ceil(n/2))):0;
function valueText(x,y,v,u,vf,size,fill,anchor){
  return `<text x="${r1(x)}" y="${r1(y)}" ${anchor?`text-anchor="${anchor}" `:''}${fa(vf,size)} fill="${fill}">${esc(v)}${u?`<tspan dx="${r1(size*0.08)}" font-family="${FAM.b}" font-weight="600" font-style="normal" font-size="${r1(size*0.38)}" style="font-stretch:100%">${esc(u)}</tspan>`:''}</text>`;}
function itemsColumn(box,items,st){if(!items.length)return '';
  const vf={fam:'d',w:800,it:st.italic!==false,st:st.stretch||100},uf={fam:'b',w:600},rh=Math.min(box.h/items.length,118);
  const size=Math.min(rh-38,...items.map(({v,u})=>(box.w-6)*100/(measure(v,vf)+(u?measure(u,uf)*0.38+8:0))));
  let out='';items.forEach(({label,v,u},i)=>{const y=box.y+i*rh;
    if(i)out+=`<line x1="${r1(box.x)}" x2="${r1(box.x+box.w)}" y1="${r1(y-6)}" y2="${r1(y-6)}" stroke="${st.sep}" stroke-width="2"/>`;
    out+=`<text x="${r1(box.x)}" y="${r1(y+16)}" ${fa(MONO,14)} letter-spacing="2.5" fill="${st.label}">${esc(label.toUpperCase())}</text>`+valueText(box.x,y+24+size*0.8,v,u,vf,size,st.value,'');});
  return out;}

function heroText(C,x,y,maxW,maxSize,st){const[v,u]=st.value||STATS[st.key].val(C.S),f={fam:'d',w:900,it:st.italic!==false,st:st.stretch};
  const uf={fam:'m',w:700},uw=u?measure(u.toUpperCase(),uf)*0.2+14:0,wv=measure(v,f);
  const size=Math.min(maxSize,maxW*100/(wv+uw));
  const unit=u?`<tspan dx="${r1(size*0.08)}" font-family="${FAM.m}" font-weight="700" font-style="normal" font-size="${r1(size*0.2)}" letter-spacing="3" style="font-stretch:100%">${esc(u.toUpperCase())}</tspan>`:'';
  let out='';const an=st.center?'text-anchor="middle" ':'';
  if(C.o.echo&&st.echo)[[3,.12],[2,.22],[1,.38]].forEach(([k,op])=>{out+=`<text x="${r1(x-k*st.echo.dx)}" y="${r1(y)}" ${an}${fa(f,size)} fill="none" stroke="${st.echo.color}" stroke-opacity="${op}" stroke-width="2">${esc(v)}</text>`;});
  if(st.shadow)out+=`<text x="${r1(x+st.shadow.dx)}" y="${r1(y+st.shadow.dy)}" ${an}${fa(f,size,'mix-blend-mode:multiply')} fill="${st.shadow.color}">${esc(v)}${unit}</text>`;
  return {svg:out+`<text x="${r1(x)}" y="${r1(y)}" ${an}${fa(f,size,st.shadow?'mix-blend-mode:multiply':'')} fill="${st.fill}">${esc(v)}${unit}</text>`,size};}

/* ---- Aufbau: oben Kopfzeile + Titel, unten Diagramme + große Zahl + Kennzahlen ---- */
function topBlock(C,st){
  const{W,H,S,o}=C,m=70,cw=W-2*m;let s='';
  s+=`<text x="${m}" y="88" ${fa(MONO,17)} letter-spacing="3" fill="${st.eyebrow}">${esc(eyebrow(S))}</text>`;
  if(o.name)s+=`<text x="${W-m}" y="88" text-anchor="end" ${fa(MONO,17)} letter-spacing="3" fill="${st.eyebrow}">${esc(o.name.toUpperCase())}</text>`;
  const tf=st.title.font,tt=(o.title||' ').toUpperCase(),ts=fit(tt,tf,cw,st.title.max*(H<1100?0.82:1));
  const tb=116+ts*0.74;
  if(st.title.shadow)s+=`<text x="${r1(m-ts*0.02+st.title.shadow.dx)}" y="${r1(tb+st.title.shadow.dy)}" ${fa(tf,ts,'mix-blend-mode:multiply')} fill="${st.title.shadow.color}">${esc(tt)}</text>`;
  s+=`<text x="${r1(m-ts*0.02)}" y="${r1(tb)}" ${fa(tf,ts,st.title.shadow?'mix-blend-mode:multiply':'')} fill="${st.title.fill}">${esc(tt)}</text>`;
  let y=tb;
  if(o.sub){y+=44;s+=`<text x="${m}" y="${r1(y)}" ${fa({fam:'b',w:600},28)} fill="${st.sub}">${esc(o.sub)}</text>`;}
  return {svg:s,y};}
function bottomBlock(C,st,items){
  const{W,H,S,o}=C,m=70,cw=W-2*m;let s='';
  items=items||statItems(S,o.stats.filter(k=>k!==(st.hero&&st.hero.key)));
  const rows=rowsFor(items.length),sh=rows*(H<1100?78:92),sy=H-60-sh;
  let heroBase=rows?sy-48:H-70,heroTop=heroBase,hero=null;
  if(st.hero&&(st.hero.value||statOk(S,st.hero.key))){hero=heroText(C,st.hero.center?W/2:m,heroBase,cw,H*(H<1100?0.13:0.15)*(st.hero.scale||1),st.hero);heroTop=heroBase-hero.size*0.74;}
  const gl=C.coll?[]:graphList(C),gh=gl.length?Math.min(gl.length*H*0.068+(gl.length-1)*18,H*0.24):0;
  const g1=hero?heroTop-40:(rows?sy-34:H-70),g0=g1-gh;
  if(gl.length)s+=graphs(C,{x:m,y:g0,w:cw,h:gh},st.graph);
  if(hero)s+=hero.svg;
  if(rows)s+=itemsRow({x:m,y:sy,w:cw,h:sh},items,st.stats);
  return {svg:s,top:gl.length?g0:g1};}
function standard(C,st){
  const{W,o}=C,m=70,cw=W-2*m;
  const top=topBlock(C,st),bot=bottomBlock(C,st);
  const routeTop=top.y+46,routeBottom=bot.top-40;
  let s=top.svg;
  s+=routeLayer(C,{x:m+10,y:routeTop,w:cw-20,h:Math.max(80,routeBottom-routeTop)},st.route,{x:0,y:routeTop-46,w:W,h:routeBottom-routeTop+80});
  s+=bot.svg;
  if(st.legend)s+=legend(C,W-m-190,routeBottom+6,190,st.legend);
  return s;}
function legend(C,x,y,w,st){const ci=colorInfo(C);if(!ci)return '';const id=`${C.id}-lg`;let stops='';st.ramp.forEach((c,i)=>stops+=`<stop offset="${i/(st.ramp.length-1)*100}%" stop-color="${c}"/>`);
  return `<defs><linearGradient id="${id}">${stops}</linearGradient></defs>`+
    `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="url(#${id})"/>`+
    `<text x="${x}" y="${y+24}" ${fa({fam:'m',w:400},12)} fill="${st.text}">${ci.lab(ci.lo)}</text>`+
    `<text x="${x+w}" y="${y+24}" text-anchor="end" ${fa({fam:'m',w:400},12)} fill="${st.text}">${ci.lab(ci.hi)}</text>`+
    `<text x="${x+w/2}" y="${y+24}" text-anchor="middle" ${fa(MONO,12)} letter-spacing="2" fill="${st.text}">${ci.label}</text>`;}
