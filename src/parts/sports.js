/* ================= Sportarten =================
   Jede Sportart legt fest, wie Tempo angezeigt wird, wie weit Marken und Abschnitte auseinanderliegen
   und welche Titel und Wörter passen. */
const SPORTS={
  run:{label:'Laufen',one:'Lauf',many:'Läufe',year:'Laufjahr',longest:'Längster Lauf',stats:['dist','time','pace','climb'],
    segLen:()=>1000,marks:S=>S.dist>60000?[5000,10000]:[1000,5000]},
  bike:{label:'Radfahren',one:'Fahrt',many:'Fahrten',year:'Radjahr',longest:'Längste Fahrt',stats:['dist','time','pace','climb','maxspeed'],
    segLen:S=>S.dist>100000?10000:5000,marks:S=>S.dist>150000?[10000,50000]:[5000,10000]},
  hike:{label:'Wandern',one:'Wanderung',many:'Wanderungen',year:'Wanderjahr',longest:'Längste Wanderung',stats:['dist','time','climb','top'],
    segLen:()=>1000,marks:S=>S.dist>30000?[5000,10000]:[1000,5000]},
};
const MIXED={one:'Aktivität',many:'Aktivitäten',year:'Sportjahr',longest:'Längste Aktivität'};
const sp=S=>SPORTS[S.sport]||SPORTS.run;
function detectSport(type,S){const t=(type||'').toLowerCase();
  if(/(rad|cycl|bik|ride|velo|fahrrad)/.test(t))return 'bike';
  if(/(wander|hik|walk|geh|trek)/.test(t))return 'hike';
  if(/(lauf|run|jog)/.test(t))return 'run';
  if(!S.hasTime||!isFinite(S.duration))return 'run';
  const kmh=S.dist/S.duration*3.6;return kmh>=14?'bike':kmh<=7.2?'hike':'run';}
/* Tempo-Angabe: beim Laufen als Pace (min/km), sonst in km/h */
const isPace=S=>S.sport==='run';
const fmtV=(S,v)=>isPace(S)?[pace(1000/v),'/km']:[num(v*3.6,1),'km/h'];
const fmtVs=(S,v)=>fmtV(S,v).join(' ');
/* Abschnitte (Splits) je nach Sportart: 1 km, 5 km oder 10 km */
function seg(S){const len=sp(S).segLen(S);S._seg=S._seg||{};if(S._seg[len])return S._seg[len];
  const idx=[],times=[];let prevT=0;
  for(let k=1;k*len<=S.dist+0.01;k++){const target=k*len;let i=Math.max(1,idxAt(S.d,target));idx.push(i);
    if(S.hasTime){const t=S.t,f=(target-S.d[i-1])/((S.d[i]-S.d[i-1])||1),tk=t[i-1]+(t[i]-t[i-1])*clamp(f,0,1);times.push(tk-prevT);prevT=tk;}}
  let best=Infinity,bestK=-1;times.forEach((s,i)=>{if(s<best){best=s;bestK=i+1;}});
  const name=len===1000?'km':`${len/1000} km`;
  return S._seg[len]={len,idx,times,best,bestK,name,label:k=>len===1000?`km ${k}`:`km ${(k-1)*len/1000}–${k*len/1000}`};}
/* Kilometermarken: kleine Punkte und beschriftete Marken */
function markers(S){const[step,big]=sp(S).marks(S),out=[];
  for(let k=1;k*step<=S.dist+0.01;k++){const i=Math.max(1,idxAt(S.d,k*step));out.push({i,km:k*step/1000,big:(k*step)%big===0});}return out;}
