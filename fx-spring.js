/* MOFIT spring motion: real damped-spring easing (CSS linear()) used for press feedback,
   bottom sheets, toasts and selected chips. Uses the individual `scale` / `translate`
   properties so it never fights the transforms the app already animates. */
(function(){
  if(window.__fxSpring) return; window.__fxSpring=1;
  const RM=matchMedia("(prefers-reduced-motion: reduce)");
  /* damped spring x(t)=1-e^(-zwt)(cos(wd t)+z w/wd sin(wd t)), sampled into linear() */
  function spring(z,w,n=36,T=1){
    const wd=w*Math.sqrt(1-z*z), pts=[];
    for(let i=0;i<=n;i++){ const t=i/n*T, e=Math.exp(-z*w*t);
      pts.push(i===n?1:+(1-e*(Math.cos(wd*t)+z*w/wd*Math.sin(wd*t))).toFixed(4)); }
    return "linear("+pts.join(",")+")";
  }
  const OK=CSS.supports("animation-timing-function","linear(0,1)");
  const SOFT=OK?spring(.55,14):"cubic-bezier(.34,1.56,.64,1)";   // settle ~0.6s, one visible bounce
  const SNAP=OK?spring(.42,22):"cubic-bezier(.3,1.7,.5,1)";      // quick, bouncier
  const root=document.documentElement;
  root.style.setProperty("--spring",SOFT); root.style.setProperty("--spring-snap",SNAP);
  const can=!!(document.createElement("i").animate)&&CSS.supports("scale","1");
  const PRESS=".btn,.chip,.daycard,.ibtn,.client,.alert-row,.mrow,.tick,.fail,.plan-cta,.pill.glass,.badge,.item[data-ac],.tab,nav button,.sheet-x,.cb";
  const held=new Map();
  function down(e){
    if(!can||RM.matches) return;
    const el=e.target.closest&&e.target.closest(PRESS); if(!el||el.disabled||held.has(el)) return;
    held.set(el,el.animate([{scale:"1"},{scale:".93"}],{duration:110,easing:"ease-out",fill:"forwards"}));
  }
  function up(){
    held.forEach((a,x)=>{ let cur=".93"; try{ cur=getComputedStyle(x).scale; if(!cur||cur==="none") cur="1"; }catch(_){}
      a.cancel(); x.animate([{scale:cur},{scale:"1"}],{duration:650,easing:SOFT}); });
    held.clear();
  }
  document.addEventListener("pointerdown",down,{passive:true});
  document.addEventListener("pointerup",up,{passive:true});
  document.addEventListener("pointercancel",up,{passive:true});
  /* entrances: sheet slides up on a spring, toast pops, selected chip/day pops once */
  const seen=new WeakSet();
  function pop(el,kf,opt){ if(!can||RM.matches||seen.has(el)) return; seen.add(el); try{ el.animate(kf,opt); }catch(_){} }
  function scan(n){
    if(n.nodeType!==1) return;
    const q=(s,f)=>{ if(n.matches&&n.matches(s)) f(n); n.querySelectorAll&&n.querySelectorAll(s).forEach(f); };
    q(".sheet-card",el=>pop(el,[{translate:"0 60%",opacity:.2},{translate:"0 0",opacity:1}],{duration:750,easing:SOFT}));
    q(".toast",el=>pop(el,[{scale:".7",opacity:0},{scale:"1",opacity:1}],{duration:600,easing:SNAP}));
  }
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.body,{childList:true,subtree:true});
  /* the sheet element stays in the DOM and only toggles .hidden */
  const sh=document.getElementById("sheet");
  if(sh) new MutationObserver(()=>{ if(!sh.classList.contains("hidden")){ const c=sh.querySelector(".sheet-card"); if(c&&can&&!RM.matches) c.animate([{translate:"0 60%",opacity:.2},{translate:"0 0",opacity:1}],{duration:750,easing:SOFT}); } }).observe(sh,{attributes:true,attributeFilter:["class"]});
  /* selected state change on chips/day cards: pop */
  new MutationObserver(ms=>ms.forEach(m=>{ const el=m.target; if(el.classList&&el.classList.contains("on")&&!(m.oldValue||"").split(" ").includes("on")&&el.matches(".chip,.daycard,.tab"))
    { if(can&&!RM.matches) el.animate([{scale:".86"},{scale:"1"}],{duration:650,easing:SNAP}); } })).observe(document.body,{attributes:true,attributeFilter:["class"],attributeOldValue:true,subtree:true});
  window.mofitSpring={easing:SOFT,snap:SNAP};
})();
