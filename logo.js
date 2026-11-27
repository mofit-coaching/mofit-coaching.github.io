/* MOFIT logo assembly: on the landing page the wordmark is built in front of the visitor.
   A bar slides in, two plates clamp onto the ends, then MO FIT drops in with a faint clank ring.
   The intro waits for the boot screen to clear, so the build is actually seen, and it replays
   when the visitor comes back to the login view. Pure CSS/SVG, no images, respects reduced motion. */
(function(){
if(window.__mofitLogo) return; window.__mofitLogo=1;
const PLATE=(cls,color)=>`<svg class="lp-plate ${cls}" viewBox="0 0 120 120" aria-hidden="true">
  <circle cx="60" cy="60" r="54" fill="none" stroke="${color}" stroke-width="14"/>
  <circle cx="60" cy="60" r="34" fill="none" stroke="${color}" stroke-width="6" opacity=".55"/>
  <circle cx="60" cy="60" r="17" fill="#0A1020" stroke="${color}" stroke-width="6"/></svg>`;
let lastPlay=0, timer=null;
function build(art){
  if(art.dataset.logo) return true;
  const big=art.querySelector(".logo-big");
  if(!big) return false;
  art.dataset.logo=1;
  const wrap=document.createElement("div");
  wrap.className="logo-assembly";
  wrap.setAttribute("aria-hidden","true");
  wrap.innerHTML=`<span class="lp-bar"></span>${PLATE("lp-l","#FF6B1A")}${PLATE("lp-r","#FFB347")}<span class="lp-clank"></span><span class="lp-word"></span>`;
  big.parentNode.insertBefore(wrap,big);
  wrap.querySelector(".lp-word").appendChild(big);
  return true;
}
function play(art){
  const sec=art.closest("section")||art.parentElement;
  if(sec) sec.classList.add("logo-intro");
  art.classList.remove("logo-on","logo-done");
  void art.offsetWidth;
  art.classList.add("logo-on");
  clearTimeout(timer);
  timer=setTimeout(()=>art.classList.add("logo-done"),2600);
  lastPlay=Date.now();
}
function run(){
  const art=document.querySelector("#loginView .login-art")||document.querySelector(".login-art");
  if(!art) return;
  if(!build(art)) return;
  if(art.dataset.armed) return;
  art.dataset.armed=1;
  /* the boot screen covers the page for ~1.6s; start the build once it clears */
  const boot=document.getElementById("boot");
  const first=()=>play(art);
  setTimeout(first, boot?1750:250);
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(es=>{
      es.forEach(en=>{
        if(!en.isIntersecting) return;
        if(!lastPlay) return;
        if(Date.now()-lastPlay<6000) return;
        play(art);
      });
    },{threshold:.35});
    io.observe(art);
  }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run); else run();
window.mofitLogo={run, play:()=>{ const a=document.querySelector(".logo-assembly"); if(a&&a.parentNode) play(a.parentNode); }};
})();
