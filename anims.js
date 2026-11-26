/* ======================================================================
   Mofit Lottie moments - lottie-web (MIT, vendored lottie.min.js).
   Animations are self-authored JSON (lottie-star.json, lottie-dumbbell.json),
   no external artwork, no license concerns.
   - scan(root): floating gold star badge on league winner cards
     (adds next to the crown SVG, never replaces it).
   - empty(root): rocking dumbbell on the rest-day empty state.
   Emoji/SVG stays as fallback when lottie/json is unavailable or the user
   prefers reduced motion.
   ====================================================================== */
(function(){
if(!document.getElementById("mofit-lottie-css")){ const st=document.createElement("style"); st.id="mofit-lottie-css";
st.textContent=".lg-star{position:absolute;top:8px;inset-inline-start:8px;width:44px;height:44px;pointer-events:none;z-index:3;filter:drop-shadow(0 2px 8px rgba(255,179,0,.5))}.empty .big.lottie-on{width:72px;height:72px;margin:0 auto}"; document.head.appendChild(st); }
const cache={};
const rm=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function load(name){
  if(!cache[name]) cache[name]=fetch("lottie-"+name+".json").then(r=>r.ok?r.json():null).catch(()=>null);
  return cache[name];
}
function mount(el,name,clear){
  if(!el||el.dataset.lt||typeof lottie==="undefined"||rm()) return;
  el.dataset.lt=name;
  load(name).then(data=>{
    if(!data||!el.isConnected) return;
    if(clear!==false) el.textContent="";
    el.classList.add("lottie-on");
    try{ lottie.loadAnimation({container:el,renderer:"svg",loop:true,autoplay:true,animationData:data}); }catch(e){}
  });
}
function scan(root){
  if(!root||!root.querySelectorAll) return;
  root.querySelectorAll(".lg-win").forEach(card=>{
    if(card.dataset.ltStar) return; card.dataset.ltStar="1";
    const s=document.createElement("span"); s.className="lg-star"; s.setAttribute("aria-hidden","true");
    card.appendChild(s); mount(s,"star");
  });
}
function empty(root){ const b=root&&root.querySelector?root.querySelector(".empty .big"):null; if(b) mount(b,"dumbbell"); }
window.mofitLottie={scan,empty,mount};
})();
