/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-e7a2f9c3";
const SHELL=["./","index.html","styles.css?v=e7a2f9c3","design.css?v=e7a2f9c3","design.js?v=e7a2f9c3","core.js?v=e7a2f9c3","data.js?v=e7a2f9c3","pro.js?v=e7a2f9c3","lab.js?v=e7a2f9c3","anatomy.js?v=e7a2f9c3","health.js?v=e7a2f9c3","posing.js?v=e7a2f9c3","minerals.js?v=e7a2f9c3","icons.js?v=e7a2f9c3","supps.js?v=e7a2f9c3","views.js?v=e7a2f9c3","coach.js?v=e7a2f9c3","signup.js?v=e7a2f9c3","qrcode.js?v=e7a2f9c3","invite.js?v=e7a2f9c3","referral.js?v=e7a2f9c3","chat.js?v=e7a2f9c3","inbox.js?v=e7a2f9c3","screens.js?v=e7a2f9c3","showcase.js?v=e7a2f9c3","flame.js?v=e7a2f9c3","photos.js?v=e7a2f9c3","firstweek.js?v=e7a2f9c3","league.js?v=e7a2f9c3","prices.js?v=e7a2f9c3","training.js?v=e7a2f9c3","sharecard.js?v=e7a2f9c3","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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

