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
  let me=null; try{ ({ data:me } = await sb.from("profiles").select("*").eq("id",session.user.id).single()); }catch(e){ me=null; }
  if(me) cacheSet("me",me); else { me=cacheGet("me"); if(!me||me.id!==session.user.id){ $("#loginView").classList.add("hidden"); $("#appView").classList.remove("hidden"); window.__bootN=(window.__bootN||0)+1; waitCard($("#main"),()=>boot(),Math.min(window.__bootN-1,5)); return; } }
  if(!me.active){ await sb.auth.signOut(); $("#loginView").classList.remove("hidden"); $("#loginErr").textContent=me.signup_days?"طلبك قيد المراجعة – الكوتش هيفعّل حسابك بعد تأكيد الاشتراك":"الحساب غير مفعّل – تواصل مع الكوتش"; return; }
  S.me=me; $("#loginView").classList.add("hidden"); $("#appView").classList.remove("hidden");
  if(me.role==="assistant"){ S.assistant=true; renderAssistantHome(); return; }
  if(!$("#main").children.length) $("#main").innerHTML=skelCards();
  await loadVideos(); flushQueue();
  if(me.role==="coach"){ S.tab="clients"; await Promise.all([loadClients(),loadCoachTemplates(),loadDietTemplates()]); }
  else { await openClient(me); const qt=new URLSearchParams(location.search).get("tab"); if(qt==="supps"&&S.supps?.length){ S.tab="supps"; } else if(qt==="train"||qt==="food"){ S.tab=qt; if(qt==="food") S.date=today(); } }
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
  const { data, error } = await sb.from("program_exercises").select("*").eq("client_id",p.id).order("day_no").order("position");
  S.program=error? (cacheGet("prog_"+p.id)||[]) : (data||[]); if(!error) cacheSet("prog_"+p.id,S.program);
  S.progPending=!!p.program_pending&&S.me?.role!=="coach"; if(S.progPending) S.program=[]; S.dietPending=!!p.diet_pending&&S.me?.role!=="coach";
  const days=[...new Set(S.program.map(e=>e.day_no))];
  S.day = todayDayNo() || days[0] || 1;
  S.supps=[]; if(S.me?.role!=="coach") await loadSupps(p);
}
async function refreshClient(){ const { data } = await sb.from("profiles").select("*").eq("id",S.client.id).single(); const tab=S.tab, day=S.day, wk=S.week; await openClient(data); S.tab=tab; S.day=day; S.week=wk; }
function tabs(){
  if(S.me.role==="coach" && !S.client) return [["clients","العملاء"],["videos","التمارين"],["foods","الأطعمة"]];
  const t=[["home","الرئيسية"],["train","التمرين"],["food","التغذية"],["habits","العادات"],["body","التقدم"]];
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
      <div class="ringwrap">${ring(wInBlock(wk),BLOCK,{size:64,stroke:7,color:"#F97316",track:"rgba(255,255,255,.15)",label:wInBlock(wk),sub:wk>BLOCK?"بلوك "+blockOf(wk):"من 12",textColor:"#fff"})}</div></div>`;
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
  try{ const r=({home:viewHome,train:viewTrain,food:viewFood,habits:viewHabits,body:viewBody,setup:viewSetup,supps:viewSupps,clients:viewClients,videos:viewVideos,foods:viewFoods,ai:window.viewAiChat}[S.tab]||viewHome)(host); if(r&&r.catch) r.catch(e=>{ console.warn(e); waitCard(host,n=>{ window.__rn=n; render(); },window.__rn||0); }); }catch(e){ console.warn(e); waitCard(host,n=>{ window.__rn=n; render(); },window.__rn||0); }
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
async function viewHome(el){
  const p=S.client, t=targets(p), wk=currentWeek(p), dn=todayDayNo();
  const todayEx=S.program.filter(e=>e.day_no===dn);
  el.innerHTML=`${progWait()?planningCard("train"):`<div class="card dark hero"><div class="card-h"><div class="ic">💪</div><h2>تمرين النهارده<small>${dn?"يوم "+dn+(dayLabel(dn)?" · "+esc(dayLabel(dn)):""):"يوم راحة واستشفاء"}</small></h2>${dn?`<span class="pill acc">${todayEx.length} تمارين</span>`:""}</div>
      ${dn?`<div class="hero-body">${anatomySVG(muscleVol(todayEx.map(e=>[e.name,e.sets])),{dark:true})}<div>${muscleLegend(muscleVol(todayEx.map(e=>[e.name,e.sets])),{dark:true})}<small class="hero-sub">${todayEx.length} تمارين · ${todayEx.reduce((a,e)=>a+(+e.sets||0),0)} مجموعة</small></div></div><button class="btn primary block" style="margin-top:10px" id="goTrain">ابدأ التمرين ←</button>`
          :`<p class="hint">😴 الراحة جزء من التطور. سجّل نومك ومياهك وخطواتك في العادات.</p>`}</div>`}
    <div id="hToday"></div><div id="hMiss"></div><div id="hRecap"></div>
    <div class="card" id="hN"><div class="card-h"><div class="ic acc">🍽</div><h2>تغذية النهارده<small>${niceDate(today())}</small></h2></div><p class="muted">جارٍ التحميل…</p></div>
    <div id="hSteps"></div><div id="hCI"></div><div id="hCardio"></div>
    <div id="hFlame"></div><div id="hStreak"></div><div id="hFirst"></div>
    <div id="ghHome"></div>${S.me.role==="client"?installCardHTML():""}
    ${tipCardHTML()}
    <div class="card" id="hF"></div>
    <div class="card" id="hH"></div>
    <div class="card" id="hB"></div><div id="hLoad"></div><div id="hGoal"></div><div id="hComp"></div><div id="hStr"></div><div id="hHr"></div><div id="hHealth"></div>`;
  wireInstall();
  window.ghRenderHomeCard&&S.me.role==="client"&&window.ghRenderHomeCard($("#ghHome"),p,()=>viewHome(el));
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
    <div style="flex:1">${macroRow("بروتين",tot.P,t.P,"جم")}${macroRow("كارب",tot.C,t.C,"جم","navy")}${macroRow("دهون",tot.F,t.F,"جم","navy")}</div></div>`;
  $("#goFood").onclick=()=>{ S.tab="food"; S.date=today(); render(); };
  if(S.dietPending){ const hn=$("#hN"); hn.className="card plan-wait"; hn.innerHTML=planningInner("food"); }
  $("#hF").innerHTML=`<div class="card-h"><div class="ic acc">🔥</div><h2>الفشل العضلي<small>الأسبوع ${wk}</small></h2></div>`+failureSummary((sets.data||[]).filter(s=>s.week===wk));
  const H=hab.data||[];
  $("#hCardio").innerHTML=cardioCardHTML(p,H,wk); wireCardioCard();
  loadCardHTML(p).then(h=>{ const x=$("#hLoad"); if(x) x.innerHTML=h; });
  if(typeof flameHeroHTML==="function") flameHeroHTML(p).then(h=>{ const x=$("#hFlame"); if(x){ x.innerHTML=h; if(window.flameAfter) flameAfter(x,p); } }).catch(()=>{});
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
      ${blockNavHTML(S.week,p)}<div class="scroller" id="wkChips">${blockWeeks(S.week).map(w=>`<button class="chip ${S.week===w?"on":""} ${wkNow===w?"cur":""}" data-w="${w}">${w}${isDeload(p,w)?" 🔄":""}</button>`).join("")}</div></div>
    <div class="card tools hidden" id="tTools"></div><div id="tPrep"></div><div id="exList"></div><div class="card" id="failCard"></div>`;
  { const dc=$("#dayCards"), wc=$("#wkChips"), sel=dc&&dc.querySelector(".daycard.on");
    [dc,wc].forEach(r=>{ if(!r) return; let x0=0; r.addEventListener("pointerdown",e=>{x0=e.clientX;r._drag=false;},{passive:true}); r.addEventListener("pointermove",e=>{ if(Math.abs(e.clientX-x0)>8) r._drag=true; },{passive:true}); const end=()=>setTimeout(()=>{r._drag=false;},140); r.addEventListener("pointerup",end,{passive:true}); r.addEventListener("pointercancel",()=>{r._drag=true;end();},{passive:true}); r.addEventListener("click",e=>{ if(r._drag){ e.stopPropagation(); e.preventDefault(); } },true); });
    if(dc){ if(window._dcX!=null) dc.scrollLeft=window._dcX; else if(sel){ const dr=dc.getBoundingClientRect(), sr=sel.getBoundingClientRect(), t=dc.scrollLeft+(sr.left-dr.left)-(dc.clientWidth-sr.width)/2; if(sr.left<dr.left||sr.right>dr.right) dc.scrollLeft=t; } }
    if(wc){ if(window._wcX!=null) wc.scrollLeft=window._wcX; }
    window._dcX=null; window._wcX=null; }
  el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ window._dcX=$("#dayCards")?.scrollLeft; S.day=+b.dataset.d; viewTrain(el);});
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{ window._wcX=$("#wkChips")?.scrollLeft; S.week=+b.dataset.w; viewTrain(el);});
  const allEx=S.program.filter(e=>e.day_no===S.day), exs=trainMode()==="quick"?allEx.slice(0,4):allEx, list=$("#exList");
  const tt=$("#tTools"); if(allEx.length&&S.me.role!=="coach"&&S.week===wkNow){ tt.classList.remove("hidden"); tt.innerHTML=trainToolsHTML();
    tt.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{ setTrainMode(trainMode()===b.dataset.mode?"":b.dataset.mode); viewTrain(el); });
    $("#rdyBtn").onclick=()=>openReadiness(()=>viewTrain(el)); }
  if(!exs.length){ list.innerHTML=`<div class="card">${emptyBox("😴","يوم راحة واستشفاء","الراحة جزء من التطور – سجّل نومك ومياهك وخطواتك النهارده.",{label:"✅ سجّل عاداتك",go:"habits"})}</div>`; $("#failCard").remove(); return; }
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
        <div class="ex-tags"><span class="pill glass">🎯 ${nSets}×${esc(ex.target_reps||"—")}</span>${deload?`<span class="pill glass">RIR 3-4</span>`:ex.target_rir?`<span class="pill glass">RIR ${esc(modeRir(ex.target_rir))}</span>`:""}<button class="pill glass" data-alt style="border:0;cursor:pointer">⇄ بديل</button><button class="pill glass" data-hist style="border:0;cursor:pointer">📈 السجل</button><button class="pill glass" data-pain style="border:0;cursor:pointer" title="حاسس بألم؟">🤕</button>${ex.rest_sec?`<span class="pill glass">⏱ ${restS}ث</span>`:""}${ex.tempo?`<span class="pill glass">🕒 ${esc(ex.tempo)}</span>`:""}<span class="pill acc" data-best></span></div></div>
        ${vid?`<button class="play" data-vid title="شاهد الأداء الصحيح">${ICON.play}</button>`:""}</div>
      <div class="ex-b">${hint?`<div class="prog ${hint.kind}">${hint.text}</div>`:""}${ex.tempo?tempoBlocks(ex.tempo):""}${ex.notes?`<p class="hint" style="margin:0 0 8px">📝 ${esc(ex.notes)}</p>`:""}${deload?"":idx===firstC?warmupHTML(hint?.w||prevW(ex)):firstOfM[idx]?feederHTML(hint?.w||prevW(ex),mus):""}
        <div class="set-head"><span>#</span><span>العدات</span><span>الوزن كجم</span><span>RIR</span><span>فشل</span><span></span></div><div data-sets></div>
        <button class="btn sm restbtn" data-rest>⏱ ابدأ الراحة (${restS} ث)</button></div>`;
    box.querySelectorAll("[data-vid]").forEach(b=>b.onclick=()=>openVideo(alt?{...ex,name:alt,video_url:null}:ex));
    box.querySelector("[data-alt]").onclick=()=>openAlts(ex,()=>viewTrain(el));
    box.querySelector("[data-hist]").onclick=()=>openExHistory(ex);
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
function openFoodPicker(title, onPick, opts={}){
  const body=openSheet(`<div class="between"><b>${esc(title)}</b><button class="btn sm ghost" data-close>✕</button></div>
    <input id="fpQ" placeholder="🔍 اكتب اسم الصنف (حرفين على الأقل)…" style="margin-top:10px" autocomplete="off"><div id="fpRes" style="margin-top:8px"></div>`);
  body.querySelector("[data-close]").onclick=closeSheet;
  const q=$("#fpQ"), res=$("#fpRes"); let timer; setTimeout(()=>q.focus(),100);
  q.oninput=()=>{ clearTimeout(timer); timer=setTimeout(async()=>{
    const term=q.value.trim(); if(term.length<2){ res.innerHTML=""; return; }
    const { data:f } = await sb.rpc("search_foods",{q:term});
    res.innerHTML=(f||[]).length?f.map(x=>{ const u=unitInfo(x); return `<div class="food-r" data-id="${x.id}"><div class="fi">${u.cnt?"🍞":"⚖"}</div><div class="nm">${esc(x.name)}<small>${u.base}: <b>${fmt(u.per.kcal)} kcal</b> · ب ${fmt(u.per.P,1)} · ك ${fmt(u.per.C,1)} · د ${fmt(u.per.F,1)}</small></div><span class="pill">${esc(x.unit)}</span></div>`; }).join("")
      :emptyBox("🔎","مفيش نتائج","اكتب اسم الصنف بشكل تاني"+(S.me.role==="coach"?"، أو ضيفه من تبويب الأطعمة":"")+".","","es-sm");
    res.querySelectorAll("[data-id]").forEach(d=>d.onclick=()=>pickQty(f.find(x=>x.id==d.dataset.id)));
  },250); };
  if(opts.match) body.querySelector("#fpQ").insertAdjacentHTML("beforebegin",`<div class="prog reps" style="margin-top:8px">⇄ تبديل ${esc(opts.match.food_name)} (${fmt(opts.match.kcal)} kcal) – الكمية هتتحسب تلقائياً بنفس السعرات</div>`);
  function pickQty(food){
    const u=unitInfo(food);
    body.innerHTML=`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
      <b style="font-size:1.05rem">${esc(food.name)}</b>
      <div class="unitbox"><span class="u">${u.base}</span> <span style="color:#CBD5E1;font-size:.8rem">${u.cnt?"القيم لكل "+esc(food.unit)+" واحد":"القيم لكل 100 "+esc(food.unit)}</span>
        <div class="g4"><div><b class="num">${fmt(u.per.kcal)}</b><small>سعرات</small></div><div><b class="num">${fmt(u.per.P,1)}</b><small>بروتين</small></div><div><b class="num">${fmt(u.per.C,1)}</b><small>كارب</small></div><div><b class="num">${fmt(u.per.F,1)}</b><small>دهون</small></div></div></div>
      <label class="f">${u.qtyLabel}</label>
      <div class="stepper"><button data-s="-1">−</button><input id="fpQty" inputmode="decimal" value="${u.def}"><button data-s="1">+</button></div>
      <div class="scroller" style="margin-top:8px">${u.quick.map(v=>`<button class="chip" data-q="${v}">${v} ${esc(food.unit)}</button>`).join("")}</div>
      <div class="card" style="background:var(--acc-soft);box-shadow:none;margin:10px 0" id="fpPrev"></div>
      <button class="btn primary block" id="fpAdd">إضافة</button>`;
    const qi=$("#fpQty"), step=u.cnt?1:10;
    if(opts.match&&food.kcal>0) qi.value=roundQty(opts.match.kcal/(food.kcal/100),food.unit);
    const prev=()=>{ const qv=num(qi.value)||0, c=foodCalc(food, qv); $("#fpPrev").innerHTML=`<div class="between"><b>${fmt(qv,1)} ${esc(food.unit)}</b><b style="color:var(--acc)" class="num">${fmt(c.kcal)} kcal</b></div><div class="muted">بروتين ${fmt(c.protein,1)} · كارب ${fmt(c.carbs,1)} · دهون ${fmt(c.fat,1)} جم</div>${mineralLine(food,qv)}`; };
    qi.oninput=prev; prev();
    body.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ qi.value=Math.max(0,(num(qi.value)||0)+(+b.dataset.s)*step); prev(); });
    body.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ qi.value=b.dataset.q; prev(); });
    body.querySelector("[data-close]").onclick=closeSheet;
    body.querySelector("[data-back]").onclick=()=>openFoodPicker(title,onPick);
    if(opts.match){ const m=opts.match; const cmp=()=>{ const c=foodCalc(food,num(qi.value)||0); $("#fpPrev").insertAdjacentHTML("beforeend",`<div class="muted" style="margin-top:4px">مقارنة بالأصلي: ب ${c.protein-m.protein>=0?"+":""}${fmt(c.protein-m.protein,1)} · ك ${c.carbs-m.carbs>=0?"+":""}${fmt(c.carbs-m.carbs,1)} · د ${c.fat-m.fat>=0?"+":""}${fmt(c.fat-m.fat,1)} جم</div>`); }; const op=qi.oninput; qi.oninput=()=>{op();cmp();}; cmp(); }
    $("#fpAdd").textContent=opts.match?"تبديل":"إضافة";
    $("#fpAdd").onclick=async()=>{ const qv=num(qi.value); if(!qv||qv<=0) return toast("اكتب الكمية"); await onPick(food,qv); closeSheet(); };
  }
}
function qtyText(i){ return `${fmt(i.qty,COUNT_UNITS(i.unit)?2:0)} ${esc(i.unit||"جم")}`; }

async function viewFood(el){ if(S.dietPending){ el.innerHTML=planningCard("food"); return; } return renderMeals(el,{mode:"day"}); }
async function renderMeals(el,{mode}){
  const p=S.client, t=targets(p), meals=Math.max(1,Math.min(+p.meals_per_day||3,8)), planMode=mode==="plan";
  el.innerHTML=(planMode?"":`<div class="card"><div class="between"><button class="btn sm" id="dPrev">→</button><div style="text-align:center"><b>${niceDate(S.date)}</b><div class="muted num">${S.date}</div></div><button class="btn sm" id="dNext">←</button></div>
      <label class="datejump"><input type="date" id="fDate" value="${S.date}" aria-label="اختار اليوم"><span class="datejump-txt">📅 ${new Date(S.date+"T00:00:00").toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span></label></div>`)+`<div class="card dark" id="fTot"></div><div id="meals"></div>`;
  if(!planMode){
    $("#fDate").onchange=e=>{S.date=e.target.value; renderMeals(el,{mode});};
    $("#dPrev").onclick=()=>{S.date=addDays(S.date,-1); renderMeals(el,{mode});};
    $("#dNext").onclick=()=>{S.date=addDays(S.date,1); renderMeals(el,{mode});};
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
      <div style="flex:1;color:#fff">${macroRow("بروتين",tot.P,t.P,"جم")}${macroRow("كارب",tot.C,t.C,"جم")}${macroRow("دهون",tot.F,t.F,"جم")}</div></div>${planMode?mineralTotHTML(plan):mineralTotHTML(items,"اللي اتاكل النهارده")}`; };
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
        ${!planMode&&extras.length?`<div class="sub">🍽 أكلت كمان</div>`+extras.map(i=>`<div class="item"><div class="nm">${esc(i.food_name)}<small>${qtyText(i)} · ب ${fmt(i.protein,1)} · ك ${fmt(i.carbs,1)} · د ${fmt(i.fat,1)}</small></div><span class="kc num">${fmt(i.kcal)}</span><button class="x" data-ldel="${i.id}">✕</button></div>`).join(""):""}
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
      box.querySelectorAll("[data-ldel]").forEach(b=>b.onclick=async()=>{ const { error } = await sb.from("meal_items").delete().eq("id",b.dataset.ldel); if(error) return toast(error.message); items.splice(items.findIndex(i=>i.id===b.dataset.ldel),1); draw(); drawTot(); });
      box.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=async()=>{ const { error } = await sb.from("diet_plan_items").delete().eq("id",b.dataset.pdel); if(error) return toast(error.message); plan.splice(plan.findIndex(i=>i.id===b.dataset.pdel),1); draw(); drawTot(); });
      box.querySelector("[data-ladd]")&&(box.querySelector("[data-ladd]").onclick=()=>openFoodPicker("سجّل في "+mealName(p,m), async(food,qty)=>{
        const { data:ins, error } = await sb.from("meal_items").insert({client_id:p.id,log_date:S.date,meal_no:m,food_id:food.id,food_name:food.name,unit:food.unit,qty,...foodCalc(food,qty),...mineralCalc(food,qty)}).select().single();
        if(error) return toast(error.message); items.push(ins); draw(); drawTot(); toast("✓ اتسجل"); }));
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
async function viewHabits(el){
  const p=S.client;
  const { data:all } = await sb.from("habits").select("*").eq("client_id",p.id).order("log_date");
  const H=all||[], cur=H.find(h=>h.log_date===S.date)||{}, rec={...cur}, w=weekOfDate(p,S.date);
  const scoreRow=(k,l)=>`<div style="margin-bottom:12px"><div class="muted" style="font-weight:700;margin-bottom:6px">${l}</div><div class="scorerow" data-score="${k}">${SCORE.map(([v,e,t])=>`<button class="chip ${cur[k]!==null&&cur[k]!==undefined&&+cur[k]===v?"on":""}" data-v="${v}">${e} ${t}</button>`).join("")}</div></div>`;
  el.innerHTML=`<div class="card"><div class="between"><button class="btn sm" id="dPrev">→</button><div style="text-align:center"><b>${niceDate(S.date)}</b><div class="muted">${w?"الأسبوع "+w:""}</div></div><button class="btn sm" id="dNext">←</button></div></div>
    <div class="card"><div class="card-h"><div class="ic acc">⭐</div><h2>يومك<small>اختار درجة التزامك</small></h2><div id="dayScore">${ring(dayScore(cur)||0,1,{size:56,stroke:6,label:pct(dayScore(cur))})}</div></div>
      <style>.scorerow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}.scorerow .chip{padding:6px 2px;font-size:.74rem;min-height:40px;text-align:center;white-space:nowrap}</style>${scoreRow("diet","🥗 الدايت")}${scoreRow("training","💪 التمرين")}${scoreRow("cardio","🏃 الكارديو")}${scoreRow("sleep_quality","😴 جودة النوم")}
      <div class="grid2"><label class="f">🤯 التوتر<select data-k="stress"><option value=""></option>${STRESS.map(s=>`<option ${cur.stress===s?"selected":""}>${s}</option>`).join("")}</select></label>
       <label class="f">💤 ساعات النوم<input inputmode="decimal" data-k="sleep_hours" value="${esc(cur.sleep_hours??"")}"></label>
       <label class="f">💧 المياه (لتر)<input inputmode="decimal" data-k="water_l" value="${esc(cur.water_l??"")}"></label>
       <label class="f">👣 الخطوات${p.steps_goal?` <small>(الهدف ${fmt(p.steps_goal)})</small>`:""}<input inputmode="numeric" data-k="steps" value="${esc(cur.steps??"")}"></label>
       <label class="f">🏃 دقايق الكارديو${p.cardio_plan?.minutes?` <small>(المطلوب ${fmt(p.cardio_plan.minutes)})</small>`:""}<input inputmode="numeric" data-k="cardio_min" value="${esc(cur.cardio_min??"")}"></label>
</div>
      <div id="ghSlot"></div>
      <label class="f">ملاحظات<textarea rows="2" data-k="notes">${esc(cur.notes??"")}</textarea></label>
      <button class="btn primary block" id="hSave">حفظ اليوم</button></div>
    <div id="cycSlot"></div>
    <div class="card"><div class="card-h"><div class="ic">🗓</div><h2>خريطة الالتزام<small>كل مربع = يوم</small></h2></div>${heatmap(p,H)}</div>
    <div class="card" id="hWeeks"></div>`;
  $("#dPrev").onclick=()=>{S.date=addDays(S.date,-1); viewHabits(el);};
  $("#dNext").onclick=()=>{S.date=addDays(S.date,1); viewHabits(el);};
  window.ghRenderStepsSlot&&window.ghRenderStepsSlot($("#ghSlot"),p,()=>viewHabits(el));
  cycleCard($("#cycSlot"),p,()=>viewHabits(el));
  el.querySelectorAll("[data-score]").forEach(g=>g.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    g.querySelectorAll("button").forEach(x=>x.classList.remove("on")); b.classList.add("on"); rec[g.dataset.score]=+b.dataset.v;
    $("#dayScore").innerHTML=ring(dayScore(rec)||0,1,{size:56,stroke:6,label:pct(dayScore(rec))}); }));
  $("#hSave").onclick=async()=>{
    const v=k=>el.querySelector(`[data-k="${k}"]`);
    const out={client_id:p.id,log_date:S.date,diet:rec.diet??null,training:rec.training??null,cardio:rec.cardio??null,sleep_quality:rec.sleep_quality??null,
      stress:v("stress").value||null,sleep_hours:num(v("sleep_hours").value),water_l:num(v("water_l").value),steps:num(v("steps").value),cardio_min:num(v("cardio_min").value),notes:v("notes").value.trim()||null,updated_at:new Date().toISOString()};
    const { error, queued } = await dbWrite({op:"upsert",table:"habits",row:out,onConflict:"client_id,log_date"}); if(error) return toast(error.message); toast(queued?"📴 اتحفظ على الموبايل":"✓ اتحفظ"); if(!queued) viewHabits(el);
  };
  const wk=currentWeek(p), by={}; H.forEach(h=>{ const x=weekOfDate(p,h.log_date); if(x) (by[x]=by[x]||[]).push(h); });
  $("#hWeeks").innerHTML=`<div class="card-h"><div class="ic">📊</div><h2>المتوسط الأسبوعي</h2></div><div class="scrollx"><table><tr><th>أسبوع</th><th>دايت</th><th>تمرين</th><th>كارديو</th><th>نوم</th><th>ساعات</th><th>خطوات</th><th>أيام</th></tr>
    ${blockWeeks(wk).filter(w=>w<=Math.max(wk,BLOCK)).map(w=>{ const a=by[w]||[], c=w===wk?"cur":""; return `<tr><td class="${c}"><b>${w}</b></td><td class="${c}">${pct(avg(a.map(h=>h.diet)))}</td><td class="${c}">${pct(avg(a.map(h=>h.training)))}</td><td class="${c}">${pct(avg(a.map(h=>h.cardio)))}</td><td class="${c}">${pct(avg(a.map(h=>h.sleep_quality)))}</td><td class="${c} num">${fmt(avg(a.map(h=>h.sleep_hours)),1)}</td><td class="${c} num">${fmt(avg(a.map(h=>h.steps)))}</td><td class="${c}">${a.length||""}</td></tr>`; }).join("")}</table></div>`;
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
      ${blockNavHTML(sel||1,p)}<div class="scroller">${[0,...blockWeeks(sel||wk||1)].map(i=>`<button class="chip ${sel===i?"on":""} ${wk===i&&i?"cur":""}" data-w="${i}">${i?"أسبوع "+i:"البداية"}${B.find(b=>b.week===i&&b.weight)?" ✓":""}</button>`).join("")}</div>
      <div class="grid2" style="margin-top:12px"><label class="f">📅 التاريخ<input type="date" data-k="log_date" value="${esc(cur.log_date??today())}"></label>
      ${F.map(([k,l,u])=>{ const d=sel&&start[k]&&cur[k]?cur[k]-start[k]:null; return `<label class="f">${l} (${u})<input inputmode="decimal" data-k="${k}" value="${esc(cur[k]??"")}">${d!==null?`<span class="pill ${d<0?"acc-soft":""}" style="margin-top:4px">${d>0?"▲":"▼"} ${fmt(Math.abs(d),1)} منذ البداية</span>`:""}</label>`; }).join("")}</div>
      <label class="f">ملاحظات<textarea rows="2" data-k="notes">${esc(cur.notes??"")}</textarea></label>
      <button class="btn primary block" id="bSave">حفظ ${sel?"الأسبوع "+sel:"قياسات البداية"}</button></div>
    ${weightTrendCard(B,p)}
    <div class="card"><div class="card-h"><div class="ic acc">⚖</div><h2>منحنى الوزن</h2></div>${lineChart(B.filter(b=>b.weight).map(b=>({x:b.week,y:+b.weight})),"كجم")}</div>
    <div class="card"><div class="card-h"><div class="ic">📐</div><h2>منحنى الوسط</h2></div>${lineChart(B.filter(b=>b.waist).map(b=>({x:b.week,y:+b.waist})),"سم")}</div>`;
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{S.bodyWeek=+b.dataset.w; viewMeasures(el);});
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
