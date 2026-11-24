/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-6cc5557d";
const SHELL=["./","index.html","styles.css?v=6cc5557d","design.css?v=6cc5557d","design.js?v=6cc5557d","core.js?v=6cc5557d","data.js?v=6cc5557d","pro.js?v=6cc5557d","lab.js?v=6cc5557d","anatomy.js?v=6cc5557d","health.js?v=6cc5557d","posing.js?v=6cc5557d","minerals.js?v=6cc5557d","icons.js?v=6cc5557d","supps.js?v=6cc5557d","views.js?v=6cc5557d","coach.js?v=6cc5557d","signup.js?v=6cc5557d","chat.js?v=6cc5557d","inbox.js?v=6cc5557d","screens.js?v=6cc5557d","prices.js?v=6cc5557d","training.js?v=6cc5557d","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


