/* ======================================================================
   MOFIT PRO: check-ins, alerts, progression, deloads, diet templates,
   swaps, alternatives, subscriptions, offline queue, monthly report
   ====================================================================== */

/* ---------- 8) offline: cached reads + write queue ---------- */
const OQ_KEY="mofit_queue";
function cacheSet(k,v){ try{ localStorage.setItem("mofit_"+k, JSON.stringify(v)); }catch{} }
function cacheGet(k){ try{ return JSON.parse(localStorage.getItem("mofit_"+k)||"null"); }catch{ return null; } }
function queue(){ return cacheGet("queue")||[]; }
function isNetErr(e){ const m=String(e?.message||e||""); return !navigator.onLine || /fetch|network|Load failed|NetworkError/i.test(m); }
/* job: {op:"upsert"|"insert"|"delete", table, row?, onConflict?, match?} */
async function execWrite(job){
  try{
    let q=sb.from(job.table);
    if(job.op==="upsert") q=q.upsert(job.row,{onConflict:job.onConflict}).select().single();
    else if(job.op==="insert") q=q.insert(job.row).select().single();
    else { q=q.delete(); for(const [k,v] of Object.entries(job.match)) q=q.eq(k,v); }
    const { data, error } = await q;
    if(error) return isNetErr(error)?{net:true}:{error};
    return { data };
  }catch(e){ return isNetErr(e)?{net:true}:{error:{message:String(e.message||e)}}; }
}
async function dbWrite(job){
  if(!navigator.onLine) return enqueue(job);
  const r=await execWrite(job); return r.net? enqueue(job) : r;
}
function enqueue(job){ const qd=queue(); qd.push({...job, at:Date.now()}); cacheSet("queue",qd); drawOffline();
  return { data:{...(job.row||{}), id:job.row?.id||("local-"+Date.now())}, queued:true }; }
let flushing=false;
async function flushQueue(){
  if(flushing||!navigator.onLine) return drawOffline(); const qd=queue(); if(!qd.length) return drawOffline();
  flushing=true; cacheSet("queue",[]); const failed=[]; let sent=0;
  for(const job of qd){ if(failed.length){ failed.push(job); continue; } const r=await execWrite(job); if(r.net) failed.push(job); else sent++; }
  cacheSet("queue",[...failed,...queue()]); flushing=false;
  if(sent) toast(`✓ اتبعت ${sent} تسجيل كان أوفلاين`); drawOffline();
}
function drawOffline(){
  let el=document.getElementById("offbar"); const n=queue().length, off=!navigator.onLine;
  if(!off&&!n){ el?.remove(); return; }
  if(!el){ el=document.createElement("div"); el.id="offbar"; el.className="offbar"; document.body.appendChild(el); }
  el.innerHTML=off?`📴 أوفلاين – تسجيلك بيتحفظ على الموبايل ويتبعت لما النت يرجع${n?` (${n})`:""}`:`⏳ جاري إرسال ${n} تسجيل…`;
}
window.addEventListener("online",()=>{ drawOffline(); flushQueue(); });
window.addEventListener("offline",drawOffline);
if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});

/* ---------- 4) deloads ---------- */
const DELOAD_DEFAULT={"مبتدئ":[], "متوسط":[6], "متقدم":[4,8]};
/* deload weeks are stored as week-in-block (1–12) and repeat in every 12-week block */
function isDeload(p,w){ return Array.isArray(p?.deload_weeks) && p.deload_weeks.includes(wInBlock(w)); }
function weekSets(ex,p,w){ return isDeload(p,w) ? Math.max(1,Math.ceil(ex.sets*0.6)) : ex.sets; }

/* ---------- 3) progression (double progression + RIR autoregulation) ---------- */
/* Rules: move up only when the top of the rep range is hit with reps left in reserve (RIR 2+).
   Reps hit while grinding (RIR 0-1 / failure) = hold one more session.
   Reps under the range at failure = back off ~5% and rebuild the reps.
   Lower-body compounds step +5 kg, upper-body compounds +2.5 kg, isolation adds reps first. */
function repRange(t){ const m=String(t||"").match(/(\d+)\s*[-–]\s*(\d+)/); if(m) return [+m[1],+m[2]]; const n=parseInt(t); return isNaN(n)?null:[n,n]; }
const LOWER_RE=/SQUAT|DEADLIFT|RDL|LEG PRESS|HACK|LUNGE|SPLIT|HIP THRUST|HIP EXTENSION|LEG CURL|LEG EXTENSION|CALF|STEP-UP|GLUTE|PULL-THROUGH/i;
function progressionHint(ex, prevSets, deload){
  const done=prevSets.filter(s=>s.reps!=null&&s.weight!=null&&s.weight>0); const rr=repRange(ex.target_reps);
  if(!done.length||!rr) return null;
  const top=Math.max(...done.map(s=>+s.weight)), atTop=done.filter(s=>+s.weight===top);
  const lower=LOWER_RE.test(ex.name||""), comp=isCompound(ex.name);
  if(deload) return {kind:"deload", w:Math.round(top*0.9/1.25)*1.25, text:`🔄 ديلود: ${fmt(Math.round(top*0.9/1.25)*1.25,2)} كجم تقريباً · مجموعات أقل · RIR 3-4`};
  const inc=comp?(lower?5:2.5):(top<15?1:1.25);
  const rirs=atTop.map(s=>s.rir).filter(r=>r!==null&&r!==undefined&&r!=="").map(Number).filter(r=>!isNaN(r));
  const grinding=atTop.some(s=>typeof isFailure==="function"&&isFailure(s))||(rirs.length>0&&Math.min(...rirs)<=0);
  const nearFail=rirs.length>0&&Math.min(...rirs)<=1;
  const hitTop=atTop.length>=Math.min(2,ex.sets)&&atTop.every(s=>+s.reps>=rr[1]);
  const missed=atTop.some(s=>+s.reps<rr[0]);
  if(hitTop&&grinding) return {kind:"hold", w:top, text:`⏸ وصلت آخر المدى بس على الفشل – ثبّت ${fmt(top,2)} كجم مجموعة كمان، وسيب عدّة في الاحتياط`};
  if(hitTop&&nearFail) return {kind:"hold", w:top, text:`⏸ آخر المدى وصلته وانت قريب من الفشل – كرر ${fmt(top,2)} كجم مرة كمان وبعدها اطلع`};
  if(hitTop) return {kind:"up", w:top+inc, text:`📈 وصلت لأعلى المدى (${rr[1]})${rirs.length?" وفاضل عدّة في الاحتياط":""} – جرّب ${fmt(top+inc,2)} كجم (+${inc})`};
  if(missed&&grinding){ const w=Math.max(1,Math.round(top*0.95/1.25)*1.25); return {kind:"hold", w, text:`🔽 العدات تحت المدى وانت للفشل – نزّل لـ${fmt(w,2)} كجم ورجّع العدات`}; }
  if(missed) return {kind:"hold", w:top, text:`⏸ ثبّت ${fmt(top,2)} كجم – العدات كانت تحت المدى (${rr[0]})`};
  return {kind:"reps", w:top, text:`➕ نفس الوزن ${fmt(top,2)} كجم – حاول تزود عدّة في كل مجموعة`};
}

/* ---------- 6) exercise alternatives ---------- */
const DEFAULT_ALTS={
  "BACK SQUAT":["HACK SQUAT MACHINE","LEG PRESS","SMITH MACHINE SQUAT","GOBLET SQUAT"],
  "HACK SQUAT MACHINE":["LEG PRESS","SMITH MACHINE SQUAT","BACK SQUAT"],
  "LEG PRESS":["HACK SQUAT MACHINE","SMITH MACHINE SQUAT","BULGARIAN SPLIT SQUAT"],
  "ROMANIAN DEADLIFT":["DB ROMANIAN DEADLIFT","45-DEGREE HIP EXTENSION","SEATED LEG CURL"],
  "FLAT BB BENCH PRESS":["FLAT DB PRESS","MACHINE CHEST PRESS","SMITH MACHINE BENCH PRESS"],
  "FLAT DB PRESS":["FLAT BB BENCH PRESS","MACHINE CHEST PRESS","PUSH-UP"],
  "INCLINE DB PRESS":["INCLINE BB BENCH PRESS","INCLINE PRESS MACHINE","30-DEGREE INCLINE SMITH MACHINE"],
  "INCLINE BB BENCH PRESS":["INCLINE DB PRESS","INCLINE PRESS MACHINE"],
  "MACHINE CHEST PRESS":["FLAT DB PRESS","CHEST PRESS MACHINE","PUSH-UP"],
  "PEC DECK FLY MACHINE":["CABLE FLY","DB FLY"], "CABLE FLY":["PEC DECK FLY MACHINE","DB FLY"],
  "LAT PULLDOWN":["NEUTRAL-GRIP PULLDOWN","PULL-UP (OR ASSISTED)","SA CABLE PULLDOWN"],
  "NEUTRAL-GRIP PULLDOWN":["LAT PULLDOWN","PULL-UP (OR ASSISTED)"],
  "BENT-OVER BB ROW":["CHEST-SUPPORTED ROW","SEATED CABLE ROW","SA DB ROW"],
  "CHEST-SUPPORTED ROW":["SEATED CABLE ROW","SA DB ROW","UPPER BACK ROW MACHINE"],
  "SEATED CABLE ROW":["CHEST-SUPPORTED ROW","SA DB ROW","UPPER BACK ROW MACHINE"],
  "SEATED DB SHOULDER PRESS":["MACHINE SHOULDER PRESS","SMITH MACHINE SHOULDER PRESS","STANDING BB OVERHEAD PRESS"],
  "MACHINE SHOULDER PRESS":["SEATED DB SHOULDER PRESS","SMITH MACHINE SHOULDER PRESS"],
  "CABLE LATERAL RAISE":["DB LATERAL RAISE","LATERAL RAISE MACHINE"], "DB LATERAL RAISE":["CABLE LATERAL RAISE","LATERAL RAISE MACHINE"],
  "REAR DELT FLY MACHINE":["FACE PULL","BENT-OVER DB REAR DELT FLY"],
  "EZ BAR CURL":["CABLE CURL","DB CURL","PREACHER CURL"], "INCLINE DB CURL":["CABLE CURL","DB CURL"],
  "CABLE TRICEPS PUSHDOWN":["DB SKULL CRUSHER","DIPS (TRICEPS)","OVERHEAD CABLE TRICEPS EXTENSION"],
  "OVERHEAD CABLE TRICEPS EXTENSION":["DB OVERHEAD TRICEPS EXTENSION","CABLE TRICEPS PUSHDOWN"],
  "LEG EXTENSION MACHINE":["SISSY SQUAT","GOBLET SQUAT"],
  "SEATED LEG CURL":["LYING LEG CURL","NORDIC CURL"], "LYING LEG CURL":["SEATED LEG CURL","NORDIC CURL"],
  "HIP THRUST":["GLUTE BRIDGE MACHINE","SMITH MACHINE HIP THRUST","CABLE PULL-THROUGH"],
  "STANDING CALF RAISE":["SEATED CALF RAISE MACHINE","LEG PRESS CALF RAISE"], "SEATED CALF RAISE MACHINE":["STANDING CALF RAISE","LEG PRESS CALF RAISE"],
};
function altsFor(name){ const n=(name||"").toUpperCase(); return (S.alts&&S.alts[n]&&S.alts[n].length)? S.alts[n] : (DEFAULT_ALTS[n]||[]); }
function altChoice(exId){ return (cacheGet("alt")||{})[exId]||null; }
function setAltChoice(exId,name){ const a=cacheGet("alt")||{}; if(name) a[exId]=name; else delete a[exId]; cacheSet("alt",a); }
function openAlts(ex, onChange){
  const list=altsFor(ex.name), cur=altChoice(ex.id);
  const body=openSheet(`<div class="between"><b>⇄ بدائل ${esc(ex.name)}</b><button class="btn sm ghost" data-close>✕</button></div>
    <p class="hint">لو الجهاز مشغول اختار بديل – هيتسجل في ملاحظات المجموعات، ونفس العدات والراحة.</p>
    ${cur?`<div class="item" style="background:var(--acc-soft);border-radius:12px"><div class="nm"><b>بتلعب دلوقتي: ${esc(cur)}</b></div><button class="btn sm" data-reset>رجوع للأساسي</button></div>`:""}
    ${list.length?list.map(a=>`<div class="item"><div class="nm"><b>${esc(a)}</b></div>${videoFor({name:a})?`<button class="btn sm" data-play="${esc(a)}">▶</button>`:""}<button class="btn sm primary" data-pick="${esc(a)}">اختار</button></div>`).join(""):emptyBox("🤷","مفيش بدائل للتمرين ده","الكوتش يقدر يضيف بدائل من لوحة التحكم.","","es-sm")}`);
  body.querySelector("[data-close]").onclick=closeSheet;
  body.querySelector("[data-reset]")&&(body.querySelector("[data-reset]").onclick=()=>{ setAltChoice(ex.id,null); closeSheet(); onChange(); });
  body.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{ setAltChoice(ex.id,b.dataset.pick); closeSheet(); toast("⇄ "+b.dataset.pick); onChange(); });
  body.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>openVideo({name:b.dataset.play}));
}

/* ---------- 7) subscriptions ---------- */
function subStatus(p){
  if(!p.sub_end && !p.sub_start) return null;
  const left=p.sub_end?daysBetween(today(),p.sub_end):null;
  if(left!==null&&left<0) return {cls:"bad",icon:"⛔",text:"الاشتراك انتهى",left};
  if(p.sub_start&&!p.sub_paid) return {cls:"warn",icon:"💰",text:"غير مدفوع",left};
  if(left!==null&&left<=7) return {cls:"warn",icon:"💳",text:`بينتهي خلال ${left} يوم`,left};
  return {cls:"good",icon:"✅",text:left!==null?`باقي ${left} يوم`:"ساري",left};
}

/* ---------- 2) coach alerts ---------- */
function clientAlerts(c, o){
  const out=[], wk=currentWeek(c), lastAct=[o?.last_set?.slice(0,10), o?.last_habit, o?.last_meal].filter(Boolean).sort().pop();
  const idle=lastAct?daysBetween(lastAct,today()):(c.start_date&&daysBetween(c.start_date,today())>2?daysBetween(c.start_date,today()):null);
  if(c.active && idle!==null && idle>=3) out.push({p:3,icon:"😴",text:`مفيش تسجيل من ${idle} يوم`});
  const sinceStart=c.start_date?daysBetween(c.start_date,today()):null, lastSet=o?.last_set?.slice(0,10), woIdle=lastSet?daysBetween(lastSet,today()):null;
  if(c.active && !lastSet && sinceStart!==null && sinceStart>=2) { for(let i=out.length-1;i>=0;i--) if(/مفيش تسجيل/.test(out[i].text)) out.splice(i,1); out.push({p:3,icon:"👋",text:`عميل جديد: لسه ما سجلش أي تمرين (${sinceStart} يوم)`}); }
  else if(c.active && woIdle!==null && woIdle>=3 && !out.some(x=>/مفيش تسجيل/.test(x.text))) out.push({p:2,icon:"🏋",text:`مفيش تمرين من ${woIdle} يوم`});
  if(o?.unreviewed) out.push({p:3,icon:"📝",text:`${o.unreviewed} متابعة مستنية ردك`});
  if(c.active && wk>1 && (o?.last_checkin_week||0) < wk-1) out.push({p:2,icon:"📸",text:`متابعة الأسبوع ${wk-1} ناقصة`});
  if(o?.adherence7!=null && +o.adherence7<0.7) out.push({p:2,icon:"📉",text:`الالتزام ${pct(o.adherence7)} آخر 7 أيام`});
  const W=o?.weights||[]; if(W.length>=3){ const last=W[W.length-1], prev=W[W.length-3], d=last[1]-prev[1];
    if(/تنشيف/.test(c.goal||"") && d>-0.2) out.push({p:2,icon:"⚖",text:`الوزن ثابت آخر أسبوعين (${d>0?"+":""}${fmt(d,1)})`});
    if(/زيادة/.test(c.goal||"") && d<0.1) out.push({p:2,icon:"⚖",text:`الوزن مش بيزيد آخر أسبوعين`}); }
  const s=subStatus(c); if(s&&s.cls!=="good") out.push({p:s.cls==="bad"?3:1,icon:s.icon,text:s.text});
  const br=blockAlert(c); if(br) out.push(br);
  return out.sort((a,b)=>b.p-a.p);
}

/* ---------- 1) weekly check-in ---------- */
const RATES=[["energy","⚡ الطاقة"],["hunger","🍽 الجوع"],["sleep","😴 النوم"],["stress","🤯 التوتر"],["adherence","🎯 التزامك بالخطة"]];
const POSES=[["front","أمامي"],["side","جانبي"],["back","خلفي"]];
const urlCache={};
async function photoUrl(path){ if(!path) return null; if(urlCache[path]) return urlCache[path];
  const { data } = await sb.storage.from("checkins").createSignedUrl(path, 3600); urlCache[path]=data?.signedUrl||null; return urlCache[path]; }
function resizeImage(file,max=1600){ return mlCompressImage(file,max); }
async function viewCheckin(el){
  const p=S.client, wkNow=currentWeek(p), coach=S.me.role==="coach";
  const { data:all } = await sb.from("checkins").select("*").eq("client_id",p.id).order("week");
  const C=all||[]; S.ciWeek=S.ciWeek||Math.max(1,wkNow);
  const cur=C.find(c=>c.week===S.ciWeek)||{}, rec={...cur}, first=C.find(c=>c.photo_front||c.photo_side||c.photo_back);
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic acc">📸</div><h2>المتابعة الأسبوعية<small>مرة في الأسبوع: وزن + صور + إحساسك</small></h2></div>
      ${blockNavHTML(S.ciWeek,p)}<div class="scroller">${blockWeeks(S.ciWeek,p).map(w=>{ const c=C.find(x=>x.week===w); return `<button class="chip ${S.ciWeek===w?"on":""} ${wkNow===w?"cur":""}" data-w="${w}">${w}${c?(c.reviewed_at?" ✓✓":" ✓"):""}</button>`; }).join("")}</div>
      <p class="hint">✓ اتبعتت · ✓✓ الكوتش رد عليها</p></div>
    ${cur.coach_reply?`<div class="card dark"><div class="card-h"><div class="ic">💬</div><h2>رد الكوتش<small>الأسبوع ${S.ciWeek}</small></h2></div><p style="margin:0;white-space:pre-wrap">${esc(cur.coach_reply)}</p></div>`:""}
    <div class="card"><div class="card-h"><div class="ic dark">📝</div><h2>أسبوع ${S.ciWeek}<small>${cur.id?"اتبعتت "+esc(cur.checkin_date):"لسه ما اتبعتتش"}</small></h2></div>
      <label class="f">⚖ الوزن الصباحي (كجم)<input inputmode="decimal" data-k="weight" value="${esc(cur.weight??"")}"></label>
      ${RATES.map(([k,l])=>`<div style="margin-bottom:10px"><div class="muted" style="font-weight:700;margin-bottom:6px">${l}</div><div class="row" style="gap:6px" data-rate="${k}">${[1,2,3,4,5].map(v=>`<button class="chip ${+cur[k]===v?"on":""}" data-v="${v}">${v}</button>`).join("")}<span class="muted">${k==="hunger"||k==="stress"?"1 قليل · 5 عالي":"1 ضعيف · 5 ممتاز"}</span></div></div>`).join("")}
      <label class="f">🏆 إنجازات الأسبوع<textarea rows="2" data-k="wins">${esc(cur.wins??"")}</textarea></label>
      <label class="f">🧱 صعوبات واجهتك<textarea rows="2" data-k="struggles">${esc(cur.struggles??"")}</textarea></label>
      <label class="f">ملاحظات / أسئلة للكوتش<textarea rows="2" data-k="notes">${esc(cur.notes??"")}</textarea></label>
      <div class="muted" style="font-weight:700;margin:4px 0 6px">📷 الصور (نفس الإضاءة والمكان كل أسبوع)</div>
      <div class="grid3">${POSES.map(([k,l])=>`<div class="ml-cell"><label class="photo" data-pose="${k}"><input type="file" accept="image/*" capture="environment" hidden><div class="ph" data-img="${k}"><span>📷</span><small>${l}</small></div></label>${coach&&cur["photo_"+k]?`<button type="button" class="ml-del" data-mldel="${k}" aria-label="حذف الصورة نهائياً" title="حذف الصورة من كل مكان">🗑</button>`:""}</div>`).join("")}</div>
      <button class="btn primary block" id="ciSave" style="margin-top:12px">${cur.id?"تحديث المتابعة":"إرسال المتابعة للكوتش"}</button></div>
    ${coach?`<div class="card"><div class="card-h"><div class="ic acc">💬</div><h2>ردك على المتابعة</h2></div>
      <textarea rows="4" id="ciReply" placeholder="ملاحظاتك وتعديلات الأسبوع الجاي…">${esc(cur.coach_reply??"")}</textarea>
      <button class="btn navy block" id="ciReplySave" style="margin-top:8px" ${cur.id?"":"disabled"}>حفظ الرد ✓✓</button></div>`:""}
    ${first&&cur.id&&first.week!==cur.week?`<div class="card"><div class="card-h"><div class="ic">🔁</div><h2>قبل وبعد<small>أسبوع ${first.week} ← أسبوع ${cur.week}</small></h2></div><div id="cmp" class="ba-grid"></div></div>`:""}<div id="cArchive"></div>`;
  restoreWeekChips(el,window._wsX); window._wsX=null;
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{ window._wsX=weekChipsX(el); S.ciWeek=+b.dataset.w; viewCheckin(el); });
  el.querySelectorAll("[data-rate]").forEach(g=>g.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{ g.querySelectorAll("[data-v]").forEach(x=>x.classList.remove("on")); b.classList.add("on"); rec[g.dataset.rate]=+b.dataset.v; }));
  const files={};
  for(const [k] of POSES){ const path=cur["photo_"+k]; if(path) photoUrl(path).then(u=>{ if(u) el.querySelector(`[data-img="${k}"]`).innerHTML=`<img src="${u}" alt="">`; }); }
  el.querySelectorAll("[data-pose]").forEach(l=>l.querySelector("input").onchange=e=>{ const f=e.target.files[0]; if(!f) return; files[l.dataset.pose]=f; l.querySelector(".ph").innerHTML=`<img src="${URL.createObjectURL(f)}" alt="">`; });
  el.querySelectorAll("[data-mldel]").forEach(b=>b.onclick=e=>{ e.preventDefault(); e.stopPropagation(); mlTwoTap(b,async()=>{
    const k=b.dataset.mldel, path=cur["photo_"+k]; if(!path) return;
    if(!await mlPurge("checkins",[path])){ b.disabled=false; b.classList.remove("ml-arm"); b.textContent="🗑"; return; }
    const { error } = await sb.from("checkins").update({["photo_"+k]:null}).eq("id",cur.id);
    if(error){ toast(error.message); b.disabled=false; b.classList.remove("ml-arm"); b.textContent="🗑"; return; }
    delete urlCache[path]; toast("✓ اتحذفت الصورة من كل مكان"); viewCheckin(el); }); });
  $("#ciSave").onclick=async()=>{
    const btn=$("#ciSave"); btn.disabled=true; btn.textContent="جارٍ الإرسال…";
    const v=k=>el.querySelector(`[data-k="${k}"]`).value;
    const row={client_id:p.id, week:S.ciWeek, checkin_date:today(), weight:num(v("weight")), wins:v("wins").trim()||null, struggles:v("struggles").trim()||null, notes:v("notes").trim()||null};
    const oldPh={}; for(const [k] of POSES) oldPh[k]=cur["photo_"+k]||null;
    RATES.forEach(([k])=>row[k]=rec[k]??null);
    for(const [k,f] of Object.entries(files)){
      try{ const blob=await resizeImage(f), path=`${p.id}/w${S.ciWeek}-${k}-${Date.now()}.jpg`;
        const { error } = await sb.storage.from("checkins").upload(path, blob, {contentType:"image/jpeg", upsert:true}); if(error) throw error; row["photo_"+k]=path;
      }catch(e){ toast("تعذر رفع صورة: "+(e.message||e)); btn.disabled=false; btn.textContent="إرسال"; return; }
    }
    if(!cur.reviewed_at) row.reviewed_at=null;
    const { error } = await sb.from("checkins").upsert(row,{onConflict:"client_id,week"});
    if(error){ toast(error.message); btn.disabled=false; return; }
    const stale=Object.keys(files).map(k=>oldPh[k]).filter(Boolean); if(stale.length) mlPurge("checkins",stale,true);
    if(row.weight){ const { data:bl } = await sb.from("body_logs").select("week,weight").eq("client_id",p.id).eq("week",S.ciWeek).limit(1);
      if(!bl?.[0]?.weight) await sb.from("body_logs").upsert({client_id:p.id,week:S.ciWeek,log_date:today(),weight:row.weight},{onConflict:"client_id,week"}); }
    toast("✓ اتبعتت المتابعة"); viewCheckin(el);
  };
  $("#ciReplySave")&&($("#ciReplySave").onclick=async()=>{ const { error } = await sb.from("checkins").update({coach_reply:$("#ciReply").value.trim()||null, reviewed_at:new Date().toISOString()}).eq("id",cur.id); if(error) return toast(error.message); toast("✓ اتحفظ الرد"); viewCheckin(el); });
  if($("#cmp")){ const box=$("#cmp"); for(const [k,l] of POSES){ const a=first["photo_"+k], b=cur["photo_"+k]; if(!a||!b) continue;
      const [ua,ub]=await Promise.all([photoUrl(a),photoUrl(b)]); box.insertAdjacentHTML("beforeend", baPair(ua,ub,l,first.week,cur.week)); }
    if(!box.innerHTML) box.outerHTML=`<p class="hint">الصور بتظهر جنب بعض لما تتسجل نفس الزاوية في الأسبوعين.</p>`; }
  if(window.fillPhotoArchive) fillPhotoArchive(el.querySelector("#cArchive"),p);
}

/* ---------- 5) diet templates ---------- */
async function loadDietTemplates(){ const { data } = await sb.from("diet_templates").select("*").order("created_at",{ascending:false}); S.dietTpl=data||[]; }
function roundQty(q,unit){ return COUNT_UNITS(unit)? Math.max(0.5,Math.round(q*2)/2) : Math.max(5,Math.round(q/5)*5); }
async function applyDietTemplate(p, tpl, scaleTo){
  const k = scaleTo&&tpl.kcal ? scaleTo/tpl.kcal : 1;
  const rows=tpl.items.map((i,idx)=>{ const q=k===1?+i.qty:roundQty(i.qty*k,i.unit), r=q/i.qty;
    return {client_id:p.id, meal_no:i.meal_no, position:idx, food_id:i.food_id, food_name:i.food_name, unit:i.unit, qty:q,
      kcal:+(i.kcal*r).toFixed(1), protein:+(i.protein*r).toFixed(1), carbs:+(i.carbs*r).toFixed(1), fat:+(i.fat*r).toFixed(1), notes:i.notes||null}; });
  const { error:de } = await sb.from("diet_plan_items").delete().eq("client_id",p.id); if(de) return toast(de.message);
  if(rows.length){ const { error } = await sb.from("diet_plan_items").insert(rows); if(error) return toast(error.message); }
  const mpd=Math.max(...tpl.items.map(i=>i.meal_no),tpl.meals_per_day||0,1);
  if(mpd>(+p.meals_per_day||3)) await sb.from("profiles").update({meals_per_day:mpd}).eq("id",p.id);
  return true;
}

/* ---------- 9) monthly report (print → PDF) ---------- */
async function viewReport(el){
  const p=S.client, wkNow=currentWeek(p), t=targets(p);
  const R=S.rep||(S.rep={from:Math.max(1,Math.floor((wkNow-1)/4)*4+1), to:Math.floor((wkNow-1)/4)*4+4, summary:""});
  const bs=(blockOf(wkNow)-1)*BLOCK, RANGES=[[bs+1,bs+4],[bs+5,bs+8],[bs+9,bs+12],[bs+1,bs+12]].concat(bs?[[1,wkNow]]:[]);
  const dFrom=addDays(p.start_date||today(),(R.from-1)*7), dTo=addDays(p.start_date||today(),R.to*7-1);
  el.innerHTML=`<div class="card no-print"><div class="card-h"><div class="ic acc">📄</div><h2>التقرير الشهري<small>اختار الفترة واكتب ملخصك، وبعدين اطبع أو احفظ PDF</small></h2></div>
      <div class="scroller">${RANGES.map(([a,b])=>`<button class="chip ${R.from===a&&R.to===b?"on":""}" data-r="${a}-${b}">${b-a===11?(bs?"البلوك "+blockOf(wkNow)+" كله":"البرنامج كله"):a===1&&b===wkNow?"من البداية لحد دلوقتي":"أسابيع "+a+"–"+b}</button>`).join("")}</div>
      <label class="f" style="margin-top:10px">ملخص الكوتش (بيظهر في التقرير)<textarea rows="4" id="repSum">${esc(R.summary)}</textarea></label>
      <label class="row" style="gap:8px;font-size:.85rem"><input type="checkbox" id="repPh" style="width:auto;min-height:0" ${R.photos!==false?"checked":""}> إظهار صور قبل/بعد (بموافقة العميل)</label>
      <button class="btn primary block" id="repPrint" style="margin-top:10px">🖨 طباعة / حفظ PDF</button></div>
    <div id="rep" class="report"><p class="muted">جارٍ تجهيز التقرير…</p></div>`;
  el.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{ const [a,c]=b.dataset.r.split("-").map(Number); R.from=a; R.to=c; R.summary=$("#repSum").value; viewReport(el); });
  $("#repSum").oninput=e=>{ R.summary=e.target.value; const s=$("#repSumOut"); if(s) s.textContent=R.summary||"—"; };
  $("#repPh").onchange=e=>{ R.photos=e.target.checked; viewReport(el); };
  $("#repPrint").onclick=()=>window.print();
  const [body,hab,sets,meals,cis]=await Promise.all([
    sb.from("body_logs").select("*").eq("client_id",p.id).order("week"),
    sb.from("habits").select("*").eq("client_id",p.id).gte("log_date",dFrom).lte("log_date",dTo),
    sb.from("set_logs").select("exercise_id,week,reps,weight,rir,failure").eq("client_id",p.id).gte("week",R.from).lte("week",R.to),
    sb.from("meal_items").select("log_date,kcal,protein").eq("client_id",p.id).gte("log_date",dFrom).lte("log_date",dTo),
    sb.from("checkins").select("*").eq("client_id",p.id).gte("week",R.from).lte("week",R.to).order("week")]);
  const B=(body.data||[]).filter(b=>b.weight), inR=B.filter(b=>b.week>=Math.max(0,R.from-1)&&b.week<=R.to);
  const w0=inR[0], w1=inR[inR.length-1], wa0=(body.data||[]).filter(b=>b.waist&&b.week>=Math.max(0,R.from-1)&&b.week<=R.to);
  const H=hab.data||[], S2=(sets.data||[]).filter(logged), M=meals.data||[];
  const days=[...new Set(M.map(m=>m.log_date))], kcalAvg=days.length?M.reduce((s,m)=>s+(+m.kcal||0),0)/days.length:null, pAvg=days.length?M.reduce((s,m)=>s+(+m.protein||0),0)/days.length:null;
  const fail=S2.filter(isFailure).length;
  const lifts=S.program.filter(e=>isCompound(e.name)).map(ex=>{ const mine=S2.filter(s=>s.exercise_id===ex.id), ws=[...new Set(mine.map(s=>s.week))].sort((a,b)=>a-b); if(ws.length<2) return null;
    const best=w=>Math.max(...mine.filter(s=>s.week===w).map(s=>e1rm(s)||0)); const a=best(ws[0]), b=best(ws[ws.length-1]); return a&&b?{name:ex.name,a,b,d:(b-a)/a}:null; }).filter(Boolean).slice(0,6);
  const CI=cis.data||[], firstPh=CI.find(c=>c.photo_front||c.photo_side), lastPh=[...CI].reverse().find(c=>c.photo_front||c.photo_side);
  const delta=(a,b,u)=>a!=null&&b!=null?`<span class="num">${b-a>0?"+":""}${fmt(b-a,1)}</span> ${u}`:"—";
  $("#rep").innerHTML=`<div class="rep-head"><div><div class="logo" style="color:#0F172A">MO<b>FIT</b></div><small>تقرير متابعة</small></div><div style="text-align:end"><b>${esc(p.full_name||"")}</b><br><small>أسابيع ${R.from}–${R.to} · ${esc(dFrom)} → ${esc(dTo)}</small></div></div>
    <div class="card"><div class="grid4">
      <div class="stat dark"><div class="l">تغيّر الوزن</div><div class="v">${delta(w0?.weight,w1?.weight,"كجم")}</div><div class="s num">${fmt(w0?.weight,1)} → ${fmt(w1?.weight,1)}</div></div>
      <div class="stat"><div class="l">تغيّر الوسط</div><div class="v">${delta(wa0[0]?.waist,wa0[wa0.length-1]?.waist,"سم")}</div></div>
      <div class="stat acc"><div class="l">الالتزام بالعادات</div><div class="v">${pct(avg(H.map(dayScore)))}</div><div class="s">${H.length} يوم مسجّل</div></div>
      <div class="stat"><div class="l">مجموعات التمرين</div><div class="v">${S2.length}</div><div class="s">${S2.length?Math.round(fail/S2.length*100):0}% للفشل</div></div></div></div>
    <div class="card"><div class="card-h"><div class="ic acc">⚖</div><h2>منحنى الوزن</h2></div>${lineChart(B.map(b=>({x:b.week,y:+b.weight})),"كجم")}</div>
    <div class="card"><div class="card-h"><div class="ic">🍽</div><h2>التغذية<small>${days.length} يوم مسجّل</small></h2></div>
      <div class="grid2"><div class="stat"><div class="l">متوسط السعرات</div><div class="v num">${fmt(kcalAvg)}</div><div class="s">الهدف ${fmt(t.kcal)}</div></div><div class="stat"><div class="l">متوسط البروتين</div><div class="v num">${fmt(pAvg)}</div><div class="s">الهدف ${fmt(t.P)} جم</div></div></div></div>
    ${lifts.length?`<div class="card"><div class="card-h"><div class="ic dark">🏋️</div><h2>تطور القوة<small>أفضل 1RM تقديري – أول أسبوع مقابل آخر أسبوع</small></h2></div><table><tr><th style="text-align:start">التمرين</th><th>قبل</th><th>بعد</th><th>التغيّر</th></tr>${lifts.map(l=>`<tr><td style="text-align:start;font-size:.75rem">${esc(l.name)}</td><td class="num">${fmt(l.a,1)}</td><td class="num">${fmt(l.b,1)}</td><td><span class="pill ${l.d>=0?"good":"navy"}">${l.d>=0?"▲":"▼"} ${Math.abs(l.d*100).toFixed(1)}%</span></td></tr>`).join("")}</table></div>`:""}
    <div class="card"><div class="card-h"><div class="ic">🗓</div><h2>خريطة الالتزام</h2></div>${heatmap(p,H)}</div>
    ${R.photos!==false&&firstPh&&lastPh&&firstPh.week!==lastPh.week?`<div class="card"><div class="card-h"><div class="ic acc">📸</div><h2>قبل وبعد<small>أسبوع ${firstPh.week} ← أسبوع ${lastPh.week}</small></h2></div><div class="ba-grid" id="repPhotos"></div></div>`:""}
    <div class="card dark"><div class="card-h"><div class="ic">💬</div><h2>ملخص الكوتش</h2></div><p id="repSumOut" style="margin:0;white-space:pre-wrap">${esc(R.summary||"—")}</p></div>`;
  if($("#repPhotos")) for(const [pose,l] of POSES){ const a=firstPh["photo_"+pose], b=lastPh["photo_"+pose]; if(!a||!b) continue;
    const [ua,ub]=await Promise.all([photoUrl(a),photoUrl(b)]); $("#repPhotos").insertAdjacentHTML("beforeend", baPair(ua,ub,l,firstPh.week,lastPh.week)); }
}

/* ---------- 10) health screening (PAR-Q) + consent ---------- */
const PARQ=[
  ["heart","هل قالك دكتور قبل كده إن عندك مشكلة في القلب أو ضغط عالي؟"],
  ["chest","هل بتحس بألم في الصدر وانت مرتاح أو أثناء المجهود؟"],
  ["dizzy","هل حصل إنك فقدت توازنك من دوخة أو أغمى عليك خلال آخر 12 شهر؟"],
  ["chronic","هل عندك مرض مزمن متشخّص (سكر، ربو، غدة، كلى…) غير القلب والضغط؟"],
  ["meds","هل بتاخد أدوية بشكل منتظم لمرض مزمن؟"],
  ["joint","هل عندك إصابة أو مشكلة في عظمة/مفصل/غضروف ممكن تزيد مع التمرين؟"],
  ["doctor","هل قالك دكتور إنك لازم تتمرن تحت إشراف طبي بس؟"],
  ["preg","(للسيدات) هل في حمل حالياً أو ولادة خلال آخر 6 شهور؟"]
];
async function ensureHealth(){
  const { data, error } = await sb.from("health_screens").select("client_id").eq("client_id",S.me.id).maybeSingle();
  if(error || data) return;              // offline or already done → don't block
  return new Promise(res=>{
    const body=openSheet(`<div class="onb-step">خطوة ١ من ٢ · بتاخد دقيقة</div><b style="font-size:1.1rem">🩺 قبل ما نبدأ – استبيان الأمان</b>
      <p class="hint">مطلوب مرة واحدة. لو أي إجابة "أيوه" الكوتش هيطلب تصريح من دكتور قبل التمارين التقيلة – ده لسلامتك.</p>
      ${PARQ.map(([k,q])=>`<div class="item" style="padding:8px 0;display:block"><div style="margin-bottom:6px">${q}</div><div class="seg" data-q="${k}"><button data-v="0" class="on">لأ</button><button data-v="1">أيوه</button></div></div>`).join("")}
      <label class="f">لو في "أيوه" – اكتب التفاصيل<textarea id="hDet" rows="2"></textarea></label>
      <label class="row" style="gap:8px;align-items:flex-start;margin:10px 0"><input type="checkbox" id="hOk" style="width:auto;margin-top:4px"><span style="font-size:.85rem">أقر إن الإجابات صحيحة، وموافق إن الكوتش يحتفظ ببياناتي (القياسات، الصور، الأكل، التمرين) بشكل سري لمتابعة البرنامج فقط، وأقدر أطلب حذفها في أي وقت.</span></label>
      <p class="err" id="hErr"></p><button class="btn primary block" id="hSave">حفظ والمتابعة ✓</button><button class="btn block" type="button" id="hLater" style="margin-top:8px">لاحقاً</button><p class="hint" style="text-align:center">هنسألك تاني في المرة الجاية، والكوتش محتاج إجاباتك قبل التمارين التقيلة.</p>`);
    $("#sheet").dataset.lock="1";
    body.querySelectorAll(".seg[data-q]").forEach(s=>s.querySelectorAll("button").forEach(b=>b.onclick=()=>{ s.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b)); }));
    $("#hLater").onclick=()=>{ delete $("#sheet").dataset.lock; closeSheet(); res(); };
    $("#hSave").onclick=async()=>{
      if(!$("#hOk").checked){ $("#hErr").textContent="لازم توافق على الإقرار"; return; }
      const answers=Object.fromEntries([...body.querySelectorAll(".seg[data-q]")].map(s=>[s.dataset.q,s.querySelector(".on").dataset.v==="1"]));
      const flagged=Object.values(answers).some(Boolean), details=$("#hDet").value.trim();
      if(flagged && !details){ $("#hErr").textContent="اكتب تفاصيل الإجابة اللي بـ أيوه"; return; }
      const { error } = await sb.from("health_screens").upsert({ client_id:S.me.id, answers, flagged, details, consent_at:new Date().toISOString() });
      if(error){ $("#hErr").textContent="تعذر الحفظ – تأكد من النت وحاول تاني"; return; }
      delete $("#sheet").dataset.lock; closeSheet(); if(flagged) toast("تم – الكوتش هيراجع حالتك قبل التمارين التقيلة"); res();
    };
  });
}
function healthAlert(c){ const h=S.health?.[c.id];
  if(!h) return c.active?{p:1,icon:"🩺",text:"لسه ما ملاش استبيان الصحة"}:null;
  if(h.flagged && !h.cleared_at) return {p:3,icon:"⚕",text:"محتاج تصريح طبي قبل التمرين التقيل"};
  return null; }
function healthCard(p){ const h=S.health?.[p.id];
  if(!h) return `<div class="card"><div class="card-h"><div class="ic">🩺</div><h2>استبيان الصحة<small>العميل لسه ما ملاهوش – هيظهرله أول ما يفتح التطبيق</small></h2></div></div>`;
  const yes=PARQ.filter(([k])=>h.answers?.[k]);
  return `<div class="card"><div class="card-h"><div class="ic ${h.flagged&&!h.cleared_at?"acc":""}">🩺</div><h2>استبيان الصحة<small>موافقة على البيانات: ${niceDate((h.consent_at||"").slice(0,10))}</small></h2></div>
    ${yes.length?yes.map(([,q])=>`<div class="pill acc" style="display:block;margin:4px 0;white-space:normal">⚠ ${q}</div>`).join("")+(h.details?`<p style="margin-top:8px"><b>التفاصيل:</b> ${esc(h.details)}</p>`:""):`<p class="hint">✅ كل الإجابات "لأ" – مفيش موانع معروفة.</p>`}
    ${h.flagged?(h.cleared_at?`<p class="hint">✅ تم استلام التصريح الطبي ${niceDate(h.cleared_at.slice(0,10))}</p>`:`<button class="btn navy block" id="hClear" style="margin-top:8px">استلمت التصريح الطبي ✓</button>`):""}</div>`; }
async function loadHealth(){ const { data } = await sb.from("health_screens").select("*"); S.health=Object.fromEntries((data||[]).map(h=>[h.client_id,h])); }

/* ---------- 11) full backup (coach) ---------- */
const BACKUP_TABLES=["profiles","program_exercises","set_logs","habits","meal_items","body_logs","checkins","diet_plan_items","diet_templates","program_templates","exercise_videos","health_screens","client_events","client_supplements","price_plans","workout_sessions","coach_private","foods"];
function backupAge(){ const t=localStorage.getItem("mofit_last_backup"); return t?daysBetween(t.slice(0,10),today()):null; }
async function exportBackup(btn){
  btn.disabled=true; const out={ app:"mofit", exported_at:new Date().toISOString(), tables:{} };
  try{
    for(const t of BACKUP_TABLES){ btn.textContent="⏳ "+t; let rows=[], from=0;
      while(true){ const { data, error } = await sb.from(t).select("*").range(from,from+999); if(error) throw new Error(t+": "+error.message); rows=rows.concat(data); if(data.length<1000) break; from+=1000; }
      out.tables[t]=rows; }
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(out)],{type:"application/json"}));
    a.download=`mofit-backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
    localStorage.setItem("mofit_last_backup",new Date().toISOString()); toast("✅ تم تنزيل النسخة الاحتياطية"); if(!S.client) setTimeout(render,50);
  }catch(e){ toast("تعذر عمل النسخة: "+e.message); }
  btn.disabled=false; btn.textContent="📦 نزّل نسخة احتياطية كاملة";
}

/* ---------- 12) real-life client problems ---------- */
/* readiness check → autoregulation */
const READY_Q=[["sleep","😴 نومك امبارح"],["energy","⚡ طاقتك دلوقتي"],["sore","🦵 الشد العضلي (1 = مكسّر · 5 = ولا حاجة)"],["stress","🧠 الضغط والتوتر (1 = عالي · 5 = هادي)"]];
const readyKey=()=>"mofit_ready_"+S.client.id+"_"+today();
function readinessToday(){ try{ return JSON.parse(localStorage.getItem(readyKey())||"null"); }catch(e){ return null; } }
function readinessBanner(r){
  if(!r) return `<button class="btn block ready-cta" id="rdyBtn">🔋 قبل ما تبدأ: إزيك النهارده؟ <small>(10 ثواني)</small></button>`;
  const z=r.score>=3.8?["good","🟢 جاهز – يوم مناسب تحاول تكسر رقمك"]:r.score>=2.8?["mid","🟡 عادي – التزم بالخطة بالظبط"]:["low","🔴 جسمك تعبان – فعّلنا اليوم الخفيف. الهدف الحركة مش الأرقام"];
  return `<div class="ready ${z[0]}"><div><b>${z[1]}</b><small>الجاهزية ${fmt(r.score,1)} / 5</small></div><button class="pill" id="rdyBtn" style="border:0;cursor:pointer">تعديل</button></div>`;
}
function openReadiness(onDone){
  const cur=readinessToday()||{};
  const body=openSheet(`<b style="font-size:1.05rem">🔋 جاهزيتك النهارده</b><p class="hint">بنظبط التمرين على حالتك الحقيقية – ده اللي بيفرق المدرب الشاطر.</p>
    ${READY_Q.map(([k,q])=>`<div style="margin:10px 0"><div style="font-weight:700;margin-bottom:6px">${q}</div><div class="seg" data-r="${k}">${[1,2,3,4,5].map(v=>`<button data-v="${v}" class="${(cur[k]||3)===v?"on":""}">${v}</button>`).join("")}</div></div>`).join("")}
    <button class="btn primary block" id="rdySave">تمام ✓</button>`);
  body.querySelectorAll(".seg[data-r]").forEach(s=>s.querySelectorAll("button").forEach(b=>b.onclick=()=>s.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b))));
  $("#rdySave").onclick=async()=>{
    const r=Object.fromEntries([...body.querySelectorAll(".seg[data-r]")].map(s=>[s.dataset.r,+s.querySelector(".on").dataset.v]));
    r.score=Math.round(avg(Object.values(r))*10)/10;
    localStorage.setItem(readyKey(),JSON.stringify(r));
    if(r.score<2.8) setTrainMode("light");
    closeSheet(); onDone&&onDone();
    await dbWrite({op:"upsert",table:"client_events",row:{client_id:S.client.id,kind:"readiness",event_date:today(),ref:"",data:r},onConflict:"client_id,kind,event_date,ref"});
  };
}
/* short-on-time / light-day modes (reset automatically next day) */
function trainMode(){ return localStorage.getItem("mofit_mode_"+(S.client?.id||"")+"_"+today())||""; }
function setTrainMode(m){ localStorage.setItem("mofit_mode_"+(S.client?.id||"")+"_"+today(), m||""); }
const modeSets=n=>trainMode()?Math.max(2,n-1):n;
const modeRest=r=>trainMode()==="quick"?Math.max(30,Math.round(r*0.66/5)*5):r;
const modeRir=t=>trainMode()==="light"&&t?String(t).replace(/\d+/g,d=>+d+1):t;
function trainToolsHTML(){
  const m=trainMode();
  return readinessBanner(readinessToday())+`<div class="modes"><button class="mode ${m==="quick"?"on":""}" data-mode="quick">⏱ عندي وقت قليل</button><button class="mode ${m==="light"?"on":""}" data-mode="light">🪫 يوم خفيف</button></div>
    ${m?`<p class="hint" style="margin:6px 0 0">${m==="quick"?"⏱ أهم 4 تمارين · مجموعة أقل · راحة أقصر (≈35 دقيقة). الأهم إنك ماتفوّتش اليوم.":"🪫 مجموعة أقل وRIR زيادة 1. يوم خفيف أحسن بكتير من يوم ضايع."}</p>`:""}`;
}
/* warm-up ramp for the first big lift */
function warmupHTML(workW){
  const r=v=>Math.max(2.5,Math.round(v/2.5)*2.5);
  const steps=workW>=20?[[0.5,8],[0.7,5],[0.85,2]].map(([p,n])=>`<span class="pill">${fmt(r(workW*p),1)} كجم × ${n}</span>`).join("")
    :`<span class="pill">بار فاضي / وزن خفيف × 10</span><span class="pill">+ مجموعتين تصاعدي × 5 و 3</span>`;
  return `<div class="warm"><b>🔥 إحماء قبل وزن الشغل</b><div class="scroller">${steps}</div><small>5 دقايق حركة خفيفة الأول · راحة 60ث بين مجموعات الإحماء · مابتتحسبش في التسجيل</small></div>`;
}
/* pain / injury report */
const PAIN_AREAS=["كتف","كوع","رسغ","رقبة","أسفل الضهر","ركبة","حوض / فخد","كاحل","تاني"];
function openPain(ex, onAlt){
  const body=openSheet(`<b style="font-size:1.05rem">🤕 حاسس بألم في ${esc(ex.name)}؟</b>
    <div style="margin:10px 0"><div style="font-weight:700;margin-bottom:6px">فين؟</div><div class="chips" data-area>${PAIN_AREAS.map((a,i)=>`<button class="chip ${i===0?"on":""}" data-v="${a}">${a}</button>`).join("")}</div></div>
    <div style="margin:10px 0"><div style="font-weight:700;margin-bottom:6px">نوعه؟</div><div class="seg" data-type><button data-v="muscle" class="on">حرقان / تعب في العضلة</button><button data-v="joint">ألم حاد / في المفصل / وخز</button></div></div>
    <label class="f">الشدة (1 خفيف – 10 مش قادر)<select id="pLvl">${[...Array(10)].map((_,i)=>`<option ${i===2?"selected":""}>${i+1}</option>`).join("")}</select></label>
    <div id="pOut"></div><button class="btn primary block" id="pSave">قيّم وبلّغ الكوتش</button>`);
  const one=sel=>body.querySelectorAll(sel+" button").forEach(b=>b.onclick=()=>body.querySelectorAll(sel+" button").forEach(x=>x.classList.toggle("on",x===b)));
  one("[data-area]"); one("[data-type]");
  $("#pSave").onclick=async()=>{
    const area=body.querySelector("[data-area] .on").dataset.v, type=body.querySelector("[data-type] .on").dataset.v, level=+$("#pLvl").value;
    const serious=type==="joint"||level>=5;
    $("#pOut").innerHTML=serious
      ?`<div class="pv-warn"><b>⛔ وقّف التمرين ده النهارده.</b><div>جرّب بديل مايوجعش، ولو الألم استمر أكتر من 48 ساعة أو فيه تورم/تنميل لازم دكتور. الكوتش اتبلّغ.</div></div><button class="btn navy block" id="pAlt" style="margin-top:8px">⇄ اختار بديل دلوقتي</button>`
      :`<div class="pv-ok">💪 غالباً ده تعب عضلي طبيعي (DOMS / حرقان المجهود) – كمّل بنفس التكنيك، ولو اتحول لألم حاد وقّف.</div>`;
    $("#pSave").remove();
    $("#pAlt")&&($("#pAlt").onclick=()=>{ closeSheet(); onAlt&&onAlt(); });
    await dbWrite({op:"upsert",table:"client_events",row:{client_id:S.client.id,kind:"pain",event_date:today(),ref:ex.id+"-"+Date.now(),data:{exercise:ex.name,area,type,level,serious}},onConflict:"client_id,kind,event_date,ref"});
  };
}
/* PR celebration */
function celebratePR(name, now, before){
  const d=document.createElement("div"); d.className="pr-pop";
  d.innerHTML=`<div>🏆</div><b>رقم قياسي جديد!</b><small>${esc(name)}<br>1RM ≈ ${fmt(now,1)} كجم (+${fmt((now/before-1)*100,1)}%)</small>`;
  document.body.appendChild(d); burst(); setTimeout(()=>d.classList.add("out"),2200); setTimeout(()=>d.remove(),2700);
  if(navigator.vibrate) navigator.vibrate([60,40,60]);
}
/* missed yesterday's workout */
function missedCard(p, sets){
  const y=addDays(today(),-1), start=p.start_date; if(!start||daysBetween(start,y)<0) return "";
  const dn=((daysBetween(start,y)%7)+7)%7+1, exIds=S.program.filter(e=>e.day_no===dn).map(e=>e.id), wk=weekOfDate(p,y);
  if(!exIds.length||!wk) return "";
  if((sets||[]).some(s=>exIds.includes(s.exercise_id)&&s.week===wk&&(s.reps||s.weight))) return "";
  return `<div class="card miss"><div class="card-h"><div class="ic acc">⏰</div><h2>فاتك تمرين امبارح<small>يوم ${dn}${dayLabel(dn)?" · "+esc(dayLabel(dn)):""}</small></h2></div>
    <p class="hint" style="margin:0 0 10px">مفيش مشكلة – ده بيحصل لكل الناس. القاعدة: اعمله النهارده وكمّل الجدول بعده. ماتعملش تمرينين في يوم واحد، ولو فاتك أكتر من يومين كمّل من مكانك عادي. الاستمرارية أهم من الكمال.</p>
    <button class="btn primary block" id="doMissed" data-d="${dn}" data-w="${wk}">اعمل تمرين امبارح دلوقتي ←</button></div>`;
}
/* coach-side alerts from events + program age */
async function loadEvents(){ const { data } = await sb.from("client_events").select("*").gte("event_date",addDays(today(),-30)).order("event_date",{ascending:false}); S.events=data||[]; }
function eventAlerts(c){
  const A=[], E=(S.events||[]).filter(e=>e.client_id===c.id);
  const pain=E.filter(e=>e.kind==="pain"&&e.data?.serious&&!e.resolved_at&&daysBetween(e.event_date,today())<=10);
  if(pain.length){ const x=pain[0].data; A.push({p:3,icon:"🤕",text:`بلّغ عن ألم ${esc(x.area)} في ${esc(x.exercise)} (شدة ${esc(x.level??"")}/10)`}); }
  const low=E.filter(e=>e.kind==="readiness"&&daysBetween(e.event_date,today())<=7&&+e.data?.score<2.8);
  if(low.length>=3) A.push({p:2,icon:"🪫",text:`جاهزية منخفضة ${low.length} مرات الأسبوع ده – راجع النوم والسعرات أو ادّيله ديلود`});
  if(c.program_started_at&&c.split_key){ const w=Math.floor(daysBetween(c.program_started_at.slice(0,10),today())/7); if(w>=10) A.push({p:1,icon:"🔁",text:`البرنامج بقاله ${w} أسبوع – وقت تجديد التمارين أو النظام`}); }
  E.filter(e=>e.kind==="ai_flag"&&!e.resolved_at&&daysBetween(e.event_date,today())<=7).slice(0,2)
    .forEach(x=>A.push({p:3,icon:"🤖",text:`المساعد حوّل سؤال ليك: ${String(x.data?.q||"").slice(0,60)}`}));
  return A;
}
function painCard(p){
  const P=(S.events||[]).filter(e=>e.client_id===p.id&&e.kind==="pain");
  const F=(S.events||[]).filter(e=>e.client_id===p.id&&e.kind==="ai_flag"&&!e.resolved_at);
  if(!P.length&&!F.length) return "";
  return `<div class="card"><div class="card-h"><div class="ic acc">🤕</div><h2>تقارير الألم وتنبيهات المساعد<small>آخر 30 يوم</small></h2></div>
    ${F.map(e=>`<div class="pain-row serious"><div><b>🤖 سؤال محوّل من المساعد</b><small>${niceDate(e.event_date)} · ${esc(String(e.data?.q||"").slice(0,120))}</small></div><button class="btn sm" data-pres="${e.id}">تمت المتابعة ✓</button></div>`).join("")}
    ${P.map(e=>`<div class="pain-row ${e.data?.serious?"serious":""}"><div><b>${esc(e.data?.area||"")} · ${esc(e.data?.exercise||"")}</b><small>${niceDate(e.event_date)} · ${e.data?.type==="joint"?"ألم حاد/مفصل":"تعب عضلي"} · شدة ${esc(e.data?.level??"")}/10</small></div>
      ${e.resolved_at?`<span class="pill good">تمت المتابعة</span>`:`<button class="btn sm" data-pres="${e.id}">تمت المتابعة ✓</button>`}</div>`).join("")}
    <p class="hint">لو الألم في مفصل: بدّل التمرين من تبويب البرنامج، أو قلل المدى/الوزن، أو حوّله لنظام "ضهر آمن".</p></div>`;
}
