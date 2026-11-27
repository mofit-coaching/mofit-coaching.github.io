/* ======================================================================
   MOFIT expired-subscription lock + coach plan picker (sl- / sp- prefixes)
   - Client whose sub_end has passed sees ONLY a "الاشتراك انتهى" screen:
     renewal over WhatsApp, offers sheet, pull-to-refresh to re-check.
     Coach view, assistants and clients with no end date are untouched.
   - Coach "الاشتراك" card (التحكم ← بيانات العميل) gets a باقة picker:
     3 tiers (البرنامج / المتابعة / واحد لواحد VIP) × مدة (1/3/6/9/12 شهر).
     Picking fills الباقة + التواريخ، والسعر من جدول الأسعار لو موجود.
     Prices are never changed here; 9 شهور لسه مالهاش سعر مسجّل.
   ====================================================================== */
(function(){
const CSS=`
/* ---------- expired-subscription lock screen ---------- */
.sl-wrap{position:relative;text-align:center;color:#fff;background:radial-gradient(300px 220px at 82% -4%,rgba(249,115,22,.34),transparent 65%),radial-gradient(240px 200px at 8% 108%,rgba(249,115,22,.16),transparent 60%),linear-gradient(165deg,#0F172A,#1E293B);border-radius:26px;padding:34px 20px 26px;margin-top:14px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.35)}
.sl-stars{position:absolute;inset:0;pointer-events:none}
.sl-stars i{position:absolute;width:5px;height:5px;border-radius:50%;background:rgba(251,146,60,.5);animation:slfloat 5s ease-in-out infinite}
.sl-stars i:nth-child(1){top:16%;inset-inline-start:12%}
.sl-stars i:nth-child(2){top:30%;inset-inline-end:14%;width:4px;height:4px;animation-delay:1.2s}
.sl-stars i:nth-child(3){top:58%;inset-inline-start:8%;width:3px;height:3px;animation-delay:2.1s}
.sl-stars i:nth-child(4){top:72%;inset-inline-end:10%;animation-delay:.6s}
.sl-stars i:nth-child(5){top:12%;inset-inline-end:34%;width:3px;height:3px;animation-delay:2.8s}
.sl-orb{position:relative;width:118px;height:118px;margin:2px auto 16px;display:grid;place-items:center}
.sl-ic{width:78px;height:78px;border-radius:26px;background:linear-gradient(135deg,#F97316,#FB923C);display:grid;place-items:center;box-shadow:0 10px 30px rgba(249,115,22,.5);animation:pwfloat 2.6s ease-in-out infinite}
.sl-ic svg{width:44px;height:44px}
.sl-lock{position:absolute;bottom:6px;inset-inline-end:10px;width:34px;height:34px;border-radius:50%;background:#0F172A;border:2px solid #FB923C;display:grid;place-items:center;font-size:1rem;box-shadow:0 4px 14px rgba(15,23,42,.5);animation:slpop .5s cubic-bezier(.2,1.4,.4,1) .35s both}
.sl-ring{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(249,115,22,.55);animation:pwpulse 2.4s ease-out infinite}
.sl-ring.r2{animation-delay:1.2s}
.sl-ecg{width:170px;height:34px;margin:0 auto 14px;display:block}
.sl-ecg path{fill:none;stroke:#FB923C;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:330;stroke-dashoffset:330;animation:slecg 3.2s ease-in-out infinite;filter:drop-shadow(0 0 5px rgba(251,146,60,.65))}
.sl-pill{display:inline-block;background:rgba(220,38,38,.16);border:1px solid rgba(248,113,113,.45);color:#FCA5A5;border-radius:99px;padding:4px 14px;font-size:.8rem;font-weight:800;margin-bottom:10px}
.sl-wrap h1{margin:0 0 8px;font-size:1.45rem;line-height:1.35}
.sl-sub{margin:0 auto 16px;color:#CBD5E1;font-size:.94rem;line-height:1.8;max-width:340px}
.sl-sub b{color:#FDBA74}
.sl-plan{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:16px;padding:9px 16px;font-size:.86rem;font-weight:700;color:#E2E8F0;margin-bottom:20px;flex-wrap:wrap;justify-content:center}
.sl-plan b{color:#FB923C}
.sl-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:0;border-radius:16px;padding:14px;font-size:1.02rem;font-weight:800;cursor:pointer;text-decoration:none;margin-bottom:10px;background:linear-gradient(135deg,#22C55E,#16A34A);color:#fff;box-shadow:0 8px 24px rgba(34,197,94,.35);transition:transform .15s}
.sl-cta:active{transform:scale(.97)}
.sl-offers{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border-radius:16px;padding:13px;font-size:.95rem;font-weight:800;cursor:pointer;background:rgba(249,115,22,.14);border:1.5px solid rgba(249,115,22,.5);color:#FDBA74;margin-bottom:14px;transition:transform .15s}
.sl-offers:active{transform:scale(.97)}
.sl-hint{margin:0 0 14px;color:#94A3B8;font-size:.8rem;line-height:1.7}
.sl-out{background:none;border:0;color:#64748B;font-size:.8rem;font-weight:700;cursor:pointer;text-decoration:underline}
@media(prefers-reduced-motion:reduce){.sl-ic,.sl-ring,.sl-ecg path,.sl-stars i,.sl-lock{animation:none!important}.sl-ring{opacity:.4}.sl-ecg path{stroke-dashoffset:0}}
@keyframes slfloat{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-12px);opacity:1}}
@keyframes slecg{0%{stroke-dashoffset:330}55%{stroke-dashoffset:0}80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes slpop{from{transform:scale(0)}to{transform:scale(1)}}
/* ---------- coach plan picker (التحكم ← بيانات العميل) ---------- */
.sp-box{background:var(--soft2);border:1.5px dashed var(--soft);border-radius:16px;padding:10px 12px;margin-bottom:10px}
.sp-lab{display:block;font-size:.78rem;font-weight:800;color:var(--slate);margin:0 0 6px}
.sp-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.sp-chips:last-child{margin-bottom:0}
.sp-chips .chip{flex:1 1 auto;text-align:center}
.sp-note{margin:8px 0 0;font-size:.78rem;color:#C2410C;font-weight:700}
@media (prefers-color-scheme: dark){.sp-box{background:rgba(255,255,255,.05)}.sp-note{color:#FFB35C}}
`;
const style=document.createElement("style"); style.textContent=CSS; document.head.appendChild(style);

/* ---------- coach plan picker ---------- */
const SP_DURS=[1,3,6,9,12];
const spPlans=()=>{ try{ return (typeof cacheGet==="function"&&cacheGet("plans"))||(typeof PLAN_DEFAULTS!=="undefined"?PLAN_DEFAULTS:[]); }catch(e){ return typeof PLAN_DEFAULTS!=="undefined"?PLAN_DEFAULTS:[]; } };
const spTierOf=t=>typeof TIER_DEFS!=="undefined"&&TIER_DEFS[t]?t:null;
function spGuessTier(plan){ plan=plan||""; if(/VIP|واحد لواحد/i.test(plan)) return "v"; if(plan.indexOf("المتابعة")>-1) return "s"; if(plan.indexOf("البرنامج")>-1) return "b"; return null; }
function spGuessMonths(plan){ const m=String(plan||"").match(/(\d+)/); if(m) return +m[1]; if(/شهري|شهر/.test(plan||"")) return 1; return null; }
function spPriceFor(tier,months){
  const p=spPlans().find(x=>(x.tier||String(x.id||"")[0])===tier&&+x.months===+months);
  if(p&&planPrice(p)) return p.price;
  if(+months===9){ /* no saved 9-month plan: 20% off the tier's 1-month price (midpoint of his 15% @6m and 25% @12m curve) */
    const m1=spPlans().find(x=>(x.tier||String(x.id||"")[0])===tier&&+x.months===1);
    if(m1&&planPrice(m1)) return Math.round(+m1.price*9*0.8);
  }
  return null;
}

window.subPickerHTML=function(p){
  const cur=p.sub_plan||"", gt=spGuessTier(cur), gm=spGuessMonths(cur);
  const tiers=["b","s","v"].map(t=>{ const d=TIER_DEFS[t]; return `<button type="button" class="chip ${gt===t?"on":""}" data-stier="${t}">${esc(d.name)}</button>`; }).join("");
  const durs=SP_DURS.map(m=>`<button type="button" class="chip ${gm===m?"on":""}" data-smth="${m}">${monthsAr(m)}</button>`).join("");
  return `<div class="sp-box" id="spPick">
    <span class="sp-lab">نوع الباقة</span>
    <div class="sp-chips" id="spTiers">${tiers}</div>
    <span class="sp-lab">المدة</span>
    <div class="sp-chips" id="spDurs">${durs}</div>
    <p class="sp-note" id="spNote" hidden></p>
  </div>`;
};

window.wireSubPicker=function(root){
  const box=root.querySelector("#spPick"); if(!box) return;
  const planIn=root.querySelector("#sPlan"), priceIn=root.querySelector("#sPrice"),
        startIn=root.querySelector("#sStart"), endIn=root.querySelector("#sEnd"), note=box.querySelector("#spNote");
  const sel=()=>({tier:(box.querySelector("#spTiers .chip.on")||{}).dataset?box.querySelector("#spTiers .chip.on").dataset.stier:null,
                  months:(box.querySelector("#spDurs .chip.on")||{}).dataset?+box.querySelector("#spDurs .chip.on").dataset.smth:null});
  function apply(fromDur){
    const {tier,months}=sel();
    if(tier&&typeof TIER_DEFS!=="undefined"&&months&&typeof monthsAr==="function") planIn.value=`${TIER_DEFS[tier].name} – ${monthsAr(months)}`;
    else if(tier&&typeof TIER_DEFS!=="undefined") planIn.value=TIER_DEFS[tier].name;
    else if(months&&typeof monthsAr==="function") planIn.value=monthsAr(months);
    if(months){
      const st=startIn.value||today(); startIn.value=st;
      const d=new Date(st+"T00:00:00"); d.setMonth(d.getMonth()+months); d.setDate(d.getDate()-1);
      endIn.value=d.toISOString().slice(0,10);
      if(typeof djSync==="function"){ djSync(startIn); djSync(endIn); }
    }
    note.hidden=true;
    if(tier&&months&&priceIn){
      const pr=spPriceFor(tier,months);
      if(pr!==null) priceIn.value=pr;
      else { note.textContent=`مفيش سعر مسجّل لباقة ${TIER_DEFS[tier].name} ${monthsAr(months)} – اكتب السعر يدوي.`; note.hidden=false; }
    }
  }
  box.querySelectorAll("[data-stier]").forEach(b=>b.onclick=()=>{
    const was=b.classList.contains("on");
    box.querySelectorAll("[data-stier]").forEach(x=>x.classList.remove("on"));
    if(!was) b.classList.add("on");
    apply();
  });
  box.querySelectorAll("[data-smth]").forEach(b=>b.onclick=()=>{
    const was=b.classList.contains("on");
    box.querySelectorAll("[data-smth]").forEach(x=>x.classList.remove("on"));
    if(!was) b.classList.add("on");
    apply(true);
  });
};

/* ---------- expired-subscription lock screen ---------- */
function subExpiredClient(){
  try{
    if(typeof S==="undefined"||!S.me||S.me.role!=="client") return false;
    const p=S.client||S.me;
    if(!p||!p.sub_end) return false;
    return daysBetween(today(),p.sub_end)<0;
  }catch(e){ return false; }
}
const slDumbbell='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/></svg>';
const slEcg='<svg class="sl-ecg" viewBox="0 0 170 34" aria-hidden="true"><path d="M2 17 H48 L56 17 60 8 66 26 71 12 76 17 H104 L112 17 116 10 121 24 126 13 131 17 H168"/></svg>';
function slFmtDate(iso){ try{ return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",year:"numeric"}).format(new Date(iso+"T00:00:00")); }catch(e){ return iso; } }
function renderSubLock(){
  const p=S.client||S.me, first=esc((p.full_name||"").split(" ")[0]||"بطل");
  const endTxt=slFmtDate(p.sub_end), since=daysBetween(p.sub_end,today());
  const sinceTxt=since===1?"من يوم":since===2?"من يومين":since<=10?`من ${fmt(since)} أيام`:`من ${fmt(since)} يوم`;
  $("#top").innerHTML=`<div class="top-row"><div class="logo">MO<b>FIT</b></div><div class="sp"></div><button class="ibtn" onclick="logout()">خروج</button></div>`;
  const nv=$("#nav"); if(nv) nv.classList.add("hidden");
  const waMsg=`السلام عليكم كوتش 👋\nأنا ${p.full_name||""} من Mofit\nاشتراكي${p.sub_plan?` (${p.sub_plan})`:""} انتهى يوم ${endTxt} وعايز أجدد 🙏`;
  $("#main").innerHTML=`<div class="sl-wrap">
    <div class="sl-stars"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="sl-orb"><span class="sl-ring"></span><span class="sl-ring r2"></span><div class="sl-ic">${slDumbbell}</div><span class="sl-lock">🔒</span></div>
    ${slEcg}
    <span class="sl-pill">⛔ الاشتراك انتهى</span>
    <h1>وحشتنا يا ${first} 💪</h1>
    <p class="sl-sub">اشتراكك في Mofit انتهى يوم <b>${esc(endTxt)}</b>${since>0?` · ${sinceTxt}`:""}.<br>برنامجك وأكلك وصورك وسجلاتك <b>كلها محفوظة</b> – جدّد وارجع كمّل من حيث وقفت.</p>
    ${p.sub_plan?`<div class="sl-plan">💳 باقتك: <b>${esc(p.sub_plan)}</b>${p.sub_price?` · <span class="num">${fmt(p.sub_price)}</span> ج.م`:""}</div>`:""}
    <a class="sl-cta" href="${esc(waLink(waMsg))}" target="_blank" rel="noopener">💬 جدّد على واتساب</a>
    <button class="sl-offers" id="slOffers">💳 شوف العروض والأسعار</button>
    <p class="sl-hint">الكوتش أكّد التجديد؟ اسحب الشاشة لتحت والتطبيق هيشتغل لوحده ✨</p>
    <button class="sl-out" onclick="logout()">تسجيل خروج</button>
  </div>`;
  const off=$("#slOffers"); if(off) off.onclick=()=>{ if(typeof openPlansSheet==="function") openPlansSheet(); };
  window.scrollTo(0,0);
}
if(typeof render==="function"){
  const _renderSub=render;
  render=function(){
    if(subExpiredClient()) return renderSubLock();
    const nv=$("#nav"); if(nv) nv.classList.remove("hidden");
    return _renderSub();
  };
}
})();
