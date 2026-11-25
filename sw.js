/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d9c41b08";
const SHELL=["./","index.html","styles.css?v=d9c41b08","design.css?v=d9c41b08","design.js?v=d9c41b08","core.js?v=d9c41b08","data.js?v=d9c41b08","pro.js?v=d9c41b08","lab.js?v=d9c41b08","anatomy.js?v=d9c41b08","health.js?v=d9c41b08","posing.js?v=d9c41b08","minerals.js?v=d9c41b08","icons.js?v=d9c41b08","supps.js?v=d9c41b08","views.js?v=d9c41b08","coach.js?v=d9c41b08","signup.js?v=d9c41b08","qrcode.js?v=d9c41b08","invite.js?v=d9c41b08","referral.js?v=d9c41b08","chat.js?v=d9c41b08","inbox.js?v=d9c41b08","screens.js?v=d9c41b08","showcase.js?v=d9c41b08","flame.js?v=d9c41b08","photos.js?v=d9c41b08","firstweek.js?v=d9c41b08","prices.js?v=d9c41b08","training.js?v=d9c41b08","sharecard.js?v=d9c41b08","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


