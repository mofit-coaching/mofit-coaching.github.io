/* ======================================================================
   COACH BRAIN (عقل الكوتش) — مسودات أسبوعية بقواعد الكوتش نفسه.
   Rules are the coach's own, already encoded in the app:
   - double progression + RIR autoregulation (pro.js progressionHint)
   - plateau = lift flat ≤1% over 3 logged weeks (coach.js progressAnalysis)
   - deload triggers: ≥50% of last week's sets to failure, or weights
     dropping in ≥50% of tracked lifts (coach.js progressAnalysis)
   - goal-rate kcal bands: cut -0.5→-1%/wk, bulk +0.25→+0.5%/wk,
     adjust ±100-200 kcal (lab.js rateVerdict)
   DRAFT ONLY: nothing writes until the coach taps "اعتماد" on a single
   suggestion, with قبل/بعد shown. Applies touch only that client's own
   rows (program_exercises by id, profiles.deload_weeks,
   profiles.manual_kcal). Templates and the coach's original program
   are never read for writing. No schema change, no external API.
   ====================================================================== */

/* ---------- dismissals (coach-local, 7 days) ---------- */
function brainKey(s){ return s.kind+":"+(s.exId||"profile"); }
function brainDismissMap(cid){ try{ return JSON.parse(localStorage.getItem("mofit_brain_dismiss_"+cid)||"{}"); }catch(_){ return {}; } }
function brainDismissedSet(cid){
  const m=brainDismissMap(cid), now=Date.now(), out=new Set();
  Object.keys(m).forEach(k=>{ if(now-m[k]<7*24*3600*1000) out.add(k); });
  return out;
}
function brainDismiss(cid,key){ const m=brainDismissMap(cid); m[key]=Date.now(); try{ localStorage.setItem("mofit_brain_dismiss_"+cid,JSON.stringify(m)); }catch(_){} }

/* ---------- the engine: client profile + program + logs → suggestions ---------- */
/* weights: [[week,kg],...] from coach_overview. adherence7: 0..1 or null. */
function coachBrainSuggestions(p,exs,sets,weights,adherence7){
  const wk=currentWeek(p), out=[];
  const byEx={};
  (sets||[]).forEach(s=>{ if(logged(s)&&s.week<=wk){ const b=byEx[s.exercise_id]=byEx[s.exercise_id]||{}; (b[s.week]=b[s.week]||[]).push(s); } });
  const best=ws=>Math.max(0,...ws.map(s=>e1rm(s)||0));
  let dropped=0, tracked=0;

  exs.forEach(ex=>{
    const W=byEx[ex.id]; if(!W) return;
    const wks=Object.keys(W).map(Number).filter(w=>!isDeload(p,w)).sort((a,b)=>a-b);
    if(!wks.length) return;
    const B=wks.map(w=>best(W[w])), n=B.length;

    /* plateau → swap to a proven alternative (his 3-week flat rule) */
    if(n>=3){
      const base=B[n-3];
      if(base>0&&Math.max(B[n-2],B[n-1])<=base*1.01&&wks[n-1]>=wk-1){
        const alt=(altsFor(ex.name)||[]).find(a=>!exs.some(e=>e.name===a));
        if(alt) out.push({ kind:"swap", exId:ex.id, icon:"⇄",
          title:`تبديل <b dir="ltr" translate="no" lang="en">${esc(ex.name)}</b>`,
          why:`أفضل وزن (e1RM ≈ ${fmt(Math.round(B[n-1]))} كجم) ثابت من 3 أسابيع – تغيير الزاوية بيكسر الثبات`,
          before:`<b dir="ltr" translate="no" lang="en">${esc(ex.name)}</b>`,
          after:`<b dir="ltr" translate="no" lang="en">${esc(alt)}</b>`,
          note:"سجل العميل وأوزانه القديمة بتفضل محفوظة – بيتغير اسم التمرين بس في نسخته هو",
          run:async()=>sb.from("program_exercises").update({name:alt}).eq("id",ex.id).then(r=>r.error) });
      }
    }
    if(n>=2){ if(B[n-1]<B[n-2]) dropped++; tracked++; }

    /* too easy twice in a row → +1 set (his volume lever, cap 6) */
    const rr=repRange(ex.target_reps);
    if(wks.length>=2&&rr&&ex.sets<6){
      const last2=wks.slice(-2);
      const easy=last2.every(w=>{
        const ss=W[w].filter(s=>s.reps!=null&&s.weight!=null&&+s.weight>0);
        return ss.length>0&&ss.every(s=>+s.reps>=rr[1])&&ss.every(s=>s.rir!==null&&s.rir!==undefined&&+s.rir>=2);
      });
      if(easy) out.push({ kind:"sets", exId:ex.id, icon:"➕",
        title:`مجموعة إضافية لـ <b dir="ltr" translate="no" lang="en">${esc(ex.name)}</b>`,
        why:`كمل آخر المدى (${rr[1]} عدّة) في كل المجموعات مرتين ورا بعض وفاضل معاه 2+ في الاحتياط – الحجم لسه فيه متسع`,
        before:`${ex.sets} مجموعات`, after:`${ex.sets+1} مجموعات`,
        run:async()=>sb.from("program_exercises").update({sets:ex.sets+1}).eq("id",ex.id).then(r=>r.error) });
    }
  });

  /* deload (his two triggers, mirrors progressAnalysis) */
  if(!isDeload(p,wk)){
    const lastW=(sets||[]).filter(s=>s.week===wk-1&&logged(s));
    const fail=lastW.filter(isFailure).length;
    let why=null;
    if(lastW.length>=10&&fail/lastW.length>=0.5) why=`${Math.round(fail/lastW.length*100)}% من مجموعات الأسبوع اللي فات وصلت للفشل`;
    else if(tracked>=3&&dropped/tracked>=0.5) why=`الأوزان نزلت في ${dropped} من ${tracked} تمارين متتبعة`;
    if(why){
      const cur=Array.isArray(p.deload_weeks)?p.deload_weeks.slice():[];
      const next=wInBlock(wk+1);
      if(!cur.includes(next)) out.push({ kind:"deload", icon:"🔄",
        title:"أسبوع ديلود الجاي",
        why:`${why} – الجسم محتاج ينزل الشحنة (مجموعات أقل ~40% وRIR 3-4 زي نظامك)`,
        before:`أسابيع الديلود: ${cur.length?cur.join("، "):"مفيش"}`,
        after:`إضافة الأسبوع ${next} من البلوك`,
        run:async()=>sb.from("profiles").update({deload_weeks:[...cur,next].sort((a,b)=>a-b)}).eq("id",p.id).then(r=>r.error) });
    }
  }

  /* calories from weight-trend vs his goal-rate bands (rateVerdict) */
  const t=trend((weights||[]).map(([week,weight])=>({week,weight})));
  const goal=p.goal||"", cut=/تنشيف/.test(goal), bulk=/زيادة/.test(goal);
  if(t&&!t.odd&&(cut||bulk)){
    const kcalNow=targets(p).kcal, adhOk=adherence7===null||adherence7===undefined||+adherence7>=0.7;
    let delta=0, why="";
    if(cut&&t.pct<-1.2){ delta=150; why=`بيخسر ${fmt(Math.abs(t.pct),1)}% في الأسبوع – أسرع من معدلك المثالي (0.5-1%) وده بيهدد العضل`; }
    else if(cut&&t.pct>-0.4&&adhOk){ delta=-150; why=`الوزن شبه ثابت (${fmt(t.pct,1)}%/أسبوع) والالتزام كويس – العطل في السعرات مش في العميل`; }
    else if(bulk&&t.pct>0.8){ delta=-150; why=`بيزيد ${fmt(t.pct,1)}% في الأسبوع – أسرع من معدلك المثالي (0.25-0.5%) والزيادة غالباً دهون`; }
    else if(bulk&&t.pct<0.2&&adhOk){ delta=150; why=`الوزن مش بيتحرك (${fmt(t.pct,1)}%/أسبوع) رغم الالتزام – الفائض محتاج يزيد`; }
    if(delta&&kcalNow){
      const next=Math.max(1200,Math.round((kcalNow+delta)/50)*50), cur=Math.round(kcalNow);
      if(next!==cur) out.push({ kind:"kcal", icon:"🍽",
        title:`تعديل السعرات ${delta>0?"+":"−"}${Math.abs(next-cur)}`,
        why,
        before:`${fmt(cur)} kcal`, after:`${fmt(next)} kcal`,
        note:p.manual_kcal?"بيحدّث السعرات اليدوية الحالية":"هيتسجل كسعرات يدوية – تقدر ترجع للحسبة التلقائية بمسح الخانة من بيانات العميل",
        run:async()=>sb.from("profiles").update({manual_kcal:next}).eq("id",p.id).then(r=>r.error) });
    }
  }
  return out.slice(0,8);
}

/* ---------- per-client tab: 🧠 عقل الكوتش ---------- */
async function viewBrain(el){
  const p=S.client, wk=currentWeek(p);
  el.innerHTML=`<div class="card dark"><div class="card-h"><div class="ic">🧠</div><h2>عقل الكوتش<small>مسودات أسبوع ${wk} · محسوبة من تسجيلات ${esc(p.full_name||"العميل")} الفعلية</small></h2></div>
    <p class="hint" style="color:inherit;opacity:.85;margin:0">الاقتراحات دي من قواعدك أنت (التدرج المزدوج + RIR، الديلود، معدلات الوزن). مفيش حاجة بتتطبق لوحدها: كل اقتراح بيستناك تضغط اعتماد، والتعديل بيحصل على نسخة العميل ده بس – قوالبك وبرنامجك الأساسي ثابتين.</p></div>
  <div class="card" id="brainList"><p class="hint">⏳ بيحلّل التسجيلات…</p></div>`;
  const minW=Math.max(1,wk-8);
  const { data:sets, error } = await sb.from("set_logs").select("exercise_id,week,set_no,reps,weight,rir,failure").eq("client_id",p.id).gte("week",minW).range(0,4999);
  if(error){ $("#brainList").innerHTML=`<p class="hint">تعذر التحميل: ${esc(error.message)}</p>`; return; }
  const dismissed=brainDismissedSet(p.id);
  const sug=coachBrainSuggestions(p,S.program,sets||[],S.overview?.[p.id]?.weights,S.overview?.[p.id]?.adherence7)
    .filter(s=>!dismissed.has(brainKey(s)));
  const host=$("#brainList");
  if(!sug.length){
    host.innerHTML=`<div class="card-h"><div class="ic acc">✅</div><h2>مفيش اقتراحات دلوقتي</h2></div>
      <p class="hint">${(sets||[]).filter(logged).length<5?"التسجيلات لسه قليلة – أول ما يكمّل أسبوعين تسجيل هتلاقي مسودات هنا.":"الأرقام ماشية ضمن قواعدك – مفيش تعديل مطلوب الأسبوع ده 👌"}</p>`;
    return;
  }
  host.innerHTML=`<div class="card-h"><div class="ic acc">🧠</div><h2>${sug.length} ${sug.length===1?"اقتراح":"اقتراحات"}<small>اضغط اعتماد للي يعجبك – الباقي يتجاهل</small></h2></div>`+sug.map((s,i)=>`
    <div class="alert-row" style="align-items:flex-start;flex-wrap:wrap" data-sg="${i}">
      <div class="nm" style="flex:1;min-width:200px"><b>${s.icon} ${s.title}</b>
        <span class="pill acc-soft" style="display:block;text-align:start;white-space:normal">💡 ${s.why}</span>
        <span style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
          <span class="pill">قبل: ${s.before}</span><span class="pill acc">بعد: ${s.after}</span>
        </span>
        ${s.note?`<span class="hint" style="display:block;margin-top:4px">${esc(s.note)}</span>`:""}
      </div>
      <button type="button" class="btn sm primary" data-ok="${i}">اعتماد ✓</button>
      <button type="button" class="btn sm ghost" data-no="${i}">تجاهل</button>
    </div>`).join("")+`<p class="hint">التجاهل بيخفي الاقتراح 7 أيام. اعتماد أي اقتراح بيكتب على حساب العميل مباشرة وبتحصل مراجعة في سجل التعديلات بتاعك.</p>`;
  host.querySelectorAll("[data-no]").forEach(b=>b.onclick=()=>{ brainDismiss(p.id,brainKey(sug[+b.dataset.no])); toast("اتجاهل – مش هيظهر تاني الأسبوع ده"); viewBrain(el); });
  host.querySelectorAll("[data-ok]").forEach(b=>b.onclick=async()=>{
    const s=sug[+b.dataset.ok]; b.disabled=true; b.textContent="…";
    const err=await s.run(); b.disabled=false; b.textContent="اعتماد ✓";
    if(err){ toast(err.message); return; }
    toast("✓ اتطبق على نسخة "+(p.full_name||"العميل"));
    await refreshClient(); S.tab="setup"; S.setupTab="brain"; viewBrain(el);
  });
}

/* ---------- coach dashboard card: who has drafts waiting ---------- */
async function coachBrainCard(host,C){
  if(!host) return;
  const act=C.filter(c=>c.active);
  if(!act.length){ host.innerHTML=""; return; }
  host.innerHTML=`<div class="card-h"><div class="ic acc">🧠</div><h2>عقل الكوتش<small>مسودات تعديلات بانتظار اعتمادك</small></h2></div><p class="hint">بيحلّل…</p>`;
  const minW=Math.max(1,Math.min(...act.map(c=>currentWeek(c)))-8);
  const [{ data:sets }, { data:exs }] = await Promise.all([
    sb.from("set_logs").select("client_id,exercise_id,week,set_no,reps,weight,rir,failure").gte("week",minW).range(0,9999),
    sb.from("program_exercises").select("id,client_id,day_no,name,sets,target_reps,target_rir").in("client_id",act.map(c=>c.id)).range(0,4999) ]);
  const rows=act.map(c=>{
    const n=coachBrainSuggestions(c,(exs||[]).filter(e=>e.client_id===c.id),(sets||[]).filter(s=>s.client_id===c.id),S.overview?.[c.id]?.weights,S.overview?.[c.id]?.adherence7)
      .filter(s=>!brainDismissedSet(c.id).has(brainKey(s))).length;
    return { c, n };
  }).filter(r=>r.n>0).sort((a,b)=>b.n-a.n);
  host.innerHTML=`<div class="card-h"><div class="ic acc">🧠</div><h2>عقل الكوتش<small>${rows.length?rows.length+" عميل عندهم مسودات جاهزة لمراجعتك":"مفيش مسودات – كل البرامج ماشية على قواعدك 👌"}</small></h2></div>`+
    rows.map(({c,n})=>`<div class="alert-row" data-br="${c.id}"><div class="av">${initials(c)}</div><div class="nm"><b>${esc(c.full_name||c.email)}</b><span class="pill acc">🧠 ${n} ${n===1?"اقتراح":"اقتراحات"}</span></div></div>`).join("")+
    (rows.length?`<p class="hint">المسودة بتتطبق على نسخة العميل بس وبضغطة اعتماد منك – مفيش تعديل تلقائي.</p>`:"");
  host.querySelectorAll("[data-br]").forEach(r=>r.onclick=async()=>{
    await openClient(C.find(x=>x.id===r.dataset.br)); S.tab="setup"; S.setupTab="brain"; render(); window.scrollTo(0,0);
  });
}
