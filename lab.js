/* ======================================================================
   Mofit v5 — "the coach's lab": NASM assessment → corrective routine,
   body composition, safe rate of change, HR zones, strength standards,
   daily focus, education, onboarding, install, muscle map.
   ====================================================================== */

/* ---------- 1) NASM Overhead Squat Assessment → CES routine ---------- */
const OHSA=[
  {k:"feet_out", view:"أمامي", t:"القدم بتلف لبرّه",
    over:"السمانة (سوليس + الجاستروك الخارجية)، رأس الخلفية الخارجي", under:"الجاستروك الداخلية، الخلفية الداخلية، الجراسيليس",
    inhibit:["فوم رولر: السمانة","فوم رولر: الخلفية من برّه"], lengthen:["إطالة السمانة على الحيطة"], activate:["توازن على رجل واحدة مع مد الإيد","رفع مشط القدم بالباند"], integrate:["سكوات → رو بالكابل"]},
  {k:"knees_in", view:"أمامي", t:"الركبة بتدخل لجوّه",
    over:"الضامّة، TFL، الفاستس لاترالس", under:"الجلوت ميديوس وماكسيموس، VMO",
    inhibit:["فوم رولر: الضامّة (جوّه الفخد)","فوم رولر: TFL (جنب الفخد)"], lengthen:["إطالة الضامّة (Side lunge)","إطالة الحوض على الركبة"], activate:["Monster walk بالباند","Glute bridge بباند فوق الركبة"], integrate:["سكوات على الحيطة بباند فوق الركبة"]},
  {k:"lean", view:"جانبي", t:"ميل زيادة لقدّام",
    over:"السمانة، الهيب فليكسور، عضلات البطن", under:"التيبياليس الأمامية، الجلوت ماكسيموس، أسفل الضهر",
    inhibit:["فوم رولر: السمانة","فوم رولر: الفخد الأمامية"], lengthen:["إطالة السمانة على الحيطة","إطالة الحوض على الركبة"], activate:["Glute bridge","Prone cobra"], integrate:["سكوات → أوفرهيد بريس بدمبل خفيف"]},
  {k:"low_back", view:"جانبي", t:"أسفل الضهر بيتقوّس",
    over:"الهيب فليكسور، عضلات أسفل الضهر، اللاتس", under:"الجلوت، الخلفية، الكور العميق",
    inhibit:["فوم رولر: الفخد الأمامية","فوم رولر: اللاتس"], lengthen:["إطالة الحوض على الركبة","إطالة اللاتس على البنش"], activate:["Glute bridge","Bird dog","Plank"], integrate:["سكوات → رو بالكابل"]},
  {k:"arms", view:"جانبي", t:"الدراعات بتقع لقدّام",
    over:"اللاتس، التيريس ميجور، عضلات الصدر", under:"الترابيس الوسطى والسفلى، الرومبويد، الروتيتور كاف",
    inhibit:["فوم رولر: اللاتس","فوم رولر: منتصف الضهر"], lengthen:["إطالة اللاتس على البنش","إطالة الصدر على الباب"], activate:["Prone Y-T-W","Wall slides"], integrate:["سكوات → رو بالكابل","سكوات → أوفرهيد بريس بدمبل خفيف"]},
  {k:"heels", view:"جانبي", t:"الكعب بيترفع",
    over:"السوليس", under:"التيبياليس الأمامية",
    inhibit:["فوم رولر: السمانة"], lengthen:["إطالة السمانة والركبة مثنية"], activate:["رفع مشط القدم (Tibialis raise)"], integrate:["Goblet squat بكعب ثابت لعمق مريح"]},
  {k:"shift", view:"خلفي", t:"الوزن بيميل لناحية",
    over:"الضامّة وTFL في ناحية", under:"الجلوت ميديوس في الناحية التانية",
    inhibit:["فوم رولر: الضامّة","فوم رولر: TFL (جنب الفخد)"], lengthen:["إطالة الضامّة (Side lunge)","إطالة الحوض على الركبة"], activate:["Side plank","Single-leg glute bridge"], integrate:["Split squat بتحكم"]},
  {k:"head", view:"جانبي", t:"الراس بتتقدّم لقدّام",
    over:"الترابيس العليا، SCM", under:"عضلات الرقبة الأمامية العميقة",
    inhibit:["مساج بالبولة للترابيس العليا"], lengthen:["إطالة الترابيس العليا"], activate:["Chin tucks"], integrate:["كل تمارين الضهر والراس محايدة"]},
];
const N=x=>`<span class="num">${x}</span>`;
const CES_PHASES=[
  ["inhibit","1️⃣ فك (فوم رولر)",`${N("30-60")} ثانية لكل منطقة · اقف على النقطة الحساسة ${N("30")} ثانية`],
  ["lengthen","2️⃣ إطالة",`ثابتة ${N("30")} ثانية × ${N("1-2")} · بدون ألم`],
  ["activate","3️⃣ تنشيط",`${N("1-2")} مجموعة × ${N("10-15")} عدة · تمبو بطيء ${N("4-2-1")}`],
  ["integrate","4️⃣ دمج",`${N("1-2")} مجموعة × ${N("10-15")} عدة بتحكم كامل`],
];
function correctiveRoutine(a){
  const items=OHSA.filter(o=>a?.items?.includes(o.k));
  if(!items.length) return null;
  return CES_PHASES.map(([k,l,d])=>[l,d,[...new Set(items.flatMap(o=>o[k]))]]);
}
function prepCardHTML(p){
  const R=correctiveRoutine(p.assessment);
  const gen=`<div class="prep-ph"><b>🔥 إحماء عام (RAMP)</b><small>${N("5")} دقايق كارديو خفيف ← Leg swings · Hip circles · Arm circles · سكوات بوزن الجسم × ${N("10")} ← مجموعات إحماء للتمرين الأول</small></div>`;
  if(!R) return `<details class="card prep"><summary><span class="ic">🧩</span><b>قبل التمرين</b><small>إحماء 5-8 دقايق</small></summary>${gen}</details>`;
  return `<details class="card prep" open><summary><span class="ic acc">🧩</span><b>روتينك التصحيحي (NASM)</b><small>8-10 دقايق قبل كل تمرين · من تقييم ${niceDate(p.assessment.date)}</small></summary>
    ${R.map(([l,d,list])=>`<div class="prep-ph"><b>${l}</b><small>${d}</small><div class="chips">${list.map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div></div>`).join("")}${gen}</details>`;
}
function assessmentCardHTML(p){
  const a=p.assessment||{}, on=k=>(a.items||[]).includes(k);
  return `<div class="card" id="ohsa"><div class="card-h"><div class="ic acc">🧍</div><h2>تقييم السكوات فوق الراس (NASM OHSA)<small>${a.date?"آخر تقييم "+niceDate(a.date):"العميل يعمل 5 سكوات بدراعات مرفوعة – صوّره من قدّام ومن الجنب"}</small></h2></div>
    <div class="ohsa">${OHSA.map(o=>`<label class="ohsa-i ${on(o.k)?"on":""}"><input type="checkbox" value="${o.k}" ${on(o.k)?"checked":""}><span><b>${o.t}</b><small>منظر ${o.view} · مشدودة: ${o.over} · ضعيفة: ${o.under}</small></span></label>`).join("")}</div>
    <label class="f">ملاحظات التقييم<textarea id="ohN" rows="2">${esc(a.notes||"")}</textarea></label>
    <div id="ohPv"></div><button class="btn primary block" id="ohSave">حفظ التقييم وبناء الروتين التصحيحي</button></div>`;
}
function wireAssessment(root,p,onSaved){
  const pv=()=>{ const items=[...root.querySelectorAll(".ohsa input:checked")].map(i=>i.value); const R=correctiveRoutine({items});
    root.querySelectorAll(".ohsa-i").forEach(l=>l.classList.toggle("on",l.querySelector("input").checked));
    $("#ohPv").innerHTML=R?`<div class="pv-meta">${R.map(([l,d,list])=>`<div style="margin-bottom:6px"><b>${l}</b> <small class="muted">${d}</small><div class="chips">${list.map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div></div>`).join("")}</div>`:`<div class="pv-ok">✅ مفيش تعويضات – الإحماء العام كفاية</div>`; };
  root.querySelectorAll(".ohsa input").forEach(i=>i.onchange=pv); pv();
  $("#ohSave").onclick=async()=>{
    const assessment={date:today(), items:[...root.querySelectorAll(".ohsa input:checked")].map(i=>i.value), notes:$("#ohN").value.trim()};
    const { error } = await sb.from("profiles").update({assessment}).eq("id",p.id); if(error) return toast(error.message);
    p.assessment=assessment; toast("✓ اتحفظ – الروتين ظهر للعميل قبل كل تمرين"); onSaved&&onSaved();
  };
}

/* ---------- 2) body composition (US Navy) ---------- */
function bodyComp(p, m){
  const h=+p.height_cm, w=+m.weight, wa=+m.waist, n=+m.neck, hip=+m.hips;
  let bf=m.bodyfat?+m.bodyfat:null, src="مُدخلة";
  if(!bf&&h&&wa&&n&&wa>n){
    bf = p.sex==="أنثى" ? (hip? 495/(1.29579-0.35004*Math.log10(wa+hip-n)+0.22100*Math.log10(h))-450 : null)
                       : 495/(1.0324-0.19077*Math.log10(wa-n)+0.15456*Math.log10(h))-450;
    src="معادلة البحرية الأمريكية";
  }
  if(bf!==null&&(bf<3||bf>60)) bf=null;
  const lean=bf!==null&&w?w*(1-bf/100):null, hm=h/100;
  const ffmi=lean&&h?lean/(hm*hm)+6.1*(1.8-hm):null, whtr=wa&&h?wa/h:null;
  return {bf,src,lean,fat:lean?w-lean:null,ffmi,whtr};
}
function bodyCompCard(p, m){
  const c=bodyComp(p,m||{});
  const bfBand=c.bf===null?"":p.sex==="أنثى"?(c.bf<14?"رياضي جداً":c.bf<21?"رياضي":c.bf<25?"لياقة":c.bf<32?"متوسط":"أعلى من الصحي"):(c.bf<6?"رياضي جداً":c.bf<14?"رياضي":c.bf<18?"لياقة":c.bf<25?"متوسط":"أعلى من الصحي");
  const ff=c.ffmi===null?"":c.ffmi<18?"تحت المتوسط":c.ffmi<20?"متوسط":c.ffmi<22?"فوق المتوسط":c.ffmi<24?"عضلي جداً":"نخبة";
  return `<div class="card"><div class="card-h"><div class="ic acc">🧬</div><h2>تركيب الجسم<small>${c.bf!==null?"نسبة الدهون: "+c.src:"اكتب الوسط + الرقبة"+(p.sex==="أنثى"?" + الأرداف":"")+" عشان نحسبها"}</small></h2></div>
    <div class="grid4"><div class="stat dark"><div class="l">الدهون</div><div class="v num">${c.bf===null?"—":fmt(c.bf,1)+"%"}</div><div class="s">${bfBand}</div></div>
    <div class="stat"><div class="l">الكتلة الصافية</div><div class="v num">${fmt(c.lean,1)}</div><div class="s">كجم</div></div>
    <div class="stat"><div class="l">FFMI</div><div class="v num">${fmt(c.ffmi,1)}</div><div class="s">${ff}</div></div>
    <div class="stat ${c.whtr&&c.whtr>=0.5?"acc":""}"><div class="l">الوسط ÷ الطول</div><div class="v num">${fmt(c.whtr,2)}</div><div class="s">${c.whtr===null?"":c.whtr<0.5?"✅ صحي":"⚠ فوق 0.5"}</div></div></div>
    <p class="hint" style="margin-top:8px">💡 الميزان لوحده بيكدب: لو الوزن ثابت والوسط بينزل والـ FFMI بيزيد = بتخسر دهون وبتبني عضل.</p></div>`;
}

/* ---------- 3) safe rate of change + goal projection ---------- */
function trend(B){ const P=B.filter(b=>b.weight).map(b=>[+b.week,+b.weight]).slice(-4); if(P.length<2) return null;
  const n=P.length, mx=avg(P.map(x=>x[0])), my=avg(P.map(x=>x[1])); const s=P.reduce((a,[x,y])=>a+(x-mx)*(y-my),0)/P.reduce((a,[x])=>a+(x-mx)**2,0)||0;
  return {kg:s, pct:s/P[n-1][1]*100, cur:P[n-1][1]}; }
const wksAr=n=>n===1?"أسبوع":n===2?"أسبوعين":n<=10?n+" أسابيع":n+" أسبوع";
function rateVerdict(goal,pct){
  if(/تنشيف/.test(goal||"")) return pct<-1?["bad","⚠ سريع جداً – غالباً بتخسر عضل. زوّد السعرات 100-200"]:pct<=-0.4?["good","✅ مثالي لخسارة الدهون مع الحفاظ على العضل"]:pct<0?["mid","🐢 بطيء – راجع الالتزام أو قلل 100-150 سعر"]:["bad","⛔ الوزن مش بينزل – محتاج مراجعة الدايت"];
  if(/زيادة/.test(goal||"")) return pct>0.6?["bad","⚠ سريع – غالباً دهون. قلل 100-200 سعر"]:pct>=0.2?["good","✅ مثالي لبناء عضل نضيف"]:["mid","🐢 بطيء – زوّد 100-200 سعر"];
  return Math.abs(pct)<=0.3?["good","✅ ثابت زي المطلوب"]:["mid","↕ فيه تغيّر – راجع السعرات"];
}
function goalCardHTML(p,B){
  const t=trend(B||[]), tw=+p.target_weight||null;
  if(!t&&!tw) return "";
  const v=t?rateVerdict(p.goal,t.pct):null;
  let eta="";
  if(t&&tw){ const left=tw-t.cur; if(Math.abs(left)<0.3) eta="🎉 وصلت لهدفك!"; else if(Math.sign(left)===Math.sign(t.kg)&&Math.abs(t.kg)>0.05){ const wks=Math.ceil(left/t.kg); eta=`🎯 بالمعدل ده هتوصل ${fmt(tw,1)} كجم بعد ~${wksAr(wks)} (${niceDate(addDays(today(),wks*7))})`; } else eta=`🎯 الهدف ${fmt(tw,1)} كجم – الاتجاه الحالي مش رايح ناحيته`; }
  return `<div class="card goal ${v?v[0]:""}"><div class="card-h"><div class="ic acc">🎯</div><h2>معدل التغيّر والهدف<small>متوسط آخر ${Math.min(4,(B||[]).filter(b=>b.weight).length)} قياسات</small></h2></div>
    ${t?`<div class="grid2"><div class="stat dark"><div class="l">في الأسبوع</div><div class="v num">${t.kg>0?"+":""}${fmt(t.kg,2)}</div><div class="s">كجم</div></div><div class="stat"><div class="l">من وزن الجسم</div><div class="v num">${t.pct>0?"+":""}${fmt(t.pct,2)}%</div><div class="s">المثالي: ${/تنشيف/.test(p.goal||"")?"-0.5 → -1%":/زيادة/.test(p.goal||"")?"+0.25 → +0.5%":"±0.25%"}</div></div></div><p class="verdict">${v[1]}</p>`:""}
    ${eta?`<p class="hint" style="margin:6px 0 0">${eta}</p>`:""}</div>`;
}
function rateAlert(c){
  const W=(S.overview?.[c.id]?.weights||[]).map(([week,weight])=>({week,weight})); const t=trend(W); if(!t) return null;
  if(/تنشيف/.test(c.goal||"")&&t.pct<-1.2) return {p:2,icon:"📉",text:`بيخسر ${fmt(Math.abs(t.pct),1)}%/أسبوع – خطر خسارة عضل`};
  if(/زيادة/.test(c.goal||"")&&t.pct>0.8) return {p:2,icon:"📈",text:`بيزيد ${fmt(t.pct,1)}%/أسبوع – غالباً دهون`};
  return null;
}

/* ---------- 4) heart-rate zones (Karvonen, Tanaka HRmax) ---------- */
const ZONES=[["Z1","50-60%","استشفاء / مشي هادي","تقدر تغني",.5,.6,"#CBD5E1"],["Z2","60-70%","قاعدة هوائية · حرق دهون","تتكلم جمل كاملة",.6,.7,"#FDBA74"],["Z3","70-80%","تيمبو","كلام متقطع",.7,.8,"#FB923C"],["Z4","80-90%","عتبة لاكتيك","كلمتين بالعافية",.8,.9,"#F97316"],["Z5","90-100%","أقصى جهد / سبرنت","مستحيل تتكلم",.9,1,"#C2410C"]];
function hrCardHTML(p){
  if(!p.age) return "";
  const rhr=+localStorage.getItem("mofit_rhr_"+p.id)||null, max=Math.round(208-0.7*p.age), r=rhr||70;
  const bpm=f=>Math.round(r+(max-r)*f);
  const plan=/تنشيف/.test(p.goal||"")?"150-300 دقيقة Z2 في الأسبوع + 8-10 ألف خطوة يومياً · فترات Z4 مرة واحدة بس":/زيادة/.test(p.goal||"")?"2-3 مرات × 20 دقيقة Z2 للقلب والاستشفاء – أكتر من كده بيسرق السعرات":"150 دقيقة Z2 في الأسبوع + 7-8 ألف خطوة";
  return `<div class="card"><div class="card-h"><div class="ic acc">❤️</div><h2>مناطق النبض للكارديو<small>أقصى نبض ${max} · ${rhr?"نبض الراحة "+rhr:"اكتب نبض الراحة الصبح لدقة أعلى"}</small></h2></div>
    <label class="f">نبض الراحة (قيسه أول ما تصحى)<input inputmode="numeric" id="rhr" value="${rhr||""}" placeholder="مثلاً 62"></label>
    <div class="zones">${ZONES.map(z=>`<div class="zone"><i style="background:${z[6]}"></i><b>${z[0]}</b><span class="num">${bpm(z[4])}–${bpm(z[5])}</span><small>${z[2]} · ${z[3]}</small></div>`).join("")}</div>
    <p class="hint" style="margin-top:8px">🏃 خطتك: ${plan}</p></div>`;
}
function wireHr(p,redraw){ const i=$("#rhr"); if(i) i.onchange=()=>{ const v=parseInt(i.value); if(v>=35&&v<=110) localStorage.setItem("mofit_rhr_"+p.id,v); else localStorage.removeItem("mofit_rhr_"+p.id); i.onchange=null; setTimeout(redraw,0); }; }

/* ---------- 5) strength standards (e1RM ÷ bodyweight) ---------- */
const LIFTS=[["سكوات",/BACK SQUAT|FRONT SQUAT/i,[.75,1.25,1.75,2.5],[.5,.75,1.25,1.75]],["بنش",/BENCH PRESS(?!.*CLOSE)/i,[.5,.75,1.25,1.75],[.25,.5,.75,1]],["ديدلفت",/CONVENTIONAL DEADLIFT|TRAP BAR DEADLIFT/i,[1,1.5,2,2.75],[.5,1,1.5,2.25]],["أوفرهيد",/OVERHEAD PRESS/i,[.4,.55,.8,1.05],[.2,.35,.5,.75]]];
const LVL=["مبتدئ","متوسط","متقدم","نخبة"];
function strengthCardHTML(p,sets,bw){
  if(!bw) return "";
  const nameOf=Object.fromEntries(S.program.map(e=>[e.id,e.name]));
  const rows=LIFTS.map(([l,re,m,f])=>{ const best=Math.max(0,...(sets||[]).filter(s=>re.test(nameOf[s.exercise_id]||"")).map(s=>e1rm(s)||0)); if(!best) return null;
    const th=p.sex==="أنثى"?f:m, r=best/bw, i=th.filter(x=>r>=x).length; const nxt=th[i];
    const prog=nxt?Math.min(100,((r-(th[i-1]||0))/(nxt-(th[i-1]||0)))*100):100;
    return `<div class="lift"><div class="lift-h"><b>${l}</b><span class="pill ${i>=2?"acc":""}">${i?LVL[i-1]:"بداية"}</span><span class="num muted">${fmt(best,1)} كجم · ×${fmt(r,2)}</span></div><div class="bar"><i style="width:${prog}%"></i></div><small>${nxt?`المستوى الجاي (${LVL[i]}) عند ${fmt(nxt*bw,1)} كجم`:"🏆 أعلى مستوى"}</small></div>`; }).filter(Boolean);
  if(!rows.length) return "";
  return `<div class="card"><div class="card-h"><div class="ic">🏆</div><h2>مستوى قوتك<small>1RM المقدّر ÷ وزن الجسم · معايير تقريبية</small></h2></div>${rows.join("")}</div>`;
}

/* ---------- 6) education: tip of the day ---------- */
const TIPS=[
  ["RIR","RIR = عدد العدات اللي كان ممكن تعملها زيادة. RIR 2 يعني وقفت وفاضلك عدتين. ده أهم رقم بتسجله."],
  ["التطور التدريجي","العضل بيكبر لما تطلب منه أكتر: عدة زيادة، أو 2.5 كجم زيادة، أو تكنيك أنضف بنفس الوزن. مش لازم كل مرة أوزان."],
  ["البروتين","وزّع البروتين على 3-5 وجبات (25-40 جم كل وجبة) – أحسن لبناء العضل من وجبة واحدة كبيرة."],
  ["النوم","أقل من 7 ساعات نوم بيقلل القوة وبيزوّد الجوع وبيخلي التنشيف ياكل من العضل. النوم جزء من البرنامج."],
  ["الخطوات","الخطوات اليومية (NEAT) ممكن تحرق أكتر من الكارديو. 8-10 ألف خطوة = فرق كبير في التنشيف."],
  ["الوزن بيتذبذب","الوزن ممكن يتغيّر 1-2 كجم في يوم بسبب المية والملح والكارب. احكم على متوسط الأسبوع مش يوم واحد."],
  ["التمبو","تمبو 3-1-1-0 يعني 3 ثواني نزول، ثانية وقفة، ثانية طلوع. النزول البطيء = تحكم أكتر وإصابات أقل."],
  ["الألم الطبيعي","الشد العضلي بعد التمرين (DOMS) طبيعي ومش مقياس لجودة التمرين. الألم الحاد في المفصل لأ – بلّغ عنه."],
  ["الكرياتين","الكرياتين مونوهيدرات 3-5 جم يومياً من أكتر المكملات المثبتة علمياً للقوة. استشير الكوتش أو الدكتور الأول لو عندك مشكلة صحية."],
  ["المية","اشرب حوالي 35 مل لكل كيلو من وزنك يومياً، وزوّد في الحر والتمرين. لون البول الفاتح = مؤشر كويس."],
  ["الديلود","أسبوع الديلود مش كسل – هو اللي بيخليك تكمّل تتطور من غير إصابة. الجسم بيبني وقت الراحة."],
  ["الإحماء","5 دقايق إحماء + مجموعات تصاعدية للتمرين الأول بيقللوا الإصابة وبيزوّدوا قوتك في مجموعات الشغل."],
  ["الالياف","25-35 جم ألياف يومياً (خضار، فاكهة، شوفان، بقوليات) = شبع أطول وهضم أحسن، خصوصاً في التنشيف."],
  ["الاستمرارية","80% التزام لمدة سنة أحسن بكتير من 100% لمدة شهر. لو يوم باظ، الوجبة الجاية بداية جديدة."],
  ["الوجبة قبل التمرين","وجبة فيها كارب + بروتين قبل التمرين بساعة ونص لـ 3 ساعات = طاقة أحسن وأداء أعلى."],
  ["التنفّس والثبات","في التمارين التقيلة: خد نفس عميق في بطنك واشدها قبل ما تنزل (Bracing) – بيحمي ضهرك."],
  ["القياسات","صوّر نفسك كل أسبوع بنفس الإضاءة والوقت. الصور بتكشف تقدم الميزان مش شايفه."],
  ["الكحول والسكر","المشروبات المسكّرة والعصاير سعرات سايلة مابتشبعش. استبدلها بمية أو شاي أو مشروبات دايت."],
  ["الفشل العضلي","الفشل التام مش لازم في كل مجموعة. أغلب المجموعات على RIR 1-3 بتدي نفس النتيجة بإرهاق أقل."],
  ["الصبر","أول 4-8 أسابيع أغلب التطور عصبي (قوة). العضل الظاهر بياخد 8-12 أسبوع – كمّل."],
];
function tipCardHTML(){
  const d=Math.floor(Date.now()/864e5), [t,b]=TIPS[d%TIPS.length];
  return `<div class="card tip"><div class="tip-k">📚 معلومة اليوم</div><b>${t}</b><p>${b}</p></div>`;
}

/* ---------- 7) today's focus checklist ---------- */
function todayCardHTML(p,{dn,setsThisDay,meals,habitToday,ready}){
  const items=[];
  if(dn) items.push(["train",setsThisDay>0,"🏋","تمرين النهارده",setsThisDay?`${setsThisDay} مجموعات اتسجلت`:"ابدأ وسجّل مجموعاتك"]);
  if(dn) items.push(["ready",!!ready,"🔋","قيّم جاهزيتك","10 ثواني قبل التمرين"]);
  items.push(["food",meals>0,"🍽","سجّل أكلك",meals?`${meals} أصناف`:"على الأقل الوجبات الأساسية"]);
  items.push(["habits",!!habitToday,"✅","عادات اليوم","نوم · مية · خطوات"]);
  const done=items.filter(i=>i[1]).length, pctv=done/items.length;
  return `<div class="card today"><div class="today-h"><div>${ring(done,items.length,{size:64,label:`${done}/${items.length}`,sub:""})}</div><div><b>${pctv===1?"🔥 يوم كامل – عاش!":pctv>=.5?"كمّل… فاضل خطوة":"اللي عليك النهارده"}</b><small>${niceDate(today())}</small></div></div>
    ${items.map(([k,ok,ic,t,s])=>`<button class="todo ${ok?"ok":""}" data-go="${k}"><span class="tick">${ok?"✓":ic}</span><span><b>${t}</b><small>${s}</small></span><span class="go">←</span></button>`).join("")}</div>`;
}
function wireToday(dn,wk){
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{ const k=b.dataset.go;
    if(k==="train"){ S.tab="train"; S.day=dn; S.week=wk; } else if(k==="ready"){ S.tab="train"; S.day=dn; S.week=wk; render(); return setTimeout(()=>openReadiness(()=>render()),300); } else if(k==="food"){ S.tab="food"; S.date=today(); } else S.tab="habits";
    render(); });
}

/* ---------- 8) first-run onboarding ---------- */
const ONB=[
  ["👋","أهلاً بيك في Mofit","ده مكانك الوحيد للتمرين والأكل والمتابعة مع الكوتش. كل حاجة بتسجلها الكوتش بيشوفها ويعدّل عليها."],
  ["🏋","سجّل كل مجموعة","الوزن + العدات + RIR (كام عدة كان فاضلك). من غيرهم الكوتش مايقدرش يزوّدلك صح. الأرقام الرمادي = هدفك المقترح."],
  ["🔋","التطبيق بيتأقلم معاك","قيّم جاهزيتك قبل التمرين، ولو وقتك ضيق دوس ⏱. لو حسيت بألم دوس 🤕 – ماتكملش على الوجع أبداً."],
  ["📸","كل أسبوع: متابعة","وزن + 3 صور + إحساسك. الكوتش بيرد عليك ويعدّل البرنامج. الالتزام 80% أحسن من الكمال اللي بيقف بعد أسبوعين."],
];
function maybeOnboard(){
  if(S.me.role!=="client") return; const key="mofit_onb_"+S.me.id; if(localStorage.getItem(key)) return;
  let i=0; const draw=()=>{ const [ic,t,b]=ONB[i];
    const body=openSheet(`<div class="onb"><div class="onb-ic">${ic}</div><h3>${t}</h3><p>${b}</p><div class="dots">${ONB.map((_,j)=>`<i class="${j===i?"on":""}"></i>`).join("")}</div>
      <button class="btn primary block" id="onbN">${i<ONB.length-1?"التالي ←":"يلا نبدأ 💪"}</button>${i<ONB.length-1?`<button class="btn ghost block" id="onbS" style="margin-top:6px">تخطّي</button>`:""}</div>`);
    $("#onbN").onclick=()=>{ if(i<ONB.length-1){ i++; draw(); } else { localStorage.setItem(key,"1"); closeSheet(); } };
    $("#onbS")&&($("#onbS").onclick=()=>{ localStorage.setItem(key,"1"); closeSheet(); });
  }; draw();
}

/* ---------- 9) install as an app ---------- */
let _bip=null; window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); _bip=e; });
const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
function installCardHTML(){
  if(isStandalone()||localStorage.getItem("mofit_noinst")) return "";
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="card install"><div class="card-h"><div class="ic dark"><img src="icon-192.png" alt="" style="width:100%;height:100%;border-radius:12px"></div><h2>ثبّت Mofit على موبايلك<small>${ios?"اضغط زر المشاركة ⬆ ثم «إضافة إلى الشاشة الرئيسية»":"يفتح كأنه تطبيق ويشتغل من غير نت في الجيم"}</small></h2><button class="x" id="instX" aria-label="إخفاء">✕</button></div>
    ${ios?"":`<button class="btn primary block" id="instGo">📲 ثبّت التطبيق</button>`}</div>`;
}
function wireInstall(){
  $("#instX")&&($("#instX").onclick=()=>{ localStorage.setItem("mofit_noinst","1"); $(".install")?.remove(); });
  $("#instGo")&&($("#instGo").onclick=async()=>{ if(_bip){ _bip.prompt(); await _bip.userChoice; _bip=null; $(".install")?.remove(); } else toast("من قائمة المتصفح ⋮ اختار «تثبيت التطبيق»"); });
}

/* ---------- 10) muscle map (front + back) ---------- */
function muscleVol(exs){ const v={}; exs.forEach(e=>{ const m=muscleOf(e[0]||e.name); v[m]=(v[m]||0)+(+(e[1]??e.sets)||0); }); return v; }
function muscleMapSVG(vol){
  const max=Math.max(1,...Object.values(vol)), f=m=>{ const x=vol[m]||0; return x?`rgba(249,115,22,${(0.3+0.7*x/max).toFixed(2)})`:"#E2E8F0"; };
  const body=(cx,front)=>{ const B="#CBD5E1";
    return `<g>
      <circle cx="${cx}" cy="18" r="11" fill="${B}"/>
      <rect x="${cx-6}" y="28" width="12" height="7" rx="3" fill="${B}"/>
      <ellipse cx="${cx-23}" cy="42" rx="10" ry="8" fill="${f("أكتاف")}"/><ellipse cx="${cx+23}" cy="42" rx="10" ry="8" fill="${f("أكتاف")}"/>
      ${front?`<rect x="${cx-19}" y="36" width="18" height="22" rx="6" fill="${f("صدر")}"/><rect x="${cx+1}" y="36" width="18" height="22" rx="6" fill="${f("صدر")}"/>
        <rect x="${cx-14}" y="60" width="28" height="32" rx="7" fill="${f("بطن")}"/>`
      :`<path d="M${cx-20} 36 h40 l-6 50 h-28 z" fill="${f("ضهر")}"/><rect x="${cx-13}" y="86" width="26" height="8" rx="4" fill="${B}"/>`}
      <rect x="${cx-35}" y="50" width="11" height="28" rx="5" fill="${f(front?"باي":"تراي")}"/><rect x="${cx+24}" y="50" width="11" height="28" rx="5" fill="${f(front?"باي":"تراي")}"/>
      <rect x="${cx-36}" y="80" width="9" height="26" rx="4" fill="${B}"/><rect x="${cx+27}" y="80" width="9" height="26" rx="4" fill="${B}"/>
      ${front?`<rect x="${cx-16}" y="94" width="13" height="5" rx="2" fill="${B}"/><rect x="${cx+3}" y="94" width="13" height="5" rx="2" fill="${B}"/>`
      :`<rect x="${cx-17}" y="94" width="16" height="16" rx="7" fill="${f("خلفية/أرداف")}"/><rect x="${cx+1}" y="94" width="16" height="16" rx="7" fill="${f("خلفية/أرداف")}"/>`}
      <rect x="${cx-16}" y="${front?100:111}" width="14" height="${front?40:29}" rx="6" fill="${f(front?"أمامية":"خلفية/أرداف")}"/><rect x="${cx+2}" y="${front?100:111}" width="14" height="${front?40:29}" rx="6" fill="${f(front?"أمامية":"خلفية/أرداف")}"/>
      <rect x="${cx-15}" y="143" width="12" height="30" rx="5" fill="${front?B:f("سمانة")}"/><rect x="${cx+3}" y="143" width="12" height="30" rx="5" fill="${front?B:f("سمانة")}"/>
    </g>`; };
  const top=Object.entries(vol).filter(([m])=>m!=="أخرى").sort((a,b)=>b[1]-a[1]);
  return `<div class="mmap"><svg viewBox="0 0 220 186" role="img" aria-label="خريطة العضلات">${body(60,true)}${body(160,false)}
    <text x="60" y="184" text-anchor="middle" font-size="9" fill="#64748B">أمام</text><text x="160" y="184" text-anchor="middle" font-size="9" fill="#64748B">خلف</text></svg>
    <div class="mm-list">${top.map(([m,v])=>`<span><i style="background:${f(m)}"></i>${m} <b>${v}</b></span>`).join("")}</div></div>`;
}
