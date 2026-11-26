/* ======================================================================
   Mofit — training extras (v5.5)
   1) Cardio plan + daily step goal   (coach sets · client sees weekly progress)
   2) Per-exercise history            (best estimated 1RM per week + table)
   3) Finish-workout summary          (duration · session RPE · volume → weekly load)
   4) Block-end program review        (coach alert + block performance summary)
   ====================================================================== */

/* ---------- 1) cardio + steps ---------- */
const CARDIO_TYPES = ["مشي سريع","مشي على المشاية بميل","عجلة ثابتة","إليبتكال","جري","سلم (Stair climber)","نط حبل","سباحة","أي نوع تحبه"];
const CARDIO_INT = [
  ["low","خفيف – Zone 2","تقدر تتكلم بجمل كاملة وانت بتتمرن"],
  ["mod","متوسط","بتتكلم بكلمات متقطعة"],
  ["hiit","فترات عالية (HIIT)","30 ث سريع جداً / 60–90 ث هادي – بعد الإحماء"],
];
const cardioInt = k => CARDIO_INT.find(x=>x[0]===k) || CARDIO_INT[0];
function weekRange(p,wk){ const s=addDays(p.start_date||today(),(wk-1)*7); return [s, addDays(s,6)]; }

function cardioCardHTML(p, H, wk){
  const cp=p.cardio_plan, goal=+p.steps_goal||0;
  if(!(cp&&cp.sessions) && !goal) return "";
  const [a,b]=weekRange(p,wk), W=H.filter(h=>h.log_date>=a&&h.log_date<=b);
  const done=W.filter(h=>(+h.cardio_min||0)>0), mins=done.reduce((s,h)=>s+(+h.cardio_min||0),0);
  const tSteps=H.find(h=>h.log_date===today())?.steps, stepsW=avg(W.map(h=>h.steps).filter(v=>v!==null&&v!==undefined));
  const it=cp?cardioInt(cp.intensity):null;
  return `<div class="card"><div class="card-h"><div class="ic acc">🏃</div><h2>الكارديو والخطوات<small>الأسبوع ${wk}</small></h2><button class="btn sm" id="goCardio">سجّل</button></div>
    ${cp&&cp.sessions?`<div class="cardio-plan"><b>${esc(cp.type||"كارديو")}</b> · ${fmt(cp.sessions)} مرات في الأسبوع × ${fmt(cp.minutes)} دقيقة
      <div class="hint" style="margin:2px 0 0">${esc(it[1])} – ${esc(it[2])}${cp.notes?`<br>📝 ${esc(cp.notes)}`:""}</div></div>
      ${macroRow("مرات الكارديو",done.length,+cp.sessions,"مرة")}${macroRow("دقايق الأسبوع",mins,(+cp.sessions)*(+cp.minutes||0),"دقيقة","navy")}`:""}
    ${goal?`${macroRow("👣 خطوات النهارده",+tSteps||0,goal,"خطوة")}<p class="hint" style="margin:0">متوسط الأسبوع: <b class="num">${fmt(stepsW)}</b> من ${fmt(goal)}</p>`:""}</div>`;
}
function wireCardioCard(){ const b=$("#goCardio"); if(b) b.onclick=()=>{ S.tab="habits"; S.date=today(); render(); }; }

function cardioEditorHTML(p){
  const cp=p.cardio_plan||{};
  return `<div class="card"><div class="card-h"><div class="ic acc">🏃</div><h2>الكارديو والخطوات<small>بيظهر للعميل في الرئيسية مع تقدمه في الأسبوع</small></h2></div>
    <div class="grid2">
      <label class="f">نوع الكارديو<select id="cType"><option value="">— بدون كارديو —</option>${CARDIO_TYPES.map(t=>`<option ${cp.type===t?"selected":""}>${t}</option>`).join("")}</select></label>
      <label class="f">الشدة<select id="cInt">${CARDIO_INT.map(([k,l])=>`<option value="${k}" ${cp.intensity===k?"selected":""}>${l}</option>`).join("")}</select></label>
      <label class="f">مرات في الأسبوع<input id="cSes" type="number" inputmode="numeric" min="0" max="14" value="${esc(cp.sessions??"")}"></label>
      <label class="f">دقايق كل مرة<input id="cMin" type="number" inputmode="numeric" min="0" max="180" value="${esc(cp.minutes??"")}"></label>
      <label class="f">👣 هدف الخطوات اليومي<input id="cSteps" type="number" inputmode="numeric" min="0" max="50000" step="500" placeholder="مثلاً 8000" value="${esc(p.steps_goal??"")}"></label>
    </div>
    <label class="f">ملاحظة للعميل<input id="cNote" maxlength="150" placeholder="مثلاً: بعد التمرين أو في أيام الراحة" value="${esc(cp.notes??"")}"></label>
    <button class="btn navy block" id="cSave">حفظ الكارديو والخطوات</button></div>`;
}
function wireCardioEditor(p){
  $("#cSave").onclick=async()=>{
    const type=$("#cType").value, ses=parseInt($("#cSes").value)||0, min=parseInt($("#cMin").value)||0, steps=parseInt($("#cSteps").value)||null;
    if(ses<0||ses>14||min<0||min>180||(steps!==null&&(steps<0||steps>50000))) return toast("راجع الأرقام");
    if(type&&(!ses||!min)) return toast("اكتب عدد المرات والدقايق");
    const cardio_plan = type ? {type, intensity:$("#cInt").value, sessions:ses, minutes:min, notes:$("#cNote").value.trim().slice(0,150)||null} : null;
    const { error } = await sb.from("profiles").update({cardio_plan, steps_goal:steps}).eq("id",p.id);
    if(error) return toast(error.message); await refreshClient(); toast("✓ اتحفظ الكارديو");
  };
}

/* ---------- 2) per-exercise history ---------- */
async function openExHistory(ex){
  const p=S.client;
  const body=openSheet(`<div class="between" style="margin-bottom:8px"><b>📈 ${esc(ex.name)}</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div><div id="exH"><p class="hint">⏳ بيتحمل…</p></div>`);
  const { data } = await sb.from("set_logs").select("week,set_no,reps,weight,rir,failure,notes").eq("exercise_id",ex.id).order("week").order("set_no");
  const L=(data||[]).filter(logged), host=body.querySelector("#exH");
  if(!L.length){ host.innerHTML=emptyBox("📈","لسه مفيش سجل للتمرين ده","أول مجموعة تسجلها هتظهر هنا مع أفضل 1RM والتطور أسبوع بأسبوع.","","es-sm"); return; }
  const weeks=[...new Set(L.map(s=>s.week))].sort((a,b)=>a-b);
  const rows=weeks.map(w=>{ const ws=L.filter(s=>s.week===w), best=ws.reduce((m,s)=>(e1rm(s)||0)>(e1rm(m)||0)?s:m, ws[0]);
    return {w, best:e1rm(best)||0, top:best, sets:ws.length, vol:ws.reduce((a,s)=>a+(+s.reps||0)*(+s.weight||0),0), fail:ws.filter(isFailure).length}; });
  const first=rows.find(r=>r.best), last=[...rows].reverse().find(r=>r.best), ch=first&&last&&first!==last?(last.best-first.best)/first.best:null;
  const peak=Math.max(...rows.map(r=>r.best));
  host.innerHTML=`<div class="grid3" style="margin-bottom:6px"><div class="stat dark"><div class="l">أفضل 1RM</div><div class="v num">${fmt(peak,1)}</div><div class="s">كجم تقديري</div></div>
      <div class="stat ${ch!==null&&ch>0?"acc":""}"><div class="l">التطور</div><div class="v num">${ch===null?"—":(ch>0?"+":"")+fmt(ch*100,1)+"%"}</div><div class="s">من أول أسبوع</div></div>
      <div class="stat"><div class="l">أسابيع</div><div class="v num">${rows.length}</div></div></div>
    ${lineChart(rows.filter(r=>r.best).map(r=>({x:r.w,y:+r.best.toFixed(1)})),"1RM تقديري (كجم) لكل أسبوع")}
    <div class="scrollx" style="margin-top:8px"><table><tr><th>أسبوع</th><th>أفضل مجموعة</th><th>1RM</th><th>مجموعات</th><th>الحجم</th><th>🔥</th></tr>
      ${[...rows].reverse().map(r=>`<tr><td><b>${r.w}</b>${isDeload(p,r.w)?" 🔄":""}</td><td><span class="num">${fmt(r.top.reps)}×${fmt(r.top.weight,1)}</span>${r.top.rir!==null&&r.top.rir!==undefined?` <small class="muted">RIR ${r.top.rir}</small>`:""}</td><td class="num">${r.best?fmt(r.best,1):"—"}</td><td>${r.sets}</td><td class="num">${fmt(r.vol)}</td><td>${r.fail||""}</td></tr>`).join("")}</table></div>
    ${ch!==null&&rows.length>=4&&ch<=0.005?`<p class="supp-warn" style="margin-top:8px">التمرين ثابت من فترة – جرّب تغيّر مدى العدات أو تبدّله بتمرين شبهه.</p>`:""}`;
}

/* ---------- 3) finish workout ---------- */
const RPE_TXT = {1:"سهل جداً",2:"سهل",3:"معتدل",4:"معتدل+",5:"صعب شوية",6:"صعب",7:"صعب جداً",8:"قريب من الأقصى",9:"تقريباً أقصى حاجة",10:"أقصى مجهود"};
const wStartKey = (pid,day) => `mofit_wstart_${pid}_${today()}_${day}`;
function markWorkoutStart(pid,day){ try{ const k=wStartKey(pid,day); if(!localStorage.getItem(k)) localStorage.setItem(k,String(Date.now())); }catch(e){} }
function workoutStart(pid,day){ try{ return +localStorage.getItem(wStartKey(pid,day))||null; }catch(e){ return null; } }

async function finishCardHTML(p, day, week){
  const { data } = await sb.from("workout_sessions").select("*").eq("client_id",p.id).eq("log_date",today()).eq("day_no",day).maybeSingle();
  return `<div class="card finish ${data?"done":""}"><div class="card-h"><div class="ic acc">🏁</div><h2>${data?"✓ التمرين اتسجل":"خلّصت التمرين؟"}<small>${data?`${fmt(data.duration_min)} دقيقة · مجهود ${data.rpe}/10 · ${fmt(data.volume)} كجم حجم`:"سجّل المدة والمجهود عشان الكوتش يتابع حمل التمرين"}</small></h2>
    <button class="btn sm ${data?"":"primary"}" id="finBtn">${data?"تعديل":"🏁 إنهاء التمرين"}</button></div></div>`;
}
function openFinish(p, day, week, exs, logs, onDone){
  const ids=new Set(exs.map(e=>e.id)), mine=logs.filter(l=>ids.has(l.exercise_id)&&l.week===week&&logged(l));
  const vol=mine.reduce((a,s)=>a+(+s.reps||0)*(+s.weight||0),0), st=workoutStart(p.id,day);
  const dur=st?Math.min(300,Math.max(1,Math.round((Date.now()-st)/60000))):60;
  const body=openSheet(`<div class="between"><b>🏁 ملخص التمرين</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
    <div class="grid3" style="margin:10px 0"><div class="stat dark"><div class="l">مجموعات</div><div class="v num">${mine.length}</div></div>
      <div class="stat"><div class="l">الحجم</div><div class="v num">${fmt(vol)}</div><div class="s">كجم</div></div>
      <div class="stat"><div class="l">🔥 فشل</div><div class="v num">${mine.filter(isFailure).length}</div></div></div>
    <label class="f">⏱ مدة التمرين (دقيقة)<input id="fDur" type="number" inputmode="numeric" min="1" max="300" value="${dur}"></label>
    <div class="muted" style="font-weight:700;margin-bottom:6px">التمرين ككل كان صعب قد إيه؟ (1–10)</div>
    <div class="rpe" id="fRpe">${[...Array(10)].map((_,i)=>`<button data-v="${i+1}">${i+1}</button>`).join("")}</div>
    <p class="hint" id="fRpeTxt" style="min-height:1.4em">اختار رقم</p>
    <label class="f">ملاحظة للكوتش (اختياري)<input id="fNote" maxlength="300" placeholder="مثلاً: كتفي كان تقيل النهارده"></label>
    <button class="btn primary block" id="fSave">حفظ</button>`);
  let rpe=null;
  body.querySelectorAll("#fRpe button").forEach(b=>b.onclick=()=>{ rpe=+b.dataset.v; body.querySelectorAll("#fRpe button").forEach(x=>x.classList.toggle("on",x===b)); body.querySelector("#fRpeTxt").textContent=RPE_TXT[rpe]; });
  body.querySelector("#fSave").onclick=async()=>{
    const d=parseInt(body.querySelector("#fDur").value); if(!(d>=1&&d<=300)) return toast("اكتب مدة صحيحة");
    if(!rpe) return toast("اختار درجة المجهود");
    const row={client_id:p.id, log_date:today(), day_no:day, week, duration_min:d, rpe, sets_done:mine.length, volume:Math.round(vol), notes:body.querySelector("#fNote").value.trim()||null, updated_at:new Date().toISOString()};
    const { error, queued } = await dbWrite({op:"upsert",table:"workout_sessions",row,onConflict:"client_id,log_date,day_no"});
    if(error) return toast(error.message);
    const { data:prev } = await sb.from("workout_sessions").select("volume,log_date").eq("client_id",p.id).eq("day_no",day).lt("log_date",today()).order("log_date",{ascending:false}).limit(1);
    const pv=+prev?.[0]?.volume||0, dv=pv&&vol?(vol-pv)/pv:null;
    closeSheet(); burst(); toast(queued?"📴 اتحفظ على الموبايل":dv!==null?`✓ برافو! الحجم ${dv>=0?"زاد":"قل"} ${Math.abs(dv*100).toFixed(0)}% عن آخر مرة`:"✓ برافو! اتسجل التمرين 💪");
    try{ localStorage.removeItem(wStartKey(p.id,day)); }catch(e){}
    onDone&&onDone();
  };
}

/* weekly training load (sRPE = minutes × RPE) — home card for client & coach */
async function loadCardHTML(p){
  const { data } = await sb.from("workout_sessions").select("log_date,week,duration_min,rpe,volume").eq("client_id",p.id).order("log_date");
  const W=data||[]; if(!W.length) return "";
  const wkNow=currentWeek(p), by={}; W.forEach(s=>{ (by[s.week]=by[s.week]||[]).push(s); });
  const load=w=>(by[w]||[]).reduce((a,s)=>a+(+s.duration_min||0)*(+s.rpe||0),0);
  const weeks=[...Array(Math.min(wkNow,8))].map((_,i)=>wkNow-Math.min(wkNow,8)+1+i);
  const cur=load(wkNow), last=load(wkNow-1), base=avg([wkNow-1,wkNow-2,wkNow-3].filter(w=>w>=1&&by[w]).map(load));
  const ratio=base?Math.max(cur,last)/base:null, hiRpe=avg((by[wkNow]||[]).concat(by[wkNow-1]||[]).map(s=>+s.rpe));
  const warn = ratio&&ratio>1.5 ? "قفزة كبيرة في حمل التمرين عن متوسط آخر 3 أسابيع – خد بالك من الإرهاق والإصابات."
             : hiRpe&&hiRpe>=8.5 ? "المجهود عالي جداً في أغلب التمارين الأسبوعين دول – ممكن محتاج ديلود أو نوم أكتر." : "";
  const mx=Math.max(1,...weeks.map(load));
  return `<div class="card"><div class="card-h"><div class="ic">📊</div><h2>حمل التمرين<small>الدقايق × المجهود · ${(by[wkNow]||[]).length} تمرين متسجّل الأسبوع ده</small></h2></div>
    <div class="loadbars">${weeks.map(w=>`<div class="${w===wkNow?"cur":""}"><i style="height:${load(w)/mx*100}%"></i><span>${w}</span></div>`).join("")}</div>
    <div class="grid3" style="margin-top:8px"><div class="stat"><div class="l">الأسبوع ده</div><div class="v num">${fmt(cur)}</div></div>
      <div class="stat"><div class="l">متوسط المجهود</div><div class="v num">${fmt(avg((by[wkNow]||[]).map(s=>+s.rpe)),1)}</div><div class="s">من 10</div></div>
      <div class="stat"><div class="l">متوسط المدة</div><div class="v num">${fmt(avg((by[wkNow]||[]).map(s=>+s.duration_min)))}</div><div class="s">دقيقة</div></div></div>
    ${warn?`<p class="supp-warn" style="margin-top:8px">${warn}</p>`:""}</div>`;
}

/* ---------- 4) block-end program review ---------- */
function blockAlert(c){
  if(!c.active||!c.start_date) return null;
  const wk=currentWeek(c), b=blockOf(wk);
  if(wInBlock(wk)<11 || maxWeek(c)<=b*BLOCK || (+c.reviewed_block||0)>=b) return null;
  return {p:2, icon:"🔁", text:`البلوك ${b} بيخلص – راجع البرنامج`};
}
async function blockReviewHTML(p){
  const wk=currentWeek(p), b=blockOf(wk), a=blockAlert(p);
  if(!a) return "";
  const wks=blockWeeks(wk,p), ids=S.program.map(e=>e.id);
  const { data } = ids.length ? await sb.from("set_logs").select("exercise_id,week,reps,weight,rir").in("exercise_id",ids).gte("week",wks[0]).lte("week",wks[BLOCK-1]) : {data:[]};
  const L=data||[], rows=S.program.map(ex=>{ const m=L.filter(s=>s.exercise_id===ex.id&&e1rm(s)); if(!m.length) return null;
      const ws=[...new Set(m.map(s=>s.week))].sort((x,y)=>x-y), best=w=>Math.max(...m.filter(s=>s.week===w).map(e1rm));
      const f=best(ws[0]), l=best(ws[ws.length-1]); return {ex, ch:ws.length>1?(l-f)/f:null, n:ws.length}; }).filter(Boolean)
    .sort((x,y)=>(x.ch??0)-(y.ch??0));
  return `<div class="card" style="border:1.5px solid var(--acc)"><div class="card-h"><div class="ic acc">🔁</div><h2>مراجعة البرنامج قبل البلوك ${b+1}<small>البلوك ${b} (أسابيع ${wks[0]}–${wks[BLOCK-1]}) بيخلص – قرر هتكمّل بنفس البرنامج ولا تعدّله</small></h2></div>
    ${rows.length?`<div class="scrollx"><table><tr><th style="text-align:start">التمرين</th><th>أسابيع</th><th>تطور 1RM</th></tr>${rows.map(r=>`<tr><td style="text-align:start;font-size:.74rem">${esc(r.ex.name)}</td><td>${r.n}</td><td>${r.ch===null?"—":`<span class="pill ${r.ch>0.02?"good":r.ch<0?"navy":""}">${r.ch>=0?"▲":"▼"} ${Math.abs(r.ch*100).toFixed(1)}%</span>`}</td></tr>`).join("")}</table></div>
      <p class="hint">التمارين اللي فوق (أقل تطور) هي أولى بالتغيير: بدّل التمرين، غيّر مدى العدات، أو زوّد مجموعة.</p>`:`<p class="hint">مفيش تسجيلات كفاية في البلوك ده للمقارنة.</p>`}
    <p class="hint">عدّل التمارين من "تعديل البرنامج يدوياً" تحت، أو طبّق نظام جديد من الكارت اللي فوق – وبعدين اضغط تم.</p>
    <button class="btn primary block" id="brDone">✓ راجعت البرنامج للبلوك ${b+1}</button></div>`;
}
function wireBlockReview(p, el){
  const b=$("#brDone"); if(!b) return;
  b.onclick=async()=>{ const { error } = await sb.from("profiles").update({reviewed_block:blockOf(currentWeek(p))}).eq("id",p.id); if(error) return toast(error.message); await refreshClient(); toast("✓ تمام"); setupProgram(el); };
}



/* ---------- streaks, weekly goal ring, milestone badges (client home) ---------- */
const BADGES=[[1,"🌱","أول تمرين"],[5,"💪","٥ تمارين"],[10,"🔥","١٠ تمارين"],[25,"⚡","٢٥ تمرين"],[50,"🏆","٥٠ تمرين"],[100,"🌟","١٠٠ تمرين"]];

/* heatmap styles */
(function(){ if(document.getElementById("hm-st")) return; const st=document.createElement("style"); st.id="hm-st"; st.textContent=`
.hm-wrap{margin-top:12px}
.hm-title{font-size:.72rem;font-weight:800;color:var(--mut,#8A93A6);margin-bottom:6px}
.hm{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:3px;direction:ltr;justify-content:end;overflow-x:auto;padding-bottom:4px;padding-inline:4px}
.hm-c{width:11px;height:11px;border-radius:3px;background:#EEF0F4;opacity:0;animation:hmPop .35s ease forwards}
.dark .hm-c{background:#232B3A}
.hm-c.l1{background:#FFD9BF}.hm-c.l2{background:#FFA66B}.hm-c.l3{background:#FF6B1A}
.hm-c.today{outline:2px solid #FF6B1A;outline-offset:1px}
@keyframes hmPop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
.hm-legend{display:flex;gap:4px;align-items:center;justify-content:flex-end;margin-top:6px;font-size:.62rem;color:var(--mut,#8A93A6)}
.hm-legend i{width:11px;height:11px;border-radius:3px;display:inline-block}
`; document.head.appendChild(st); })();

/* ---------- training-year heatmap (inside streak card) ---------- */
function heatmapHTML(p){
  const W=(window._hmSessions||[]);
  const cnt={}; W.forEach(s=>{ if(s.log_date) cnt[s.log_date]=(cnt[s.log_date]||0)+1; });
  const t=today();
  const start=addDays(t,-(52*7-1));
  const dow=new Date(start+"T00:00:00").getDay(); // 6=Sat
  const aligned=addDays(start,-((dow+1)%7)); // rows Sat..Fri
  let cells=[], k=0;
  for(let d=aligned; d<=t; d=addDays(d,1)){
    const n=cnt[d]||0, lvl=n>=3?3:n;
    const label=window.dDay?dDay(d+"T00:00:00"):d;
    cells.push(`<div class="hm-c${lvl?" l"+lvl:""}${d===t?" today":""}" style="animation-delay:${Math.min(k*4,900)}ms" title="${label}${n?` · ${n>=3?"3+":n} ${n>2?"تمارين":"تمرين"}`:" · راحة"}"></div>`); k++;
  }
  return `<div class="hm-wrap"><div class="hm-title">سجل السنة</div><div class="hm" role="img" aria-label="خريطة التزام السنة">${cells.join("")}</div>
    <div class="hm-legend">أقل <i style="background:#EEF0F4"></i><i style="background:#FFD9BF"></i><i style="background:#FFA66B"></i><i style="background:#FF6B1A"></i> أكتر</div></div>`;
}
async function streakCardHTML(p){
  const { data } = await sb.from("workout_sessions").select("log_date,week").eq("client_id",p.id);
  const W=data||[]; window._hmSessions=W;
  const goal=Math.max(1,new Set(S.program.map(e=>e.day_no)).size||3), wkNow=currentWeek(p), cnt={};
  W.forEach(s=>{ cnt[s.week]=(cnt[s.week]||0)+1; });
  const done=cnt[wkNow]||0; let streak=0, w=done>=goal?wkNow:wkNow-1;
  while(w>=1 && (cnt[w]||0)>=goal){ streak++; w--; }
  const total=W.length, earned=BADGES.filter(b=>total>=b[0]), next=BADGES.find(b=>total<b[0]);
  const R=34, C=2*Math.PI*R, off=C*(1-Math.min(1,done/goal));
  const key="mofit_badges_"+p.id; let seen=0; try{ seen=+localStorage.getItem(key)||0; }catch(e){}
  window._streakNew = earned.length>seen; window._streakKey=key; window._streakCount=earned.length;
  return `<div class="card streak"><div class="card-h"><div class="ic acc">🔥</div><h2>التزامك<small>${streak?`${streak} ${streak>2?"أسابيع":"أسبوع"} متتالي بتحقق هدفك`:"ابدأ سلسلتك – حقق هدف الأسبوع"}</small></h2></div>
    <div class="streak-row"><div class="sring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${R}" fill="none" stroke="#EEF0F4" stroke-width="8"/><circle class="sring-v" cx="40" cy="40" r="${R}" fill="none" stroke="url(#sg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" style="--c:${C.toFixed(1)};--o:${off.toFixed(1)}" transform="rotate(-90 40 40)"/><defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="#FF6B1A"/><stop offset="1" stop-color="#FFB347"/></linearGradient></defs></svg><b class="num">${done}/${goal}</b></div>
      <div class="streak-info"><div class="flame ${streak?"on":""}">🔥<span class="num">${streak}</span></div><small>${done>=goal?"✅ هدف الأسبوع اتحقق!":`فاضل ${goal-done} ${goal-done>2?"تمارين":"تمرين"} الأسبوع ده`}</small></div></div>
    <div class="badges">${BADGES.map(b=>`<div class="badge ${total>=b[0]?"got":""}" title="${b[2]}"><i>${b[1]}</i><small>${b[2]}</small></div>`).join("")}</div>
    ${next?`<p class="hint" style="margin:8px 0 0">${next[0]-total} تمرين وتاخد شارة ${next[1]} ${next[2]}</p>`:""}
    ${heatmapHTML(p)}
    <button class="btn sm ghost block" style="margin-top:10px" onclick="shareStreakCard(this)" data-streak="${streak}" data-total="${total}" data-done="${done}" data-goal="${goal}" data-badge="${earned.length?earned[earned.length-1][1]:""}" data-badgename="${earned.length?earned[earned.length-1][2]:""}">📤 شارك تقدمك</button></div>`;
}
function streakAfter(p){ if(window._streakNew){ try{ localStorage.setItem(window._streakKey,window._streakCount); }catch(e){} setTimeout(()=>{ window.mofitCelebrate?mofitCelebrate.badge():(typeof burst==="function"&&burst()); toast("🎖 شارة جديدة اتفتحت!"); },700); } }
