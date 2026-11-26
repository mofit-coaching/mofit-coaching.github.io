/* ======================================================================
   MOFIT خطة الدايت PDF: زرار "📄 حمّل الخطة PDF" في صفحة التغذية.
   - بيطبع خطة الكوتش (diet_plan_items) كصفحة A4 عربي RTL: كل وجبة بأصنافها
     وكمياتها وسعراتها، وإجمالي الخطة. الأرقام كلها من بيانات الخطة نفسها.
   - الطباعة من المتصفح: "حفظ كـ PDF" / مشاركة على الآيفون. بدون مكتبات.
   - Read-only: مفيش أي كتابة على قاعدة البيانات.
   ====================================================================== */
(function(){
const CSS=`.dp-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:0 0 12px;padding:12px 16px;border-radius:16px;border:1.5px solid var(--acc,#F97316);background:var(--acc-soft,#FFEDD5);color:#C2410C;font-weight:800;font-size:.9rem;font-family:inherit;cursor:pointer;position:relative;overflow:hidden;transition:transform .18s cubic-bezier(.2,1.4,.4,1)}
.dp-btn:active{transform:scale(.97)}.dp-btn.busy{opacity:.6;pointer-events:none}
.dp-btn::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-120%);animation:dpshine 3.2s ease-in-out infinite}
@keyframes dpshine{to{transform:translateX(120%)}}
@media (prefers-color-scheme: dark){.dp-btn{color:#FFB35C;background:rgba(249,115,22,.14)}.dp-btn::after{background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.12) 50%,transparent 70%)}}
@media (prefers-reduced-motion:reduce){.dp-btn::after{animation:none}}`;
const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

const N=(v,d)=>{ const n=+v; return isFinite(n)?n.toLocaleString("ar-EG",{maximumFractionDigits:d==null?0:d}):"—"; };
const PCSS=`@page{size:A4;margin:14mm}*{box-sizing:border-box}
body{font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:#0F172A;margin:0;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hd{background:#0B1220;color:#fff;border-radius:14px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #F97316}
.hd b{font-family:Outfit,sans-serif;font-size:26px;letter-spacing:1px}.hd b i{color:#F97316;font-style:normal}
.hd small{display:block;opacity:.75;font-size:12px;margin-top:2px}
h1{font-size:18px;margin:16px 0 4px}.sub{color:#64748B;font-size:12px;margin-bottom:10px}
.tot{display:flex;gap:8px;margin:10px 0 14px}.tot div{flex:1;border:1.5px solid #E2E8F0;border-radius:12px;padding:8px;text-align:center}
.tot b{display:block;font-size:17px;color:#EA580C}.tot span{font-size:11px;color:#64748B}
.meal{border:1.5px solid #E2E8F0;border-radius:14px;margin-bottom:10px;overflow:hidden;break-inside:avoid}
.meal h2{margin:0;background:#FFF7ED;padding:8px 14px;font-size:14px;display:flex;justify-content:space-between}
.meal h2 span{color:#64748B;font-size:11px;font-weight:600}
table{width:100%;border-collapse:collapse;font-size:12.5px}td,th{padding:6px 14px;text-align:right;border-top:1px solid #F1F5F9}
th{font-size:11px;color:#64748B;background:#F8FAFC}td.n,th.n{text-align:center;white-space:nowrap}
.ft{margin-top:12px;font-size:11px;color:#94A3B8;text-align:center}`;

async function build(p){
  const { data, error }=await sb.from("diet_plan_items").select("*").eq("client_id",p.id).order("meal_no").order("position");
  if(error) throw error;
  const plan=data||[]; if(!plan.length) return null;
  const meals=Math.max(1,Math.min(+p.meals_per_day||3,8)), t=targets(p), tot=sumMacros(plan);
  const maxMeal=Math.max(meals,...plan.map(i=>+i.meal_no||1));
  let h="";
  for(let m=1;m<=maxMeal;m++){
    const mp=plan.filter(i=>+i.meal_no===m); if(!mp.length) continue;
    const s=sumMacros(mp);
    h+=`<div class="meal"><h2><b>${MEAL_ICONS[m-1]||"🍽"} ${esc(mealName(p,m))}</b><span>${N(s.kcal)} سعر</span></h2><table><tr><th>الصنف</th><th class="n">الكمية</th><th class="n">سعرات</th><th class="n">بروتين</th><th class="n">كارب</th><th class="n">دهون</th></tr>`+
      mp.map(i=>`<tr><td>${esc(i.food_name)}${i.notes?`<br><small style="color:#64748B">${esc(i.notes)}</small>`:""}</td><td class="n">${N(i.qty,2)} ${esc(i.unit||"جم")}</td><td class="n">${N(i.kcal)}</td><td class="n">${N(i.protein,1)}</td><td class="n">${N(i.carbs,1)}</td><td class="n">${N(i.fat,1)}</td></tr>`).join("")+`</table></div>`;
  }
  const goal=(v,u)=>v?` <span>من ${N(v)}${u||""}</span>`:"";
  const date=new Date().toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"});
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>خطة-الدايت-${esc(p.full_name||"")}</title><link rel="stylesheet" href="${new URL("fonts.css",document.baseURI).href}"><style>${PCSS}</style></head><body>
  <div class="hd"><div><b>MO<i>FIT</i></b><small>خطة التغذية</small></div><div style="text-align:left"><b style="font-size:16px;font-family:inherit">${esc(p.full_name||"")}</b><small>${date}</small></div></div>
  <h1>خطة الأكل اليومية</h1><div class="sub">${maxMeal} وجبات · الأرقام محسوبة من أصناف الخطة</div>
  <div class="tot"><div><b>${N(tot.kcal)}</b><span>سعر حراري${t.kcal?" · الهدف "+N(t.kcal):""}</span></div><div><b>${N(tot.P)}</b><span>بروتين جم${t.P?" · الهدف "+N(t.P):""}</span></div><div><b>${N(tot.C)}</b><span>كارب جم${t.C?" · الهدف "+N(t.C):""}</span></div><div><b>${N(tot.F)}</b><span>دهون جم${t.F?" · الهدف "+N(t.F):""}</span></div></div>
  ${h}<div class="ft">MOFIT · تابع تقدمك من التطبيق</div></body></html>`;
}

function printHtml(html){
  const f=document.createElement("iframe"); f.setAttribute("aria-hidden","true");
  f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const d=f.contentWindow.document; d.open(); d.write(html); d.close();
  const go=()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){ const w=window.open(); if(w){ w.document.write(html); w.document.close(); setTimeout(()=>w.print(),600); } } setTimeout(()=>f.remove(),60000); };
  const fonts=f.contentWindow.document.fonts; (fonts&&fonts.ready?Promise.race([fonts.ready,new Promise(r=>setTimeout(r,1800))]):Promise.resolve()).then(()=>setTimeout(go,150));
}

async function run(btn){
  const p=S.client; if(!p) return;
  btn.classList.add("busy");
  try{ const html=await build(p); if(!html) toast("الخطة فاضية، مفيش حاجة تتطبع"); else { toast("📄 جاهزة - اختار «حفظ كـ PDF» أو مشاركة"); printHtml(html); } }
  catch(e){ toast("تعذر تجهيز الملف، جرّب تاني"); }
  btn.classList.remove("busy");
}

const _rm=renderMeals;
renderMeals=async function(el,opts){
  const r=await _rm.apply(this,arguments);
  try{
    if(el&&el.isConnected&&!el.querySelector(".dp-btn")){
      const tot=el.querySelector("#fTot");
      if(tot){ const b=document.createElement("button"); b.type="button"; b.className="dp-btn"; b.textContent="📄 حمّل خطة الدايت PDF"; b.onclick=()=>run(b); tot.insertAdjacentElement("afterend",b); }
    }
  }catch(e){}
  return r;
};
})();
