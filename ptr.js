/* ======================================================================
   MOFIT pull-to-refresh (home-screen iPhone web apps have no native one).
   Pull down at the very top of the page -> soft refresh of the current
   screen (re-fetch data + re-render, no full reload).
   Works for client, coach and assistant views. Branded dumbbell indicator.
   Never starts inside: modals / fixed overlays, inputs, video, horizontal
   scrollers (chips), inner scrolled lists, or a drag-sort in progress.
   ====================================================================== */
(function(){
  if(window.__mofitPtr) return; window.__mofitPtr=true;
  var TRIGGER=74, MAXPULL=118, SLOP=9;
  var reduce=false; try{ reduce=matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}

  var css=document.createElement("style");
  css.textContent=
  "#ptr{position:fixed;left:50%;top:0;z-index:70;width:46px;height:46px;margin-left:-23px;border-radius:50%;"+
  "background:radial-gradient(circle at 50% 35%,#1C2B4C,#0B1426);box-shadow:0 8px 22px rgba(0,0,0,.38),0 0 0 1px rgba(255,107,26,.35);"+
  "display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;"+
  "transform:translate3d(0,-60px,0) scale(.6);will-change:transform,opacity}"+
  "#ptr.snap{transition:transform .42s cubic-bezier(.2,1.25,.4,1),opacity .25s}"+
  "#ptr svg{position:absolute;inset:0;width:100%;height:100%}"+
  "#ptr .pr-ring{fill:none;stroke:#FF6B1A;stroke-width:3;stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke .15s}"+
  "#ptr .pr-trk{fill:none;stroke:rgba(255,255,255,.12);stroke-width:3}"+
  "#ptr .pr-db{position:relative;width:24px;height:24px;transform-origin:50% 50%}"+
  "#ptr.ready{box-shadow:0 8px 24px rgba(255,107,26,.45),0 0 0 1px rgba(255,179,71,.8)}"+
  "#ptr.ready .pr-ring{stroke:#FFB347}"+
  "#ptr.load .pr-ring{stroke-dasharray:40 200!important;stroke-dashoffset:0!important;animation:ptrSpin .9s linear infinite}"+
  "#ptr.load .pr-db{animation:ptrLift 1s ease-in-out infinite}"+
  "#ptr.done .pr-ring{stroke:#4ADE80;stroke-dasharray:132 200!important;animation:none}"+
  "@keyframes ptrSpin{to{transform:rotate(270deg)}}"+
  "@keyframes ptrLift{0%,100%{transform:translateY(2px) scale(1)}50%{transform:translateY(-3px) scale(1.12)}}"+
  "@media (prefers-reduced-motion:reduce){#ptr.load .pr-db{animation:none}}";
  document.head.appendChild(css);

  var el=document.createElement("div"); el.id="ptr"; el.setAttribute("aria-hidden","true");
  el.innerHTML='<svg viewBox="0 0 46 46"><circle class="pr-trk" cx="23" cy="23" r="20.5"/><circle class="pr-ring" cx="23" cy="23" r="20.5" stroke-dasharray="0 200"/></svg>'+
    '<svg class="pr-db" viewBox="0 0 64 64" fill="none" style="position:relative;width:24px;height:24px;inset:auto"><rect x="6" y="22" width="8" height="20" rx="2" fill="#FF6B1A"/><rect x="14" y="16" width="8" height="32" rx="2" fill="#FF8A3D"/><rect x="22" y="29" width="20" height="6" rx="3" fill="#E9EEF8"/><rect x="42" y="16" width="8" height="32" rx="2" fill="#FF8A3D"/><rect x="50" y="22" width="8" height="20" rx="2" fill="#FF6B1A"/></svg>';
  var ring=el.querySelector(".pr-ring"), db=el.querySelector(".pr-db");
  function mount(){ if(!el.parentNode) document.body.appendChild(el); }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded",mount);

  var CIRC=2*Math.PI*20.5;
  var st={on:false,track:false,x0:0,y0:0,dy:0,ready:false,busy:false,locked:false};

  function top(){ return (window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0)<=0; }
  function appVisible(){ var a=document.getElementById("appView"); return a&&!a.classList.contains("hidden"); }
  function sheetOpen(){ var s=document.getElementById("sheet"); return s&&!s.classList.contains("hidden"); }

  /* true when the touch started somewhere a pull must not hijack */
  function blocked(t){
    if(!t||t.nodeType!==1) t=t&&t.parentElement; if(!t) return true;
    if(t.closest("input,textarea,select,video,canvas,iframe,[contenteditable],[data-noptr],.sortable-chosen,.sortable-ghost,.plyr")) return true;
    var ae=document.activeElement; if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return true;
    for(var n=t;n&&n!==document.body&&n!==document.documentElement;n=n.parentElement){
      var cs=getComputedStyle(n);
      if(cs.position==="fixed"&&n.id!=="top") return true;            /* modal, lightbox, timer, chat sheet... */
      if((cs.overflowX==="auto"||cs.overflowX==="scroll")&&n.scrollWidth>n.clientWidth+2) return true;   /* chip rows, swipers */
      if((cs.overflowY==="auto"||cs.overflowY==="scroll")&&n.scrollHeight>n.clientHeight+2) return true; /* inner lists */
    }
    return false;
  }

  function place(d,snap){
    el.classList.toggle("snap",!!snap);
    var y=Math.max(-60,d-52+ (env()));
    var p=Math.min(1,d/TRIGGER);
    el.style.opacity=d>6?String(Math.min(1,p*1.4)):"0";
    el.style.transform="translate3d(0,"+y+"px,0) scale("+(0.6+0.4*Math.min(1,p))+")";
    if(!el.classList.contains("load")&&!el.classList.contains("done")){
      ring.setAttribute("stroke-dasharray",(CIRC*p).toFixed(1)+" 200");
      db.style.transform="rotate("+(p*360).toFixed(0)+"deg) scale("+(0.8+0.3*p).toFixed(2)+")";
    }
  }
  var _env=null;
  function env(){ if(_env===null){ var d=document.createElement("div"); d.style.cssText="position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden"; document.body.appendChild(d); _env=d.getBoundingClientRect().height||0; d.remove(); } return _env; }

  function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

  function reset(){
    el.classList.remove("ready","load","done"); st.ready=false;
    place(0,true);
  }

  async function run(){
    st.busy=true;
    el.classList.remove("ready"); el.classList.add("load","snap");
    el.style.opacity="1"; el.style.transform="translate3d(0,"+(TRIGGER*0.62+env()-4)+"px,0) scale(1)";
    var t0=Date.now(), ok=true;
    try{ await softRefresh(); }catch(e){ ok=false; try{ console.warn("ptr",e); }catch(_){} }
    var wait=Math.max(0,750-(Date.now()-t0)); if(wait) await new Promise(function(r){ setTimeout(r,wait); });
    el.classList.remove("load"); if(ok){ el.classList.add("done"); ring.setAttribute("stroke-dasharray",CIRC+" 200"); buzz(12); }
    else if(typeof toast==="function") toast("مفيش نت دلوقتي – جرّب تاني");
    await new Promise(function(r){ setTimeout(r,ok?380:60); });
    reset(); st.busy=false;
  }

  /* re-fetch the current screen's data and re-render it (no page reload) */
  async function softRefresh(){
    if(typeof S==="undefined"||!S.me) return;
    if(S.me.role==="assistant"){ if(typeof renderAssistantHome==="function") renderAssistantHome(); return; }
    var y=window.pageYOffset||0;
    if(S.client&&typeof refreshClient==="function") await refreshClient();
    else if(S.me.role==="coach"&&typeof loadClients==="function") await loadClients();
    if(typeof render==="function") render();
    window.scrollTo(0,y);
  }
  window.mofitSoftRefresh=function(){ if(st.busy) return Promise.resolve(); return run(); };

  document.addEventListener("touchstart",function(e){
    st.track=false; st.on=false;
    if(st.busy||e.touches.length!==1||!appVisible()||sheetOpen()||!top()) return;
    if(blocked(e.target)) return;
    var t=e.touches[0]; st.x0=t.clientX; st.y0=t.clientY; st.dy=0; st.locked=false; st.ready=false; st.track=true;
  },{passive:true});

  document.addEventListener("touchmove",function(e){
    if(!st.track) return;
    var t=e.touches[0], dx=t.clientX-st.x0, dy=t.clientY-st.y0;
    if(!st.on){
      if(!st.locked){
        if(Math.abs(dy)<SLOP&&Math.abs(dx)<SLOP) return;
        st.locked=true;
        if(dy<=0||Math.abs(dx)>Math.abs(dy)*0.9||!top()){ st.track=false; return; }  /* scrolling up / sideways: not ours */
      }
      st.on=true; mount(); st.y0=t.clientY-SLOP; dy=SLOP; el.classList.remove("load","done");
    }
    if(!top()&&dy<=0){ st.track=false; st.on=false; reset(); return; }
    if(e.cancelable) e.preventDefault();
    /* rubber band: strong resistance the further you pull */
    var d=MAXPULL*(1-Math.exp(-Math.max(0,dy)/(MAXPULL*1.25)));
    st.dy=d; place(d,false);
    var r=d>=TRIGGER*0.8;
    if(r!==st.ready){ st.ready=r; el.classList.toggle("ready",r); buzz(r?9:0); if(r&&!reduce){ el.style.transform+=" "; } }
  },{passive:false});

  function end(){
    if(!st.on){ st.track=false; return; }
    st.on=false; st.track=false;
    if(st.ready) run(); else reset();
  }
  document.addEventListener("touchend",end,{passive:true});
  document.addEventListener("touchcancel",function(){ if(st.on){ st.on=false; st.track=false; reset(); } },{passive:true});
})();
