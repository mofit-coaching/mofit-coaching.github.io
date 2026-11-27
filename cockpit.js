/* ======================================================================
   COACH COCKPIT (الرادار) — one coach-only screen: every client's payment
   and activity status, what changed this week, and the one action to take.
   - Additive: own tab on the coach home, wraps tabs() and viewHome the same
     way inbox.js does. Clients never see it (guard: coach && !S.client).
   - Read-only, except the inline تفعيل approval (same action the inbox has).
   - Every number comes from a real source: profiles + coach_overview RPC
     (loadClients), health_screens, client_events, CHAT.unread, and ONE
     bounded set_logs query for this week vs last week. No invented stats.
   ====================================================================== */
ICON.cockpit='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6.4-6.4"/><circle cx="15.6" cy="15.6" r="1.1" fill="currentColor" stroke="none"/></svg>';

(function(){
  const css=`
  .ckp-sum .stat{cursor:pointer}
  .ckp-sum .stat.on{outline:2px solid var(--acc,#F97316);outline-offset:-2px}
  .ckp-line{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:4px}
  .ckp-line .pill{white-space:nowrap}
  .ckp-seen{font-size:.72rem;opacity:.75;margin-top:2px;display:block}
  .ckp-alerts{margin-top:4px}
  .ckp-wk{font-size:.75rem;font-weight:700;margin-top:4px;opacity:.85}
  .ckp-sec{margin:14px 0 6px;font-weight:800;font-size:.85rem;opacity:.8}
  `;
  const st=document.createElement("style"); st.id="ckpCss"; st.textContent=css; document.head.appendChild(st);
})();

/* tab: الرادار sits right after الوارد on the coach home */
(function(){ const _t=tabs;
  tabs=function(){ const t=_t();
    if(S.me&&S.me.role==="coach"&&!S.client&&!t.some(x=>x[0]==="cockpit")){
      const i=t.findIndex(x=>x[0]==="inbox"); t.splice(i>=0?i+1:Math.min(1,t.length),0,["cockpit","الرادار"]);
    }
    return t; };
})();
/* route: render() falls back to viewHome for unknown tabs, so wrap it like inbox.js */
(function(){ const _v=viewHome;
  viewHome=async function(el){
    if(typeof S!=="undefined"&&S.me&&S.me.role==="coach"&&!S.client&&S.tab==="cockpit") return viewCockpit(el);
    return _v.apply(this,arguments);
  };
})();

/* per-client alerts: same sources as the inbox (clientAlerts + health + events + rate + chat + approval) */
function ckpRows(){
  const C=S.coachClients||[];
  return C.map(c=>{
    const o=S.overview?.[c.id];
    const a=clientAlerts(c,o); const h=healthAlert(c); if(h) a.push(h); a.push(...eventAlerts(c)); const r=rateAlert(c); if(r) a.push(r);
    const un=(typeof CHAT!=="undefined"&&CHAT.unread?.[c.id])||0;
    if(un) a.unshift({p:4,icon:"💬",text:`${un} رسالة جديدة`,kind:"chat"});
    if(!c.active) a.unshift({p:5,icon:"🆕",text:"طلب انضمام مستني موافقتك",kind:"approve"});
    a.sort((x,y)=>y.p-x.p);
    /* money first: unpaid or expired always lands in the red bucket, even at p1 */
    const money=a.some(x=>/غير مدفوع|الاشتراك انتهى/.test(x.text));
    const bucket=!c.active?"new":(money||(a.length&&a[0].p>=3))?"red":a.length?"yellow":"green";
    return {c,o,a,un,bucket};
  }).sort((x,y)=>(y.a[0]?.p||0)-(x.a[0]?.p||0)||y.a.length-x.a.length);
}

/* the ONE action for a client, derived from the top alert */
function ckpAction(r){
  const {c,a,un,o}=r, top=a[0];
  if(!top) return {k:"open",label:"👤 الملف",cls:"navy"};
  if(top.kind==="approve") return {k:"approve",label:"✅ فعّل",cls:"primary"};
  if(un) return {k:"chat",label:`💬 رد (${un})`,cls:"primary"};
  if(/مستنية ردك/.test(top.text)) return {k:"checkin",label:"📝 رد على المتابعة",cls:"primary"};
  if(/اشتراك|مدفوع/.test(top.text)) return {k:"renew",label:"💳 جدّد",cls:"primary"};
  if(/البلوك|تجديد التمارين|راجع البرنامج/.test(top.text)) return {k:"program",label:"🔁 راجع البرنامج",cls:"primary"};
  if(/مفيش تسجيل|مفيش تمرين|عميل جديد/.test(top.text)) return {k:"nudge",label:"💬 كلّمه",cls:"primary"};
  return {k:"open",label:"👤 الملف",cls:"navy"};
}

function ckpRow(r,W){
  const {c,o,a,bucket}=r, wk=currentWeek(c), sub=subStatus(c), ws=W[c.id], act=ckpAction(r);
  const chips=[];
  chips.push(sub?`<span class="pill ${sub.cls==="good"?"":"acc"}">${sub.icon} ${esc(sub.text)}</span>`:`<span class="pill" style="opacity:.7">💳 بدون اشتراك مسجّل</span>`);
  if(c.active&&ws) chips.push(`<span class="pill">🏋 ${ws.cur} مجموعة${ws.prev!==null?(ws.cur>ws.prev?` ▲${ws.cur-ws.prev}`:ws.cur<ws.prev?` ▼${ws.prev-ws.cur}`:" ="):""}</span>`);
  if(o?.adherence7!=null) chips.push(`<span class="pill ${+o.adherence7<0.7?"acc":""}">🎯 ${pct(o.adherence7)}</span>`);
  const WT=o?.weights||[]; if(WT.length>=2){ const d=WT[WT.length-1][1]-WT[WT.length-2][1]; chips.push(`<span class="pill">⚖ ${d>0?"▲ +":d<0?"▼ ":""}${fmt(d,1)} كجم</span>`); }
  if(c.active&&wk>1&&o&&(o.last_checkin_week||0)>=wk) chips.push(`<span class="pill">📸 بعت متابعة الأسبوع</span>`);
  return `<div class="inb ckp" data-id="${c.id}" data-b="${bucket}">
    <div class="inb-h"><div class="av">${initials(c)}</div><div class="nm"><b>${esc(c.full_name||c.email)}</b>
      <small>${c.active?`أسبوع ${wk}${c.goal?" · "+esc(c.goal):""}`:`طلب جديد${c.phone?" · 📱 "+esc(c.phone):""}${c.signup_plan?" · 💰 "+esc(c.signup_plan):""}`}</small>
      ${c.active?`<span class="ckp-seen">${seenSpan(c)}</span>`:""}
      <div class="ckp-line">${chips.join("")}</div>
      ${a.length?`<div class="ckp-alerts">${a.slice(0,2).map(x=>`<span class="pill ${x.p>=3?"acc":x.p==2?"acc-soft":""}">${x.icon} ${esc(x.text)}</span>`).join(" ")}${a.length>2?`<span class="pill">+${a.length-2}</span>`:""}</div>`:`<div class="ckp-alerts"><span class="pill">✅ مفيش ملاحظات</span></div>`}
    </div></div>
    <div class="inb-a">
      <button class="btn sm ${act.cls}" data-a="${act.k}">${act.label}</button>
      ${act.k!=="open"?`<button class="btn sm navy" data-a="open">👤 الملف</button>`:""}
      ${c.phone?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(remindLink(c,a[0]||{text:"متابعة"}))}">📲 واتساب</a>`:""}
    </div></div>`;
}

async function viewCockpit(el){
  const C=S.coachClients||[];
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic acc">📡</div><h2>رادار الكوتش<small>بيحمّل…</small></h2></div><p class="hint">بيحمّل حركة الأسبوع…</p></div>`;
  /* this week vs last week, one bounded query (same pattern as the weekly report card) */
  const act=C.filter(c=>c.active), W={};
  if(act.length){
    const minW=Math.min(...act.map(c=>currentWeek(c)));
    const { data } = await sb.from("set_logs").select("client_id,week,reps,weight").gte("week",Math.max(1,minW-1)).range(0,9999);
    act.forEach(c=>{ const wk=currentWeek(c), L=(data||[]).filter(s=>s.client_id===c.id&&logged(s));
      W[c.id]={cur:L.filter(s=>s.week===wk).length, prev:wk>1?L.filter(s=>s.week===wk-1).length:null}; });
  }
  const R=ckpRows();
  const N={red:R.filter(r=>r.bucket==="red").length, yellow:R.filter(r=>r.bucket==="yellow").length, green:R.filter(r=>r.bucket==="green").length, new:R.filter(r=>r.bucket==="new").length};
  const subs=C.filter(c=>{ const s=subStatus(c); return s&&s.cls!=="good"; }).length;
  const un=(typeof CHAT!=="undefined"?Object.values(CHAT.unread||{}):[]).reduce((a,b)=>a+b,0);
  const F=S._ckpF||"all";
  const SECS=[["new","🆕 طلبات جديدة"],["red","🔴 محتاجك دلوقتي"],["yellow","🟡 تحت المتابعة"],["green","🟢 على المسار"]];
  const show=r=>F==="all"||r.bucket===F;
  el.innerHTML=`<div class="grid3 inbst ckp-sum" style="margin-bottom:6px">
      <div class="stat acc" data-f="red"><div class="l">🔴 محتاجك</div><div class="v num">${N.red}</div><div class="s">${un?un+" رسالة جديدة":"رد فوري"}</div></div>
      <div class="stat" data-f="yellow"><div class="l">🟡 متابعة</div><div class="v num">${N.yellow}</div><div class="s">${subs} اشتراك محتاج نظرة</div></div>
      <div class="stat dark" data-f="green"><div class="l">🟢 على المسار</div><div class="v num">${N.green}</div><div class="s">من ${C.length} عميل</div></div></div>
    <div class="qr-row" id="ckpF" role="group" aria-label="فلتر الرادار" style="display:flex;gap:6px;overflow-x:auto;margin-bottom:8px;padding-bottom:2px">
      ${[["all","الكل ("+R.length+")"],["red","🔴 محتاجك ("+N.red+")"],["yellow","🟡 متابعة ("+N.yellow+")"],["green","🟢 مسار ("+N.green+")"],["new","🆕 طلبات ("+N.new+")"]].map(([k,l])=>`<button class="chip ${F===k?"on":""}" data-f="${k}">${l}</button>`).join("")}
    </div>
    <div class="card"><div class="card-h"><div class="ic acc">📡</div><h2>رادار الكوتش<small>كل عميل: اشتراكه ونشاطه وتغيّر أسبوعه والخطوة الجاية · آخر تحديث ${new Date().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</small></h2><button class="btn sm" id="ckpRe" title="تحديث البيانات">🔄</button></div>
      ${R.length?SECS.map(([b,t])=>{ const rows=R.filter(r=>r.bucket===b&&show(r)); return rows.length?`<div class="ckp-sec">${t} (${rows.length})</div>`+rows.map(r=>ckpRow(r,W)).join(""):""; }).join(""):`<p class="hint">مفيش عملاء لسه — أول ما حد يسجّل هيظهر هنا.</p>`}
    </div>
    <p class="hint" style="margin-top:8px">الأرقام كلها من بيانات العملاء نفسها: الاشتراك من ملفه، الالتزام والوزن وآخر نشاط من سجلّاته، والمجموعات من تسجيل التمرين. مفيش رقم متخمَّن.</p>`;
  const re=$("#ckpRe"); if(re) re.onclick=async()=>{ re.disabled=true; await loadClients(); viewCockpit(el); };
  el.querySelector(".ckp-sum").querySelectorAll("[data-f]").forEach(s=>s.onclick=()=>{ S._ckpF=S._ckpF===s.dataset.f?"all":s.dataset.f; viewCockpit(el); });
  $("#ckpF").querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{ S._ckpF=b.dataset.f; viewCockpit(el); });
  el.querySelectorAll(".inb.ckp").forEach(row=>{
    const r=R.find(x=>x.c.id===row.dataset.id); if(!r) return; const c=r.c;
    row.querySelectorAll("[data-a]").forEach(b=>b.onclick=async e=>{
      e.stopPropagation(); const k=b.dataset.a;
      if(k==="approve"){ b.disabled=true; const { error } = await sb.from("profiles").update({active:true}).eq("id",c.id);
        if(error){ b.disabled=false; return toast("تعذر التفعيل"); } c.active=true; burst(); toast("✅ اتفعّل"); viewCockpit(el); }
      else if(k==="chat") openChat(c.id,c.full_name||"العميل");
      else if(k==="nudge") nudgeClient(c,r.a[0],b);
      else if(k==="renew"){ const s=subStatus(c); window.open(remindLink(c,{text:s?s.text:"اشتراك"}),"_blank","noopener"); }
      else if(k==="checkin"){ await openClient(c); S.ciWeek=r.o?.last_checkin_week||Math.max(1,currentWeek(c)-1); S.tab="hub"; render(); window.scrollTo(0,0); }
      else if(k==="program"){ await openClient(c); S.tab="setup"; S.setupTab="program"; render(); window.scrollTo(0,0); }
      else { await openClient(c); S.tab="hub"; render(); window.scrollTo(0,0); }
    });
  });
}
