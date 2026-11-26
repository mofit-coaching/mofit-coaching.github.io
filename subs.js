/* ======================================================================
   MOFIT coach "الاشتراكات" tab (sb-*): كل اشتراكات العملاء في شاشة واحدة.
   - مين دفع ومين لسه، تاريخ التجديد، وفكّرني واتساب بضغطة واحدة.
   - Self-contained: own CSS, no edits to other files. Reads S.coachClients
     (profiles.sub_* - the same fields the coach fills from ملف العميل ←
     التحكم ← بيانات العميل). No new tables, no price/plan changes.
   - Writes ONLY profiles.sub_paid (the مدفوع toggle) - nothing else.
   - Deep link: ./?tab=subs lands here (the coach digest push uses it).
   ====================================================================== */
(function(){
const CSS=`
.sb-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:14px}
.sb-stats .stat{padding:10px 8px;text-align:center}
.sb-stats .stat .v{font-size:1.3rem}
.sb-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:none}
.sb-chips::-webkit-scrollbar{display:none}
.sb-chips .chip{flex:0 0 auto}
.sb-row{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--soft);animation:inbin .55s cubic-bezier(.2,1.2,.4,1) both}
.sb-row:first-child{border-top:0}
.sb-row:nth-child(2){animation-delay:.07s}.sb-row:nth-child(3){animation-delay:.14s}.sb-row:nth-child(4){animation-delay:.21s}.sb-row:nth-child(n+5){animation-delay:.28s}
.sb-mid{flex:1;min-width:0}
.sb-mid b{display:block;font-size:.95rem}
.sb-mid small{display:block;color:var(--slate);font-size:.76rem;line-height:1.6}
.sb-side{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:0 0 auto}
.sb-pill{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:3px 10px;font-size:.74rem;font-weight:800;white-space:nowrap}
.sb-pill.good{background:var(--good-soft);color:var(--good)}
.sb-pill.warn{background:var(--acc-soft);color:#C2410C}
.sb-pill.bad{background:var(--bad-soft);color:var(--bad)}
.sb-pill.none{background:var(--soft2);color:var(--slate)}
@media (prefers-color-scheme: dark){.sb-pill.warn{color:#FFB35C}}
.sb-paid{border:1.5px solid var(--soft);background:var(--card);border-radius:99px;padding:3px 10px;font-size:.74rem;font-weight:800;color:var(--slate);cursor:pointer;white-space:nowrap}
.sb-paid.on{border-color:var(--good);color:var(--good);background:var(--good-soft)}
.sb-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.sb-acts .btn{flex:1 1 auto;text-align:center;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.sb-days{font-variant-numeric:tabular-nums}
@media (max-width:380px){.sb-stats{grid-template-columns:repeat(2,1fr)}}
`;
const style=document.createElement("style"); style.textContent=CSS; document.head.appendChild(style);

ICON.subs='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>';

/* nav: the tab goes right after الوارد on the coach home */
const _tabsSubs=tabs;
tabs=function(){
  const t=_tabsSubs();
  if(!S.me||S.me.role!=="coach"||S.client) return t;
  const out=t.slice(); out.splice(1,0,["subs","الاشتراكات"]); return out;
};

/* routing: unknown tabs fall back to viewHome - hook it like inbox does */
const _viewHomeSubs=viewHome;
viewHome=async function(el){
  if(S.me&&S.me.role==="coach"&&!S.client&&S.tab==="subs") return viewSubs(el);
  return _viewHomeSubs(el);
};

/* deep link ./?tab=subs (coach digest push) */
(function(){ const _l=loadClients; loadClients=async function(){
  await _l.apply(this,arguments);
  if(S.me&&S.me.role==="coach"&&!S.client&&!S._subsDeep){
    S._subsDeep=1;
    if(new URLSearchParams(location.search).get("tab")==="subs"){ S.tab="subs"; }
  }
}; })();

const dFmt=v=>{ try{ return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long"}).format(new Date(v+"T00:00:00")); }catch(e){ return v; } };

function sbRow(c){
  const s=subStatus(c);                     // null when no sub data at all
  const left=s&&s.left!=null?s.left:null;
  const cls=!s?"none":s.cls;
  const rank=cls==="bad"?0:(cls==="warn"?1:(cls==="good"?2:3));
  return {c,s,left,cls,paid:!!c.sub_paid,rank};
}

function sbRowHTML(r){
  const c=r.c, s=r.s;
  const name=esc(c.full_name||c.email||"عميل");
  const plan=c.sub_plan?esc(c.sub_plan):"بدون باقة";
  const price=c.sub_price?` · ${fmt(c.sub_price)} ج.م`:"";
  const dates=c.sub_start||c.sub_end
    ?`${c.sub_start?dFmt(c.sub_start):"؟"} ← ${c.sub_end?dFmt(c.sub_end):"مفتوح"}`
    :"الاشتراك مش مسجّل لسه";
  const pill=r.cls==="none"
    ?`<span class="sb-pill none">—</span>`
    :`<span class="sb-pill ${r.cls}">${s.icon} ${esc(s.text)}</span>`;
  const phone=normPhone(c.phone);
  const wa=phone?`<a class="btn sm" target="_blank" rel="noopener" href="${esc(remindLink(c,{text:s?s.text:"الاشتراك"}))}">📲 فكّره واتساب</a>`:"";
  return `<div class="sb-row" data-id="${c.id}">
    <div class="av">${initials(c)}</div>
    <div class="sb-mid"><b>${name}${c.active?"":' <span class="pill">غير مفعّل</span>'}</b>
      <small>${plan}${price}</small>
      <small>${dates}</small>
      <div class="sb-acts">
        <button class="sb-paid ${r.paid?"on":""}" data-paid>${r.paid?"✓ مدفوع":"غير مدفوع"}</button>
        ${wa}
        <button class="btn sm navy" data-open>⚙ سجّل / عدّل</button>
      </div></div>
    <div class="sb-side">${pill}</div>
  </div>`;
}

async function viewSubs(el){
  const C=(S.coachClients||[]).map(sbRow)
    .sort((a,b)=>a.rank-b.rank||((a.left==null?99999:a.left)-(b.left==null?99999:b.left)));
  const withSub=C.filter(r=>r.cls!=="none");
  const good=withSub.filter(r=>r.cls==="good").length;
  const warn=withSub.filter(r=>r.cls==="warn"&&r.paid).length;
  const bad=withSub.filter(r=>r.cls==="bad").length;
  const unpaid=withSub.filter(r=>!r.paid).length;

  const fil=S._subsFil||"all";
  const FILS=[["all","الكل"],["due","محتاج تجديد"],["unpaid","غير مدفوع"],["ok","ساري"]];
  const shown=C.filter(r=>
    fil==="due" ? (r.cls==="warn"||r.cls==="bad") :
    fil==="unpaid" ? (!r.paid&&r.cls!=="none") :
    fil==="ok" ? r.cls==="good" : true);

  el.innerHTML=`
  <div class="sb-stats">
    <div class="stat"><div class="l">✅ ساري</div><div class="v num" style="color:var(--good)">${good}</div></div>
    <div class="stat"><div class="l">💳 بينتهي قريب</div><div class="v num" style="color:var(--acc)">${warn}</div></div>
    <div class="stat"><div class="l">⛔ منتهي</div><div class="v num" style="color:var(--bad)">${bad}</div></div>
    <div class="stat"><div class="l">💰 غير مدفوع</div><div class="v num">${unpaid}</div></div>
  </div>
  <div class="card">
    <div class="card-h"><div class="ic acc">💳</div><h2>الاشتراكات<small>${withSub.length} مسجّل من ${C.length} عميل</small></h2>
      <button class="ibtn" id="sbRef" title="تحديث">↻</button></div>
    <div class="sb-chips">${FILS.map(([k,l])=>`<button class="chip ${fil===k?"on":""}" data-fil="${k}">${l}</button>`).join("")}</div>
    <div id="sbL">${shown.length?shown.map(sbRowHTML).join(""):emptyBox("💳","مفيش اشتراكات هنا","سجّل اشتراك كل عميل من ملفه ← التحكم ← بيانات العميل، وهيظهر هنا أول بأول.","","es-sm")}</div>
  </div>
  <p class="hint" style="text-align:center;margin-top:10px">العلامة ✓ مدفوع بتتسجل بضغطة، وزرار واتساب بيفتح رسالة تذكير جاهزة باسم العميل وحالة اشتراكه.</p>`;

  el.querySelectorAll("[data-fil]").forEach(b=>b.onclick=()=>{ S._subsFil=b.dataset.fil; viewSubs(el); });
  $("#sbRef").onclick=async()=>{ await loadClients(); render(); };

  $("#sbL").onclick=async e=>{
    const row=e.target.closest(".sb-row"); if(!row) return;
    const c=(S.coachClients||[]).find(x=>x.id===row.dataset.id); if(!c) return;
    if(e.target.closest("[data-paid]")){
      const btn=e.target.closest("[data-paid]"), v=!c.sub_paid;
      btn.disabled=true;
      const { error }=await sb.from("profiles").update({sub_paid:v}).eq("id",c.id);
      btn.disabled=false;
      if(error) return toast("تعذر الحفظ، جرّب تاني");
      c.sub_paid=v;
      toast(v?"✓ اتسجّل مدفوع":"اتشالت علامة الدفع");
      viewSubs(el);
    } else if(e.target.closest("[data-open]")){
      await openClient(c); S.tab="setup"; S.setupTab="data"; render(); window.scrollTo(0,0);
    }
  };
}
})();
