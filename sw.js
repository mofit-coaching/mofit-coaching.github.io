/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a3c91f5e";
const SHELL=["./","index.html","styles.css?v=a3c91f5e","core.js?v=a3c91f5e","data.js?v=a3c91f5e","pro.js?v=a3c91f5e","lab.js?v=a3c91f5e","icons.js?v=a3c91f5e","supps.js?v=a3c91f5e","views.js?v=a3c91f5e","coach.js?v=a3c91f5e","signup.js?v=a3c91f5e","chat.js?v=a3c91f5e","inbox.js?v=a3c91f5e","prices.js?v=a3c91f5e","training.js?v=a3c91f5e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



