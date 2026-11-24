/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b4e61a09";
const SHELL=["./","index.html","styles.css?v=b4e61a09","design.css?v=b4e61a09","design.js?v=b4e61a09","core.js?v=b4e61a09","data.js?v=b4e61a09","pro.js?v=b4e61a09","lab.js?v=b4e61a09","anatomy.js?v=b4e61a09","health.js?v=b4e61a09","posing.js?v=b4e61a09","minerals.js?v=b4e61a09","icons.js?v=b4e61a09","supps.js?v=b4e61a09","views.js?v=b4e61a09","coach.js?v=b4e61a09","signup.js?v=b4e61a09","chat.js?v=b4e61a09","inbox.js?v=b4e61a09","screens.js?v=b4e61a09","prices.js?v=b4e61a09","training.js?v=b4e61a09","sharecard.js?v=b4e61a09","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





