/* ======================================================================
   Mofit — buttery swipe carousels (mf-sw-*): upgrades the app's horizontal
   sliders to Swiper 11 (MIT, vendored in ./vendor, lazy-loaded with its CSS
   the first time a slider is on screen). Pure runtime enhancement — it
   watches the DOM and upgrades sliders as views render them, so no other
   file changes and every view keeps working if Swiper fails to load.

   Upgraded surfaces:
   - Landing testimonials  #scq        → centered slides, autoplay, dots
   - Training week cards   #dayCards   → free-mode momentum, snap to picked day
   - Photo compare rails   .pp-rail    → free-mode momentum
   ======================================================================
   Originals stay in the DOM as swiper slides (same classes/listeners); the
   old scroll containers keep their ids so existing lookups keep working.
   ====================================================================== */
(function(){
  if(window.__mofitSwiper) return; window.__mofitSwiper=1;
  const SELF=(document.currentScript&&document.currentScript.src)||(document.querySelector('script[src*="swiper.js"]')||{}).src||"swiper.js";
  const V=SELF.replace(/swiper\.js(\?.*)?$/,"")+"vendor/";

  const CSS=`
  .mf-sw{overflow:hidden}
  .mf-sw .swiper-slide{width:auto;height:auto}
  .mf-quotes .swiper-slide{width:82%}
  .mf-quotes{padding-bottom:26px}
  .mf-quotes .swiper-pagination{bottom:0;display:flex;justify-content:center;gap:6px}
  .mf-quotes .swiper-pagination-bullet{width:6px;height:6px;border-radius:9px;background:rgba(255,255,255,.22);opacity:1;transition:.3s;margin:0!important}
  .mf-quotes .swiper-pagination-bullet-active{width:20px;background:#FF6B1A}
  .mf-days .swiper-slide:first-child{margin-inline-start:2px}
  .mf-rail{padding:2px}
  `;
  const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

  let libP=null;
  function lib(){
    if(window.Swiper) return Promise.resolve(window.Swiper);
    if(!libP) libP=(async()=>{
      if(!document.querySelector('link[href*="swiper-bundle"]')){
        const l=document.createElement("link"); l.rel="stylesheet"; l.href=V+"swiper-bundle.min.css"; document.head.appendChild(l);
      }
      await new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=V+"swiper-bundle.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      return window.Swiper;
    })().catch(()=>null);
    return libP;
  }

  const live=new Map(); // container element -> Swiper instance

  function convert(el, cls, opts){
    if(el.dataset.mfSw) return;
    el.dataset.mfSw="1";
    const slides=[...el.children]; if(!slides.length) return;
    const wrap=document.createElement("div");
    wrap.className="swiper mf-sw "+cls;
    if(el.id) wrap.id=el.id;
    const w=document.createElement("div"); w.className="swiper-wrapper";
    slides.forEach(c=>{ c.classList.add("swiper-slide"); w.appendChild(c); });
    wrap.appendChild(w);
    el.replaceWith(wrap);
    return {wrap, w, count:slides.length};
  }

  const reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function upgradeQuotes(el){
    const c=convert(el,"mf-quotes"); if(!c) return;
    const Sw=await lib(); if(!Sw||!c.wrap.isConnected) return;
    const pag=document.createElement("div"); pag.className="swiper-pagination"; c.wrap.appendChild(pag);
    const dots=document.getElementById("scd"); if(dots) dots.style.display="none";
    live.set(c.wrap,new Sw(c.wrap,{
      slidesPerView:"auto", centeredSlides:true, spaceBetween:10, grabCursor:true,
      loop:c.count>2,
      autoplay:reduced||c.count<2?false:{delay:4200,disableOnInteraction:false,pauseOnMouseEnter:true},
      pagination:{el:pag,clickable:true},
      keyboard:{enabled:true}
    }));
  }

  async function upgradeDays(el){
    const onIdx=[...el.children].findIndex(c=>c.classList.contains("on"));
    const c=convert(el,"mf-days"); if(!c) return;
    const Sw=await lib(); if(!Sw||!c.wrap.isConnected) return;
    live.set(c.wrap,new Sw(c.wrap,{
      slidesPerView:"auto", spaceBetween:8, grabCursor:true,
      freeMode:{enabled:true,momentum:true,momentumBounce:false,sticky:true},
      initialSlide:onIdx>0?onIdx:0, centerInsufficientSlides:true
    }));
  }

  async function upgradeRail(el){
    const c=convert(el,"mf-rail"); if(!c) return;
    const Sw=await lib(); if(!Sw||!c.wrap.isConnected) return;
    live.set(c.wrap,new Sw(c.wrap,{
      slidesPerView:"auto", spaceBetween:6, grabCursor:true,
      freeMode:{enabled:true,momentum:true,momentumBounce:false,sticky:true}
    }));
  }

  function sweep(){
    for(const [el,sw] of live){ if(!el.isConnected){ try{ sw.destroy(); }catch(_){ } live.delete(el); } }
    const q=document.querySelector("#scq:not([data-mf-sw])"); if(q) upgradeQuotes(q);
    const d=document.querySelector("#dayCards:not([data-mf-sw])"); if(d) upgradeDays(d);
    document.querySelectorAll(".pp-rail:not([data-mf-sw])").forEach(r=>upgradeRail(r));
  }

  let timer=null;
  new MutationObserver(()=>{ clearTimeout(timer); timer=setTimeout(sweep,150); }).observe(document.documentElement,{childList:true,subtree:true});
  sweep();
})();
