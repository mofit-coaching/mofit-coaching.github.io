/* MOFIT logo assembly: on the landing page the wordmark is built in front of the visitor.
   A bar slides in, two plates clamp onto the ends, then MO FIT lands with a faint clank ring.
   Pure CSS/SVG, no images, respects prefers-reduced-motion. */
(function(){
if(window.__mofitLogo) return; window.__mofitLogo=1;
const PLATE=(cls,color)=>`<svg class="lp-plate ${cls}" viewBox="0 0 120 120" aria-hidden="true">
  <circle cx="60" cy="60" r="54" fill="none" stroke="${color}" stroke-width="14"/>
  <circle cx="60" cy="60" r="34" fill="none" stroke="${color}" stroke-width="6" opacity=".55"/>
  <circle cx="60" cy="60" r="17" fill="#0A1020" stroke="${color}" stroke-width="6"/></svg>`;
function run(){
  const art=document.querySelector("#loginView .login-art")||document.querySelector(".login-art");
  if(!art||art.dataset.logo) return;
  const big=art.querySelector(".logo-big");
  if(!big) return;
  art.dataset.logo=1;
  const wrap=document.createElement("div");
  wrap.className="logo-assembly";
  wrap.setAttribute("aria-hidden","true");
  wrap.innerHTML=`<span class="lp-bar"></span>${PLATE("lp-l","#FF6B1A")}${PLATE("lp-r","#FFB347")}<span class="lp-clank"></span>`;
  big.parentNode.insertBefore(wrap,big);
  wrap.appendChild(big);
  art.classList.add("logo-on");
  setTimeout(()=>art.classList.add("logo-done"),2200);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run); else run();
window.mofitLogo={run};
})();
