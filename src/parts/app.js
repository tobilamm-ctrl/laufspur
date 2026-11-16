const FORMATS={
  a:{label:'DIN A · 1:1,41',h:1414.2,sizes:[{l:'A4 · 21 × 29,7 cm',mm:[210,297]},{l:'A3 · 29,7 × 42 cm',mm:[297,420]},{l:'A2 · 42 × 59,4 cm',mm:[420,594]}],def:2},
  f57:{label:'50 × 70 cm',h:1400,sizes:[{l:'30 × 42 cm',mm:[300,420]},{l:'50 × 70 cm',mm:[500,700]}],def:2},
  sq:{label:'Quadrat',h:1000,sizes:[{l:'30 × 30 cm',mm:[300,300]},{l:'50 × 50 cm',mm:[500,500]}],def:1},
  story:{label:'Story 9:16',h:1777.8,sizes:[{l:'1080 × 1920 px',px:1080},{l:'2160 × 3840 px',px:2160}],def:1},
};
const SCREEN={l:'Bildschirm · 1600 px',px:1600};
const sizeList=f=>[SCREEN,...FORMATS[f].sizes];

/* ================= Karte laden ================= */
const OVERPASS='https://overpass-api.de/api/interpreter';
function mapQuery(S){
  let la0=Infinity,la1=-Infinity,lo0=Infinity,lo1=-Infinity;
  for(const[x,y]of S.xy){const lon=x/S.cx,lat=-y/110574;la0=Math.min(la0,lat);la1=Math.max(la1,lat);lo0=Math.min(lo0,lon);lo1=Math.max(lo1,lon);}
  const spanM=Math.max((la1-la0)*110574,(lo1-lo0)*S.cx),pad=spanM*0.75+400;
  const dLa=pad/110574,dLo=pad/S.cx,area=((la1-la0)*110574+2*pad)*((lo1-lo0)*S.cx+2*pad)/1e6;
  const bb=`(${(la0-dLa).toFixed(5)},${(lo0-dLo).toFixed(5)},${(la1+dLa).toFixed(5)},${(lo1+dLo).toFixed(5)})`;
  const hw=area<250?'motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|service|track|path|footway|cycleway|bridleway|steps|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link'
          :area<1500?'motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link':'motorway|trunk|primary|secondary|motorway_link|trunk_link';
  return `[out:json][timeout:90];(way["highway"~"^(${hw})$"]${bb};way["waterway"~"^(river|stream|canal)$"]${bb};way["railway"="rail"]${bb};`+
    `way["natural"~"^(water|wood)$"]${bb};way["landuse"~"^(forest|reservoir)$"]${bb};way["leisure"="park"]${bb};${area<20?`way["building"]${bb};`:''}`+
    `rel["natural"~"^(water|wood)$"]${bb};rel["landuse"="forest"]${bb};);out geom qt;`;
}
function osmClass(t){
  if(t.building)return 'building';
  if(t.highway){const h=t.highway;if(/^(motorway|trunk|primary|secondary)/.test(h))return 'major';if(/^(track|path|footway|cycleway|bridleway|steps)$/.test(h))return 'path';return 'minor';}
  if(t.waterway)return t.waterway==='river'?'river':'stream';
  if(t.railway)return 'rail';
  if(t.natural==='water'||t.landuse==='reservoir')return 'water';
  if(t.natural==='wood'||t.landuse==='forest'||t.leisure==='park')return 'green';
  return null;}
function joinRings(parts){const eq=(a,b)=>Math.abs(a[0]-b[0])<0.05&&Math.abs(a[1]-b[1])<0.05,open=parts.filter(p=>p.length>1).map(p=>p.slice()),rings=[];
  while(open.length){let cur=open.shift(),guard=0;
    while(!eq(cur[0],cur[cur.length-1])&&guard++<5000){const end=cur[cur.length-1],i=open.findIndex(p=>eq(p[0],end)||eq(p[p.length-1],end));if(i<0)break;
      let p=open.splice(i,1)[0];if(!eq(p[0],end))p=p.reverse();cur=cur.concat(p.slice(1));}
    rings.push(cur);}return rings;}
function processOSM(json,S){
  const proj=p=>[p.lon*S.cx,-p.lat*110574],AREA={building:1,water:1,green:1},ways=[];
  const add=(k,a,rings)=>{let b=[Infinity,Infinity,-Infinity,-Infinity];rings=rings.map(r=>rdp(r,a?2:1.5));
    for(const r of rings)for(const[x,y]of r){if(x<b[0])b[0]=x;if(y<b[1])b[1]=y;if(x>b[2])b[2]=x;if(y>b[3])b[3]=y;}ways.push({k,a,r:rings,b});};
  for(const el of json.elements||[]){const k=osmClass(el.tags||{});if(!k)continue;
    if(el.type==='way'&&el.geometry&&el.geometry.length>1){const pts=el.geometry.map(proj),closed=pts.length>3&&Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][1]-pts[pts.length-1][1])<0.5;
      if(AREA[k]&&!closed)continue;add(k,!!AREA[k],[pts]);}
    else if(el.type==='relation'&&el.members){const parts=el.members.filter(mb=>mb.type==='way'&&mb.geometry&&mb.geometry.length>1).map(mb=>mb.geometry.map(proj));
      if(parts.length)add(k,true,joinRings(parts));}}
  const order={green:0,water:1,building:2,stream:3,river:4,rail:5,path:6,minor:7,major:8};ways.sort((x,y)=>order[x.k]-order[y.k]);
  return {ways,count:ways.length};}

/* ================= Zustand ================= */
let RUN=null,COLL=null,HIT=null,markMode=false;
const PRESET_KEYS=['tpl','statsBy','color','echo','km','ends','map','graphs','privacy','fmt','size','colors','name','view','rotAuto'];
const DEFAULTS={tpl:'tartan',statsBy:{run:SPORTS.run.stats.slice(),bike:SPORTS.bike.stats.slice(),hike:SPORTS.hike.stats.slice()},color:'none',echo:true,km:true,ends:true,map:false,graphs:['profile'],privacy:200,fmt:'a',size:2,colors:{},name:'',view:'tiles',rotAuto:false};
const state=Object.assign(structuredClone(DEFAULTS),{mode:'single',sportSel:'auto',titleAuto:true,title:'',sub:'',rank:'',bibno:'',offtime:'',marks:[],photo:null,rot:0});
/* Einstellungen prüfen, bevor sie übernommen werden (Datei oder Browser-Speicher) */
function cleanPreset(p){const o={};if(!p||typeof p!=='object')return o;
  if(TEMPLATES[p.tpl])o.tpl=p.tpl;
  const sb=Object.assign(structuredClone(DEFAULTS.statsBy),state.statsBy);let anyS=false;
  if(Array.isArray(p.stats)){sb.run=p.stats.filter(k=>STATS[k]);anyS=true;}
  if(p.statsBy&&typeof p.statsBy==='object')for(const k in SPORTS)if(Array.isArray(p.statsBy[k])){sb[k]=p.statsBy[k].filter(x=>STATS[x]);anyS=true;}
  if(anyS)o.statsBy=sb;
  if(['none','pace','hr'].includes(p.color))o.color=p.color;
  for(const k of ['echo','km','ends','map','rotAuto'])if(typeof p[k]==='boolean')o[k]=p[k];
  if(Array.isArray(p.graphs))o.graphs=p.graphs.filter(g=>GRAPHS.some(x=>x[0]===g));
  if(Number.isFinite(p.privacy))o.privacy=clamp(Math.round(p.privacy/50)*50,0,600);
  if(FORMATS[p.fmt])o.fmt=p.fmt;
  if(Number.isInteger(p.size))o.size=clamp(p.size,0,sizeList(o.fmt||state.fmt).length-1);
  if(p.colors&&typeof p.colors==='object'){o.colors={};for(const k in p.colors)if(TEMPLATES[k]){const c=p.colors[k]||{},e={};if(isHex(c.bg))e.bg=c.bg;if(isHex(c.fg))e.fg=c.fg;if(e.bg||e.fg)o.colors[k]=e;}}
  if(typeof p.name==='string')o.name=p.name.slice(0,40);
  if(COLLVIEWS[p.view])o.view=p.view;
  return o;}
const presetOf=()=>{const o={};for(const k of PRESET_KEYS)o[k]=structuredClone(state[k]);return o;};
try{Object.assign(state,cleanPreset(JSON.parse(localStorage.getItem('spurwerk-einstellungen')||localStorage.getItem('laufspur-einstellungen')||'null')));}catch(e){}
let saveT;function remember(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem('spurwerk-einstellungen',JSON.stringify(presetOf()));}catch(e){}},400);}

/* ================= Rendern ================= */
const cur=()=>state.mode==='coll'?COLL:RUN;
function renderSVG(tplKey,id,exp){
  const F=FORMATS[state.fmt],W=1000,H=F.h,S=cur(),o=Object.assign({},state,{tpl:tplKey,stats:S.isColl?[]:state.statsBy[S.sport]||[]});
  if(!S.isColl){const off=parseTime(state.offtime);S.duration=off||S.durationRaw;}
  const C={W,H,S,o,id,thumb:id[0]==='t',coll:!!S.isColl};
  let body=S.isColl?COLLVIEWS[state.view].render(C):TEMPLATES[tplKey].render(C);
  if(C.attr)body+=`<text x="${W-14}" y="${r1(H-12)}" text-anchor="end" ${fa({fam:'m',w:400},11)} fill="${C.attr}">Karte © OpenStreetMap-Mitwirkende</text>`;
  if(id==='p')HIT=C.hit||null;
  const b=exp&&exp.bleed||0,vb=`${r1(-b)} ${r1(-b)} ${r1(W+2*b)} ${r1(H+2*b)}`;
  const dims=exp?(exp.mm?`width="${exp.mm[0]}mm" height="${exp.mm[1]}mm"`:`width="${r1(W+2*b)}" height="${r1(H+2*b)}"`):'';
  const label=`Poster ${state.title}, ${num(S.dist/1000,2)} Kilometer`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${dims} role="img" aria-label="${esc(label)}">${exp?`<style>${FONT_CSS}</style>`:''}<g>${body}</g></svg>`;
}
const $=s=>document.querySelector(s);
let queued=false,swap=false;
function schedule(withSwap){if(withSwap)swap=true;remember();if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;draw();});}
function draw(){
  if(!cur())return;
  const P=$('#poster');P.style.setProperty('--ratio',FORMATS[state.fmt].h/1000);P.innerHTML=renderSVG(state.tpl,'p');
  P.classList.toggle('marking',markMode);
  if(swap){P.classList.remove('swap');void P.offsetWidth;P.classList.add('swap');swap=false;}
  for(const k in TEMPLATES){const el=document.getElementById('th-'+k);if(el)el.innerHTML=renderSVG(k,'t'+k);}
  const T=TEMPLATES[state.tpl];
  $('#now').innerHTML=state.mode==='coll'?`${COLLVIEWS[state.view].name} · Farbwelt <b>${T.name}</b> · ${FORMATS[state.fmt].label}`:`Vorlage <b>${T.name}</b> · ${FORMATS[state.fmt].label}`;
  summaries();
}
function summaries(){
  const set=(k,t)=>{const el=document.getElementById('sum-'+k);if(el)el.textContent=t;};const S=cur(),coll=state.mode==='coll';
  set('strecke',coll?`${COLL.runs.length} ${COLL.words.many} · ${num(COLL.dist/1000,0)} km`:`${sp(S).label} · ${num(S.dist/1000,1)} km · Privatzone ${state.privacy?state.privacy+' m':'aus'}`);
  set('vorlage',(coll?COLLVIEWS[state.view].name+' · ':'')+TEMPLATES[state.tpl].name+(state.colors[state.tpl]?' · eigene Farben':''));
  set('text',state.title||'ohne Titel');
  set('marks',state.marks.length?`${state.marks.length} gesetzt`:'keine');
  if(!coll)set('zahlen',`${(state.statsBy[S.sport]||[]).filter(k=>statOk(S,k)).length} gewählt · ${sp(S).label}`);
  const n=[state.color!=='none',state.echo&&!TEMPLATES[state.tpl].noEcho,state.km,state.ends,state.map,!!state.photo,state.rotAuto||state.rot!==0].filter(Boolean).length+state.graphs.length;
  set('elemente',`${n} aktiv`);
  set('format',`${FORMATS[state.fmt].label} · ${sizeList(state.fmt)[state.size].l}`);
  set('preset','speichern & laden');
}

/* ================= Oberfläche ================= */
const chipDefs=[];
function chipGroup(sel,items,type='checkbox',name=''){const box=$(sel);box.innerHTML='';
  items.forEach(it=>{const l=document.createElement('label');l.className='chip';l.innerHTML=`<input type="${type}" ${name?`name="${name}"`:''} id="${it.id}"><span>${esc(it.label)}</span>`;it.span=l.querySelector('span');
    const inp=l.querySelector('input');inp.onchange=()=>{it.set(inp.checked);syncChips();schedule(it.swap);};chipDefs.push({it,inp});box.appendChild(l);});}
function syncChips(){for(const{it,inp}of chipDefs){const ok=!it.ok||it.ok();inp.disabled=!ok;inp.checked=ok&&it.get();if(it.dyn)it.span.textContent=it.dyn();}}
function buildUI(){
  const g=$('#tplgrid');g.innerHTML='';
  for(const k in TEMPLATES){const T=TEMPLATES[k],b=document.createElement('button');b.type='button';b.className='tpl';b.id='tpl-'+k;
    b.innerHTML=`<span class="thumb" id="th-${k}"></span><span class="tpl-name">${T.name}</span><span class="tpl-blurb">${T.blurb}</span>`;
    b.onclick=()=>{if(state.tpl===k)return;state.tpl=k;if(state.mode==='single')Object.assign(state,structuredClone(T.defaults));syncAll();schedule(true);};
    g.appendChild(b);}
  const S=()=>cur(),single=()=>state.mode==='single';
  chipGroup('#viewchips',Object.keys(COLLVIEWS).map(k=>({id:'view-'+k,label:COLLVIEWS[k].name,get:()=>state.view===k,set:v=>{if(v)state.view=k;},swap:true})),'radio','view');
  const SL=()=>state.statsBy[RUN.sport]||(state.statsBy[RUN.sport]=SPORTS[RUN.sport].stats.slice());
  chipGroup('#sportchips',[['auto','Automatisch'],...Object.keys(SPORTS).map(k=>[k,SPORTS[k].label])].map(([k,l])=>({id:'sport-'+k,label:l,
    dyn:k==='auto'?()=>`Automatisch${RUN?' ('+SPORTS[RUN.sportAuto].label+')':''}`:null,get:()=>state.sportSel===k,set:v=>{if(v)setSport(k);},swap:true})),'radio','sport');
  chipGroup('#statchips',Object.keys(STATS).map(k=>({id:'st-'+k,label:STATS[k].label,dyn:()=>RUN?statLabel(RUN,k):STATS[k].label,get:()=>SL().includes(k),
    set:v=>{state.statsBy[RUN.sport]=Object.keys(STATS).filter(x=>x===k?v:SL().includes(x));},ok:()=>single()&&statOk(RUN,k)})));
  chipGroup('#elchips',[
    ['pace','Pace-Farben',()=>single()&&RUN.hasTime&&!TEMPLATES[state.tpl].noColor,()=>state.color==='pace',v=>{state.color=v?'pace':'none';},()=>RUN&&!isPace(RUN)?'Tempo-Farben':'Pace-Farben'],
    ['hrc','Puls-Farben',()=>single()&&RUN.hasHR&&!TEMPLATES[state.tpl].noColor,()=>state.color==='hr',v=>{state.color=v?'hr':'none';}],
    ['echo','Tempo-Echo',()=>single()&&!TEMPLATES[state.tpl].noEcho],
    ['km','Kilometermarken',single],['ends','Start & Ziel',single],
    ['map','Kartengrundlage',()=>single()?!TEMPLATES[state.tpl].noMap:state.view==='heat',null,v=>{state.map=v;if(v)loadMap();mapStatus();}]
  ].map(([k,l,ok,get,set,dyn])=>({id:'el-'+k,label:l,ok,dyn,get:get||(()=>state[k]),set:set||(v=>{state[k]=v;})})));
  const GL={pace:()=>RUN&&isPace(RUN)?'Pace-Kurve':'Tempo-Kurve',splits:()=>RUN&&seg(RUN).len===1000?'Km-Splits':`Abschnitte (${RUN?seg(RUN).name:'km'})`};
  chipGroup('#graphchips',GRAPHS.map(([k,l])=>({id:'gr-'+k,label:l,dyn:GL[k]||null,get:()=>state.graphs.includes(k),
    set:v=>{state.graphs=GRAPHS.map(x=>x[0]).filter(x=>x===k?v:state.graphs.includes(x));},ok:()=>single()&&graphOk(RUN,k)})));
  chipGroup('#fmtchips',Object.keys(FORMATS).map(k=>({id:'fmt-'+k,label:FORMATS[k].label,get:()=>state.fmt===k,set:v=>{if(v){state.fmt=k;state.size=FORMATS[k].def;fillSizes();}},swap:true})),'radio','fmt');
}
function fillSizes(){const sel=$('#size');sel.innerHTML=sizeList(state.fmt).map((s,i)=>`<option value="${i}">${esc(s.l)}${s.mm?' · 300 dpi':''}</option>`).join('');
  state.size=clamp(state.size,0,sizeList(state.fmt).length-1);sel.value=state.size;$('#pdfbtn').disabled=!sizeList(state.fmt)[state.size].mm;}
function syncAll(){
  const coll=state.mode==='coll';
  document.querySelectorAll('.single-only').forEach(e=>e.hidden=coll);document.querySelectorAll('.coll-only').forEach(e=>e.hidden=!coll);
  document.querySelectorAll('.tpl').forEach(x=>x.setAttribute('aria-pressed',x.id==='tpl-'+state.tpl));
  for(const k of ['title','sub','name','rank','bibno','offtime'])$('#'+k).value=state[k]||'';
  $('#privacy').value=state.privacy;$('#privacyval').textContent=state.privacy?state.privacy+' m':'aus';
  $('#rot').value=state.rot;$('#rotval').textContent=state.rotAuto?'auto':state.rot+'°';$('#rot').disabled=state.rotAuto;$('#rotauto').checked=state.rotAuto;
  const P=Object.assign({},TEMPLATES[state.tpl].pal,state.colors[state.tpl]||{});$('#col-bg').value=P.bg;$('#col-fg').value=P.fg;
  $('#col-fg-label').textContent=TEMPLATES[state.tpl].fgLabel;$('#col-reset').hidden=!state.colors[state.tpl];
  $('#photodel').hidden=!state.photo;
  fillSizes();syncChips();renderMarks();mapStatus();offHint();
}
function offHint(){const v=state.offtime.trim(),ok=!v||parseTime(v)!==null;$('#offtime').setAttribute('aria-invalid',!ok);
  $('#offhint').textContent=ok?'Die offizielle Zeit ersetzt die Zeit der Uhr in Zeit, Pace und Tempo.':'Bitte die Zeit als h:mm:ss oder mm:ss eingeben, z. B. 1:43:58.';}

/* ---- Markierungen ---- */
function renderMarks(){const ol=$('#marklist');ol.innerHTML='';
  state.marks.sort((a,b)=>a.d-b.d).forEach((mk,i)=>{const li=document.createElement('li');
    li.innerHTML=`<span class="mark-km">km ${num(mk.d/1000,1)}</span><input type="text" id="mark-${i}" maxlength="34" value="${esc(mk.text)}" aria-label="Text der Markierung bei km ${num(mk.d/1000,1)}"><button type="button" class="linkbtn" aria-label="Markierung löschen">Löschen</button>`;
    li.querySelector('input').oninput=e=>{mk.text=e.target.value;schedule();};
    li.querySelector('button').onclick=()=>{state.marks.splice(state.marks.indexOf(mk),1);renderMarks();schedule();};ol.appendChild(li);});}
function setMarkMode(v){markMode=v;$('#markmode').setAttribute('aria-pressed',v);$('#markmode span').textContent=v?'Klicke auf die Strecke …':'Markierung setzen';$('#poster').classList.toggle('marking',v);}
$('#markmode').onclick=()=>setMarkMode(!markMode);
$('#poster').addEventListener('click',e=>{if(!markMode||!HIT||state.mode!=='single')return;const svg=$('#poster svg');if(!svg)return;
  const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse());
  let best=-1,bd=Infinity;HIT.pts.forEach(([x,y],k)=>{const dd=Math.hypot(x-p.x,y-p.y);if(dd<bd){bd=dd;best=k;}});
  if(bd>45){toast('Klicke näher an die Strecke.');return;}
  state.marks.push({d:RUN.d[HIT.a+best],text:'Markierung'});setMarkMode(false);renderMarks();schedule();
  const i=state.marks.sort((a,b)=>a.d-b.d).findIndex(m=>m.d===RUN.d[HIT.a+best]),inp=$('#mark-'+i);if(inp){$('#sec-marks').open=true;inp.focus();inp.select();}});

/* ---- Laden ---- */
function setRun(S,keepTitle){RUN=S;state.mode='single';S.sport=state.sportSel==='auto'?S.sportAuto:state.sportSel;if(!keepTitle){state.title=autoTitle(S);state.titleAuto=true;}
  if(state.color==='hr'&&!S.hasHR)state.color=S.hasTime?'pace':'none';
  $('#runchip').innerHTML=`<span>${S.start?esc(S.start.toLocaleDateString('de-DE')):''}${S.start?' · ':''}${num(S.dist/1000,2)} km${S.hasTime?' · '+dur(S.durationRaw):''}</span>`;
  syncAll();if(state.map)loadMap();schedule(true);}
function setColl(){state.mode='coll';state.title=COLL.title;HIT=null;setMarkMode(false);
  $('#runchip').innerHTML=`<span>${COLL.runs.length} ${COLL.words.many} · ${num(COLL.dist/1000,0)} km</span>`;syncAll();if(state.map&&state.view==='heat')loadMap();schedule(true);}
function setSport(k){state.sportSel=k;if(!RUN)return;RUN.sport=k==='auto'?RUN.sportAuto:k;if(state.titleAuto){state.title=autoTitle(RUN);}if(state.color==='pace'&&!RUN.hasTime)state.color='none';syncAll();}
const libWords=()=>{const s=[...new Set(LIB.map(S=>S.sportAuto))];return s.length===1?SPORTS[s[0]]:MIXED;};
function newRunState(){state.sportSel='auto';state.marks=[];state.rank='';state.bibno='';state.offtime='';state.rot=0;state.photo=null;}
/* Alle geladenen Läufe bleiben in einer Liste; neue Dateien kommen dazu. */
let LIB=[],COLLKEY='all';
const runKey=S=>`${S.fileName}|${S.start?S.start.getTime():''}|${Math.round(S.dist)}`;
const runLabel=S=>`${new Set(LIB.map(x=>x.sportAuto)).size>1?SPORTS[S.sportAuto].label+' · ':''}${S.start?S.start.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'})+' · ':''}${S.fileName.replace(/\.gpx$/i,'')} · ${num(S.dist/1000,1)} km`;
function collFor(key){const runs=key==='all'?LIB.slice():LIB.filter(S=>S.start&&S.start.getFullYear()===+key);runs.forEach(S=>S.sport=S.sportAuto);return runs.length>1?buildCollection(runs):null;}
function fillRunPick(sel){const el=$('#runpick'),years={};
  LIB.forEach(S=>{if(S.start){const y=S.start.getFullYear();years[y]=(years[y]||0)+1;}});
  const ys=Object.keys(years).filter(y=>years[y]>1).sort();
  let html='';
  const w=libWords();
  if(LIB.length>1){html+=`<optgroup label="Jahresposter"><option value="coll:all">Alle ${LIB.length} ${w.many}</option>`;
    if(ys.length>1||(ys.length===1&&years[ys[0]]<LIB.length))html+=ys.map(y=>`<option value="coll:${y}">${w.year} ${y} · ${years[y]} ${w.many}</option>`).join('');html+='</optgroup>';}
  html+=`<optgroup label="Einzeln">`+LIB.map((S,i)=>`<option value="run:${i}">${esc(runLabel(S))}</option>`).join('')+'</optgroup>';
  el.innerHTML=html;el.value=sel;$('#runpickwrap').hidden=LIB.length<2;
  $('#rundel').hidden=LIB.length<2||!String(sel).startsWith('run:');
  $('#fileline').innerHTML=LIB.length===1?`Geladen: <strong>${esc(LIB[0].fileName)}</strong> · ${LIB[0].points.toLocaleString('de-DE')} Punkte`+(LIB[0].hasTime?'':' · ohne Zeitstempel')+(LIB[0].hasHR?' · mit Puls':'')
    :`<strong>${LIB.length} ${w.many}</strong> in der Liste · ${num(LIB.reduce((a,S)=>a+S.dist,0)/1000,0)} km`;}
function showRun(S){newRunState();fillRunPick('run:'+LIB.indexOf(S));setRun(S);}
function showColl(key){const G=collFor(key);if(!G){showRun(LIB[LIB.length-1]);return;}COLL=G;COLLKEY=key;newRunState();RUN=G.runs[G.runs.length-1];fillRunPick('coll:'+key);setColl();}
async function readFiles(files){
  files=[...files];const json=files.find(f=>/\.json$/i.test(f.name));if(json){await loadPresetFile(json);files=files.filter(f=>f!==json);}
  const gpx=files.filter(f=>/\.gpx$/i.test(f.name)||/xml/.test(f.type));if(!gpx.length){if(!json)toast('Bitte GPX-Dateien wählen.');return;}
  const runs=[],errs=[];if(gpx.length>3)toast(`${gpx.length} Dateien werden gelesen …`);
  for(const f of gpx){try{runs.push(analyze(parseGPX(await f.text(),f.name)));}catch(e){errs.push(f.name);}}
  if(!runs.length){toast(errs.length===1?`${errs[0]} konnte nicht gelesen werden. Ist es eine GPX-Datei?`:'Keine der Dateien konnte gelesen werden.');return;}
  LIB=LIB.filter(S=>!S.isSample);
  let dup=0;const added=[];
  for(const S of runs){const k=runKey(S),old=LIB.find(x=>runKey(x)===k);if(old){dup++;added.push(old);}else{LIB.push(S);added.push(S);}}
  LIB.sort((x,y)=>(x.start?x.start.getTime():Infinity)-(y.start?y.start.getTime():Infinity));
  if(runs.length===1)showRun(added[0]);else showColl('all');
  const msg=[];if(dup)msg.push(`${dup} davon war(en) schon in der Liste`);if(errs.length)msg.push(`${errs.length} Datei(en) nicht lesbar: ${errs.slice(0,3).join(', ')}`);
  toast(msg.length?msg.join(' · '):runs.length===1?(LIB.length>1?`Hinzugefügt · ${LIB.length} ${libWords().many} in der Liste`:'Neue Strecke geladen.'):`${runs.length} ${libWords().many} hinzugefügt`);
}
$('#runpick').onchange=e=>{const[t,v]=e.target.value.split(':');if(t==='coll')showColl(v);else showRun(LIB[+v]);};
$('#rundel').onclick=()=>{const i=LIB.indexOf(RUN);if(i<0||LIB.length<2)return;LIB.splice(i,1);toast('Aus der Liste entfernt.');showRun(LIB[Math.min(i,LIB.length-1)]);};

/* ---- Karte ---- */
async function loadMap(){
  const S=cur();if(!S||S.mapState==='loading'||S.mapState==='ok')return;
  S.mapState='loading';mapStatus();
  try{const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),110000);
    const res=await fetch(OVERPASS,{method:'POST',body:'data='+encodeURIComponent(mapQuery(S)),headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:ctl.signal});
    clearTimeout(to);if(!res.ok){S.mapError=res.status===429||res.status===504?'busy':'http';throw 0;}
    const j=await res.json();S.map=processOSM(j,S);S.mapState='ok';}
  catch(e){S.mapState='error';}
  if(S===cur()){mapStatus();schedule();}
}
function mapStatus(){const el=$('#mapstatus'),S=cur();if(!el||!S)return;const st=S.mapState;el.hidden=!state.map&&st!=='error';
  el.dataset.state=st;
  if(st==='loading')el.innerHTML='Karte wird aus OpenStreetMap geladen … Das kann bei langen Strecken bis zu einer Minute dauern.';
  else if(st==='ok')el.innerHTML=`Karte geladen: ${S.map.count.toLocaleString('de-DE')} Elemente · Daten © OpenStreetMap-Mitwirkende`;
  else if(st==='error'){el.innerHTML=(S.mapError==='busy'?'Der Kartenserver ist gerade ausgelastet. ':'Die Karte konnte nicht geladen werden. In der Claude-Vorschau sind externe Daten gesperrt; öffne das Tool über GitHub Pages oder als lokale Datei. ')+
    '<button type="button" class="linkbtn" id="mapretry">Erneut versuchen</button>';
    $('#mapretry').onclick=()=>{S.mapState='idle';S.mapError=null;loadMap();};}
  else el.innerHTML=state.mode==='coll'&&state.view!=='heat'?'Die Karte gibt es im Jahresposter nur in der Heatmap.':'Für die Karte wird nur der Kartenausschnitt an den OpenStreetMap-Dienst Overpass geschickt, nicht deine Strecke.';
}

/* ---- Foto ---- */
$('#photo').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const url=URL.createObjectURL(f),img=new Image();img.src=url;await img.decode();const k=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
    const cv=document.createElement('canvas');cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
    state.photo={url:cv.toDataURL('image/jpeg',0.86)};syncAll();schedule();toast('Foto eingefügt.');}
  catch(err){toast('Das Bild konnte nicht gelesen werden. Versuche ein JPG oder PNG.');}};
$('#photodel').onclick=()=>{state.photo=null;syncAll();schedule();};

/* ---- Farben ---- */
function setColor(key,v){const k=state.tpl,c=Object.assign({},state.colors[k]);c[key]=v;if(c[key]===TEMPLATES[k].pal[key])delete c[key];
  if(c.bg||c.fg)state.colors[k]=c;else delete state.colors[k];$('#col-reset').hidden=!state.colors[k];schedule();}
$('#col-bg').oninput=e=>setColor('bg',e.target.value.toUpperCase());
$('#col-fg').oninput=e=>setColor('fg',e.target.value.toUpperCase());
$('#col-reset').onclick=()=>{delete state.colors[state.tpl];syncAll();schedule();};

/* ---- Einstellungen als Datei ---- */
$('#presetsave').onclick=()=>saveFile('spurwerk-einstellungen.json',new Blob([JSON.stringify({app:'Spurwerk',version:1,einstellungen:presetOf()},null,2)],{type:'application/json'}));
async function loadPresetFile(f){try{const j=JSON.parse(await f.text()),p=cleanPreset(j&&j.einstellungen);
    if(!Object.keys(p).length)throw 0;Object.assign(state,p);syncAll();schedule(true);toast('Einstellungen geladen.');}
  catch(e){toast(`${f.name} ist keine Spurwerk-Einstellungsdatei.`);}}
$('#presetfile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)loadPresetFile(f);};
$('#presetreset').onclick=()=>{Object.assign(state,structuredClone(DEFAULTS));syncAll();schedule(true);toast('Einstellungen zurückgesetzt.');};

/* ================= Export ================= */
let dlPromise=null;
function downloadsCap(){if(!dlPromise)dlPromise=(window.claude&&window.claude.use)?window.claude.use('downloads').catch(()=>null):Promise.resolve(null);return dlPromise;}
downloadsCap();
async function saveFile(name,blob){
  const dl=await downloadsCap();
  if(dl){try{await dl.save({filename:name,data:blob});toast('Gespeichert: '+name);}
    catch(e){const c=e&&e.code;toast(c==='declined'?'Speichern abgebrochen.':c==='rate_limited'?'Es ist schon ein Speichern-Dialog offen. Bitte kurz warten.':'Speichern ist in dieser Ansicht nicht möglich.');}
    return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);toast('Gespeichert: '+name);
}
function baseName(){const S=cur(),d=state.mode==='coll'?'jahr':(S.start?S.start.toISOString().slice(0,10):'lauf');return `spurwerk-${d}-${state.tpl}`;}
async function rasterize(svgStr,w,h){const url=URL.createObjectURL(new Blob([svgStr],{type:'image/svg+xml'}));
  try{const img=new Image();img.src=url;await img.decode();const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);return cv;}finally{URL.revokeObjectURL(url);}}
async function busy(btn,fn){btn.disabled=true;try{await fn();}finally{btn.disabled=false;}}
$('#svgbtn').onclick=()=>{const sz=sizeList(state.fmt)[state.size];saveFile(baseName()+'.svg',new Blob([renderSVG(state.tpl,'x',{mm:sz.mm})],{type:'image/svg+xml'}));};
$('#pngbtn').onclick=()=>busy($('#pngbtn'),async()=>{toast('PNG wird berechnet …');
  try{const sz=sizeList(state.fmt)[state.size],w=sz.px||Math.round(sz.mm[0]/25.4*300),h=Math.round(w*FORMATS[state.fmt].h/1000);
    const cv=await rasterize(renderSVG(state.tpl,'x',{}),w,h),blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(!blob)throw 0;await saveFile(baseName()+'.png',blob);}
  catch(e){toast('Das PNG konnte nicht erzeugt werden. Versuche eine kleinere Größe.');}});
let jspdfP=null;
function loadJsPDF(){if(window.jspdf)return Promise.resolve(window.jspdf);
  if(!jspdfP)jspdfP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload=()=>res(window.jspdf);s.onerror=()=>{jspdfP=null;rej(new Error('jspdf'));};document.head.appendChild(s);});return jspdfP;}
$('#pdfbtn').onclick=()=>busy($('#pdfbtn'),async()=>{const sz=sizeList(state.fmt)[state.size];if(!sz.mm)return;toast('Druck-PDF wird berechnet …');
  try{const lib=await loadJsPDF(),B=3,mw=sz.mm[0]+2*B,mh=sz.mm[1]+2*B,bleed=B/sz.mm[0]*1000;
    const w=Math.round(mw/25.4*300),h=Math.round(mh/25.4*300),cv=await rasterize(renderSVG(state.tpl,'x',{bleed}),w,h);
    const doc=new lib.jsPDF({unit:'mm',format:[mw,mh],orientation:mw>mh?'l':'p',compress:true});
    doc.addImage(cv.toDataURL('image/jpeg',0.92),'JPEG',0,0,mw,mh);
    doc.setProperties({title:`Spurwerk · ${state.title}`,subject:`Endformat ${sz.mm[0]} × ${sz.mm[1]} mm, 3 mm Beschnitt rundum`});
    await saveFile(`${baseName()}-${sz.mm[0]}x${sz.mm[1]}mm-beschnitt.pdf`,doc.output('blob'));}
  catch(e){toast(e&&e.message==='jspdf'?'Die PDF-Bibliothek konnte nicht geladen werden. Ist das Gerät online?':'Das PDF konnte nicht erzeugt werden. Versuche eine kleinere Größe.');}});
$('#size').onchange=e=>{state.size=+e.target.value;fillSizes();schedule();};

let tt;function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3600);}

/* ================= Eingaben ================= */
for(const k of ['title','sub','name','rank','bibno','offtime'])$('#'+k).oninput=e=>{state[k]=e.target.value;if(k==='title')state.titleAuto=false;if(k==='offtime')offHint();if(k==='rank'||k==='bibno')syncChips();schedule();};
$('#privacy').oninput=e=>{state.privacy=+e.target.value;$('#privacyval').textContent=state.privacy?state.privacy+' m':'aus';schedule();};
$('#rot').oninput=e=>{state.rot=+e.target.value;$('#rotval').textContent=state.rot+'°';schedule();};
$('#rotauto').onchange=e=>{state.rotAuto=e.target.checked;syncAll();schedule();};
$('#gpx').onchange=e=>{readFiles(e.target.files);e.target.value='';};
const stage=$('#stage');
['dragenter','dragover'].forEach(ev=>document.addEventListener(ev,e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){e.preventDefault();stage.classList.add('drag');}}));
['dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{if(ev==='dragleave'&&e.relatedTarget)return;stage.classList.remove('drag');}));
document.addEventListener('drop',e=>{if(e.dataTransfer&&e.dataTransfer.files.length){e.preventDefault();readFiles(e.dataTransfer.files);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&markMode)setMarkMode(false);});

(async()=>{
  try{await Promise.all(['900 italic 100px Anybody','900 100px Anybody','700 16px "Chivo Mono"','600 16px "Hanken Grotesk"'].map(f=>document.fonts.load(f)));}catch(e){}
  mcache.clear();buildUI();const S=analyze(decodeSample(SAMPLE));
  S.isSample=true;LIB=[S];fillRunPick('run:0');setRun(S);
})();
