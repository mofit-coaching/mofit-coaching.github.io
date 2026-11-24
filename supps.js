/* ======================================================================
   Mofit — Supplements (المكملات)
   Coach picks supplements per client; the client sees only those, with
   doses computed from their latest logged body weight.

   Dosing rules (safety-first):
   - mode "kg":   dose = perKg × weight, rounded, clamped to [min, max].
                  Used only where the literature doses by body weight
                  (creatine, caffeine, HMB, whey, sodium bicarbonate).
   - mode "fixed": one adult dose regardless of weight. Used for vitamins,
                  minerals and amino acids whose evidence / ULs are per day,
                  not per kg (vit A, E, D, selenium, boron, zinc, Mg, NAC,
                  taurine, glycine, leucine…).
   - cap: hard ceiling for the SUPPLEMENT dose. For nutrients with a UL we
          use the stricter of IOM (US) and EFSA (EU). Food intake adds to
          the UL for A, selenium, zinc, boron, calcium, so a warning shows
          once the supplement alone passes 60% of the cap.
   Coach overrides are blocked above the cap.
   ====================================================================== */

const SUPP_CATS = [["perf","⚡ أداء وعضلات"],["amino","🧬 أحماض أمينية"],["vit","🍊 فيتامينات"],["min","🪨 معادن"],["other","🌿 أخرى"]];

/* unit: g | mg | µg.  ev: A = strong, B = moderate, C = weak/limited */
const SUPPS = [
  /* ---------- performance (weight-based where evidence supports) ---------- */
  {k:"creatine", cat:"perf", ar:"كرياتين مونوهيدرات", en:"Creatine monohydrate", mode:"kg", perKg:0.03, unit:"g", round:0.5, min:3, max:5, cap:10, ev:"A",
    when:"يومياً في أي وقت، مع وجبة", how:"اختياري: تحميل {load} جم/يوم مقسمة على 4 جرعات لمدة 5–7 أيام، بعدها الجرعة اليومية",
    load:0.3, caution:"ممنوع مع مرض كلى. ممكن يزود الوزن 1–2 كجم مية في العضل.", src:"ISSN 2017 · AIS"},
  {k:"caffeine", cat:"perf", ar:"كافيين", en:"Caffeine", mode:"kg", perKg:3, unit:"mg", round:25, min:100, max:400, cap:400, ev:"A",
    when:"قبل التمرين بـ 30–60 دقيقة", how:"ابدأ بنص الجرعة أول مرة. احسب القهوة والبري وركاوت ضمن الجرعة.",
    caution:"ممنوع مع ضغط/قلب/قلق/حمل. ماتاخدهوش بعد العصر عشان النوم. أقصى حاجة 400 مجم/يوم.", src:"ISSN 2021 · EFSA"},
  {k:"hmb", cat:"perf", ar:"HMB", en:"HMB", mode:"kg", perKg:0.038, unit:"g", round:0.5, min:1.5, max:3, cap:6, ev:"C",
    when:"مقسم على 2–3 جرعات مع الأكل", how:"مفيد أكتر للمبتدئين أو وقت التنشيف الشديد",
    caution:"", src:"ISSN 2013"},
  {k:"whey", cat:"perf", ar:"واي بروتين (سكوب)", en:"Whey protein", mode:"kg", perKg:0.4, unit:"g", round:5, min:20, max:40, cap:60, ev:"A",
    when:"بعد التمرين أو كوجبة بروتين", how:"الجرعة دي بروتين صافي للوجبة الواحدة – احسبها من ملصق العلبة. لازم تكون جوه السعرات اليومية.",
    caution:"لو عندك حساسية لاكتوز اختار Isolate.", src:"Schoenfeld & Aragon 2018"},
  {k:"bicarb", cat:"perf", ar:"بيكربونات الصوديوم", en:"Sodium bicarbonate", mode:"kg", perKg:0.3, unit:"g", round:1, min:10, max:30, cap:30, ev:"B",
    when:"قبل تمرين عالي الشدة بـ 60–180 دقيقة مع وجبة كارب", how:"جربه في يوم تمرين عادي الأول – مش قبل بطولة",
    caution:"بيعمل اضطراب معدة. ممنوع مع ضغط عالي أو نظام قليل الصوديوم أو مرض كلى.", src:"ISSN 2021 · AIS"},
  {k:"betaala", cat:"perf", ar:"بيتا ألانين", en:"Beta-alanine", mode:"fixed", dose:3.2, unit:"g", cap:6.4, ev:"A",
    when:"يومياً مقسمة جرعات 1.6 جم مع الأكل", how:"التأثير بيبان بعد 2–4 أسابيع استمرار",
    caution:"تنميل/وخز في الجلد طبيعي ومش خطر – قسّم الجرعة لو مضايقك.", src:"ISSN 2015"},
  {k:"citrulline", cat:"perf", ar:"سيترولين مالات", en:"Citrulline malate", mode:"fixed", dose:6, unit:"g", cap:10, ev:"C",
    when:"قبل التمرين بساعة", how:"", caution:"ممكن يقلل الضغط – حذر مع أدوية الضغط أو النترات.", src:"Gonzalez 2020"},
  /* ---------- amino acids ---------- */
  {k:"leucine", cat:"amino", ar:"ليوسين", en:"Leucine", mode:"fixed", dose:2.5, unit:"g", cap:5, ev:"C",
    when:"مع الوجبة اللي بروتينها قليل", how:"مش محتاجه لو كل وجبة فيها ~0.4 جم بروتين/كجم – الجرعة هنا لكل وجبة، مش أكتر من 3 مرات/يوم",
    caution:"", src:"Morton 2015 · Schoenfeld & Aragon 2018"},
  {k:"glycine", cat:"amino", ar:"جلايسين", en:"Glycine", mode:"fixed", dose:3, unit:"g", cap:10, ev:"C",
    when:"قبل النوم بـ 30–60 دقيقة", how:"لتحسين جودة النوم", caution:"ممنوع مع دواء كلوزابين.", src:"Yamadera 2007"},
  {k:"taurine", cat:"amino", ar:"تورين", en:"Taurine", mode:"fixed", dose:2, unit:"g", cap:3, ev:"C",
    when:"قبل التمرين أو مع الأكل", how:"", caution:"أقصى جرعة مأمونة مدروسة لفترات طويلة 3 جم/يوم. حذر مع أدوية الضغط والليثيوم.", src:"Shao & Hathcock 2008"},
  {k:"nac", cat:"amino", ar:"NAC (أسيتيل سيستين)", en:"N-acetylcysteine", mode:"fixed", dose:600, unit:"mg", cap:1200, ev:"C",
    when:"مرة أو مرتين يومياً بعيد عن التمرين", how:"ماتاخدهوش جنب التمرين على طول – ممكن يقلل تكيّف العضلة",
    caution:"حذر مع الربو، وممنوع مع النيتروجلسرين. ممكن يعمل غثيان.", src:"NIH · Clinical trials"},
  {k:"collagen", cat:"amino", ar:"كولاجين + فيتامين C", en:"Collagen peptides + vit C", mode:"fixed", dose:15, unit:"g", cap:20, ev:"C",
    when:"قبل التمرين بـ 30–60 دقيقة مع 50 مجم فيتامين C", how:"لدعم الأوتار والأربطة – مش بديل للبروتين", caution:"", src:"Shaw 2017"},
  /* ---------- vitamins (fixed adult doses, never weight-scaled) ---------- */
  {k:"vitd", cat:"vit", ar:"فيتامين D3", en:"Vitamin D3", mode:"fixed", dose:50, unit:"µg", cap:100, iu:40, ev:"B",
    when:"مع أكبر وجبة فيها دهون", how:"الأفضل تتحدد الجرعة بعد تحليل 25(OH)D وتتعاد كل 3 شهور",
    caution:"ممنوع مع ارتفاع الكالسيوم أو حصوات أو ساركويد.", src:"IOM/EFSA UL 100 µg"},
  {k:"vita", cat:"vit", ar:"فيتامين A", en:"Vitamin A (retinol)", mode:"fixed", dose:{"ذكر":900,"أنثى":700}, unit:"µg", cap:3000, warnAt:0.6, ev:"C",
    when:"مع وجبة فيها دهون", how:"الجرعة = الاحتياج اليومي كامل (RDA). أغلب الناس بياخدوه من الأكل ومش محتاجين مكمل",
    caution:"⚠ ممنوع للحامل أو اللي بتخطط للحمل (يسبب تشوهات أجنة). ممنوع مع أيزوتريتينوين (Roaccutane) أو مرض كبد. المدخنين: بيتا كاروتين ممنوع.", src:"IOM/EFSA UL 3000 µg"},
  {k:"vite", cat:"vit", ar:"فيتامين E", en:"Vitamin E (α-tocopherol)", mode:"fixed", dose:15, unit:"mg", cap:300, ev:"C",
    when:"مع وجبة فيها دهون", how:"15 مجم = الاحتياج اليومي. الجرعات العالية مالهاش فايدة مثبتة",
    caution:"الجرعات العالية بتزود خطر النزيف – ممنوع مع أدوية السيولة (وارفارين/أسبرين) أو قبل عملية.", src:"EFSA UL 300 mg"},
  {k:"vitc", cat:"vit", ar:"فيتامين C", en:"Vitamin C", mode:"fixed", dose:500, unit:"mg", cap:2000, ev:"C",
    when:"مع الأكل", how:"", caution:"الجرعات العالية ممكن تعمل إسهال أو حصوات كلى.", src:"IOM UL 2000 mg"},
  {k:"b12", cat:"vit", ar:"فيتامين B12", en:"Vitamin B12", mode:"fixed", dose:500, unit:"µg", cap:2000, ev:"B",
    when:"الصبح", how:"مهم للنباتيين ومستخدمي الميتفورمين", caution:"لو بتاخد B-Complex: B6 فيه مايزيدش عن 12 مجم/يوم (أعصاب).", src:"NIH ODS"},
  {k:"k2", cat:"vit", ar:"فيتامين K2 (MK-7)", en:"Vitamin K2 (MK-7)", mode:"fixed", dose:100, unit:"µg", cap:200, ev:"C",
    when:"مع فيتامين D ووجبة فيها دهون", how:"", caution:"⚠ ممنوع تماماً مع الوارفارين.", src:"NIH ODS"},
  /* ---------- minerals ---------- */
  {k:"mg", cat:"min", ar:"ماغنيسيوم (جلايسينات/سترات)", en:"Magnesium (elemental)", mode:"fixed", dose:200, unit:"mg", cap:250, ev:"B",
    when:"بالليل", how:"الجرعة = ماغنيسيوم عنصري (مكتوب على الملصق)، مش وزن الملح كله",
    caution:"ممنوع مع مرض كلى. الأكسيد بيعمل إسهال. بعّده ساعتين عن المضادات الحيوية والغدة.", src:"EFSA UL 250 mg (supplemental)"},
  {k:"zinc", cat:"min", ar:"زنك", en:"Zinc", mode:"fixed", dose:10, unit:"mg", cap:25, warnAt:0.6, ev:"C",
    when:"مع الأكل، بعيد عن الكالسيوم والحديد", how:"لو هتاخده أكتر من شهرين لازم نحط نحاس 1 مجم",
    caution:"الاستخدام الطويل بجرعات عالية بيعمل نقص نحاس وأنيميا.", src:"EFSA UL 25 mg"},
  {k:"selenium", cat:"min", ar:"سيلينيوم", en:"Selenium", mode:"fixed", dose:55, unit:"µg", cap:255, warnAt:0.6, ev:"C",
    when:"مع الأكل", how:"55 µg = الاحتياج اليومي. حبة جوز برازيلي واحدة فيها ~70–90 µg",
    caution:"هامش الأمان ضيق: الزيادة بتعمل تساقط شعر وتكسر ضوافر. جرعات 200 µg مرتبطة بخطر سكر.", src:"EFSA UL 255 µg"},
  {k:"boron", cat:"min", ar:"بورون", en:"Boron", mode:"fixed", dose:3, unit:"mg", cap:10, warnAt:0.6, ev:"C",
    when:"مع الأكل", how:"الأدلة على رفع التستوستيرون ضعيفة",
    caution:"ممنوع للحامل. الجرعات العالية سامة على الجهاز التناسلي.", src:"EFSA UL 10 mg"},
  {k:"calcium", cat:"min", ar:"كالسيوم", en:"Calcium", mode:"fixed", dose:500, unit:"mg", cap:1000, warnAt:0.6, ev:"B",
    when:"مع الأكل، 500 مجم بحد أقصى في المرة", how:"بس لو الأكل مش مكمل 1000 مجم (ألبان قليلة)",
    caution:"حذر مع حصوات الكلى. بعّده عن الحديد والزنك والغدة.", src:"IOM/EFSA UL 2500 mg (total)"},
  /* ---------- other ---------- */
  {k:"omega3", cat:"other", ar:"أوميجا 3 (EPA+DHA)", en:"Omega-3 (EPA+DHA)", mode:"fixed", dose:2, unit:"g", cap:5, ev:"B",
    when:"مع أكبر وجبة", how:"الجرعة = EPA+DHA مع بعض (مش وزن الكبسولة)",
    caution:"حذر مع أدوية السيولة أو قبل عملية.", src:"EFSA 5 g/day"},
  {k:"ashwa", cat:"other", ar:"أشواجاندا (KSM-66)", en:"Ashwagandha extract", mode:"fixed", dose:600, unit:"mg", cap:600, ev:"C",
    when:"بالليل", how:"8 أسابيع وبعدين بريك",
    caution:"⚠ ممنوع للحامل وأمراض الغدة والمناعة الذاتية. فيه تقارير إصابة كبد – وقفه لو حصل اصفرار.", src:"Clinical trials 2019–2021"},
];
const SUPP = Object.fromEntries(SUPPS.map(s=>[s.k,s]));

/* ---------- maths ---------- */
const unitAr = u => u==="g"?"جم":u==="mg"?"مجم":"µg";
function roundTo(v,step){ return Math.round(v/step)*step; }
function suppBaseDose(s, w, sex){
  if(s.mode==="kg"){ if(!w) return null; return Math.min(Math.max(roundTo(s.perKg*w, s.round), s.min), s.max); }
  return typeof s.dose==="object" ? (s.dose[sex] ?? Math.min(...Object.values(s.dose))) : s.dose;
}
/* final dose: coach override wins, but nothing ever exceeds the cap */
function suppDose(s, w, sex, override){
  const base = suppBaseDose(s, w, sex), v = (override!==null && override!==undefined && override!=="") ? +override : base;
  if(v===null || isNaN(v)) return {v:null};
  const capped = s.cap ? Math.min(v, s.cap) : v;
  return { v:capped, base, over:override!==null&&override!==undefined&&override!=="", warn: !!(s.cap && s.warnAt && capped >= s.warnAt*s.cap) };
}
function suppFmt(s, v){
  if(v===null) return "—";
  const d = s.unit==="g" ? (v%1?1:0) : 0;
  return `${fmt(v,d)} ${unitAr(s.unit)}${s.iu?` <small>(${fmt(v*s.iu)} IU)</small>`:""}`;
}
const EV = {A:["good","أدلة قوية"],B:["navy","أدلة متوسطة"],C:["","أدلة محدودة"]};

/* weight used for per-kg doses: latest logged body weight, else start weight */
async function suppWeight(p){
  const { data } = await sb.from("body_logs").select("week,weight").eq("client_id",p.id).not("weight","is",null).order("week",{ascending:false}).limit(1);
  const w = data?.[0]?.weight;
  return w ? {w:+w, src:`آخر وزن مسجّل (أسبوع ${data[0].week})`} : (p.start_weight ? {w:+p.start_weight, src:"وزن البداية"} : {w:null, src:""});
}
async function loadSupps(p){
  const { data, error } = await sb.from("client_supplements").select("*").eq("client_id",p.id).order("position");
  if(error){ S.supps = cacheGet("supps_"+p.id) || []; return S.supps; }
  S.supps = (data||[]).filter(r=>SUPP[r.supp_key]||r.custom_name); cacheSet("supps_"+p.id, S.supps); return S.supps;
}

/* ---------- coach-written (custom) supplements ----------
   supp_key "c_xxxxxxxx" + custom_name / custom_unit. No auto-calculation and no
   cap: the dose is exactly what the coach wrote (his responsibility). */
const isCustom = r => !!(r && r.custom_name && !SUPP[r.supp_key]);
function customKey(){ const c="abcdefghijkmnpqrstuvwxyz23456789", a=new Uint32Array(10); crypto.getRandomValues(a); return "c_"+[...a].map(x=>c[x%c.length]).join(""); }
function customCardHTML(r){
  const dose = r.dose!==null&&r.dose!==undefined ? `${fmt(r.dose,2)} ${esc(r.custom_unit||"")}` : `<small>حسب الكوتش</small>`;
  return `<div class="card supp">
    <div class="card-h"><div class="ic acc">💊</div><h2>${esc(r.custom_name)}<small>من اختيار الكوتش</small></h2>
      <div class="supp-dose num">${dose}</div></div>
    ${r.timing?`<div class="supp-meta"><span>🕒 ${esc(r.timing)}</span></div>`:""}
    ${r.note?`<p class="hint">📝 ${esc(r.note)}</p>`:""}
  </div>`;
}

/* ---------- client view ---------- */
async function viewSupps(el){
  const p=S.client; el.innerHTML=`<div class="card">${emptyBox("⏳","بيتحمل…","","","es-load es-sm")}</div>`;
  const [rows, W, H] = await Promise.all([loadSupps(p), suppWeight(p),
    S.health?.[p.id] ? null : sb.from("health_screens").select("client_id,flagged").eq("client_id",p.id).maybeSingle()]);
  if(H?.data){ S.health = S.health||{}; S.health[p.id] = H.data; }
  el.innerHTML = suppsClientHTML(p, rows, W);
}
function suppsClientHTML(p, rows, W){
  if(!rows.length) return `<div class="card">${emptyBox("💊","لسه مفيش مكملات","الكوتش لسه ما حددلكش مكملات – لو محتاج حاجة اسأله في الشات.")}</div>`;
  if(p.age && +p.age<18) return `<div class="card">${emptyBox("🔒","للبالغين فقط","المكملات دي مخصصة للبالغين – عندك سؤال؟ كلم الكوتش.")}</div>`;
  const flagged = S.health?.[p.id]?.flagged;
  const cards = rows.map(r=>{ if(isCustom(r)) return customCardHTML(r); const s=SUPP[r.supp_key], d=suppDose(s, W.w, p.sex, r.dose), ev=EV[s.ev];
    const how=(s.how||"").replace("{load}", W.w&&s.load? fmt(roundTo(s.load*W.w,1)) : "20");
    return `<div class="card supp">
      <div class="card-h"><div class="ic acc">💊</div><h2>${esc(s.ar)}<small dir="ltr" style="text-align:right">${esc(s.en)}</small></h2>
        <div class="supp-dose num">${d.v===null?`<small>سجّل وزنك</small>`:suppFmt(s,d.v)}</div></div>
      <div class="supp-meta"><span>🕒 ${esc(r.timing||s.when)}</span>${s.mode==="kg"&&!d.over?`<span class="pill navy">محسوبة على وزنك</span>`:""}<span class="pill ${ev[0]}">${ev[1]}</span></div>
      ${how?`<p class="hint">${esc(how)}</p>`:""}
      ${r.note?`<p class="hint">📝 ${esc(r.note)}</p>`:""}
      ${s.caution?`<p class="supp-warn">${esc(s.caution)}</p>`:""}
    </div>`; }).join("");
  return `<div class="card dark"><div class="card-h"><div class="ic">💊</div><h2>المكملات بتاعتك<small>${W.w?`الجرعات محسوبة على ${fmt(W.w,1)} كجم · ${esc(W.src)}`:"سجّل وزنك في تبويب التقدم عشان تتحسب الجرعات"}</small></h2></div>
      <p class="hint" style="margin:0">الجرعات دي يومية لشخص بالغ سليم. الفيتامينات والمعادن جرعتها ثابتة ومش بتزيد مع الوزن عشان أمانها.</p></div>
    ${flagged?`<div class="card tip"><b>🩺 عندك إجابة "أيوه" في الاستبيان الصحي</b><p class="hint" style="margin:4px 0 0">راجع الدكتور أو الصيدلي قبل ما تبدأ أي مكمل.</p></div>`:""}
    ${cards}
    <p class="hint" style="padding:0 6px">⚠ مش بديل عن استشارة طبية. لو حامل، بتاخدي أدوية مزمنة، أو عندك مرض كلى/كبد/قلب/غدة – بلّغ الكوتش وماتبدأش قبل استشارة الدكتور. وقّف أي مكمل لو حصل أعراض غريبة.</p>`;
}

/* ---------- coach editor (⚙️ التحكم → 💊 المكملات) ---------- */
async function setupSupps(el){
  const p=S.client; el.innerHTML=`<div class="card">${emptyBox("⏳","بيتحمل…","","","es-load es-sm")}</div>`;
  const [rows, W] = await Promise.all([loadSupps(p), suppWeight(p)]);
  const cur = Object.fromEntries(rows.map(r=>[r.supp_key,r]));
  el.innerHTML = `<div class="card"><div class="card-h"><div class="ic">💊</div><h2>مكملات ${esc(p.full_name||"العميل")}<small>${W.w?`الوزن المستخدم: ${fmt(W.w,1)} كجم (${esc(W.src)})`:"⚠ مفيش وزن مسجّل – الجرعات بالكيلو مش هتتحسب"}</small></h2></div>
      <p class="hint" style="margin:0">علّم المكملات اللي العميل هيشوفها. سيب خانة الجرعة فاضية عشان تتحسب تلقائياً، أو اكتب جرعة يومية بنفس الوحدة (مايتقبلش أكتر من الحد الأقصى).</p></div>
    ${SUPP_CATS.map(([c,l])=>`<div class="card"><div class="card-h"><h2>${l}</h2></div>
      ${SUPPS.filter(s=>s.cat===c).map(s=>{ const r=cur[s.k], d=suppDose(s,W.w,p.sex,r?.dose);
        return `<div class="supp-row ${r?"on":""}" data-k="${s.k}">
          <label class="row supp-top"><input type="checkbox" data-on ${r?"checked":""}><b>${esc(s.ar)}</b>
            <span class="muted supp-calc">${s.mode==="kg"?`${s.perKg} ${unitAr(s.unit)}/كجم → `:""}${suppFmt(s,suppBaseDose(s,W.w,p.sex))}${s.cap?` · حد أقصى ${fmt(s.cap,1)} ${unitAr(s.unit)}`:""}</span></label>
          <div class="grid3 supp-edit">
            <label class="f">جرعة مخصصة (${unitAr(s.unit)})<input type="number" inputmode="decimal" step="any" min="0" ${s.cap?`max="${s.cap}"`:""} data-dose value="${r?.dose??""}" placeholder="${suppBaseDose(s,W.w,p.sex)??""}"></label>
            <label class="f">التوقيت<input data-timing value="${esc(r?.timing??"")}" placeholder="${esc(s.when)}"></label>
            <label class="f">ملاحظة للعميل<input data-note value="${esc(r?.note??"")}"></label>
          </div>
          ${d.warn&&r?`<p class="supp-warn">الجرعة قريبة من الحد الأقصى – الأكل كمان بيضيف من نفس العنصر.</p>`:""}
        </div>`; }).join("")}</div>`).join("")}
    <div class="card"><div class="card-h"><div class="ic acc">✍️</div><h2>مكملات تكتبها بنفسك<small>أي مكمل أو منتج مش في القايمة – اكتب الاسم والجرعة والوحدة</small></h2></div>
      <div id="custList">${rows.filter(isCustom).map(customRowHTML).join("")}</div>
      <button class="btn block" id="custAdd" type="button">+ إضافة مكمل جديد</button>
      <p class="hint" style="margin:8px 0 0">الجرعة هنا بتظهر للعميل زي ما كتبتها بالظبط (مفيش حساب على الوزن ولا حد أقصى تلقائي) – راجعها كويس.</p></div>
    <button class="btn primary block" id="suppSave">💾 حفظ المكملات</button>
    <details class="card" style="margin-top:14px"><summary><b>👁 معاينة اللي العميل هيشوفه</b></summary><div id="suppPrev" style="margin-top:12px"></div></details>`;
  const preview=()=>{ $("#suppPrev").innerHTML = suppsClientHTML(p, collect(), W); };
  const wireCust=row=>{ row.querySelectorAll("input").forEach(i=>i.oninput=preview); row.querySelector("[data-cdel]").onclick=()=>{ row.remove(); preview(); }; };
  el.querySelectorAll(".cust-row").forEach(wireCust);
  $("#custAdd").onclick=()=>{ const box=$("#custList"); box.insertAdjacentHTML("beforeend", customRowHTML({supp_key:customKey()})); const row=box.lastElementChild; wireCust(row); row.querySelector("[data-cname]").focus(); };
  el.querySelectorAll(".supp-row [data-on]").forEach(cb=>cb.onchange=()=>{ cb.closest(".supp-row").classList.toggle("on",cb.checked); preview(); });
  el.querySelectorAll(".supp-row input:not([data-on])").forEach(i=>i.oninput=preview);
  function collect(){
    return [...el.querySelectorAll(".supp-row:not(.cust-row)")].filter(x=>x.querySelector("[data-on]").checked).map((x,i)=>({
      client_id:p.id, supp_key:x.dataset.k, position:i, dose:num(x.querySelector("[data-dose]").value),
      timing:x.querySelector("[data-timing]").value.trim()||null, note:x.querySelector("[data-note]").value.trim()||null, custom_name:null, custom_unit:null, updated_at:new Date().toISOString() }))
    .concat([...el.querySelectorAll(".cust-row")].filter(x=>x.querySelector("[data-cname]").value.trim()).map(x=>({
      client_id:p.id, supp_key:x.dataset.k, position:0, dose:num(x.querySelector("[data-cdose]").value),
      custom_name:x.querySelector("[data-cname]").value.trim().slice(0,80), custom_unit:x.querySelector("[data-cunit]").value.trim().slice(0,20)||null,
      timing:x.querySelector("[data-ctiming]").value.trim().slice(0,120)||null, note:x.querySelector("[data-cnote]").value.trim().slice(0,300)||null, updated_at:new Date().toISOString() })))
    .map((r,i)=>({...r, position:i}));
  }
  preview();
  $("#suppSave").onclick=async()=>{
    const out=collect();
    const badC=out.find(r=>isCustom(r) && r.dose!==null && (r.dose<0||r.dose>=100000)); if(badC) return toast(`جرعة ${badC.custom_name} مش صحيحة`);
    const bad=out.filter(r=>!isCustom(r)).find(r=>{ const s=SUPP[r.supp_key]; return r.dose!==null && (r.dose<0 || (s.cap && r.dose>s.cap)); });
    if(bad){ const s=SUPP[bad.supp_key]; return toast(`جرعة ${s.ar} أكبر من الحد الأقصى (${fmt(s.cap,1)} ${unitAr(s.unit)})`); }
    const keep=out.map(r=>r.supp_key);
    const del=rows.filter(r=>!keep.includes(r.supp_key)).map(r=>r.supp_key);
    if(del.length){ const { error } = await sb.from("client_supplements").delete().eq("client_id",p.id).in("supp_key",del); if(error) return toast(error.message); }
    if(out.length){ const { error } = await sb.from("client_supplements").upsert(out,{onConflict:"client_id,supp_key"}); if(error) return toast(error.message); }
    toast("✓ اتحفظت المكملات"); setupSupps(el);
  };
}

function customRowHTML(r){
  return `<div class="supp-row on cust-row" data-k="${esc(r.supp_key)}">
    <div class="row" style="gap:8px;align-items:flex-end">
      <label class="f" style="flex:1">اسم المكمل<input data-cname maxlength="80" value="${esc(r.custom_name??"")}" placeholder="مثلاً: أوميجا 3"></label>
      <button class="btn sm danger" type="button" data-cdel title="حذف" style="margin-bottom:10px">✕</button></div>
    <div class="grid3 supp-edit" style="display:grid">
      <label class="f">الجرعة اليومية<input type="number" inputmode="decimal" step="any" min="0" data-cdose value="${r.dose??""}"></label>
      <label class="f">الوحدة<input data-cunit maxlength="20" value="${esc(r.custom_unit??"")}" placeholder="جم / مجم / كبسولة"></label>
      <label class="f">التوقيت<input data-ctiming maxlength="120" value="${esc(r.timing??"")}" placeholder="مع الفطار"></label>
    </div>
    <label class="f">ملاحظة للعميل<input data-cnote maxlength="300" value="${esc(r.note??"")}"></label>
  </div>`;
}
