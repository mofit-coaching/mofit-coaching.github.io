/* ======================================================================
   Mofit — barcode food scanner (bc-*): scan a barcode, look it up in the
   coach foods table first (barcode is kept in foods.notes as "باركود <digits>"),
   then online in Open Food Facts and USDA FoodData Central, save the result
   (kcal, macros, minerals, per-row source) and log it. ZXing vendored in ./vendor.
   Only the barcode number leaves the device.

   Open Food Facts data is under ODbL 1.0 — attribution is shown on every
   scanned product card with links (required by the license).
   ======================================================================
   Fallbacks: no camera / permission denied / offline → manual barcode
   entry stays available inside the scanner sheet.
   ====================================================================== */
(function(){
  if(window.__mofitBarcode) return; window.__mofitBarcode=1;
  const SELF=(document.currentScript&&document.currentScript.src)||(document.querySelector('script[src*="barcode.js"]')||{}).src||"barcode.js";
  const V=SELF.replace(/barcode\.js(\?.*)?$/,"")+"vendor/";

  const CSS=`
  .bc-row{margin-top:10px}
  .bc-scanbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:9px;padding:13px;border-radius:16px;border:1.5px dashed var(--acc-line,#FED7AA);background:var(--acc-soft,#FFF7ED);color:var(--acc,#F97316);font-weight:800;font-size:.95rem;cursor:pointer;transition:transform .15s,box-shadow .2s}
  .bc-scanbtn:active{transform:scale(.97)}
  .bc-scanbtn svg{width:22px;height:22px}
  /* scanner overlay */
  .bc-ov{position:fixed;inset:0;z-index:9999;background:#0B1220;display:flex;flex-direction:column;color:#fff}
  .bc-hd{display:flex;align-items:center;justify-content:space-between;padding:calc(12px + env(safe-area-inset-top)) 16px 10px}
  .bc-hd b{font-size:1.05rem}
  .bc-x{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:1.1rem;cursor:pointer}
  .bc-stage{position:relative;flex:1;overflow:hidden;margin:0 16px;border-radius:22px;background:#000;max-height:56vh}
  .bc-stage video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .bc-frame{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
  .bc-corner{position:relative;width:min(70%,300px);aspect-ratio:1.5}
  .bc-corner i{position:absolute;width:34px;height:34px;border:4px solid #F97316;filter:drop-shadow(0 0 8px rgba(249,115,22,.8))}
  .bc-corner i:nth-child(1){top:0;right:0;border-left:none;border-bottom:none;border-radius:0 14px 0 0}
  .bc-corner i:nth-child(2){top:0;left:0;border-right:none;border-bottom:none;border-radius:14px 0 0 0}
  .bc-corner i:nth-child(3){bottom:0;right:0;border-left:none;border-top:none;border-radius:0 0 14px 0}
  .bc-corner i:nth-child(4){bottom:0;left:0;border-right:none;border-top:none;border-radius:0 0 0 14px}
  .bc-laser{position:absolute;right:6%;left:6%;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#FF6B1A 20%,#FFB25E 50%,#FF6B1A 80%,transparent);box-shadow:0 0 14px rgba(249,115,22,.9);animation:bcLaser 2.2s ease-in-out infinite}
  @keyframes bcLaser{0%,100%{top:14%}50%{top:82%}}
  .bc-status{margin:14px 16px 0;text-align:center;font-size:.88rem;color:#CBD5E1;min-height:1.4em}
  .bc-status b{color:#FFA24D}
  .bc-manual{margin:12px 16px 0;display:none;gap:8px}
  .bc-manual.open{display:flex}
  .bc-manual input{flex:1;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.16);border-radius:14px;padding:12px 14px;color:#fff;font-size:1rem;direction:ltr;text-align:center;letter-spacing:2px}
  .bc-manual input::placeholder{color:#8591A8;letter-spacing:0}
  .bc-manual button{border:none;border-radius:14px;padding:0 18px;background:linear-gradient(135deg,#FF5A0A,#FFA24D);color:#fff;font-weight:800;cursor:pointer}
  .bc-actions{display:flex;gap:8px;margin:14px 16px 0}
  .bc-tgl{flex:1;padding:11px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#E6EBF5;font-weight:700;font-size:.85rem;cursor:pointer;text-align:center}
  .bc-tgl.on{background:rgba(249,115,22,.2);border-color:#F97316;color:#FFA24D}
  .bc-note{margin:auto 16px calc(16px + env(safe-area-inset-bottom));text-align:center;font-size:.68rem;color:#8591A8;line-height:1.7}
  .bc-note a{color:#FFA24D;text-decoration:none}
  .bc-spin{display:inline-block;width:15px;height:15px;border:2.5px solid rgba(255,255,255,.25);border-top-color:#F97316;border-radius:50%;animation:bcSp .8s linear infinite;vertical-align:-3px}
  @keyframes bcSp{to{transform:rotate(360deg)}}
  @media(prefers-reduced-motion:reduce){.bc-laser{animation:none;top:48%}.bc-spin{animation:none}}
  /* result card */
  .bc-offbadge{display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:4px 10px;border-radius:99px;background:rgba(249,115,22,.12);color:var(--acc,#F97316);font-size:.72rem;font-weight:800}
  .bc-attr{margin-top:10px;font-size:.68rem;color:var(--slate,#64748B);line-height:1.8;text-align:center}
  .bc-attr a{color:var(--acc,#F97316);font-weight:700;text-decoration:none}
  `;
  const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

  function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  let zxingP=null;
  function zxing(){ if(window.ZXing) return Promise.resolve(window.ZXing); if(!zxingP) zxingP=loadScript(V+"zxing.min.js").then(()=>window.ZXing); return zxingP; }

  const SCAN_SVG=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M11 8v8M15 8v8M18 8v8" stroke-width="1.8"/></svg>`;
  const OFF_ATTR=`القيم الغذائية من <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> — بيانات مفتوحة تحت رخصة <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener">ODbL</a>`;

  /* ---------- local cache of scanned products (barcode -> foods row) ---------- */
  function cacheGet(c){ try{ const m=JSON.parse(localStorage.getItem("offCacheV1")||"{}"); return m[c]||null; }catch(_){ return null; } }
  function cacheSet(c,row){ try{ const m=JSON.parse(localStorage.getItem("offCacheV1")||"{}"); const ks=Object.keys(m); if(ks.length>80) delete m[ks[0]]; m[c]=row; localStorage.setItem("offCacheV1",JSON.stringify(m)); }catch(_){ } }

  /* ---------- Open Food Facts lookup ---------- */
  async function offLookup(code){
    const url="https://world.openfoodfacts.org/api/v2/product/"+encodeURIComponent(code)+".json?fields=code,product_name,product_name_ar,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments";
    const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),9000);
    let j; try{ const r=await fetch(url,{signal:ctl.signal,headers:{accept:"application/json"}}); j=await r.json(); }
    finally{ clearTimeout(to); }
    if(!j||j.status!==1||!j.product) return null;
    const p=j.product, n=p.nutriments||{};
    const kcal=n["energy-kcal_100g"]!=null?+n["energy-kcal_100g"]:(n.energy_100g!=null?+(+n.energy_100g/4.184).toFixed(0):null);
    if(kcal==null) return null;
    const name=(p.product_name_ar||p.product_name||p.product_name_en||"").trim();
    if(!name) return null;
    const r2=v=>v==null?null:Math.round(+v*10)/10;
    return {
      code:String(code), name, brand:(p.brands||"").split(",")[0].trim(),
      packQty:(p.quantity||"").trim(), serving:(p.serving_size||"").trim(), servingQty:num(p.serving_quantity),
      kcal:r2(kcal), protein:r2(n.proteins_100g), carbs:r2(n.carbohydrates_100g), fat:r2(n.fat_100g),
      fiber_g:r2(n.fiber_100g), sodium_mg:gToMg(n.sodium_100g),
      potassium_mg:gToMg(n.potassium_100g), calcium_mg:gToMg(n.calcium_100g), magnesium_mg:gToMg(n.magnesium_100g),
      iron_mg:gToMg(n.iron_100g,2), zinc_mg:gToMg(n.zinc_100g,2),
      src:"Open Food Facts", srcKey:"Open Food Facts "+code, srcUrl:"https://world.openfoodfacts.org/product/"+encodeURIComponent(code)
    };
  }


  /* ---------- helpers: units, barcode variants ---------- */
  function gToMg(v,d){ if(v==null||v==="") return null; const x=+v; if(!isFinite(x)||x<0) return null; return +(x*1000).toFixed(d==null?0:d); }
  function codeVariants(c){
    c=String(c); const out=new Set([c]); const nz=c.replace(/^0+/,"");
    if(nz.length>=8){ out.add(nz); [12,13].forEach(n=>{ if(nz.length<=n) out.add(nz.padStart(n,"0")); }); }
    return [...out];
  }
  const MINCOLS=["fiber_g","sodium_mg","potassium_mg","calcium_mg","magnesium_mg","iron_mg","zinc_mg"];

  /* ---------- 1) the user's own foods table first (barcode lives in notes as "باركود <digits>") ---------- */
  async function dbLookup(code){
    const vs=codeVariants(code);
    try{ /* indexed foods.barcode column first; falls through to the old notes search on a miss or if the column is missing */
      const { data:bc, error:be } = await sb.from("foods").select("*").in("barcode",vs).limit(1);
      if(!be&&bc&&bc.length) return bc[0];
    }catch(_){ }
    try{
      const { data } = await sb.from("foods").select("*").or(vs.map(v=>"notes.ilike.%"+v+"%").join(",")).limit(10);
      if(!data) return null;
      const hit=data.find(r=>{ const m=String(r.notes||"").match(/\d{8,14}/g)||[]; return m.some(x=>vs.includes(x)); });
      return hit||null;
    }catch(_){ return null; }
  }
  function rowToProd(r,code){
    return { code:String(code), name:r.name, brand:r.brand||"", packQty:"", serving:"", servingQty:null,
      kcal:r.kcal, protein:r.protein, carbs:r.carbs, fat:r.fat, fiber_g:r.fiber_g, sodium_mg:r.sodium_mg,
      potassium_mg:r.potassium_mg, calcium_mg:r.calcium_mg, magnesium_mg:r.magnesium_mg, iron_mg:r.iron_mg, zinc_mg:r.zinc_mg,
      fromDb:true, row:r, src:r.source||"قاعدة بياناتك", srcKey:r.mineral_source||null };
  }

  /* ---------- 2) USDA FoodData Central (branded products, searched by GTIN) ---------- */
  const USDA_KEY="DEMO_KEY";
  async function usdaLookup(code){
    for(const v of codeVariants(code).slice(0,3)){
      const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),9000);
      try{
        const r=await fetch("https://api.nal.usda.gov/fdc/v1/foods/search?api_key="+USDA_KEY+"&dataType=Branded&pageSize=5&query="+encodeURIComponent(v),{signal:ctl.signal});
        if(!r.ok) continue; const j=await r.json();
        const f=(j.foods||[]).find(x=>String(x.gtinUpc||"").replace(/^0+/,"")===v.replace(/^0+/,""));
        if(!f) continue;
        const N={}; (f.foodNutrients||[]).forEach(n=>{ N[n.nutrientNumber]=n.value; });
        const kcal=N["208"]; if(kcal==null) continue;
        const r2=x=>x==null?null:Math.round(+x*10)/10;
        return { code:String(code), name:(f.description||"").trim(), brand:(f.brandOwner||f.brandName||"").trim(), packQty:f.packageWeight||"", serving:"", servingQty:(f.servingSizeUnit||"").toLowerCase()==="g"?num(f.servingSize):null,
          kcal:r2(kcal), protein:r2(N["203"]), carbs:r2(N["205"]), fat:r2(N["204"]), fiber_g:r2(N["291"]), sodium_mg:r2(N["307"]),
          potassium_mg:r2(N["306"]), calcium_mg:r2(N["301"]), magnesium_mg:r2(N["304"]), iron_mg:r2(N["303"]), zinc_mg:r2(N["309"]),
          src:"USDA FoodData Central", srcKey:"USDA FoodData Central "+f.fdcId, srcUrl:"https://fdc.nal.usda.gov/fdc-app.html#/food-details/"+f.fdcId+"/nutrients" };
      }catch(_){ } finally{ clearTimeout(to); }
    }
    return null;
  }
  /* try every source in order; the first with calories wins, missing minerals are topped up from the next one */
  async function findProduct(code){
    const row=await dbLookup(code);
    if(row){ const p=rowToProd(row,code);
      if(!MINCOLS.some(k=>p[k]!=null)){ /* own row has no minerals yet: fetch them online (NULL-only) */
        let o=null; try{ o=await offLookup(code); }catch(_){ } if(!o) o=await usdaLookup(code);
        if(o){ p.mineralPatch=o; MINCOLS.forEach(k=>{ if(p[k]==null&&o[k]!=null) p[k]=o[k]; }); p.mineralFrom=o.srcKey; }
      }
      return p; }
    let o=null; try{ o=await offLookup(code); }catch(_){ }
    if(!o){ try{ o=await usdaLookup(code); }catch(_){ } }
    else if(!MINCOLS.some(k=>o[k]!=null)){ const u=await usdaLookup(code).catch(()=>null); if(u&&u.kcal!=null&&Math.abs(u.kcal-o.kcal)<=Math.max(30,o.kcal*0.25)){ MINCOLS.forEach(k=>{ if(o[k]==null&&u[k]!=null) o[k]=u[k]; }); o.srcKey+=" + "+u.srcKey; } }
    return o;
  }

  /* ---------- keep the scanned product in the shared foods table when possible ----------
     Coach accounts can insert; if policies block the insert we still log the item
     with its full macro snapshot, just without a foods row (food_id is omitted). */
  function mineralRec(prod){ const r={}; MINCOLS.forEach(k=>{ if(prod[k]!=null) r[k]=prod[k]; }); return r; }
  async function ensureFoodRow(prod){
    if(prod.fromDb){
      const row=prod.row;
      if(prod.mineralPatch){ /* fill only columns that are NULL in the row, never overwrite */
        const patch={}; MINCOLS.forEach(k=>{ if(row[k]==null&&prod[k]!=null) patch[k]=prod[k]; });
        if(Object.keys(patch).length){ patch.mineral_source=prod.mineralFrom;
          try{ const { data, error }=await sb.from("foods").update(patch).eq("id",row.id).select().single(); if(!error&&data){ cacheSet(prod.code,data); return data; } }catch(_){ } }
        return {...row,...patch};
      }
      cacheSet(prod.code,row); return row;
    }
    const cached=cacheGet(prod.code); if(cached&&cached.kcal!=null) return cached;
    const base={name:prod.brand&&!prod.name.includes(prod.brand)?prod.name+" ("+prod.brand+")":prod.name,
      unit:"جم", kcal:prod.kcal??0, protein:prod.protein??0, carbs:prod.carbs??0, fat:prod.fat??0};
    const mins=mineralRec(prod);
    try{
      const found=await dbLookup(prod.code);
      if(found){ cacheSet(prod.code,found); return found; }
    }catch(_){ }
    try{
      const rec={...base, ...mins, source:prod.src||"Open Food Facts", brand:prod.brand||null, category:"منتجات بالباركود", notes:"باركود "+prod.code, barcode:String(prod.code)};
      if(Object.keys(mins).length) rec.mineral_source=prod.srcKey||prod.src;
      const { data:ins, error } = await sb.from("foods").insert(rec).select().single();
      if(!error&&ins){ cacheSet(prod.code,ins); return ins; }
    }catch(_){ }
    return {...base, ...mins};
  }

  /* ---------- scanner overlay ---------- */
  function openScanner(onCode){
    const ov=document.createElement("div"); ov.className="bc-ov";
    ov.innerHTML=`<div class="bc-hd"><b>امسح باركود المنتج</b><button class="bc-x" aria-label="إغلاق">✕</button></div>
      <div class="bc-stage"><video muted playsinline></video>
        <div class="bc-frame"><div class="bc-corner"><i></i><i></i><i></i><i></i></div><div class="bc-laser"></div></div>
      </div>
      <div class="bc-status">وجّه الكاميرا ناحية الباركود…</div>
      <div class="bc-manual"><input id="bcCode" inputmode="numeric" pattern="[0-9]*" maxlength="14" placeholder="اكتب رقم الباركود"><button id="bcGo">ابحث</button></div>
      <div class="bc-actions"><button class="bc-tgl" id="bcTorch" style="display:none">🔦 فلاش</button><button class="bc-tgl" id="bcMan">⌨️ كتابة الرقم يدوياً</button></div>
      <div class="bc-note">${OFF_ATTR}<br>رقم الباركود بس هو اللي بيتبعت، ومفيش صور بتتحفظ.</div>`;
    document.body.appendChild(ov);
    const video=ov.querySelector("video"), status=ov.querySelector(".bc-status");
    let reader=null, stream=null, closed=false;
    function close(){ closed=true; try{ reader&&reader.reset(); }catch(_){ } try{ stream&&stream.getTracks().forEach(t=>t.stop()); }catch(_){ } ov.remove(); }
    ov.querySelector(".bc-x").onclick=close;
    const manBtn=ov.querySelector("#bcMan"), manBox=ov.querySelector(".bc-manual");
    manBtn.onclick=()=>{ manBox.classList.toggle("open"); manBtn.classList.toggle("on"); if(manBox.classList.contains("open")) ov.querySelector("#bcCode").focus(); };
    function submitManual(){
      const v=(ov.querySelector("#bcCode").value||"").replace(/[^0-9]/g,"");
      if(v.length<8||v.length>14) { status.innerHTML="رقم الباركود بيكون من ٨ لـ ١٤ رقم"; return; }
      close(); onCode(v);
    }
    ov.querySelector("#bcGo").onclick=submitManual;
    ov.querySelector("#bcCode").addEventListener("keydown",e=>{ if(e.key==="Enter") submitManual(); });

    (async()=>{
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ status.innerHTML="الكاميرا مش متاحة في المتصفح ده — <b>اكتب الرقم يدوياً</b> تحت 👇"; manBox.classList.add("open"); manBtn.classList.add("on"); return; }
      let ZX; try{ ZX=await zxing(); }catch(_){ status.innerHTML="الماسح محتاج نت أول مرة — جرّب تاني أو اكتب الرقم يدوياً 👇"; manBox.classList.add("open"); manBtn.classList.add("on"); return; }
      if(closed) return;
      try{
        const hints=new Map();
        hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS,[ZX.BarcodeFormat.EAN_13,ZX.BarcodeFormat.EAN_8,ZX.BarcodeFormat.UPC_A,ZX.BarcodeFormat.UPC_E,ZX.BarcodeFormat.CODE_128]);
        hints.set(ZX.DecodeHintType.TRY_HARDER,true);
        reader=new ZX.BrowserMultiFormatReader(hints,400);
        await reader.decodeFromConstraints({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}},video,(res,err)=>{
          if(closed||!res) return;
          const code=res.getText(); if(!/^[0-9]{8,14}$/.test(code)) return;
          try{ navigator.vibrate&&navigator.vibrate(80); }catch(_){ }
          const c=code; close(); onCode(c);
        });
        stream=video.srcObject;
        const track=stream&&stream.getVideoTracks&&stream.getVideoTracks()[0];
        if(track&&track.getCapabilities&&track.getCapabilities().torch){
          const tb=ov.querySelector("#bcTorch"); tb.style.display="";
          tb.onclick=async()=>{ const on=!tb.classList.contains("on"); try{ await track.applyConstraints({advanced:[{torch:on}]}); tb.classList.toggle("on",on); }catch(_){ } };
        }
      }catch(e){
        const denied=e&&(e.name==="NotAllowedError"||e.name==="SecurityError");
        status.innerHTML=denied?"الكاميرا محتاجة إذن — اسمح لها من إعدادات المتصفح، أو <b>اكتب الرقم يدوياً</b> 👇":"الكاميرا مش راضية تفتح — <b>اكتب الرقم يدوياً</b> 👇";
        manBox.classList.add("open"); manBtn.classList.add("on");
      }
    })();
    return close;
  }

  /* ---------- product result card inside the picker sheet ---------- */
  function showProduct(body, prod, foodRowP, onPick, goBack){
    const quick=[50,100,150,200];
    const servChip=prod.servingQty&&prod.servingQty>0?[Math.round(prod.servingQty)]:[];
    body.innerHTML=`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
      <b style="font-size:1.05rem">${esc(prod.name)}</b>
      ${prod.brand?`<div class="muted" style="margin-top:2px">${esc(prod.brand)}${prod.packQty?" · "+esc(prod.packQty):""}</div>`:""}
      <span class="bc-offbadge">${prod.fromDb?"📚 من قاعدة بياناتك":"🌍 اتعرّف بالباركود · "+esc(prod.src||"")}</span>
      <div class="unitbox"><span class="u">100 جم</span> <span style="color:#CBD5E1;font-size:.8rem">القيم الغذائية لكل 100 جم</span>
        <div class="g4"><div><b class="num">${fmt(prod.kcal)}</b><small>سعرات</small></div><div><b class="num">${fmt(prod.protein,1)}</b><small>بروتين</small></div><div><b class="num">${fmt(prod.carbs,1)}</b><small>كارب</small></div><div><b class="num">${fmt(prod.fat,1)}</b><small>دهون</small></div></div></div>
      ${MINCOLS.some(k=>prod[k]!=null)?`<div class="muted" style="font-size:.78rem;margin:6px 0">${[["fiber_g","ألياف","جم"],["sodium_mg","صوديوم","مجم"],["potassium_mg","بوتاسيوم","مجم"],["calcium_mg","كالسيوم","مجم"],["magnesium_mg","ماغنيسيوم","مجم"],["iron_mg","حديد","مجم"],["zinc_mg","زنك","مجم"]].filter(x=>prod[x[0]]!=null).map(x=>x[1]+" "+fmt(prod[x[0]],1)+" "+x[2]).join(" · ")} <small>(لكل 100 جم)</small></div>`:`<div class="muted" style="font-size:.78rem;margin:6px 0">الأملاح مش متسجلة للمنتج ده لسه</div>`}
      <label class="f">الكمية (جم)</label>
      <div class="stepper"><button data-s="-1">−</button><input id="bcQty" inputmode="decimal" value="${prod.servingQty&&prod.servingQty>0?Math.round(prod.servingQty):100}"><button data-s="1">+</button></div>
      <div class="scroller" style="margin-top:8px">${servChip.length?`<button class="chip" data-q="${servChip[0]}">حصة ${servChip[0]} جم</button>`:""}${quick.map(v=>`<button class="chip" data-q="${v}">${v} جم</button>`).join("")}</div>
      <div class="card" style="background:var(--acc-soft);box-shadow:none;margin:10px 0" id="bcPrev"></div>
      <button class="btn primary block" id="bcAdd">إضافة</button>
      <div class="bc-attr">${prod.src==="USDA FoodData Central"?`القيم من <a href="${esc(prod.srcUrl)}" target="_blank" rel="noopener">USDA FoodData Central</a> (بيانات مفتوحة)`:OFF_ATTR}<br><a href="${esc(prod.srcUrl||("https://world.openfoodfacts.org/product/"+prod.code))}" target="_blank" rel="noopener">صفحة المنتج ↗</a></div>`;
    const qi=body.querySelector("#bcQty");
    const prev=()=>{ const qv=num(qi.value)||0, k=qv/100;
      body.querySelector("#bcPrev").innerHTML=`<div class="between"><b>${fmt(qv,1)} جم</b><b style="color:var(--acc)" class="num">${fmt((prod.kcal||0)*k)} kcal</b></div><div class="muted">بروتين ${fmt((prod.protein||0)*k,1)} · كارب ${fmt((prod.carbs||0)*k,1)} · دهون ${fmt((prod.fat||0)*k,1)} جم</div>`; };
    qi.oninput=prev; prev();
    body.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{ qi.value=Math.max(0,(num(qi.value)||0)+(+b.dataset.s)*10); prev(); });
    body.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ qi.value=b.dataset.q; prev(); });
    body.querySelector("[data-close]").onclick=closeSheet;
    body.querySelector("[data-back]").onclick=goBack;
    const addBtn=body.querySelector("#bcAdd");
    addBtn.onclick=async()=>{
      const qv=num(qi.value); if(!qv||qv<=0) return toast("اكتب الكمية");
      addBtn.disabled=true; addBtn.textContent="بيتسجّل…";
      const food=await foodRowP;
      await onPick(food,qv);
      closeSheet();
    };
  }

  /* ---------- hook the food picker ---------- */
  function wrap(){
    if(typeof window.openFoodPicker!=="function") return false;
    const orig=window.openFoodPicker;
    window.openFoodPicker=function(title,onPick,opts={}){
      const body=orig.call(this,title,onPick,opts)||document.querySelector("#sheetBody");
      const host=(body&&body.querySelector("#fpQ"))||(document.querySelector("#sheetBody #fpQ"));
      if(!host) return body;
      const sheet=host.closest("#sheetBody")||host.parentElement;
      if(sheet.querySelector(".bc-row")) return body;
      const row=document.createElement("div"); row.className="bc-row";
      row.innerHTML=`<button type="button" class="bc-scanbtn">${SCAN_SVG} امسح باركود المنتج</button>`;
      host.insertAdjacentElement("beforebegin",row);
      row.querySelector("button").onclick=()=>{
        openScanner(async(code)=>{
          const sb2=document.querySelector("#sheetBody"); if(!sb2) return;
          sb2.innerHTML=`<div style="text-align:center;padding:40px 0"><span class="bc-spin"></span><div class="muted" style="margin-top:10px">بندور في قاعدتك وعلى الإنترنت على <b class="num">${esc(code)}</b>…</div></div>`;
          let prod=null;
          try{ prod=await findProduct(code); }catch(_){ }
          if(!prod){
            sb2.innerHTML=`<div class="between"><button class="btn sm ghost" data-back>→ رجوع</button><button class="btn sm ghost" data-close>✕</button></div>
              ${emptyBox("🛒","المنتج ده <b class=\"num\">"+esc(code)+"</b> مش موجود في قاعدتك ولا في Open Food Facts ولا USDA<br><small class=\"muted\">ضيفه مرة واحدة وهيتعرّف تلقائي في المرات الجاية.</small>")}
              <label class="f">اسم المنتج</label><input id="bcNm" placeholder="الاسم">
              <div class="g4" style="margin-top:8px"><div><label class="f">سعرات/100جم</label><input id="bcK" inputmode="decimal"></div><div><label class="f">بروتين</label><input id="bcP" inputmode="decimal"></div><div><label class="f">كارب</label><input id="bcC" inputmode="decimal"></div><div><label class="f">دهون</label><input id="bcF" inputmode="decimal"></div></div>
              <button class="btn primary block" id="bcSave" style="margin-top:10px">حفظ واستخدام</button>
              <div class="bc-attr">${OFF_ATTR}</div>`;
            sb2.querySelector("[data-close]").onclick=closeSheet;
            sb2.querySelector("[data-back]").onclick=()=>window.openFoodPicker(title,onPick,opts);
            sb2.querySelector("#bcSave").onclick=()=>{
              const nm=(sb2.querySelector("#bcNm").value||"").trim(), k=num(sb2.querySelector("#bcK").value);
              if(!nm||k==null||k<0) return toast("اكتب الاسم والسعرات");
              const man={code:String(code),name:nm,brand:"",packQty:"",serving:"",servingQty:null,kcal:k,protein:num(sb2.querySelector("#bcP").value)||0,carbs:num(sb2.querySelector("#bcC").value)||0,fat:num(sb2.querySelector("#bcF").value)||0,src:"إدخال يدوي",srcKey:null};
              showProduct(sb2,man,ensureFoodRow(man),onPick,()=>window.openFoodPicker(title,onPick,opts));
            };
            return;
          }
          const foodRowP=ensureFoodRow(prod);
          showProduct(sb2,prod,foodRowP,onPick,()=>window.openFoodPicker(title,onPick,opts));
        });
      };
      return body;
    };
    return true;
  }
  if(!wrap()){
    let tries=0; const iv=setInterval(()=>{ if(wrap()||++tries>40) clearInterval(iv); },250);
  }
})();

