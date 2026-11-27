/* MOFIT Body Scan Intro: the visitor enters height, weight, age and goal, a scan line sweeps a body,
   then a short report card appears with calories, protein, water and training focus.
   The card can be shared as a 1080x1920 image for stories. All numbers are computed locally.
   Formulas: Mifflin-St Jeor (BMR), protein 1.6-2.2 g/kg, water 35 ml/kg. */
(function(){
if(window.__mofitBodyScan) return; window.__mofitBodyScan=1;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R=v=>Math.round(v);

const GOALS=[
  {k:"cut",  t:"تنشيف وخسارة وزن", focus:"3-4 أيام حديد + 8-10 آلاف خطوة، وعجز 20% في السعرات", kcal:.8,  prot:[2.0,2.2]},
  {k:"bulk", t:"تضخيم وبناء عضل",  focus:"4-5 أيام حديد، وفائض 10% في السعرات",                 kcal:1.1, prot:[1.6,2.0]},
  {k:"fit",  t:"لياقة وشد الجسم",  focus:"3 أيام فُل بودي + مشي يومي، وسعرات وزنك الثابت",        kcal:1.0, prot:[1.6,2.0]}
];

function markup(){
  return `<div class="bs-wrap" id="bsWrap">
  <form class="bs-form" id="bsForm" novalidate>
    <div class="bs-row"><label>الطول (سم)<input id="bsH" type="number" inputmode="numeric" min="120" max="220" value="175"></label>
      <label>الوزن (كجم)<input id="bsW" type="number" inputmode="decimal" min="30" max="250" value="80"></label></div>
    <div class="bs-row"><label>السن<input id="bsA" type="number" inputmode="numeric" min="14" max="80" value="28"></label>
      <label>النوع<select id="bsS"><option value="m">راجل</option><option value="f">ست</option></select></label></div>
    <div class="bs-full">هدفك<div class="bs-goals" id="bsGoals" role="group" aria-label="هدفك">${GOALS.map((g,i)=>`<button type="button" class="bs-goal${i===0?" on":""}" data-g="${g.k}">${esc(g.t)}</button>`).join("")}</div></div>
    <button class="bs-btn" type="submit">اعمل سكان لجسمك</button>
    <p class="bs-note">الأرقام بتتحسب من طولك ووزنك وسنك. مش تشخيص ومش بديل عن متابعة الكوتش.</p>
  </form>
  <div class="bs-stage hidden" id="bsStage">
    <div class="bs-figure" id="bsFigure"></div>
    <div class="bs-status" id="bsStatus">بنقرأ بياناتك…</div>
  </div>
  <div class="bs-result hidden" id="bsResult"></div>
  </div>`;
}

const SIL=`<svg viewBox="0 0 120 260" class="bs-sil" aria-hidden="true">
  <circle cx="60" cy="34" r="20"/><rect x="50" y="52" width="20" height="10" rx="4"/>
  <path d="M42 62 q18 -6 36 0 l4 44 q-22 8 -44 0 z"/>
  <path d="M44 108 q16 6 32 0 l-2 26 q-14 5 -28 0 z"/>
  <rect x="30" y="66" width="11" height="52" rx="5"/><rect x="79" y="66" width="11" height="52" rx="5"/>
  <rect x="31" y="118" width="10" height="46" rx="5"/><rect x="79" y="118" width="10" height="46" rx="5"/>
  <rect x="45" y="132" width="13" height="60" rx="6"/><rect x="62" y="132" width="13" height="60" rx="6"/>
  <rect x="44" y="190" width="13" height="56" rx="6"/><rect x="63" y="190" width="13" height="56" rx="6"/>
</svg>`;

function buildFigure(){
  const f=document.getElementById("bsFigure");
  if(f) f.innerHTML=SIL+`<span class="bs-scan"></span>`;
}

function currentGoal(){
  const el=document.querySelector("#bsGoals .bs-goal.on");
  return GOALS.find(g=>g.k===(el&&el.dataset.g))||GOALS[0];
}
function vals(){
  const h=+document.getElementById("bsH").value, w=+document.getElementById("bsW").value,
        a=+document.getElementById("bsA").value, s=document.getElementById("bsS").value;
  return {h,w,a,s};
}
function compute(){
  const {h,w,a,s}=vals(), g=currentGoal();
  if(!(h>0&&w>0&&a>0)) return null;
  const bmr=10*w+6.25*h-5*a+(s==="m"?5:-161);
  const tdee=bmr*1.375;
  return {h,w,a,s,g, bmr, kcal:tdee*g.kcal, prot:[w*g.prot[0], w*g.prot[1]], water:w*35, bmi:w/Math.pow(h/100,2)};
}

function card(d){
  return `<div class="bs-card" id="bsCard">
    <div class="bs-brand">MO<i>FIT</i></div>
    <div class="bs-tag">تقريرك السريع</div>
    <div class="bs-big"><b>${R(d.kcal)}</b><span>سعر في اليوم لهدفك</span></div>
    <div class="bs-grid">
      <div><b>${R(d.prot[0])}–${R(d.prot[1])}</b><span>جرام بروتين</span></div>
      <div><b>${(d.water/1000).toFixed(1)}</b><span>لتر مياه</span></div>
      <div><b>${d.bmi.toFixed(1)}</b><span>مؤشر كتلة الجسم</span></div>
    </div>
    <div class="bs-focus"><b>خطة هدفك: ${esc(d.g.t)}</b><span>${esc(d.g.focus)}</span></div>
    <div class="bs-actions">
      <button type="button" class="bs-btn sm" id="bsShare">شارك التقرير</button>
      <button type="button" class="bs-btn sm ghost" id="bsAgain">جرّب رقم تاني</button>
    </div>
    <p class="bs-foot">محسوب من طولك ووزنك وسنك (Mifflin-St Jeor). مش تشخيص ولا بديل عن الكوتش.</p>
  </div>`;
}

function drawShare(d){
  const c=document.createElement("canvas"); c.width=1080; c.height=1920;
  const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,1080,1920); g.addColorStop(0,"#0A1020"); g.addColorStop(1,"#12203C");
  x.fillStyle=g; x.fillRect(0,0,1080,1920);
  const rg=x.createRadialGradient(880,240,60,880,240,620); rg.addColorStop(0,"rgba(255,107,26,.35)"); rg.addColorStop(1,"rgba(255,107,26,0)");
  x.fillStyle=rg; x.fillRect(0,0,1080,1000);
  x.textAlign="center"; x.fillStyle="#FFFFFF"; x.font="800 150px Outfit, system-ui, sans-serif";
  x.fillText("MO",540,300); x.fillStyle="#FFB347"; x.fillText("FIT",540,300);
  x.font="700 46px Cairo, system-ui, sans-serif"; x.fillStyle="#A9B4C8"; x.fillText("تقريرك السريع",540,400);
  x.fillStyle="#FFB347"; x.font="900 210px Anton, system-ui, sans-serif"; x.fillText(String(R(d.kcal)),540,760);
  x.fillStyle="#E2E8F0"; x.font="700 52px Cairo, system-ui, sans-serif"; x.fillText("سعر في اليوم",540,840);
  const rows=[[`${R(d.prot[0])}–${R(d.prot[1])} جرام بروتين`],["مياه "+(d.water/1000).toFixed(1)+" لتر"],["BMI "+d.bmi.toFixed(1)],["هدفك: "+d.g.t]];
  x.font="600 46px Cairo, system-ui, sans-serif";
  rows.forEach((r,i)=>{ x.fillStyle=i===0?"#FFFFFF":"#CBD5E1"; x.fillText(r[0],540,1010+i*100); });
  x.fillStyle="#FF6B1A"; x.font="800 44px Cairo, system-ui, sans-serif"; x.fillText("mofit-coaching.github.io",540,1720);
  x.fillStyle="#8591A8"; x.font="500 34px Cairo, system-ui, sans-serif"; x.fillText("احسب أرقامك في 30 ثانية",540,1790);
  return c;
}

function share(d){
  const c=drawShare(d);
  const done=blob=>{
    if(!blob) return;
    const file=new File([blob],"mofit-report.png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:"تقرير MOFIT"}).catch(()=>{});
    }else{
      const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="mofit-report.png"; a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    }
  };
  if(c.toBlob) c.toBlob(done,"image/png"); 
}

function start(){
  const host=document.getElementById("bsHost");
  if(!host||host.dataset.on) return;
  host.dataset.on=1;
  host.innerHTML=markup();
  buildFigure();
  const goals=host.querySelectorAll(".bs-goal");
  goals.forEach(b=>b.addEventListener("click",()=>{goals.forEach(x=>x.classList.remove("on")); b.classList.add("on");}));
  const form=document.getElementById("bsForm");
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const d=compute(); if(!d) return;
    document.getElementById("bsForm").classList.add("hidden");
    const stage=document.getElementById("bsStage");
    stage.classList.remove("hidden");
    buildFigure();
    const st=document.getElementById("bsStatus");
    const msgs=["بنقرأ بياناتك…","بنحسب سعراتك…","بنظبط بروتينك…","جاهز"];
    let i=0; const t=setInterval(()=>{ if(st) st.textContent=msgs[Math.min(++i,msgs.length-1)]; },420);
    setTimeout(()=>{
      clearInterval(t);
      stage.classList.add("hidden");
      const res=document.getElementById("bsResult");
      res.classList.remove("hidden"); res.innerHTML=card(d);
      document.getElementById("bsShare").addEventListener("click",()=>share(d));
      document.getElementById("bsAgain").addEventListener("click",()=>{
        res.classList.add("hidden"); res.innerHTML="";
        document.getElementById("bsForm").classList.remove("hidden");
      });
      res.scrollIntoView({block:"center",behavior:"smooth"});
    },1750);
  });
}
window.mofitBodyScan={start, compute, drawShare};
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
