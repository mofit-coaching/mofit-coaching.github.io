/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-7c2f90ab";
const SHELL=["./","index.html","styles.css?v=7c2f90ab","design.css?v=7c2f90ab","design.js?v=7c2f90ab","core.js?v=7c2f90ab","data.js?v=7c2f90ab","pro.js?v=7c2f90ab","lab.js?v=7c2f90ab","anatomy.js?v=7c2f90ab","health.js?v=7c2f90ab","posing.js?v=7c2f90ab","minerals.js?v=7c2f90ab","icons.js?v=7c2f90ab","supps.js?v=7c2f90ab","views.js?v=7c2f90ab","coach.js?v=7c2f90ab","signup.js?v=7c2f90ab","qrcode.js?v=7c2f90ab","invite.js?v=7c2f90ab","chat.js?v=7c2f90ab","inbox.js?v=7c2f90ab","screens.js?v=7c2f90ab","showcase.js?v=7c2f90ab","flame.js?v=7c2f90ab","prices.js?v=7c2f90ab","training.js?v=7c2f90ab","sharecard.js?v=7c2f90ab","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET" || u.hostname.endsWith("supabase.co")) return;
  const isPage=e.request.mode==="navigate";
  if(isPage){ e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(C).then(c=>c.put("index.html",cp)); return r; }).catch(()=>caches.match("index.html"))); return; }
  if(u.origin===location.origin || /jsdelivr|googleapis|gstatic/.test(u.hostname)){
    e.respondWith(caches.match(e.request).then(hit=>{ const net=fetch(e.request).then(r=>{ if(r.ok||r.type==="opaque"){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; }).catch(()=>hit); return hit||net; }));
  }
});





