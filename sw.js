/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d5e2f9a3";
const SHELL=["./","index.html","styles.css?v=d5e2f9a3","core.js?v=d5e2f9a3","data.js?v=d5e2f9a3","pro.js?v=d5e2f9a3","lab.js?v=d5e2f9a3","icons.js?v=d5e2f9a3","supps.js?v=d5e2f9a3","views.js?v=d5e2f9a3","coach.js?v=d5e2f9a3","signup.js?v=d5e2f9a3","chat.js?v=d5e2f9a3","prices.js?v=d5e2f9a3","training.js?v=d5e2f9a3","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



