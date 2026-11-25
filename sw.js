/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-6b1d9f42";
const SHELL=["./","index.html","styles.css?v=6b1d9f42","design.css?v=6b1d9f42","design.js?v=6b1d9f42","core.js?v=6b1d9f42","data.js?v=6b1d9f42","pro.js?v=6b1d9f42","lab.js?v=6b1d9f42","anatomy.js?v=6b1d9f42","health.js?v=6b1d9f42","posing.js?v=6b1d9f42","minerals.js?v=6b1d9f42","icons.js?v=6b1d9f42","supps.js?v=6b1d9f42","views.js?v=6b1d9f42","coach.js?v=6b1d9f42","signup.js?v=6b1d9f42","qrcode.js?v=6b1d9f42","invite.js?v=6b1d9f42","chat.js?v=6b1d9f42","inbox.js?v=6b1d9f42","screens.js?v=6b1d9f42","prices.js?v=6b1d9f42","training.js?v=6b1d9f42","sharecard.js?v=6b1d9f42","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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









