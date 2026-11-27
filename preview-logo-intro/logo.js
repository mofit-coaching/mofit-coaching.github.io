/* MOFIT logo assembly: on the landing page the wordmark is built in front of the visitor.
   The bar draws out from the middle, opens, and MO FIT comes out of the opening; the plates clamp
   The intro waits for the boot screen to clear, so the build is actually seen, and it replays
   onto the ends with a faint clank ring. The hero heartbeat keeps drawing on top throughout.
   Replays when the visitor comes back to the login view. Pure CSS/SVG, no images, reduced-motion safe. */
(function(){
if(window.__mofitLogo) return; window.__mofitLogo=1;
const PLATE=(cls,color)=>`<svg class="lp-plate ${cls}" viewBox="0 0 120 120" aria-hidden="true">
  <circle cx="60" cy="60" r="54" fill="none" stroke="${color}" stroke-width="14"/>
  <circle cx="60" cy="60" r="34" fill="none" stroke="${color}" stroke-width="6" opacity=".55"/>
  <circle cx="60" cy="60" r="17" fill="#0A1020" stroke="${color}" stroke-width="6"/></svg>`;
let lastPlay=0, timer=null, tapTimer=null;
function build(art){
  if(art.dataset.logo) return true;
  const big=art.querySelector(".logo-big");
  if(!big) return false;
  art.dataset.logo=1;
  const wrap=document.createElement("div");
  wrap.className="logo-assembly";
  wrap.setAttribute("aria-hidden","true");
  wrap.innerHTML=`<span class="lp-bar"><i class="lp-a"></i><i class="lp-b"></i></span>${PLATE("lp-l","#FF6B1A")}${PLATE("lp-r","#FFB347")}<span class="lp-clank"></span>`;
  big.parentNode.insertBefore(wrap,big);
  /* keep the wordmark where it is: the brand wordmark has its own entrance animation,
     and re-parenting it broke that. The barbell builds around it. */
  wrap.appendChild(big);
  /* touch: pressing the wordmark lifts it and pulses the bar. pointerdown covers iOS Safari,
     touchstart is the belt-and-braces fallback; both are passive so scrolling is never blocked. */
  const tap=()=>{
    if(!art.classList.contains("logo-on")) return;
    if(big.animate){
      big.getAnimations().forEach(a=>{ if(a.id==="lpTap") a.cancel(); });
      const t=big.animate([
        {transform:"translateY(0) scale(1)",filter:"drop-shadow(0 0 0 rgba(255,107,26,0))"},
        {transform:"translateY(-9px) scale(1.08)",filter:"drop-shadow(0 6px 22px rgba(255,107,26,.85))",offset:.4},
        {transform:"translateY(0) scale(1)",filter:"drop-shadow(0 0 0 rgba(255,107,26,0))"}],
        {duration:540,easing:"cubic-bezier(.2,1.25,.3,1)"});
      t.id="lpTap";
    }
    /* pulse the bar with Web Animations: a CSS class here would replace the intro animations
       on the halves and plates and leave them invisible. */
    const barEl=wrap.querySelector(".lp-bar");
    if(barEl&&barEl.animate){
      barEl.getAnimations().forEach(a=>{ if(a.id==="lpTapBar") a.cancel(); });
      const b=barEl.animate(
        [{filter:"brightness(1) saturate(1)"},{filter:"brightness(1.7) saturate(1.2)",offset:.4},{filter:"brightness(1) saturate(1)"}],
        {duration:540,easing:"ease-out"});
      b.id="lpTapBar";
    }
  };
  big.addEventListener("pointerdown",tap,{passive:true});
  big.addEventListener("touchstart",tap,{passive:true});
  return true;
}
function play(art){
  document.body.classList.add("logo-intro");
  art.classList.remove("logo-on","logo-done");
  void art.offsetWidth;
  art.classList.add("logo-on");
  /* the wordmark waits small and low inside the closed bar, then grows up out of the opening.
     Web Animations keeps this off the brand's own wordmark animation properties. */
  const big=art.querySelector(".logo-big");
  if(big&&big.animate){
    big.getAnimations().forEach(a=>{ if(a.id==="lpOut") a.cancel(); });
    const a=big.animate(
      [{opacity:0,scale:"0.42",translate:"0px 10px"},{opacity:1,scale:"1",translate:"0px 0px"}],
      {duration:500,delay:950,easing:"cubic-bezier(.2,1.15,.25,1)",fill:"both"});
    a.id="lpOut";
  }
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
