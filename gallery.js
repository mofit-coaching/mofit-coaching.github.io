/* ======================================================================
   Mofit — progress photo gallery (gl-*): Instagram-style lightbox for the
   transformation archive. PhotoSwipe 5 (MIT), self-hosted in ./vendor,
   lazy-loaded on first tap. Pinch zoom, swipe between photos, captions.
   PRIVACY: shows only the photos already rendered in this view for this
   viewer (the client's own archive, or the client's archive the coach is
   already looking at). No uploads, no third parties, nothing new shared.
   ====================================================================== */
(function(){
const SELF=(document.currentScript&&document.currentScript.src)||(document.querySelector('script[src*="gallery.js"]')||{}).src||"gallery.js";
const V=SELF.replace(/gallery\.js(\?.*)?$/,"")+"vendor/";
const CSS=`
.pswp{cursor:zoom-out}
.gl-cap{position:absolute;bottom:calc(14px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:#fff;font-size:13px;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.6);pointer-events:none;padding:0 16px}
.gl-cap small{display:block;font-weight:500;opacity:.75;font-size:11px;margin-top:2px}
.pp-grid .pp-ph{cursor:zoom-in}
`;
const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

let lib=null, libP=null;
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
function ensureLib(){
  if(lib) return Promise.resolve(lib);
  if(libP) return libP;
  libP=(async()=>{
    try{
      if(!document.querySelector('link[href*="photoswipe"]')){ const l=document.createElement("link"); l.rel="stylesheet"; l.href=V+"photoswipe.css"; document.head.appendChild(l); }
      if(!window.PhotoSwipe) await loadScript(V+"photoswipe.umd.min.js");
      if(!window.PhotoSwipeLightbox) await loadScript(V+"photoswipe-lightbox.umd.min.js");
      lib={PhotoSwipe:window.PhotoSwipe,Lightbox:window.PhotoSwipeLightbox};
    }catch(e){ libP=null; }
    return lib;
  })();
  return libP;
}

async function openGallery(figs,index){
  const L=await ensureLib(); if(!L) return;
  const items=figs.map(f=>{ const img=f.querySelector("img");
    return { src:img.currentSrc||img.src, w:img.naturalWidth||900, h:img.naturalHeight||1200,
      cap:img.alt||"", sub:(f.querySelector(".pp-pose-tag")||{}).textContent||"" }; });
  const lb=new L.Lightbox({
    dataSource:items, pswpModule:L.PhotoSwipe, index,
    bgOpacity:.96, loop:figs.length>2, wheelToZoom:false,
    imageClickAction:"zoom", tapAction:"toggle-controls", doubleTapAction:"zoom",
    padding:{top:24,bottom:56,left:0,right:0},
    showHideAnimationType:"zoom", zoomAnimationDuration:matchMedia("(prefers-reduced-motion:reduce)").matches?0:333,
  });
  lb.on("uiRegister",()=>{
    lb.pswp.ui.registerElement({ name:"gl-caption", order:9, isButton:false, appendTo:"root", html:"",
      onInit:(el,pswp)=>{ el.className="gl-cap";
        const draw=()=>{ const it=items[pswp.currIndex]||{}; el.innerHTML=`<div>${it.cap.replace(/[<>&"]/g,"")}</div>${it.sub?`<small>${it.sub.replace(/[<>&"]/g,"")}</small>`:""}`; };
        pswp.on("change",draw); draw(); } });
  });
  lb.init(); lb.loadAndOpen(index);
}

function enhance(el){
  if(!el||el._gl) return; el._gl=1;
  el.addEventListener("click",e=>{
    if(e.target.closest(".pp-star,.pp-del,[data-pick],[data-pull],button")) return;
    const fig=e.target.closest(".pp-grid .pp-ph"); if(!fig||!el.contains(fig)) return;
    const figs=[...el.querySelectorAll(".pp-grid .pp-ph")];
    const i=figs.indexOf(fig); if(i<0) return;
    openGallery(figs,i);
  });
}

/* wrap the archive renderer (same pattern as push.js wraps viewHome) */
function wrap(){
  if(typeof window.fillPhotoArchive!=="function"||window.fillPhotoArchive._gl) return;
  const _f=window.fillPhotoArchive;
  window.fillPhotoArchive=async function(el,p,pre,prePull){ const r=await _f.apply(this,arguments); enhance(el); return r; };
  window.fillPhotoArchive._gl=1;
}
wrap();
/* photos.js may load after us in some orderings; retry a couple of times */
let n=0; const iv=setInterval(()=>{ wrap(); if(window.fillPhotoArchive&&window.fillPhotoArchive._gl||++n>20) clearInterval(iv); },300);

window.glOpen=openGallery; /* test/demo API */
})();
