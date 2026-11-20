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

async function boot(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ $("#loginView").classList.remove("hidden"); $("#appView").classList.add("hidden"); return; }
  const { data:me } = await sb.from("profiles").select("*").eq("id",session.user.id).single();
  if(!me){ toast("تعذر تحميل الحساب"); return; }
  if(!me.active){ await sb.auth.signOut(); $("#loginView").classList.remove("hidden"); $("#loginErr").textContent="الحساب غير مفعّل – تواصل مع الكوتش"; return; }
  S.me=me; $("#loginView").classList.add("hidden"); $("#appView").classList.remove("hidden");
  await loadVideos();
  if(me.role==="coach"){ S.tab="clients"; await Promise.all([loadClients(),loadCoachTemplates()]); }
  else await openClient(me);
  render();
}
async function openClient(p){
  S.client=p; S.week=currentWeek(p); S.date=today(); S.bodyWeek=null;
  const { data } = await sb.from("program_exercises").select("*").eq("client_id",p.id).order("day_no").order("position");
  S.program=data||[];
  const days=[...new Set(S.program.map(e=>e.day_no))];
  S.day = todayDayNo() || days[0] || 1;
}
async function refreshClient(){ const { data } = await sb.from("profiles").select("*").eq("id",S.client.id).single(); const tab=S.tab, day=S.day, wk=S.week; await openClient(data); S.tab=tab; S.day=day; S.week=wk; }
function tabs(){
  if(S.me.role==="coach" && !S.client) return [["clients","العملاء"],["videos","التمارين"],["foods","الأطعمة"]];
  const t=[["home","الرئيسية"],["train","التمرين"],["food","التغذية"],["habits","العادات"],["body","القياسات"]];
  if(S.me.role==="coach") t.push(["setup","التحكم"]);
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
  $("#top").innerHTML=`<div class="top-row"><div class="logo">MO<b>FIT</b></div><div class="sp"></div>${S.me.role==="coach"?"":`<button class="ibtn" onclick="logout()">خروج</button>`}</div>
    <div class="hello"><div class="av">${initials(c)}</div><div><h1>${S.me.role==="coach"?esc(c.full_name||c.email):"أهلاً، "+esc((c.full_name||"").split(" ")[0])+" 👋"}</h1>
      <p>${esc(c.goal||"")}${c.level?" · "+LEVELS[c.level]?.icon+" "+esc(c.level):""}${t.kcal?" · "+fmt(t.kcal)+" kcal":""}</p></div>
      <div class="ringwrap">${ring(wk,12,{size:64,stroke:7,color:"#F97316",track:"rgba(255,255,255,.15)",label:wk,sub:"من 12",textColor:"#fff"})}</div></div>`;
}
function render(){
  renderTop();
  $("#nav").innerHTML=tabs().map(([k,l])=>`<button data-tab="${k}" class="${S.tab===k?"on":""}">${ICON[k]}<span>${l}</span></button>`).join("");
  $("#nav").querySelectorAll("button").forEach(b=>b.onclick=()=>{ S.tab=b.dataset.tab; render(); window.scrollTo(0,0); });
  const m=$("#main"); m.innerHTML="";
  if(S.me.role==="coach" && S.client){
    const bar=document.createElement("div"); bar.className="coachbar";
    bar.innerHTML=`<div class="av">${initials(S.client)}</div><b>وضع الكوتش<small>أي تعديل هنا بيتحفظ في بيانات ${esc(S.client.full_name||"العميل")}</small></b><button class="btn sm navy">← العملاء</button>`;
    bar.querySelector("button").onclick=async()=>{ S.client=null; S.tab="clients"; stopRest(); await loadClients(); render(); };
    m.appendChild(bar);
  }
  const host=document.createElement("div"); m.appendChild(host);
  ({home:viewHome,train:viewTrain,food:viewFood,habits:viewHabits,body:viewBody,setup:viewSetup,clients:viewClients,videos:viewVideos,foods:viewFoods}[S.tab]||viewHome)(host);
}

/* ======================================================================
   HOME
   ====================================================================== */
async function viewHome(el){
  const p=S.client, t=targets(p), wk=currentWeek(p), dn=todayDayNo();
  const todayEx=S.program.filter(e=>e.day_no===dn);
  el.innerHTML=`
    <div class="card dark"><div class="card-h"><div class="ic">💪</div><h2>تمرين النهارده<small>${dn?"يوم "+dn+(dayLabel(dn)?" · "+esc(dayLabel(dn)):""):"يوم راحة واستشفاء"}</small></h2>${dn?`<span class="pill acc">${todayEx.length} تمارين</span>`:""}</div>
      ${dn?`<div class="scroller">${todayEx.map(e=>`<span class="pill glass">${esc(e.name)}</span>`).join("")}</div><button class="btn primary block" style="margin-top:10px" id="goTrain">ابدأ التمرين ←</button>`
          :`<p class="hint">😴 الراحة جزء من التطور. سجّل نومك ومياهك وخطواتك في العادات.</p>`}</div>
    <div class="card" id="hN"><div class="card-h"><div class="ic acc">🍽</div><h2>تغذية النهارده<small>${niceDate(today())}</small></h2></div><p class="muted">جارٍ التحميل…</p></div>
    <div class="card" id="hF"></div>
    <div class="card" id="hH"></div>
    <div class="card" id="hB"></div>`;
  $("#goTrain")&&($("#goTrain").onclick=()=>{ S.tab="train"; S.day=dn; S.week=wk; render(); });
  const id=p.id;
  const [meals,hab,body,sets]=await Promise.all([
    sb.from("meal_items").select("kcal,protein,carbs,fat").eq("client_id",id).eq("log_date",today()),
    sb.from("habits").select("*").eq("client_id",id).order("log_date"),
    sb.from("body_logs").select("*").eq("client_id",id).order("week"),
    sb.from("set_logs").select("exercise_id,week,set_no,reps,weight,rir,failure").eq("client_id",id),
  ]);
  const tot=sumMacros(meals.data||[]);
  $("#hN").innerHTML=`<div class="card-h"><div class="ic acc">🍽</div><h2>تغذية النهارده<small>${niceDate(today())}</small></h2><button class="btn sm" id="goFood">سجّل أكلك</button></div>
    <div style="display:flex;gap:16px;align-items:center">${ring(tot.kcal,t.kcal||1,{size:118,label:fmt(tot.kcal),sub:"من "+fmt(t.kcal)+" kcal"})}
    <div style="flex:1">${macroRow("بروتين",tot.P,t.P,"جم")}${macroRow("كارب",tot.C,t.C,"جم","navy")}${macroRow("دهون",tot.F,t.F,"جم","navy")}</div></div>`;
  $("#goFood").onclick=()=>{ S.tab="food"; S.date=today(); render(); };
  $("#hF").innerHTML=`<div class="card-h"><div class="ic acc">🔥</div><h2>الفشل العضلي<small>الأسبوع ${wk}</small></h2></div>`+failureSummary((sets.data||[]).filter(s=>s.week===wk));
  const H=hab.data||[];
  $("#hH").innerHTML=`<div class="card-h"><div class="ic">✅</div><h2>الالتزام<small>${H.length} يوم مسجّل</small></h2></div>
    <div class="grid4"><div class="stat"><div class="l">🥗 الدايت</div><div class="v">${pct(avg(H.map(h=>h.diet)))}</div></div>
    <div class="stat"><div class="l">💪 التمرين</div><div class="v">${pct(avg(H.map(h=>h.training)))}</div></div>
    <div class="stat"><div class="l">🏃 الكارديو</div><div class="v">${pct(avg(H.map(h=>h.cardio)))}</div></div>
    <div class="stat"><div class="l">💤 النوم</div><div class="v num">${fmt(avg(H.map(h=>h.sleep_hours)),1)}</div><div class="s">ساعة</div></div></div>
    <div style="margin-top:12px">${heatmap(p,H)}</div>`;
  const B=(body.data||[]).filter(b=>b.weight), startW=(body.data||[]).find(b=>b.week===0)?.weight ?? p.start_weight, cur=B.length?+B[B.length-1].weight:null;
  const bmi=cur&&p.height_cm?cur/((p.height_cm/100)**2):null, ch=cur&&startW?cur-startW:null;
  $("#hB").innerHTML=`<div class="card-h"><div class="ic">⚖</div><h2>الجسم<small>الوزن والقياسات</small></h2></div>
    <div class="grid3"><div class="stat dark"><div class="l">الوزن الحالي</div><div class="v num">${fmt(cur,1)}</div><div class="s">كجم</div></div>
    <div class="stat ${ch!==null&&ch<0?"acc":""}"><div class="l">التغيّر</div><div class="v num">${ch===null?"—":(ch>0?"+":"")+fmt(ch,1)}</div><div class="s">كجم منذ البداية</div></div>
    <div class="stat"><div class="l">BMI</div><div class="v num">${fmt(bmi,1)}</div></div></div>${lineChart(B.map(b=>({x:b.week,y:+b.weight})),"الوزن (كجم)")}`;
}
function heatmap(p,H){
  const by=Object.fromEntries(H.map(h=>[h.log_date,dayScore(h)]));
  const start=p.start_date||today(), wk=currentWeek(p);
  let html=`<div class="heat"><span></span>${["1","2","3","4","5","6","7"].map(d=>`<span style="text-align:center">${d}</span>`).join("")}`;
  for(let w=1;w<=Math.max(wk,4)&&w<=12;w++){
    html+=`<span>أ${w}</span>`;
    for(let d=0;d<7;d++){ const iso=addDays(start,(w-1)*7+d), s=by[iso]; const lv=s===undefined||s===null?"":s>=.9?"l4":s>=.7?"l3":s>=.45?"l2":"l1"; html+=`<i class="${lv} ${iso===today()?"today":""}" title="${iso}"></i>`; }
  }
  return html+`</div><div class="legend"><span><i style="background:#FED7AA"></i>ضعيف</span><span><i style="background:#FB923C"></i>كويس</span><span><i style="background:#F97316"></i>ممتاز</span></div>`;
}
function failureSummary(sets){
  const done=sets.filter(logged);
  if(!done.length) return emptyBox("🏋️","لسه مفيش مجموعات مسجلة الأسبوع ده");
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
  const p=S.client, wkNow=currentWeek(p), tdn=todayDayNo();
  const days=[...new Set(S.program.map(e=>e.day_no))].sort((a,b)=>a-b);
  if(!days.length){ el.innerHTML=`<div class="card">${emptyBox("📋","الكوتش لسه ما حطش برنامج التمرين."+(S.me.role==="coach"?"<br>حطه من تبويب ⚙️ التحكم.":""))}</div>`; return; }
  const maxD=Math.max(...days);
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic dark">📅</div><h2>${esc(p.split_name||"برنامج التمرين")}<small>${p.level?LEVELS[p.level]?.icon+" "+esc(p.level)+" · ":""}${days.length} أيام في الأسبوع</small></h2></div>
      <div class="scroller" id="dayCards">${[...Array(7)].map((_,i)=>{ const d=i+1, has=days.includes(d); return `<button class="daycard ${S.day===d?"on":""} ${has?"":"rest"}" data-d="${d}">${d===tdn?'<span class="dot"></span>':""}<b>${has?"يوم "+d:"راحة"}</b><small>${has?esc(dayLabel(d)||S.program.filter(e=>e.day_no===d).length+" تمارين"):"😴 استشفاء"}</small></button>`; }).join("")}</div>
      <div class="muted" style="margin:8px 0 6px;font-weight:700">الأسبوع</div>
      <div class="scroller" id="wkChips">${[...Array(12)].map((_,i)=>`<button class="chip ${S.week===i+1?"on":""} ${wkNow===i+1?"cur":""}" data-w="${i+1}">${i+1}</button>`).join("")}</div></div>
    <div id="exList"></div><div class="card" id="failCard"></div>`;
  el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{S.day=+b.dataset.d; viewTrain(el);});
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{S.week=+b.dataset.w; viewTrain(el);});
  const exs=S.program.filter(e=>e.day_no===S.day), list=$("#exList");
  if(!exs.length){ list.innerHTML=`<div class="card">${emptyBox("😴","يوم راحة واستشفاء<br>سجّل نومك ومياهك وخطواتك في العادات.")}</div>`; $("#failCard").remove(); return; }
  const ids=exs.map(e=>e.id);
  const { data } = await sb.from("set_logs").select("*").in("exercise_id",ids).in("week",[S.week,S.week-1].filter(w=>w>=1));
  const logs=data||[];
  const get=(ex,w,n)=>logs.find(l=>l.exercise_id===ex&&l.week===w&&l.set_no===n);
  exs.forEach((ex,idx)=>{
    const box=document.createElement("div"); box.className="ex"; const vid=videoFor(ex);
    box.innerHTML=`<div class="ex-h"><div class="ex-n">${idx+1}</div><div class="ex-t"><b data-vid>${esc(ex.name)}</b>
        <div class="ex-tags"><span class="pill glass">🎯 ${ex.sets}×${esc(ex.target_reps||"—")}</span>${ex.target_rir?`<span class="pill glass">RIR ${esc(ex.target_rir)}</span>`:""}${ex.rest_sec?`<span class="pill glass">⏱ ${ex.rest_sec}ث</span>`:""}${ex.tempo?`<span class="pill glass">🕒 ${esc(ex.tempo)}</span>`:""}<span class="pill acc" data-best></span></div></div>
        ${vid?`<button class="play" data-vid title="شاهد الأداء الصحيح">${ICON.play}</button>`:""}</div>
      <div class="ex-b">${ex.tempo?tempoBlocks(ex.tempo):""}${ex.notes?`<p class="hint" style="margin:0 0 8px">📝 ${esc(ex.notes)}</p>`:""}
        <div class="set-head"><span>#</span><span>العدات</span><span>الوزن كجم</span><span>RIR</span><span>فشل</span><span></span></div><div data-sets></div>
        <button class="btn sm restbtn" data-rest>⏱ ابدأ الراحة (${ex.rest_sec||90} ث)</button></div>`;
    box.querySelectorAll("[data-vid]").forEach(b=>b.onclick=()=>openVideo(ex));
    box.querySelector("[data-rest]").onclick=()=>startRest(ex.rest_sec||90, ex.name);
    const setsEl=box.querySelector("[data-sets]");
    const updBest=()=>{ const best=Math.max(0,...[...Array(ex.sets)].map((_,i)=>e1rm(get(ex.id,S.week,i+1)||{})||0)); box.querySelector("[data-best]").textContent=best?"1RM≈"+fmt(best,1):""; };
    for(let n=1;n<=ex.sets;n++){
      const cur=get(ex.id,S.week,n)||{}, prev=get(ex.id,S.week-1,n);
      const row=document.createElement("div"); row.className="set"+(logged(cur)?" done":"");
      row.innerHTML=`<div class="no">${n}</div>
        <input inputmode="numeric" placeholder="${esc(ex.target_reps||"عدات")}" value="${esc(cur.reps??"")}" data-k="reps">
        <input inputmode="decimal" placeholder="${prev?.weight??"كجم"}" value="${esc(cur.weight??"")}" data-k="weight">
        <select data-k="rir"><option value="">—</option>${[0,1,2,3,4,5].map(v=>`<option value="${v}" ${cur.rir!==null&&cur.rir!==undefined&&+cur.rir===v?"selected":""}>${v}</option>`).join("")}</select>
        <button class="fail ${cur.failure?"on":""}" data-k="failure" title="وصلت للفشل">🔥</button>
        <button class="more" title="تمبو / راحة / ملاحظات">⋯</button>
        ${prev&&logged(prev)?`<div class="prev">الأسبوع اللي فات: <b class="num">${fmt(prev.reps)}×${fmt(prev.weight,1)}</b>${prev.rir!==null?" · RIR "+prev.rir:""}${isFailure(prev)?" · 🔥":""}</div>`:""}
        <div class="set-x hidden"><input placeholder="تمبو ${esc(ex.tempo||"")}" value="${esc(cur.tempo??"")}" data-k="tempo"><input inputmode="numeric" placeholder="راحة ث" value="${esc(cur.rest_sec??"")}" data-k="rest_sec"><input placeholder="ملاحظات" value="${esc(cur.notes??"")}" data-k="notes"></div>`;
      row.querySelector(".more").onclick=()=>row.querySelector(".set-x").classList.toggle("hidden");
      const save=async(startTimer)=>{
        const v=k=>row.querySelector(`[data-k="${k}"]`);
        const rec={ client_id:p.id, exercise_id:ex.id, week:S.week, set_no:n, reps:num(v("reps").value), weight:num(v("weight").value), rir:num(v("rir").value),
          failure:v("failure").classList.contains("on"), tempo:v("tempo").value.trim()||null, rest_sec:num(v("rest_sec").value), notes:v("notes").value.trim()||null };
        if(rec.rir===0){ rec.failure=true; v("failure").classList.add("on"); }
        const wasDone=row.classList.contains("done");
        const { data:saved, error } = await sb.from("set_logs").upsert(rec,{onConflict:"exercise_id,week,set_no"}).select().single();
        if(error){ toast("خطأ في الحفظ: "+error.message); return; }
        const i=logs.findIndex(l=>l.exercise_id===ex.id&&l.week===S.week&&l.set_no===n); if(i>=0) logs[i]=saved; else logs.push(saved);
        row.classList.toggle("done",logged(saved)); updBest(); renderFailCard();
        if(startTimer && !wasDone && rec.reps!==null && n<ex.sets) startRest(rec.rest_sec||ex.rest_sec||90, `${ex.name} · بعد مجموعة ${n}`);
      };
      row.querySelectorAll("input,select").forEach(i=>i.addEventListener("change",()=>save(i.dataset.k==="reps"||i.dataset.k==="weight")));
      row.querySelector(".fail").onclick=e=>{ e.currentTarget.classList.toggle("on"); save(false); };
      setsEl.appendChild(row);
    }
    updBest(); list.appendChild(box);
  });
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
function openFoodPicker(title, onPick){
  const body=openSheet(`<div class="between"><b>${esc(title)}</b><button class="btn sm ghost" data-close>✕</button></div>
    <input id="fpQ" placeholder="🔍 اكتب اسم الصنف (حرفين على الأقل)…" style="margin-top:10px" autocomplete="off"><div id="fpRes" style="margin-top:8px"></div>`);
  body.querySelector("[data-close]").onclick=closeSheet;
  const q=$("#fpQ"), res=$("#fpRes"); let timer; setTimeout(()=>q.focus(),100);
  q.oninput=()=>{ clearTimeout(timer); timer=setTimeout(async()=>{
    const term=q.value.trim(); if(term.length<2){ res.innerHTML=""; return; }
    const { data:f } = await sb.rpc("search_foods",{q:term});
    res.innerHTML=(f||[]).length?f.map(x=>{ const u=unitInfo(x); return `<div class="food-r" data-id="${x.id}"><div class="fi">${u.cnt?"🍞":"⚖"}</div><div class="nm">${esc(x.name)}<small>${u.base}: <b>${fmt(u.per.kcal)} kcal</b> · ب ${fmt(u.per.P,1)} · ك ${fmt(u.per.C,1)} · د ${fmt(u.per.F,1)}</small></div><span class="pill">${esc(x.unit)}</span></div>`; }).join("")
      :emptyBox("🔎","مفيش نتائج"+(S.me.role==="coach"?" – أضف الصنف من تبويب الأطعمة":""));
    res.querySelectorAll("[data-id]").forEach(d=>d.onclick=()=>pickQty(f.find(x=>x.id==d.dataset.id)));
  },250); };
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
    const prev=()=>{ const qv=num(qi.value)||0, c=foodCalc(food, qv); $("#fpPrev").innerHTML=`<div class="between"><b>${fmt(qv,1)} ${esc(food.unit)}</b><b style="color:var(--acc)" class="num">${fmt(c.kcal)} kcal</b></div><div class="muted">بروتين ${fmt(c.protein,1)} · كارب ${fmt(c.carbs,1)} · دهون ${fmt(c.fat,1)} جم</div>`; };
    qi.oninput=prev; prev();
    body.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ qi.value=Math.max(0,(num(qi.value)||0)+(+b.dataset.s)*step); prev(); });
    body.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ qi.value=b.dataset.q; prev(); });
    body.querySelector("[data-close]").onclick=closeSheet;
    body.querySelector("[data-back]").onclick=()=>openFoodPicker(title,onPick);
    $("#fpAdd").onclick=async()=>{ const qv=num(qi.value); if(!qv||qv<=0) return toast("اكتب الكمية"); await onPick(food,qv); closeSheet(); };
  }
}
function qtyText(i){ return `${fmt(i.qty,COUNT_UNITS(i.unit)?2:0)} ${i.unit||"جم"}`; }

async function viewFood(el){ return renderMeals(el,{mode:"day"}); }
async function renderMeals(el,{mode}){
  const p=S.client, t=targets(p), meals=Math.max(1,Math.min(+p.meals_per_day||3,8)), planMode=mode==="plan";
  el.innerHTML=(planMode?"":`<div class="card"><div class="between"><button class="btn sm" id="dPrev">→</button><div style="text-align:center"><b>${niceDate(S.date)}</b><div class="muted num">${S.date}</div></div><button class="btn sm" id="dNext">←</button></div>
      <input type="date" id="fDate" value="${S.date}" style="margin-top:8px"></div>`)+`<div class="card dark" id="fTot"></div><div id="meals"></div>`;
  if(!planMode){
    $("#fDate").onchange=e=>{S.date=e.target.value; renderMeals(el,{mode});};
    $("#dPrev").onclick=()=>{S.date=addDays(S.date,-1); renderMeals(el,{mode});};
    $("#dNext").onclick=()=>{S.date=addDays(S.date,1); renderMeals(el,{mode});};
  }
  const [pl,lg]=await Promise.all([
    sb.from("diet_plan_items").select("*").eq("client_id",p.id).order("meal_no").order("position"),
    planMode?{data:[]}:sb.from("meal_items").select("*").eq("client_id",p.id).eq("log_date",S.date).order("created_at")]);
  const plan=pl.data||[], items=lg.data||[];
  const drawTot=()=>{ const tot=sumMacros(planMode?plan:items);
    $("#fTot").innerHTML=`<div class="card-h"><div class="ic">${planMode?"📋":"🔥"}</div><h2>${planMode?"إجمالي الخطة":"ملخص اليوم"}<small>${planMode?"مقارنة بأهداف العميل":"المتبقي: "+(t.kcal?fmt(t.kcal-tot.kcal):"—")+" kcal"}</small></h2></div>
      <div style="display:flex;gap:16px;align-items:center">${ring(tot.kcal,t.kcal||1,{size:112,track:"rgba(255,255,255,.15)",label:fmt(tot.kcal),sub:"من "+fmt(t.kcal),textColor:"#fff"})}
      <div style="flex:1;color:#fff">${macroRow("بروتين",tot.P,t.P,"جم")}${macroRow("كارب",tot.C,t.C,"جم")}${macroRow("دهون",tot.F,t.F,"جم")}</div></div>`; };
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
          <div class="nm">${esc(pi.food_name)}<small>${qtyText(pi)}${pi.notes?" · "+esc(pi.notes):""}</small></div><span class="kc num">${fmt(pi.kcal)}</span>${edit?`<button class="x" data-pdel="${pi.id}">✕</button>`:""}</div>`).join("")}
        ${!planMode&&extras.length?`<div class="sub">🍽 أكلت كمان</div>`+extras.map(i=>`<div class="item"><div class="nm">${esc(i.food_name)}<small>${qtyText(i)} · ب ${fmt(i.protein,1)} · ك ${fmt(i.carbs,1)} · د ${fmt(i.fat,1)}</small></div><span class="kc num">${fmt(i.kcal)}</span><button class="x" data-ldel="${i.id}">✕</button></div>`).join(""):""}
        ${!mp.length&&!ml.length&&!edit?`<div class="item"><span class="muted">مفيش أصناف لسه</span></div>`:""}
        <div class="meal-f">${edit?`<button class="btn sm navy grow" data-padd>+ صنف للخطة</button>`:`${mp.length?`<button class="btn sm grow" data-all>✓ أكلت الوجبة كلها</button>`:""}<button class="btn sm primary grow" data-ladd>+ سجّل صنف</button>`}</div>`;
      box.querySelector("[data-edit]")&&(box.querySelector("[data-edit]").onclick=()=>{edit=!edit; draw();});
      const logOne=async pi=>{ const rec={client_id:p.id,log_date:S.date,meal_no:m,food_id:pi.food_id,food_name:pi.food_name,unit:pi.unit,qty:pi.qty,kcal:pi.kcal,protein:pi.protein,carbs:pi.carbs,fat:pi.fat};
        const { data:ins, error } = await sb.from("meal_items").insert(rec).select().single(); if(error){ toast(error.message); return; } items.push(ins); };
      box.querySelectorAll("[data-tick]").forEach(b=>b.onclick=async()=>{
        const pr=planRows.find(r=>r.pi.id===b.dataset.tick);
        if(pr.hit){ const { error } = await sb.from("meal_items").delete().eq("id",pr.hit.id); if(error) return toast(error.message); items.splice(items.findIndex(i=>i.id===pr.hit.id),1); }
        else await logOne(pr.pi);
        draw(); drawTot(); });
      box.querySelector("[data-all]")&&(box.querySelector("[data-all]").onclick=async()=>{ for(const r of planRows) if(!r.hit) await logOne(r.pi); draw(); drawTot(); toast("✓ اتسجلت الوجبة"); });
      box.querySelectorAll("[data-ldel]").forEach(b=>b.onclick=async()=>{ const { error } = await sb.from("meal_items").delete().eq("id",b.dataset.ldel); if(error) return toast(error.message); items.splice(items.findIndex(i=>i.id===b.dataset.ldel),1); draw(); drawTot(); });
      box.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=async()=>{ const { error } = await sb.from("diet_plan_items").delete().eq("id",b.dataset.pdel); if(error) return toast(error.message); plan.splice(plan.findIndex(i=>i.id===b.dataset.pdel),1); draw(); drawTot(); });
      box.querySelector("[data-ladd]")&&(box.querySelector("[data-ladd]").onclick=()=>openFoodPicker("سجّل في "+mealName(p,m), async(food,qty)=>{
        const { data:ins, error } = await sb.from("meal_items").insert({client_id:p.id,log_date:S.date,meal_no:m,food_id:food.id,food_name:food.name,unit:food.unit,qty,...foodCalc(food,qty)}).select().single();
        if(error) return toast(error.message); items.push(ins); draw(); drawTot(); toast("✓ اتسجل"); }));
      box.querySelector("[data-padd]")&&(box.querySelector("[data-padd]").onclick=()=>openFoodPicker("أضف لخطة "+mealName(p,m), async(food,qty)=>{
        const { data:ins, error } = await sb.from("diet_plan_items").insert({client_id:p.id,meal_no:m,position:mp.length,food_id:food.id,food_name:food.name,unit:food.unit,qty,...foodCalc(food,qty)}).select().single();
        if(error) return toast(error.message); plan.push(ins); draw(); drawTot(); toast("✓ اتضاف للخطة"); }));
    };
    draw(); wrap.appendChild(box);
  }
}

/* ======================================================================
   HABITS
   ====================================================================== */
function dayScore(h){ return avg([h.diet,h.training,h.cardio,h.sleep_quality].map(v=>v===undefined?null:v)); }
async function viewHabits(el){
  const p=S.client;
  const { data:all } = await sb.from("habits").select("*").eq("client_id",p.id).order("log_date");
  const H=all||[], cur=H.find(h=>h.log_date===S.date)||{}, rec={...cur}, w=weekOfDate(p,S.date);
  const scoreRow=(k,l)=>`<div style="margin-bottom:12px"><div class="muted" style="font-weight:700;margin-bottom:6px">${l}</div><div class="row" style="gap:6px" data-score="${k}">${SCORE.map(([v,e,t])=>`<button class="chip ${cur[k]!==null&&cur[k]!==undefined&&+cur[k]===v?"on":""}" data-v="${v}">${e} ${t}</button>`).join("")}</div></div>`;
  el.innerHTML=`<div class="card"><div class="between"><button class="btn sm" id="dPrev">→</button><div style="text-align:center"><b>${niceDate(S.date)}</b><div class="muted">${w?"الأسبوع "+w:""}</div></div><button class="btn sm" id="dNext">←</button></div></div>
    <div class="card"><div class="card-h"><div class="ic acc">⭐</div><h2>يومك<small>اختار درجة التزامك</small></h2><div id="dayScore">${ring(dayScore(cur)||0,1,{size:56,stroke:6,label:pct(dayScore(cur))})}</div></div>
      ${scoreRow("diet","🥗 الدايت")}${scoreRow("training","💪 التمرين")}${scoreRow("cardio","🏃 الكارديو")}${scoreRow("sleep_quality","😴 جودة النوم")}
      <div class="grid2"><label class="f">🤯 التوتر<select data-k="stress"><option value=""></option>${STRESS.map(s=>`<option ${cur.stress===s?"selected":""}>${s}</option>`).join("")}</select></label>
       <label class="f">💤 ساعات النوم<input inputmode="decimal" data-k="sleep_hours" value="${esc(cur.sleep_hours??"")}"></label>
       <label class="f">💧 المياه (لتر)<input inputmode="decimal" data-k="water_l" value="${esc(cur.water_l??"")}"></label>
       <label class="f">👣 الخطوات<input inputmode="numeric" data-k="steps" value="${esc(cur.steps??"")}"></label>
       ${p.sex==="أنثى"?`<label class="f">الدورة الشهرية<select data-k="cycle"><option value=""></option>${CYCLE.map(s=>`<option ${cur.cycle===s?"selected":""}>${s}</option>`).join("")}</select></label>`:""}</div>
      <label class="f">ملاحظات<textarea rows="2" data-k="notes">${esc(cur.notes??"")}</textarea></label>
      <button class="btn primary block" id="hSave">حفظ اليوم</button></div>
    <div class="card"><div class="card-h"><div class="ic">🗓</div><h2>خريطة الالتزام<small>كل مربع = يوم</small></h2></div>${heatmap(p,H)}</div>
    <div class="card" id="hWeeks"></div>`;
  $("#dPrev").onclick=()=>{S.date=addDays(S.date,-1); viewHabits(el);};
  $("#dNext").onclick=()=>{S.date=addDays(S.date,1); viewHabits(el);};
  el.querySelectorAll("[data-score]").forEach(g=>g.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    g.querySelectorAll("button").forEach(x=>x.classList.remove("on")); b.classList.add("on"); rec[g.dataset.score]=+b.dataset.v;
    $("#dayScore").innerHTML=ring(dayScore(rec)||0,1,{size:56,stroke:6,label:pct(dayScore(rec))}); }));
  $("#hSave").onclick=async()=>{
    const v=k=>el.querySelector(`[data-k="${k}"]`);
    const out={client_id:p.id,log_date:S.date,diet:rec.diet??null,training:rec.training??null,cardio:rec.cardio??null,sleep_quality:rec.sleep_quality??null,
      stress:v("stress").value||null,sleep_hours:num(v("sleep_hours").value),water_l:num(v("water_l").value),steps:num(v("steps").value),cycle:v("cycle")?.value||null,notes:v("notes").value.trim()||null,updated_at:new Date().toISOString()};
    const { error } = await sb.from("habits").upsert(out,{onConflict:"client_id,log_date"}); if(error) return toast(error.message); toast("✓ اتحفظ"); viewHabits(el);
  };
  const wk=currentWeek(p), by={}; H.forEach(h=>{ const x=weekOfDate(p,h.log_date); if(x) (by[x]=by[x]||[]).push(h); });
  $("#hWeeks").innerHTML=`<div class="card-h"><div class="ic">📊</div><h2>المتوسط الأسبوعي</h2></div><div class="scrollx"><table><tr><th>أسبوع</th><th>دايت</th><th>تمرين</th><th>كارديو</th><th>نوم</th><th>ساعات</th><th>خطوات</th><th>أيام</th></tr>
    ${[...Array(12)].map((_,i)=>{ const a=by[i+1]||[], c=i+1===wk?"cur":""; return `<tr><td class="${c}"><b>${i+1}</b></td><td class="${c}">${pct(avg(a.map(h=>h.diet)))}</td><td class="${c}">${pct(avg(a.map(h=>h.training)))}</td><td class="${c}">${pct(avg(a.map(h=>h.cardio)))}</td><td class="${c}">${pct(avg(a.map(h=>h.sleep_quality)))}</td><td class="${c} num">${fmt(avg(a.map(h=>h.sleep_hours)),1)}</td><td class="${c} num">${fmt(avg(a.map(h=>h.steps)))}</td><td class="${c}">${a.length||""}</td></tr>`; }).join("")}</table></div>`;
}

/* ======================================================================
   BODY
   ====================================================================== */
async function viewBody(el){
  const p=S.client, { data } = await sb.from("body_logs").select("*").eq("client_id",p.id).order("week");
  const B=data||[], wk=currentWeek(p), sel=S.bodyWeek ?? (B.find(b=>b.week===0)?Math.min(wk,12):0);
  const cur=B.find(b=>b.week===sel)||{}, start=B.find(b=>b.week===0)||{};
  const F=[["weight","⚖ الوزن","كجم"],["waist","الوسط","سم"],["chest","الصدر","سم"],["arm","الذراع","سم"],["thigh","الفخذ","سم"],["hips","الأرداف","سم"],["bodyfat","الدهون","%"]];
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic dark">📏</div><h2>القياسات الأسبوعية<small>مرة في الأسبوع – نفس اليوم والتوقيت</small></h2></div>
      <div class="scroller">${[...Array(13)].map((_,i)=>`<button class="chip ${sel===i?"on":""} ${wk===i&&i?"cur":""}" data-w="${i}">${i?"أسبوع "+i:"البداية"}${B.find(b=>b.week===i&&b.weight)?" ✓":""}</button>`).join("")}</div>
      <div class="grid2" style="margin-top:12px"><label class="f">📅 التاريخ<input type="date" data-k="log_date" value="${esc(cur.log_date??today())}"></label>
      ${F.map(([k,l,u])=>{ const d=sel&&start[k]&&cur[k]?cur[k]-start[k]:null; return `<label class="f">${l} (${u})<input inputmode="decimal" data-k="${k}" value="${esc(cur[k]??"")}">${d!==null?`<span class="pill ${d<0?"acc-soft":""}" style="margin-top:4px">${d>0?"▲":"▼"} ${fmt(Math.abs(d),1)} منذ البداية</span>`:""}</label>`; }).join("")}</div>
      <label class="f">ملاحظات<textarea rows="2" data-k="notes">${esc(cur.notes??"")}</textarea></label>
      <button class="btn primary block" id="bSave">حفظ ${sel?"الأسبوع "+sel:"قياسات البداية"}</button></div>
    <div class="card"><div class="card-h"><div class="ic acc">⚖</div><h2>منحنى الوزن</h2></div>${lineChart(B.filter(b=>b.weight).map(b=>({x:b.week,y:+b.weight})),"كجم")}</div>
    <div class="card"><div class="card-h"><div class="ic">📐</div><h2>منحنى الوسط</h2></div>${lineChart(B.filter(b=>b.waist).map(b=>({x:b.week,y:+b.waist})),"سم")}</div>`;
  el.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{S.bodyWeek=+b.dataset.w; viewBody(el);});
  $("#bSave").onclick=async()=>{
    const v=k=>el.querySelector(`[data-k="${k}"]`).value;
    const rec={client_id:p.id,week:sel,log_date:v("log_date")||null,notes:v("notes").trim()||null,updated_at:new Date().toISOString()};
    F.forEach(([k])=>rec[k]=num(v(k)));
    const { error } = await sb.from("body_logs").upsert(rec,{onConflict:"client_id,week"}); if(error) return toast(error.message); toast("✓ اتحفظ"); viewBody(el);
  };
}
