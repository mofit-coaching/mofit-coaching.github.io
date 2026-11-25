/* ======================================================================
   COACH: CLIENTS
   ====================================================================== */
async function loadClients(){
  const [{ data }, { data:ov }] = await Promise.all([ sb.from("profiles").select("*").eq("role","client").order("created_at",{ascending:false}), sb.rpc("coach_overview") ]);
  S.coachClients=data||[]; S.overview=Object.fromEntries((ov||[]).map(o=>[o.client_id,o])); await loadHealth(); await loadEvents();
}
function profileFields(p={}){
  return `<div class="grid2">
    <label class="f">النوع<select data-p="sex"><option value=""></option>${["ذكر","أنثى"].map(s=>`<option ${p.sex===s?"selected":""}>${s}</option>`).join("")}</select></label>
    <label class="f">العمر<input inputmode="numeric" data-p="age" value="${esc(p.age??"")}"></label>
    <label class="f">الطول (سم)<input inputmode="decimal" data-p="height_cm" value="${esc(p.height_cm??"")}"></label>
    <label class="f">الوزن عند البداية (كجم)<input inputmode="decimal" data-p="start_weight" value="${esc(p.start_weight??"")}"></label>
    <label class="f">🎯 الوزن المستهدف (كجم)<input inputmode="decimal" data-p="target_weight" value="${esc(p.target_weight??"")}"></label>
    <label class="f">تاريخ البداية<input type="date" data-p="start_date" value="${esc(p.start_date??today())}"></label>
    <label class="f">عدد الوجبات<select data-p="meals_per_day">${[2,3,4,5,6].map(n=>`<option ${(+p.meals_per_day||3)===n?"selected":""}>${n}</option>`).join("")}</select></label>
    <label class="f">مستوى النشاط<select data-p="activity_factor">${ACTIVITY.map(([l,v])=>`<option value="${v}" ${(+p.activity_factor||1.2)===v?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f">الهدف<select data-p="goal">${GOALS.map(([l])=>`<option ${p.goal===l?"selected":""}>${l}</option>`).join("")}</select></label>
    <label class="f">سعرات يدوية (اختياري)<input inputmode="decimal" data-p="manual_kcal" value="${esc(p.manual_kcal??"")}"></label>
    <label class="f">بروتين جم/كجم (اختياري)<input inputmode="decimal" data-p="protein_gpk" value="${esc(p.protein_gpk??"")}"></label></div>
    <div class="grid3"><label class="f">بروتين %<input inputmode="decimal" data-p="p_pct" value="${Math.round((p.p_pct??0.3)*100)}"></label>
    <label class="f">كارب %<input inputmode="decimal" data-p="c_pct" value="${Math.round((p.c_pct??0.4)*100)}"></label>
    <label class="f">دهون %<input inputmode="decimal" data-p="f_pct" value="${Math.round((p.f_pct??0.3)*100)}"></label></div>`;
}
function readProfile(root){
  const v=k=>root.querySelector(`[data-p="${k}"]`).value, goal=v("goal");
  return { sex:v("sex")||null, age:num(v("age")), height_cm:num(v("height_cm")), start_weight:num(v("start_weight")), target_weight:num(v("target_weight")), start_date:v("start_date")||null,
    meals_per_day:num(v("meals_per_day"))||3, activity_factor:+v("activity_factor"), goal, goal_adj:(GOALS.find(g=>g[0]===goal)||[0,0])[1],
    manual_kcal:num(v("manual_kcal")), protein_gpk:num(v("protein_gpk")), p_pct:(num(v("p_pct"))??30)/100, c_pct:(num(v("c_pct"))??40)/100, f_pct:(num(v("f_pct"))??30)/100 };
}
/* ---------- weekly report: one summary per active client, sent as a chat message from the coach ---------- */
function weeklyReportBody(c,o,st){
  const first=(c.full_name||"").split(" ")[0], wk=currentWeek(c), L=[`أهلاً ${first} 👋 ملخص أسبوعك (أسبوع ${wk}):`];
  L.push(st.sets?`🏋 التمرين: ${st.ex} تمرين · ${st.sets} مجموعة مسجلة`:`🏋 التمرين: لسه مفيش تسجيل الأسبوع ده`);
  if(o?.adherence7!=null) L.push(`🎯 الالتزام آخر 7 أيام: ${pct(o.adherence7)}`);
  const W=o?.weights||[]; if(W.length>=2){ const d=W[W.length-1][1]-W[W.length-2][1]; L.push(`⚖ الوزن: ${fmt(W[W.length-1][1],1)} كجم (${d>0?"+":""}${fmt(d,1)} عن آخر قياس)`); }
  L.push(!st.sets?`خلّينا نرجع للتسجيل من بكرة، وأنا معاك لو محتاج أي تعديل 💪`:(o?.adherence7!=null&&+o.adherence7<0.7)?`عايزين نرفع الالتزام الأسبوع الجاي – قولي إيه اللي واقف قدامك ونظبطه 🙏`:`شغل ممتاز، كمّل بنفس الثبات 🔥`);
  return L.join("\n");
}
async function weeklyReportCard(host,C){
  const act=C.filter(c=>c.active); if(!host) return;
  if(!act.length){ host.innerHTML=""; return; }
  host.innerHTML=`<div class="card-h"><div class="ic acc">📄</div><h2>تقرير الأسبوع<small>ملخص لكل عميل · بتبعته بإيدك من الشات</small></h2></div><p class="hint">بيحمّل…</p>`;
  const minW=Math.min(...act.map(c=>currentWeek(c)));
  const { data } = await sb.from("set_logs").select("client_id,exercise_id,week,reps,weight").gte("week",minW).range(0,4999);
  const St={}; act.forEach(c=>{ const wk=currentWeek(c), rows=(data||[]).filter(s=>s.client_id===c.id&&s.week===wk&&logged(s)); St[c.id]={sets:rows.length, ex:new Set(rows.map(r=>r.exercise_id)).size}; });
  host.innerHTML=`<div class="card-h"><div class="ic acc">📄</div><h2>تقرير الأسبوع<small>ملخص لكل عميل · بتبعته بإيدك من الشات</small></h2></div>`+act.map(c=>{ const o=S.overview?.[c.id], st=St[c.id]; return `<div class="alert-row wr" data-wr="${c.id}"><div class="av">${initials(c)}</div><div class="nm"><b>${esc(c.full_name||c.email)}</b><span class="pill ${st.sets?"acc-soft":"acc"}">🏋 ${st.sets} مجموعة</span>${o?.adherence7!=null?`<span class="pill">🎯 ${pct(o.adherence7)}</span>`:""}</div><button type="button" class="nudge-mini" data-wrs="${c.id}" aria-label="ابعت التقرير في الشات" title="ابعت التقرير في الشات">✉</button></div>`; }).join("");
  host.querySelectorAll("[data-wrs]").forEach(b=>b.onclick=async e=>{ e.stopPropagation(); const cl=C.find(x=>x.id===b.dataset.wrs), body=weeklyReportBody(cl,S.overview?.[cl.id],St[cl.id]);
    if(!confirm(`نبعت التقرير لـ ${cl.full_name||"العميل"} في الشات؟\n\n${body}`)) return; b.disabled=true;
    const { error } = await sb.from("messages").insert({client_id:cl.id, sender_role:chatMine(), body}); b.disabled=false;
    if(error) return toast("تعذر الإرسال، جرّب تاني"); b.classList.add("sent"); toast("✓ التقرير اتبعت في الشات"); });
}
/* ---------- progress analysis: plateau (lift flat 3+ logged weeks) + deload suggestion. Suggestions only, nothing edits a program. ---------- */
function progressAnalysis(c,exs,sets){
  const wk=currentWeek(c), out={plateaus:[],deload:null}; if(isDeload(c,wk)) return out;
  const byEx={}; sets.forEach(s=>{ if(logged(s)&&s.week<=wk){ ((byEx[s.exercise_id]=byEx[s.exercise_id]||{})[s.week]=(byEx[s.exercise_id][s.week]||[])).push(s); } });
  const best=ws=>Math.max(0,...ws.map(s=>e1rm(s)||0)); let dropped=0, tracked=0;
  exs.forEach(ex=>{ const W=byEx[ex.id]; if(!W) return; const wks=Object.keys(W).map(Number).filter(w=>!isDeload(c,w)).sort((a,b)=>a-b); if(wks.length<3) return;
    const B=wks.map(w=>best(W[w])), n=B.length, last3=B.slice(-3), prior=Math.max(0,...B.slice(0,-3)), top=Math.max(...last3);
    if(B[n-1]<B[n-2]) dropped++; tracked++;
    const base=B[n-3]; if(base>0 && Math.max(B[n-2],B[n-1])<=base*1.01 && wks[n-1]>=wk-1) out.plateaus.push({name:ex.name,weeks:3,top:Math.round(top)}); });
  const lastW=sets.filter(s=>s.week===wk-1&&logged(s)); const fail=lastW.filter(isFailure).length;
  if(lastW.length>=10 && fail/lastW.length>=0.5) out.deload={why:`${Math.round(fail/lastW.length*100)}% من مجموعات الأسبوع اللي فات وصلت للفشل`};
  else if(tracked>=3 && dropped/tracked>=0.5) out.deload={why:`الأوزان نزلت في ${dropped} من ${tracked} تمارين`};
  return out;
}
async function progressCard(host,C){
  if(!host) return; const act=C.filter(c=>c.active); if(!act.length){ host.innerHTML=""; return; }
  host.innerHTML=`<div class="card-h"><div class="ic acc">📈</div><h2>تحليل التقدم<small>ثبات الأوزان واقتراحات الديلود</small></h2></div><p class="hint">بيحلّل…</p>`;
  const minW=Math.max(1,Math.min(...act.map(c=>currentWeek(c)))-6);
  const [{ data:sets }, { data:exs }] = await Promise.all([ sb.from("set_logs").select("client_id,exercise_id,week,set_no,reps,weight,rir,failure").gte("week",minW).range(0,9999), sb.from("program_exercises").select("id,client_id,name").in("client_id",act.map(c=>c.id)).range(0,4999) ]);
  const rows=act.map(c=>({c,a:progressAnalysis(c,(exs||[]).filter(e=>e.client_id===c.id),(sets||[]).filter(s=>s.client_id===c.id))})).filter(r=>r.a.plateaus.length||r.a.deload);
  host.innerHTML=`<div class="card-h"><div class="ic acc">📈</div><h2>تحليل التقدم<small>${rows.length?rows.length+" عميل فيهم ملاحظات":"مفيش ثبات ولا إجهاد ملحوظ 👌"}</small></h2></div>`+rows.map(({c,a})=>`<div class="alert-row" data-pg="${c.id}"><div class="av">${initials(c)}</div><div class="nm"><b>${esc(c.full_name||c.email)}</b>${a.deload?`<span class="pill acc">🔄 اقتراح ديلود: ${esc(a.deload.why)}</span>`:""}${a.plateaus.slice(0,4).map(p=>{ const alts=(typeof altsFor==="function"?altsFor(p.name):[]).slice(0,2); return `<span class="pill acc-soft">➖ ${esc(p.name)} ثابت 3 أسابيع${alts.length?" · بدائل: "+alts.map(esc).join("، "):""}</span>`; }).join("")}</div></div>`).join("")+(rows.length?`<p class="hint">دي اقتراحات بس – مفيش برنامج بيتغيّر لوحده. اضغط على العميل لتعديل البرنامج.</p>`:"");
  host.querySelectorAll("[data-pg]").forEach(r=>r.onclick=async()=>{ await openClient(C.find(x=>x.id===r.dataset.pg)); S.tab="setup"; S.setupTab="program"; render(); window.scrollTo(0,0); });
}
async function viewClients(el){
  const C=S.coachClients;
  el.innerHTML=`<div class="grid3" style="margin-bottom:14px"><div class="stat dark"><div class="l">العملاء</div><div class="v">${C.length}</div></div>
      <div class="stat acc"><div class="l">مفعّل</div><div class="v">${C.filter(c=>c.active).length}</div></div>
      <div class="stat"><div class="l">برامج محفوظة</div><div class="v">${S.templates.length}</div></div></div>
    <button class="btn primary block" id="addBtn" style="margin-bottom:14px">+ إضافة عميل جديد</button>
    <div class="card" id="alerts"></div>
    <div class="card" id="wrep"></div>
    <div class="card" id="pgan"></div>
    <div class="card" id="ciov"></div>
    <div class="card" id="mlst"></div>
    <div class="card"><div class="card-h"><div class="ic dark">👥</div><h2>عملائك</h2></div>
      ${C.length>4?`<input id="cq" placeholder="🔍 ابحث بالاسم أو الإيميل" style="margin-bottom:8px">`:""}<div id="cl"></div></div>
    <div class="card" id="bk"></div>
    <div class="card" id="prices"></div>
    <div class="card"><div class="card-h"><div class="ic acc">✍</div><h2>برامج الكوتش المحفوظة<small>بتظهر في قائمة "برنامج الكوتش" عند اختيار النظام</small></h2></div><div id="tplList"></div></div>`;
  const AL=Object.fromEntries(C.map(c=>{ const a=clientAlerts(c,S.overview?.[c.id]), h=healthAlert(c); if(h) a.push(h); a.push(...eventAlerts(c)); const r=rateAlert(c); if(r) a.push(r); return [c.id,a.sort((x,y)=>y.p-x.p)]; }));
  const urgent=C.filter(c=>AL[c.id].length).sort((a,b)=>AL[b.id][0].p-AL[a.id][0].p||AL[b.id].length-AL[a.id].length);
  $("#alerts").innerHTML=`<div class="card-h"><div class="ic acc">🔔</div><h2>يحتاجوا اهتمامك النهارده<small>${urgent.length?urgent.length+" عميل":"كله تمام 👌"}</small></h2></div>`+
    (urgent.length?urgent.map(c=>`<div class="alert-row" data-id="${c.id}"><div class="av">${initials(c)}</div><div class="nm"><b>${esc(c.full_name||c.email)}</b>${AL[c.id].map(a=>`<span class="pill ${a.p>=3?"acc":a.p==2?"acc-soft":""}">${a.icon} ${esc(a.text)}</span>`).join(" ")}</div><button type="button" class="nudge-mini" data-nudge="${c.id}" title="ابعت رسالة في الشات" aria-label="ابعت رسالة في الشات">✉</button>${c.phone?`<a class="wa-mini" href="${esc(remindLink(c,AL[c.id][0]))}" target="_blank" rel="noopener" title="تذكير واتساب" onclick="event.stopPropagation()">💬</a>`:""}</div>`).join(""):`<p class="hint">مفيش تنبيهات – كل العملاء بيسجلوا ومتابعاتهم متردّ عليها.</p>`);
  $("#alerts").querySelectorAll("[data-nudge]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const cl=C.find(x=>x.id===b.dataset.nudge); nudgeClient(cl,AL[cl.id][0],b); });
  $("#alerts").querySelectorAll("[data-id]").forEach(r=>r.onclick=async()=>{ const c=C.find(x=>x.id===r.dataset.id), a=AL[c.id][0]; await openClient(c);
    if(/متابعة/.test(a.text)){ S.tab="body"; S.bodySeg="c"; const o=S.overview?.[c.id]; S.ciWeek=/ناقصة/.test(a.text)?currentWeek(c)-1:(o?.last_checkin_week||currentWeek(c)); } else if(/البلوك/.test(a.text)){ S.tab="setup"; S.setupTab="program"; } else if(/اشتراك|مدفوع/.test(a.text)){ S.tab="setup"; S.setupTab="data"; } else S.tab="home";
    render(); window.scrollTo(0,0); });
  const draw=q=>{ const list=C.filter(c=>!q||(c.full_name||"").includes(q)||(c.email||"").includes(q));
    $("#cl").innerHTML=list.length?list.map(c=>{ const wk=currentWeek(c); return `<div class="client" data-id="${c.id}"><div class="av">${initials(c)}${(()=>{ if(!c.active) return ""; const a=AL[c.id]||[], m=a.length?a[0].p:0, lv=m>=3?"bad":m==2?"mid":"good"; return `<i class="risk ${lv}" title="${esc(a.length?a.slice(0,2).map(x=>x.text).join(" · "):"تمام")}"></i>`; })()}</div>
      <div class="nm"><b>${esc(c.full_name||"—")}</b><small>${seenHTML(c)}${(s=>s?s.icon+" "+esc(s.text)+" · ":"")(subStatus(c))}${esc(c.split_name||"بدون برنامج")}${c.level?" · "+esc(c.level):""} · ${esc(c.goal||"")}</small>
      <div class="bar" style="height:5px"><i style="width:${wInBlock(wk)/BLOCK*100}%"></i></div></div><div style="text-align:center"><b class="num">${wInBlock(wk)}</b><div class="muted" style="font-size:.66rem">/12${wk>BLOCK?" · ب"+blockOf(wk):""}</div></div>${AL[c.id].length?`<span class="pill acc">🔔 ${AL[c.id].length}</span>`:""}${c.active?"":`<span class="pill navy">موقوف</span>`}<button class="client-del" type="button" data-del="${c.id}" aria-label="حذف العميل" title="حذف العميل وكل بياناته">🗑</button></div>`; }).join(""):emptyBox("🙋","لسه مفيش عملاء","ضيف أول عميل وابدأ ابنِ برنامجه: تمرين وأكل ومتابعة من مكان واحد.",{label:"+ إضافة عميل جديد",click:"#addBtn"});
    $("#cl").querySelectorAll("[data-del]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); deleteClientFlow(C.find(c=>c.id===b.dataset.del),async()=>{ await loadClients(); viewClients(el); }); });
    $("#cl").querySelectorAll(".client").forEach(r=>r.onclick=async()=>{ await openClient(C.find(c=>c.id===r.dataset.id)); S.tab="home"; render(); window.scrollTo(0,0); }); };
  weeklyReportCard($("#wrep"),C); progressCard($("#pgan"),C); checkinOverviewCard($("#ciov"),C); mlStorageMeter($("#mlst"));
  draw(""); $("#cq")&&($("#cq").oninput=e=>draw(e.target.value.trim()));
  $("#tplList").innerHTML=S.templates.length?S.templates.map(t=>`<div class="item" style="padding:9px 0"><div class="nm"><b>✍ ${esc(t.name)}</b><small>${t.days} أيام · ${t.plan.map(d=>esc(d.label)).join(" / ")}</small></div><button class="x" data-tdel="${t.id}">✕</button></div>`).join(""):`<p class="hint">من ⚙️ التحكم ← برنامج التمرين عند أي عميل، اضغط "💾 حفظ كبرنامج كوتش".</p>`;
  $("#tplList").querySelectorAll("[data-tdel]").forEach(b=>b.onclick=async()=>{ if(!confirm("حذف البرنامج المحفوظ؟ (برامج العملاء الحالية مش هتتأثر)")) return; await sb.from("program_templates").delete().eq("id",b.dataset.tdel); await loadCoachTemplates(); viewClients(el); });
  $("#addBtn").onclick=()=>addClientSheet(el);
  const age=backupAge();
  $("#bk").innerHTML=`<div class="card-h"><div class="ic ${age===null||age>14?"acc":""}">📦</div><h2>النسخة الاحتياطية<small>${age===null?"⚠ عمرك ما نزّلت نسخة – اعمل واحدة دلوقتي":age>14?"⚠ آخر نسخة من "+age+" يوم":"✅ آخر نسخة من "+age+" يوم"}</small></h2></div>
    <p class="hint">ملف واحد فيه كل العملاء والبرامج والتسجيلات والأطعمة. احفظه على Google Drive كل أسبوعين.</p><button class="btn navy block" id="bkBtn">📦 نزّل نسخة احتياطية كاملة</button>`;
  $("#bkBtn").onclick=e=>exportBackup(e.currentTarget);
  coachPricesCard($("#prices"));
}
function addClientSheet(el){
  const body=openSheet(`<div class="between"><b style="font-size:1.1rem">عميل جديد</b><button class="btn sm ghost" data-close>✕</button></div>
    <div class="seg" style="margin:10px 0 14px"><button class="on" data-st="1">1 · الحساب</button><button data-st="2">2 · البيانات</button><button data-st="3">3 · التمرين</button></div>
    <div data-step="1"><label class="f">اسم العميل<input id="nName"></label><label class="f">الإيميل (اسم الدخول)<input id="nEmail" type="email" autocomplete="off"></label>
      <label class="f">كلمة السر<div class="row"><input id="nPass" class="grow" autocomplete="new-password" value="${genPass()}"><button class="btn sm" id="gen">توليد</button></div></label></div>
    <div data-step="2" class="hidden">${profileFields({})}</div>
    <div data-step="3" class="hidden" id="nSys">${systemFields(3,"متوسط")}</div>
    <p class="err" id="nErr"></p>
    <div class="row"><button class="btn grow hidden" id="nBack">→ السابق</button><button class="btn navy grow" id="nNext">التالي ←</button><button class="btn primary grow hidden" id="nCreate">إنشاء الحساب ✓</button></div><div id="nDone"></div>`);
  let step=1; const getSys=wireSystemPicker($("#nSys"),null);
  const go=n=>{ step=n; body.querySelectorAll("[data-step]").forEach(d=>d.classList.toggle("hidden",+d.dataset.step!==n)); body.querySelectorAll("[data-st]").forEach(b=>b.classList.toggle("on",+b.dataset.st===n));
    $("#nBack").classList.toggle("hidden",n===1); $("#nNext").classList.toggle("hidden",n===3); $("#nCreate").classList.toggle("hidden",n!==3); };
  body.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>go(+b.dataset.st));
  $("#nNext").onclick=()=>go(step+1); $("#nBack").onclick=()=>go(step-1);
  body.querySelector("[data-close]").onclick=closeSheet; $("#gen").onclick=()=>$("#nPass").value=genPass();
  $("#nCreate").onclick=async()=>{
    $("#nErr").textContent=""; const btn=$("#nCreate"); btn.disabled=true; btn.textContent="جارٍ الإنشاء…";
    const email=$("#nEmail").value.trim(), password=$("#nPass").value, full_name=$("#nName").value.trim(), {sys,level}=getSys();
    const { data, error } = await adminCall({ body:{ action:"create_client", email, password, full_name, profile:readProfile(body) } });
    btn.disabled=false; btn.textContent="إنشاء الحساب ✓";
    const msg=await fnErr(error,data); if(msg){ $("#nErr").textContent=msg; return; }
    if(sys) await applyProgram({id:data.id}, sys, level); else await sb.from("profiles").update({level}).eq("id",data.id);
    const link=location.href.split("#")[0].split("?")[0];
    const share=`أهلاً ${full_name} 👋\nده حسابك في Mofit:\n🔗 ${link}\n📧 ${email}\n🔑 ${password}`;
    $("#nDone").innerHTML=`<div class="card" style="background:var(--good-soft);box-shadow:none;margin-top:12px"><b>✓ تم إنشاء الحساب</b><pre style="white-space:pre-wrap;font-family:inherit;margin:8px 0">${esc(share)}</pre>
      <div class="row"><button class="btn sm navy" id="cp">📋 نسخ الرسالة</button><a class="btn sm" style="text-decoration:none" target="_blank" href="https://wa.me/?text=${encodeURIComponent(share)}">واتساب ↗</a></div></div>`;
    $("#cp").onclick=()=>navigator.clipboard.writeText(share).then(()=>toast("✓ اتنسخت"));
    $("#nCreate").classList.add("hidden"); $("#nBack").classList.add("hidden");
    await loadClients(); viewClients(el);
  };
}

/* ======================================================================
   COACH: CLIENT CONTROL PANEL
   ====================================================================== */
async function viewSetup(el){
  const tabsH=[["data","👤 البيانات"],["program","🏋️ التمرين"],["diet","🥗 التغذية"],["supps","💊 المكملات"],["report","📄 تقرير"],["account","🔐 الحساب"]];
  el.innerHTML=`<div class="seg" style="margin-bottom:14px">${tabsH.map(([k,l])=>`<button data-sub="${k}" class="${S.setupTab===k?"on":""}">${l}</button>`).join("")}</div><div id="sub"></div>`;
  el.querySelectorAll("[data-sub]").forEach(b=>b.onclick=()=>{ S.setupTab=b.dataset.sub; viewSetup(el); });
  const sub=$("#sub");
  if(S.setupTab==="data") return setupData(sub);
  if(S.setupTab==="program") return setupProgram(sub);
  if(S.setupTab==="diet") return setupDiet(sub);
  if(S.setupTab==="supps") return setupSupps(sub);
  if(S.setupTab==="report") return viewReport(sub);
  return setupAccount(sub);
}
function setupData(el){
  const p=S.client, t=targets(p);
  el.innerHTML=`<div class="card dark"><div class="card-h"><div class="ic">🧮</div><h2>الأهداف المحسوبة<small>Mifflin-St Jeor · TDEE = BMR × النشاط</small></h2></div>
      <div class="grid3"><div class="stat dark" style="background:rgba(255,255,255,.08)"><div class="l">BMR</div><div class="v num">${fmt(t.bmr)}</div></div><div class="stat dark" style="background:rgba(255,255,255,.08)"><div class="l">TDEE</div><div class="v num">${fmt(t.tdee)}</div></div><div class="stat dark" style="background:rgba(255,255,255,.08)"><div class="l">السعرات</div><div class="v num" style="color:var(--acc)">${fmt(t.kcal)}</div></div>
      <div class="stat dark" style="background:rgba(255,255,255,.08)"><div class="l">بروتين</div><div class="v num">${fmt(t.P)}</div><div class="s">جم${t.P&&p.start_weight?" · "+fmt(t.P/p.start_weight,2)+" جم/كجم":""}</div></div><div class="stat dark" style="background:rgba(255,255,255,.08)"><div class="l">كارب</div><div class="v num">${fmt(t.C)}</div><div class="s">جم</div></div><div class="stat dark" style="background:rgba(255,255,255,.08)"><div class="l">دهون</div><div class="v num">${fmt(t.F)}</div><div class="s">جم</div></div></div></div>
    <div class="card"><div class="card-h"><div class="ic acc">💳</div><h2>الاشتراك<small>${(s=>s?s.icon+" "+esc(s.text):"لم يحدد")(subStatus(p))}</small></h2></div>
      <div class="grid2"><label class="f">الباقة<input id="sPlan" placeholder="شهري / 3 شهور…" value="${esc(p.sub_plan??"")}"></label>
      <label class="f">السعر<input id="sPrice" inputmode="decimal" value="${esc(p.sub_price??"")}"></label>
      <label class="f">من<input type="date" id="sStart" value="${esc(p.sub_start??"")}"></label>
      <label class="f">إلى<input type="date" id="sEnd" value="${esc(p.sub_end??"")}"></label></div>
      <div class="row" style="margin-bottom:10px">${[[1,0],[3,1],[6,2],[12,6]].map(([m,f])=>`<button class="chip" data-sm="${m+f}" data-plan="${f?esc(planTitle({months:m,free_months:f})):"شهري"}">${f?`${m}+${f} 🎁`:"+1 شهر"}</button>`).join("")}<label class="row" style="gap:6px;margin-inline-start:auto;font-weight:700"><input type="checkbox" id="sPaid" style="width:auto;min-height:0" ${p.sub_paid?"checked":""}> مدفوع</label></div>
      <label class="f">ملاحظات الدفع<input id="sNotes" value="${esc(p.sub_notes??"")}"></label>
      <label class="f">📱 رقم واتساب العميل (للتذكيرات)<input id="sPhone" inputmode="tel" dir="ltr" placeholder="01xxxxxxxxx" value="${esc(p.phone??"")}"></label>
      <button class="btn navy block" id="sSave">حفظ الاشتراك</button></div>
    <div class="card"><div class="card-h"><div class="ic">👤</div><h2>بيانات العميل</h2></div>
      <label class="f">الاسم<input data-x="full_name" value="${esc(p.full_name??"")}"></label>${profileFields(p)}
      <label class="f">ملاحظات الكوتش (خاصة – العميل مش بيشوفها)<textarea rows="2" data-x="coach_notes" placeholder="بيتحمل…"></textarea></label>
      <button class="btn primary block" id="pSave">حفظ البيانات</button></div>`;
  el.querySelectorAll("[data-sm]").forEach(b=>b.onclick=()=>{ const st=$("#sStart").value||today(); $("#sStart").value=st; const d=new Date(st+"T00:00:00"); d.setMonth(d.getMonth()+(+b.dataset.sm)); d.setDate(d.getDate()-1); $("#sEnd").value=d.toISOString().slice(0,10); $("#sPlan").value=b.dataset.plan; });
  el.insertAdjacentHTML("afterbegin",healthCard(p)+painCard(p)); fillCoachNote(el,p); el.insertAdjacentHTML("beforeend",assessmentCardHTML(p)); wireAssessment($("#ohsa"),p);
  el.querySelectorAll("[data-pres]").forEach(b=>b.onclick=async()=>{ const { error } = await sb.from("client_events").update({resolved_at:new Date().toISOString()}).eq("id",b.dataset.pres); if(error) return toast("تعذر الحفظ"); await loadEvents(); toast("تم ✓"); setupData(el); });
  $("#hClear")&&($("#hClear").onclick=async()=>{ const { error } = await sb.from("health_screens").update({cleared_at:new Date().toISOString()}).eq("client_id",p.id); if(error) return toast("تعذر الحفظ"); await loadHealth(); toast("تم ✓"); setupData(el); });
  $("#sSave").onclick=async()=>{ if($("#sPhone").value.trim()&&!normPhone($("#sPhone").value)) return toast("رقم الواتساب مش صحيح"); const { error } = await sb.from("profiles").update({sub_plan:$("#sPlan").value.trim()||null, sub_price:num($("#sPrice").value), sub_start:$("#sStart").value||null, sub_end:$("#sEnd").value||null, sub_paid:$("#sPaid").checked, sub_notes:$("#sNotes").value.trim()||null, phone:normPhone($("#sPhone").value)}).eq("id",p.id);
    if(error) return toast(error.message); await refreshClient(); toast("✓ اتحفظ الاشتراك"); setupData(el); };
  $("#pSave").onclick=async()=>{
    const upd={...readProfile(el), full_name:el.querySelector('[data-x="full_name"]').value.trim(), };
    const { error:ne } = await sb.from("coach_private").upsert({client_id:p.id, notes:el.querySelector('[data-x="coach_notes"]').value.trim()||null, updated_at:new Date().toISOString()},{onConflict:"client_id"}); if(ne) return toast(ne.message);
    const { error } = await sb.from("profiles").update(upd).eq("id",p.id); if(error) return toast(error.message);
    await refreshClient(); toast("✓ اتحفظت"); render();
  };
}
function setupProgram(el){
  const p=S.client, days=[...new Set(S.program.map(e=>e.day_no))].sort((a,b)=>a-b);
  if(!days.includes(S.day)&&days.length) S.day=days[0];
  el.innerHTML=`<div id="brHost"></div><div class="card"><div class="card-h"><div class="ic acc">🧭</div><h2>نظام التمرين والمستوى<small>الحالي: ${esc(p.split_name||"لم يحدد")}${p.level?" · "+esc(p.level):""}</small></h2></div>
      <div id="sysBox">${systemFields(p.training_days||3, p.level||"متوسط")}</div>
      <button class="btn primary block" id="sysApply" style="margin-top:10px">تطبيق على ${esc(p.full_name||"العميل")}</button>
      <p class="hint">⚠ التطبيق بيستبدل البرنامج الحالي ويمسح المجموعات المسجلة على التمارين القديمة.</p></div>
    <div class="card"><div class="card-h"><div class="ic">🔄</div><h2>أسابيع الديلود<small>العميل بيشوف مجموعات أقل ~40% وRIR 3-4 – بتتكرر في كل بلوك (كل 12 أسبوع)</small></h2></div>
      <div class="row" style="gap:6px" id="dl">${[...Array(12)].map((_,i)=>`<button class="chip ${(p.deload_weeks||[]).includes(i+1)?"on":""}" data-dw="${i+1}">${i+1}</button>`).join("")}</div>
      <div class="row" style="margin-top:10px"><span class="hint grow">الافتراضي حسب المستوى: مبتدئ بدون · متوسط أسبوع 6 · متقدم 4 و8</span><button class="btn sm navy" id="dlSave">حفظ</button></div></div>
    ${cardioEditorHTML(p)}
    <div class="card"><div class="card-h"><div class="ic acc">📆</div><h2>جدول الأسبوع<small>اسحب الأيام ورتّبها – وحط أيام راحة بينها</small></h2></div>
      <div id="wk"></div>
      <div class="row" style="margin-top:10px"><button class="btn grow" id="wkAuto">⚡ توزيع تلقائي للراحة</button><button class="btn primary grow" id="wkSave">حفظ الجدول</button></div>
      <p class="hint">الدورة 7 أيام وبتبدأ من تاريخ البداية${p.start_date?" ("+esc(p.start_date)+")":""}. المجموعات المسجلة بتفضل مع تمارينها.</p></div>
    <div class="card"><div class="card-h"><div class="ic dark">✏️</div><h2>تعديل البرنامج يدوياً<small>العدات · RIR · الراحة · التمبو · رابط الفيديو</small></h2></div>
      <div class="scroller">${[1,2,3,4,5,6,7].map(d=>`<button class="chip ${S.day===d?"on":""}" data-d="${d}">يوم ${d}${days.includes(d)?" ("+S.program.filter(e=>e.day_no===d).length+")":""}</button>`).join("")}</div>
      <div class="row" style="margin:10px 0"><input id="dLbl" class="grow" placeholder="اسم اليوم (مثلاً Push / Upper A)" value="${esc(dayLabel(S.day))}"><button class="btn sm" id="dLblSave">حفظ الاسم</button></div>
      <div id="pList"></div>
      <div class="row"><button class="btn navy grow" id="exAdd">+ تمرين ليوم ${S.day}</button>${S.program.length?`<button class="btn grow" id="tplSave">💾 حفظ كبرنامج كوتش</button>`:""}</div></div>`;
  const getSys=wireSystemPicker($("#sysBox"), p.split_key, p.id);
  weekEditor($("#wk"), el); wireCardioEditor(p);
  blockReviewHTML(p).then(h=>{ const x=$("#brHost"); if(x){ x.innerHTML=h; wireBlockReview(p,el); } });
  el.querySelectorAll("[data-dw]").forEach(b=>b.onclick=()=>b.classList.toggle("on"));
  $("#dlSave").onclick=async()=>{ const w=[...el.querySelectorAll("[data-dw].on")].map(b=>+b.dataset.dw); const { error } = await sb.from("profiles").update({deload_weeks:w}).eq("id",p.id); if(error) return toast(error.message); await refreshClient(); toast("✓ اتحفظ"); };
  $("#sysApply").onclick=async()=>{
    const {sys,level}=getSys(); if(!sys) return toast("اختار نظام");
    if(S.program.length && !confirm(`استبدال برنامج ${p.full_name||""} الحالي بـ "${sys.name}" (${level})؟`)) return;
    if(await applyProgram(p, sys, level)){ await refreshClient(); S.day=1; toast("✓ تم تطبيق النظام"); render(); }
  };
  el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{S.day=+b.dataset.d; setupProgram(el);});
  $("#dLblSave").onclick=async()=>{ const v=$("#dLbl").value.trim()||null; const { error } = await sb.from("program_exercises").update({day_label:v}).eq("client_id",p.id).eq("day_no",S.day); if(error) return toast(error.message); S.program.filter(e=>e.day_no===S.day).forEach(e=>e.day_label=v); toast("✓ اتحفظ"); };
  const exs=S.program.filter(e=>e.day_no===S.day), list=$("#pList");
  list.innerHTML=exs.length?"":emptyBox("😴","يوم راحة","مفيش تمارين في اليوم ده.","","es-sm");
  exs.forEach((ex,idx)=>{
    const d=document.createElement("div"); d.className="edit-ex"; const lib=S.videos[(ex.name||"").toUpperCase()];
    d.innerHTML=`<div class="between" style="margin-bottom:8px"><b>${idx+1}. ${esc(ex.name)}</b><div class="row"><button class="btn sm" data-up>▲</button><button class="btn sm" data-dn>▼</button></div></div>
      <div class="grid3"><label class="f">اسم التمرين<input data-e="name" value="${esc(ex.name)}"></label>
        <label class="f">المجموعات<input inputmode="numeric" data-e="sets" value="${ex.sets}"></label>
        <label class="f">العدات<input data-e="target_reps" placeholder="8-12" value="${esc(ex.target_reps??"")}"></label>
        <label class="f">RIR<input data-e="target_rir" placeholder="1-2" value="${esc(ex.target_rir??"")}"></label>
        <label class="f">الراحة (ثانية)<input inputmode="numeric" data-e="rest_sec" placeholder="90" value="${esc(ex.rest_sec??"")}"></label>
        <label class="f">التمبو<input data-e="tempo" placeholder="3-1-1-0" value="${esc(ex.tempo??"")}"></label></div>
      <label class="f">🎬 رابط فيديو الأداء (YouTube)<input data-e="video_url" placeholder="${lib?"من المكتبة: "+esc(lib):"https://youtu.be/…"}" value="${esc(ex.video_url??"")}"></label>
      <label class="f">ملاحظات للعميل<input data-e="notes" value="${esc(ex.notes??"")}"></label>
      <div class="row"><button class="btn sm primary" data-save>حفظ</button>${videoFor(ex)?`<button class="btn sm" data-play>▶ معاينة</button>`:""}<span class="grow"></span><button class="btn sm danger" data-del>حذف</button></div>`;
    d.querySelector("[data-save]").onclick=async()=>{
      const v=k=>d.querySelector(`[data-e="${k}"]`).value.trim();
      const upd={name:(v("name")||ex.name).toUpperCase(),sets:Math.min(Math.max(num(v("sets"))||3,1),10),target_reps:v("target_reps")||null,target_rir:v("target_rir")||null,rest_sec:num(v("rest_sec")),tempo:v("tempo")||null,video_url:v("video_url")||null,notes:v("notes")||null};
      const { error } = await sb.from("program_exercises").update(upd).eq("id",ex.id); if(error) return toast(error.message); Object.assign(ex,upd); toast("✓ اتحفظ"); setupProgram(el);
    };
    d.querySelector("[data-play]")&&(d.querySelector("[data-play]").onclick=()=>openVideo(ex));
    d.querySelector("[data-del]").onclick=async()=>{ if(!confirm("حذف التمرين وكل المجموعات المسجلة له؟")) return; const { error } = await sb.from("program_exercises").delete().eq("id",ex.id); if(error) return toast(error.message); S.program=S.program.filter(e=>e.id!==ex.id); setupProgram(el); };
    const move=async dir=>{ const j=idx+dir; if(j<0||j>=exs.length) return; const a=exs[idx], b=exs[j];
      await Promise.all([sb.from("program_exercises").update({position:j}).eq("id",a.id), sb.from("program_exercises").update({position:idx}).eq("id",b.id)]);
      a.position=j; b.position=idx; S.program.sort((x,y)=>x.day_no-y.day_no||x.position-y.position); setupProgram(el); };
    d.querySelector("[data-up]").onclick=()=>move(-1); d.querySelector("[data-dn]").onclick=()=>move(1);
    list.appendChild(d);
  });
  $("#exAdd").onclick=async()=>{ const name=prompt("اسم التمرين"); if(!name) return;
    const L=LEVELS[p.level]||LEVELS["متوسط"], c=isCompound(name.toUpperCase());
    const { data, error } = await sb.from("program_exercises").insert({client_id:p.id,day_no:S.day,position:exs.length,name:name.trim().toUpperCase(),sets:3,target_reps:c?"6-10":"10-15",target_rir:c?L.rir.c:L.rir.i,rest_sec:c?L.rest.c:L.rest.i,tempo:c?L.tempo.c:L.tempo.i,day_label:dayLabel(S.day)||null}).select().single();
    if(error) return toast(error.message); S.program.push(data); setupProgram(el); };
  $("#tplSave")&&($("#tplSave").onclick=async()=>{ const name=prompt("اسم برنامج الكوتش", p.split_name||"برنامج الكوتش"); if(!name) return;
    const ds=[...new Set(S.program.map(e=>e.day_no))].sort((a,b)=>a-b);
    const plan=ds.map(d=>({label:dayLabel(d)||("Day "+d), ex:S.program.filter(e=>e.day_no===d).map(e=>[e.name,e.sets,e.target_reps,e.target_rir,e.rest_sec,e.tempo,e.notes,e.video_url])}));
    const { error } = await sb.from("program_templates").insert({name:name.trim(),days:ds.length,plan}); if(error) return toast(error.message); await loadCoachTemplates(); toast("✓ اتحفظ كبرنامج كوتش"); });
}
const WEEKDAYS=["الأحد","الاتنين","التلات","الأربع","الخميس","الجمعة","السبت"];
function weekEditor(host, panel){
  const p=S.client, train=[...new Set(S.program.map(e=>e.day_no))].sort((a,b)=>a-b);
  let slots=[...Array(7)].map((_,i)=>train.includes(i+1)?{t:"d",d:i+1}:{t:"r"});
  const wd=i=>p.start_date?WEEKDAYS[new Date(addDays(p.start_date,i)+"T00:00:00").getDay()]:"";
  const draw=()=>{
    host.innerHTML=`<div class="wk-list">${slots.map((s,i)=>{ const n=s.t==="d"?S.program.filter(e=>e.day_no===s.d).length:0;
      return `<div class="wk-slot ${s.t==="r"?"rest":""}" data-i="${i}"><span class="wk-grip">⠿</span><div class="wk-day"><b>${i+1}</b><small>${wd(i)}</small></div>
        <div class="wk-body">${s.t==="d"?`<b>${esc(dayLabel(s.d)||"يوم تمرين")}</b><small>${n} تمارين</small>`:`<b>😴 راحة</b><small>استشفاء</small>`}</div>
        <button class="btn sm" data-up="${i}" ${i===0?"disabled":""}>▲</button><button class="btn sm" data-dn="${i}" ${i===6?"disabled":""}>▼</button></div>`; }).join("")}</div>`;
    const swap=(i,j)=>{ [slots[i],slots[j]]=[slots[j],slots[i]]; draw(); };
    host.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>swap(+b.dataset.up,+b.dataset.up-1));
    host.querySelectorAll("[data-dn]").forEach(b=>b.onclick=()=>swap(+b.dataset.dn,+b.dataset.dn+1));
    if(window.Sortable) Sortable.create(host.querySelector(".wk-list"),{handle:".wk-grip",animation:180,ghostClass:"wk-ghost",forceFallback:true,fallbackTolerance:3,
      onEnd:()=>{ slots=[...host.querySelectorAll(".wk-slot")].map(x=>slots[+x.dataset.i]); draw(); }});
  };
  draw();
  $("#wkAuto").onclick=()=>{ const ds=slots.filter(s=>s.t==="d"), pos=DEFAULT_SLOTS[ds.length]||[]; slots=[...Array(7)].map(()=>({t:"r"})); ds.forEach((s,k)=>slots[pos[k]-1]=s); draw(); };
  $("#wkSave").onclick=async()=>{
    const moves=slots.map((s,i)=>s.t==="d"&&s.d!==i+1?{from:s.d,to:i+1}:null).filter(Boolean);
    if(!moves.length) return toast("مفيش تغيير");
    for(const m of moves){ const ids=S.program.filter(e=>e.day_no===m.from).map(e=>e.id);
      const { error } = await sb.from("program_exercises").update({day_no:m.to}).in("id",ids); if(error) return toast(error.message); }
    await refreshClient(); S.day=slots.findIndex(s=>s.t==="d")+1||1; toast("✓ اتحفظ الجدول"); setupProgram(panel);
  };
}
async function setupDiet(el){
  const p=S.client, n=Math.max(1,Math.min(+p.meals_per_day||3,8));
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic acc">🍽</div><h2>الوجبات<small>عددها وأسماؤها</small></h2></div>
      <div class="grid2"><label class="f">عدد الوجبات<select id="mCount">${[2,3,4,5,6].map(x=>`<option ${n===x?"selected":""}>${x}</option>`).join("")}</select></label>
      ${[...Array(n)].map((_,i)=>`<label class="f">${MEAL_ICONS[i]} اسم الوجبة ${i+1}<input data-mn="${i}" value="${esc(mealName(p,i+1))}"></label>`).join("")}</div>
      <button class="btn navy block" id="mSave">حفظ الوجبات</button></div>
    <div class="card"><div class="card-h"><div class="ic dark">📚</div><h2>قوالب الدايت<small>احفظ الخطة كقالب وطبّقها على أي عميل – مع ضبط تلقائي لسعراته</small></h2></div>
      <div id="dtList"></div>
      <div class="row" style="margin-top:8px"><button class="btn grow" id="dtSave">💾 حفظ خطة ${esc(p.full_name||"العميل")} كقالب</button></div></div>
    <p class="hint" style="margin:0 4px 10px">📋 الخطة دي بتظهر للعميل في صفحة التغذية – يقدر يعلّم على اللي أكله بضغطة ✓، ويقدر يعدّل فيها.</p>
    <div id="planHost"></div>`;
  $("#mSave").onclick=async()=>{ const names=[...el.querySelectorAll("[data-mn]")].map(i=>i.value.trim()||null);
    const { error } = await sb.from("profiles").update({meals_per_day:+$("#mCount").value, meal_names:names}).eq("id",p.id); if(error) return toast(error.message);
    await refreshClient(); toast("✓ اتحفظ"); setupDiet(el); };
  $("#mCount").onchange=async()=>{ await sb.from("profiles").update({meals_per_day:+$("#mCount").value}).eq("id",p.id); await refreshClient(); setupDiet(el); };
  const tk=targets(p).kcal;
  $("#dtList").innerHTML=(S.dietTpl||[]).length?S.dietTpl.map(t=>`<div class="item" style="padding:9px 0"><div class="nm"><b>${esc(t.name)}</b><small>${fmt(t.kcal)} kcal · ${t.items.length} صنف · ${t.meals_per_day||"—"} وجبات</small></div>
      <button class="btn sm primary" data-dta="${t.id}">تطبيق</button><button class="x" data-dtd="${t.id}">✕</button></div>`).join(""):emptyBox("📋","مفيش قوالب لسه","احفظ أي خطة كقالب وهتلاقيها هنا جاهزة تطبقها لأي عميل.","","es-sm");
  el.querySelectorAll("[data-dta]").forEach(b=>b.onclick=async()=>{ const t=S.dietTpl.find(x=>x.id===b.dataset.dta);
    const scale=tk&&t.kcal&&Math.abs(tk-t.kcal)/t.kcal>0.03 ? confirm(`القالب ${fmt(t.kcal)} kcal وهدف العميل ${fmt(tk)} kcal.\nأضبط الكميات تلقائياً على ${fmt(tk)}؟ (إلغاء = زي ما هو)`) : false;
    if(!confirm("استبدال خطة الدايت الحالية بالقالب؟")) return;
    if(await applyDietTemplate(p,t,scale?tk:null)){ await refreshClient(); toast("✓ اتطبق القالب"); setupDiet(el); } });
  el.querySelectorAll("[data-dtd]").forEach(b=>b.onclick=async()=>{ if(!confirm("حذف القالب؟")) return; await sb.from("diet_templates").delete().eq("id",b.dataset.dtd); await loadDietTemplates(); setupDiet(el); });
  $("#dtSave").onclick=async()=>{ const { data:items } = await sb.from("diet_plan_items").select("*").eq("client_id",p.id).order("meal_no").order("position");
    if(!items?.length) return toast("الخطة فاضية"); const name=prompt("اسم القالب", `${fmt(sumMacros(items).kcal)} kcal – ${p.goal||""}`); if(!name) return;
    const { error } = await sb.from("diet_templates").insert({name:name.trim(), kcal:Math.round(sumMacros(items).kcal), meals_per_day:+p.meals_per_day||3,
      items:items.map(i=>({meal_no:i.meal_no,food_id:i.food_id,food_name:i.food_name,unit:i.unit,qty:+i.qty,kcal:+i.kcal,protein:+i.protein,carbs:+i.carbs,fat:+i.fat,notes:i.notes}))});
    if(error) return toast(error.message); await loadDietTemplates(); toast("✓ اتحفظ القالب"); setupDiet(el); };
  renderMeals($("#planHost"),{mode:"plan"});
}
function setupAccount(el){
  const p=S.client;
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic dark">📧</div><h2>الإيميل (اسم الدخول)</h2></div>
      <div class="row"><input id="newEmail" class="grow" type="email" value="${esc(p.email??"")}"><button class="btn sm navy" id="se">تغيير</button></div></div>
    <div class="card"><div class="card-h"><div class="ic dark">🔑</div><h2>كلمة السر</h2></div>
      <div class="row"><input id="newPass" class="grow" placeholder="كلمة سر جديدة" autocomplete="new-password"><button class="btn sm" id="gp">توليد</button><button class="btn sm navy" id="sp">تغيير</button></div></div>
    <div class="card"><div class="card-h"><div class="ic">⚙️</div><h2>حالة الحساب<small>${p.active?"مفعّل – العميل يقدر يدخل":"موقوف – العميل مش هيقدر يدخل"}</small></h2></div>
      <div class="row"><button class="btn grow" id="act">${p.active?"⏸ إيقاف الحساب":"▶ تفعيل الحساب"}</button><button class="btn danger grow" id="del">🗑 حذف العميل نهائياً</button></div></div>`;
  const call=async body=>{ const { data, error } = await adminCall({body}); const msg=await fnErr(error,data); if(msg){ toast(msg); return false; } return true; };
  $("#se").onclick=async()=>{ if(await call({action:"set_email",user_id:p.id,email:$("#newEmail").value.trim()})){ await refreshClient(); toast("✓ اتغيّر الإيميل"); } };
  $("#gp").onclick=()=>$("#newPass").value=genPass();
  $("#sp").onclick=async()=>{ const pw=$("#newPass").value; if(await call({action:"set_password",user_id:p.id,password:pw})){ navigator.clipboard?.writeText(pw); toast("✓ اتغيّرت واتنسخت: "+pw); } };
  $("#act").onclick=async()=>{ const { error } = await sb.from("profiles").update({active:!p.active}).eq("id",p.id); if(error) return toast(error.message); await refreshClient(); setupAccount(el); };
  $("#del").onclick=()=>deleteClientFlow(p,async()=>{ S.client=null; S.tab="clients"; await loadClients(); render(); });
}

/* ======================================================================
   COACH: EXERCISE VIDEO LIBRARY
   ====================================================================== */
async function viewVideos(el){
  const [{ data:lib }, { data:ex }] = await Promise.all([ sb.from("exercise_videos").select("*"), sb.from("program_exercises").select("name,client_id") ]);
  const usedBy={}; (ex||[]).forEach(e=>{ const n=e.name.toUpperCase(); (usedBy[n]=usedBy[n]||new Set()).add(e.client_id); });
  const altMap=Object.fromEntries((lib||[]).map(v=>[v.name,v.alternatives||[]]));
  const names=new Set([...(ex||[]).map(e=>e.name.toUpperCase()), ...Object.values(B).flat().map(e=>e[0]), ...MOFIT_TEMPLATE.map(e=>e.name), ...(lib||[]).map(v=>v.name)]);
  const map=Object.fromEntries((lib||[]).filter(v=>v.video_url).map(v=>[v.name,v.video_url]));
  const all=[...names].sort((a,b)=>(usedBy[b]?.size||0)-(usedBy[a]?.size||0)||a.localeCompare(b)), withVid=all.filter(n=>map[n]).length;
  const used=all.filter(n=>usedBy[n]), usedVid=used.filter(n=>map[n]).length;
  el.innerHTML=`<div class="card dark"><div class="card-h"><div class="ic">🎬</div><h2>مكتبة التمارين<small>فيديو الأداء + البدائل – مرة واحدة وتظهر عند كل العملاء</small></h2></div>
      <div class="bar" style="background:rgba(255,255,255,.15)"><i style="width:${all.length?withVid/all.length*100:0}%"></i></div><p class="hint">${withVid} من ${all.length} تمرين في المكتبة ليهم فيديو</p></div>
    <div class="card" style="border:1.5px solid var(--acc-line)"><div class="card-h"><div class="ic acc">🎯</div><h2>تمارين عملائك<small>${usedVid} من ${used.length} ليهم فيديو${used.length-usedVid?` · ناقص ${used.length-usedVid}`:" · كله تمام 👌"}</small></h2></div>
      <div class="bar"><i style="width:${used.length?usedVid/used.length*100:0}%"></i></div>
      <p class="hint" style="margin:8px 0 0">ابدأ بالناقص – مرتبين حسب عدد العملاء اللي عندهم التمرين. زرار 🔎 بيفتح بحث يوتيوب، اختار الفيديو وانسخ لينكه هنا.</p></div>
    <div class="card"><div class="row" style="margin-bottom:10px"><input id="vq" class="grow" placeholder="🔍 ابحث عن تمرين"><select id="vf" style="width:auto"><option value="usedno">عملائي – بدون فيديو</option><option value="used">عملائي – الكل</option><option value="">المكتبة كلها</option><option value="no">بدون فيديو</option><option value="yes">بفيديو</option></select></div>
      <div class="row" style="margin-bottom:12px"><input id="vNew" class="grow" placeholder="+ تمرين جديد للمكتبة"><button class="btn sm navy" id="vAdd">إضافة</button></div><div id="vl"></div></div>`;
  const draw=()=>{ const q=$("#vq").value.trim().toUpperCase(), f=$("#vf").value;
    const ok=n=> f==="usedno"? usedBy[n]&&!map[n] : f==="used"? !!usedBy[n] : (!f||(f==="yes")===!!map[n]);
    const list=all.filter(n=>(!q||n.includes(q))&&ok(n)).slice(0,80);
    $("#vl").innerHTML=list.map(n=>`<div class="edit-ex" data-n="${esc(n)}"><div class="between"><b>${map[n]?"🎬":"⚪"} ${esc(n)}${usedBy[n]?` <span class="pill acc-soft">👥 ${usedBy[n].size}</span>`:""}</b><span class="row" style="gap:6px"><a class="btn sm" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(n.toLowerCase()+" exercise proper form")}" title="بحث يوتيوب">🔎</a>${map[n]?`<button class="btn sm" data-play>▶</button>`:""}</span></div>
      <div class="row" style="margin-top:6px"><input class="grow" data-url placeholder="🎬 https://youtu.be/…" value="${esc(map[n]||"")}"></div>
      <div class="row" style="margin-top:6px"><input class="grow" data-alts placeholder="⇄ البدائل (افصل بفاصلة) – الافتراضي: ${esc((DEFAULT_ALTS[n]||[]).join("، ")||"لا يوجد")}" value="${esc((altMap[n]||[]).join(", "))}"><button class="btn sm primary" data-save>حفظ</button></div></div>`).join("")||emptyBox(f==="usedno"&&!q?"👌":"🔎",f==="usedno"&&!q?"كل تمارين عملائك ليها فيديو":"مفيش نتائج",f==="usedno"&&!q?"":"جرّب اسم تمرين تاني أو غيّر الفلتر.","","es-sm");
    $("#vl").querySelectorAll("[data-n]").forEach(r=>{ const n=r.dataset.n;
      r.querySelector("[data-save]").onclick=async()=>{ const url=r.querySelector("[data-url]").value.trim(), alts=r.querySelector("[data-alts]").value.split(/[,،]/).map(x=>x.trim().toUpperCase()).filter(Boolean);
        const { error } = (url||alts.length)? await sb.from("exercise_videos").upsert({name:n,video_url:url||null,alternatives:alts.length?alts:null,updated_at:new Date().toISOString()}) : await sb.from("exercise_videos").delete().eq("name",n);
        if(error) return toast(error.message); if(url) map[n]=url; else delete map[n]; altMap[n]=alts; await loadVideos(); toast("✓ اتحفظ"); draw(); };
      r.querySelector("[data-play]")&&(r.querySelector("[data-play]").onclick=()=>openVideo({name:n})); }); };
  $("#vq").oninput=draw; $("#vf").onchange=draw;
  $("#vAdd").onclick=()=>{ const n=$("#vNew").value.trim().toUpperCase(); if(!n) return; if(!all.includes(n)) all.unshift(n); $("#vq").value=n; $("#vNew").value=""; draw(); };
  draw();
}

/* ======================================================================
   COACH: FOODS
   ====================================================================== */
async function viewFoods(el){
  el.innerHTML=`<div class="card dark"><div class="card-h"><div class="ic">🍎</div><h2>قاعدة بيانات الأطعمة<small id="fc">خاصة – العملاء بيبحثوا فيها بس، مش بيشوفوها كاملة</small></h2></div></div>
    <div class="card"><input id="fq" placeholder="🔍 ابحث…"><div id="fl" style="margin-top:8px"></div></div>
    <div class="card"><div class="card-h"><div class="ic acc">➕</div><h2>صنف جديد<small>جم/مل: القيم لكل 100 · حبة/شريحة: اكتب قيم القطعة الواحدة</small></h2></div>
     <label class="f">الاسم<input id="fn"></label>
     <div class="grid3"><label class="f">الوحدة<select id="fu">${["جم","مل","حبة","شريحة","قطعة","كوب","ملعقة كبيرة","سكوب","رغيف"].map(u=>`<option>${u}</option>`).join("")}</select></label>
     <label class="f">سعرات<input id="fk" inputmode="decimal"></label><label class="f">بروتين<input id="fp" inputmode="decimal"></label>
     <label class="f">كارب<input id="fcb" inputmode="decimal"></label><label class="f">دهون<input id="ff" inputmode="decimal"></label></div>
     <div class="grid3">${[["sodium_mg","صوديوم (مجم)"],["potassium_mg","بوتاسيوم (مجم)"],["magnesium_mg","ماغنيسيوم (مجم)"],["iron_mg","حديد (مجم)"],["calcium_mg","كالسيوم (مجم)"],["zinc_mg","زنك (مجم)"],["fiber_g","ألياف (جم)"]].map(([k,l])=>`<label class="f">${l}<input data-fm="${k}" inputmode="decimal" placeholder="اختياري"></label>`).join("")}</div>
     <p class="hint" id="fuHint"></p><button class="btn primary block" id="fAdd">إضافة</button></div>`;
  const { count } = await sb.from("foods").select("id",{count:"exact",head:true}); $("#fc").textContent=fmt(count)+" صنف · خاصة – العملاء بيبحثوا فيها بس";
  const hint=()=>{ const u=$("#fu").value; $("#fuHint").innerHTML=COUNT_UNITS(u)?`<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="fone" checked style="width:auto;min-height:0"> القيم اللي كتبتها لـ ${u} واحدة</label>`:`القيم لكل 100 ${u}.`; };
  $("#fu").onchange=hint; hint();
  let timer; $("#fq").oninput=()=>{ clearTimeout(timer); timer=setTimeout(async()=>{
    const q=$("#fq").value.trim(); if(q.length<2){ $("#fl").innerHTML=""; return; }
    const { data } = await sb.from("foods").select("*").ilike("name",`%${q.replace(/[%_,()]/g," ")}%`).limit(40);
    $("#fl").innerHTML=(data||[]).map(f=>{ const u=unitInfo(f); return `<div class="food-r"><div class="fi">${u.cnt?"🍞":"⚖"}</div><div class="nm">${esc(f.name)}<small>${esc(f.category||"")} · ${u.base}: ${fmt(u.per.kcal)} kcal · ب ${fmt(u.per.P,1)} · ك ${fmt(u.per.C,1)} · د ${fmt(u.per.F,1)}${hasMinCols(f)&&hasMinData(f)?`<br>${MIN_KEYS.filter(([kk])=>f[kk]!=null).map(([kk,l,un,d])=>l.replace(/^\S+\s/,"")+" "+fmt(u.cnt?f[kk]/100:f[kk],d+(u.cnt?1:0))).join(" · ")}${f.mineral_source&&/تقدير/.test(f.mineral_source)?" (تقدير)":""}`:""}</small></div></div>`; }).join("")||emptyBox("🔎","مفيش نتايج","جرّب كلمة تانية، أو ضيف الصنف من زرار «صنف جديد».","","es-sm");
  },250); };
  $("#fAdd").onclick=async()=>{
    const k=$("#fone")?.checked?100:1;
    const rec={name:$("#fn").value.trim(),unit:$("#fu").value,kcal:(num($("#fk").value)||0)*k,protein:(num($("#fp").value)||0)*k,carbs:(num($("#fcb").value)||0)*k,fat:(num($("#ff").value)||0)*k,source:"الكوتش"};
    let anyMin=false; document.querySelectorAll("[data-fm]").forEach(i=>{ const x=num(i.value); if(x!=null){ rec[i.dataset.fm]=x*k; anyMin=true; } }); if(anyMin) rec.mineral_source="أدخله الكوتش";
    if(!rec.name) return toast("اكتب اسم الصنف");
    const { error } = await sb.from("foods").insert(rec); if(error) return toast(error.message); toast("✓ اتضاف"); viewFoods(el);
  };
}

boot();

/* coach-only notes live in coach_private (clients cannot read them) */
async function fillCoachNote(el,p){ const t=el.querySelector('[data-x="coach_notes"]'); if(!t) return; const { data } = await sb.from("coach_private").select("notes").eq("client_id",p.id).maybeSingle(); t.value=data?.notes||""; t.placeholder=""; }



/* Delete a client and ALL their data (auth user, profile, plans, check-ins, chat, photos). Two-step Arabic confirmation. */
function deleteClientFlow(c,done){
  if(!c) return;
  const nm=c.full_name||c.email||"العميل";
  const body=openSheet(`<div class="between"><b style="font-size:1.1rem">🗑 حذف العميل نهائياً</b><button class="btn sm ghost" data-close>✕</button></div>
    <div class="del-warn"><div class="del-ic">⚠️</div><p><b>${esc(nm)}</b></p>
    <p>هيتحذف الحساب وكل بياناته: البرامج، التسجيلات، الأكل، المتابعات، الصور، والشات.</p><p><b>مفيش رجوع.</b> لو محتاج نسخة، نزّل النسخة الاحتياطية الأول.</p></div>
    <label style="font-weight:700;display:block;margin:12px 0 6px">للتأكيد اكتب كلمة: حذف</label>
    <input id="delConf" autocomplete="off" placeholder="حذف">
    <div class="row" style="margin-top:12px"><button class="btn grow" type="button" data-close>إلغاء</button><button class="btn danger grow" type="button" id="delGo" disabled>🗑 احذف نهائياً</button></div>`);
  const inp=body.querySelector("#delConf"), go=body.querySelector("#delGo");
  inp.oninput=()=>{ go.disabled=inp.value.trim()!=="حذف"; };
  body.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeSheet());
  go.onclick=async()=>{
    if(inp.value.trim()!=="حذف") return; go.disabled=true; go.textContent="جاري الحذف…";
    const { data, error } = await adminCall({ body:{ action:"delete_client", user_id:c.id } });
    const msg=await fnErr(error,data);
    if(msg){ toast(msg); go.disabled=false; go.textContent="🗑 احذف نهائياً"; return; }
    closeSheet(); toast("✓ اتحذف "+nm+" وكل بياناته"); await done();
  };
}


/* ---------- check-in overview: all active clients at a glance (latest check-in, 5 ratings as dots, weight change) ---------- */
function ciTone(k,v){ if(v==null) return "na"; const bad=k==="stress"||k==="hunger"?v>=4:v<=2, good=k==="stress"||k==="hunger"?v<=2:v>=4; return bad?"bad":good?"good":"mid"; }
async function checkinOverviewCard(host,C){
  if(!host) return; const act=C.filter(c=>c.active); if(!act.length){ host.innerHTML=""; return; }
  const head=n=>`<div class="card-h"><div class="ic acc">📋</div><h2>متابعات العملاء<small>${n}</small></h2></div>`;
  host.innerHTML=head("بيحمّل…");
  const { data } = await sb.from("checkins").select("client_id,week,checkin_date,weight,energy,hunger,sleep,stress,adherence,reviewed_at").in("client_id",act.map(c=>c.id)).order("week",{ascending:false}).range(0,2999);
  const by={}; (data||[]).forEach(r=>(by[r.client_id]=by[r.client_id]||[]).push(r));
  const rows=act.map(c=>{ const L=by[c.id]||[], last=L[0], prev=L.find(r=>r.weight!=null&&last&&r.week<last.week&&last.weight!=null), wk=currentWeek(c), due=wk>1&&(!last||last.week<wk-1);
    const bad=last?["energy","sleep","adherence","stress","hunger"].filter(k=>ciTone(k,last[k])==="bad").length:0;
    return {c,last,wk,due,bad,dw:last&&prev?last.weight-prev.weight:null,score:(due?10:0)+bad*2+(last&&!last.reviewed_at?1:0)}; }).sort((a,b)=>b.score-a.score);
  const late=rows.filter(r=>r.due).length;
  host.innerHTML=head(late?late+" عميل متابعته ناقصة":"كله سلّم متابعته 👌")+rows.map(({c,last,wk,due,dw})=>`<div class="ciov-row" data-id="${c.id}"><div class="av">${initials(c)}</div>
    <div class="nm"><b>${esc(c.full_name||c.email)}</b><small>${seenHTML(c)}${last?`آخر متابعة: أسبوع ${last.week}${last.reviewed_at?"":" · مستنية ردك"}`:"لسه ما بعتش متابعة"}</small></div>
    <div class="ciov-dots" title="الطاقة · الجوع · النوم · التوتر · الالتزام">${last?["energy","hunger","sleep","stress","adherence"].map(k=>`<i class="d ${ciTone(k,last[k])}"></i>`).join(""):""}</div>
    <div class="ciov-w">${due?`<span class="pill acc-soft">ناقصة</span>`:dw==null?`<span class="muted">—</span>`:`<b class="num">${dw>0?"+":""}${fmt(dw,1)}</b>`}</div></div>`).join("");
  host.querySelectorAll("[data-id]").forEach(r=>r.onclick=async()=>{ const c=C.find(x=>x.id===r.dataset.id); await openClient(c); S.tab="body"; S.bodySeg="c"; S.ciWeek=Math.max(1,(by[c.id]?.[0]?.week)||currentWeek(c)); render(); window.scrollTo(0,0); });
}

/* ---------- last seen: "online now" / "last active X ago" from profiles.last_active_at (written by touchActive in core.js) ---------- */
function seenHTML(c){
  if(!c||!c.last_active_at) return "";
  const m=Math.max(0,Math.round((Date.now()-new Date(c.last_active_at).getTime())/6e4));
  if(m<5) return `<span class="seen on"><i></i>أونلاين دلوقتي</span> · `;
  const t=m<60?m+" د":m<1440?Math.floor(m/60)+" س":Math.floor(m/1440)+" يوم";
  return `<span class="seen${m>=4320?" cold":""}"><i></i>آخر ظهور من ${t}</span> · `;
}
