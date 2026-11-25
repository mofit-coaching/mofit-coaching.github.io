/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-5e1a7c93";
const SHELL=["./","index.html","styles.css?v=5e1a7c93","design.css?v=5e1a7c93","design.js?v=5e1a7c93","core.js?v=5e1a7c93","data.js?v=5e1a7c93","pro.js?v=5e1a7c93","lab.js?v=5e1a7c93","anatomy.js?v=5e1a7c93","health.js?v=5e1a7c93","posing.js?v=5e1a7c93","minerals.js?v=5e1a7c93","icons.js?v=5e1a7c93","supps.js?v=5e1a7c93","views.js?v=5e1a7c93","coach.js?v=5e1a7c93","signup.js?v=5e1a7c93","chat.js?v=5e1a7c93","inbox.js?v=5e1a7c93","screens.js?v=5e1a7c93","flame.js?v=5e1a7c93","prices.js?v=5e1a7c93","training.js?v=5e1a7c93","sharecard.js?v=5e1a7c93","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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






