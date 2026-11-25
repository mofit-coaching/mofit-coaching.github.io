/* Mofit identity: MOFIT signature wordmark (custom-drawn letters, the "O" is a weight plate, the "I" is a barbell). */
(function(){
  let n=0;
  function wm(big){
    const id="wmg"+(++n);
    return `<span class="wm2${big?" wm2-big":""}" role="img" aria-label="MOFIT"><svg class="wm-ic" viewBox="0 0 64 64" focusable="false" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5A0A"/><stop offset="1" stop-color="#FFB347"/></linearGradient></defs><rect class="wm-ring" x="1" y="1" width="62" height="62" rx="16" fill="none" stroke="#FFC21A" stroke-width="1.6"/><rect class="wm-ring r2" x="1" y="1" width="62" height="62" rx="16" fill="none" stroke="#FFC21A" stroke-width="1.6"/><rect width="64" height="64" rx="16" fill="url(#${id})"/><g fill="#fff"><rect class="wm-pl2" x="5" y="22" width="6" height="20" rx="2.5"/><rect class="wm-pl2 b" x="12" y="16" width="6" height="32" rx="2.5"/><rect class="wm-pl2" x="53" y="22" width="6" height="20" rx="2.5"/><rect class="wm-pl2 b" x="46" y="16" width="6" height="32" rx="2.5"/></g><path class="wm-m" d="M18 42V24L26 36 32 28 38 36 46 24V42" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/><path class="wm-m2" d="M18 42V24L26 36 32 28 38 36 46 24V42" fill="none" stroke="#FFE680" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg><span class="wm-t" aria-hidden="true">MO<i class="wm-f">FIT</i></span></span>`;
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


