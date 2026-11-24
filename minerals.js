/* Food minerals: shown only when the foods/diet_plan_items tables carry the mineral columns (safe before and after the DB step). */
const MIN_KEYS=[["sodium_mg","🧂 صوديوم","مجم",0],["potassium_mg","🍌 بوتاسيوم","مجم",0],["magnesium_mg","🥬 ماغنيسيوم","مجم",0],["iron_mg","🩸 حديد","مجم",1],["calcium_mg","🥛 كالسيوم","مجم",0],["zinc_mg","🔩 زنك","مجم",1],["fiber_g","🌾 ألياف","جم",1]];
function hasMinCols(o){ return !!o && "sodium_mg" in o; }
function hasMinData(o){ return MIN_KEYS.some(([k])=>o[k]!=null); }
function mineralCalc(food,qty){
  if(!hasMinCols(food)) return {};
  const k=qty/100, out={}; MIN_KEYS.forEach(([key])=>{ out[key]=food[key]==null?null:+(food[key]*k).toFixed(1); }); return out;
}
function mineralLine(food,qty){
  if(!hasMinCols(food)) return "";
  if(!hasMinData(food)) return `<div class="muted" style="margin-top:4px">الأملاح: غير متاحة لهذا الصنف</div>`;
  const c=mineralCalc(food,qty);
  return `<div class="muted" style="margin-top:4px">${MIN_KEYS.filter(([k])=>c[k]!=null).map(([k,l,u,d])=>`${l.replace(/^\S+\s/,"")} ${fmt(c[k],d)}`).join(" · ")} (مجم/جم)</div>`;
}
function sumMinerals(items){
  const tot={}; let missing=0, withData=0;
  items.forEach(i=>{ if(!hasMinCols(i)||!hasMinData(i)){ missing++; return; } withData++; MIN_KEYS.forEach(([k])=>{ if(i[k]!=null) tot[k]=(tot[k]||0)+(+i[k]); }); });
  return {tot,missing,withData};
}
function mineralTotHTML(items){
  if(!items.length||!items.some(hasMinCols)) return "";
  const s=sumMinerals(items);
  if(!s.withData) return `<p class="hint" style="margin-top:10px">الأملاح غير متاحة لأصناف الخطة دي لسه.</p>`;
  return `<div style="margin-top:12px;border-top:1px solid rgba(255,255,255,.15);padding-top:10px"><div style="font-size:.8rem;color:#CBD5E1;margin-bottom:6px">الأملاح والألياف (إجمالي الخطة)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${MIN_KEYS.map(([k,l,u,d])=>`<div style="background:rgba(255,255,255,.08);border-radius:10px;padding:6px 8px;text-align:center"><div style="font-size:.72rem;color:#CBD5E1">${l}</div><b class="num">${s.tot[k]!=null?fmt(s.tot[k],d):"—"}</b> <small style="color:#CBD5E1">${u}</small></div>`).join("")}</div>
    ${s.missing?`<p class="hint" style="margin-top:8px;color:#FBBF24">⚠️ الأملاح ناقصة في ${s.missing} صنف من ${items.length}، فالأرقام دي أقل من الحقيقي.</p>`:""}</div>`;
}
