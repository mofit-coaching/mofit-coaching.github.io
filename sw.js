/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f7a4b1c5";
const SHELL=["./","index.html","styles.css?v=f7a4b1c5","core.js?v=f7a4b1c5","data.js?v=f7a4b1c5","pro.js?v=f7a4b1c5","lab.js?v=f7a4b1c5","icons.js?v=f7a4b1c5","supps.js?v=f7a4b1c5","views.js?v=f7a4b1c5","coach.js?v=f7a4b1c5","signup.js?v=f7a4b1c5","chat.js?v=f7a4b1c5","prices.js?v=f7a4b1c5","training.js?v=f7a4b1c5","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



