/* Mofit instant loading helpers (loaded with defer, never blocks first paint).
   1) Every <img> added to the app gets loading="lazy" + decoding="async"
      (images above the fold keep eager loading), so long lists of photos,
      exercise pictures and chat media stop competing with the first screen.
   2) After the app is idle, the browser opens the connection to the Supabase
      host early so the first data request after a cold start is faster. */
(function(){
function tune(img){
  if(img._ins) return; img._ins=1;
  if(!img.hasAttribute("decoding")) img.decoding="async";
  if(img.hasAttribute("loading")||img.closest("#top,#nav,#boot,.login-art")) return;
  const r=img.getBoundingClientRect();
  if(r.top>innerHeight*1.2) img.loading="lazy";   // only below-the-fold images
}
function scan(n){ if(n.nodeType!==1) return; if(n.tagName==="IMG") tune(n); n.querySelectorAll&&n.querySelectorAll("img").forEach(tune); }
function start(){
  document.querySelectorAll("img").forEach(tune);
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.body,{childList:true,subtree:true});
  const idle=window.requestIdleCallback||(f=>setTimeout(f,1500));
  idle(()=>{ try{
    const h=document.createElement("link"); h.rel="preconnect"; h.href="https://bqxyyrmtufureewxneoe.supabase.co"; h.crossOrigin="anonymous"; document.head.appendChild(h);
  }catch(e){} });
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
