/* Mofit before/after slider polish. Applies to the landing results slider
   (.sc-ba) and the progress-photo compare (.pp-cmp):
   - tapping anywhere glides the divider there (spring) instead of jumping
   - dragging stays 1:1 with the finger
   - a light haptic tick when the divider passes the middle
   - a soft "قبل / بعد" pulse on the labels when the divider settles
   No existing file is changed. */
(function(){
const css=`
@property --p{syntax:"<percentage>";inherits:true;initial-value:50%}
.sc-ba.baglide,.pp-cmp.baglide{transition:--p .45s cubic-bezier(.2,1.2,.3,1)}
.sc-ba .hd i,.pp-cmp .hd i{transition:transform .2s}
.sc-ba.baact .hd i,.pp-cmp.baact .hd i{transform:scale(1.14)}
.sc-ba .tag,.pp-cmp .tag{transition:opacity .25s,transform .25s}
.sc-ba.baact .tag,.pp-cmp.baact .tag{opacity:.75;transform:scale(.95)}`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
const SEL=".sc-ba,.pp-cmp";
let mid=null;
function pct(el){ return parseFloat(getComputedStyle(el).getPropertyValue("--p"))||50; }
document.addEventListener("pointerdown",e=>{ const el=e.target.closest&&e.target.closest(SEL); if(!el) return;
  if(!e.target.closest(".hd")) el.classList.add("baglide");   // tap on the picture glides
  el.classList.add("baact"); mid=pct(el)<50; },true);
document.addEventListener("pointermove",e=>{ const el=e.target.closest&&e.target.closest(SEL); if(!el||!el.classList.contains("baact")) return;
  el.classList.remove("baglide");
  const now=pct(el)<50; if(mid!==null&&now!==mid){ try{navigator.vibrate&&navigator.vibrate(8);}catch(_){} } mid=now; },true);
["pointerup","pointercancel"].forEach(t=>document.addEventListener(t,()=>{
  document.querySelectorAll(SEL+".baact").forEach(el=>{ el.classList.remove("baact"); setTimeout(()=>el.classList.remove("baglide"),600); }); },true));
})();
