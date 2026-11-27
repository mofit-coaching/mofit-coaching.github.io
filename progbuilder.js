/* ======================================================================
   PROGRAM BUILDER (مساعد بناء البرنامج) — coach-only wizard.
   The client's intake answers (goal, days, level, place, joint issues)
   become a DRAFT training + food program built from the coach's own
   SYSTEMS library and LEVELS rules. Nothing writes until the coach
   approves inside the sheet; applying replaces only that client's own
   program_exercises copy / profile targets — never program_templates,
   never the coach's original program (MOFIT_SYS), never other clients.
   No schema change, no external API.
   ====================================================================== */

const PB_GOALCAT = { "تنشيف (خسارة دهون)":"fat", "زيادة عضل":"hyp", "ثبات الوزن":"hyp" };
const PB_INJURIES = [
  ["knee",   "ركبة", /SQUAT|LUNGE|LEG EXTENSION|HACK|STEP-UP|LEG PRESS/i],
  ["back",   "ضهر",  /DEADLIFT|BENT-OVER|GOOD MORNING|\bRDL\b|T-BAR/i],
  ["shoulder","كتف", /OVERHEAD|SHOULDER PRESS|UPRIGHT|ARNOLD|DIPS/i],
];

/* pick the best system from HIS library for these answers */
function pbRecommend(days, cat, level){
  const rank=LEVEL_RANK||{"مبتدئ":0,"متوسط":1,"متقدم":2};
  const fits=s=>s.days===days&&s.cat===cat&&(rank[s.min]??0)<=(rank[level]??1);
  return SYSTEMS.find(s=>fits(s)&&s.rec)||SYSTEMS.find(fits)||SYSTEMS.find(s=>s.days===days&&s.cat===cat)||null;
}

/* swap exercises that clash with an injury, using HIS alternatives table */
function pbInjuryPass(plan, injuries){
  const swaps=[], flags=[];
  injuries.forEach(([key,label,rx])=>{
    plan.forEach(day=>day.ex.forEach(e=>{
      if(!rx.test(e[0])) return;
      const alt=(altsFor(e[0])||[]).find(a=>!PB_INJURIES.some(([, ,r])=>injuries.some(ii=>ii[2]===r)&&r.test(a)));
      if(alt){ swaps.push({from:e[0],to:alt,inj:label,day:day.label}); e[0]=alt; }
      else flags.push({name:e[0],inj:label,day:day.label});
    }));
  });
  return {swaps,flags};
}

function openProgramBuilder(p){
  const hs=(S.health||[]).find?.(h=>h.client_id===p.id) || S.health?.[p.id];
  const joint=hs?.answers?.joint;
  const lvls=Object.keys(LEVELS);
  const daysList=[...new Set(SYSTEMS.map(s=>s.days))].sort((a,b)=>a-b);
  const body=openSheet(`<div class="between"><b style="font-size:1.05rem">🧩 مساعد بناء البرنامج</b><button class="btn sm ghost" data-close>✕</button></div>
    <p class="hint">بيولّد مسودة من إجابات ${esc(p.full_name||"العميل")} ومكتبة أنظمتك — مفيش حاجة بتتطبق غير باعتمادك، وعلى نسخة العميل بس.</p>
    <div id="pbStep1">
      <div class="grid2">
        <label class="f">الهدف<select id="pbGoal">${GOALS.map(([g])=>`<option ${p.goal===g?"selected":""}>${g}</option>`).join("")}</select></label>
        <label class="f">أيام التمرين<select id="pbDays">${daysList.map(d=>`<option ${(+p.training_days||3)===d?"selected":""}>${d}</option>`).join("")}</select></label>
        <label class="f">المستوى<select id="pbLevel">${lvls.map(l=>`<option ${p.level===l?"selected":""}>${l}</option>`).join("")}</select></label>
        <label class="f">المكان<select id="pbPlace"><option value="gym">جيم</option><option value="home">بيت / بدون أدوات</option></select></label>
      </div>
      <label class="f" style="font-weight:700">مشاكل مفاصل؟ ${joint?`<small class="muted">(العميل ذكر في الفحص: ${esc(hs.details||"في مشكلة مفاصل")})</small>`:""}</label>
      <div class="row" style="gap:6px;flex-wrap:wrap">${PB_INJURIES.map(([k,l])=>`<button type="button" class="chip" data-inj="${k}">${l}</button>`).join("")}</div>
      <button class="btn primary block" id="pbGen" style="margin-top:14px">⚡ ولّد المسودة</button>
    </div>
    <div id="pbStep2" class="hidden"></div>`);
  body.querySelector("[data-close]").onclick=closeSheet;
  if(joint) body.querySelector('[data-inj="knee"]')?.classList.add("on");
  body.querySelectorAll("[data-inj]").forEach(b=>b.onclick=()=>b.classList.toggle("on"));
  body.querySelector("#pbGen").onclick=()=>pbDraft(p,body);
}

function pbDraft(p,body){
  const goal=body.querySelector("#pbGoal").value, days=+body.querySelector("#pbDays").value,
        level=body.querySelector("#pbLevel").value, place=body.querySelector("#pbPlace").value;
  const injKeys=[...body.querySelectorAll("[data-inj].on")].map(b=>b.dataset.inj);
  const injuries=PB_INJURIES.filter(([k])=>injKeys.includes(k));
  const cat=place==="home"?"home":PB_GOALCAT[goal];
  const sys=pbRecommend(days,cat,level);
  const host=body.querySelector("#pbStep2");
  if(!sys){ host.classList.remove("hidden"); host.innerHTML=`<p class="err">مفيش نظام في المكتبة يطابق الإجابات دي — جرّب أيام مختلفة أو هدف تاني.</p>`; return; }
  const plan=JSON.parse(JSON.stringify(resolvePlan(sys,level)));
  const {swaps,flags}=pbInjuryPass(plan,injuries);
  /* food targets for the chosen goal (his own formula + protein floor 1.8 g/kg) */
  const adj=(GOALS.find(g=>g[0]===goal)||[0,0])[1];
  const tmp={...p, goal, goal_adj:adj, manual_kcal:null, protein_gpk:p.start_weight?1.8:null};
  const tNew=targets(tmp), tCur=targets(p);
  const reasons=[`الهدف: ${esc(goal)} → فئة «${esc(CATS[cat]||cat)}»`, `${days} أيام · مستوى ${esc(level)} → نظام «${esc(sys.name)}»`];
  swaps.forEach(s=>reasons.push(`إصابة ${s.inj} → استبدال ${s.from} بـ ${s.to} (${s.day})`));
  flags.forEach(f=>reasons.push(`⚠ ${f.name} (${f.day}) ممكن يضايق ${f.inj} ومفيش بديل جاهز — راجعه بنفسك`));

  host.classList.remove("hidden");
  host.innerHTML=`<hr style="margin:14px 0;border:none;border-top:1px solid var(--line,#E2E8F0)">
    <b>📋 المسودة: ${esc(sys.name)}</b>
    <div style="margin:8px 0">${reasons.map(r=>`<span class="pill acc-soft" style="display:block;text-align:start;white-space:normal;margin-bottom:4px">💡 ${r}</span>`).join("")}</div>
    ${plan.map((d,i)=>`<div class="card" style="box-shadow:none;background:var(--acc-soft);margin-bottom:8px"><b>يوم ${i+1}: <span dir="ltr" translate="no" lang="en">${esc(d.label)}</span></b>
      <small style="display:block;margin-top:4px">${d.ex.map(e=>`<span dir="ltr" translate="no" lang="en">${esc(e[0])}</span> ${e[1]}×${esc(e[2]||"—")}${swaps.some(s=>s.to===e[0]&&s.day===d.label)?" ⇄":""}`).join(" · ")}</small></div>`).join("")}
    ${tNew.kcal?`<div class="card dark" style="margin-bottom:8px"><b>🍽 مسودة الأكل</b>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
        <span class="pill">السعرات — قبل: ${tCur.kcal?fmt(tCur.kcal):"—"}</span><span class="pill acc">بعد: ${fmt(tNew.kcal)}</span>
        <span class="pill">بروتين — قبل: ${tCur.P?fmt(tCur.P)+" جم":"—"}</span><span class="pill acc">بعد: ${fmt(tNew.P)} جم (1.8 جم/كجم)</span>
      </div></div>`:""}
    <label class="f" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="pbDoTrain" checked style="width:20px;height:20px;min-height:0;margin-top:2px"><span><b>استبدال برنامج التمرين الحالي بالمسودة</b><br><small class="muted">⚠ بيمسح برنامج العميل الحالي والمجموعات المسجلة على تمارينه — برنامجك الأساسي والقوالب مش بيتلمسوا</small></span></label>
    ${tNew.kcal?`<label class="f" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="pbDoFood" style="width:20px;height:20px;min-height:0;margin-top:2px"><span><b>تطبيق أهداف الأكل</b> <small class="muted">(سعرات يدوية ${fmt(tNew.kcal)} + بروتين 1.8 جم/كجم)</small></span></label>`:""}
    <div class="row"><button class="btn grow" data-close2>إلغاء</button><button class="btn primary grow" id="pbApply">اعتماد المسودة ✓</button></div>`;
  host.querySelector("[data-close2]").onclick=closeSheet;
  host.scrollIntoView({behavior:"smooth",block:"start"});
  host.querySelector("#pbApply").onclick=async()=>{
    const doTrain=host.querySelector("#pbDoTrain").checked, doFood=!!host.querySelector("#pbDoFood")?.checked;
    if(!doTrain&&!doFood) return toast("اختار اللي هيتطبق من المسودة");
    if(doTrain && S.program.length && !confirm(`استبدال برنامج ${p.full_name||"العميل"} الحالي بمسودة «${sys.name}»؟\n\nهيتمسح البرنامج الحالي وكل المجموعات المسجلة على تمارينه، ومينفعش ترجعها.\n\nمتأكد؟`)) return;
    const btn=host.querySelector("#pbApply"); btn.disabled=true; btn.textContent="⏳ بيتطبق…";
    if(doTrain){
      const { error:de } = await sb.from("program_exercises").delete().eq("client_id",p.id);
      if(de){ btn.disabled=false; btn.textContent="اعتماد المسودة ✓"; return toast(de.message); }
      const { error } = await sb.from("program_exercises").insert(planRows(p.id, plan));
      if(error){ btn.disabled=false; btn.textContent="اعتماد المسودة ✓"; return toast(error.message); }
      const { error:pe } = await sb.from("profiles").update({training_days:plan.length, split_key:sys.key, split_name:sys.name+" (مسودة معتمدة)", level, goal, program_started_at:new Date().toISOString(), deload_weeks:(typeof DELOAD_DEFAULT!=="undefined"?DELOAD_DEFAULT[level]:null)||[]}).eq("id",p.id);
      if(pe){ btn.disabled=false; btn.textContent="اعتماد المسودة ✓"; return toast(pe.message); }
    }
    if(doFood){
      const { error:fe } = await sb.from("profiles").update({manual_kcal:Math.round(tNew.kcal), protein_gpk:1.8}).eq("id",p.id);
      if(fe){ btn.disabled=false; btn.textContent="اعتماد المسودة ✓"; return toast(fe.message); }
    }
    closeSheet(); toast("✓ المسودة اتطبقت على نسخة "+(p.full_name||"العميل"));
    await refreshClient(); S.tab="setup"; S.setupTab="program"; render();
  };
}
