/* MOFIT Arabic tooltips: replaces the grey native browser tooltip with a small branded bubble.
   Desktop: hover or keyboard focus. iPhone/Android: press and hold an icon for half a second.
   Text comes from the element's own title (moved to data-tip so the native one does not double up)
   or, for icon-only buttons, its aria-label. No new wording is invented here. */
(function(){
  if(window.__fxTip) return; window.__fxTip=1;
  const RM=matchMedia("(prefers-reduced-motion: reduce)");
  const st=document.createElement("style");
  st.textContent=`.fx-tip{position:fixed;z-index:200;max-width:min(240px,calc(100vw - 24px));padding:8px 12px;border-radius:12px;font:600 .78rem/1.5 inherit;font-family:inherit;direction:rtl;text-align:center;color:#fff;
  background:rgba(11,18,32,.96);box-shadow:0 12px 30px -10px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.08),0 0 18px -4px rgba(255,107,26,.35);pointer-events:none;opacity:0;transform-origin:var(--ox,50%) var(--oy,100%);backdrop-filter:blur(8px)}
  .fx-tip::after{content:"";position:absolute;left:var(--ax,50%);width:10px;height:10px;margin-left:-5px;background:inherit;transform:rotate(45deg);border-radius:2px;bottom:-4px}
  .fx-tip.below::after{bottom:auto;top:-4px}
  .fx-tip.on{opacity:1;animation:fxTipIn .5s var(--spring,cubic-bezier(.34,1.56,.64,1))}
  @keyframes fxTipIn{from{opacity:0;scale:.6}to{opacity:1;scale:1}}
  @media(prefers-reduced-motion:reduce){.fx-tip.on{animation:none}}`;
  document.head.appendChild(st);
  const tip=document.createElement("div"); tip.className="fx-tip"; tip.setAttribute("role","tooltip"); document.body.appendChild(tip);
  let cur=null, timer=0, hideT=0;
  const SEL="[title],[data-tip],button[aria-label],a[aria-label],[role=button][aria-label]";
  function text(el){
    let t=el.getAttribute("data-tip");
    if(!t&&el.hasAttribute("title")){ t=el.getAttribute("title"); el.setAttribute("data-tip",t); el.removeAttribute("title"); }
    if(!t&&el.hasAttribute("aria-label")&&!el.textContent.trim().replace(/[\u200f\u200e\s]/g,"").match(/[\p{L}\p{N}]/u)) t=el.getAttribute("aria-label");
    return (t||"").trim();
  }
  function find(n){ return n&&n.closest?n.closest(SEL):null; }
  function show(el){
    const t=text(el); if(!t||t===tip.textContent&&cur===el&&tip.classList.contains("on")) return;
    clearTimeout(hideT); cur=el; tip.textContent=t; tip.classList.remove("on","below"); tip.style.left="0px"; tip.style.top="0px";
    const r=el.getBoundingClientRect(), w=tip.offsetWidth, h=tip.offsetHeight, vw=innerWidth;
    let x=r.left+r.width/2-w/2; x=Math.max(8,Math.min(x,vw-w-8));
    let y=r.top-h-10, below=false; if(y<8){ y=r.bottom+10; below=true; }
    tip.style.left=x+"px"; tip.style.top=y+"px"; tip.style.setProperty("--ax",(r.left+r.width/2-x)+"px");
    tip.style.setProperty("--oy",below?"0%":"100%"); tip.style.setProperty("--ox",(r.left+r.width/2-x)+"px");
    tip.classList.toggle("below",below); void tip.offsetWidth; tip.classList.add("on");
  }
  function hide(){ clearTimeout(timer); tip.classList.remove("on"); cur=null; }
  const fine=matchMedia("(hover:hover) and (pointer:fine)");
  document.addEventListener("pointerover",e=>{ if(e.pointerType==="touch"||!fine.matches) return; const el=find(e.target); if(el&&el!==cur){ clearTimeout(timer); timer=setTimeout(()=>show(el),350); } },{passive:true});
  document.addEventListener("pointerout",e=>{ if(e.pointerType==="touch") return; const el=find(e.target); if(el&&!el.contains(e.relatedTarget)) hide(); },{passive:true});
  document.addEventListener("focusin",e=>{ const el=find(e.target); if(el&&e.target.matches&&e.target.matches(":focus-visible")) show(el); });
  document.addEventListener("focusout",hide);
  document.addEventListener("scroll",hide,{passive:true,capture:true});
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") hide(); });
  /* touch: long-press shows the tip and swallows the click that would follow */
  let pressed=null;
  document.addEventListener("touchstart",e=>{ const el=find(e.target); pressed=null; if(!el||!text(el)) return;
    clearTimeout(timer); timer=setTimeout(()=>{ pressed=el; show(el); clearTimeout(hideT); hideT=setTimeout(hide,2400); },480); },{passive:true});
  ["touchend","touchmove","touchcancel"].forEach(ev=>document.addEventListener(ev,()=>{ clearTimeout(timer); },{passive:true}));
  document.addEventListener("click",e=>{ if(pressed&&find(e.target)===pressed){ e.preventDefault(); e.stopPropagation(); pressed=null; } },true);
  /* strip native titles as soon as elements appear, so no grey browser tooltip flashes first */
  function strip(n){ if(n.nodeType!==1) return; (n.matches&&n.matches("[title]")?[n]:[]).concat(n.querySelectorAll?[...n.querySelectorAll("[title]")]:[]).forEach(el=>{ if(el.closest("svg")&&!el.matches("svg")) return; text(el); }); }
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(strip))).observe(document.body,{childList:true,subtree:true});
  strip(document.body);
})();
