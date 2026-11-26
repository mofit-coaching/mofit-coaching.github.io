/* Mofit rolling numbers + gliding league podium.
   - Numbers on stat tiles (.num) and league points count up once when they
     appear. The final value is always the number already rendered, nothing
     is invented. Times (12:30), dates and ranges are skipped.
   - League podium columns glide up from below with a spring, 2nd and 3rd
     first, then the winner, followed by a slow light sweep over 1st place.
   Respects prefers-reduced-motion. No existing file is changed. */
(function(){
const rm=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const css=`
.lg-pod .lg-p1,.lg-pod .lg-p2,.lg-pod .lg-p3{animation:rpGlide .85s cubic-bezier(.16,1.25,.3,1) both;position:relative;overflow:hidden}
.lg-pod .lg-p2{animation-delay:.05s}.lg-pod .lg-p3{animation-delay:.18s}.lg-pod .lg-p1{animation-delay:.38s}
.lg-pod .lg-p1:after{content:"";position:absolute;top:0;bottom:0;width:46%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,226,140,.28),transparent);transform:skewX(-14deg);animation:rpSweep 3.8s ease-in-out 1.3s infinite;pointer-events:none}
@keyframes rpGlide{0%{transform:translateY(46px) scale(.92);opacity:0}60%{opacity:1}100%{transform:none;opacity:1}}
@keyframes rpSweep{0%,55%{left:-60%}100%{left:130%}}
@media(prefers-reduced-motion:reduce){.lg-pod .lg-p1,.lg-pod .lg-p2,.lg-pod .lg-p3{animation:none}.lg-pod .lg-p1:after{display:none}}`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

const SEL=".num,.lg-pod small,[data-roll]";
const RE=/^(\s*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/s;
const ease=t=>1-Math.pow(1-t,3);
function roll(el){
  if(el._rolled||rm()) return; el._rolled=1;
  if(el.children.length||el.childNodes.length!==1||el.firstChild.nodeType!==3) return;
  const txt=el.textContent, m=RE.exec(txt); if(!m) return;
  const rest=m[3]; if(/^[:\/\-.]\d/.test(rest)) return;      // times, dates, ranges
  const raw=m[2], to=parseFloat(raw.replace(/,/g,"")); if(!isFinite(to)||Math.abs(to)<2) return;
  const dec=(raw.split(".")[1]||"").length, comma=raw.indexOf(",")>-1;
  const fmt=v=>{ let s=v.toFixed(dec); if(comma){ const p=s.split("."); p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,","); s=p.join("."); } return s; };
  const dur=Math.min(1400,500+Math.log10(Math.abs(to)+1)*250), t0=performance.now();
  el.style.fontVariantNumeric="tabular-nums";
  (function f(t){ const k=Math.max(0,Math.min(1,(t-t0)/dur));
    if(!el.isConnected){ return; }
    el.textContent=m[1]+fmt(to*ease(k))+rest;
    if(k<1) requestAnimationFrame(f); else el.textContent=txt; })(t0);
}
function scan(root){ if(!root||!root.querySelectorAll) return;
  if(root.matches&&root.matches(SEL)) roll(root);
  root.querySelectorAll(SEL).forEach(roll); }
function start(){
  const main=document.getElementById("main"); if(!main) return;
  scan(main);
  new MutationObserver(ms=>{ for(const m of ms) m.addedNodes.forEach(n=>{ if(n.nodeType===1) scan(n); }); })
    .observe(main,{childList:true,subtree:true});
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
