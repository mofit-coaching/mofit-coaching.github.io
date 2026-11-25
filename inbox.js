/* ======================================================================
   Mofit v5.7 — coach inbox + per-client hub
   - Coach home gets an "الوارد" tab: everyone who needs you, one-tap actions.
   - Every client opened by the coach gets a "ملف العميل" tab: chat, check-in,
     subscription, streak and plan in one place.
   ====================================================================== */
ICON.inbox='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l2.5-7.2A2 2 0 0 1 7.4 4.5h9.2a2 2 0 0 1 1.9 1.3L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/></svg>';
ICON.hub='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"/></svg>';

const _tabsBase=tabs;
tabs=function(){
  const t=_tabsBase();
  if(S.me.role!=="coach") return t;
  if(!S.client) return [["inbox","الوارد"],...t];
  return [["hub","الملف"],...t];
};
const _viewHomeBase=viewHome;
viewHome=async function(el){
  if(S.me.role==="coach" && !S.client && S.tab==="inbox") return viewInbox(el);
  if(S.me.role==="coach" && S.client && S.tab==="hub") return viewHub(el);
  return _viewHomeBase(el);
};
/* coach lands on the inbox first */
(function(){ const _l=loadClients; loadClients=async function(){ await _l.apply(this,arguments); if(S.me?.role==="coach" && !S.client && !S._inboxSeen){ S._inboxSeen=1; S.tab="inbox"; } }; })();
/* opening a client from anywhere lands on their hub */
(function(){ const _o=openClient; openClient=async function(p){ const prev=S.client?.id; const r=await _o.apply(this,arguments); if(S.me?.role==="coach"&&S.client&&S.client.id!==prev){ S._hubNext=1; } return r; }; })();
(function(){ const _r=render; render=function(){ if(S._hubNext){ S._hubNext=0; if(S.me?.role==="coach"&&S.client&&S.tab==="home") S.tab="hub"; } return _r.apply(this,arguments); }; })();

function inboxItems(){
  const C=S.coachClients||[], out=[];
  C.forEach(c=>{
    const o=S.overview?.[c.id], a=clientAlerts(c,o); const h=healthAlert(c); if(h) a.push(h); a.push(...eventAlerts(c)); const r=rateAlert(c); if(r) a.push(r);
    const un=(CHAT.unread[c.id]||0); if(un) a.unshift({p:4,icon:"💬",text:`${un} رسالة جديدة`,kind:"chat"});
    if(!c.active) a.unshift({p:5,icon:"🆕",text:"طلب انضمام مستني موافقتك",kind:"approve"});
    if(a.length) out.push({c,a:a.sort((x,y)=>y.p-x.p)});
  });
  return out.sort((x,y)=>y.a[0].p-x.a[0].p||y.a.length-x.a.length);
}
function inboxRow(it){
  const {c,a}=it, top=a[0], sub=subStatus(c), needRenew=a.some(x=>/اشتراك|مدفوع/.test(x.text));
  return `<div class="inb" data-id="${c.id}"><div class="inb-h"><div class="av">${initials(c)}</div><div class="nm"><b>${esc(c.full_name||c.email)}</b>
      <div>${a.slice(0,4).map(x=>`<span class="pill ${x.p>=3?"acc":x.p==2?"acc-soft":""}">${x.icon} ${esc(x.text)}</span>`).join(" ")}</div></div></div>
    <div class="inb-a">
      <button class="btn sm primary" data-a="chat">💬 رد</button>
      ${c.phone?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(remindLink(c,top))}">📲 واتساب</a>`:""}
      ${needRenew?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(remindLink(c,{text:sub?sub.text:"اشتراك"}))}">💳 جدّد</a>`:""}
      ${top.kind==="approve"?`<button class="btn sm" data-a="approve">✅ فعّل</button>`:""}
      <button class="btn sm navy" data-a="open">👤 الملف</button></div></div>`;
}
/* broadcast: one chat message from the coach to a chosen group of ACTIVE clients */
function bcastList(seg){ const C=(S.coachClients||[]).filter(c=>c.active); return seg==="sub"?C.filter(c=>{ const s=subStatus(c); return s&&s.cls!=="good"; }):C; }
async function bcastSend(list,text){
  const rows=list.map(c=>({client_id:c.id,sender_role:"coach",body:text}));
  let ok=0; for(let i=0;i<rows.length;i+=20){ const { error } = await sb.from("messages").insert(rows.slice(i,i+20)); if(error) return {ok,error}; ok+=rows.slice(i,i+20).length; }
  return {ok};
}
function bcastCard(host){
  host.innerHTML=`<div class="card-h"><div class="ic acc">📢</div><h2>رسالة جماعية<small>رسالة واحدة في شات كل عميل</small></h2></div>
    <label class="f">لمين<select id="bcSeg"><option value="all">كل العملاء المفعّلين</option><option value="sub">اللي اشتراكهم قرّب يخلص أو خلص</option></select></label>
    <label class="f">الرسالة<textarea id="bcTxt" rows="3" maxlength="500" placeholder="مثال: بكرة يوم الوزن، سجّلوا وزنكم الصبح"></textarea></label>
    <button class="btn navy block" id="bcGo">إرسال</button>`;
  const go=host.querySelector("#bcGo");
  go.onclick=async()=>{ const seg=host.querySelector("#bcSeg").value, txt=host.querySelector("#bcTxt").value.trim(); if(!txt) return toast("اكتب الرسالة الأول"); const list=bcastList(seg); if(!list.length) return toast("مفيش عملاء في الفئة دي");
    if(!confirm(`هتتبعت الرسالة دي لـ ${list.length} عميل:\n\n${txt}\n\nمتأكد؟`)) return;
    go.disabled=true; const r=await bcastSend(list,txt); go.disabled=false;
    if(r.error) return toast(`اتبعتت لـ ${r.ok} بس، حصلت مشكلة: ${r.error.message}`);
    host.querySelector("#bcTxt").value=""; toast(`✓ اتبعتت لـ ${r.ok} عميل`); };
}
async function viewInbox(el){
  const items=inboxItems(), C=S.coachClients||[];
  const pend=C.filter(c=>!c.active).length, subs=C.filter(c=>{ const s=subStatus(c); return s&&s.cls!=="good"; }).length, un=Object.values(CHAT.unread).reduce((a,b)=>a+b,0);
  el.innerHTML=`<div class="grid3 inbst" style="margin-bottom:14px"><div class="stat acc"><div class="l">💬 رسائل</div><div class="v num">${un}</div></div>
    <div class="stat"><div class="l">💳 اشتراكات</div><div class="v num">${subs}</div></div><div class="stat dark"><div class="l">🆕 طلبات</div><div class="v num">${pend}</div></div></div>
    <div class="card"><div class="card-h"><div class="ic acc">📥</div><h2>الوارد<small>${items.length?items.length+" عميل محتاجك":"كله تمام 👌 مفيش حاجة مستنية"}</small></h2></div><div id="inbL">${items.map(inboxRow).join("")}</div></div>
    <div class="card" id="inbStp"></div>
    <div class="card" id="bcast"></div>
    <button class="btn block" id="inbAll">👥 كل العملاء</button>`;
  bcastCard($("#bcast"));
  $("#inbAll").onclick=()=>{ S.tab="clients"; render(); };
  window.stepsCoachCard&&window.stepsCoachCard($("#inbStp"),C);
  $("#inbL").onclick=async e=>{ const b=e.target.closest("[data-a]"), row=e.target.closest(".inb"); if(!b||!row) return; const c=C.find(x=>x.id===row.dataset.id);
    if(b.dataset.a==="chat") openChat(c.id,c.full_name||"العميل");
    else if(b.dataset.a==="open"){ await openClient(c); S.tab="hub"; render(); window.scrollTo(0,0); }
    else if(b.dataset.a==="approve"){ b.disabled=true; const { error } = await sb.from("profiles").update({active:true}).eq("id",c.id); if(error){ b.disabled=false; return toast("تعذر التفعيل"); } c.active=true; burst(); toast("✅ اتفعّل"); viewInbox(el); } };
}

async function viewHub(el){
  const c=S.client, o=S.overview?.[c.id]||{}, sub=subStatus(c), wk=currentWeek(c), un=CHAT.unread[c.id]||0;
  el.innerHTML=`<div class="card hub"><div class="card-h"><div class="ic acc">👤</div><h2>${esc(c.full_name||c.email)}<small>${esc(c.email||"")}${c.phone?" · "+esc(c.phone):""}</small></h2>${c.active?`<span class="pill acc">مفعّل</span>`:`<span class="pill">مستني التفعيل</span>`}</div>
      <div class="inb-a"><button class="btn sm primary" id="hbChat">💬 محادثة${un?` (${un})`:""}</button>${c.phone?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(remindLink(c,{text:"متابعة"}))}">📲 واتساب</a>`:""}<button class="btn sm" id="hbSet">⚙ التحكم</button></div></div>
    <div class="grid2"><div class="stat ${sub&&sub.cls!=="good"?"acc":""}"><div class="l">💳 الاشتراك</div><div class="v" style="font-size:1rem">${sub?sub.icon+" "+esc(sub.text):"—"}</div><div class="s">${c.sub_end?"ينتهي "+esc(c.sub_end):""}</div></div>
      <div class="stat"><div class="l">📅 الأسبوع</div><div class="v num">${wk}</div><div class="s">بلوك ${blockOf(wk)} · ${wInBlock(wk)}/12</div></div></div>
    <div id="hbSteps"></div>
    <div class="card" id="hbStreak"><p class="muted">جارٍ التحميل…</p></div>
    <div class="card"><div class="card-h"><div class="ic">📸</div><h2>المتابعة الأسبوعية<small>${o.last_checkin_week?"آخر متابعة: أسبوع "+o.last_checkin_week:"مفيش متابعات لسه"}${o.unreviewed?" · "+o.unreviewed+" مستنية ردك":""}</small></h2></div>
      <button class="btn block ${o.unreviewed?"primary":""}" id="hbCI">${o.unreviewed?"راجع وردّ":"افتح المتابعات"}</button></div>
    <div class="card"><div class="card-h"><div class="ic">🏋</div><h2>البرنامج<small>${esc(c.split_name||"بدون برنامج")}${c.level?" · "+esc(c.level):""} · ${esc(c.goal||"")}</small></h2></div>
      <div class="inb-a"><button class="btn sm" id="hbTr">التمرين</button><button class="btn sm" id="hbFd">التغذية</button><button class="btn sm" id="hbBd">التقدم</button></div></div>
    <div class="card" id="hbMsgs"><div class="card-h"><div class="ic acc">💬</div><h2>آخر الرسايل</h2></div><p class="muted">جارٍ التحميل…</p></div>`;
  window.stepsClientCard&&window.stepsClientCard($("#hbSteps"),c,"خطوات العميل");
  const go=(t,seg)=>()=>{ S.tab=t; if(seg) S.bodySeg=seg; render(); window.scrollTo(0,0); };
  $("#hbChat").onclick=()=>openChat(c.id,c.full_name||"العميل"); $("#hbSet").onclick=go("setup"); $("#hbTr").onclick=go("train"); $("#hbFd").onclick=go("food"); $("#hbBd").onclick=go("body");
  $("#hbCI").onclick=()=>{ S.ciWeek=o.last_checkin_week||Math.max(1,wk-1); go("body","c")(); };
  const [ws,ms]=await Promise.all([ sb.from("workout_sessions").select("week").eq("client_id",c.id), sb.from("messages").select("sender_role,body,created_at").eq("client_id",c.id).order("created_at",{ascending:false}).limit(3) ]);
  if(!$("#hbStreak")) return;
  const W=ws.data||[], cnt={}; W.forEach(s=>cnt[s.week]=(cnt[s.week]||0)+1);
  const goal=Math.max(1,new Set((S.program||[]).map(e=>e.day_no)).size||3), done=cnt[wk]||0; let st=0, w=done>=goal?wk:wk-1; while(w>=1&&(cnt[w]||0)>=goal){ st++; w--; }
  $("#hbStreak").innerHTML=`<div class="card-h"><div class="ic acc">🔥</div><h2>الالتزام<small>${W.length} تمرين متسجّل · ${st?st+" أسبوع متتالي":"لسه مفيش سلسلة"}</small></h2></div>
    <div class="bar"><i style="width:${Math.min(100,done/goal*100)}%"></i></div><p class="hint" style="margin:6px 0 0">الأسبوع ده: ${done} من ${goal} تمارين</p>`;
  const M=(ms.data||[]).reverse(); $("#hbMsgs").innerHTML=`<div class="card-h"><div class="ic acc">💬</div><h2>آخر الرسايل</h2></div>`+(M.length?M.map(m=>`<div class="hbm ${m.sender_role==="coach"?"me":""}">${esc(m.body)}</div>`).join(""):emptyBox("💬","مفيش رسايل لسه","أول رسالة بينك وبين الكوتش هتظهر هنا.","","es-sm"));
}
(function(){ const s=document.createElement("style"); s.textContent=`
.inbst{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px}.inbst .stat{padding:12px 10px}.inb-a a.btn{text-decoration:none;color:inherit;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.inb{padding:12px 0;border-top:1px solid rgba(11,18,32,.07)}.inb:first-child{border-top:0}
.inb-h{display:flex;gap:10px;align-items:center}.inb-h .nm{flex:1;min-width:0}.inb-h .pill{margin:3px 3px 0 0}
.inb-a{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.inb-a .btn{flex:1 1 auto;text-align:center}
.inb{animation:inbin .55s cubic-bezier(.2,1.2,.4,1) both}.inb:nth-child(2){animation-delay:.08s}.inb:nth-child(3){animation-delay:.16s}.inb:nth-child(4){animation-delay:.24s}.inb:nth-child(n+5){animation-delay:.3s}
@keyframes inbin{from{opacity:0;transform:translateX(-36px)}to{opacity:1;transform:none}}
.inb .pill.acc{animation:glowp 2.4s ease-in-out infinite}
.hbm{padding:8px 12px;margin:6px 0;border-radius:14px;background:#F1F3F7;max-width:88%;font-size:.88rem}.hbm.me{background:#FFE9DA;margin-right:auto}
@media(prefers-reduced-motion:reduce){.inb,.inb .pill.acc{animation:none!important}}`; document.head.appendChild(s); })();

/* keep the inbox fresh when a message arrives or the chat sheet closes */
(function(){ const _i=chatIncoming; chatIncoming=function(m){ _i.apply(this,arguments); if(S.me?.role==="coach"&&!S.client&&S.tab==="inbox"){ try{ render(); }catch(e){} } };
  const _c=closeSheet; closeSheet=function(){ _c.apply(this,arguments); if(S.me?.role==="coach"&&!S.client&&S.tab==="inbox"){ try{ render(); }catch(e){} } }; })();
