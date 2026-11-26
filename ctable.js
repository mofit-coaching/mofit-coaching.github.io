/* ======================================================================
   MOFIT coach client table (ct-*): جدول العملاء القابل للبحث والترتيب.
   - Adds a 📊 جدول / 📋 قايمة toggle to the existing "عملائك" card in
     viewClients. No new tabs, no edits to coach.js: wraps viewClients.
   - Columns: العميل · الحالة · الباقة · التجديد · الالتزام · آخر نشاط · الأسبوع.
     Tap a header to sort (asc/desc), tap a row to open the client file.
   - Search reuses the existing #cq box (name/email/phone/plan).
   - Reads S.coachClients + S.overview only. READ-ONLY, no new queries.
   ====================================================================== */
(function(){
const CSS=`
.ct-tgl{margin-inline-start:auto}
.ct-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:14px;border:1.5px solid var(--soft)}
.ct{border-collapse:collapse;width:100%;min-width:560px;font-size:.8rem}
.ct th{position:sticky;top:0;background:var(--soft2);color:var(--slate);font-size:.7rem;font-weight:800;padding:9px 10px;text-align:right;cursor:pointer;user-select:none;white-space:nowrap;transition:color .18s}
.ct th:hover{color:var(--acc)}
.ct th .ct-ar{display:inline-block;margin-inline-start:3px;font-size:.6rem;transition:transform .25s}
.ct th.desc .ct-ar{transform:rotate(180deg)}
.ct td{padding:9px 10px;border-top:1px solid var(--soft);white-space:nowrap;vertical-align:middle}
.ct tbody tr{cursor:pointer;animation:ctin .35s cubic-bezier(.2,1.2,.4,1) both;transition:background .15s}
.ct tbody tr:active{background:var(--soft2)}
.ct-name{position:sticky;inset-inline-start:0;background:var(--card);display:flex;align-items:center;gap:8px;min-width:150px;box-shadow:-1px 0 0 var(--soft)}
.ct-name .av{width:32px;height:32px;font-size:.72rem;flex:none}
.ct-name b{font-size:.82rem;display:block;max-width:150px;overflow:hidden;text-overflow:ellipsis}
.ct-name small{display:block;color:var(--slate);font-size:.66rem;max-width:150px;overflow:hidden;text-overflow:ellipsis}
.ct-pill{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:2px 9px;font-size:.7rem;font-weight:800}
.ct-pill.good{background:var(--good-soft);color:var(--good)}
.ct-pill.warn{background:var(--acc-soft);color:#C2410C}
.ct-pill.bad{background:var(--bad-soft);color:var(--bad)}
.ct-pill.none{background:var(--soft2);color:var(--slate)}
@media (prefers-color-scheme: dark){.ct-pill.warn{color:#FFB35C}}
.ct-bar{width:64px;height:6px;border-radius:99px;background:var(--soft);overflow:hidden;display:inline-block;vertical-align:middle;margin-inline-end:6px}
.ct-bar i{display:block;height:100%;border-radius:99px;background:var(--acc);transition:width .5s cubic-bezier(.2,1,.3,1)}
.ct-num{font-variant-numeric:tabular-nums}
.ct-foot{margin-top:8px;font-size:.72rem;color:var(--slate);text-align:center}
.ct-empty{padding:26px 10px;text-align:center;color:var(--slate);font-size:.85rem}
@keyframes ctin{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion: reduce){.ct tbody tr{animation:none!important}}
`;
const style=document.createElement("style"); style.textContent=CSS; document.head.appendChild(style);

const dShort=v=>{ try{ return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"short"}).format(new Date(v+"T00:00:00")); }catch(e){ return v||""; } };
const lastAct=(c,o)=>[o?.last_set&&o.last_set.slice(0,10),o?.last_habit,o?.last_meal].filter(Boolean).sort().pop()||null;
const relDay=iso=>{ if(!iso) return "—"; const n=daysBetween(iso,today()); if(n<=0) return "النهارده"; if(n===1) return "امبارح"; if(n===2) return "من يومين"; if(n<=10) return `من ${n} أيام`; return `من ${n} يوم`; };

function rows(q){
  q=(q||"").trim().toLowerCase();
  return (S.coachClients||[]).filter(c=>{
    if(!q) return true;
    return [c.full_name,c.email,c.phone,c.sub_plan].some(v=>String(v||"").toLowerCase().includes(q));
  }).map(c=>{
    const o=S.overview?.[c.id]||{}, sub=typeof subStatus==="function"?subStatus(c):null;
    return { c, name:(c.full_name||c.email||"").toLowerCase(), active:!!c.active,
      plan:c.sub_plan||"", end:c.sub_end||"", left:sub?sub.left:null, adh:o.adherence7!=null?+o.adherence7:null,
      act:lastAct(c,o), wk:typeof currentWeek==="function"?currentWeek(c):1 };
  });
}
const SORTS={
  name:(a,b)=>a.name.localeCompare(b.name,"ar"),
  active:(a,b)=>(b.active-a.active),
  plan:(a,b)=>a.plan.localeCompare(b.plan,"ar"),
  end:(a,b)=>(a.end||"9999").localeCompare(b.end||"9999"),
  adh:(a,b)=>(a.adh==null?-1:a.adh)-(b.adh==null?-1:b.adh),
  act:(a,b)=>(a.act||"").localeCompare(b.act||""),
  wk:(a,b)=>a.wk-b.wk,
};
const COLS=[["name","العميل"],["active","الحالة"],["plan","الباقة"],["end","التجديد"],["adh","الالتزام ٧ أيام"],["act","آخر نشاط"],["wk","الأسبوع"]];

function paint(wrap){
  const q=wrap.dataset.q||"";
  const sort=S._ctSort||(S._ctSort={k:"end",dir:1});
  let R=rows(q);
  const f=SORTS[sort.k]||SORTS.end;
  R=R.slice().sort((a,b)=>sort.dir*(f(a,b)||a.name.localeCompare(b.name,"ar")));
  const cell={
    name:r=>`<div class="ct-name"><div class="av">${initials(r.c)}</div><div><b>${esc(r.c.full_name||"—")}</b><small>${esc(r.c.split_name||"بدون برنامج")}${r.c.level?" · "+esc(r.c.level):""}</small></div></div>`,
    active:r=>r.active?`<span class="ct-pill good">مفعّل</span>`:`<span class="ct-pill none">مستني</span>`,
    plan:r=>r.c.sub_plan?`<b style="font-size:.78rem">${esc(r.c.sub_plan)}</b>${r.c.sub_price?`<small style="display:block;color:var(--slate);font-size:.66rem">${fmt(r.c.sub_price)} ج.م</small>`:""}`:`<span class="ct-pill none">بدون</span>`,
    end:r=>{ if(!r.end) return `<span class="ct-pill none">—</span>`; const cls=r.left==null?"none":r.left<0?"bad":r.left<=7?"warn":"good"; const txt=r.left==null?dShort(r.end):r.left<0?`انتهى ${dShort(r.end)}`:r.left===0?"النهارده!":`باقي ${r.left} يوم`; return `<span class="ct-pill ${cls}">${txt}</span>`; },
    adh:r=>r.adh==null?`<span class="ct-pill none">—</span>`:`<span class="ct-bar"><i style="width:${Math.round(Math.min(1,Math.max(0,r.adh))*100)}%"></i></span><span class="ct-num">${pct(r.adh)}</span>`,
    act:r=>`<span class="${r.act?"":"ct-pill none"}" style="font-size:.76rem">${relDay(r.act)}</span>`,
    wk:r=>`<span class="ct-num">${r.wk}</span>`,
  };
  wrap.innerHTML=`<div class="ct-wrap"><table class="ct"><thead><tr>${COLS.map(([k,l])=>`<th data-k="${k}" class="${sort.k===k?(sort.dir<0?"desc":""):""}">${l}${sort.k===k?`<span class="ct-ar">▲</span>`:""}</th>`).join("")}</tr></thead>
    <tbody>${R.length?R.map((r,i)=>`<tr data-id="${r.c.id}" style="animation-delay:${Math.min(i*30,400)}ms">${COLS.map(([k])=>`<td>${cell[k](r)}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${COLS.length}"><div class="ct-empty">مفيش نتايج مطابقة للبحث 🔍</div></td></tr>`}</tbody></table></div>
    <div class="ct-foot">${R.length} من ${(S.coachClients||[]).length} عميل · دوس على أي عمود يرتّب، ودوس على العميل يفتح ملفه</div>`;
  wrap.querySelectorAll("th[data-k]").forEach(th=>th.onclick=()=>{
    const k=th.dataset.k;
    if(S._ctSort.k===k) S._ctSort.dir*=-1; else S._ctSort={k,dir:1};
    paint(wrap);
  });
  wrap.querySelectorAll("tr[data-id]").forEach(tr=>tr.onclick=async()=>{ const c=(S.coachClients||[]).find(x=>x.id===tr.dataset.id); if(c){ await openClient(c); render(); window.scrollTo(0,0); } });
}

function enhance(el){
  const cl=el.querySelector("#cl"); if(!cl) return;
  const card=cl.closest(".card"); if(!card||card.querySelector(".ct-tgl")) return;
  const head=card.querySelector(".card-h");
  const tgl=document.createElement("button");
  tgl.type="button"; tgl.className="btn sm ghost ct-tgl";
  head.appendChild(tgl);
  const host=document.createElement("div");
  cl.parentNode.insertBefore(host,cl);
  const mode=()=>S._clView||(S._clView=(()=>{ try{ return localStorage.getItem("mofit-clview")||"list"; }catch(e){ return "list"; } })());
  const apply=()=>{
    const on=mode()==="table";
    tgl.innerHTML=on?"📋 قايمة":"📊 جدول";
    tgl.setAttribute("aria-pressed",on?"true":"false");
    cl.style.display=on?"none":"";
    const chips=el.querySelector("#cfl"); if(chips) chips.style.display=on?"none":"";
    host.style.display=on?"":"none";
    if(on){ host.dataset.q=(el.querySelector("#cq")?.value)||""; paint(host); }
  };
  tgl.onclick=e=>{ e.stopPropagation(); S._clView=mode()==="table"?"list":"table"; try{ localStorage.setItem("mofit-clview",S._clView); }catch(_){ } apply(); };
  const q=el.querySelector("#cq");
  if(q&&!q.dataset.ctH){ q.dataset.ctH="1"; q.addEventListener("input",()=>{ if(mode()==="table"){ host.dataset.q=q.value; paint(host); } }); }
  apply();
}

const _viewClientsCT=viewClients;
viewClients=async function(el){
  const r=await _viewClientsCT.apply(this,arguments);
  try{ enhance(el); }catch(e){ console.warn(e); }
  return r;
};
})();
