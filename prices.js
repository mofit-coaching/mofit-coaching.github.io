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
const PLAN_DEFAULTS = [
  {id:"p3",  position:1, months:3,  free_months:1, price:null, old_price:null, currency:"ج.م", badge:null,          note:null, active:true},
  {id:"p6",  position:2, months:6,  free_months:2, price:null, old_price:null, currency:"ج.م", badge:"الأكثر طلباً", note:null, active:true},
  {id:"p12", position:3, months:12, free_months:6, price:null, old_price:null, currency:"ج.م", badge:"أفضل قيمة",   note:null, active:true},
];
const PLAN_FEATURES = ["برنامج تمرين مخصص ليك","نظام غذائي محسوب على هدفك","متابعة أسبوعية مع الكوتش","تطبيق Mofit لتسجيل تمرينك وأكلك","مكملات محسوبة على وزنك"];

function waLink(text){ return `https://wa.me/${COACH_WA}?text=${encodeURIComponent(text)}`; }
function monthsAr(n){ n=+n; return n===1?"شهر":n===2?"شهرين":n<=10?`${n} شهور`:`${n} شهر`; }
function planTitle(p){ return `${monthsAr(p.months)}${p.free_months?` + ${monthsAr(p.free_months)} هدية`:""}`; }
function planPrice(p){ return p.price!==null&&p.price!==undefined&&p.price!==""; }
function planMsg(p, who){
  const total=(+p.months)+(+p.free_months||0);
  return `السلام عليكم كوتش 👋\nعايز أشترك في عرض Mofit:\n✅ ${planTitle(p)} (إجمالي ${monthsAr(total)})`
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
  return `<div class="plans">${plans.map(p=>{ const total=(+p.months)+(+p.free_months||0), pm=perMonth(p);
    return `<a class="plan ${p.badge?"hot":""}" href="${esc(waLink(planMsg(p,who)))}" target="_blank" rel="noopener">
      ${p.badge?`<span class="plan-badge">${esc(p.badge)}</span>`:""}
      <div class="plan-top"><b>${esc(monthsAr(p.months))}</b>${p.free_months?`<span class="plan-free">+ ${esc(monthsAr(p.free_months))} هدية 🎁</span>`:""}</div>
      <div class="plan-total">إجمالي ${esc(monthsAr(total))} متابعة</div>
      <div class="plan-price">${planPrice(p)?`${p.old_price?`<s class="num">${fmt(p.old_price)}</s> `:""}<b class="num">${fmt(p.price)}</b> <small>${esc(p.currency||"ج.م")}</small>`:`<small>تواصل لمعرفة السعر</small>`}</div>
      ${pm?`<div class="plan-pm">يعني <span class="num">${fmt(pm)}</span> ${esc(p.currency||"ج.م")} في الشهر</div>`:""}
      ${p.note?`<div class="plan-note">${esc(p.note)}</div>`:""}
      <span class="plan-cta">اشترك عن طريق واتساب ›</span></a>`; }).join("")}</div>`;
}

/* ---------- public: tab next to login ---------- */
function loginTab(t){
  document.querySelectorAll(".ltab").forEach(b=>b.classList.toggle("on",b.dataset.lt===t));
  $("#loginForm").classList.toggle("hidden",t!=="login"); $("#plansPane").classList.toggle("hidden",t!=="plans");
  if(t==="plans") drawPublicPlans();
}
async function drawPublicPlans(){
  const box=$("#plansBox"); if(!box.dataset.done) box.innerHTML=`<p class="hint">⏳ بيتحمل…</p>`;
  box.innerHTML=plansHTML(await loadPlans()); box.dataset.done=1;
}
(function initLoginTabs(){
  document.querySelectorAll(".ltab").forEach(b=>b.onclick=()=>loginTab(b.dataset.lt));
  const fp=$("#forgotLink"); if(fp) fp.href=waLink("السلام عليكم كوتش، نسيت كلمة السر بتاعة Mofit 🙏\nالإيميل: ");
  const gen=$("#askLink"); if(gen) gen.href=waLink("السلام عليكم كوتش 👋 عندي استفسار عن الاشتراك في Mofit");
  // shareable link: mofit-coaching.github.io/#prices opens the price list directly
  if(/^#(prices|plans|offers)$/i.test(location.hash) || new URLSearchParams(location.search).has("prices")) loginTab("plans");
})();

/* ---------- client: renewal + contact coach ---------- */
async function openPlansSheet(){
  const who=S.client?.full_name||S.me?.full_name||"";
  const body=openSheet(`<div class="between" style="margin-bottom:6px"><b>💳 جدّد اشتراكك</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
    <p class="hint" style="margin-top:0">اختار العرض وهيتبعت للكوتش على واتساب.</p><div id="sheetPlans"><p class="hint">⏳</p></div>`);
  body.querySelector("#sheetPlans").innerHTML=plansHTML(await loadPlans(), who);
}
function contactCoach(){ window.open(waLink(`السلام عليكم كوتش 👋\nأنا ${S.me?.full_name||""} من Mofit\n`),"_blank","noopener"); }

/* ---------- coach editor (clients page) ---------- */
async function coachPricesCard(host){
  const plans=await loadPlans(true), rows=plans.length?plans:PLAN_DEFAULTS;
  const fld=(p,k,label,attrs="")=>`<label class="f">${label}<input data-f="${k}" value="${esc(p[k]??"")}" ${attrs}></label>`;
  host.innerHTML=`<div class="card-h"><div class="ic acc">💰</div><h2>الأسعار والعروض<small>بتظهر في تبويب "الأسعار" جنب تسجيل الدخول</small></h2></div>
    <div id="prRows">${rows.map(p=>`<div class="pr-row" data-id="${esc(p.id)}">
      <label class="row pr-head"><input type="checkbox" data-f="active" ${p.active?"checked":""}><b>${esc(planTitle(p))}</b><span class="muted">${p.active?"ظاهر":"مخفي"}</span></label>
      <div class="grid3">
        ${fld(p,"price","السعر","type=number inputmode=decimal min=0 step=any placeholder='اكتب السعر'")}
        ${fld(p,"old_price","السعر قبل الخصم (اختياري)","type=number inputmode=decimal min=0 step=any")}
        ${fld(p,"currency","العملة","maxlength=10")}
        ${fld(p,"months","عدد الشهور","type=number inputmode=numeric min=1 max=60")}
        ${fld(p,"free_months","شهور هدية","type=number inputmode=numeric min=0 max=60")}
        ${fld(p,"badge","شارة (اختياري)","maxlength=30 placeholder='الأكثر طلباً'")}
      </div>${fld(p,"note","ملاحظة تحت السعر (اختياري)","maxlength=120 placeholder='مثلاً: العرض لحد آخر الشهر'")}</div>`).join("")}</div>
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
function remindLink(c,a){
  const first=(c.full_name||"").split(" ")[0], app=location.origin+location.pathname, t=a?.text||"";
  const body = /البلوك/.test(t) ? `خلّصنا بلوك كامل من البرنامج 🎉 بجهزلك البلوك الجاي – ابعتلي رأيك في البرنامج الحالي: إيه اللي حبيته وإيه اللي تعبك؟`
    : /اشتراك|مدفوع/.test(t) ? `اشتراكك في Mofit ${t}. تحب تجدد؟ العروض هنا 👇\n${app}#prices`
    : /متابعة/.test(t) ? `متنساش تبعت متابعة الأسبوع من التطبيق (الوزن + الصور + إحساسك) 📸\n${app}`
    : /استبيان/.test(t) ? `محتاجك تملا استبيان الصحة في التطبيق عشان نكمّل البرنامج بأمان 🩺\n${app}`
    : /الالتزام|سجّل|سجل|تسجيل|ما سجل/.test(t) ? `وحشتنا تسجيلاتك 💪 يلا نرجع للالتزام النهارده – سجّل تمرينك وأكلك في التطبيق\n${app}`
    : `عايز أطمن عليك بخصوص آخر حاجة سجلتها في التطبيق – كلمني لما تفضى 🙏`;
  return `https://wa.me/${normPhone(c.phone)}?text=${encodeURIComponent(`أهلاً ${first} 👋\n${body}`)}`;
}
