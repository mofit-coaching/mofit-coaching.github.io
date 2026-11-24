/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c47e90b2";
const SHELL=["./","index.html","styles.css?v=c47e90b2","core.js?v=c47e90b2","data.js?v=c47e90b2","pro.js?v=c47e90b2","lab.js?v=c47e90b2","health.js?v=c47e90b2","posing.js?v=c47e90b2","icons.js?v=c47e90b2","supps.js?v=c47e90b2","views.js?v=c47e90b2","coach.js?v=c47e90b2","signup.js?v=c47e90b2","chat.js?v=c47e90b2","inbox.js?v=c47e90b2","prices.js?v=c47e90b2","training.js?v=c47e90b2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



