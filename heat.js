/* MOFIT Live Muscle Heat: the client's own body coloured by the sets they actually logged this week.
   Real logged sets only, straight from set_logs. Nothing estimated, nothing invented.
   Reuses the app's muscle map (anatomySVG) and its muscleOf() name mapping. */
(function(){
if(window.__mofitHeat) return; window.__mofitHeat=1;

const BAND=[10,20]; /* evidence band: sets per muscle per week */
const col=m=>(typeof mColor==="function")?mColor(m):"#64748B";
function stateOf(n){
  if(!n) return {k:"off", t:"مش اشتغلت"};
  if(n<5) return {k:"low", t:"خفيف"};
  if(n<BAND[0]) return {k:"mid", t:"ناقص شوية"};
  if(n<=BAND[1]) return {k:"ok", t:"داخل النطاق"};
  return {k:"hi", t:"أكتر من النطاق"};
}
function isLogged(l){ return l && (l.reps!=null || l.weight!=null); }

function volFor(program, logs, week){
  const byId={}; (program||[]).forEach(e=>byId[e.id]=e);
  const v={};
  (logs||[]).forEach(l=>{
    if(l.week!==week||!isLogged(l)) return;
    const ex=byId[l.exercise_id]; if(!ex) return;
    const m=(typeof muscleOf==="function")?muscleOf(ex.name):"أخرى";
    if(m==="أخرى") return;
    v[m]=(v[m]||0)+1;
  });
  return v;
}
const total=v=>Object.values(v).reduce((a,b)=>a+b,0);

function bodyHTML(cur, prev){
  const vol=cur.vol, pv=prev.vol;
  const names=Object.keys(vol).sort((a,b)=>vol[b]-vol[a]);
  const totC=total(vol), totP=total(pv);
  if(!totC){
    return `<div class="heat-empty"><div class="heat-e-ic">🫥</div><p>لسه مفيش مجموعات مسجلة الأسبوع ده. أول ما تسجل تمرينك، جسمك هنا بيتلوّن لوحده.</p>${totP?`<small>الأسبوع اللي فات سجلت ${totP} مجموعة.</small>`:""}</div>`;
  }
  const legend=names.map(m=>{
    const n=vol[m], s=stateOf(n), d=n-(pv[m]||0);
    return `<div class="heat-r"><i style="background:${col(m)}"></i><span>${m}</span><b class="num">${n}</b><em class="heat-st ${s.k}">${s.t}</em>${d?`<small class="${d>0?"up":"dn"}">${d>0?"▲":"▼"}${Math.abs(d)}</small>`:`<small></small>`}</div>`;
  }).join("");
  return `<div class="heat-wrap">
    <div class="heat-map">${anatomySVG(vol,{dark:true})}</div>
    <div class="heat-side">
      <div class="heat-tot"><b class="num">${totC}</b><span>مجموعة مسجلة الأسبوع ده</span>${totP?`<em class="${totC>=totP?"up":"dn"}">${totC>=totP?"▲":"▼"} ${Math.abs(totC-totP)} عن الأسبوع اللي فات</em>`:""}</div>
      <div class="heat-legend">${legend}</div>
      <p class="heat-ref">النطاق العلمي 10-20 مجموعة للعضلة في الأسبوع، وده اللي الألوان بتقيسه.</p>
    </div></div>`;
}

function cardHTML(){
  return `<div class="card mheat" id="heatCard"><div class="card-h"><div class="ic acc">🔥</div><h2>خريطة الحرارة<small>من مجموعاتك المسجلة – الأسبوع ده</small></h2></div><div id="heatBody"><p class="hint">بنحسب من سجلك…</p></div></div>`;
}

async function fill(clientId){
  const box=document.getElementById("heatBody");
  if(!box||typeof sb==="undefined") return;
  const wk=+(typeof currentWeek==="function"?currentWeek(S.client):S.week)||+S.week||1;
  const weeks=[wk, wk-1].filter(w=>w>=1);
  try{
    const { data, error } = await sb.from("set_logs").select("exercise_id,week,set_no,reps,weight").eq("client_id",clientId).in("week",weeks);
    if(error) throw error;
    const logs=data||[];
    const cur={vol:volFor(S.program,logs,wk)}, prev={vol:volFor(S.program,logs,wk-1)};
    box.innerHTML=bodyHTML(cur,prev);
  }catch(e){
    box.innerHTML=`<p class="hint">مقدرناش نقرأ سجلك دلوقتي. جرّب تحديث الصفحة.</p>`;
  }
}
window.mofitHeat={cardHTML, fill, volFor, stateOf};
})();
