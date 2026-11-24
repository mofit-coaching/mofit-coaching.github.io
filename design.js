/* Mofit identity: MOFIT signature wordmark (custom-drawn letters, the "O" is a weight plate, the "I" is a barbell). */
(function(){
  let n=0;
  function wm(big){
    const id="wmg"+(++n);
    return `<svg class="wm${big?" wm-big":""}" viewBox="0 0 290 92" role="img" aria-label="MOFIT" focusable="false">
<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="160" x2="290" y1="0" y2="90"><stop offset="0" stop-color="#FF6B1A"/><stop offset="1" stop-color="#FFB347"/></linearGradient></defs>
<g class="wm-mo" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
<path d="M10 68V12L42 46 74 12V68"/><circle cx="114" cy="40" r="28"/><circle class="wm-hub" cx="114" cy="40" r="5" fill="currentColor" stroke="none"/></g>
<g class="wm-fit" fill="none" stroke="url(#${id})" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
<path d="M164 68V12H202M164 40H194"/><path d="M226 12V68"/><rect class="wm-pl" x="213" y="1" width="26" height="9" rx="4.5" fill="url(#${id})" stroke="none"/><rect class="wm-pl" x="213" y="70" width="26" height="9" rx="4.5" fill="url(#${id})" stroke="none"/><path d="M250 12H284M267 12V68"/></g>
<path class="wm-sig" d="M160 85Q220 77 286 83" fill="none" stroke="url(#${id})" stroke-width="3.5" stroke-linecap="round" opacity=".9" pathLength="1"/>
</svg>`;
  }
  function upgrade(root){
    (root.querySelectorAll?root.querySelectorAll(".logo,.logo-big"):[]).forEach(el=>{
      if(el.dataset.wm) return;
      if(!/^\s*MOFIT\s*$/i.test(el.textContent)) return;
      el.dataset.wm="1"; el.innerHTML=wm(el.classList.contains("logo-big"));
    });
  }
  window.mofitWordmark=wm;
  function run(){ upgrade(document); new MutationObserver(ms=>{ ms.forEach(m=>m.addedNodes.forEach(nd=>{ if(nd.nodeType===1){ if(nd.matches&&nd.matches(".logo,.logo-big")) upgrade({querySelectorAll:()=>[nd]}); else upgrade(nd); } })); }).observe(document.documentElement,{childList:true,subtree:true}); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run); else run();
})();
