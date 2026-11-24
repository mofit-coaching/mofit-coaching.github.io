/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-e1c5a7b2";
const SHELL=["./","index.html","styles.css?v=e1c5a7b2","core.js?v=e1c5a7b2","data.js?v=e1c5a7b2","pro.js?v=e1c5a7b2","lab.js?v=e1c5a7b2","icons.js?v=e1c5a7b2","supps.js?v=e1c5a7b2","views.js?v=e1c5a7b2","coach.js?v=e1c5a7b2","signup.js?v=e1c5a7b2","chat.js?v=e1c5a7b2","prices.js?v=e1c5a7b2","training.js?v=e1c5a7b2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


