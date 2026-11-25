/* ======================================================================
   Mofit — Prices & offers (الأسعار والعروض)
   - Public: a "الأسعار" tab next to login (no account needed). Tapping an
     offer opens WhatsApp to the coach with that offer pre-written.
   - Coach: edits prices / months / free months / badges from the clients
     page (card "💰 الأسعار والعروض"). Stored in Supabase table price_plans
     (anyone can read active plans; only the coach can write).
   - Client: renewal button inside the app when the subscription is ending.
   ====================================================================== */
const COACH_WA = "201093047225";
/* الباقات: 3 مستويات × 4 مدد. الشهري 300/500/1000 ج.م وخصم الالتزام
   10% (3 شهور) · 15% (6 شهور) · 25% (12 شهر). old_price = سعر الشهري × المدة عشان يظهر "وفّر".
   المستوى بيتحدد من أول حرف في الـid (b/s/v) عشان يفضل شغال حتى بعد ما الكوتش يحفظ من التطبيق. */
const TIER_DEFS = {
  b:{name:"البرنامج",        tag:"برنامجك كامل جوه التطبيق، من غير متابعة", feats:["برنامج تمرين مخصوص ليك","نظام غذائي محسوب على هدفك","المساعد الذكي بيرد على أسئلتك فوراً","تسجيل الخطوات والتقدم في التطبيق","الدوري والتحديات"]},
  s:{name:"المتابعة",        tag:"برنامجك + متابعة الكوتش أسبوعياً",    feats:["كل اللي في باقة البرنامج","متابعة أسبوعية مع الكوتش","شات مباشر مع الكوتش جوه التطبيق","تعديل البرنامج على حسب نتيجتك"]},
  v:{name:"واحد لواحد VIP",  tag:"أعلى مستوى متابعة شخصية",            feats:["كل اللي في باقة المتابعة","متابعة يومية ورد بأولوية خلال ٢٤ ساعة","مراجعة فيديوهات تمارينك وتصحيح الأداء","مكالمة شهرية مع الكوتش"]},
};
const PLAN_DEFAULTS = [
  {id:"b1",  tier:"b", position:0,  months:1,  free_months:0, price:300,  old_price:null,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"b3",  tier:"b", position:1,  months:3,  free_months:0, price:810,  old_price:900,   currency:"ج.م", badge:null,          note:null, active:true},
  {id:"b6",  tier:"b", position:2,  months:6,  free_months:0, price:1530, old_price:1800,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"b12", tier:"b", position:3,  months:12, free_months:0, price:2700, old_price:3600,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"s1",  tier:"s", position:4,  months:1,  free_months:0, price:500,  old_price:null,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"s3",  tier:"s", position:5,  months:3,  free_months:0, price:1350, old_price:1500,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"s6",  tier:"s", position:6,  months:6,  free_months:0, price:2550, old_price:3000,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"s12", tier:"s", position:7,  months:12, free_months:0, price:4500, old_price:6000,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"v1",  tier:"v", position:8,  months:1,  free_months:0, price:1000, old_price:null,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"v3",  tier:"v", position:9,  months:3,  free_months:0, price:2700, old_price:3000,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"v6",  tier:"v", position:10, months:6,  free_months:0, price:5100, old_price:6000,  currency:"ج.م", badge:null,          note:null, active:true},
  {id:"v12", tier:"v", position:11, months:12, free_months:0, price:9000, old_price:12000, currency:"ج.م", badge:null,          note:null, active:true},
];

function waLink(text){ return `https://wa.me/${COACH_WA}?text=${encodeURIComponent(text)}`; }
function monthsAr(n){ n=+n; return n===1?"شهر":n===2?"شهرين":n<=10?`${n} شهور`:`${n} شهر`; }
function planTitle(p){ return `${monthsAr(p.months)}${p.free_months?` + ${monthsAr(p.free_months)} هدية`:""}`; }
function planPrice(p){ return p.price!==null&&p.price!==undefined&&p.price!==""; }
function planTier(p){ return TIER_DEFS[p.tier||""]||TIER_DEFS[(p.id||"")[0]]||null; }
function planMsg(p, who){
  const total=(+p.months)+(+p.free_months||0), t=planTier(p);
  return `السلام عليكم كوتش 👋\nعايز أشترك في ${t?`باقة ${t.name} – `:""}عرض Mofit:\n✅ ${planTitle(p)} (إجمالي ${monthsAr(total)})`
    + (planPrice(p)?`\n💰 السعر: ${fmt(p.price)} ${p.currency||"ج.م"}`:"")
    + (who?`\n👤 ${who}`:"")
    + `\n\nممكن تفاصيل الاشتراك وطريقة الدفع؟`;
}
async function loadPlans(all=false){
  let q=sb.from("price_plans").select("*").order("position"); if(!all) q=q.eq("active",true);
  const { data, error } = await q;
  if(error||!data?.length){ const c=cacheGet("plans"); return error ? (c||PLAN_DEFAULTS) : (data||[]); }
  cacheSet("plans",data); return data;
}

/* ---------- shared offer cards ---------- */
function plansHTML(plans, who){
  if(!plans.length) return `<p class="hint">العروض هتنزل قريب – كلم الكوتش على واتساب.</p>`;
  const perMonth=p=> planPrice(p) ? (+p.price)/((+p.months)+(+p.free_months||0)) : null;
  const card=(p,hot,hidden)=>{ const total=(+p.months)+(+p.free_months||0), pm=perMonth(p), pd=pm?pm/30:null, save=p.old_price&&planPrice(p)&&+p.old_price>+p.price?Math.round((1-(+p.price)/(+p.old_price))*100):0;
    return `<a class="plan ptier-card ${hot?"hot":""}${hidden?" hidden":""}" href="${esc(waLink(planMsg(p,who)))}" target="_blank" rel="noopener">
      ${save>0?`<span class="plan-save">وفّر ${save}%</span>`:""}
      <div class="plan-top"><b>${esc(monthsAr(p.months))}</b>${p.free_months?`<span class="plan-free">+ ${esc(monthsAr(p.free_months))} هدية 🎁</span>`:""}</div>
      <div class="plan-total">إجمالي ${esc(monthsAr(total))} ${planTier(p)===TIER_DEFS.b?"برنامج":"متابعة"}</div>
      <div class="plan-price">${planPrice(p)?`${p.old_price?`<s class="num">${fmt(p.old_price)}</s> `:""}<b class="num">${fmt(p.price)}</b> <small>${esc(p.currency||"ج.م")}</small>`:`<small>تواصل لمعرفة السعر</small>`}</div>
      ${pm?`<div class="plan-pm">يعني <span class="num">${fmt(pm)}</span> ${esc(p.currency||"ج.م")} في الشهر · <b class="num">${fmt(pd,1)}</b> في اليوم</div>`:""}
      ${p.note?`<div class="plan-note">${esc(p.note)}</div>`:""}
      <span class="plan-cta">اشترك عن طريق واتساب ›</span></a>`; };
  if(!plans.every(planTier)) return `<div class="plans">${plans.map(p=>card(p,false,false)).join("")}</div>`;
  /* مدة واحدة فوق (بتغيّر كل الباقات) + 3 كروت: البرنامج · المتابعة (الأكثر طلباً) · VIP */
  const durs=[...new Set(plans.map(p=>+p.months))].sort((x,y)=>x-y), def=durs.includes(6)?6:durs[durs.length-1];
  const uid="pq"+Math.random().toString(36).slice(2,8); PQ[uid]={plans,who,durs};
  return `<div class="pq" id="${uid}">${pqInner(uid,def)}</div>`;
}
/* PQ_NEUTRAL=true بيبدّل كلام المبيعات (الأكثر طلباً / أماكن محدودة) بصياغة محايدة. سطر واحد. */
const PQ_NEUTRAL=true;
const PQ_WORDS=PQ_NEUTRAL
  ? {tag6:"اختيار الكوتش", flagS:"اختيار الكوتش", flagV:"متابعة فردية"}
  : {tag6:"الأكثر طلباً",   flagS:"الأكثر طلباً · متابعة الكوتش", flagV:"VIP · أماكن محدودة"};
const PQ={}, PQ_TAG={1:"تجربة",3:"بداية",6:PQ_WORDS.tag6,12:"أوفر سعر"};
function pqInner(uid,m){
  const { plans, who, durs } = PQ[uid];
  const pick=(k,mm)=>plans.find(p=>planTier(p)===TIER_DEFS[k]&&+p.months===mm);
  const saveOf=p=>p&&p.old_price&&planPrice(p)&&+p.old_price>+p.price?Math.round((1-(+p.price)/(+p.old_price))*100):0;
  const seg=`<div class="pq-seg" role="tablist">${durs.map(d=>`<button type="button" role="tab" class="pq-d${d===m?" on":""}${d===6?" rec":""}" data-uid="${uid}" data-m="${d}"><b>${esc(monthsAr(d))}</b><small>${PQ_TAG[d]||"&nbsp;"}</small></button>`).join("")}</div>`;
  const eyebrow={b:"باقة البرنامج",s:"متابعة مباشرة مع الكوتش",v:"أعلى مستوى متابعة"};
  const flag={b:"",s:PQ_WORDS.flagS,v:PQ_WORDS.flagV};
  const cta={b:"اختار البرنامج",s:"اختار المتابعة",v:"اختار VIP"};
  const cards=Object.keys(TIER_DEFS).map(k=>{ const t=TIER_DEFS[k], p=pick(k,m); if(!p) return "";
    const total=(+p.months)+(+p.free_months||0), pm=planPrice(p)?(+p.price)/total:null, sv=saveOf(p), cur=esc(p.currency||"ج.م");
    return `<div class="pq-card t-${k}" tabindex="0">
      ${(p.badge||flag[k])?`<span class="pq-flag">${esc(p.badge||flag[k])}</span>`:""}
      <small class="pq-k">${esc(eyebrow[k])}</small>
      <div class="pq-h"><b>${esc(t.name)}</b></div><p class="pq-tag">${esc(t.tag)}</p>
      <div class="pq-price">${planPrice(p)?`<span class="cur">${cur}</span><b class="num">${fmt(p.price)}</b><span class="per">/ ${esc(planTitle(p))}</span>`:`<span class="per">تواصل لمعرفة السعر</span>`}</div>
      <div class="pq-sub">${pm?`<span><b class="num">${fmt(pm)}</b> ${cur} في الشهر</span>`:""}${sv?`<s class="num">${fmt(p.old_price)}</s><i>وفّر <bdi dir="ltr">${sv}%</bdi></i>`:""}</div>
      ${pm?`<div class="pq-day">يعني <b class="num">${fmt(pm/30,1)}</b> ${cur} بس في اليوم</div>`:""}
      ${p.note?`<div class="pq-note">${esc(p.note)}</div>`:""}
      <ul class="pq-ul">${t.feats.map((f,i)=>`<li${(k==="v"&&i>=1)||(k==="s"&&i>=1&&i<=2)?` class="hl"`:""}>${esc(f)}</li>`).join("")}</ul>
      <a class="pq-cta" href="${esc(waLink(planMsg(p,who)))}" target="_blank" rel="noopener">${cta[k]} ←</a></div>`; }).join("");
  return seg+`<div class="pq-cards">${cards}</div><p class="pq-pay">💳 الدفع بإنستاباي · واشتراكك بيبدأ يوم استلام برنامجك مش يوم الدفع</p>`;
}
/* الأرقام بتعدّ لحد السعر الجديد (من غير حركة لو الجهاز مطفّي الحركة) */
function pqCount(w){ if(!w||!PQ[w.id]) return; const st=PQ[w.id].prev||(PQ[w.id].prev={}), still=matchMedia("(prefers-reduced-motion:reduce)").matches;
  w.querySelectorAll(".pq-card").forEach(card=>{ const el=card.querySelector(".pq-price b.num"); if(!el) return;
    const to=+String(el.textContent).replace(/,/g,""), k=card.className.match(/t-(\w)/)[1], from=st[k]!=null?st[k]:to*.6; st[k]=to;
    if(still||isNaN(to)||from===to) return; const t0=performance.now(), dur=650;
    (function step(t){ const x=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-x,3); el.textContent=fmt(Math.round(from+(to-from)*e)); if(x<1) requestAnimationFrame(step); else el.textContent=fmt(to); })(t0); }); }
function pqCountAll(){ document.querySelectorAll(".pq").forEach(pqCount); }
document.addEventListener("click",e=>{ const c=e.target.closest(".pq-d"); if(!c||!PQ[c.dataset.uid]) return;
  const w=document.getElementById(c.dataset.uid); if(w){ w.innerHTML=pqInner(c.dataset.uid,+c.dataset.m); pqCount(w); } });

/* ---------- public: tab next to login ---------- */
function loginTab(t){
  document.querySelectorAll(".ltab").forEach(b=>b.classList.toggle("on",b.dataset.lt===t));
  $("#loginForm").classList.toggle("hidden",t!=="login"); $("#plansPane").classList.toggle("hidden",t!=="plans"); $("#signupPane").classList.toggle("hidden",t!=="signup");
  if(t==="plans") drawPublicPlans();
  if(t==="signup" && typeof drawSignup==="function") drawSignup();
}
async function drawPublicPlans(){
  const box=$("#plansBox"); if(!box.dataset.done) box.innerHTML=`<div class="sk-wrap" role="status" aria-label="بيتحمل"><i class="sk sk-b"></i><i class="sk sk-l m"></i><i class="sk sk-l s"></i></div>`;
  box.innerHTML=plansHTML(await loadPlans()); box.dataset.done=1; pqCountAll();
}
(function initLoginTabs(){
  document.querySelectorAll(".ltab").forEach(b=>b.onclick=()=>loginTab(b.dataset.lt));
  const fp=$("#forgotLink"); if(fp) fp.href=waLink("السلام عليكم كوتش، نسيت كلمة السر بتاعة Mofit 🙏\nالإيميل: ");
  const gen=$("#askLink"); if(gen) gen.href=waLink("السلام عليكم كوتش 👋 عندي استفسار عن الاشتراك في Mofit");
  // shareable links: #prices / ?prices opens the price list, #join / ?join=1 the signup form
  const urlTab=()=>{
    let t=null;
    if(/^#(prices|plans|offers)$/i.test(location.hash) || new URLSearchParams(location.search).has("prices")) t="plans";
    if(/^#(join|signup)$/i.test(location.hash) || new URLSearchParams(location.search).has("join")) t="signup";
    return t;
  };
  const applyUrlTab=()=>{ const t=urlTab(); if(t) loginTab(t); };
  applyUrlTab();
  // drawSignup lives in signup.js, which loads AFTER prices.js: at this point the
  // pane toggles open but stays empty. Re-apply once parsing is done so the signup
  // form actually renders on ?join=1 links (loginTab is idempotent).
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",applyUrlTab);
})();

/* ---------- client: renewal + contact coach ---------- */
async function openPlansSheet(){
  const who=S.client?.full_name||S.me?.full_name||"";
  const body=openSheet(`<div class="between" style="margin-bottom:6px"><b>💳 جدّد اشتراكك</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
    <p class="hint" style="margin-top:0">اختار العرض وهيتبعت للكوتش على واتساب.</p><div id="sheetPlans"><div class="sk-wrap" role="status" aria-label="بيتحمل"><i class="sk sk-b"></i><i class="sk sk-l m"></i><i class="sk sk-l s"></i></div></div>`);
  body.querySelector("#sheetPlans").innerHTML=plansHTML(await loadPlans(), who); pqCountAll();
}
function contactCoach(){ window.open(waLink(`السلام عليكم كوتش 👋\nأنا ${S.me?.full_name||""} من Mofit\n`),"_blank","noopener"); }

/* ---------- coach editor (clients page) ---------- */
async function coachPricesCard(host){
  const plans=await loadPlans(true), rows=plans.length?plans:PLAN_DEFAULTS;
  const fld=(p,k,label,attrs="")=>`<label class="f">${label}<input data-f="${k}" value="${esc(p[k]??"")}" ${attrs}></label>`;
  host.innerHTML=`<div class="card-h"><div class="ic acc">💰</div><h2>الأسعار والعروض<small>بتظهر في تبويب "الأسعار" جنب تسجيل الدخول</small></h2></div>
    <div id="prRows">${rows.map(p=>{ const t=planTier(p); return `<div class="pr-row" data-id="${esc(p.id)}">
      <label class="row pr-head"><input type="checkbox" data-f="active" ${p.active?"checked":""}><b>${t?esc(t.name)+" · ":""}${esc(planTitle(p))}</b><span class="muted">${p.active?"ظاهر":"مخفي"}</span></label>
      <div class="grid3">
        ${fld(p,"price","السعر","type=number inputmode=decimal min=0 step=any placeholder='اكتب السعر'")}
        ${fld(p,"old_price","السعر قبل الخصم (اختياري)","type=number inputmode=decimal min=0 step=any")}
        ${fld(p,"currency","العملة","maxlength=10")}
        ${fld(p,"months","عدد الشهور","type=number inputmode=numeric min=1 max=60")}
        ${fld(p,"free_months","شهور هدية","type=number inputmode=numeric min=0 max=60")}
        ${fld(p,"badge","شارة (اختياري)","maxlength=30 placeholder='الأكثر طلباً'")}
      </div>${fld(p,"note","ملاحظة تحت السعر (اختياري)","maxlength=120 placeholder='مثلاً: العرض لحد آخر الشهر'")}</div>`; }).join("")}</div>
    <div class="row" style="gap:8px"><button class="btn primary" style="flex:1" id="prSave">💾 حفظ الأسعار</button>
      <a class="btn" style="text-decoration:none;display:flex;align-items:center" href="./#prices" target="_blank" rel="noopener">👁 معاينة</a></div>
    <p class="hint">لينك صفحة الأسعار تقدر تحطه على صفحة الفيسبوك: <b dir="ltr">mofit-coaching.github.io/#prices</b></p>`;
  host.querySelectorAll('[data-f="active"]').forEach(c=>c.onchange=()=>{ c.parentElement.querySelector(".muted").textContent=c.checked?"ظاهر":"مخفي"; });
  $("#prSave").onclick=async e=>{
    const out=[...host.querySelectorAll(".pr-row")].map((r,i)=>{ const v=k=>r.querySelector(`[data-f="${k}"]`); return {
      id:r.dataset.id, position:i+1, active:v("active").checked,
      price:num(v("price").value), old_price:num(v("old_price").value), currency:v("currency").value.trim()||"ج.م",
      months:parseInt(v("months").value)||0, free_months:parseInt(v("free_months").value)||0,
      badge:v("badge").value.trim()||null, note:v("note").value.trim()||null, updated_at:new Date().toISOString() }; });
    const bad=out.find(p=>p.months<1||p.months>60||p.free_months<0||p.free_months>60||(p.price!==null&&p.price<0)||(p.old_price!==null&&p.old_price<0));
    if(bad) return toast("راجع عدد الشهور والأسعار");
    e.currentTarget.disabled=true;
    const { error } = await sb.from("price_plans").upsert(out,{onConflict:"id"});
    e.currentTarget.disabled=false; if(error) return toast(error.message);
    cacheSet("plans",out.filter(p=>p.active)); toast("✓ اتحفظت الأسعار"); coachPricesCard(host);
  };
}

/* ---------- coach → client WhatsApp reminders ---------- */
function normPhone(v){ let d=String(v||"").replace(/[^0-9]/g,""); if(!d) return null; if(d.startsWith("00")) d=d.slice(2); if(/^01\d{9}$/.test(d)) d="2"+d; return d.length>=8&&d.length<=15?d:null; }
function remindBody(c,a){
  const app=location.origin+location.pathname, t=a?.text||"";
  return /لسه ما سجلش/.test(t) ? `شايف إنك لسه ما سجلت أول تمرين 💪 أول خطوة هي الأصعب – ابدأ بأي يوم النهارده ولو خفيف، ولو محتاج مساعدة قولي وأظبطلك أي حاجة.\n${app}`
    : /البلوك/.test(t) ? `خلّصنا بلوك كامل من البرنامج 🎉 بجهزلك البلوك الجاي – ابعتلي رأيك في البرنامج الحالي: إيه اللي حبيته وإيه اللي تعبك؟`
    : /اشتراك|مدفوع/.test(t) ? `اشتراكك في Mofit ${t}. تحب تجدد؟ العروض هنا 👇\n${app}#prices`
    : /متابعة/.test(t) ? `متنساش تبعت متابعة الأسبوع من التطبيق (الوزن + الصور + إحساسك) 📸\n${app}`
    : /استبيان/.test(t) ? `محتاجك تملا استبيان الصحة في التطبيق عشان نكمّل البرنامج بأمان 🩺\n${app}`
    : /الالتزام|سجّل|سجل|تسجيل|ما سجل|تمرين/.test(t) ? `وحشتنا تسجيلاتك 💪 يلا نرجع للالتزام النهارده – سجّل تمرينك وأكلك في التطبيق\n${app}`
    : `عايز أطمن عليك بخصوص آخر حاجة سجلتها في التطبيق – كلمني لما تفضى 🙏`;
}
function remindLink(c,a){
  const first=(c.full_name||"").split(" ")[0];
  return `https://wa.me/${normPhone(c.phone)}?text=${encodeURIComponent(`أهلاً ${first} 👋\n${remindBody(c,a)}`)}`;
}
async function nudgeClient(c,a,btn){
  const first=(c.full_name||"").split(" ")[0], body=`أهلاً ${first} 👋\n${remindBody(c,a)}`;
  if(!confirm(`نبعت لـ ${c.full_name||"العميل"} في الشات؟\n\n${body}`)) return;
  btn&&(btn.disabled=true);
  const { error } = await sb.from("messages").insert({client_id:c.id, sender_role:chatMine(), body});
  btn&&(btn.disabled=false);
  if(error) return toast("تعذر الإرسال، جرّب تاني");
  btn&&btn.classList.add("sent"); toast("✓ اتبعتت في الشات");
}





