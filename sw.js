/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-8c2d4e17";
const SHELL=["./","index.html","styles.css?v=8c2d4e17","design.css?v=8c2d4e17","design.js?v=8c2d4e17","core.js?v=8c2d4e17","data.js?v=8c2d4e17","pro.js?v=8c2d4e17","lab.js?v=8c2d4e17","anatomy.js?v=8c2d4e17","health.js?v=8c2d4e17","posing.js?v=8c2d4e17","minerals.js?v=8c2d4e17","icons.js?v=8c2d4e17","supps.js?v=8c2d4e17","views.js?v=8c2d4e17","coach.js?v=8c2d4e17","signup.js?v=8c2d4e17","chat.js?v=8c2d4e17","inbox.js?v=8c2d4e17","screens.js?v=8c2d4e17","prices.js?v=8c2d4e17","training.js?v=8c2d4e17","sharecard.js?v=8c2d4e17","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





