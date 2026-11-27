/* ======================================================================
   MOFIT attract tools (landing page, no login needed):
   1) free calculators (calories, protein, 1RM)
   2) tappable muscle map that lists the exercises for that muscle
   3) count-up numbers on the hero
   Everything is computed in the browser from what the visitor types.
   Formulas: Mifflin-St Jeor (BMR), protein 1.6-2.2 g/kg, Epley (1RM).
   ====================================================================== */
(function(){
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const num=v=>isFinite(v)?Math.round(v).toLocaleString("en-US"):"—";

/* ---------- 1) calculators ---------- */
function calcCards(){
  return `<div class="at-calc">
  <div class="at-card">
    <div class="at-h"><span class="at-ic">🔥</span><b>سعراتك اليومية</b></div>
    <div class="at-row"><label>الوزن (كجم)<input id="atW" type="number" inputmode="decimal" min="30" max="250" value="80"></label>
      <label>الطول (سم)<input id="atH" type="number" inputmode="numeric" min="120" max="220" value="175"></label></div>
    <div class="at-row"><label>السن<input id="atA" type="number" inputmode="numeric" min="14" max="80" value="28"></label>
      <label>النوع<select id="atS"><option value="m">راجل</option><option value="f">ست</option></select></label></div>
    <label class="at-full">نشاطك في اليوم
      <select id="atAct"><option value="1.2">قاعد معظم اليوم</option><option value="1.375" selected>بتحرك شوية</option><option value="1.55">بتمرن 3-5 أيام</option><option value="1.725">بتمرن 6-7 أيام</option></select></label>
    <div class="at-out" id="atKcal"></div>
  </div>
  <div class="at-card">
    <div class="at-h"><span class="at-ic">🥩</span><b>بروتينك في اليوم</b></div>
    <label class="at-full">وزنك (كجم)<input id="atPW" type="number" inputmode="decimal" min="30" max="250" value="80"></label>
    <div class="at-out" id="atProt"></div>
  </div>
  <div class="at-card">
    <div class="at-h"><span class="at-ic">🏋️</span><b>أقصى وزن لمرة واحدة (1RM)</b></div>
    <div class="at-row"><label>الوزن اللي رفعته (كجم)<input id="atRMw" type="number" inputmode="decimal" min="1" max="400" value="80"></label>
      <label>عدد التكرارات<input id="atRMr" type="number" inputmode="numeric" min="1" max="20" value="8"></label></div>
    <div class="at-out" id="atRM"></div>
  </div>
  </div>`;
}
function val(id){const el=document.getElementById(id);return el?el.value:"";}
function out(id,html){const el=document.getElementById(id);if(el)el.innerHTML=html;}
function kcal(){
  const w=+val("atW"),h=+val("atH"),a=+val("atA"),s=val("atS"),act=+val("atAct")||1.375;
  if(!(w>0&&h>0&&a>0)) return;
  const bmr=10*w+6.25*h-5*a+(s==="m"?5:-161);
  const tdee=bmr*act, cut=tdee*0.8, bulk=tdee*1.1;
  out("atKcal",`<div class="at-big"><b>${num(tdee)}</b><span>سعر/يوم عشان وزنك يثبت</span></div>
  <div class="at-mini"><div><b>${num(cut)}</b><span>تنشيف (−20%)</span></div><div><b>${num(bulk)}</b><span>تضخيم (+10%)</span></div><div><b>${num(bmr)}</b><span>جسمك بيرن في الراحة</span></div></div>
  <p class="at-note">محسوبة بمعادلة Mifflin-St Jeor ونسبة النشاط اللي اخترتها. جرّب الرقم وتابع وزنك أسبوعين وعدّل.</p>`);
}
function prot(){
  const w=+val("atPW"); if(!(w>0)) return;
  const lo=w*1.6, hi=w*2.2;
  out("atProt",`<div class="at-big"><b>${num(lo)}–${num(hi)}</b><span>جرام بروتين في اليوم</span></div>
  <div class="at-mini"><div><b>${num(lo/4)}–${num(hi/4)}</b><span>جرام في كل وجبة (4 وجبات)</span></div><div><b>${num(hi)}</b><span>الحد الأعلى اللي بيساعدك تحافظ على عضلاتك في التنشيف</span></div></div>
  <p class="at-note">النطاق العلمي 1.6–2.2 جرام لكل كيلو من وزنك. الأعلى مش أحسن دايماً، بس في التنشيف بيساعد.</p>`);
}
function rm(){
  const w=+val("atRMw"),r=+val("atRMr"); if(!(w>0&&r>0)) return;
  const one=w*(1+r/30);
  const pct=[95,90,85,80,75,70].map(p=>`<div><b>${num(one*p/100)}</b><span>${p}%</span></div>`).join("");
  out("atRM",`<div class="at-big"><b>${num(one)}</b><span>كجم لأقصى تكرار واحد</span></div><div class="at-mini">${pct}</div>
  <p class="at-note">تقدير بمعادلة Epley، تقريبي (±5%) وبيتظبط لما تسجل أوزانك في التطبيق.</p>`);
}

/* ---------- 2) muscle map ---------- */
/* Each group: the Arabic label anatomySVG uses, a chip label, and the exercise-name test. Order matters. */
const GROUPS=[
  {ar:"سمانة",chip:"سمانة",re:/CALF/i},
  {ar:"خلفية/أرداف",chip:"خلفية وأرداف",re:/DEADLIFT|RDL|HIP THRUST|GLUTE|LEG CURL|HIP EXTENSION|PULL-THROUGH|GOOD MORNING|ROMANIAN/i},
  {ar:"أمامية",chip:"أمامية (كواتس)",re:/SQUAT|LEG PRESS|LUNGE|HACK|STEP-UP|LEG EXTENSION|SPLIT/i},
  {ar:"صدر",chip:"صدر",re:/PEC|FLY|CROSSOVER|CHEST|BENCH|PUSH-UP|DIP/i},
  {ar:"ضهر",chip:"ضهر",re:/ROW|PULLDOWN|PULL-UP|LAT|CHIN|SHRUG|HYPEREXTENSION|PULL-OVER|FACE PULL|REAR DELT/i},
  {ar:"أكتاف",chip:"أكتاف",re:/SHOULDER|MILITARY|RAISE|ARNOLD|OVERHEAD|UPRIGHT|BEHIND THE NECK/i},
  {ar:"باي",chip:"باي",re:/CURL|BICEPS/i},
  {ar:"تراي",chip:"تراي",re:/TRICEP|SKULL|PUSHDOWN|CLOSE-GRIP|KICKBACK|DIP/i},
  {ar:"بطن",chip:"بطن",re:/CRUNCH|PLANK|SIT-UP|LEG RAISE|ROLLOUT|HANGING|AB WHEEL|KNEE RAISE/i}
];
function exercisesFor(g){
  const db=window.EXDB||{}; const keys=Object.keys(db);
  return keys.filter(k=>g.re.test(k)).slice(0,10);
}
function mapBody(){
  return `<div class="at-map">
    <div class="at-fig" id="atFig"></div>
    <div class="at-mapside">
      <div class="at-chips" id="atChips" role="group" aria-label="اختار العضلة">${GROUPS.map((g,i)=>`<button type="button" class="at-chip${i===0?" on":""}" data-g="${i}">${esc(g.chip)}</button>`).join("")}</div>
      <div class="at-exlist" id="atExList"></div>
    </div>
  </div>`;
}
function paintMap(idx){
  const g=GROUPS[idx]||GROUPS[0];
  const vol={}; vol[g.ar]=3;
  const fig=document.getElementById("atFig");
  if(fig&&window.anatomySVG) fig.innerHTML=window.anatomySVG(vol,{dark:true});
  const list=document.getElementById("atExList");
  const items=exercisesFor(g);
  if(list) list.innerHTML=items.length
    ? `<div class="at-exh">تمارين ${esc(g.chip)} · دوس على أي تمرين تشوف صورته وطريقة أدائه</div>${items.map(n=>`<button type="button" class="at-ex" data-ex="${esc(n)}"><span>${esc(n)}</span><i>👀</i></button>`).join("")}`
    : `<div class="at-exh">التمارين دي هتظهر هنا.</div>`;
}

/* ---------- 3) count-up numbers ---------- */
function countUp(el){
  const to=+el.dataset.count||0, dur=1100, t0=performance.now();
  const step=t=>{const p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,3); el.textContent=Math.round(to*e).toLocaleString("en-US"); if(p<1) requestAnimationFrame(step);};
  requestAnimationFrame(step);
}
function armCounters(root){
  const els=[...(root||document).querySelectorAll("[data-count]")];
  if(!els.length) return;
  if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion: reduce)").matches){ els.forEach(e=>e.textContent=(+e.dataset.count||0).toLocaleString("en-US")); return; }
  const io=new IntersectionObserver(es=>{es.forEach(en=>{ if(en.isIntersecting){ countUp(en.target); io.unobserve(en.target); } });},{threshold:.35});
  els.forEach(e=>io.observe(e));
}

/* ---------- wiring ---------- */
function bind(root){
  if(!root) return;
  const on=(id,fn)=>{const el=document.getElementById(id); if(el&&!el.dataset.on){el.dataset.on=1; el.addEventListener("input",fn); el.addEventListener("change",fn);} };
  on("atW",kcal); on("atH",kcal); on("atA",kcal); on("atS",kcal); on("atAct",kcal);
  on("atPW",prot); on("atRMw",rm); on("atRMr",rm);
  kcal(); prot(); rm();
  const chips=root.querySelectorAll(".at-chip");
  chips.forEach(c=>c.addEventListener("click",()=>{
    chips.forEach(x=>x.classList.remove("on")); c.classList.add("on");
    paintMap(+c.dataset.g);
  }));
  paintMap(0);
  root.addEventListener("click",e=>{
    const b=e.target.closest&&e.target.closest(".at-ex");
    if(!b) return;
    const name=b.dataset.ex;
    if(window.mofitExdb&&window.mofitExdb.open) window.mofitExdb.open(name);
  });
  armCounters(root);
}
window.mofitAttract={
  cards:calcCards, map:mapBody, bind, armCounters,
  enhance(root){ bind(root); }
};
})();
