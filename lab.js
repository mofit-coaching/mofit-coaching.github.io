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

/* ---------- 10) muscle colour system + anatomical map ---------- */
const MUSCLE_COLOR={"صدر":"#F97316","ضهر":"#2563EB","أكتاف":"#F59E0B","باي":"#059669","تراي":"#0891B2","أمامية":"#7C3AED","خلفية/أرداف":"#DB2777","سمانة":"#65A30D","بطن":"#DC2626","أخرى":"#64748B"};
const mColor=m=>MUSCLE_COLOR[m]||MUSCLE_COLOR["أخرى"];
const ARM="M22 72Q18 88 20 104Q26 108 31 104Q33 90 31 80Z", FOREARM="M19 106Q14 124 16 146Q20 148 24 146Q30 126 31 106Z", DELT="M36 54Q24 56 22 70Q24 80 30 82Q34 70 40 60Z";
const BODY_FRONT=[[null,"M54 36h12v10H54z",1],["ضهر","M52 44Q44 48 36 54L50 55Z"],["أكتاف",DELT],["صدر","M58 58L40 58Q32 64 32 76Q36 88 50 88Q58 86 59 80Z"],["باي",ARM],[null,FOREARM],
  ["بطن","M33 86Q34 112 40 140L46 140Q44 112 46 90Z"],["بطن","M48.5 92h9v13h-9z"],["بطن","M48.5 107h9v13h-9z"],["بطن","M48.5 122h9v14h-9z"],[null,"M40 142L59 142L59 156Q48 156 40 148Z"],
  ["أمامية","M38 150Q32 175 36 205Q44 212 52 206Q58 180 58 158Q48 160 38 150Z"],[null,"M39 211a6 5 0 1012 0a6 5 0 10-12 0z"],[null,"M38 218Q36 240 40 252L48 252Q52 236 51 218Z"],[null,"M37 256a7 3 0 1014 0a7 3 0 10-14 0z"],[null,"M12 153a4 7 0 108 0a4 7 0 10-8 0z"]];
const BODY_BACK=[[null,"M54 36h12v10H54z",1],["ضهر","M58 78Q48 66 36 62Q34 84 44 110Q52 116 58 118Z"],["ضهر","M58 120Q50 118 44 114Q44 128 46 139L58 139Z"],["ضهر","M60 38L52 44Q42 50 36 56Q48 60 60 76Z"],
  ["أكتاف",DELT],["تراي",ARM],[null,FOREARM],["خلفية/أرداف","M59 141L42 141Q34 150 38 166Q50 172 59 166Z"],["خلفية/أرداف","M38 168Q34 190 38 208Q46 212 54 206Q58 188 58 170Q48 172 38 168Z"],
  ["سمانة","M38 216Q32 230 38 246L48 248Q54 232 52 216Z"],[null,"M37 256a7 3 0 1014 0a7 3 0 10-14 0z"],[null,"M12 153a4 7 0 108 0a4 7 0 10-8 0z"]];
function anatomySVG(vol,{dark=false}={}){
  const max=Math.max(1,...Object.values(vol)), base=dark?"rgba(255,255,255,.09)":"#E2E8F0", gap=dark?"#16213A":"#FFFFFF";
  let order=0; const ord={}; Object.entries(vol).sort((a,b)=>b[1]-a[1]).forEach(([m])=>ord[m]=order++);
  const part=([m,d,center])=>{ const v=m?vol[m]||0:0;
    const fill=v?mColor(m):base, op=v?(0.5+0.5*v/max).toFixed(2):1;
    const el=`<path d="${d}" fill="${fill}" fill-opacity="${op}" ${v?`class="mm-on" style="--d:${ord[m]*.12}s"`:""}/>`;
    return center?el:el+`<path d="${d}" fill="${fill}" fill-opacity="${op}" transform="translate(120 0) scale(-1 1)" ${v?`class="mm-on" style="--d:${ord[m]*.12}s"`:""}/>`; };
  const fig=(parts,x,label)=>`<g transform="translate(${x} 0)" stroke="${gap}" stroke-width="1.4" stroke-linejoin="round"><ellipse cx="60" cy="21" rx="12.5" ry="15" fill="${base}" stroke="none"/>${parts.map(part).join("")}</g>
    <text x="${x+60}" y="276" text-anchor="middle" font-size="11" fill="${dark?"#94A3B8":"#64748B"}">${label}</text>`;
  return `<svg class="anat" viewBox="0 0 250 282" role="img" aria-label="خريطة العضلات المستهدفة">${fig(BODY_FRONT,0,"أمام")}${fig(BODY_BACK,130,"خلف")}</svg>`;
}
function muscleVol(exs){ const v={}; exs.forEach(e=>{ const m=muscleOf(e[0]||e.name); if(m==="أخرى") return; v[m]=(v[m]||0)+(+(e[1]??e.sets)||0); }); return v; }
function muscleLegend(vol,{dark=false}={}){ const tot=Object.values(vol).reduce((a,b)=>a+b,0)||1;
  return `<div class="mlg ${dark?"dk":""}">${Object.entries(vol).sort((a,b)=>b[1]-a[1]).map(([m,v])=>`<div class="mlg-r"><i style="background:${mColor(m)}"></i><span>${m}</span><b class="num">${v}</b><em><s style="width:${Math.round(v/tot*100)}%;background:${mColor(m)}"></s></em></div>`).join("")}</div>`; }
function muscleMapSVG(vol){ return `<div class="mmap">${anatomySVG(vol)}${muscleLegend(vol)}</div>`; }
const mChip=m=>`<span class="mchip" style="--mc:${mColor(m)}"><i></i>${m}</span>`;

/* ---------- 11) muscle-specific warm-up (RAMP: Raise · Activate/Mobilise · Potentiate) ---------- */
const WU={
  "صدر":{mob:[["فتح الصدر ديناميكي على الحيطة","10 لكل ناحية"],["T-spine rotation على الجنب","6 لكل ناحية"]],act:[["Scap push-ups","2 × 10"],["Band chest fly خفيف","15"]],why:"يفتح الكتف الأمامي ويثبّت لوح الكتف قبل الضغط"},
  "ضهر":{mob:[["Cat-camel","8 ببطء"],["Thread the needle","6 لكل ناحية"]],act:[["Band pull-apart","2 × 15"],["Scap pull-ups على العقلة","8"]],why:"يشغّل عضلات لوح الكتف عشان السحب يكون من الضهر مش الدراع"},
  "أكتاف":{mob:[["Band dislocates (عصاية/باند)","10"],["Arm circles كبيرة","10 لكل اتجاه"]],act:[["Band external rotation","12 لكل دراع"],["Prone Y-raise","10"]],why:"يجهّز الروتيتور كاف – أكتر مفصل بيتصاب في الجيم"},
  "باي":{mob:[["دوران الكوع والرسغ","10 لكل اتجاه"]],act:[["Band curls خفيف","20"]],why:"يدفّي وتر الكوع قبل الأوزان"},
  "تراي":{mob:[["إطالة تراي فوق الراس ديناميكي","8 لكل دراع"]],act:[["Band pushdowns","20"]],why:"يحمي الكوع في الضغط والتراي"},
  "أمامية":{mob:[["Leg swings قدام-ورا","10 لكل رجل"],["Walking lunge + reach لفوق","6 لكل رجل"]],act:[["سكوات بوزن الجسم تمبو 3-1-1","10"],["Goblet squat hold تحت","20 ثانية"]],why:"يفتح الحوض والكاحل ويعلّم الجسم العمق الصح"},
  "خلفية/أرداف":{mob:[["World's greatest stretch","4 لكل ناحية"],["90/90 hip switches","8"]],act:[["Glute bridge مع وقفة ثانيتين","2 × 12"],["Band lateral walk","10 خطوات لكل ناحية"],["Hip hinge بالعصاية","10"]],why:"يصحّي الجلوت والخلفية ويحمي أسفل الضهر في الديدلفت"},
  "سمانة":{mob:[["Ankle rocks (الركبة للحيطة)","10 لكل رجل"]],act:[["Pogo hops خفيف","20"]],why:"مرونة الكاحل = سكوات أعمق وركبة أأمن"},
  "بطن":{mob:[["Cat-camel","6"]],act:[["Dead bug","8 لكل ناحية"],["Plank مع شد البطن","20-30 ثانية"]],why:"ثبات الجذع قبل أي حمل تقيل"},
};
const LOWER=new Set(["أمامية","خلفية/أرداف","سمانة"]);
function warmupPlan(p,exs){
  const vol=muscleVol(exs.map(e=>[e.name,e.sets])), ms=Object.entries(vol).sort((a,b)=>b[1]-a[1]).map(([m])=>m).filter(m=>WU[m]).slice(0,4);
  const tot=Object.values(vol).reduce((a,b)=>a+b,0)||1, low=ms.reduce((a,m)=>a+(LOWER.has(m)?vol[m]:0),0)/tot;
  const raise=low>.6?["عجلة ثابتة أو مشي على ميل","4 دقايق · تعرّق خفيف"]:low<.3?["Rower أو Jumping jacks + دوران دراعات","4 دقايق · نَفَس أسرع شوية"]:["Rower أو Elliptical","4 دقايق · الجسم كله"];
  const blocks=ms.map((m,i)=>{ const w=WU[m]; return {m,why:w.why,items:[...w.mob.slice(0,1).map(x=>["mob",...x]),...w.act.slice(0,i===0?2:1).map(x=>["act",...x])]}; });
  const R=correctiveRoutine(p.assessment);
  const corr=R?[[R[0][2],R[0][1].replace(/^\S+\s/,"")],[R[1][2],R[1][1].replace(/^\S+\s/,"")],[R[2][2],R[2][1].replace(/^\S+\s/,"")]]:null;
  const drills=blocks.reduce((a,b)=>a+b.items.length,0)+(corr?corr.length:0);
  return {vol,ms,raise,blocks,corr,mins:Math.round(4+drills*0.6)};
}
function warmupCardHTML(p,exs,dayNo){
  const W=warmupPlan(p,exs); if(!W.ms.length) return "";
  const key=`mofit_wu_${p.id}_${today()}_${dayNo}`; let done=[]; try{ done=JSON.parse(localStorage.getItem(key)||"[]"); }catch(e){}
  let n=0; const row=(id,t,d,tag)=>{ n++; const on=done.includes(id); return `<button class="wu-i ${on?"on":""}" data-wu="${id}"><span class="wu-c">${on?"✓":""}</span><span class="wu-t"><b>${esc(t)}</b><small>${esc(d)}</small></span>${tag?`<span class="wu-tag ${tag}">${tag==="mob"?"مرونة":"تنشيط"}</span>`:""}</button>`; };
  let step=0; const sec=(t,sub,body,color)=>{ step++; return `<section class="wu-s" style="--mc:${color||"var(--acc)"}"><header><span class="wu-n">${step}</span><div><b>${t}</b>${sub?`<small>${sub}</small>`:""}</div></header>${body}</section>`; };
  const html=[
    sec("تسخين عام",W.raise[1],row("raise",W.raise[0],"لحد ما تحس بدفا وتعرّق خفيف")),
    W.corr?sec("روتينك التصحيحي (NASM)","من تقييم "+niceDate(p.assessment.date),W.corr.map(([list,d],i)=>row(`c${i}`,list[0],d.replace(/<[^>]+>/g,""))).join("")):"",
    ...W.blocks.map(b=>sec(b.m,b.why,b.items.map(([k,t,d],j)=>row(`${b.m}${j}`,t,d,k)).join(""),mColor(b.m))),
    sec("مجموعات التهيئة","جوّه أول تمرين لكل عضلة – بأوزان خفيفة وعدات قليلة",`<p class="hint" style="margin:0">الأوزان محسوبة من وزن شغلك الأسبوع اللي فات. مابتتحسبش في التسجيل.</p>`)
  ].join("");
  const pctDone=Math.round(done.length/n*100);
  return `<details class="card wu" ${pctDone<100?"open":""} data-wukey="${key}" data-wun="${n}">
    <summary><div class="wu-hero"><div class="wu-map">${anatomySVG(W.vol,{dark:true})}</div><div class="wu-meta"><span class="wu-k">إحماء النهارده</span><b class="wu-title">${W.ms.slice(0,3).join(" · ")}${W.ms.length>3?` <span class="wu-more">+${W.ms.length-3}</span>`:""}</b><small>${W.mins} دقيقة · ${n} خطوات · مبني على العضلات اللي هتشتغل</small>
      <div class="wu-prog"><i style="width:${pctDone}%"></i></div><small class="wu-pt">${pctDone===100?"✅ جاهز – يلا على أول تمرين":pctDone?`${pctDone}% خلصت`:"دوس على كل خطوة لما تخلّصها"}</small></div></div></summary>
    <div class="wu-body">${html}</div></details>`;
}
function wireWarmup(root){
  const card=root.querySelector("details.wu"); if(!card) return; const key=card.dataset.wukey, n=+card.dataset.wun;
  card.querySelectorAll("[data-wu]").forEach(b=>b.onclick=()=>{ let done=[]; try{ done=JSON.parse(localStorage.getItem(key)||"[]"); }catch(e){}
    const id=b.dataset.wu, on=!done.includes(id); done=on?[...done,id]:done.filter(x=>x!==id); localStorage.setItem(key,JSON.stringify(done));
    b.classList.toggle("on",on); b.querySelector(".wu-c").textContent=on?"✓":""; try{ on&&navigator.vibrate&&navigator.vibrate(15); }catch(e){}
    const pc=Math.round(done.length/n*100); card.querySelector(".wu-prog i").style.width=pc+"%"; card.querySelector(".wu-pt").textContent=pc===100?"✅ جاهز – يلا على أول تمرين":pc+"% خلصت"; });
}
function feederHTML(workW,m){
  const r=v=>Math.max(2.5,Math.round(v/2.5)*2.5);
  const steps=workW>=15?[[0.5,8],[0.75,3]].map(([p,n])=>`<span class="pill">${fmt(r(workW*p),1)} كجم × ${n}</span>`).join(""):`<span class="pill">وزن خفيف × 10</span><span class="pill">+ مجموعة متوسطة × 4</span>`;
  return `<div class="warm" style="--mc:${mColor(m)}"><b>🔥 تهيئة ${m}</b><div class="scroller">${steps}</div><small>أول تمرين ${m} النهارده · راحة 45-60 ثانية</small></div>`;
}
