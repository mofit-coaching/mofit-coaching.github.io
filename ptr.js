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

  var W=132,H=46;
  /* one heartbeat across the pill (P, QRS spike, T wave) */
  var BEAT="M6 23 H32 q3 -7 6 0 H44 l3 4 l5 -26 l6 38 l4 -16 H80 q5 -11 11 0 H126";
  /* seamless monitor strip: a beat every 60px, 4 periods */
  var LOOP="M0 23"; for(var i=0;i<5;i++){ LOOP+=" H"+(i*60+8)+" q2 -5 4 0 H"+(i*60+22)+" l3 3 l4 -19 l5 28 l3 -12 H"+(i*60+48)+" q3 -6 6 0"; } LOOP+=" H300";
  var css=document.createElement("style");
  css.textContent=
  "#ptr{position:fixed;left:50%;top:0;z-index:70;width:"+W+"px;height:"+H+"px;margin-left:-"+(W/2)+"px;border-radius:23px;overflow:hidden;"+
  "background:linear-gradient(180deg,#14213D,#0B1426);box-shadow:0 8px 22px rgba(0,0,0,.38),0 0 0 1px rgba(255,107,26,.35);"+
  "pointer-events:none;opacity:0;transform:translate3d(0,-60px,0) scale(.7);will-change:transform,opacity}"+
  "#ptr.snap{transition:transform .42s cubic-bezier(.2,1.25,.4,1),opacity .25s}"+
  "#ptr svg{position:absolute;inset:0;width:100%;height:100%;overflow:hidden}"+
  "#ptr .hb-grid{stroke:rgba(255,255,255,.07);stroke-width:1}"+
  "#ptr .hb{fill:none;stroke:#FF6B1A;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;transition:stroke .15s;filter:drop-shadow(0 0 3px rgba(255,107,26,.8))}"+
  "#ptr .hb-dot{fill:#FFD28A;filter:drop-shadow(0 0 4px #FF6B1A)}"+
  "#ptr .hb-loop,#ptr .hb-flat{display:none}"+
  "#ptr.ready{box-shadow:0 8px 26px rgba(255,107,26,.5),0 0 0 1px rgba(255,179,71,.9);animation:ptrThump .55s ease-out}"+
  "#ptr.ready .hb{stroke:#FFB347}"+
  "#ptr.load .hb-pull,#ptr.load .hb-dot{display:none}"+
  "#ptr.load .hb-loop{display:block;stroke:#FF8A3D;animation:ptrScroll 1.3s linear infinite}"+
  "#ptr.load{animation:ptrThump 1.3s ease-in-out infinite}"+
  "#ptr.settle .hb-pull,#ptr.settle .hb-dot,#ptr.settle .hb-loop{display:none}"+
  "#ptr.settle .hb-flat{display:block;stroke:#FFB347;stroke-dasharray:none}"+
  "#ptr.done .hb-pull,#ptr.done .hb-dot,#ptr.done .hb-loop,#ptr.done .hb-flat{display:none}"+
  "#ptr.done .hb-fin{display:block;stroke:#FFB347;stroke-dasharray:100;stroke-dashoffset:100;animation:ptrDraw .55s ease-out forwards}"+
  "#ptr .hb-fin{display:none}"+
  "#ptr.done{box-shadow:0 8px 28px rgba(255,179,71,.6),0 0 0 1px rgba(255,210,138,.95);animation:ptrThump .55s ease-out}"+
  "@keyframes ptrScroll{to{transform:translateX(-120px)}}"+
  "@keyframes ptrDraw{0%{stroke-dashoffset:100;opacity:0}4%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}"+
  "@keyframes ptrThump{0%{scale:1}22%{scale:1.14}44%{scale:1}62%{scale:1.07}100%{scale:1}}"+
  "@media (prefers-reduced-motion:reduce){#ptr.load,#ptr.ready,#ptr.done{animation:none}}";
  document.head.appendChild(css);

  var el=document.createElement("div"); el.id="ptr"; el.setAttribute("aria-hidden","true");
  var grid=""; for(var gx=12;gx<W;gx+=12) grid+='<line class="hb-grid" x1="'+gx+'" y1="0" x2="'+gx+'" y2="'+H+'"/>';
  el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'+grid+
    '<line class="hb-grid" x1="0" y1="23" x2="'+W+'" y2="23"/>'+
    '<g class="hb-g"><path class="hb hb-pull" pathLength="100" stroke-dasharray="0 100" d="'+BEAT+'"/></g>'+
    '<circle class="hb-dot" r="3" cx="6" cy="23"/>'+
    '<path class="hb hb-loop" d="'+LOOP+'"/>'+
    '<path class="hb hb-flat" d="M6 23 H126"/>'+
    '<path class="hb hb-fin" pathLength="100" d="'+BEAT+'"/></svg>';
  var pull=el.querySelector(".hb-pull"), dot=el.querySelector(".hb-dot"), grp=el.querySelector(".hb-g");
  var BLEN=0; function blen(){ if(!BLEN){ try{ BLEN=pull.getTotalLength(); }catch(e){ BLEN=200; } } return BLEN; }
  function mount(){ if(!el.parentNode) document.body.appendChild(el); }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded",mount);

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
    if(!el.classList.contains("load")&&!el.classList.contains("done")&&!el.classList.contains("settle")){
      var q=Math.min(1,d/TRIGGER), amp=0.3+0.7*q;
      pull.setAttribute("stroke-dasharray",(q*100).toFixed(1)+" 100");
      grp.setAttribute("transform","translate(0 23) scale(1 "+amp.toFixed(2)+") translate(0 -23)");
      try{ var L=blen(), pt=pull.getPointAtLength(q*L); dot.setAttribute("cx",pt.x.toFixed(1)); dot.setAttribute("cy",(23+(pt.y-23)*amp).toFixed(1)); dot.style.opacity=q>0.02?"1":"0"; }catch(e){}
    }
  }
  var _env=null;
  function env(){ if(_env===null){ var d=document.createElement("div"); d.style.cssText="position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden"; document.body.appendChild(d); _env=d.getBoundingClientRect().height||0; d.remove(); } return _env; }

  function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

  function reset(){
    el.classList.remove("ready","load","done","settle"); st.ready=false;
    place(0,true);
  }

  async function run(){
    st.busy=true;
    el.classList.remove("ready"); el.classList.add("load","snap");
    el.style.opacity="1"; el.style.transform="translate3d(0,"+(TRIGGER*0.62+env()-4)+"px,0) scale(1)";
    var t0=Date.now(), ok=true;
    try{ await softRefresh(); }catch(e){ ok=false; try{ console.warn("ptr",e); }catch(_){} }
    var wait=Math.max(0,750-(Date.now()-t0)); if(wait) await new Promise(function(r){ setTimeout(r,wait); });
    el.classList.remove("load");
    if(ok){ el.classList.add("settle"); await new Promise(function(r){ setTimeout(r,320); }); el.classList.remove("settle"); el.classList.add("done"); buzz(12); await new Promise(function(r){ setTimeout(r,720); }); }
    else{ if(typeof toast==="function") toast("مفيش نت دلوقتي – جرّب تاني"); await new Promise(function(r){ setTimeout(r,60); }); }
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
      st.on=true; mount(); st.y0=t.clientY-SLOP; dy=SLOP; el.classList.remove("load","done","settle");
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
