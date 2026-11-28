/* ======================================================================
   AUTH / BOOT / NAV
   ====================================================================== */
$("#loginForm").addEventListener("submit", async e=>{
  e.preventDefault(); $("#loginErr").textContent="";
  const { error } = await sb.auth.signInWithPassword({ email:$("#loginEmail").value.trim(), password:$("#loginPass").value });
  if(error){ $("#loginErr").textContent="الإيميل أو كلمة السر غير صحيحة"; return; }
  boot();
});
async function logout(){ await sb.auth.signOut(); location.reload(); }

function skelCards(){ return [70,150,110].map(h=>`<div class="card"><div class="skel sk" style="height:20px;width:45%;margin-bottom:12px"></div><div class="skel sk" style="height:${h}px"></div></div>`).join(""); }
function waitCard(host,retry,n=0){ host.innerHTML=skelCards()+`<p class="muted" style="text-align:center;font-weight:700">بنحمّل بياناتك... لحظة</p>`+(n>=5?`<button class="btn block" id="wRetry">جرّب تاني</button>`:""); if(n>=5){ $("#wRetry").onclick=()=>{ waitCard(host,retry,0); retry(); }; return; } setTimeout(()=>{ if(host.isConnected&&host.querySelector(".skel")) retry(n+1); },4000); }
const PW={train:["🏋","خطة التمرين","الكوتش لسه بيجهّز برنامج التمرين بتاعك"],food:["🍽","الخطة الغذائية","الكوتش لسه بيجهّز نظامك الغذائي"]};
function planningInner(k){ const [ic,t,m]=PW[k]; return `<div class="pw-orb"><span class="pw-ring"></span><span class="pw-ring r2"></span><div class="pw-ic">${ic}</div></div><h2 class="pw-t">${m}</h2><p class="pw-s">${t} هتظهر هنا أول ما تجهز<span class="pw-dots"><i></i><i></i><i></i></span></p><p class="pw-s2">تقدر تبدأ تسجّل نومك ومياهك وخطواتك من تبويب العادات في الأثناء.</p>`; }
function planningCard(k){ return `<div class="card plan-wait">${planningInner(k)}</div>`; }
const progWait=()=>S.me?.role!=="coach"&&(S.progPending||!(S.program||[]).length);
async function boot(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ $("#loginView").classList.remove("hidden"); $("#appView").classList.add("hidden"); return; }
  const vidsP=loadVideos(); window._progPre={id:session.user.id,p:sb.from("program_exercises").select("*").eq("client_id",session.user.id).order("day_no").order("position").then(r=>r,()=>null)};
  let me=null; try{ ({ data:me } = await sb.from("profiles").select("*").eq("id",session.user.id).single()); }catch(e){ me=null; }
  if(me) cacheSet("me",me); else { me=cacheGet("me"); if(!me||me.id!==session.user.id){ $("#loginView").classList.add("hidden"); $("#appView").classList.remove("hidden"); window.__bootN=(window.__bootN||0)+1; waitCard($("#main"),()=>boot(),Math.min(window.__bootN-1,5)); return; } }
  if(!me.active){ await sb.auth.signOut(); $("#loginView").classList.remove("hidden"); $("#loginErr").textContent=me.signup_days?"طلبك قيد المراجعة – الكوتش هيفعّل حسابك بعد تأكيد الاشتراك":"الحساب غير مفعّل – تواصل مع الكوتش"; return; }
  S.me=me; $("#loginView").classList.add("hidden"); $("#appView").classList.remove("hidden");
  if(me.role==="assistant"){ S.assistant=true; renderAssistantHome(); return; }
  if(!$("#main").children.length) $("#main").innerHTML=skelCards();
  await vidsP; flushQueue();
  if(me.role==="coach"){ S.tab="clients"; await Promise.all([loadClients(),loadCoachTemplates(),loadDietTemplates()]); }
  else { await openClient(me); const qt=new URLSearchParams(location.search).get("tab"); if(qt==="supps"&&S.supps?.length){ S.tab="supps"; } else if(qt==="train"||qt==="food"){ S.tab=qt; if(qt==="food") S.date=today(); } }
  if(document.readyState==="loading") await new Promise(r=>document.addEventListener("DOMContentLoaded",r,{once:true}));
  render();
  (async()=>{ if(me.role==="client"){ try{ await ensureHealth(); }catch(e){} } setTimeout(maybeOnboard,400); })();
}
/* Assistants land here. They see ONLY the clients the coach assigned to them,
   read-only (profile summary, check-ins, messages). RLS enforces this server-side. */
function renderAssistantHome(){
  const nv=$("#nav"); if(nv) nv.classList.add("hidden");
  $("#top").innerHTML=`<div class="top-row"><div class="logo">MO<b>FIT</b></div><span class="pill glass">حساب مساعد</span><div class="sp"></div><button class="ibtn" onclick="logout()">خروج</button></div>`;
  assistantList();
}
async function assistantList(){
  $("#main").innerHTML=`<div class="card" style="text-align:center;padding:26px"><p class="hint">بيحمّل…</p></div>`;
  const { data:G } = await sb.from("assistant_assignments").select("client_id");
  const ids=(G||[]).map(g=>g.client_id);
  if(!ids.length){ $("#main").innerHTML=`<div class="card" style="text-align:center;padding:30px 20px;margin-top:18px"><div style="font-size:2.6rem;margin-bottom:8px">🤝</div>
    <h2 style="margin:0 0 6px">أهلاً ${esc((S.me.full_name||"").split(" ")[0])} 👋</h2>
    <p class="hint" style="margin:0">الكوتش لسه مخصّصش لك عملاء.<br>أول ما يضيفك لعميل هيظهر هنا.</p></div>`; return; }
  const { data:cs } = await sb.from("profiles").select("id,full_name,email,phone,sex,age,goal").in("id",ids);
  $("#main").innerHTML=`<div class="card" style="margin-top:14px"><div class="card-h"><div class="ic dark">👥</div><h2>العملاء المخصّصين لك (${(cs||[]).length})<small>قراءة بس</small></h2></div>
    ${(cs||[]).map(c=>`<div class="item" data-ac="${c.id}" style="padding:10px 0;cursor:pointer"><div class="av">${initials(c)}</div>
      <div class="nm"><b>${esc(c.full_name||c.email||"")}</b><small>${esc(c.phone||c.email||"")}</small></div><span class="hint">‹</span></div>`).join("")}</div>`;
  $("#main").querySelectorAll("[data-ac]").forEach(r=>r.onclick=()=>assistantClient(ids.find(i=>i===r.dataset.ac),(cs||[]).find(c=>c.id===r.dataset.ac)));
}
async function assistantClient(cid,c){
  $("#main").innerHTML=`<div class="card" style="text-align:center;padding:26px"><p class="hint">بيحمّل…</p></div>`;
  const [{ data:ci }, { data:ms }] = await Promise.all([
    sb.from("checkins").select("*").eq("client_id",cid).order("created_at",{ascending:false}).limit(10),
    sb.from("messages").select("*").eq("client_id",cid).order("created_at",{ascending:false}).limit(50) ]);
  $("#main").innerHTML=`<button class="btn sm ghost" id="acBack" style="margin:10px 0">← كل العملاء</button>
    <div class="card"><div class="card-h"><div class="ic dark">👤</div><h2>${esc(c.full_name||c.email||"")}<small>ملف العميل – قراءة بس</small></h2></div>
      <p class="hint" style="margin:0">${[c.sex,c.age?c.age+" سنة":"",c.goal].filter(Boolean).map(esc).join(" · ")||"—"}<br><span dir="ltr">${esc(c.phone||"")}</span></p></div>
    <div class="card"><div class="card-h"><div class="ic dark">✅</div><h2>آخر التشيك إن (${(ci||[]).length})</h2></div>
      ${(ci||[]).length?(ci||[]).map(x=>`<div class="item" style="padding:8px 0"><div class="nm"><b>${esc(x.date||x.log_date||(x.created_at||"").slice(0,10))}</b><small>${esc([x.weight?x.weight+" كجم":"",x.notes||x.coach_reply||""].filter(Boolean).join(" · "))}</small></div></div>`).join(""):'<p class="hint">مفيش تشيك إن لسه.</p>'}</div>
    <div class="card"><div class="card-h"><div class="ic dark">💬</div><h2>الرسايل (${(ms||[]).length})<small>قراءة بس</small></h2></div>
      ${(ms||[]).length?(ms||[]).reverse().map(m=>`<div class="msg ${m.sender_role==="coach"?"mine":""}" style="margin:6px 0"><small class="hint">${esc(m.sender_role||"")} · ${esc((m.created_at||"").slice(0,16).replace("T"," "))}</small><div>${esc(m.body||m.text||"")}</div></div>`).join(""):'<p class="hint">مفيش رسايل.</p>'}</div>`;
  $("#acBack").onclick=assistantList;
  window.scrollTo(0,0);
}
async function openClient(p){
  S.client=p; S.week=currentWeek(p); S.date=today(); S.bodyWeek=null;
  const pre=window._progPre; window._progPre=null;
  const { data, error } = (pre&&pre.id===p.id&&(await pre.p))||await sb.from("program_exercises").select("*").eq("client_id",p.id).order("day_no").order("position");
  S.program=error? (cacheGet("prog_"+p.id)||[]) : (data||[]); if(!error) cacheSet("prog_"+p.id,S.program);
  S.progPending=!!p.program_pending&&S.me?.role!=="coach"; if(S.progPending) S.program=[]; S.dietPending=!!p.diet_pending&&S.me?.role!=="coach";
  const days=[...new Set(S.program.map(e=>e.day_no))];
  S.day = todayDayNo() || days[0] || 1;
  S.supps=[]; if(S.me?.role!=="coach") await loadSupps(p);
}
async function refreshClient(){ const { data } = await sb.from("profiles").select("*").eq("id",S.client.id).single(); const tab=S.tab, day=S.day, wk=S.week; await openClient(data); S.tab=tab; S.day=day; S.week=wk; }
function tabs(){
  if(S.me.role==="coach" && !S.client) return [["clients","العملاء"],["videos","التمارين"],["foods","الأطعمة"]];
  const t=[["home","الرئيسية"],["train","التمرين"],["food","التغذية"],["habits","العادات"],["body","التقدم"],["form","الفورم"]];
  if(S.me.role!=="coach" && S.supps?.length) t.push(["supps","المكملات"]);
  if(S.me.role==="coach") t.push(["setup","التحكم"]);
  if(S.me.role!=="coach" && S.aiOn) t.push(["ai","المساعد"]);
  return t;
}
function renderTop(){
  const c=S.client, coachHome=S.me.role==="coach"&&!c;
  if(coachHome){
    $("#top").innerHTML=`<div class="top-row"><div class="logo">MO<b>FIT</b></div><span class="pill glass">لوحة الكوتش</span><div class="sp"></div><button class="ibtn" onclick="logout()">خروج</button></div>
      <div class="hello"><div class="av">${initials(S.me)}</div><div><h1>أهلاً كوتش ${esc((S.me.full_name||"").split(" ")[0])} 👋</h1><p>${S.coachClients.length} عميل · ${S.coachClients.filter(x=>x.active).length} مفعّل</p></div></div>`;
    return;
  }
  const wk=currentWeek(c), t=targets(c);
  $("#top").innerHTML=`<div class="top-row"><div class="logo">MO<b>FIT</b></div><div class="sp"></div>${S.me.role==="coach"?"":`<button class="ibtn" onclick="contactCoach()" title="كلّم الكوتش">💬 الكوتش</button><button class="ibtn" onclick="logout()">خروج</button>`}</div>
    <div class="hello"><div class="av">${initials(c)}</div><div><h1>${S.me.role==="coach"?esc(c.full_name||c.email):"أهلاً، "+esc((c.full_name||"").split(" ")[0])+" 👋"}</h1>
      <p>${esc(c.goal||"")}${c.level?" · "+LEVELS[c.level]?.icon+" "+esc(c.level):""}${t.kcal?" · "+fmt(t.kcal)+" kcal":""}</p></div>
      <div class="ringwrap">${(()=>{ const tot=planWeeks(c), v=tot?wk:wInBlock(wk), mx=tot||BLOCK, sb=tot?"من "+tot:"بلوك "+blockOf(wk); return ring(v,mx,{size:64,stroke:7,color:"#F97316",track:"rgba(255,255,255,.15)",label:v,sub:sb,textColor:"#fff"}); })()}</div></div>`;
}
function render(){
  renderTop();
  $("#nav").innerHTML=tabs().map(([k,l])=>`<button data-tab="${k}" class="${S.tab===k?"on":""}">${ICON[k]}<span>${l}</span></button>`).join("");
  $("#nav").querySelectorAll("button").forEach(b=>b.onclick=()=>{ S.tab=b.dataset.tab; render(); window.scrollTo(0,0); });
  const m=$("#main"); m.innerHTML="";
  if(S.me.role==="coach" && S.client){
    const bar=document.createElement("div"); bar.className="coachbar";
    bar.innerHTML=`<div class="av">${initials(S.client)}</div><b>وضع الكوتش<small>أي تعديل هنا بيتحفظ في بيانات ${esc(S.client.full_name||"العميل")}</small></b><button class="btn sm navy bk-btn"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>العملاء</span></button>`;
    bar.querySelector("button").onclick=async()=>{ S.client=null; S.tab="clients"; stopRest(); await loadClients(); render(); };
    m.appendChild(bar);
  }
  const host=document.createElement("div"); m.appendChild(host);
  try{ const r=({home:viewHome,train:viewTrain,food:viewFood,habits:viewHabits,body:viewBody,form:window.viewFormLab,setup:viewSetup,supps:viewSupps,clients:viewClients,videos:viewVideos,foods:viewFoods,ai:window.viewAiChat}[S.tab]||viewHome)(host); if(r&&r.catch) r.catch(e=>{ console.warn(e); waitCard(host,n=>{ window.__rn=n; render(); },window.__rn||0); }); }catch(e){ console.warn(e); waitCard(host,n=>{ window.__rn=n; render(); },window.__rn||0); }
}

/* ======================================================================
   HOME
   ====================================================================== */
/* weekly recap card (client Home): this week's sets, volume, new bests, weight change. Shows only once something is logged. */
function weekRecapHTML(all,bodyRows,wk){
  const cur=all.filter(x=>x.week===wk&&logged(x)); if(!cur.length) return "";
  const vol=cur.reduce((a,x)=>a+(+x.reps||0)*(+x.weight||0),0);
  const bestBy=(rows)=>{ const m={}; rows.forEach(x=>{ const v=e1rm(x)||0; if(v>(m[x.exercise_id]||0)) m[x.exercise_id]=v; }); return m; };
  const nowB=bestBy(cur), before=bestBy(all.filter(x=>x.week<wk&&logged(x)));
  const prs=Object.keys(nowB).filter(k=>before[k]>0&&nowB[k]>before[k]*1.005).length;
  const wts=(bodyRows||[]).filter(b=>b.weight!=null&&b.week<=wk).sort((x,y)=>x.week-y.week);
  let wd=""; if(wts.length>=2){ const d=+wts[wts.length-1].weight-+wts[wts.length-2].weight; wd=`<div style="background:var(--c30-tint,#EEF1F6);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:2px"><small style="opacity:.75">الوزن</small><b class="num" style="font-size:1.5rem">${d>0?"+":""}${fmt(d,1)}</b><small style="opacity:.7">كجم عن آخر قياس</small></div>`; }
  return `<div class="card" id="recapCard"><div class="card-h"><div class="ic acc">📊</div><h2>ملخص أسبوعك<small>أسبوع ${wk} لحد دلوقتي</small></h2></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="background:var(--c30-tint,#EEF1F6);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:2px"><small style="opacity:.75">مجموعات</small><b class="num" style="font-size:1.5rem">${cur.length}</b><small style="opacity:.7">اتسجلت</small></div>
    <div style="background:var(--c30-tint,#EEF1F6);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:2px"><small style="opacity:.75">حجم التمرين</small><b class="num" style="font-size:1.5rem">${fmt(Math.round(vol))}</b><small style="opacity:.7">كجم إجمالي</small></div>
    <div style="background:var(--c30-tint,#EEF1F6);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:2px"><small style="opacity:.75">أرقام جديدة</small><b class="num" style="font-size:1.5rem">${prs}</b><small style="opacity:.7">تمرين اتحسّن</small></div>${wd}</div></div>`;
}
function wsRows(id){ const w=window._ws; if(!w||w.id!==id||Date.now()-w.t>2000) window._ws={id,t:Date.now(),p:sb.from("workout_sessions").select("log_date,week,duration_min,rpe,volume").eq("client_id",id).order("log_date").then(r=>r)}; return window._ws.p; }
async function viewHome(el){ window._ws=null;
  const p=S.client, t=targets(p), wk=currentWeek(p), dn=todayDayNo();
  const todayEx=S.program.filter(e=>e.day_no===dn);
  el.innerHTML=`${progWait()?planningCard("train"):`<div class="card dark hero"><div class="card-h"><div class="ic">💪</div><h2>تمرين النهارده<small>${dn?"يوم "+dn+(dayLabel(dn)?" · "+esc(dayLabel(dn)):""):"يوم راحة واستشفاء"}</small></h2>${dn?`<span class="pill acc">${todayEx.length} تمارين</span>`:""}</div>
      ${dn?`<div class="hero-body">${anatomySVG(muscleVol(todayEx.map(e=>[e.name,e.sets])),{dark:true})}<div>${muscleLegend(muscleVol(todayEx.map(e=>[e.name,e.sets])),{dark:true})}<small class="hero-sub">${todayEx.length} تمارين · ${todayEx.reduce((a,e)=>a+(+e.sets||0),0)} مجموعة</small></div></div><button class="btn primary block" style="margin-top:10px" id="goTrain">ابدأ التمرين ←</button>`
          :`<p class="hint">😴 الراحة جزء من التطور. سجّل نومك ومياهك وخطواتك في العادات.</p>`}</div>`}
    <div id="hToday"></div><div id="hMiss"></div><div id="hFirst"></div>
    <div class="card" id="hN"><div class="card-h"><div class="ic acc">🍽</div><h2>تغذية النهارده<small>${niceDate(today())}</small></h2></div><p class="muted">جارٍ التحميل…</p></div>
    <div id="hSteps"></div><div id="hCardio"></div>
    <div class="hsec"><span>تقدمك</span></div>
    <div id="hRecap"></div><div id="hFlame"></div><div id="hReady"></div><div id="hStreak"></div>
    <div class="card" id="hH"></div>
    <div class="card" id="hF"></div>
    <div class="hsec"><span>جسمك</span></div>
    <div class="card" id="hB"></div><div id="hGoal"></div><div id="hComp"></div><div id="hStr"></div><div id="hLoad"></div><div id="hHr"></div><div id="hHealth"></div>
    <div class="hsec"><span>الكوتش والاشتراك</span></div>
    <div id="hCI"></div><div id="ghHome"></div>
    ${tipCardHTML()}
    ${S.me.role==="client"?installCardHTML():""}`;
  wireInstall();
  if(window.ghRenderHomeCard&&S.me.role==="client") setTimeout(()=>{ if($("#ghHome")) window.ghRenderHomeCard($("#ghHome"),p,()=>viewHome(el)); },1200);
  window.stepsClientCard&&window.stepsClientCard($("#hSteps"),p);
  $("#goTrain")&&($("#goTrain").onclick=()=>{ S.tab="train"; S.day=dn; S.week=wk; render(); });
  homeCheckinCard(p,wk);
  const id=p.id;
  const [meals,hab,body,sets]=await Promise.all([
    sb.from("meal_items").select("kcal,protein,carbs,fat").eq("client_id",id).eq("log_date",today()),
    sb.from("habits").select("*").eq("client_id",id).order("log_date"),
    sb.from("body_logs").select("*").eq("client_id",id).order("week"),
    sb.from("set_logs").select("exercise_id,week,set_no,reps,weight,rir,failure").eq("client_id",id),
  ]);
  const mc=$("#hMiss"); if(mc){ mc.innerHTML=missedCard(p, sets.data); const b=$("#doMissed"); if(b) b.onclick=()=>{ S.tab="train"; S.day=+b.dataset.d; S.week=+b.dataset.w; render(); }; }
  try{ const rc=$("#hRecap"); if(rc) rc.innerHTML=weekRecapHTML(sets.data||[],body.data||[],wk); }catch(e){}
  const tot=sumMacros(meals.data||[]);
  $("#hN").innerHTML=`<div class="card-h"><div class="ic acc">🍽</div><h2>تغذية النهارده<small>${niceDate(today())}</small></h2><button class="btn sm" id="goFood">سجّل أكلك</button></div>
    <div style="display:flex;gap:16px;align-items:center">${ring(tot.kcal,t.kcal||1,{size:118,label:fmt(tot.kcal),sub:"من "+fmt(t.kcal)+" kcal"})}
    <div style="flex:1">${macroRow("بروتين",tot.P,t.P,"جم")}${macroRow("كارب",tot.C,t.C,"جم","navy")}${macroRow("دهون",tot.F,t.F,"جم","navy")}</div></div>${window.egyScanOpen?`<button class="btn sm navy block" id="goScan" style="margin-top:10px">📸 صوّر أكلك — أكل مصري ≈</button>`:""}`;
  $("#goFood").onclick=()=>{ S.tab="food"; S.date=today(); render(); };
  const goScan=$("#goScan"); if(goScan) goScan.onclick=()=>window.egyScanOpen();
  if(S.dietPending){ const hn=$("#hN"); hn.className="card plan-wait"; hn.innerHTML=planningInner("food"); }
  $("#hF").innerHTML=`<div class="card-h"><div class="ic acc">🔥</div><h2>الفشل العضلي<small>الأسبوع ${wk}</small></h2></div>`+failureSummary((sets.data||[]).filter(s=>s.week===wk));
  const H=hab.data||[];
  $("#hCardio").innerHTML=cardioCardHTML(p,H,wk); wireCardioCard();
  loadCardHTML(p).then(h=>{ const x=$("#hLoad"); if(x) x.innerHTML=h; });
  if(typeof flameHeroHTML==="function") flameHeroHTML(p).then(h=>{ const x=$("#hFlame"); if(x){ x.innerHTML=h; if(window.flameAfter) flameAfter(x,p); } }).catch(()=>{});
  { const rdy=$("#hReady"); if(rdy&&typeof readinessCardHTML==="function"){ rdy.innerHTML=readinessCardHTML(p); wireReadiness(rdy,p); } }
  if(typeof firstWeekHTML==="function"&&S.me.role==="client") firstWeekHTML(p).then(h=>{ const x=$("#hFirst"); if(x){ x.innerHTML=h; if(window.firstWeekAfter) firstWeekAfter(x,p); } }).catch(()=>{});
  if(typeof streakCardHTML==="function") streakCardHTML(p).then(h=>{ const x=$("#hStreak"); if(x){ x.innerHTML=h; if(window.streakAfter&&S.me.role==="client") streakAfter(p); } }).catch(()=>{});
  $("#hH").innerHTML=`<div class="card-h"><div class="ic">✅</div><h2>الالتزام<small>${H.length} يوم مسجّل</small></h2></div>
    <div class="grid4"><div class="stat"><div class="l">🥗 الدايت</div><div class="v">${pct(avg(H.map(h=>h.diet)))}</div></div>
    <div class="stat"><div class="l">💪 التمرين</div><div class="v">${pct(avg(H.map(h=>h.training)))}</div></div>
    <div class="stat"><div class="l">🏃 الكارديو</div><div class="v">${pct(avg(H.map(h=>h.cardio)))}</div></div>
    <div class="stat"><div class="l">💤 النوم</div><div class="v num">${fmt(avg(H.map(h=>h.sleep_hours)),1)}</div><div class="s">ساعة</div></div></div>
    <div style="margin-top:12px">${heatmap(p,H)}</div>`;
  const B=(body.data||[]).filter(b=>b.weight), startW=(body.data||[]).find(b=>b.week===0)?.weight ?? p.start_weight, cur=B.length?+B[B.length-1].weight:null;
  const bmi=cur&&p.height_cm?cur/((p.height_cm/100)**2):null, ch=cur&&startW&&wOk(+cur)&&wOk(+startW)?cur-startW:null;
  $("#hB").innerHTML=`<div class="card-h"><div class="ic">⚖</div><h2>الجسم<small>الوزن والقياسات</small></h2></div>
    <div class="grid3"><div class="stat dark"><div class="l">الوزن الحالي</div><div class="v num">${fmt(cur,1)}</div><div class="s">كجم</div></div>
    <div class="stat ${ch!==null&&ch<0?"acc":""}"><div class="l">التغيّر</div><div class="v num">${ch===null?"—":(ch>0?"+":"")+fmt(ch,1)}</div><div class="s">كجم منذ البداية</div></div>
    <div class="stat"><div class="l">BMI</div><div class="v num">${fmt(bmi,1)}</div></div></div>${lineChart(B.map(b=>({x:b.week,y:+b.weight})),"الوزن (كجم)")}`;
  // v5: today's focus + science cards
  const exIds=new Set(todayEx.map(e=>e.id)), sDay=(sets.data||[]).filter(s=>s.week===wk&&exIds.has(s.exercise_id)).length;
  const ht=$("#hToday"); if(ht&&S.me.role==="client"){ ht.innerHTML=todayCardHTML(p,{dn,setsThisDay:sDay,meals:(meals.data||[]).length,habitToday:H.find(h=>h.log_date===today()),ready:readinessToday()}); wireToday(dn,wk); }
  const lastM=[...(body.data||[])].reverse().find(b=>b.waist||b.bodyfat)||{}, mW={...lastM, weight:lastM.weight||cur};
  $("#hGoal").innerHTML=goalCardHTML(p,body.data||[]);
  $("#hComp").innerHTML=cur?bodyCompCard(p,mW):"";
  $("#hStr").innerHTML=strengthCardHTML(p,sets.data||[],cur||p.start_weight);
  const drawHr=()=>{ $("#hHr").innerHTML=hrCardHTML(p); wireHr(p,drawHr); }; drawHr();
  drawHealth(p);
}
function heatmap(p,H){
  const by=Object.fromEntries(H.map(h=>[h.log_date,dayScore(h)]));
  const start=p.start_date||today(), wk=currentWeek(p);
  let html=`<div class="heat"><span></span>${["1","2","3","4","5","6","7"].map(d=>`<span style="text-align:center">${d}</span>`).join("")}`;
  const b0=(blockOf(wk)-1)*BLOCK;
  for(let w=b0+1;w<=Math.max(wk,b0+4)&&w<=b0+BLOCK;w++){
    html+=`<span>أ${w}</span>`;
    for(let d=0;d<7;d++){ const iso=addDays(start,(w-1)*7+d), s=by[iso]; const lv=s===undefined||s===null?"":s>=.9?"l4":s>=.7?"l3":s>=.45?"l2":"l1"; html+=`<i class="${lv} ${iso===today()?"today":""}" style="--k:${(w-b0-1)+d}" title="${iso}"></i>`; }
  }
  return html+`</div><div class="legend"><span><i style="background:#FED7AA"></i>ضعيف</span><span><i style="background:#FB923C"></i>كويس</span><span><i style="background:#F97316"></i>ممتاز</span></div>`;
}
function failureSummary(sets){
  const done=sets.filter(logged);
  if(!done.length) return emptyBox("🏋️","لسه مفيش مجموعات الأسبوع ده","سجّل أول مجموعة في تمرينك وهتلاقي ملخص الفشل والـRIR هنا.","","es-sm");
  const fail=done.filter(isFailure).length, near=done.filter(s=>!isFailure(s)&&s.rir!==null&&+s.rir<=2).length, far=done.length-fail-near;
  const w=v=>(v/done.length*100).toFixed(1)+"%";
  return `<div class="grid4"><div class="stat"><div class="l">مجموعات</div><div class="v">${done.length}</div></div>
    <div class="stat acc"><div class="l">🔥 للفشل</div><div class="v">${fail}</div></div>
    <div class="stat"><div class="l">RIR 1-2</div><div class="v">${near}</div></div>
    <div class="stat"><div class="l">متوسط RIR</div><div class="v num">${fmt(avg(done.map(s=>s.rir)),1)}</div></div></div>
    <div class="stack"><i style="width:${w(fail)};background:#F97316"></i><i style="width:${w(near)};background:#0F172A"></i><i style="width:${w(far)};background:#CBD5E1"></i></div>
    <div class="legend"><span><i style="background:#F97316"></i>فشل (RIR 0)</span><span><i style="background:#0F172A"></i>قريبة RIR 1-2</span><span><i style="background:#CBD5E1"></i>RIR 3+</span></div>`;
}

/* ======================================================================
   TRAINING
   ====================================================================== */
async function viewTrain(el){
  if(progWait()){ el.innerHTML=planningCard("train"); return; }
  const p=S.client, wkNow=currentWeek(p), tdn=todayDayNo();
  const days=[...new Set(S.program.map(e=>e.day_no))].sort((a,b)=>a-b);
  if(!days.length){ el.innerHTML=`<div class="card">${S.me.role==="coach"?emptyBox("📋","العميل ده لسه مالوش برنامج","حط برنامج التمرين من تبويب التحكم وهيظهرله هنا.",{label:"⚙️ روح للتحكم",go:"setup"}):emptyBox("📋","برنامجك بيتجهّز","الكوتش لسه ما حطش برنامج التمرين – هيظهر هنا أول ما يخلص.")}</div>`; return; }
  const maxD=Math.max(...days);
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic dark">📅</div><h2>${esc(p.split_name||"برنامج التمرين")}<small>${p.level?LEVELS[p.level]?.icon+" "+esc(p.level)+" · ":""}${days.length} أيام في الأسبوع</small></h2></div>
      <div class="scroller" id="dayCards">${[...Array(7)].map((_,i)=>{ const d=i+1, has=days.includes(d); return `<button class="daycard ${S.day===d?"on":""} ${has?"":"rest"}" data-d="${d}">${d===tdn?'<span class="dot"></span>':""}<b>${has?"يوم "+d:"راحة"}</b><small>${has?esc(dayLabel(d)||S.program.filter(e=>e.day_no===d).length+" تمارين"):"😴 استشفاء"}</small>${has?`<span class="dmus">${Object.entries(muscleVol(S.program.filter(e=>e.day_no===d).map(e=>[e.name,e.sets]))).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([m])=>`<i style="background:${mColor(m)}" title="${m}"></i>`).join("")}</span>`:""}</button>`; }).join("")}</div>
      <div class="muted" style="margin:8px 0 6px;font-weight:700">الأسبوع</div>
      ${blockNavHTML(S.week,p)}<div class="scroller" id="wkChips">${planWeekList(p,S.week).map(w=>`<button class="chip ${S.week===w?"on":""} ${wkNow===w?"cur":""}" data-w="${w}">${w}${isDeload(p,w)?" 🔄":""}</button>`).join("")}</div></div>
    <div class="card tools hidden" id="tTools"></div><div id="tPrep"></div><div id="exList"></div><div class="card" id="failCard"></div>`;
  { const dc=$("#dayCards"), wc=$("#wkChips"), sel=dc&&dc.querySelector(".daycard.on");
    [dc,wc].forEach(r=>{ if(!r) return; let x0=0; r.addEventListener("pointerdown",e=>{x0=e.clientX;r._drag=false;},{passive:true}); r.addEventListener("pointermove",e=>{ if(Math.abs(e.clientX-x0)>8) r._drag=true; },{passive:true}); const end=()=>setTimeout(()=>{r._drag=false;},140); r.addEventListener("pointerup",end,{passive:true}); r.addEventListener("pointercancel",()=>{r._drag=true;end();},{passive:true}); r.addEventListener("click",e=>{ if(r._drag){ e.stopPropagation(); e.preventDefault(); } },true); });
    if(dc){ if(window._dcX!=null) dc.scrollLeft=window._dcX; else if(sel){ const dr=dc.getBoundingClientRect(), sr=sel.getBoundingClientRect(), t=dc.scrollLeft+(sr.left-dr.left)-(dc.clientWidth-sr.width)/2; if(sr.left<dr.left||sr.right>dr.right) dc.scrollLeft=t; } }
    if(wc){ if(window._wcX!=null) wc.scrollLeft=window._wcX; else restoreWeekChips(el); }
    window._dcX=null; window._wcX=null; }
  el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ window._dcX=$("#dayCards")?.scrollLeft; S.day=+b.dataset.d; viewTrain(el);});
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{ window._wcX=$("#wkChips")?.scrollLeft; S.week=+b.dataset.w; viewTrain(el);});
  const allEx=S.program.filter(e=>e.day_no===S.day), exs=trainMode()==="quick"?allEx.slice(0,4):allEx, list=$("#exList");
  const tt=$("#tTools"); if(allEx.length&&S.me.role!=="coach"&&S.week===wkNow){ tt.classList.remove("hidden"); tt.innerHTML=trainToolsHTML();
    tt.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{ setTrainMode(trainMode()===b.dataset.mode?"":b.dataset.mode); viewTrain(el); });
    $("#rdyBtn").onclick=()=>openReadiness(()=>viewTrain(el)); }
  if(!exs.length){ list.innerHTML=`<div class="card">${emptyBox("😴","يوم راحة واستشفاء","الراحة جزء من التطور – سجّل نومك ومياهك وخطواتك النهارده.",{label:"✅ سجّل عاداتك",go:"habits"})}</div>`; $("#failCard").remove(); if(window.mofitLottie) mofitLottie.empty(list); return; }
  const ids=exs.map(e=>e.id);
  const { data, error:le } = await sb.from("set_logs").select("*").in("exercise_id",ids).in("week",[S.week,S.week-1].filter(w=>w>=1));
  const ck="logs_"+p.id+"_"+S.day+"_"+S.week, logs=le? (cacheGet(ck)||[]) : (data||[]); if(!le) cacheSet(ck,logs);
  const lastBy={}, bestPrev={}; try{ const { data:hist } = await sb.from("set_logs").select("exercise_id,week,set_no,reps,weight,rir,failure").in("exercise_id",ids).lt("week",S.week); (hist||[]).forEach(h=>{ if(logged(h)){ const k=h.exercise_id+"_"+h.set_no; if(!lastBy[k]||h.week>lastBy[k].week) lastBy[k]=h; } const x=e1rm(h)||0; if(x>(bestPrev[h.exercise_id]||0)) bestPrev[h.exercise_id]=x; }); }catch(e){}
  const firstC=exs.findIndex(e=>isCompound(e.name));
  const seenM=new Set(), firstOfM=exs.map(e=>{ const m=muscleOf(e.name); if(m==="أخرى"||seenM.has(m)) return false; seenM.add(m); return true; });
  const prevW=ex=>Math.max(0,...[...Array(ex.sets)].map((_,i)=>+(get(ex.id,S.week-1,i+1)?.weight)||0));
  const deload=isDeload(p,S.week);
  const tp=$("#tPrep"); if(tp&&!deload){ tp.innerHTML=warmupCardHTML(p,exs,S.day); wireWarmup(tp); }
  if(deload) list.insertAdjacentHTML("beforeend",`<div class="card dark"><div class="card-h"><div class="ic">🔄</div><h2>أسبوع ديلود (تخفيف)<small>مجموعات أقل بحوالي 40% · أوزان أخف ~10% · RIR 3-4 · الهدف استشفاء مش أرقام</small></h2></div></div>`);
  const get=(ex,w,n)=>logs.find(l=>l.exercise_id===ex&&l.week===w&&l.set_no===n);
  exs.forEach((ex,idx)=>{
    const box=document.createElement("div"); box.className="ex"; const vid=videoFor(ex);
    const nSets=modeSets(weekSets(ex,p,S.week)), restS=modeRest(ex.rest_sec||90), alt=altChoice(ex.id), hint=progressionHint(ex,[...Array(ex.sets)].map((_,i)=>get(ex.id,S.week-1,i+1)).filter(Boolean),deload);
    const mus=muscleOf(ex.name); box.style.setProperty("--mc",mColor(mus));
    box.innerHTML=`<div class="ex-h"><div class="ex-n">${idx+1}</div><div class="ex-t">${mus!=="أخرى"?mChip(mus):""}<b data-vid>${esc(alt||ex.name)}</b>${alt?`<small style="display:block;color:#FDBA74;font-size:.7rem">بديل لـ ${esc(ex.name)}</small>`:""}
        <div class="ex-tags"><span class="pill glass">🎯 ${nSets}×${esc(ex.target_reps||"—")}</span>${deload?`<span class="pill glass">RIR 3-4</span>`:ex.target_rir?`<span class="pill glass">RIR ${esc(modeRir(ex.target_rir))}</span>`:""}<button class="pill glass" data-alt style="border:0;cursor:pointer">⇄ بديل</button><button class="pill glass" data-hist style="border:0;cursor:pointer">📈 السجل</button><button class="pill glass" data-exdb style="border:0;cursor:pointer" title="صور وشرح الأداء">📸 الأداء</button><button class="pill glass" data-why style="border:0;cursor:pointer" title="ليه التمرين ده في برنامجك">📚 ليه؟</button><button class="pill glass" data-pain style="border:0;cursor:pointer" title="حاسس بألم؟">🤕</button>${ex.rest_sec?`<span class="pill glass">⏱ ${restS}ث</span>`:""}${ex.tempo?`<span class="pill glass">🕒 ${esc(ex.tempo)}</span>`:""}<span class="pill acc" data-best></span></div></div>
        ${vid?`<button class="play" data-vid title="شاهد الأداء الصحيح">${ICON.play}</button>`:""}</div>
      <div class="ex-b">${hint?`<div class="prog ${hint.kind}">${hint.text}</div>`:""}${ex.tempo?tempoBlocks(ex.tempo):""}${ex.notes?`<p class="hint" style="margin:0 0 8px">📝 ${esc(ex.notes)}</p>`:""}${deload?"":idx===firstC?warmupHTML(hint?.w||prevW(ex)):firstOfM[idx]?feederHTML(hint?.w||prevW(ex),mus):""}
        <div class="set-head"><span>#</span><span>العدات</span><span>الوزن كجم</span><span>RIR</span><span>فشل</span><span></span></div><div data-sets></div>
        <button class="btn sm restbtn" data-rest>⏱ ابدأ الراحة (${restS} ث)</button></div>`;
    box.querySelectorAll("[data-vid]").forEach(b=>b.onclick=()=>openVideo(alt?{...ex,name:alt,video_url:null}:ex));
    box.querySelector("[data-alt]").onclick=()=>openAlts(ex,()=>viewTrain(el));
    box.querySelector("[data-hist]").onclick=()=>openExHistory(ex);
    box.querySelector("[data-exdb]").onclick=()=>mofitExdb.open(alt||ex.name);
    box.querySelector("[data-why]").onclick=()=>mofitReceipts.open(alt||ex.name);
    box.querySelector("[data-rest]").onclick=()=>startRest(restS, ex.name);
    box.querySelector("[data-pain]").onclick=()=>openPain(ex,()=>openAlts(ex,()=>viewTrain(el)));
    const setsEl=box.querySelector("[data-sets]");
    const updBest=()=>{ const best=Math.max(0,...[...Array(nSets)].map((_,i)=>e1rm(get(ex.id,S.week,i+1)||{})||0)); box.querySelector("[data-best]").textContent=best?"1RM≈"+fmt(best,1):""; };
    for(let n=1;n<=nSets;n++){
      const cur=get(ex.id,S.week,n)||{}, prev0=get(ex.id,S.week-1,n), prev=(prev0&&logged(prev0))?prev0:(lastBy[ex.id+"_"+n]||prev0), prevOld=prev&&prev.week!==S.week-1;
      const row=document.createElement("div"); row.className="set"+(logged(cur)?" done":"");
      row.innerHTML=`<div class="no">${n}</div>
        <input inputmode="numeric" placeholder="${esc(ex.target_reps||"عدات")}" value="${esc(cur.reps??"")}" data-k="reps">
        <input inputmode="decimal" placeholder="${hint?.w?fmt(hint.w,2):(prev?.weight??"كجم")}" value="${esc(cur.weight??"")}" data-k="weight">
        <select data-k="rir"><option value="">—</option>${[0,1,2,3,4,5].map(v=>`<option value="${v}" ${cur.rir!==null&&cur.rir!==undefined&&+cur.rir===v?"selected":""}>${v}</option>`).join("")}</select>
        <button class="fail ${cur.failure?"on":""}" data-k="failure" title="وصلت للفشل">🔥</button>
        <button class="more" title="تمبو / راحة / ملاحظات">⋯</button>
        ${prev&&logged(prev)?`<div class="prev">${prevOld?"آخر مرة (أسبوع "+prev.week+")":"الأسبوع اللي فات"}: <b class="num">${fmt(prev.reps)}×${fmt(prev.weight,1)}</b>${prev.rir!==null?" · RIR "+prev.rir:""}${isFailure(prev)?" · 🔥":""}</div>`:""}
        <div class="set-x hidden"><input placeholder="تمبو ${esc(ex.tempo||"")}" value="${esc(cur.tempo??"")}" data-k="tempo"><input inputmode="numeric" placeholder="راحة ث" value="${esc(cur.rest_sec??"")}" data-k="rest_sec"><input placeholder="ملاحظات" value="${esc(cur.notes??"")}" data-k="notes"></div>`;
      row.querySelector(".more").onclick=()=>row.querySelector(".set-x").classList.toggle("hidden");
      const save=async(startTimer)=>{
        const v=k=>row.querySelector(`[data-k="${k}"]`);
        const rec={ client_id:p.id, exercise_id:ex.id, week:S.week, set_no:n, reps:num(v("reps").value), weight:num(v("weight").value), rir:num(v("rir").value),
          failure:v("failure").classList.contains("on"), tempo:v("tempo").value.trim()||null, rest_sec:num(v("rest_sec").value), notes:[alt?"بديل: "+alt:null, v("notes").value.trim()||null].filter(Boolean).join(" · ")||null };
        if(rec.rir===0){ rec.failure=true; v("failure").classList.add("on"); }
        const wasDone=row.classList.contains("done");
        const { data:saved, error, queued } = await dbWrite({op:"upsert",table:"set_logs",row:rec,onConflict:"exercise_id,week,set_no"});
        if(error){ toast("خطأ في الحفظ: "+error.message); return; }
        if(queued) toast("📴 اتحفظت على الموبايل");
        if(S.me.role!=="coach"&&S.week===wkNow) markWorkoutStart(p.id,S.day);
        const i=logs.findIndex(l=>l.exercise_id===ex.id&&l.week===S.week&&l.set_no===n); if(i>=0) logs[i]=saved; else logs.push(saved);
        row.classList.toggle("done",logged(saved)); updBest(); renderFailCard();
        try{ navigator.vibrate&&navigator.vibrate(25); }catch(e){}
        const pr=e1rm(saved)||0; if(bestPrev[ex.id]>0&&pr>bestPrev[ex.id]*1.005){ celebratePR(alt||ex.name,pr,bestPrev[ex.id]); bestPrev[ex.id]=pr; }
        cacheSet(ck,logs); if(startTimer && !wasDone && rec.reps!==null && n<nSets) startRest(rec.rest_sec||restS, `${ex.name} · بعد مجموعة ${n}`);
      };
      row.querySelectorAll("input,select").forEach(i=>i.addEventListener("change",()=>save(i.dataset.k==="reps"||i.dataset.k==="weight")));
      row.querySelector(".fail").onclick=e=>{ e.currentTarget.classList.toggle("on"); save(false); };
      setsEl.appendChild(row);
    }
    updBest(); list.appendChild(box);
  });
  if(S.week===wkNow){ const fin=document.createElement("div"); list.appendChild(fin);
    const drawFin=async()=>{ fin.innerHTML=await finishCardHTML(p,S.day,S.week); const b=fin.querySelector("#finBtn"); if(b) b.onclick=()=>openFinish(p,S.day,S.week,exs,logs,drawFin); };
    drawFin(); }
  const renderFailCard=async()=>{
    const fc=$("#failCard"); if(!fc) return;
    const { data:all } = await sb.from("set_logs").select("exercise_id,week,reps,weight,rir,failure").eq("client_id",p.id);
    const A=(all||[]).filter(s=>ids.includes(s.exercise_id));
    let html=`<div class="card-h"><div class="ic acc">🔥</div><h2>متتبع الفشل العضلي<small>يوم ${S.day} · الأسبوع ${S.week}</small></h2></div>`+failureSummary(A.filter(s=>s.week===S.week));
    html+=`<div class="scrollx" style="margin-top:12px"><table><tr><th style="text-align:start">التمرين</th><th>🔥</th><th>أفضل 1RM</th><th>التطور</th></tr>`;
    exs.forEach(ex=>{
      const mine=A.filter(s=>s.exercise_id===ex.id), wk=mine.filter(s=>s.week===S.week);
      const best=w=>Math.max(0,...mine.filter(s=>s.week===w).map(s=>e1rm(s)||0));
      const nowB=best(S.week), prevW=[...Array(S.week-1)].map((_,i)=>S.week-1-i).find(w=>best(w)>0), prevB=prevW?best(prevW):0, diff=nowB&&prevB?(nowB-prevB)/prevB:null;
      html+=`<tr><td style="text-align:start;font-size:.74rem">${esc(ex.name)}</td><td>${wk.filter(isFailure).length}/${wk.filter(logged).length}</td><td class="num">${nowB?fmt(nowB,1):"—"}</td>
        <td>${diff===null?"—":`<span class="pill ${diff>=0?"good":"navy"}">${diff>=0?"▲":"▼"} ${Math.abs(diff*100).toFixed(1)}%</span>`}</td></tr>`;
    });
    fc.innerHTML=html+`</table></div><p class="hint">1RM تقديري = الوزن × (1 + (العدات + RIR) ÷ 30) · التطور مقارنة بآخر أسبوع مسجّل.</p>`;
  };
  renderFailCard();
}

/* ======================================================================
   NUTRITION (day log + coach plan) — also used as the plan editor
   ====================================================================== */
function favFoods(){ try{ const v=JSON.parse(localStorage.getItem("mofitFavFoods")||"[]"); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
function favFoodToggle(food){ const fv=favFoods(), i=fv.findIndex(x=>x.id===food.id); if(i>=0) fv.splice(i,1); else { fv.unshift(food); if(fv.length>20) fv.length=20; } try{ localStorage.setItem("mofitFavFoods",JSON.stringify(fv)); }catch(e){} return i<0; }
function openFoodPicker(title, onPick, opts={}){
  const body=openSheet(`<div class="between"><b>${esc(title)}</b><button class="btn sm ghost" data-close>✕</button></div>
    <input id="fpQ" placeholder="🔍 اكتب اسم الصنف (حرفين على الأقل)…" style="margin-top:10px" autocomplete="off"><div id="fpRes" style="margin-top:8px"></div>`);
  body.querySelector("[data-close]").onclick=closeSheet;
  const q=$("#fpQ"), res=$("#fpRes"); let timer; setTimeout(()=>q.focus(),100);
  const rowHTML=x=>{ const u=unitInfo(x); return `<div class="food-r" data-id="${x.id}"><div class="fi">${u.cnt?"🍞":"⚖"}</div><div class="nm">${esc(x.name)}<small>${u.base}: <b>${fmt(u.per.kcal)} kcal</b> · ب ${fmt(u.per.P,1)} · ك ${fmt(u.per.C,1)} · د ${fmt(u.per.F,1)}</small></div><span class="pill">${esc(x.unit)}</span></div>`; };
  let recentRows=null;
  const loadRecent=async()=>{ if(recentRows) return recentRows;
    try{ const cid=(S.client&&S.client.id)||(S.me&&S.me.id); if(!cid) return (recentRows=[]);
      const { data:h }=await sb.from("meal_items").select("food_id,log_date").eq("client_id",cid).not("food_id","is",null).order("log_date",{ascending:false}).limit(300);
      const st={}; (h||[]).forEach((r,i)=>{ const o=st[r.food_id]||(st[r.food_id]={n:0,first:i}); o.n++; });
      const ids=Object.keys(st).sort((a,b)=>st[b].n-st[a].n||st[a].first-st[b].first).slice(0,14);
      if(!ids.length) return (recentRows=[]);
      const { data:fs }=await sb.from("foods").select("*").in("id",ids);
      const byId={}; (fs||[]).forEach(f=>byId[f.id]=f);
      recentRows=ids.map(i=>byId[i]).filter(Boolean);
    }catch(e){ recentRows=[]; }
    return recentRows; };
  const showFavs=async()=>{ const fv=favFoods(), favIds=new Set(fv.map(x=>x.id));
    const draw=rc=>{ if(q.value.trim().length>=2) return;
      res.innerHTML=(fv.length?`<div class="sub" style="margin-top:4px">⭐ مفضلتك – دوس عليها تسجّل على طول</div>`+fv.map(rowHTML).join(""):"")
        +(rc.length?`<div class="sub" style="margin-top:8px">🕘 الأكتر تسجيلاً عندك</div>`+rc.map(rowHTML).join(""):"");
      const all=[...fv,...rc];
      res.querySelectorAll("[data-id]").forEach(d=>d.onclick=()=>pickQty(all.find(x=>x.id==d.dataset.id))); };
    draw(recentRows?recentRows.filter(x=>!favIds.has(x.id)):[]);
    const rc=await loadRecent(); draw(rc.filter(x=>!favIds.has(x.id))); };
  showFavs();
  if(opts.quick){ q.insertAdjacentHTML("beforebegin",`<button class="btn sm block" id="fpQuick" style="margin-top:8px">⚡ سعرات سريعة (من غير صنف)</button>`);
    $("#fpQuick").onclick=()=>{ body.innerHTML=`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
      <b style="font-size:1.05rem">⚡ سعرات سريعة</b>
      <label class="f">الاسم (اختياري)</label><input id="qaName" placeholder="مثلاً: وجبة بره" maxlength="60">
      <label class="f">السعرات (kcal)</label><input id="qaK" inputmode="decimal" placeholder="0">
      <div class="g4" style="margin-top:8px"><div><label class="f">بروتين</label><input id="qaP" inputmode="decimal" placeholder="0"></div><div><label class="f">كارب</label><input id="qaC" inputmode="decimal" placeholder="0"></div><div><label class="f">دهون</label><input id="qaF" inputmode="decimal" placeholder="0"></div></div>
      <button class="btn primary block" id="qaAdd" style="margin-top:12px">إضافة</button>`;
      body.querySelector("[data-close]").onclick=closeSheet; body.querySelector("[data-back]").onclick=()=>openFoodPicker(title,onPick,opts);
      $("#qaAdd").onclick=async()=>{ const k=num($("#qaK").value)||0, P=num($("#qaP").value)||0, C=num($("#qaC").value)||0, F=num($("#qaF").value)||0;
        if(k<=0&&P+C+F<=0) return toast("اكتب السعرات");
        const kcal=k>0?k:Math.round(P*4+C*4+F*9);
        if(kcal>5000||P>500||C>1000||F>500) return toast("الرقم كبير، راجعه");
        const nm=($("#qaName").value||"").trim()||"إضافة سريعة";
        await onPick({id:null,name:nm,unit:"حصة",kcal:kcal*100,protein:P*100,carbs:C*100,fat:F*100},1); closeSheet(); }; }; }
  q.oninput=()=>{ clearTimeout(timer); timer=setTimeout(async()=>{
    const term=q.value.trim(); if(term.length<2){ showFavs(); return; }
    const { data:f } = await sb.rpc("search_foods",{q:term});
    res.innerHTML=(f||[]).length?f.map(rowHTML).join("")
      :emptyBox("🔎","مفيش نتائج","اكتب اسم الصنف بشكل تاني"+(S.me.role==="coach"?"، أو ضيفه من تبويب الأطعمة":"")+".","","es-sm");
    res.querySelectorAll("[data-id]").forEach(d=>d.onclick=()=>pickQty(f.find(x=>x.id==d.dataset.id)));
  },250); };
  if(opts.match) body.querySelector("#fpQ").insertAdjacentHTML("beforebegin",`<div class="prog reps" style="margin-top:8px">⇄ تبديل ${esc(opts.match.food_name)} (${fmt(opts.match.kcal)} kcal) – الكمية هتتحسب تلقائياً بنفس السعرات</div>`);
  function pickQty(food){
    const u=unitInfo(food);
    body.innerHTML=`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
      <div class="between"><b style="font-size:1.05rem">${esc(food.name)}</b><button class="btn sm ghost" id="fpStar" title="حفظ في المفضلة">${favFoods().some(x=>x.id===food.id)?"⭐":"☆"}</button></div>
      <div class="unitbox"><span class="u">${u.base}</span> <span style="color:#CBD5E1;font-size:.8rem">${u.cnt?"القيم لكل "+esc(food.unit)+" واحد":"القيم لكل 100 "+esc(food.unit)}</span>
        <div class="g4"><div><b class="num">${fmt(u.per.kcal)}</b><small>سعرات</small></div><div><b class="num">${fmt(u.per.P,1)}</b><small>بروتين</small></div><div><b class="num">${fmt(u.per.C,1)}</b><small>كارب</small></div><div><b class="num">${fmt(u.per.F,1)}</b><small>دهون</small></div></div></div>
      <label class="f">${u.qtyLabel}</label>
      <div class="stepper"><button data-s="-1">−</button><input id="fpQty" inputmode="decimal" value="${u.def}"><button data-s="1">+</button></div>
      <div class="scroller" style="margin-top:8px">${u.quick.map(v=>`<button class="chip" data-q="${v}">${v} ${esc(food.unit)}</button>`).join("")}</div>
      <div class="card" style="background:var(--acc-soft);box-shadow:none;margin:10px 0" id="fpPrev"></div>
      <button class="btn primary block" id="fpAdd">إضافة</button>`;
    const qi=$("#fpQty"), step=u.cnt?1:10;
    const starB=$("#fpStar"); if(starB) starB.onclick=()=>{ const on=favFoodToggle(food); starB.textContent=on?"⭐":"☆"; toast(on?"⭐ اتضاف للمفضلة":"اتشال من المفضلة"); };
    if(opts.match&&food.kcal>0) qi.value=roundQty(opts.match.kcal/(food.kcal/100),food.unit);
    const prev=()=>{ const qv=num(qi.value)||0, c=foodCalc(food, qv); $("#fpPrev").innerHTML=`<div class="between"><b>${fmt(qv,1)} ${esc(food.unit)}</b><b style="color:var(--acc)" class="num">${fmt(c.kcal)} kcal</b></div><div class="muted">بروتين ${fmt(c.protein,1)} · كارب ${fmt(c.carbs,1)} · دهون ${fmt(c.fat,1)} جم</div>${mineralLine(food,qv)}`; };
    qi.oninput=prev; prev();
    body.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ qi.value=Math.max(0,(num(qi.value)||0)+(+b.dataset.s)*step); prev(); });
    body.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ qi.value=b.dataset.q; prev(); });
    body.querySelector("[data-close]").onclick=closeSheet;
    body.querySelector("[data-back]").onclick=()=>openFoodPicker(title,onPick,opts);
    if(opts.match){ const m=opts.match; const cmp=()=>{ const c=foodCalc(food,num(qi.value)||0); $("#fpPrev").insertAdjacentHTML("beforeend",`<div class="muted" style="margin-top:4px">مقارنة بالأصلي: ب ${c.protein-m.protein>=0?"+":""}${fmt(c.protein-m.protein,1)} · ك ${c.carbs-m.carbs>=0?"+":""}${fmt(c.carbs-m.carbs,1)} · د ${c.fat-m.fat>=0?"+":""}${fmt(c.fat-m.fat,1)} جم</div>`); }; const op=qi.oninput; qi.oninput=()=>{op();cmp();}; cmp(); }
    $("#fpAdd").textContent=opts.match?"تبديل":"إضافة";
    $("#fpAdd").onclick=async()=>{ const qv=num(qi.value); if(!qv||qv<=0) return toast("اكتب الكمية"); await onPick(food,qv); closeSheet(); };
  }
}
function qtyText(i){ return `${fmt(i.qty,COUNT_UNITS(i.unit)?2:0)} ${esc(i.unit||"جم")}`; }

async function renderFoodWeek(el){
  const p=S.client, t=targets(p);
  const dow=(new Date(S.date+"T00:00:00Z").getUTCDay()+1)%7; /* Saturday = 0 */
  const wkStart=addDays(S.date,-dow), wkEnd=addDays(wkStart,6);
  el.innerHTML=`<div class="card"><div class="between"><button class="btn sm" id="wPrev">→</button><div style="text-align:center"><b>الأسبوع</b><div class="muted num">${wkStart} ← ${wkEnd}</div></div><button class="btn sm" id="wNext">←</button></div>
    <button class="btn sm navy block" id="wDay" style="margin-top:8px">📅 رجوع ليوم ${niceDate(S.date)}</button></div>
  <div class="card dark" id="wTot"></div><div class="card" id="wBars"></div><div class="card" id="wDays"></div>`;
  $("#wPrev").onclick=()=>{ S.date=addDays(S.date,-7); renderFoodWeek(el); };
  $("#wNext").onclick=()=>{ S.date=addDays(S.date,7); renderFoodWeek(el); };
  $("#wDay").onclick=()=>renderMeals(el,{mode:"day"});
  const { data, error }=await sb.from("meal_items").select("log_date,kcal,protein,carbs,fat").eq("client_id",p.id).gte("log_date",wkStart).lte("log_date",wkEnd);
  if(!el.isConnected) return;
  if(error){ toast(error.message); return; }
  const byD={}; (data||[]).forEach(i=>{ (byD[i.log_date]=byD[i.log_date]||[]).push(i); });
  const days=Array.from({length:7},(_,i)=>{ const d=addDays(wkStart,i); return { d, s:sumMacros(byD[d]||[]), n:(byD[d]||[]).length }; });
  const logged=days.filter(x=>x.n);
  const avg=k=>logged.length?logged.reduce((a,x)=>a+x.s[k],0)/logged.length:0;
  const maxK=Math.max(t.kcal||0,...days.map(x=>x.s.kcal),1);
  const wk=sumMacros(data||[]);
  $("#wTot").innerHTML=`<div class="card-h"><div class="ic">🔥</div><h2>متوسط اليوم في الأسبوع<small>${logged.length} من 7 أيام متسجلة</small></h2></div>
    <div style="display:flex;gap:16px;align-items:center">${ring(avg("kcal"),t.kcal||1,{size:104,track:"rgba(255,255,255,.15)",label:fmt(avg("kcal")),sub:"من "+(t.kcal?fmt(t.kcal):"—"),textColor:"#fff"})}
    <div style="flex:1;color:#fff">${macroRow("بروتين",avg("P"),t.P,"جم")}${macroRow("كارب",avg("C"),t.C,"جم")}${macroRow("دهون",avg("F"),t.F,"جم")}</div></div>
    <p style="color:#CBD5E1;font-size:.75rem;margin:8px 0 0">المتوسط محسوب على الأيام المتسجلة بس · إجمالي الأسبوع ${fmt(wk.kcal)} kcal</p>`;
  $("#wBars").innerHTML=`<div class="card-h"><div class="ic">📊</div><h2>سعرات كل يوم<small>السبت للجمعة · الهدف ${t.kcal?fmt(t.kcal):"—"} kcal</small></h2></div>
    <div style="display:flex;align-items:flex-end;gap:6px;direction:ltr">${days.map(x=>{ const h=x.n?Math.max(6,Math.round(x.s.kcal/maxK*110)):6; const over=t.kcal&&x.n&&x.s.kcal>t.kcal*1.08; const dn=new Date(x.d+"T00:00:00").toLocaleDateString("ar-EG",{weekday:"short"});
      return `<div style="flex:1;text-align:center;min-width:0"><div class="wbar" style="height:4px;background:${x.n?(over?"#e0507a":"linear-gradient(180deg,var(--acc,#ff6a13),#c2410c)"):"rgba(128,128,150,.18)"};border-radius:8px 8px 3px 3px;transition:height .9s cubic-bezier(.34,1.56,.64,1)" data-h="${h}"></div><small class="muted">${dn}</small><div class="num" style="font-size:.66rem">${x.n?fmt(x.s.kcal):"—"}</div></div>`; }).join("")}</div>
    <p class="hint">الأيام الفاضية ملهاش تسجيل · الأحمر معناه عدّيت الهدف</p>`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll(".wbar").forEach(b=>b.style.height=b.dataset.h+"px")));
  $("#wDays").innerHTML=`<div class="card-h"><div class="ic">🗓</div><h2>يوم بيوم<small>دوس على يوم يفتحه</small></h2></div>`+days.slice().reverse().map(x=>`<div class="item" style="cursor:pointer" data-day="${x.d}"><div class="nm"><b>${niceDate(x.d)}</b><small class="muted num">${x.d}</small></div>${x.n?`<span class="kc num">${fmt(x.s.kcal)}</span><span class="muted" style="font-size:.72rem">ب ${fmt(x.s.P)} · ك ${fmt(x.s.C)} · د ${fmt(x.s.F)}</span>`:`<span class="muted">مفيش تسجيل</span>`}</div>`).join("");
  el.querySelectorAll("[data-day]").forEach(r=>r.onclick=()=>{ S.date=r.dataset.day; renderMeals(el,{mode:"day"}); });
}

async function viewFood(el){ if(S.dietPending){ el.innerHTML=planningCard("food"); return; } return renderMeals(el,{mode:"day"}); }
async function renderMeals(el,{mode}){
  const p=S.client, t=targets(p), meals=Math.max(1,Math.min(+p.meals_per_day||3,8)), planMode=mode==="plan";
  el.innerHTML=(planMode?"":`<div class="card"><div class="between"><button class="btn sm" id="dPrev">→</button><div style="text-align:center"><b>${niceDate(S.date)}</b><div class="muted num">${S.date}</div></div><button class="btn sm" id="dNext">←</button></div>
      <label class="datejump"><input type="date" id="fDate" value="${S.date}" aria-label="اختار اليوم"><span class="datejump-txt">📅 ${new Date(S.date+"T00:00:00").toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span></label><button class="btn sm navy block" id="cpY" style="margin-top:8px">📋 نسخ أكل إمبارح</button><button class="btn sm block" id="wkV" style="margin-top:8px">📊 ملخص الأسبوع</button></div>`)+`<div class="card dark" id="fTot"></div><div id="meals"></div>`;
  if(!planMode){
    $("#fDate").onchange=e=>{S.date=e.target.value; renderMeals(el,{mode});};
    $("#dPrev").onclick=()=>{S.date=addDays(S.date,-1); renderMeals(el,{mode});};
    $("#dNext").onclick=()=>{S.date=addDays(S.date,1); renderMeals(el,{mode});};
    $("#cpY").onclick=async()=>{ const b=$("#cpY"); b.disabled=true; b.textContent="⏳ بنسخ…";
      const yd=addDays(S.date,-1);
      const { data:ydItems, error:yErr }=await sb.from("meal_items").select("*").eq("client_id",p.id).eq("log_date",yd).order("created_at");
      if(yErr){ toast(yErr.message); b.disabled=false; b.textContent="📋 نسخ أكل إمبارح"; return; }
      if(!ydItems||!ydItems.length){ toast("مفيش أكل متسجل إمبارح"); b.disabled=false; b.textContent="📋 نسخ أكل إمبارح"; return; }
      const have=new Set(items.map(i=>i.meal_no+"|"+i.food_id+"|"+(+i.qty)));
      const todo=ydItems.filter(i=>!have.has(i.meal_no+"|"+i.food_id+"|"+(+i.qty)));
      if(!todo.length){ toast("أكل إمبارح متسجل هنا بالفعل ✓"); b.disabled=false; b.textContent="📋 نسخ أكل إمبارح"; return; }
      let done=0;
      for(const i of todo){ const rec={id:crypto.randomUUID(),client_id:p.id,log_date:S.date,meal_no:i.meal_no,food_id:i.food_id,food_name:i.food_name,unit:i.unit,qty:i.qty,kcal:i.kcal,protein:i.protein,carbs:i.carbs,fat:i.fat}; MIN_KEYS.forEach(([k])=>{ if(i[k]!==undefined) rec[k]=i[k]; });
        const { error:cErr }=await dbWrite({op:"insert",table:"meal_items",row:rec}); if(cErr){ toast(cErr.message); break; } done++; }
      if(done) toast(`✓ اتنسخ ${done} صنف من إمبارح`);
      renderMeals(el,{mode}); };
    $("#wkV").onclick=()=>renderFoodWeek(el);
  }
  const [pl,lg]=await Promise.all([
    sb.from("diet_plan_items").select("*").eq("client_id",p.id).order("meal_no").order("position"),
    planMode?{data:[]}:sb.from("meal_items").select("*").eq("client_id",p.id).eq("log_date",S.date).order("created_at")]);
  if(!el.isConnected) return; /* user switched tab while loading */
  const plan=pl.data||[], items=lg.data||[];
  if(!planMode&&S.me.role!=="coach"&&!plan.length) el.insertAdjacentHTML("afterbegin",planningCard("food").replace("plan-wait","plan-wait slim"));
  const drawTot=()=>{ const tot=sumMacros(planMode?plan:items);
    $("#fTot").innerHTML=`<div class="card-h"><div class="ic">${planMode?"📋":"🔥"}</div><h2>${planMode?"إجمالي الخطة":"ملخص اليوم"}<small>${planMode?"مقارنة بأهداف العميل":"المتبقي: "+(t.kcal?fmt(t.kcal-tot.kcal):"—")+" kcal"}</small></h2></div>
      <div style="display:flex;gap:16px;align-items:center">${ring(tot.kcal,t.kcal||1,{size:112,track:"rgba(255,255,255,.15)",label:fmt(tot.kcal),sub:"من "+fmt(t.kcal),textColor:"#fff"})}
      <div style="flex:1;color:#fff">${macroRow("بروتين",tot.P,t.P,"جم")}${macroRow("كارب",tot.C,t.C,"جم")}${macroRow("دهون",tot.F,t.F,"جم")}</div></div>${planMode?mineralTotHTML(plan,"الخطة",p,t.kcal):mineralTotHTML(items,"اللي اتاكل النهارده",p,t.kcal)}`; };
  drawTot();
  const wrap=$("#meals");
  for(let m=1;m<=meals;m++){
    const box=document.createElement("div"); box.className="meal"; let edit=planMode;
    const draw=()=>{
      const mp=plan.filter(i=>i.meal_no===m), ml=items.filter(i=>i.meal_no===m);
      const used=new Set(); const match=pi=>{ const x=ml.find(l=>!used.has(l.id)&&l.food_id===pi.food_id&&+l.qty===+pi.qty); if(x){used.add(x.id);} return x; };
      const planRows=mp.map(pi=>({pi, hit:planMode?null:match(pi)}));
      const extras=ml.filter(l=>!used.has(l.id));
      const sPlan=sumMacros(mp), sEat=sumMacros(ml);
      box.innerHTML=`<div class="meal-h"><div class="ic">${MEAL_ICONS[m-1]}</div><b>${esc(mealName(p,m))}<small>${planMode?`${fmt(sPlan.kcal)} kcal · ب ${fmt(sPlan.P)} · ك ${fmt(sPlan.C)} · د ${fmt(sPlan.F)}`:`أكلت ${fmt(sEat.kcal)} من ${fmt(sPlan.kcal)} kcal في الخطة`}</small></b>
          ${planMode?"":`<button class="btn sm ${edit?"navy":""}" data-edit>${edit?"تم":"✎ الخطة"}</button>`}</div>
        ${mp.length||edit?`<div class="sub">📋 خطة الكوتش</div>`:""}
        ${planRows.map(({pi,hit})=>`<div class="item plan">${planMode||edit?"":`<button class="tick ${hit?"on":""}" data-tick="${pi.id}" title="أكلتها">✓</button>`}
          <div class="nm">${esc(pi.food_name)}<small>${qtyText(pi)}${pi.notes?" · "+esc(pi.notes):""}</small></div><span class="kc num">${fmt(pi.kcal)}</span>${hit?"":`<button class="x" data-swap="${pi.id}" title="تبديل بصنف تاني">⇄</button>`}${edit?`<button class="x" data-pdel="${pi.id}">✕</button>`:""}</div>`).join("")}
        ${!planMode&&extras.length?`<div class="sub">🍽 أكلت كمان</div>`+extras.map(i=>`<div class="item"><div class="nm">${esc(i.food_name)}<small>${qtyText(i)} · ب ${fmt(i.protein,1)} · ك ${fmt(i.carbs,1)} · د ${fmt(i.fat,1)}</small></div><span class="kc num">${fmt(i.kcal)}</span><button class="x" data-ledit="${i.id}" title="تعديل الكمية">✎</button><button class="x" data-ldel="${i.id}">✕</button></div>`).join(""):""}
        ${!mp.length&&!ml.length&&!edit?`<div class="item"><span class="muted">مفيش أصناف لسه</span></div>`:""}
        <div class="meal-f">${edit?`<button class="btn sm navy grow" data-padd>+ صنف للخطة</button>`:`${mp.length?`<button class="btn sm grow" data-all>✓ أكلت الوجبة كلها</button>`:""}<button class="btn sm primary grow" data-ladd>+ سجّل صنف</button>`}</div>`;
      box.querySelector("[data-edit]")&&(box.querySelector("[data-edit]").onclick=()=>{edit=!edit; draw();});
      const logOne=async pi=>{ const rec={id:crypto.randomUUID(),client_id:p.id,log_date:S.date,meal_no:m,food_id:pi.food_id,food_name:pi.food_name,unit:pi.unit,qty:pi.qty,kcal:pi.kcal,protein:pi.protein,carbs:pi.carbs,fat:pi.fat}; MIN_KEYS.forEach(([k])=>{ if(pi[k]!==undefined) rec[k]=pi[k]; });
        const { data:ins, error } = await dbWrite({op:"insert",table:"meal_items",row:rec}); if(error){ toast(error.message); return; } items.push(ins); };
      box.querySelectorAll("[data-swap]").forEach(b=>b.onclick=()=>{ const pi=plan.find(i=>i.id===b.dataset.swap);
        openFoodPicker("تبديل "+pi.food_name, async(food,qty)=>{ const upd={food_id:food.id,food_name:food.name,unit:food.unit,qty,...foodCalc(food,qty),...mineralCalc(food,qty)};
          const { error } = await sb.from("diet_plan_items").update(upd).eq("id",pi.id); if(error) return toast(error.message); Object.assign(pi,upd); draw(); drawTot(); toast("✓ اتبدّل"); }, {match:pi}); });
      box.querySelectorAll("[data-tick]").forEach(b=>b.onclick=async()=>{
        const pr=planRows.find(r=>r.pi.id===b.dataset.tick);
        if(pr.hit){ const { error } = await dbWrite({op:"delete",table:"meal_items",match:{id:pr.hit.id}}); if(error) return toast(error.message); items.splice(items.findIndex(i=>i.id===pr.hit.id),1); }
        else await logOne(pr.pi);
        draw(); drawTot(); });
      box.querySelector("[data-all]")&&(box.querySelector("[data-all]").onclick=async()=>{ for(const r of planRows) if(!r.hit) await logOne(r.pi); draw(); drawTot(); toast("✓ اتسجلت الوجبة"); });
      box.querySelectorAll("[data-ledit]").forEach(b=>b.onclick=()=>{ const it=items.find(i=>i.id===b.dataset.ledit); if(!it||!(+it.qty>0)) return;
        const cnt=COUNT_UNITS(it.unit), step=cnt?0.5:10;
        openSheet(`<div class="between"><b>${esc(it.food_name)}</b><button class="btn sm ghost" data-close>✕</button></div>
          <label class="f">${cnt?"العدد":"الكمية"} (${esc(it.unit||"جم")})</label>
          <div class="stepper"><button data-s="-1">−</button><input id="leQty" inputmode="decimal" value="${+it.qty}"><button data-s="1">+</button></div>
          <div class="card" style="background:var(--acc-soft);box-shadow:none;margin:10px 0" id="lePrev"></div>
          <button class="btn primary block" id="leSave">حفظ</button>`);
        const sc=()=>{ const nq=num($("#leQty").value)||0, k=nq/(+it.qty); return {nq,k}; };
        const prev=()=>{ const {nq,k}=sc(); $("#lePrev").innerHTML=`<div class="between"><b>${fmt(nq,2)} ${esc(it.unit||"جم")}</b><b style="color:var(--acc)" class="num">${fmt((+it.kcal||0)*k)} kcal</b></div><div class="muted">بروتين ${fmt((+it.protein||0)*k,1)} · كارب ${fmt((+it.carbs||0)*k,1)} · دهون ${fmt((+it.fat||0)*k,1)} جم</div>`; };
        $("#leQty").oninput=prev; prev();
        $("#sheetBody").querySelectorAll("[data-s]").forEach(x=>x.onclick=()=>{ $("#leQty").value=Math.max(0,(num($("#leQty").value)||0)+(+x.dataset.s)*step); prev(); });
        $("#sheetBody").querySelector("[data-close]").onclick=closeSheet;
        $("#leSave").onclick=async()=>{ const {nq,k}=sc(); if(!(nq>0)||nq>10000) return toast("اكتب الكمية");
          const upd={qty:nq}; ["kcal","protein","carbs","fat"].forEach(f=>{ upd[f]=+((+it[f]||0)*k).toFixed(1); });
          MIN_KEYS.forEach(([key])=>{ if(it[key]!=null) upd[key]=+(it[key]*k).toFixed(key==="iron_mg"||key==="zinc_mg"?2:1); });
          const { error } = await sb.from("meal_items").update(upd).eq("id",it.id); if(error) return toast(error.message);
          Object.assign(it,upd); closeSheet(); draw(); drawTot(); toast("✓ اتعدّل"); }; });
      box.querySelectorAll("[data-ldel]").forEach(b=>b.onclick=async()=>{ const { error } = await sb.from("meal_items").delete().eq("id",b.dataset.ldel); if(error) return toast(error.message); items.splice(items.findIndex(i=>i.id===b.dataset.ldel),1); draw(); drawTot(); });
      box.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=async()=>{ const { error } = await sb.from("diet_plan_items").delete().eq("id",b.dataset.pdel); if(error) return toast(error.message); plan.splice(plan.findIndex(i=>i.id===b.dataset.pdel),1); draw(); drawTot(); });
      box.querySelector("[data-ladd]")&&(box.querySelector("[data-ladd]").onclick=()=>openFoodPicker("سجّل في "+mealName(p,m), async(food,qty)=>{
        const { data:ins, error } = await sb.from("meal_items").insert({client_id:p.id,log_date:S.date,meal_no:m,food_id:food.id||null,food_name:food.name,unit:food.unit,qty,...foodCalc(food,qty),...mineralCalc(food,qty)}).select().single();
        if(error) return toast(error.message); items.push(ins); draw(); drawTot(); toast("✓ اتسجل"); },{quick:true}));
      box.querySelector("[data-padd]")&&(box.querySelector("[data-padd]").onclick=()=>openFoodPicker("أضف لخطة "+mealName(p,m), async(food,qty)=>{
        const { data:ins, error } = await sb.from("diet_plan_items").insert({client_id:p.id,meal_no:m,position:mp.length,food_id:food.id,food_name:food.name,unit:food.unit,qty,...foodCalc(food,qty),...mineralCalc(food,qty)}).select().single();
        if(error) return toast(error.message); plan.push(ins); draw(); drawTot(); toast("✓ اتضاف للخطة"); }));
    };
    draw(); wrap.appendChild(box);
  }
}

/* ======================================================================
   HABITS
   ====================================================================== */
function dayScore(h){ return avg([h.diet,h.training,h.cardio,h.sleep_quality].map(v=>v===undefined?null:v)); }

/* ======================================================================
   CYCLE (private: only the client + coach; never in league or shared views)
   ====================================================================== */
function cycleStarts(rows){ const per=new Set(rows.filter(r=>r.kind==="period").map(r=>r.log_date)); return [...per].filter(d=>!per.has(addDays(d,-1))).sort(); }
function cycleInfo(rows,date){
  const all=cycleStarts(rows), st=all.filter(d=>d<=date); if(!st.length) return null;
  const last=st[st.length-1], day=Math.round((new Date(date)-new Date(last))/864e5)+1;
  const gaps=all.slice(1).map((d,i)=>(new Date(d)-new Date(all[i]))/864e5).filter(g=>g>=18&&g<=45);
  const len=gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):28, mid=Math.round(len/2);
  if(day>len+10) return {stale:true,last};
  return {day,len,last,phase:day<=5?"فترة الدورة":day<=mid-2?"بعد الدورة":day<=mid+1?"منتصف الدورة":"قبل الدورة"};
}
async function cycleCard(host,p,rerender){
  if(!host||!p) return;
  const coach=S.me&&S.me.role==="coach";
  if(p.sex!=="أنثى"){ host.innerHTML=""; return; }
  if(!coach&&localStorage.getItem("cyc_hide")==="1"){
    host.innerHTML=`<div class="muted" style="text-align:center;margin:4px 0 12px;font-size:.8rem">🌸 كارد الدورة مخفي · <a href="#" id="cycShow" style="color:var(--acc,#ff6a13);font-weight:700">إظهار</a></div>`;
    $("#cycShow").onclick=e=>{ e.preventDefault(); localStorage.removeItem("cyc_hide"); rerender&&rerender(); }; return;
  }
  const { data }=await sb.from("cycle_logs").select("log_date,kind").eq("client_id",p.id).gte("log_date",addDays(S.date,-120)).order("log_date");
  const rows=data||[], by={}; rows.forEach(r=>by[r.log_date]=r.kind);
  const info=cycleInfo(rows,S.date), cur=by[S.date];
  const K=[["period","🩸","فترة الدورة"],["pms","🌙","قبل الدورة"]];
  const strip=Array.from({length:28},(_,i)=>{ const d=addDays(S.date,i-27), k=by[d]; return `<i title="${d}" style="aspect-ratio:1/1;border-radius:6px;display:block;background:${k==="period"?"#e0507a":"rgba(128,128,150,.2)"};${k==="pms"?"box-shadow:inset 0 0 0 2px #f0a24b;":""}${d===S.date?"outline:2px solid var(--acc,#ff8a2b);outline-offset:1px;":""}"></i>`; }).join("");
  const line=info?(info.stale?`آخر دورة سجلتيها كانت ${niceDate(info.last)}`:`النهارده يوم ${info.day} من دورتك تقريباً · ${info.phase}`):(coach?"مفيش دورة متسجلة لسه":"سجّلي أول يوم دورة وهنحسبلك باقي الأيام");
  host.innerHTML=`<div class="card"><div class="card-h"><div class="ic" style="background:rgba(224,80,122,.18)">🌸</div><h2>دورتك<small>اختياري · ${coach?"للقراءة فقط":"خاص بيكي وبالكوتش بس"}</small></h2></div>
    ${coach?"":`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">${K.map(([k,e,t])=>`<button class="chip ${cur===k?"on":""}" data-ck="${k}" style="min-height:44px">${e} ${t}</button>`).join("")}</div>`}
    <div style="font-weight:700;margin-bottom:8px">${line}</div>
    <div style="display:grid;grid-template-columns:repeat(14,1fr);gap:4px;margin-bottom:10px" dir="ltr">${strip}</div>
    <div class="muted" style="font-size:.78rem;line-height:1.7">${coach?"تقدير تقريبي من الأيام المسجلة، بيساعدك تفسّر تغيّر الوزن وتظبط البرنامج بنفسك.":"الكوتش بيشوفها عشان يفهم تغيّر وزنك ويظبط برنامجك بنفسه. التطبيق مش بيغيّر حاجة لوحده ومش بيدّي نصايح طبية. مش هتظهر لأي حد تاني، ولا في الدوري."}${coach?"":` <a href="#" id="cycHide" style="color:var(--acc,#ff6a13);font-weight:700">إخفاء الكارد</a>`}</div></div>`;
  if(coach) return;
  host.querySelectorAll("[data-ck]").forEach(b=>b.onclick=async()=>{
    const k=b.dataset.ck; let r;
    if(cur===k) r=await sb.from("cycle_logs").delete().eq("client_id",p.id).eq("log_date",S.date);
    else r=await sb.from("cycle_logs").upsert({client_id:p.id,log_date:S.date,kind:k},{onConflict:"client_id,log_date"});
    if(r.error) return toast("مقدرتش أحفظ، جرّب تاني"); toast("✓ اتحفظ"); cycleCard(host,p,rerender);
  });
  const h=$("#cycHide"); if(h) h.onclick=e=>{ e.preventDefault(); localStorage.setItem("cyc_hide","1"); rerender&&rerender(); };
}
/* ======================================================================
   HABITS — "لوحة الحديد والطباشير"  (styles live in mofit-habits.css)
   Same table, same columns, same save path as before: one habits row per
   day (diet / training / cardio / sleep_quality on the 0-25-50-75-100
   scale, plus stress, sleep_hours, water_l, steps, cardio_min, notes).
   Only the presentation changed: the four identical score rows became
   four stations with their own mark (plate / barbell / pulse / moon), the
   day score became an iron plate, and the weekly averages became a chalk
   ledger. No new columns, no new writes.
   ====================================================================== */
const HB_STN=[
  {k:"diet",t:"الدايت",s:"الطبق والماكروز",g:"plate",
   p:`<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="2.6"/>`},
  {k:"training",t:"التمرين",s:"الحديد اللي شلته",g:"bar",
   p:`<path d="M4.2 7.4v9.2M19.8 7.4v9.2M7.8 9.4v5.2M16.2 9.4v5.2M7.8 12h8.4"/>`},
  {k:"cardio",t:"الكارديو",s:"النفس والحركة",g:"pulse",
   p:`<path d="M2.6 12h3.5l2.1-5.3 3 10.6 2.6-7.5 1.6 2.2h6"/>`},
  {k:"sleep_quality",t:"جودة النوم",s:"الاستشفاء",g:"moon",
   p:`<path d="M20 14.4A8.1 8.1 0 019.6 4 8.1 8.1 0 1020 14.4z"/>`}
];
const HB_PIP={
  plate:`<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="2.8"/>`,
  bar:`<path d="M4.6 7.6v8.8M19.4 7.6v8.8M8.2 9.6v4.8M15.8 9.6v4.8M8.2 12h7.6"/>`,
  pulse:`<path d="M2.4 12h3.8l2-4.6 2.7 9.2 2.3-6.6 1.5 2h6.9"/>`,
  moon:`<path d="M18.6 15.2A7.4 7.4 0 019.4 5.6a7.7 7.7 0 109.2 9.6z"/>`
};
function hbVerdict(s){
  if(s===null||s===undefined) return "لسه ما سجلتش";
  if(s>=.95) return "يوم حديد كامل";
  if(s>=.75) return "يوم نضيف";
  if(s>=.5) return "ماشي على الصح";
  if(s>0) return "يوم بايظ شوية";
  return "يوم صفر";
}
function hbCount(node,from,to){
  const tn=node&&node.firstChild; if(!tn) return;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches){ tn.nodeValue=String(to); return; }
  const t0=performance.now(), dur=520;
  const step=t=>{ const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,3); tn.nodeValue=String(Math.round(from+(to-from)*e)); if(k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function hbHeat(p,H){
  const by=Object.fromEntries(H.map(h=>[h.log_date,dayScore(h)]));
  const start=p.start_date||today(), wk=currentWeek(p);
  let html=`<div class="heat"><span></span>${["1","2","3","4","5","6","7"].map(d=>`<span style="text-align:center">${d}</span>`).join("")}`;
  const b0=(blockOf(wk)-1)*BLOCK;
  for(let w=b0+1;w<=Math.max(wk,b0+4)&&w<=b0+BLOCK;w++){
    html+=`<span>أ${w}</span>`;
    for(let d=0;d<7;d++){ const iso=addDays(start,(w-1)*7+d), s=by[iso]; const lv=s===undefined||s===null?"":s>=.9?"l4":s>=.7?"l3":s>=.45?"l2":"l1"; html+=`<i class="${lv} ${iso===today()?"today":""}" style="--k:${(w-b0-1)+d}" title="${iso}"></i>`; }
  }
  return html+`</div><div class="hb-key"><span><i style="background:rgba(244,241,234,.14)"></i>ضعيف</span><span><i style="background:rgba(244,241,234,.3)"></i>كويس</span><span><i style="background:rgba(255,179,71,.62)"></i>ممتاز</span><span><i style="background:var(--acc,#FF6B1A)"></i>يوم كامل</span><span><i style="background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)"></i>مفيش تسجيل</span></div>`;
}
async function viewHabits(el){
  const p=S.client;
  const { data:all } = await sb.from("habits").select("*").eq("client_id",p.id).order("log_date");
  const H=all||[], cur=H.find(h=>h.log_date===S.date)||{}, rec={...cur}, w=weekOfDate(p,S.date);
  const has=k=>cur[k]!==null&&cur[k]!==undefined;
  const sc=dayScore(cur), filled=HB_STN.filter(x=>has(x.k)).length;
  const goal=+p.steps_goal||0, cardioPlan=+(p.cardio_plan&&p.cardio_plan.minutes)||0;
  const stepsPct=goal&&cur.steps?Math.min(100,Math.round(cur.steps/goal*100)):0;
  const longDay=new Date(S.date+"T00:00:00").toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"});
  const strip=(()=>{
    if(!w||!p.start_date) return "";
    const d0=addDays(p.start_date,(w-1)*7), by={}; H.forEach(h=>{ by[h.log_date]=dayScore(h); });
    return `<div class="hb-week">${[0,1,2,3,4,5,6].map(i=>{
      const iso=addDays(d0,i), s=by[iso];
      const lv=s===undefined||s===null?"":s>=.9?"l4":s>=.7?"l3":s>=.45?"l2":"l1";
      return `<button class="hb-day ${lv} ${iso===S.date?"on":""} ${iso===today()?"now":""}" data-d="${iso}" aria-label="${iso}"><b>${new Date(iso+"T00:00:00").toLocaleDateString("ar-EG",{day:"numeric"})}</b><i></i></button>`;
    }).join("")}</div>`;
  })();
  const C=2*Math.PI*70, arc0=C*(1-(sc||0));
  el.innerHTML=`<div class="hb-rail">
      <button class="hb-nav" id="dPrev" aria-label="اليوم اللي فات">→</button>
      <div class="hb-date"><b>${niceDate(S.date)}</b><span>${w?"أسبوع "+w+" · ":""}${longDay}</span></div>
      <button class="hb-nav" id="dNext" aria-label="اليوم اللي بعده">←</button>
    </div>${strip}
    <div class="hb-hero hb-panel" style="--i:0">
      <div class="hb-hero-txt">
        <span class="hb-kicker">لوحة النهارده</span>
        <h2 id="hbVerdict">${hbVerdict(sc)}</h2>
        <p id="hbSub">${filled?filled+" من 4 متسجلين":"مفيش حاجة متسجلة لسه"}</p>
        <div class="hb-ticks" id="hbTicks">${HB_STN.map(x=>`<i class="${has(x.k)?"on":""}"></i>`).join("")}</div>
      </div>
      <div class="hb-plate">
        <svg class="hb-ring" viewBox="0 0 176 176" aria-hidden="true">
          <defs><linearGradient id="hbG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FF6B1A"/><stop offset="1" stop-color="#FFD08A"/></linearGradient></defs>
          <circle class="hb-knurl" cx="88" cy="88" r="82"/>
          <circle class="hb-track" cx="88" cy="88" r="70"/>
          <circle class="hb-arc" id="hbArc" cx="88" cy="88" r="70" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${arc0.toFixed(1)}"/>
          <circle class="hb-eng" cx="88" cy="88" r="57"/>
        </svg>
        <div class="hb-mid"><b class="hb-num" id="hbNum">${Math.round((sc||0)*100)}<span>%</span></b><small>التزام النهارده</small></div>
        <div class="hb-dust" id="hbDust"></div>
      </div>
    </div>
    <div class="hb-stns hb-panel" style="--i:1">
      <div class="hb-h"><b>الالتزام</b><small>اضغط على الدرجة اللي تعبّر عن يومك</small></div>
      ${HB_STN.map(st=>{
        const v=has(st.k)?+cur[st.k]:null;
        return `<div class="hb-stn ${v!==null?"on":""}" data-stn="${st.k}">
          <div class="hb-stn-h">
            <span class="hb-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${st.p}</svg></span>
            <span class="hb-nm"><b>${st.t}</b><small>${st.s}</small></span>
            <b class="hb-val ${v===null?"off":""}" data-val="${st.k}">${v===null?"—":pct(v)}</b>
          </div>
          <div class="hb-scale" data-score="${st.k}">${SCORE.map(([sv],i)=>`<button class="hb-pip ${v!==null&&v===+sv?"on":""}" data-v="${sv}" style="--lv:${SCORE.length-1-i}" aria-label="${pct(sv)}" aria-pressed="${v!==null&&v===+sv}"><svg class="pp" viewBox="0 0 24 24" aria-hidden="true">${HB_PIP[st.g]}</svg></button>`).join("")}</div>
          <span class="hb-line"><i data-line="${st.k}" style="width:${v!==null?v*100:0}%"></i></span>
        </div>`;
      }).join("")}
    </div>
    <div class="hb-tray hb-panel" style="--i:2">
      <div class="hb-h"><b>دفتر النهارده</b><small>الأرقام اللي الكوتش بيشوفها</small></div>
      <div class="hb-g2">
        <label class="hb-fld"><span>المياه</span><div class="hb-in"><input inputmode="decimal" data-k="water_l" value="${esc(cur.water_l??"")}" placeholder="0"><i>لتر</i></div></label>
        <label class="hb-fld"><span>الخطوات${goal?` <small>· الهدف ${fmt(goal)}</small>`:""}</span><div class="hb-in"><input inputmode="numeric" data-k="steps" value="${esc(cur.steps??"")}" placeholder="0"><i>خطوة</i></div><span class="hb-bar"><i id="hbSteps" style="width:${stepsPct}%"></i></span></label>
        <label class="hb-fld"><span>ساعات النوم</span><div class="hb-in"><input inputmode="decimal" data-k="sleep_hours" value="${esc(cur.sleep_hours??"")}" placeholder="0"><i>ساعة</i></div></label>
        <label class="hb-fld"><span>دقايق الكارديو${cardioPlan?` <small>· المطلوب ${fmt(cardioPlan)}</small>`:""}</span><div class="hb-in"><input inputmode="numeric" data-k="cardio_min" value="${esc(cur.cardio_min??"")}" placeholder="0"><i>دقيقة</i></div></label>
      </div>
      <div class="hb-stress">
        <span class="hb-lab">التوتر</span>
        <select data-k="stress" class="hb-sr" aria-label="التوتر"><option value=""></option>${STRESS.map(s=>`<option ${cur.stress===s?"selected":""}>${s}</option>`).join("")}</select>
        <div class="hb-seg" data-seg="stress">${STRESS.map(s=>`<button type="button" data-sv="${esc(s)}" class="${cur.stress===s?"on":""}">${esc(s)}</button>`).join("")}</div>
      </div>
      <label class="hb-notes"><span class="hb-lab">ملاحظاتك</span><textarea rows="2" data-k="notes" placeholder="حاجة حصلت النهارده تحب تفتكرها؟">${esc(cur.notes??"")}</textarea></label>
      <button class="btn primary block hb-save" id="hSave">سجّل اليوم</button>
    </div>
    <div id="ghSlot"></div>
    <div id="cycSlot"></div>
    <div class="hb-hist hb-panel" style="--i:3">
      <div class="hb-h"><b>سجلك</b><small>كل مربع = يوم · اللون = درجة اليوم</small></div>
      ${hbHeat(p,H)}
      <div class="hb-ledger" id="hWeeks"></div>
    </div>`;
  $("#dPrev").onclick=()=>{S.date=addDays(S.date,-1); viewHabits(el);};
  $("#dNext").onclick=()=>{S.date=addDays(S.date,1); viewHabits(el);};
  el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ S.date=b.dataset.d; viewHabits(el); });
  window.ghRenderStepsSlot&&window.ghRenderStepsSlot($("#ghSlot"),p,()=>viewHabits(el));
  cycleCard($("#cycSlot"),p,()=>viewHabits(el));

  /* ---- live paint: plate, verdict, ticks, station values ---- */
  const q=s=>el.querySelector(s), arc=q("#hbArc"), numEl=q("#hbNum");
  let shown=Math.round((sc||0)*100);
  const burst=()=>{ const d=q("#hbDust"); if(!d) return; d.innerHTML="";
    for(let i=0;i<9;i++){ const a=(Math.PI*2*i)/9+Math.random()*.6, dist=40+Math.random()*26, s=document.createElement("i");
      s.style.setProperty("--tx",(Math.cos(a)*dist).toFixed(1)+"px"); s.style.setProperty("--ty",(Math.sin(a)*dist).toFixed(1)+"px"); s.style.setProperty("--n",i); d.appendChild(s); }
    d.classList.remove("go"); void d.offsetWidth; d.classList.add("go"); };
  const paint=()=>{
    const s=dayScore(rec);
    if(arc) arc.style.strokeDashoffset=(C*(1-(s||0))).toFixed(1);
    if(numEl){ const to=Math.round((s||0)*100); hbCount(numEl,shown,to); shown=to; }
    const vd=q("#hbVerdict"); if(vd){ vd.textContent=hbVerdict(s); vd.classList.remove("hb-flip"); void vd.offsetWidth; vd.classList.add("hb-flip"); }
    const n=HB_STN.filter(x=>rec[x.k]!==null&&rec[x.k]!==undefined).length;
    const sub=q("#hbSub"); if(sub) sub.textContent=n?n+" من 4 متسجلين":"مفيش حاجة متسجلة لسه";
    el.querySelectorAll("#hbTicks i").forEach((t,i)=>t.classList.toggle("on",rec[HB_STN[i].k]!==null&&rec[HB_STN[i].k]!==undefined));
    HB_STN.forEach(st=>{ const v=rec[st.k], on=v!==null&&v!==undefined;
      const val=q(`[data-val="${st.k}"]`); if(val){ val.textContent=on?pct(v):"—"; val.classList.toggle("off",!on); }
      const line=q(`[data-line="${st.k}"]`); if(line) line.style.width=(on?v*100:0)+"%";
      const box=q(`[data-stn="${st.k}"]`); if(box) box.classList.toggle("on",on); });
  };
  el.querySelectorAll("[data-score]").forEach(g=>g.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    g.querySelectorAll("button").forEach(x=>{ x.classList.remove("on"); x.setAttribute("aria-pressed","false"); });
    b.classList.add("on"); b.setAttribute("aria-pressed","true"); rec[g.dataset.score]=+b.dataset.v;
    burst(); paint(); }));

  /* ---- stress chips drive the same select the save reads ---- */
  const sel=q('[data-k="stress"]');
  el.querySelectorAll("[data-seg] button").forEach(b=>b.onclick=()=>{
    const same=b.classList.contains("on");
    el.querySelectorAll("[data-seg] button").forEach(x=>x.classList.remove("on"));
    if(same){ sel.value=""; } else { b.classList.add("on"); sel.value=b.dataset.sv; }
  });
  /* ---- steps bar follows the number as it is typed ---- */
  const st=q('[data-k="steps"]');
  if(st&&goal) st.addEventListener("input",()=>{ const v=num(st.value); q("#hbSteps").style.width=(v?Math.min(100,Math.round(v/goal*100)):0)+"%"; });

  $("#hSave").onclick=async()=>{
    const v=k=>el.querySelector(`[data-k="${k}"]`);
    const out={client_id:p.id,log_date:S.date,diet:rec.diet??null,training:rec.training??null,cardio:rec.cardio??null,sleep_quality:rec.sleep_quality??null,
      stress:v("stress").value||null,sleep_hours:num(v("sleep_hours").value),water_l:num(v("water_l").value),steps:num(v("steps").value),cardio_min:num(v("cardio_min").value),notes:v("notes").value.trim()||null,updated_at:new Date().toISOString()};
    const { error, queued } = await dbWrite({op:"upsert",table:"habits",row:out,onConflict:"client_id,log_date"}); if(error) return toast(error.message); toast(queued?"📴 اتحفظ على الموبايل":"✓ اتحفظ"); if(!queued) viewHabits(el);
  };
  /* ---- weekly ledger: same averages as the old table ---- */
  const wk=currentWeek(p), by={}; H.forEach(h=>{ const x=weekOfDate(p,h.log_date); if(x) (by[x]=by[x]||[]).push(h); });
  const col=[["a","دايت"],["b","تمرين"],["c","كارديو"],["d","نوم"]];
  $("#hWeeks").innerHTML=`<div class="hb-sub"><b>المتوسط الأسبوعي</b><small>نسبة الالتزام لكل أسبوع</small></div>
    <div class="hb-leg">
      <div class="hb-lh"><span>أسبوع</span><span>الالتزام</span><span>ساعات</span><span>خطوات</span><span>أيام</span></div>
      <div class="hb-lkey">${col.map(([c,l])=>`<i class="${c}"></i>${l}`).join("")}</div>
      ${planWeekList(p,wk).map(x=>{ const a=by[x]||[], c=x===wk?"cur":"";
        const vals=[avg(a.map(h=>h.diet)),avg(a.map(h=>h.training)),avg(a.map(h=>h.cardio)),avg(a.map(h=>h.sleep_quality))];
        return `<div class="hb-lr ${c}"><b class="num">${x}</b>
          <span class="hb-lb">${vals.map((v,i)=>`<i class="${"abcd"[i]}" style="height:${v===null?3:Math.max(3,Math.round(v*100))}%"></i>`).join("")}</span>
          <span class="num">${fmt(avg(a.map(h=>h.sleep_hours)),1)}</span>
          <span class="num">${fmt(avg(a.map(h=>h.steps)))}</span>
          <span class="num">${a.length||"—"}</span></div>`; }).join("")}
    </div>`;
}

/* ======================================================================
   BODY
   ====================================================================== */
async function viewBody(el){
  S.bodySeg=S.bodySeg||"m";
  el.innerHTML=`<div class="seg" style="margin-bottom:14px"><button data-bs="m" class="${S.bodySeg==="m"?"on":""}">📏 القياسات</button><button data-bs="c" class="${S.bodySeg==="c"?"on":""}">📸 المتابعة الأسبوعية</button><button data-bs="p" class="${S.bodySeg==="p"?"on":""}">🎬 بوزينج</button><button data-bs="k" class="${S.bodySeg==="k"?"on":""}">🏁 بيك ويك</button></div><div id="bodyHost"></div>`;
  el.querySelectorAll("[data-bs]").forEach(b=>b.onclick=()=>{ S.bodySeg=b.dataset.bs; viewBody(el); });
  if(S.bodySeg==="p") return viewPosing($("#bodyHost"));
  if(S.bodySeg==="k") return viewPeak($("#bodyHost"));
  return S.bodySeg==="c" ? viewCheckin($("#bodyHost")) : viewMeasures($("#bodyHost"));
}
function weightTrend(B,p){
  const W=B.filter(b=>b.weight&&b.week>=0).map(b=>({x:b.week,y:+b.weight})).sort((a,b)=>a.x-b.x);
  if(W.length<3) return null;
  const MA=W.map((pt,i)=>{ const w=W.slice(Math.max(0,i-2),i+1); return {x:pt.x,y:w.reduce((a,q)=>a+q.y,0)/w.length}; });
  const R=W.slice(-4), n=R.length, mx=R.reduce((a,q)=>a+q.x,0)/n, my=R.reduce((a,q)=>a+q.y,0)/n;
  const den=R.reduce((a,q)=>a+(q.x-mx)**2,0), rate=den?R.reduce((a,q)=>a+(q.x-mx)*(q.y-my),0)/den:0;
  const last=MA[MA.length-1].y, pctWk=rate/last*100, g=p.goal||"";
  let kind="ok", text="الاتجاه ماشي كويس";
  if(/تنشيف|خسارة|تخسيس/.test(g)){ if(rate>-0.1){ kind="warn"; text="الوزن واقف – وقت تعدّل السعرات أو الكارديو"; } else if(pctWk<-1){ kind="warn"; text="النزول سريع – خلي بالك على العضلات"; } else text="نزول مضبوط 👌"; }
  else if(/زيادة|تضخيم|بناء/.test(g)){ if(rate<0.05){ kind="warn"; text="الوزن مش بيزيد – وقت تزوّد السعرات"; } else if(pctWk>0.5){ kind="warn"; text="الزيادة سريعة – ممكن تبقى دهون زيادة"; } else text="زيادة مضبوطة 👌"; }
  else text=Math.abs(rate)<0.15?"الوزن ثابت":"الوزن بيتغير";
  return {MA,rate,kind,text,last};
}
function weightTrendCard(B,p){
  const t=weightTrend(B,p); if(!t) return `<div class="card"><div class="card-h"><div class="ic acc">📉</div><h2>اتجاه الوزن<small>بيظهر بعد 3 قياسات</small></h2></div></div>`;
  return `<div class="card wtrend ${t.kind}"><div class="card-h"><div class="ic acc">📉</div><h2>اتجاه الوزن<small>متوسط متحرك – مش وزن يوم واحد</small></h2></div>
    <div class="wt-row"><b class="num">${fmt(t.last,1)}</b><span>كجم (متوسط)</span><span class="pill ${t.kind==="warn"?"acc":"acc-soft"}">${t.rate>0?"▲":"▼"} ${fmt(Math.abs(t.rate),2)} كجم/أسبوع</span></div>
    <p class="wt-v">${t.kind==="warn"?"⚠ ":"✅ "}${t.text}</p>${lineChart(t.MA,"كجم","#F97316")}</div>`;
}
async function viewMeasures(el){
  const p=S.client, { data } = await sb.from("body_logs").select("*").eq("client_id",p.id).order("week");
  const B=data||[], wk=currentWeek(p), sel=S.bodyWeek ?? (B.find(b=>b.week===0)?wk:0);
  const cur=B.find(b=>b.week===sel)||{}, start=B.find(b=>b.week===0)||{};
  const F=[["weight","⚖ الوزن","كجم"],["waist","الوسط","سم"],["neck","الرقبة","سم"],["chest","الصدر","سم"],["arm","الذراع","سم"],["thigh","الفخذ","سم"],["hips","الأرداف","سم"],["bodyfat","الدهون","%"]];
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic dark">📏</div><h2>القياسات الأسبوعية<small>مرة في الأسبوع – نفس اليوم والتوقيت</small></h2></div>
      ${blockNavHTML(sel||1,p)}<div class="scroller">${[0,...planWeekList(p,sel||wk||1)].map(i=>`<button class="chip ${sel===i?"on":""} ${wk===i&&i?"cur":""}" data-w="${i}">${i?"أسبوع "+i:"البداية"}${B.find(b=>b.week===i&&b.weight)?" ✓":""}</button>`).join("")}</div>
      <div class="grid2" style="margin-top:12px"><label class="f">📅 التاريخ${djField(`<input type="date" data-k="log_date" value="${esc(cur.log_date??today())}">`,cur.log_date??today())}</label>
      ${F.map(([k,l,u])=>{ const d=sel&&start[k]&&cur[k]?cur[k]-start[k]:null; return `<label class="f">${l} (${u})<input inputmode="decimal" data-k="${k}" value="${esc(cur[k]??"")}">${d!==null?`<span class="pill ${d<0?"acc-soft":""}" style="margin-top:4px">${d>0?"▲":"▼"} ${fmt(Math.abs(d),1)} منذ البداية</span>`:""}</label>`; }).join("")}</div>
      <label class="f">ملاحظات<textarea rows="2" data-k="notes">${esc(cur.notes??"")}</textarea></label>
      <button class="btn primary block" id="bSave">حفظ ${sel?"الأسبوع "+sel:"قياسات البداية"}</button></div>
    ${window.DigitalTwin?DigitalTwin.cardHTML(p,B):""}
    ${weightTrendCard(B,p)}
    <div class="card"><div class="card-h"><div class="ic acc">⚖</div><h2>منحنى الوزن</h2></div>${lineChart(B.filter(b=>b.weight).map(b=>({x:b.week,y:+b.weight})),"كجم")}</div>
    <div class="card"><div class="card-h"><div class="ic">📐</div><h2>منحنى الوسط</h2></div>${lineChart(B.filter(b=>b.waist).map(b=>({x:b.week,y:+b.waist})),"سم")}</div>`;
  restoreWeekChips(el,window._wsX); window._wsX=null;
  if(window.DigitalTwin) DigitalTwin.hydrate(el,p);
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{ window._wsX=weekChipsX(el); S.bodyWeek=+b.dataset.w; viewMeasures(el);});
  $("#bSave").onclick=async()=>{
    const v=k=>el.querySelector(`[data-k="${k}"]`).value;
    const rec={client_id:p.id,week:sel,log_date:v("log_date")||null,notes:v("notes").trim()||null,updated_at:new Date().toISOString()};
    F.forEach(([k])=>rec[k]=num(v(k)));
    const { error, queued } = await dbWrite({op:"upsert",table:"body_logs",row:rec,onConflict:"client_id,week"}); if(error) return toast(error.message); toast(queued?"📴 اتحفظ على الموبايل":"✓ اتحفظ"); if(!queued) viewMeasures(el);
  };
}

async function homeCheckinCard(p,wk){
  const host=$("#hCI"); if(!host) return;
  const { data } = await sb.from("checkins").select("week,reviewed_at,coach_reply").eq("client_id",p.id).order("week",{ascending:false}).limit(3);
  if(!host.isConnected) return;
  const C=data||[], thisW=C.find(c=>c.week===wk), lastReply=C.find(c=>c.coach_reply), sub=S.me.role==="client"?subStatus(p):null;
  host.innerHTML=(sub?(sub.cls!=="good"?`<div class="card" style="border:1.5px solid var(--acc-line)"><div class="card-h"><div class="ic acc">${sub.icon}</div><h2>اشتراكك<small>${esc(sub.text)}</small></h2><button class="btn sm primary" onclick="openPlansSheet()">جدّد</button></div></div>`:`<div class="card"><div class="card-h"><div class="ic acc">${sub.icon}</div><h2>اشتراكك<small>${esc(sub.text)}</small></h2></div></div>`):"")+
    `<div class="card"><div class="card-h"><div class="ic acc">📸</div><h2>متابعة الأسبوع ${wk}<small>${thisW?(thisW.reviewed_at?"✓✓ الكوتش رد":"✓ اتبعتت – مستنية رد الكوتش"):"لسه ما اتبعتتش – وزن + صور + إحساسك"}</small></h2><button class="btn sm ${thisW?"":"primary"}" id="goCI">${thisW?"عرض":"ابعت"}</button></div>
     ${lastReply?`<p class="hint" style="white-space:pre-wrap">💬 آخر رد (أسبوع ${lastReply.week}): ${esc(lastReply.coach_reply.slice(0,160))}${lastReply.coach_reply.length>160?"…":""}</p>`:""}</div>`;
  $("#goCI").onclick=()=>{ S.tab="body"; S.bodySeg="c"; S.ciWeek=wk; render(); };
          }
