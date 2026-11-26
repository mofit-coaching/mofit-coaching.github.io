/* MOFIT motion: smooth scrolling + page transitions between tabs and client files.
   - window.scrollTo(0,0) after a tab change glides instead of jumping.
   - #main slides in from the side the tab sits on (RTL aware), with a soft settle.
   - Only runs when the screen really changes, not on data refreshes. Respects reduced motion. */
(function(){
  if(window.__mfMotion) return; window.__mfMotion=true;
  const rm=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease="cubic-bezier(.22,.9,.24,1)";
  /* smooth scroll to top */
  const _st=window.scrollTo.bind(window);
  window.scrollTo=function(a,b){
    if(a===0&&b===0&&!rm()&&(window.scrollY||0)>40){ try{ return _st({top:0,left:0,behavior:"smooth"}); }catch(e){} }
    return _st.apply(null,arguments);
  };
  /* in-page anchor links glide */
  document.addEventListener("click",e=>{
    const a=e.target.closest&&e.target.closest('a[href^="#"]'); if(!a||rm()) return;
    const id=a.getAttribute("href").slice(1); const t=id&&document.getElementById(id); if(!t) return;
    e.preventDefault(); t.scrollIntoView({behavior:"smooth",block:"start"});
  });
  /* page transitions */
  let lastKey=null, lastIdx=-1;
  const keyNow=()=>{
    try{ return (S&&S.tab||"")+"|"+(S&&S.client&&S.client.id||""); }catch(e){ return ""; }
  };
  const idxNow=()=>{
    const bs=[...document.querySelectorAll("#nav button")]; const i=bs.findIndex(b=>b.classList.contains("on")); return i;
  };
  function enter(m,dir){
    if(rm()||!m.animate) return;
    const rtl=getComputedStyle(document.documentElement).direction==="rtl";
    const dx=(dir||1)*(rtl?-1:1)*26;
    m.animate([{opacity:.0,transform:"translateX("+dx+"px) scale(.985)"},{opacity:1,transform:"none"}],{duration:380,easing:ease});
  }
  function init(){
    const m=document.getElementById("main"); if(!m) return;
    let raf=0;
    new MutationObserver(()=>{
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        if(!m.children.length) return;
        const k=keyNow(); const i=idxNow();
        if(lastKey!==null&&k!==lastKey){ enter(m,i>=lastIdx?1:-1); }
        lastKey=k; lastIdx=i;
      });
    }).observe(m,{childList:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
