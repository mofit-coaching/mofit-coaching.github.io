/* ======================================================================
   Mofit — Egyptian food photo picker (es-*): "صوّر أكلك"
   The client photographs their plate, then picks the matching Egyptian
   dish from a curated table and sets the portion. FREE by design:
   - No vision/AI API and no upload: the photo never leaves the phone
     (held in memory only, downscaled on-device, gone when the sheet
     closes). It is a visual reference, not an input to any service.
   - Values are honest estimates: every dish carries per-100g macros with
     its source, and the logged item is labelled "تقدير ≈" so coach and
     client both know it is an approximation, not a lab number.

   Sources used for the table:
   - USDA FoodData Central (fdc.nal.usda.gov): falafel/taameya 333 kcal,
     and ingredient values for recipe-based estimates.
   - FAO / Gulf food-composition tables (Bahrain MoH 2025, built on the
     Jordanian/Lebanese/Kuwaiti tables): ful medames 116-120, mahshi
     75-125, warak enab 125, molokhia w/ chicken ~90 kcal per 100g.
   - Lebanese University lab analysis of Arabic dishes/sweets (2021):
     basbousa ~365, om ali ~250, kunafa ~345-350 kcal per 100g.
   Where sources disagreed, a mid value was taken; home recipes vary
   mostly with oil/ghee, so "تقدير ≈" is always shown.

   Integration: wraps window.openFoodPicker (same pattern as barcode.js)
   and logs through the normal onPick(food, qtyGrams) path — the record
   lands in meal_items with a full macro snapshot, no foods-table writes.
   ====================================================================== */
(function(){
  if(window.__mofitEgyScan) return; window.__mofitEgyScan=1;

  const CSS=`
  .es-row{margin-top:10px}
  .es-openbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:9px;padding:13px;border-radius:16px;border:1.5px dashed var(--acc-line,#FED7AA);background:var(--acc-soft,#FFF7ED);color:var(--acc,#F97316);font-weight:800;font-size:.95rem;cursor:pointer;transition:transform .15s,box-shadow .2s;font-family:inherit}
  .es-openbtn:active{transform:scale(.97)}
  .es-hero{font-size:2.6rem;line-height:1;margin:8px 0 6px}
  .es-cambtn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:15px;margin-top:14px;border-radius:18px;border:2px dashed var(--acc,#F97316);background:var(--acc-soft,#FFF7ED);color:#C2410C;font-weight:800;font-size:1.02rem;cursor:pointer;font-family:inherit;transition:transform .15s}
  .es-cambtn:active{transform:scale(.97)}
  .es-galbtn{width:100%;padding:11px;margin-top:8px;border-radius:14px;border:1.5px solid var(--soft,#E2E8F0);background:transparent;color:var(--ink,#334155);font-weight:700;font-size:.88rem;cursor:pointer;font-family:inherit}
  .es-photowrap{margin-top:12px;position:relative;border-radius:18px;overflow:hidden;border:1.5px solid var(--soft,#E2E8F0)}
  .es-photowrap img{width:100%;max-height:220px;object-fit:cover;display:block}
  .es-retake{position:absolute;top:8px;left:8px;background:rgba(15,23,42,.72);color:#fff;border:none;border-radius:10px;padding:6px 10px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit}
  .es-note{margin:12px 0 0;font-size:.75rem;color:var(--slate,#64748B);text-align:center;line-height:1.8}
  .es-cats{display:flex;gap:6px;overflow-x:auto;padding:10px 2px 6px;-webkit-overflow-scrolling:touch}
  .es-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
  .es-dish{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 6px 10px;border-radius:16px;border:1.5px solid var(--soft,#E2E8F0);background:var(--card,#fff);cursor:pointer;font-family:inherit;text-align:center;transition:transform .12s,border-color .15s}
  .es-dish:active{transform:scale(.96);border-color:var(--acc,#F97316)}
  .es-dish .es-e{font-size:1.7rem;line-height:1.2}
  .es-dish b{font-size:.86rem;color:var(--ink,#0F172A)}
  .es-dish small{font-size:.68rem;color:var(--slate,#64748B)}
  .es-dish .es-k{font-size:.72rem;font-weight:800;color:var(--acc,#F97316);margin-top:3px}
  .es-dishhead{display:flex;gap:10px;align-items:center;margin-top:10px}
  .es-thumb{width:64px;height:64px;border-radius:14px;object-fit:cover;border:1.5px solid var(--soft,#E2E8F0);flex:none}
  .es-srcline{margin-top:10px;font-size:.72rem;color:var(--slate,#64748B);line-height:1.8;background:var(--acc-soft,#FFF7ED);border-radius:12px;padding:8px 10px}
  .es-approx{display:inline-block;background:#FEF3C7;color:#92400E;font-weight:800;font-size:.68rem;border-radius:99px;padding:2px 9px;margin-inline-start:6px;vertical-align:middle}
  .es-meals{display:flex;flex-direction:column;gap:8px;margin-top:8px}
  .es-meal{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:16px;border:1.5px solid var(--soft,#E2E8F0);background:var(--card,#fff);font-weight:800;font-size:.95rem;color:var(--ink,#0F172A);cursor:pointer;font-family:inherit;text-align:start;transition:transform .12s,border-color .15s}
  .es-meal span{font-size:1.3rem}
  .es-meal:active{transform:scale(.98);border-color:var(--acc,#F97316)}
  @media (prefers-color-scheme:dark){
    .es-dish{background:#1E293B;border-color:#334155}
    .es-dish b{color:#F1F5F9}
    .es-galbtn{color:#CBD5E1;border-color:#334155}
    .es-meal{background:#1E293B;border-color:#334155;color:#F1F5F9}
  }
  @media (prefers-reduced-motion:reduce){.es-openbtn,.es-cambtn,.es-dish{transition:none}}`;
  const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

  const SRC_USDA="USDA FoodData Central";
  const SRC_FAO="جداول تركيب الأغذية (FAO/الخليج) + USDA";
  const SRC_EST="محسوبة من مكونات USDA (وصفة متوسطة)";

  /* k/p/c/f per 100g · sv = typical serving grams · sl = serving label */
  const CATS=[["all","الكل"],["fatar","🍳 فطار"],["atbaq","🍲 أطباق"],["ferakh","🍗 فراخ ولحوم"],["sand","🥙 ساندوتشات"],["helo","🍰 حلو"],["genb","🥣 شوربة"]];
  const DISHES=[
    /* فطار */
    {id:"ful",ar:"فول مدمس",en:"Ful medames",e:"🫘",cat:"fatar",sv:250,sl:"طبق",k:120,p:6,c:15,f:4.5,src:SRC_FAO},
    {id:"fulisk",ar:"فول اسكندراني (بالطحينة)",en:"Ful Eskandarani",e:"🫘",cat:"fatar",sv:250,sl:"طبق",k:150,p:5.5,c:13,f:9,src:SRC_EST},
    {id:"taameya",ar:"طعمية",en:"Taameya (falafel)",e:"🧆",cat:"fatar",sv:120,sl:"٥ أقراص",k:333,p:13.3,c:31.8,f:17.8,src:SRC_USDA},
    {id:"omelette",ar:"أومليت بالخضار",en:"Veggie omelette",e:"🍳",cat:"fatar",sv:160,sl:"بيضتين",k:175,p:11,c:3,f:13,src:SRC_EST},
    {id:"shakshuka",ar:"شكشوكة",en:"Shakshuka",e:"🍳",cat:"fatar",sv:250,sl:"طبق",k:110,p:5.5,c:6,f:7,src:SRC_EST},
    {id:"basturma",ar:"بيض بالبسطرمة",en:"Eggs w/ basturma",e:"🍳",cat:"fatar",sv:150,sl:"بيضتين",k:230,p:14,c:2,f:19,src:SRC_EST},
    {id:"gebna",ar:"جبنة قديمة بالطماطم",en:"Aged cheese w/ tomato",e:"🧀",cat:"fatar",sv:100,sl:"٤ معالق",k:250,p:15,c:3,f:20,src:SRC_EST},
    /* أطباق */
    {id:"koshari",ar:"كشري",en:"Koshari",e:"🍛",cat:"atbaq",sv:400,sl:"طبق وسط",k:150,p:4.5,c:24,f:4,src:SRC_EST},
    {id:"macbech",ar:"مكرونة بالبشاميل",en:"Macarona bechamel",e:"🍝",cat:"atbaq",sv:300,sl:"قطعة",k:190,p:7,c:20,f:9,src:SRC_EST},
    {id:"mahshi",ar:"محشي مشكل",en:"Mixed mahshi",e:"🥬",cat:"atbaq",sv:300,sl:"طبق",k:110,p:3.5,c:17,f:3.5,src:SRC_FAO},
    {id:"warak",ar:"ورق عنب",en:"Stuffed vine leaves",e:"🍃",cat:"atbaq",sv:200,sl:"١٠ ورقات",k:125,p:4,c:17,f:2.5,src:SRC_FAO},
    {id:"molokhia",ar:"ملوخية بالفراخ",en:"Molokhia w/ chicken",e:"🍲",cat:"atbaq",sv:300,sl:"طبق (من غير رز)",k:90,p:7,c:4,f:5,src:SRC_FAO},
    {id:"bamia",ar:"بامية باللحمة",en:"Okra w/ beef",e:"🍲",cat:"atbaq",sv:300,sl:"طبق",k:85,p:6,c:6,f:4,src:SRC_EST},
    {id:"fasolia",ar:"فاصوليا باللحمة",en:"White beans w/ beef",e:"🍲",cat:"atbaq",sv:300,sl:"طبق",k:105,p:7,c:9,f:4.5,src:SRC_EST},
    {id:"rozmoamar",ar:"رز معمر",en:"Roz me3ammar",e:"🍚",cat:"atbaq",sv:250,sl:"طبق",k:165,p:4,c:24,f:6,src:SRC_EST},
    {id:"mesaqqa",ar:"مسقعة",en:"Moussaka",e:"🍆",cat:"atbaq",sv:300,sl:"طبق",k:120,p:3,c:9,f:8,src:SRC_EST},
    {id:"fatta",ar:"فتة باللحمة",en:"Fatta w/ beef",e:"🍲",cat:"atbaq",sv:350,sl:"طبق",k:185,p:8,c:18,f:9,src:SRC_EST},
    {id:"roqaq",ar:"رقاق باللحمة",en:"Roqaq w/ minced beef",e:"🥞",cat:"atbaq",sv:250,sl:"قطعة",k:240,p:8,c:22,f:13,src:SRC_EST},
    {id:"goulash",ar:"جلاش باللحمة المفرومة",en:"Goulash w/ beef",e:"🥐",cat:"atbaq",sv:200,sl:"قطعة",k:260,p:9,c:20,f:16,src:SRC_EST},
    /* فراخ ولحوم */
    {id:"ferakh",ar:"فراخ مشوية",en:"Grilled chicken",e:"🍗",cat:"ferakh",sv:250,sl:"ربع فرخة",k:190,p:25,c:1,f:9,src:SRC_EST},
    {id:"panee",ar:"بانية فراخ",en:"Chicken pane",e:"🍗",cat:"ferakh",sv:150,sl:"٣ قطع",k:260,p:18,c:16,f:14,src:SRC_EST},
    {id:"kofta",ar:"كفتة مشوية",en:"Grilled kofta",e:"🍢",cat:"ferakh",sv:150,sl:"٤ أصابع",k:265,p:18,c:3,f:20,src:SRC_EST},
    {id:"kebda",ar:"كبدة اسكندراني",en:"Liver Eskandarani",e:"🥩",cat:"ferakh",sv:200,sl:"طبق",k:180,p:22,c:5,f:7.5,src:SRC_EST},
    {id:"sogo2",ar:"سجق بالطماطم",en:"Sujuk w/ tomato",e:"🌭",cat:"ferakh",sv:150,sl:"طبق",k:280,p:14,c:6,f:22,src:SRC_EST},
    {id:"shawf",ar:"شاورما فراخ",en:"Chicken shawarma",e:"🌯",cat:"ferakh",sv:200,sl:"ساندوتش",k:220,p:14,c:22,f:9,src:SRC_EST},
    {id:"shawm",ar:"شاورما لحمة",en:"Beef shawarma",e:"🌯",cat:"ferakh",sv:200,sl:"ساندوتش",k:250,p:13,c:20,f:14,src:SRC_EST},
    /* ساندوتشات */
    {id:"hawawshi",ar:"حواوشي",en:"Hawawshi",e:"🥙",cat:"sand",sv:250,sl:"رغيف",k:240,p:12,c:26,f:10.5,src:SRC_EST},
    {id:"sandkebda",ar:"ساندوتش كبدة بلدي",en:"Liver sandwich",e:"🥖",cat:"sand",sv:200,sl:"ساندوتش",k:235,p:13,c:26,f:9,src:SRC_EST},
    {id:"sandtaam",ar:"ساندوتش طعمية",en:"Taameya sandwich",e:"🥖",cat:"sand",sv:180,sl:"ساندوتش",k:255,p:8,c:36,f:9,src:SRC_EST},
    {id:"sandful",ar:"ساندوتش فول",en:"Ful sandwich",e:"🥖",cat:"sand",sv:180,sl:"ساندوتش",k:190,p:8,c:30,f:4,src:SRC_EST},
    /* حلو */
    {id:"basbousa",ar:"بسبوسة",en:"Basbousa",e:"🍰",cat:"helo",sv:80,sl:"قطعة",k:360,p:5,c:60,f:11,src:SRC_FAO},
    {id:"konafa",ar:"كنافة",en:"Kunafa",e:"🍥",cat:"helo",sv:100,sl:"قطعة",k:350,p:7,c:46,f:15,src:SRC_FAO},
    {id:"omali",ar:"أم علي",en:"Om Ali",e:"🍮",cat:"helo",sv:200,sl:"كوباية",k:250,p:5,c:28,f:13,src:SRC_FAO},
    {id:"rozlaban",ar:"رز باللبن",en:"Rice pudding",e:"🍚",cat:"helo",sv:150,sl:"كوباية",k:140,p:3.5,c:24,f:3,src:SRC_EST},
    {id:"baklava",ar:"بقلاوة",en:"Baklava",e:"🥮",cat:"helo",sv:60,sl:"قطعة",k:450,p:6,c:48,f:26,src:SRC_EST},
    /* شوربة */
    {id:"shorba",ar:"شوربة عدس",en:"Lentil soup",e:"🥣",cat:"genb",sv:300,sl:"طبق",k:75,p:4.5,c:11,f:1.5,src:SRC_EST}
  ];

  let PHOTO=null; /* dataURL, memory only — never uploaded, never persisted */

  function readPhoto(file,cb){
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{ try{
      const M=1000, w=img.naturalWidth, h=img.naturalHeight, s=Math.min(1,M/Math.max(w,h));
      const cv=document.createElement("canvas"); cv.width=Math.round(w*s); cv.height=Math.round(h*s);
      cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
      PHOTO=cv.toDataURL("image/jpeg",0.72);
    }catch(_){ PHOTO=url; cb(); return; }
      URL.revokeObjectURL(url); cb(); };
    img.onerror=()=>{ URL.revokeObjectURL(url); toast("الصورة مش راضية تتقري، جرّب تانية"); };
    img.src=url;
  }

  function camScreen(title,onPick,opts){
    const body=openSheet(`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
      <div style="text-align:center;margin-top:4px"><div class="es-hero">📸🍲</div>
        <b style="font-size:1.15rem">صوّر أكلك</b>
        <p class="muted" style="margin:6px 0 0">صوّر الطبق وبعدين اختار الأكلة من قايمة الأكل المصري.<br>كل الأرقام <b>تقدير تقريبي ≈</b> من مصادر موثوقة.</p></div>
      <button type="button" class="es-cambtn" id="esCam">📷 افتح الكاميرا</button>
      <button type="button" class="es-galbtn" id="esGal">🖼 اختار صورة من الموبايل</button>
      <input type="file" id="esCamIn" accept="image/*" capture="environment" hidden>
      <input type="file" id="esGalIn" accept="image/*" hidden>
      <div id="esPhoto"></div>
      <button type="button" class="btn primary block" id="esGo" style="margin-top:12px">اختار الأكلة ←</button>
      <p class="es-note">🔒 الصورة بتفضل على موبايلك بس — مش بتترفع ولا بتتخزن في أي حتة.<br>الأكلة مش مصرية؟ دور عليها بالاسم في البحث العادي، أو امسح الباركود.</p>`);
    body.querySelector("[data-close]").onclick=()=>{ PHOTO=null; closeSheet(); };
    body.querySelector("[data-back]").onclick=()=>{ PHOTO=null; window.openFoodPicker(title,onPick,opts); };
    const camIn=body.querySelector("#esCamIn"), galIn=body.querySelector("#esGalIn");
    body.querySelector("#esCam").onclick=()=>camIn.click();
    body.querySelector("#esGal").onclick=()=>galIn.click();
    const drawPhoto=()=>{ body.querySelector("#esPhoto").innerHTML=PHOTO?`<div class="es-photowrap"><img src="${PHOTO}" alt="صورة الأكل"><button type="button" class="es-retake" id="esRe">📷 صوّر من تاني</button></div>`:"";
      const re=body.querySelector("#esRe"); if(re) re.onclick=()=>camIn.click(); };
    const onFile=ev=>{ const f=ev.target.files&&ev.target.files[0]; if(!f) return; readPhoto(f,drawPhoto); };
    camIn.onchange=onFile; galIn.onchange=onFile;
    drawPhoto();
    body.querySelector("#esGo").onclick=()=>pickScreen(title,onPick,opts,"all","");
  }

  function pickScreen(title,onPick,opts,cat,q){
    const body=openSheet(`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
      <div class="between" style="margin-top:6px"><b style="font-size:1.05rem">اختار الأكلة</b>${PHOTO?`<img class="es-thumb" style="width:44px;height:44px" src="${PHOTO}" alt="">`:""}</div>
      <input id="esQ" placeholder="🔍 اكتب اسم الأكلة (عربي أو English)…" style="margin-top:8px" autocomplete="off" value="${esc(q||"")}">
      <div class="es-cats" id="esCats">${CATS.map(([k,l])=>`<button type="button" class="chip ${k===cat?"on":""}" data-c="${k}">${l}</button>`).join("")}</div>
      <div class="es-grid" id="esGrid"></div>
      <p class="es-note">≈ كل الأرقام تقدير تقريبي للحصة المعتادة — بتتغير حسب الوصفة والزيت.</p>`);
    body.querySelector("[data-close]").onclick=()=>{ PHOTO=null; closeSheet(); };
    body.querySelector("[data-back]").onclick=()=>camScreen(title,onPick,opts);
    const grid=body.querySelector("#esGrid"), qi=body.querySelector("#esQ");
    const kPerServe=d=>Math.round(d.k*d.sv/100);
    const draw=()=>{
      const term=(qi.value||"").trim().toLowerCase();
      const list=DISHES.filter(d=>(cat==="all"||d.cat===cat)&&(!term||d.ar.includes(term)||d.en.toLowerCase().includes(term)));
      grid.innerHTML=list.length?list.map(d=>`<button type="button" class="es-dish" data-id="${d.id}"><span class="es-e">${d.e}</span><b>${esc(d.ar)}</b><small lang="en" translate="no">${esc(d.en)}</small><span class="es-k">≈ ${fmt(kPerServe(d))} kcal / ${esc(d.sl)}</span></button>`).join("")
        :emptyBox("🔎","مش موجودة في القايمة","جرّب اسم تاني، أو دور عليها في البحث العادي فوق.","","es-sm");
      grid.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>detailScreen(DISHES.find(d=>d.id===b.dataset.id),title,onPick,opts,cat,qi.value));
    };
    body.querySelectorAll("#esCats [data-c]").forEach(b=>b.onclick=()=>{ cat=b.dataset.c; body.querySelectorAll("#esCats .chip").forEach(x=>x.classList.toggle("on",x===b)); draw(); });
    qi.oninput=draw; draw();
    if(!q) setTimeout(()=>{ try{ qi.focus({preventScroll:true}); }catch(_){}} ,120);
  }

  function detailScreen(d,title,onPick,opts,cat,q){
    const body=openSheet(`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
      <div class="es-dishhead">
        ${PHOTO?`<img class="es-thumb" src="${PHOTO}" alt="صورة الأكل">`:`<span style="font-size:2.2rem">${d.e}</span>`}
        <div><b style="font-size:1.1rem">${esc(d.ar)}</b> <span class="es-approx">≈ تقدير تقريبي</span><br><small class="muted" lang="en" translate="no">${esc(d.en)}</small></div>
      </div>
      <div class="unitbox"><span class="u">${esc(d.sl)} (${fmt(d.sv)} جم)</span> <span style="color:#CBD5E1;font-size:.8rem">القيم التقريبية للحصة</span>
        <div class="g4"><div><b class="num">${fmt(d.k*d.sv/100)}</b><small>سعرات</small></div><div><b class="num">${fmt(d.p*d.sv/100,1)}</b><small>بروتين</small></div><div><b class="num">${fmt(d.c*d.sv/100,1)}</b><small>كارب</small></div><div><b class="num">${fmt(d.f*d.sv/100,1)}</b><small>دهون</small></div></div></div>
      <label class="f">قد إيه من الحصة؟</label>
      <div class="scroller" style="margin-top:4px">${[[0.5,"نص"],[1,"واحدة"],[1.5,"واحدة ونص"],[2,"اتنين"]].map(([v,l])=>`<button type="button" class="chip ${v===1?"on":""}" data-m="${v}">${l}</button>`).join("")}</div>
      <label class="f" style="margin-top:10px">أو بالجرام</label>
      <div class="stepper"><button type="button" data-s="-1">−</button><input id="esQty" inputmode="decimal" value="${d.sv}"><button type="button" data-s="1">+</button></div>
      <div class="card" style="background:var(--acc-soft);box-shadow:none;margin:10px 0" id="esPrev"></div>
      <button type="button" class="btn primary block" id="esAdd">✓ سجّلها</button>
      <div class="es-srcline">📚 المصدر: ${esc(d.src)}.<br>أكل البيت بيختلف حسب الزيت والسمن والحصة — الرقم ده مرجع قريب، مش تحليل معملي.</div>`);
    body.querySelector("[data-close]").onclick=()=>{ PHOTO=null; closeSheet(); };
    body.querySelector("[data-back]").onclick=()=>pickScreen(title,onPick,opts,cat,q);
    const qi=body.querySelector("#esQty");
    const prev=()=>{ const g=num(qi.value)||0, k=g/100;
      body.querySelector("#esPrev").innerHTML=`<div class="between"><b>${fmt(g)} جم</b><b style="color:var(--acc)" class="num">≈ ${fmt(d.k*k)} kcal</b></div><div class="muted">بروتين ≈ ${fmt(d.p*k,1)} · كارب ≈ ${fmt(d.c*k,1)} · دهون ≈ ${fmt(d.f*k,1)} جم</div>`; };
    qi.oninput=()=>{ body.querySelectorAll("[data-m]").forEach(x=>x.classList.remove("on")); prev(); };
    body.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ qi.value=Math.max(0,(num(qi.value)||0)+(+b.dataset.s)*50); prev(); });
    body.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{ body.querySelectorAll("[data-m]").forEach(x=>x.classList.remove("on")); b.classList.add("on"); qi.value=Math.round(d.sv*(+b.dataset.m)); prev(); });
    prev();
    const addBtn=body.querySelector("#esAdd");
    addBtn.onclick=async()=>{
      const g=num(qi.value); if(!g||g<=0) return toast("اكتب الكمية");
      addBtn.disabled=true; addBtn.textContent="بيتسجّل…";
      const food={name:d.ar+" (تقدير ≈)",unit:"جم",kcal:d.k,protein:d.p,carbs:d.c,fat:d.f};
      PHOTO=null;
      await onPick(food,g);
      closeSheet();
    };
  }

  /* ---------- standalone entry: the «📸 صوّر أكلك» button on the home
     nutrition card (تغذية النهارده). Picks the meal, then runs the same
     camera -> dish -> portion flow and logs straight into meal_items. */
  window.egyScanOpen=function(){
    const p=typeof S!=="undefined"&&S.client; if(!p) return;
    const icons=typeof MEAL_ICONS!=="undefined"?MEAL_ICONS:[];
    const n=Math.max(1,Math.min(+p.meals_per_day||3,8));
    const body=openSheet(`<div class="between"><b style="font-size:1.05rem">📸 صوّر أكلك</b><button type="button" class="btn sm ghost" data-close>✕</button></div>
      <p class="muted" style="margin:8px 0 2px">سجّل في أنهي وجبة؟</p>
      <div class="es-meals">${Array.from({length:n},(_,i)=>{ const m=i+1; return `<button type="button" class="es-meal" data-m="${m}"><span>${esc(icons[m-1]||"🍽")}</span>${esc(mealName(p,m))}</button>`; }).join("")}</div>
      <p class="es-note">هتصوّر الأكل وتختار الأكلة من القايمة المصرية — وكل القيم <b>تقدير تقريبي ≈</b></p>`);
    body.querySelector("[data-close]").onclick=closeSheet;
    body.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{
      const m=+b.dataset.m;
      PHOTO=null;
      camScreen("صوّر أكلك — "+mealName(p,m), async(food,qty)=>{
        const logDate=(S.tab==="food"&&S.date)?S.date:today();
        const rec={client_id:p.id,log_date:logDate,meal_no:m,food_name:food.name,unit:food.unit,qty,...foodCalc(food,qty)};
        if(typeof mineralCalc==="function") Object.assign(rec,mineralCalc(food,qty));
        const { error }=await sb.from("meal_items").insert(rec);
        if(error){ toast(error.message); return; }
        toast("✓ اتسجل");
        if(typeof render==="function") render();
      });
    });
  };

  /* ---------- hook the food picker (same pattern as barcode.js) ---------- */
  function wrap(){
    if(typeof window.openFoodPicker!=="function") return false;
    const orig=window.openFoodPicker;
    window.openFoodPicker=function(title,onPick,opts={}){
      const body=orig.call(this,title,onPick,opts)||document.querySelector("#sheetBody");
      const host=(body&&body.querySelector("#fpQ"))||(document.querySelector("#sheetBody #fpQ"));
      if(!host) return body;
      const sheet=host.closest("#sheetBody")||host.parentElement;
      if(sheet.querySelector(".es-row")) return body;
      const row=document.createElement("div"); row.className="es-row";
      row.innerHTML=`<button type="button" class="es-openbtn">📸 صوّر أكلك — أكل مصري</button>`;
      host.insertAdjacentElement("beforebegin",row);
      row.querySelector("button").onclick=()=>{ PHOTO=null; camScreen(title,onPick,opts); };
      return body;
    };
    return true;
  }
  if(!wrap()){
    let tries=0; const iv=setInterval(()=>{ if(wrap()||++tries>40) clearInterval(iv); },250);
  }
})();
