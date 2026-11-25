/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-e5b91c37";
const SHELL=["./","index.html","styles.css?v=e5b91c37","design.css?v=e5b91c37","design.js?v=e5b91c37","core.js?v=e5b91c37","data.js?v=e5b91c37","media.js?v=e5b91c37","pro.js?v=e5b91c37","lab.js?v=e5b91c37","anatomy.js?v=e5b91c37","health.js?v=e5b91c37","posing.js?v=e5b91c37","minerals.js?v=e5b91c37","icons.js?v=e5b91c37","supps.js?v=e5b91c37","views.js?v=e5b91c37","coach.js?v=e5b91c37","signup.js?v=e5b91c37","qrcode.js?v=e5b91c37","invite.js?v=e5b91c37","referral.js?v=e5b91c37","transform.js?v=e5b91c37","chat.js?v=e5b91c37","inbox.js?v=e5b91c37","screens.js?v=e5b91c37","showcase.js?v=e5b91c37","flame.js?v=e5b91c37","photos.js?v=e5b91c37","firstweek.js?v=e5b91c37","league.js?v=e5b91c37","prices.js?v=e5b91c37","training.js?v=e5b91c37","sharecard.js?v=e5b91c37","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



