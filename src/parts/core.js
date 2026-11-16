const FONTS = __FONTS__;
const SAMPLE = __SAMPLE__;

/* ================= Schriften ================= */
const FONT_CSS =
 `@font-face{font-family:'Anybody';font-style:normal;font-weight:100 900;font-stretch:50% 150%;src:url(data:font/woff2;base64,${FONTS.anyN}) format('woff2')}`+
 `@font-face{font-family:'Anybody';font-style:italic;font-weight:100 900;font-stretch:50% 150%;src:url(data:font/woff2;base64,${FONTS.anyI}) format('woff2')}`+
 `@font-face{font-family:'Chivo Mono';font-style:normal;font-weight:100 900;src:url(data:font/woff2;base64,${FONTS.chivo}) format('woff2')}`+
 `@font-face{font-family:'Hanken Grotesk';font-style:normal;font-weight:100 900;src:url(data:font/woff2;base64,${FONTS.hanken}) format('woff2')}`;
(()=>{const s=document.createElement('style');s.textContent=FONT_CSS;document.head.appendChild(s);})();

const FAM={d:"Anybody, 'Arial Narrow', sans-serif",m:"'Chivo Mono', monospace",b:"'Hanken Grotesk', sans-serif"};
const MONO={fam:'m',w:700};
function fa(f,size,extra){return `font-family="${FAM[f.fam]}" font-weight="${f.w||400}" font-style="${f.it?'italic':'normal'}" font-size="${r1(size)}" style="font-stretch:${f.st||100}%${extra?';'+extra:''}"`;}
const MT=document.querySelector('#measure text'); const mcache=new Map();
function measure(txt,f){
  const k=txt+'|'+f.fam+'|'+(f.w||400)+'|'+!!f.it+'|'+(f.st||100);
  if(mcache.has(k)) return mcache.get(k);
  MT.setAttribute('font-family',FAM[f.fam]);MT.setAttribute('font-weight',f.w||400);
  MT.setAttribute('font-style',f.it?'italic':'normal');MT.style.fontStretch=(f.st||100)+'%';
  MT.setAttribute('font-size',100);MT.textContent=txt||' ';
  const w=MT.getComputedTextLength(); mcache.set(k,w); return w;
}
function fit(txt,f,maxW,maxSize){const w=measure(txt,f);return w>0?Math.min(maxSize,maxW*100/w):maxSize;}

/* ================= Helfer ================= */
const r1=v=>Math.round(v*10)/10;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(x,d)=>x.toFixed(d).replace('.',',');
const pad2=v=>String(v).padStart(2,'0');
function dur(s){s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}:${pad2(m)}:${pad2(x)}`:`${m}:${pad2(x)}`;}
function pace(sPerKm){if(!isFinite(sPerKm))return '–';sPerKm=Math.round(sPerKm);return `${Math.floor(sPerKm/60)}:${pad2(sPerKm%60)}`;}
function parseTime(s){const m=String(s||'').trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);if(!m)return null;
  return m[3]!==undefined?(+m[1])*3600+(+m[2])*60+(+m[3]):(+m[1])*60+(+m[2]);}
function hex2rgb(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0);}
const toHex=a=>'#'+a.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
function mix(a,b,t){const A=hex2rgb(a),B=hex2rgb(b);return toHex(A.map((v,i)=>v+(B[i]-v)*t));}
const lt=(c,t)=>mix(c,'#ffffff',t),dk=(c,t)=>mix(c,'#000000',t);
function rgba(c,a){const[r,g,b]=hex2rgb(c);return `rgba(${r},${g},${b},${a})`;}
function ramp(stops,t){t=clamp(t,0,1);const n=stops.length-1,p=t*n,i=Math.min(Math.floor(p),n-1),f=p-i;return mix(stops[i],stops[i+1],f);}
const isHex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const bgr=C=>`x="-60" y="-60" width="${C.W+120}" height="${r1(C.H+120)}"`;

/* ================= GPX lesen ================= */
function child(el,name){const c=el.getElementsByTagNameNS('*',name);return c.length?c[0].textContent.trim():null;}
function parseGPX(text,fileName){
  const doc=new DOMParser().parseFromString(text,'application/xml');
  if(doc.getElementsByTagName('parsererror').length) throw new Error(`${fileName}: kein gültiges GPX (XML-Fehler).`);
  let nodes=[...doc.getElementsByTagNameNS('*','trkpt')];
  if(!nodes.length) nodes=[...doc.getElementsByTagNameNS('*','rtept')];
  if(nodes.length<10) throw new Error(`${fileName}: keine oder zu wenige Trackpunkte.`);
  let t0=null; const pts=[];
  for(const n of nodes){
    const lat=parseFloat(n.getAttribute('lat')),lon=parseFloat(n.getAttribute('lon'));
    if(!isFinite(lat)||!isFinite(lon)) continue;
    const e=child(n,'ele'),tm=child(n,'time'),hr=child(n,'hr')??child(n,'heartrate'),pw=child(n,'power')??child(n,'PowerInWatts')??child(n,'Watts'),cd=child(n,'cad')??child(n,'cadence');
    let t=tm?Date.parse(tm):NaN; if(isFinite(t)&&t0===null) t0=t;
    pts.push({lat,lon,ele:e!==null?parseFloat(e):NaN,t:isFinite(t)?(t-t0)/1000:NaN,hr:hr?parseFloat(hr):NaN,pw:pw?parseFloat(pw):NaN,cad:cd?parseFloat(cd):NaN});
  }
  const trk=doc.getElementsByTagNameNS('*','trk')[0],typeEl=trk&&[...trk.children].find(c=>c.localName==='type');
  const meta={};
  for(const k of ['totalDistance','totalTime','cumulativeClimb']){const v=child(doc.documentElement,k);if(v!==null&&isFinite(parseFloat(v)))meta[k]=parseFloat(v);}
  return {pts,startTime:t0,meta,fileName,type:typeEl?typeEl.textContent.trim():''};
}
function decodeSample(s){
  const st=s.hr?5:4;let la=0,lo=0,e=0,t=0;const pts=[];
  for(let i=0;i<s.d.length;i+=st){la+=s.d[i];lo+=s.d[i+1];e+=s.d[i+2];t+=s.d[i+3];pts.push({lat:la/1e6,lon:lo/1e6,ele:e/10,t,hr:s.hr?s.d[i+4]:NaN});}
  return {pts,startTime:Date.parse(s.t0),meta:s.meta,fileName:s.file,type:s.type||''};
}

/* ================= Lauf auswerten ================= */
function hav(a,b){const R=6371008.8,r=Math.PI/180,dp=(b.lat-a.lat)*r,dl=(b.lon-a.lon)*r;
  const h=Math.sin(dp/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
function pct(arr,p){const v=[...arr].sort((x,y)=>x-y);return v.length?v[Math.min(v.length-1,Math.floor(v.length*p))]:NaN;}
function analyze(raw){
  const P=raw.pts,n=P.length;
  const d=new Float64Array(n);for(let i=1;i<n;i++)d[i]=d[i-1]+hav(P[i-1],P[i]);
  const gps=d[n-1];let dist=gps;
  if(raw.meta.totalDistance){const k=raw.meta.totalDistance/gps;if(k>0.9&&k<1.1){for(let i=0;i<n;i++)d[i]*=k;dist=raw.meta.totalDistance;}}
  const withT=P.filter(p=>isFinite(p.t)).length;const hasTime=withT>n*0.9&&P[n-1].t>0;
  const t=P.map(p=>p.t);
  const duration=raw.meta.totalTime||(hasTime?t[n-1]-t[0]:NaN);
  const hasEle=P.filter(p=>isFinite(p.ele)).length>n*0.9;
  const ele=P.map(p=>p.ele);for(let i=0;i<n;i++)if(!isFinite(ele[i]))ele[i]=i?ele[i-1]:0;
  const eleS=ele.map((_,i)=>{let s=0,c=0;for(let j=Math.max(0,i-6);j<=Math.min(n-1,i+6);j++){s+=ele[j];c++;}return s/c;});
  let climb=raw.meta.cumulativeClimb;
  if(climb===undefined&&hasEle){climb=0;let ref=eleS[0];for(const e of eleS){if(e>ref+2){climb+=e-ref;ref=e;}else if(e<ref-2)ref=e;}}
  let eleMin=Infinity,eleMax=-Infinity;for(const e of eleS){eleMin=Math.min(eleMin,e);eleMax=Math.max(eleMax,e);}
  // Puls
  const hrRaw=P.map(p=>p.hr),hasHR=hrRaw.filter(v=>isFinite(v)&&v>30).length>n*0.5;
  let hrS=null,hrAvg=NaN,hrMax=NaN,hrLo=NaN,hrHi=NaN;
  if(hasHR){const h=hrRaw.slice();let last=h.find(v=>isFinite(v)&&v>30);for(let i=0;i<n;i++){if(isFinite(h[i])&&h[i]>30)last=h[i];else h[i]=last;}
    hrS=h.map((_,i)=>{let s=0,c=0;for(let j=Math.max(0,i-8);j<=Math.min(n-1,i+8);j++){s+=h[j];c++;}return s/c;});
    hrAvg=h.reduce((a,b)=>a+b,0)/n;hrMax=Math.max(...h);hrLo=pct(hrS,0.05);hrHi=pct(hrS,0.95);}
  // Projektion
  const lat0=P.reduce((s,p)=>s+p.lat,0)/n,lon0=P.reduce((s,p)=>s+p.lon,0)/n,cx=Math.cos(lat0*Math.PI/180)*111320;
  const xy=P.map(p=>[p.lon*cx,-p.lat*110574]);
  // geglättete Geschwindigkeit
  const smooth=win=>{const sp=new Float64Array(n);if(hasTime){let a=0,b=0;for(let i=0;i<n;i++){while(d[a]<d[i]-win)a++;while(b<n-1&&d[b+1]<=d[i]+win)b++;
    const dt=t[b]-t[a];sp[i]=dt>0?(d[b]-d[a])/dt:0;}}return sp;};
  const speed=smooth(200),speedG=smooth(350);
  const sv=[...speed].filter(v=>v>0.5);
  const lo=sv.length?pct(sv,0.05):1,hi=sv.length?pct(sv,0.95):2;
  const maxSpeed=hasTime?Math.max(...speed):NaN;
  let gradMax=0;if(hasEle){let j=0;for(let i=0;i<n;i++){while(j<n-1&&d[j]-d[i]<200)j++;if(d[j]-d[i]>=150)gradMax=Math.max(gradMax,(eleS[j]-eleS[i])/(d[j]-d[i])*100);}}
  const avgOf=k=>{const v=P.map(p=>p[k]).filter(x=>isFinite(x)&&x>0);return v.length>n*0.5?v.reduce((a,b)=>a+b,0)/v.length:NaN;};
  const power=avgOf('pw'),cad=avgOf('cad');
  const start=raw.startTime?new Date(raw.startTime):null;
  const S={cx,lat0,lon0,map:null,mapState:'idle',n,d,xy,eleS,eleMin,eleMax,hasEle,hasTime,speed,speedG,lo,hi,dist,duration,durationRaw:duration,climb,
    hasHR,hrS,hrAvg,hrMax,hrLo,hrHi,t,maxSpeed,gradMax,power,cad,type:raw.type||'',start,fileName:raw.fileName,points:raw.pts.length};
  S.sportAuto=S.sport=detectSport(raw.type,S);return S;
}
function idxAt(d,v){let a=0,b=d.length-1;while(a<b){const m=(a+b)>>1;if(d[m]<v)a=m+1;else b=m;}return a;}

/* ================= Kennzahlen ================= */
const STATS={
  dist:{label:'Distanz',need:null,val:S=>[num(S.dist/1000,2),'km']},
  time:{label:'Zeit',need:'time',val:S=>[dur(S.duration),'']},
  pace:{label:'Pace / Ø Tempo',lab:S=>isPace(S)?'Pace':'Ø Tempo',need:'time',val:S=>fmtV(S,S.dist/S.duration)},
  climb:{label:'Höhenmeter',need:'ele',val:S=>[Math.round(S.climb||0).toLocaleString('de-DE'),'m']},
  date:{label:'Datum',need:'start',val:S=>[S.start.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}),'']},
  start:{label:'Start',need:'start',val:S=>[S.start.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}),'Uhr']},
  best:{label:'Schnellster Abschnitt',lab:S=>`Schnellste${seg(S).len===1000?'r km':' '+seg(S).name}`,need:'splits',val:S=>fmtV(S,seg(S).len/seg(S).best)},
  speed:{label:'Tempo (km/h)',lab:()=>'Tempo',need:'speed',val:S=>[num(S.dist/S.duration*3.6,1),'km/h']},
  maxspeed:{label:'Max. Tempo',need:'time',val:S=>[num(S.maxSpeed*3.6,1),'km/h']},
  top:{label:'Höchster Punkt',need:'ele',val:S=>[Math.round(S.eleMax).toLocaleString('de-DE'),'m']},
  grad:{label:'Max. Steigung',need:'ele',val:S=>[num(S.gradMax,1),'%']},
  power:{label:'Ø Leistung',need:'power',val:S=>[String(Math.round(S.power)),'W']},
  cad:{label:'Ø Kadenz',need:'cad',val:S=>[String(Math.round(S.cad)),S.sport==='bike'?'rpm':'spm']},
  hr:{label:'Ø Puls',need:'hr',val:S=>[String(Math.round(S.hrAvg)),'bpm']},
  hrmax:{label:'Max. Puls',need:'hr',val:S=>[String(Math.round(S.hrMax)),'bpm']},
  rank:{label:'Platz',need:'rank',val:()=>[state.rank.trim(),'']},
  bibno:{label:'Startnummer',need:'bibno',val:()=>[state.bibno.trim(),'']},
};
function statOk(S,k){const n=STATS[k].need;return !n||(n==='time'&&S.hasTime&&isFinite(S.duration))||(n==='ele'&&S.hasEle)||(n==='start'&&!!S.start)||
  (n==='splits'&&seg(S).times.length>0)||(n==='speed'&&isPace(S)&&S.hasTime)||(n==='power'&&isFinite(S.power))||(n==='cad'&&isFinite(S.cad))||(n==='hr'&&S.hasHR)||(n==='rank'&&!!state.rank.trim())||(n==='bibno'&&!!state.bibno.trim());}
function autoTitle(S){const km=S.dist/1000,h=S.start?S.start.getHours():12;
  if(S.sport==='bike'){if(km>=200)return 'Radmarathon';if(km>=95)return `${Math.round(km)} Kilometer`;if((S.climb||0)>=1000)return 'Bergtour';
    return h<10?'Morgenrunde':h>=17?'Feierabendrunde':'Radtour';}
  if(S.sport==='hike'){if((S.climb||0)>=700)return 'Gipfeltour';return h<10?'Morgenwanderung':'Wanderung';}
  if(km>=42&&km<=43)return 'Marathon';if(km>=21&&km<=21.6)return 'Halbmarathon';
  if(km>=9.85&&km<=10.4)return '10 Kilometer';if(km>=4.9&&km<=5.3)return '5 Kilometer';
  if(S.start){const h=S.start.getHours();return h<10?'Morgenlauf':h<17?'Mittagslauf':'Abendlauf';}return 'Mein Lauf';}
function eyebrow(S){if(S.isColl)return S.eyebrow;if(!S.start)return `${num(S.dist/1000,1)} km`;
  const wd=S.start.toLocaleDateString('de-DE',{weekday:'long'});
  const dt=S.start.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
  const tm=S.start.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  return `${wd} · ${dt} · ${tm} Uhr`.toUpperCase();}
/* Farbcodierung der Strecke: Pace oder Puls */
function colorInfo(C){const S=C.S,o=C.o;
  if(o.color==='pace'&&S.hasTime)return {vals:S.speed,lo:S.lo,hi:S.hi,label:isPace(S)?'PACE':'TEMPO',lab:v=>fmtVs(S,v)};
  if(o.color==='hr'&&S.hasHR)return {vals:S.hrS,lo:S.hrLo,hi:S.hrHi,label:'PULS',lab:v=>Math.round(v)+' bpm'};
  return null;}
