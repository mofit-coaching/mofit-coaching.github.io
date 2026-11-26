/* ======================================================================
   Mofit celebrations — canvas-confetti (ISC license, vendored confetti.js)
   Big brand-colored moments: league champion, new badge, small wins.
   Every kind falls back to the old CSS burst() and skips under
   prefers-reduced-motion.
   ====================================================================== */
(function(){
const COLORS=["#FF6B1A","#FFB347","#5B6CFF","#14B8A6","#F43F8E","#FFE680"];
const rm=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const ok=()=>typeof confetti==="function"&&!rm();
const fb=()=>{ if(typeof burst==="function"&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)) burst(); };
function win(){
  if(!ok()) return fb();
  confetti({particleCount:90,spread:75,startVelocity:42,origin:{y:.6},colors:COLORS,scalar:1.05});
  const end=Date.now()+1200;
  (function side(){
    confetti({particleCount:24,angle:60,spread:58,origin:{x:0,y:.78},colors:COLORS});
    confetti({particleCount:24,angle:120,spread:58,origin:{x:1,y:.78},colors:COLORS});
    if(Date.now()<end) setTimeout(side,270);
  })();
}
function badge(){
  if(!ok()) return fb();
  confetti({particleCount:70,spread:100,startVelocity:34,origin:{y:.62},colors:COLORS,scalar:.9,ticks:170});
  setTimeout(()=>{ if(ok()) confetti({particleCount:28,spread:70,startVelocity:25,origin:{y:.52},colors:["#FFE680","#FFB347","#FFFFFF"],scalar:.75,ticks:140}); },200);
}
function mini(){
  if(!ok()) return fb();
  confetti({particleCount:34,spread:60,startVelocity:28,origin:{y:.6},colors:COLORS,scalar:.8,ticks:130});
}
window.mofitCelebrate={win,badge,mini};
})();
