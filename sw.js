/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d2f60b83";
const SHELL=["./","index.html","styles.css?v=d2f60b83","core.js?v=d2f60b83","data.js?v=d2f60b83","pro.js?v=d2f60b83","lab.js?v=d2f60b83","health.js?v=d2f60b83","posing.js?v=d2f60b83","minerals.js?v=d2f60b83","icons.js?v=d2f60b83","supps.js?v=d2f60b83","views.js?v=d2f60b83","coach.js?v=d2f60b83","signup.js?v=d2f60b83","chat.js?v=d2f60b83","inbox.js?v=d2f60b83","prices.js?v=d2f60b83","training.js?v=d2f60b83","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



