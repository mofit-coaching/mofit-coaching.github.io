/* Food minerals & fiber — per-food values that follow the quantity counter, and daily counters against personal targets.
   Targets: US National Academies DRIs (RDA/AI) by sex & age; fiber 14 g per 1000 kcal of the client's calorie target;
   sodium is an upper limit (CDRR 2,300 mg), everything else is a minimum to reach. */
const MIN_KEYS=[["fiber_g","🌾 ألياف","جم",1],["potassium_mg","🍌 بوتاسيوم","مجم",0],["calcium_mg","🥛 كالسيوم","مجم",0],["magnesium_mg","🥬 ماغنيسيوم","مجم",0],["iron_mg","🩸 حديد","مجم",1],["zinc_mg","🔩 زنك","مجم",1],["sodium_mg","🧂 صوديوم","مجم",0]];
const MIN_WHY={fiber_g:"شبع وهضم وسكر دم مستقر",potassium_mg:"ضغط الدم والعضلات",calcium_mg:"العظام وانقباض العضل",magnesium_mg:"النوم والتشنجات والطاقة",iron_mg:"الأكسجين والمجهود",zinc_mg:"المناعة والتستوستيرون",sodium_mg:"حد أقصى – الزيادة بترفع الضغط وبتحبس مية"};
function hasMinCols(o){ return !!o && "sodium_mg" in o; }
function hasMinData(o){ return !!o && MIN_KEYS.some(([k])=>o[k]!=null); }
function mineralCalc(food,qty){
  if(!hasMinCols(food)) return {};
  const k=qty/100, out={}; MIN_KEYS.forEach(([key])=>{ out[key]=food[key]==null?null:+(food[key]*k).toFixed(key==="iron_mg"||key==="zinc_mg"?2:1); }); return out;
}
function mineralTargets(p,kcal){
  const male=(p&&p.sex)!=="أنثى", age=+(p&&p.age)||30;
  return {
    fiber_g:{v:kcal?Math.round(kcal/1000*14):(male?(age>50?30:38):(age>50?21:25)),max:false},
    potassium_mg:{v:male?3400:2600,max:false},
    calcium_mg:{v:(!male&&age>50)||(male&&age>70)?1200:1000,max:false},
    magnesium_mg:{v:male?(age<=30?400:420):(age<=30?310:320),max:false},
    iron_mg:{v:male?8:(age<=50?18:8),max:false},
    zinc_mg:{v:male?11:8,max:false},
    sodium_mg:{v:2300,max:true},
  };
}
function _minFmt(v,d){ return v==null?"—":fmt(v,d); }
/* one food at the chosen quantity: chips that update with the counter */
function mineralLine(food,qty){
  if(!hasMinCols(food)) return "";
  if(!hasMinData(food)) return `<div class="min-na">الأملاح والألياف: مش متسجلة لهذا الصنف لسه</div>`;
  const c=mineralCalc(food,qty), T=mineralTargets(S&&S.client, (typeof targets==="function"&&S&&S.client)?targets(S.client).kcal:null);
  return `<div class="min-chips">${MIN_KEYS.map(([k,l,u,d])=>{ const v=c[k], t=T[k].v, pc=v==null?null:Math.round(v/t*100);
    return `<div class="min-chip ${T[k].max?"lim":""}"><span>${l}</span><b class="num">${_minFmt(v,d)}</b><small>${u}${pc!=null?` · ${pc}%`:""}</small></div>`; }).join("")}</div>
    <div class="min-src">${food.mineral_source?("المصدر: "+esc(String(food.mineral_source).split(":")[0])):""} · النسبة من احتياجك اليومي</div>`;
}
function sumMinerals(items){
  const tot={}; let missing=0, withData=0;
  items.forEach(i=>{ if(!hasMinCols(i)||!hasMinData(i)){ missing++; return; } withData++; MIN_KEYS.forEach(([k])=>{ if(i[k]!=null) tot[k]=(tot[k]||0)+(+i[k]); }); });
  return {tot,missing,withData};
}
/* daily counters (dark summary card) */
function mineralTotHTML(items,label,p,kcal){
  if(!items.length) return `<div class="min-box"><div class="min-h"><b>الأملاح والألياف</b><small>سجّل أكلك وهتتحسب هنا تلقائياً</small></div></div>`;
  if(!items.some(hasMinCols)) return "";
  const s=sumMinerals(items), T=mineralTargets(p||(S&&S.client),kcal);
  if(!s.withData) return `<p class="hint" style="margin-top:10px">الأملاح غير متاحة للأصناف دي لسه.</p>`;
  const open=localStorage.getItem("mofit_min_open")!=="0";
  const rows=MIN_KEYS.map(([k,l,u,d])=>{ const v=s.tot[k]||0, t=T[k].v, r=t?v/t:0, max=T[k].max;
    const st=max?(r>1?"bad":r>0.8?"warn":"ok"):(r>=0.9?"ok":r>=0.5?"mid":"low");
    const note=max?(r>1?`⚠ زيادة ${fmt(v-t)} ${u}`:`فاضل ${fmt(t-v)} ${u} للحد`):(r>=1?"✓ وصلت":`فاضل ${_minFmt(t-v,d)} ${u}`);
    return `<div class="min-row ${st}" title="${MIN_WHY[k]}"><div class="min-l"><span>${l}</span><span class="num"><b>${_minFmt(v,d)}</b> / ${fmt(t)} ${u}</span></div>
      <div class="min-bar"><i style="width:${Math.min(r,1)*100}%"></i>${max?`<em style="right:${0}"></em>`:""}</div><small>${note}</small></div>`; }).join("");
  const hit=MIN_KEYS.filter(([k])=>!T[k].max&&(s.tot[k]||0)>=T[k].v*0.9).length, need=MIN_KEYS.filter(([k])=>!T[k].max).length;
  return `<details class="min-box" ${open?"open":""} ontoggle="localStorage.setItem('mofit_min_open',this.open?'1':'0')">
    <summary class="min-h"><b>الأملاح والألياف <span class="min-score">${hit}/${need}</span></b><small>${label||"النهارده"} · مقارنة باحتياجك اليومي</small></summary>
    <div class="min-rows">${rows}</div>
    ${s.missing?`<p class="min-miss">⚠️ ${s.missing} صنف من ${items.length} مالوش بيانات أملاح، فالأرقام أقل من الحقيقي.</p>`:""}
    <p class="min-miss" style="opacity:.55">مصادر بيانات الأملاح: Open Food Facts (ODbL) · USDA FoodData Central</p></details>`;
}
