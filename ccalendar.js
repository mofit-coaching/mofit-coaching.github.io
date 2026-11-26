/* ======================================================================
   MOFIT coach "التقويم" tab (cc-*): كل المواعيد المهمة في تقويم واحد.
   - تجديدات ونهايات الاشتراكات (profiles.sub_start / sub_end)
   - بداية الاشتراكات
   - نهاية البرنامج (start_date + مدة الباقة بالأسابيع + الأسابيع الهدية)
   - المتابعات الأسبوعية اللي اتبعتت (checkins) + المتابعة المتوقعة الجاية
   Self-contained: own CSS, wraps tabs/viewHome like subs.js. READ-ONLY:
   لا جداول جديدة ولا أي كتابة في الداتا.
   ====================================================================== */
(function(){
const CSS=`
.cc-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.cc-head b{flex:1;text-align:center;font-size:1.05rem}
.cc-nav{width:38px;height:38px;border-radius:12px;border:1.5px solid var(--soft);background:var(--card);color:inherit;font-size:1.05rem;cursor:pointer;display:grid;place-items:center;transition:transform .18s,background .18s}
.cc-nav:active{transform:scale(.9)}
.cc-today{border:1.5px solid var(--acc);background:var(--acc-soft);color:#C2410C;border-radius:12px;padding:0 12px;height:38px;font-size:.8rem;font-weight:800;cursor:pointer;transition:transform .18s}
.cc-today:active{transform:scale(.92)}
@media (prefers-color-scheme: dark){.cc-today{color:#FFB35C}}
.cc-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px}
.cc-strip .stat{padding:9px 6px;text-align:center}
.cc-strip .stat .v{font-size:1.15rem}
.cc-strip .stat .l{font-size:.68rem}
@media (max-width:380px){.cc-strip{grid-template-columns:repeat(2,1fr)}}
.cc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cc-dow{text-align:center;font-size:.66rem;font-weight:800;color:var(--slate);padding:4px 0 6px}
.cc-cell{position:relative;min-height:52px;border-radius:12px;background:var(--soft2);padding:5px 4px 4px;cursor:pointer;transition:transform .16s,box-shadow .16s;animation:ccpop .4s cubic-bezier(.2,1.2,.4,1) both}
.cc-cell:active{transform:scale(.93)}
.cc-cell.off{opacity:.32}
.cc-cell.sel{box-shadow:0 0 0 2px var(--acc) inset}
.cc-cell.now .cc-d{background:var(--acc);color:#fff}
.cc-d{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:.74rem;font-weight:800;font-variant-numeric:tabular-nums}
.cc-ev{display:flex;flex-wrap:wrap;gap:2px;margin-top:3px;justify-content:center}
.cc-dot{width:16px;height:16px;border-radius:6px;display:grid;place-items:center;font-size:.6rem;font-weight:800;color:#fff;line-height:1}
.cc-dot.subend{background:#F97316}
.cc-dot.substart{background:var(--good)}
.cc-dot.planend{background:var(--navy3)}
.cc-dot.checkin{background:#0EA5E9}
.cc-dot.due{background:transparent;border:1.5px dashed #0EA5E9;color:#0EA5E9}
.cc-more{font-size:.58rem;font-weight:800;color:var(--slate);align-self:center}
.cc-legend{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}
.cc-legend span{display:inline-flex;align-items:center;gap:4px;font-size:.68rem;color:var(--slate);font-weight:700}
.cc-list{margin-top:10px}
.cc-day-t{font-size:.85rem;font-weight:800;margin:8px 2px 6px;color:var(--slate)}
.cc-row{display:flex;align-items:center;gap:10px;padding:10px 2px;border-top:1px solid var(--soft);cursor:pointer;animation:ccpop .45s cubic-bezier(.2,1.2,.4,1) both}
.cc-row:first-of-type{border-top:0}
.cc-row:active{opacity:.7}
.cc-row .av{width:38px;height:38px;flex:none}
.cc-mid{flex:1;min-width:0}
.cc-mid b{display:block;font-size:.9rem}
.cc-mid small{display:block;color:var(--slate);font-size:.74rem;line-height:1.55}
.cc-tag{flex:none;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font-size:.9rem}
.cc-tag.subend{background:var(--acc-soft)}
.cc-tag.substart{background:var(--good-soft)}
.cc-tag.planend{background:var(--soft2)}
.cc-tag.checkin{background:rgba(14,165,233,.14)}
.cc-tag.due{background:rgba(14,165,233,.08)}
.cc-empty{text-align:center;padding:22px 10px;color:var(--slate);font-size:.85rem}
.cc-grid.slide-r{animation:ccsr .3s ease}
.cc-grid.slide-l{animation:ccsl .3s ease}
@keyframes ccpop{from{opacity:0;transform:translateY(8px) scale(.96)}}
@keyframes ccsr{from{opacity:0;transform:translateX(-14px)}}
@keyframes ccsl{from{opacity:0;transform:translateX(14px)}}
@media (prefers-reduced-motion: reduce){.cc-cell,.cc-row,.cc-grid{animation:none!important}}
`;
const style=document.createElement("style"); style.textContent=CSS; document.head.appendChild(style);

ICON.cal='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 15h2M14 15h2"/></svg>';

/* nav: right after الاشتراكات on the coach home */
const _tabsCal=tabs;
tabs=function(){
  const t=_tabsCal();
  if(!S.me||S.me.role!=="coach"||S.client) return t;
  const out=t.slice(), i=out.findIndex(x=>x[0]==="subs");
  out.splice(i>=0?i+1:1,0,["cal","التقويم"]);
  return out;
};
const _viewHomeCal=viewHome;
viewHome=async function(el){
  if(S.me&&S.me.role==="coach"&&!S.client&&S.tab==="cal") return viewCal(el);
  return _viewHomeCal(el);
};

const DOW=["سبت","أحد","اتنين","تلات","أربع","خميس","جمعة"];
const mf=new Intl.DateTimeFormat("ar-EG",{month:"long",year:"numeric"});
const df=new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long"});
const dff=new Intl.DateTimeFormat("ar-EG",{weekday:"long",day:"numeric",month:"long"});
const mTitle=ym=>{ try{ return mf.format(new Date(ym+"-01T00:00:00")); }catch(e){ return ym; } };
const dShort=iso=>{ try{ return df.format(new Date(iso+"T00:00:00")); }catch(e){ return iso; } };
const dFull=iso=>{ try{ return dff.format(new Date(iso+"T00:00:00")); }catch(e){ return iso; } };

/* grid range (Saturday-first) covering the month */
/* grid range (Saturday-first) covering the month; all math in UTC so local TZ can't shift a day */
function gridRange(ym){
  const first=ym+"-01", dw=new Date(first+"T00:00:00Z").getUTCDay(), off=(dw+1)%7;
  const start=addDays(first,-off);
  const y=+ym.slice(0,4), m=+ym.slice(5,7);
  const lastD=new Date(Date.UTC(y,m,0));
  const last=lastD.toISOString().slice(0,10);
  const endOff=(6-((lastD.getUTCDay()+1)%7)+7)%7;
  return {start,end:addDays(last,endOff)};
}
function shiftYm(ym,n){ const d=new Date(ym+"-01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth()+n); return d.toISOString().slice(0,7); }

/* every event in [a,b] from data already on the client (no writes) */
function buildEvents(a,b){
  const E={}, put=(d,ev)=>{ if(d&&d>=a&&d<=b){ (E[d]=E[d]||[]).push(ev); } };
  const byId=Object.fromEntries((S.coachClients||[]).map(c=>[c.id,c]));
  (S.coachClients||[]).forEach(c=>{
    put(c.sub_start,{t:"substart",c});
    put(c.sub_end,{t:"subend",c});
    if(c.start_date&&typeof maxWeek==="function"){
      const mw=maxWeek(c);
      if(mw&&mw<260) put(addDays(c.start_date,mw*7-1),{t:"planend",c});
    }
  });
  (S._calCI||[]).forEach(r=>{ const c=byId[r.client_id]; if(c) put(r.checkin_date,{t:"checkin",c,wk:r.week}); });
  /* next expected check-ins: 7 days after the client's latest one, weekly while unpaid-looking gap stays in view */
  const last={};
  (S._calCI||[]).forEach(r=>{ if(!last[r.client_id]||r.checkin_date>last[r.client_id]) last[r.client_id]=r.checkin_date; });
  Object.keys(last).forEach(id=>{
    const c=byId[id]; if(!c||!c.active) return;
    let n=addDays(last[id],7), guard=0;
    while(n<=b&&guard<10){ if(n>=a&&n>=today()) put(n,{t:"due",c}); n=addDays(n,7); guard++; }
  });
  return E;
}
const EV_META={
  subend:{icon:"💳",label:c=>`الاشتراك بينتهي${c.sub_plan?" — "+c.sub_plan:""}${c.sub_paid?"":" · غير مدفوع"}`},
  substart:{icon:"🟢",label:c=>`بداية اشتراك${c.sub_plan?" "+c.sub_plan:""}`},
  planend:{icon:"🏁",label:c=>{ const mw=typeof maxWeek==="function"?maxWeek(c):0; return `البرنامج بيخلص${mw&&mw<260?" ("+mw+" أسبوع)":""}`; }},
  checkin:{icon:"📸",label:(c,ev)=>`متابعة${ev.wk?" أسبوع "+ev.wk:""} اتبعتت`},
  due:{icon:"⏳",label:()=>"متابعة متوقعة"},
};

async function fetchCheckins(ym){
  const {start,end}=gridRange(ym), key=ym;
  S._calCIK=S._calCIK||{};
  if(S._calCIK[key]) { S._calCI=S._calCIK[key]; return true; }
  const ids=(S.coachClients||[]).map(c=>c.id);
  if(!ids.length){ S._calCI=[]; return true; }
  try{
    const { data } = await sb.from("checkins").select("client_id,checkin_date,week").in("client_id",ids).gte("checkin_date",addDays(start,-35)).lte("checkin_date",end).range(0,2999);
    S._calCIK[key]=data||[]; S._calCI=S._calCIK[key];
  }catch(e){ S._calCI=S._calCI||[]; }
  return true;
}

async function viewCal(el){
  const ym=S._calM||today().slice(0,7); S._calM=ym;
  const sel=S._calD&&S._calD.slice(0,7)===ym?S._calD:today().slice(0,7)===ym?today():ym+"-01";
  S._calD=sel;
  el.innerHTML=`<div class="card">
    <div class="card-h"><div class="ic acc">🗓</div><h2>تقويم الكوتش<small>التجديدات · المتابعات · نهايات البرامج</small></h2></div>
    <div class="cc-head">
      <button class="cc-nav" id="ccPrev" aria-label="الشهر اللي فات">›</button>
      <b>${esc(mTitle(ym))}</b>
      <button class="cc-today" id="ccNow">النهارده</button>
      <button class="cc-nav" id="ccNext" aria-label="الشهر الجاي">‹</button>
    </div>
    <div class="cc-strip" id="ccStrip"></div>
    <div class="cc-grid" id="ccGrid">${DOW.map(d=>`<div class="cc-dow">${d}</div>`).join("")}</div>
    <div class="cc-legend">
      <span><i class="cc-dot subend"></i> نهاية اشتراك</span>
      <span><i class="cc-dot substart"></i> بداية اشتراك</span>
      <span><i class="cc-dot planend"></i> نهاية برنامج</span>
      <span><i class="cc-dot checkin"></i> متابعة اتبعتت</span>
      <span><i class="cc-dot due"></i> متابعة متوقعة</span>
    </div>
    <div class="cc-list" id="ccList"></div>
  </div>`;
  $("#ccPrev").onclick=()=>{ S._calM=shiftYm(ym,-1); viewCal(el); };
  $("#ccNext").onclick=()=>{ S._calM=shiftYm(ym,1); viewCal(el); };
  $("#ccNow").onclick=()=>{ S._calM=today().slice(0,7); S._calD=today(); viewCal(el); };

  const paint=()=>{
    const {start,end}=gridRange(ym), E=buildEvents(start,end), t=today();
    const counts={subend:0,substart:0,planend:0,checkin:0};
    Object.keys(E).forEach(d=>{ if(d.slice(0,7)!==ym) return; const seen={}; E[d].forEach(ev=>{ if(ev.t==="due") return; const k=ev.t+ev.c.id; if(!seen[k]&&counts[ev.t]!=null){ counts[ev.t]++; seen[k]=1; } }); });
    $("#ccStrip").innerHTML=[["💳","نهايات اشتراك",counts.subend],["🏁","نهايات برامج",counts.planend],["📸","متابعات",counts.checkin],["🟢","اشتراكات جديدة",counts.substart]]
      .map(([i,l,v])=>`<div class="stat"><div class="v num">${v}</div><div class="l">${i} ${l}</div></div>`).join("");
    const days=[]; let d=start; while(d<=end){ days.push(d); d=addDays(d,1); }
    $("#ccGrid").innerHTML=DOW.map(w=>`<div class="cc-dow">${w}</div>`).join("")+days.map((d,i)=>{
      const evs=E[d]||[], off=d.slice(0,7)!==ym;
      const counts2={}; evs.forEach(ev=>counts2[ev.t]=(counts2[ev.t]||0)+1);
      const order=["subend","planend","checkin","due","substart"].filter(k2=>counts2[k2]);
      const shown=order.slice(0,3), more=evs.length-shown.reduce((s2,k2)=>s2+counts2[k2],0);
      return `<div class="cc-cell${off?" off":""}${d===sel?" sel":""}${d===t?" now":""}" data-d="${d}" style="animation-delay:${Math.min(i*12,300)}ms">
        <span class="cc-d">${+d.slice(8)}</span>
        <div class="cc-ev">${shown.map(k2=>`<i class="cc-dot ${k2}">${counts2[k2]>1?counts2[k2]:""}</i>`).join("")}${more>0?`<span class="cc-more">+${more}</span>`:""}</div>
      </div>`;
    }).join("");
    $("#ccGrid").querySelectorAll("[data-d]").forEach(cell=>cell.onclick=()=>{ S._calD=cell.dataset.d; paint(); });
    const dayEvs=(E[sel]||[]).slice().sort((x,y)=>"subend planend due checkin substart".indexOf(x.t)-"subend planend due checkin substart".indexOf(y.t));
    $("#ccList").innerHTML=`<div class="cc-day-t">${sel===t?"النهارده — ":""}${esc(dFull(sel))}</div>`+
      (dayEvs.length?dayEvs.map((ev,i)=>{ const m=EV_META[ev.t]; return `<div class="cc-row" data-id="${ev.c.id}" style="animation-delay:${i*50}ms">
        <div class="cc-tag ${ev.t}">${m.icon}</div>
        <div class="cc-mid"><b>${esc(ev.c.full_name||ev.c.email)}</b><small>${esc(m.label(ev.c,ev))}</small></div>
        <div class="av">${initials(ev.c)}</div>
      </div>`; }).join(""):`<div class="cc-empty">مفيش مواعيد اليوم ده 🎉</div>`);
    $("#ccList").querySelectorAll("[data-id]").forEach(r=>r.onclick=async()=>{ const c=(S.coachClients||[]).find(x=>x.id===r.dataset.id); if(c){ await openClient(c); render(); window.scrollTo(0,0); } });
  };
  if(S._calCIK&&S._calCIK[ym]) S._calCI=S._calCIK[ym];
  paint();
  const had=S._calCIK&&S._calCIK[ym];
  fetchCheckins(ym).then(()=>{ if(!had&&document.body.contains(el)&&S.tab==="cal") paint(); });
}
})();
