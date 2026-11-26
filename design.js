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



/* Polish 3: mixed-script text and scroll cues.
   1) Latin runs inside Arabic text are wrapped in <bdi> so brackets and numbers stay on the right side.
   2) ALL-CAPS exercise names are shown in Title Case (display only; stored names are untouched).
   3) Horizontal chip rows show a fade on the side that has more items. */
(function(){
  const main=()=>document.getElementById("main");
  const AR=/[\u0600-\u06FF]/, LAT=/[A-Za-z]/;
  const KEEP=new Set("DB BB EZ RDL SL KB TRX RIR RPE HIIT LISS AMRAP EMOM PR GVT ACL PCL TDEE BMR PPL GHR JM PNF TUT ATG CNS BCAA EAA USDA AI PWA QR OK US UK USA FBEOD ULPPL AMPM RM 1RM HR".split(" "));
  const SKIP="script,style,textarea,input,select,option,code,pre,bdi,.logo,.logo-big,.wm2,.sc-eyebrow,.pp-eyebrow,.eyebrow,.stp-pill,th,[contenteditable],[data-nocaps],.cb,.mm,.mt,[class*=bub],[class*=msg]";
  const EXSEL=".ex-t b,.edit-ex b,.pv-ex span,.ex-n,.exr b,.xname";
  const run=/[A-Za-z][A-Za-z0-9'\u2019\-+&.\/]*(?: [A-Za-z][A-Za-z0-9'\u2019\-+&.\/]*)*/g;
  const isCaps=w=>w.replace(/[^A-Za-z]/g,"").length>=2&&w===w.toUpperCase();
  const title=w=>KEEP.has(w)?w:w.toLowerCase().replace(/(^|[-\/(])([a-z])/g,(m,a,b)=>a+b.toUpperCase());
  function fixRun(t,single){
    const words=t.split(" ");
    if(!words.every(isCaps)) return t;
    if(words.length<2&&!(single&&words[0].length>=5)) return t;
    return words.map(title).join(" ");
  }
  function proc(n){
    const par=n.parentElement; if(!par||par.closest(SKIP)) return;
    const txt=n.nodeValue; if(!LAT.test(txt)) return;
    const single=!!par.closest(EXSEL);
    const mixed=AR.test(txt)||(par.closest("[dir=rtl],html")&&AR.test(par.textContent||""));
    let m,last=0,frag=null; run.lastIndex=0;
    const parts=[];
    while((m=run.exec(txt))){
      const r=m[0], fixed=fixRun(r,single);
      parts.push([txt.slice(last,m.index),fixed,fixed!==r]); last=m.index+r.length;
    }
    if(!parts.length) return;
    const tail=txt.slice(last);
    if(!mixed){
      const nv=parts.map(p=>p[0]+p[1]).join("")+tail;
      if(nv!==txt) n.nodeValue=nv; return;
    }
    frag=document.createElement("span"); frag.className="bw";
    parts.forEach(p=>{ if(p[0]) frag.appendChild(document.createTextNode(p[0])); const b=document.createElement("bdi"); b.textContent=p[1]; frag.appendChild(b); });
    if(tail) frag.appendChild(document.createTextNode(tail));
    n.parentNode.replaceChild(frag,n);
  }
  function walk(root){
    if(!root||root.nodeType!==1&&root.nodeType!==3) return;
    if(root.nodeType===3){ proc(root); return; }
    if(root.closest&&root.closest(SKIP)) return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null), list=[]; let n;
    while((n=w.nextNode())) if(LAT.test(n.nodeValue)) list.push(n);
    list.forEach(proc);
  }
  const rows=".seg,.scroller,.scrollx,.qr-row,[style*='overflow-x']";
  function cue(el){
    if(el.clientWidth<1) return;
    const r=el.getBoundingClientRect(), kids=el.children; if(!kids.length) return;
    const a=kids[0].getBoundingClientRect(), b=kids[kids.length-1].getBoundingClientRect();
    const left=Math.min(a.left,b.left), right=Math.max(a.right,b.right);
    el.classList.add("sc-cue");
    el.classList.toggle("sc-l",left<r.left-3); el.classList.toggle("sc-r",right>r.right+3);
  }
  function cues(root){
    const list=(root&&root.querySelectorAll)?[...root.querySelectorAll(rows)]:[];
    if(root&&root.matches&&root.matches(rows)) list.push(root);
    list.forEach(el=>{ cue(el); if(!el._scc){ el._scc=1; el.addEventListener("scroll",()=>cue(el),{passive:true}); } });
  }
  let q=new Set(), raf=0;
  function flush(){ raf=0; const items=[...q]; q.clear(); items.forEach(n=>{ if(n&&n.isConnected){ walk(n); if(n.nodeType===1) cues(n); } }); }
  function start(){
    const m=main(); if(!m) return setTimeout(start,200);
    walk(m); cues(m);
    new MutationObserver(ms=>{ ms.forEach(x=>{ x.addedNodes.forEach(n=>{ if(n.nodeType===1||n.nodeType===3) q.add(n.nodeType===3?n.parentNode:n); }); if(x.type==="characterData"&&x.target.parentNode) q.add(x.target.parentNode); }); if(!raf) raf=requestAnimationFrame(flush); }).observe(m,{childList:true,subtree:true,characterData:true});
    window.addEventListener("resize",()=>cues(m),{passive:true});
    setTimeout(()=>cues(m),600);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
