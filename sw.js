/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-1c6e6b32";
const SHELL=["./","index.html","styles.css?v=1c6e6b32","design.css?v=1c6e6b32","design.js?v=1c6e6b32","core.js?v=1c6e6b32","data.js?v=1c6e6b32","pro.js?v=1c6e6b32","lab.js?v=1c6e6b32","health.js?v=1c6e6b32","posing.js?v=1c6e6b32","minerals.js?v=1c6e6b32","icons.js?v=1c6e6b32","supps.js?v=1c6e6b32","views.js?v=1c6e6b32","coach.js?v=1c6e6b32","signup.js?v=1c6e6b32","chat.js?v=1c6e6b32","inbox.js?v=1c6e6b32","prices.js?v=1c6e6b32","training.js?v=1c6e6b32","sharecard.js?v=1c6e6b32","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



