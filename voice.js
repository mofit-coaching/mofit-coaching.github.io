/* MOFIT voice logging - uses the phone's built-in speech recognition (Web Speech API, ar-EG).
   Nothing is sent to MOFIT or any third-party service by this code; the phone's own speech engine does the listening.
   1) Meals: mic in the food picker. Say "200 جرام رز" -> searches "رز" and pre-fills 200.
   2) Sets: mic appears while a set field is focused. Say "8 تكرار 60 كيلو" (+ "RIR 2") -> fills the row. */
(function(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR||window.__mofitVoice) return; window.__mofitVoice=1;
  const $=(s,r=document)=>r.querySelector(s);
  const W={"صفر":0,"واحد":1,"واحده":1,"اتنين":2,"اثنين":2,"اثنان":2,"تلاته":3,"ثلاثه":3,"ثلاثة":3,"تلاتة":3,"اربعه":4,"أربعة":4,"اربعة":4,"خمسه":5,"خمسة":5,"سته":6,"ستة":6,"سبعه":7,"سبعة":7,"تمانيه":8,"تمانية":8,"ثمانيه":8,"ثمانية":8,"تسعه":9,"تسعة":9,"عشره":10,"عشرة":10,"عشرين":20,"تلاتين":30,"اربعين":40,"خمسين":50,"ستين":60,"سبعين":70,"تمانين":80,"تسعين":90,"مية":100,"ميه":100,"مائة":100};
  const clean=t=>String(t||"").replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/٫|،/g,".").replace(/[\u064B-\u065F\u0640]/g,"")
    .split(/\s+/).map(w=>(w in W)?String(W[w]):w).join(" ").replace(/\s+/g," ").trim();
  const NUM="(\\d+(?:\\.\\d+)?)";
  function parseSet(raw){
    let t=clean(raw).toLowerCase(), out={};
    const half=/(^|\s)ونص(\s|$)/.test(t); t=t.replace(/(^|\s)ونص(?=\s|$)/g," ");
    let m;
    if((m=t.match(new RegExp("(?:rir|ار اي ار|ريب|احتياطي|احتياطى)\\s*"+NUM)))){ out.rir=Math.min(5,Math.round(+m[1])); t=t.replace(m[0]," "); }
    if((m=t.match(new RegExp(NUM+"\\s*(?:تكرار|تكرارات|عده|عدات|عدة|مره|مرات|عد|reps?|rep)")))){ out.reps=Math.round(+m[1]); t=t.replace(m[0]," "); }
    if((m=t.match(new RegExp(NUM+"\\s*(?:كيلو|كجم|كج|kg|كيلوجرام)")))){ out.weight=+m[1]+(half?0.5:0); t=t.replace(m[0]," "); }
    const rest=(t.match(new RegExp(NUM,"g"))||[]).map(Number);
    if(out.reps==null&&rest.length){ out.reps=Math.round(rest.shift()); }
    if(out.weight==null&&rest.length){ out.weight=rest.shift()+(half?0.5:0); }
    return out;
  }
  function parseFood(raw){
    let t=clean(raw), qty=null, m;
    if((m=t.match(new RegExp(NUM+"\\s*(?:جرام|جم|غرام|جرامات|g|حبه|حبة|حبات|ملعقه|ملعقة|كوب|شريحه|شريحة)?")))&&m[1]){ qty=+m[1]; t=t.replace(m[0]," "); }
    t=(" "+t+" ").replace(/\s(?:اكلت|كلت|عايز|عاوز|ضيف|سجل|اضف|أضف|جرام|جم|غرام)(?=\s)/g," ").replace(/\s+/g," ").trim();
    return {term:t,qty};
  }
  const css=document.createElement("style"); css.textContent=`
  .vc-mic{border:0;border-radius:50%;width:42px;height:42px;font-size:1.15rem;background:var(--acc,#F97316);color:#fff;box-shadow:0 4px 14px rgba(249,115,22,.4);cursor:pointer;flex:none;display:inline-flex;align-items:center;justify-content:center;transition:transform .15s}
  .vc-mic:active{transform:scale(.92)}
  .vc-mic.on{background:#DC2626;animation:vcPulse 1s infinite}
  @keyframes vcPulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}100%{box-shadow:0 0 0 16px rgba(220,38,38,0)}}
  .vc-float{position:fixed;inset-inline-start:14px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:60;width:52px;height:52px;font-size:1.35rem}
  .vc-row{display:flex;gap:8px;align-items:center;margin-top:10px}.vc-row input{margin:0!important;flex:1}
  @media (prefers-reduced-motion:reduce){.vc-mic.on{animation:none}}`;
  document.head.appendChild(css);
  const toast_=m=>{ try{ toast(m); }catch(e){} };
  let active=null;
  function listen(btn,onText){
    if(active){ try{ active.stop(); }catch(e){} return; }
    const r=new SR(); r.lang="ar-EG"; r.interimResults=false; r.maxAlternatives=1; active=r; btn.classList.add("on");
    const done=()=>{ active=null; btn.classList.remove("on"); };
    r.onresult=e=>{ const t=e.results[0]&&e.results[0][0]&&e.results[0][0].transcript; if(t) onText(t); };
    r.onerror=e=>{ done(); toast_(e.error==="not-allowed"||e.error==="service-not-allowed"?"فعّل المايك والتعرف على الصوت من إعدادات الموبايل":"ما سمعتش كويس، جرّب تاني"); };
    r.onend=done;
    try{ r.start(); toast_("🎤 اتكلم دلوقتي…"); }catch(e){ done(); }
  }
  const fire=(el,v)=>{ el.value=v; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); };
  let pendingQty=null;

  /* --- meals: mic in the food picker --- */
  function wireFood(){
    const q=$("#fpQ"); if(!q||q.dataset.vc) return; q.dataset.vc=1;
    const wrap=document.createElement("div"); wrap.className="vc-row"; q.parentNode.insertBefore(wrap,q); wrap.appendChild(q);
    const b=document.createElement("button"); b.type="button"; b.className="vc-mic"; b.textContent="🎤"; b.setAttribute("aria-label","سجّل بالصوت"); wrap.appendChild(b);
    b.onclick=()=>listen(b,t=>{ const p=parseFood(t); pendingQty=p.qty; fire(q,p.term||clean(t)); toast_("🎤 "+(p.term||t)+(p.qty?" · "+p.qty:"")); });
  }
  function fillQty(){ const qi=$("#fpQty"); if(qi&&pendingQty!=null&&!qi.dataset.vq){ qi.dataset.vq=1; fire(qi,String(pendingQty)); pendingQty=null; } }

  /* --- sets: floating mic while a set field is focused --- */
  let fb=null, lastRow=null, hideT;
  function floatBtn(){ if(fb) return fb; fb=document.createElement("button"); fb.type="button"; fb.className="vc-mic vc-float"; fb.textContent="🎤"; fb.hidden=true; fb.setAttribute("aria-label","سجّل المجموعة بالصوت");
    fb.addEventListener("pointerdown",e=>e.preventDefault());
    fb.onclick=()=>{ const row=lastRow; if(!row) return; listen(fb,t=>{ const p=parseSet(t), got=[];
      const set=(k,v)=>{ const el=row.querySelector('[data-k="'+k+'"]'); if(el&&v!=null&&!isNaN(v)){ fire(el,String(v)); return true; } };
      if(set("reps",p.reps)) got.push(p.reps+" عدة"); if(set("weight",p.weight)) got.push(p.weight+" كجم"); if(set("rir",p.rir)) got.push("RIR "+p.rir);
      toast_(got.length?"✓ "+got.join(" × "):"ما فهمتش الأرقام، قول مثلاً: ٨ تكرار ٦٠ كيلو"); }); };
    document.body.appendChild(fb); return fb; }
  document.addEventListener("focusin",e=>{ const row=e.target.closest&&e.target.closest(".set"); if(row&&e.target.matches("[data-k]")){ lastRow=row; clearTimeout(hideT); floatBtn().hidden=false; } });
  document.addEventListener("focusout",e=>{ if(e.target.closest&&e.target.closest(".set")){ hideT=setTimeout(()=>{ if(fb&&!active&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest(".set"))) fb.hidden=true; },4000); } });

  new MutationObserver(()=>{ wireFood(); fillQty(); }).observe(document.body,{childList:true,subtree:true});
  window.mofitParseSet=parseSet; window.mofitParseFood=parseFood;
})();
