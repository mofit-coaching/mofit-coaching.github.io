/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b96558fe";
const SHELL=["./","index.html","styles.css?v=b96558fe","design.css?v=b96558fe","design.js?v=b96558fe","core.js?v=b96558fe","data.js?v=b96558fe","pro.js?v=b96558fe","lab.js?v=b96558fe","health.js?v=b96558fe","posing.js?v=b96558fe","minerals.js?v=b96558fe","icons.js?v=b96558fe","supps.js?v=b96558fe","views.js?v=b96558fe","coach.js?v=b96558fe","signup.js?v=b96558fe","chat.js?v=b96558fe","inbox.js?v=b96558fe","screens.js?v=b96558fe","prices.js?v=b96558fe","training.js?v=b96558fe","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


