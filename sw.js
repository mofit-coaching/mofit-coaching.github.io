/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-2c9f6a15";
const SHELL=["./","index.html","styles.css?v=2c9f6a15","design.css?v=2c9f6a15","design.js?v=2c9f6a15","core.js?v=2c9f6a15","data.js?v=2c9f6a15","media.js?v=2c9f6a15","pro.js?v=2c9f6a15","lab.js?v=2c9f6a15","anatomy.js?v=2c9f6a15","health.js?v=2c9f6a15","posing.js?v=2c9f6a15","minerals.js?v=2c9f6a15","icons.js?v=2c9f6a15","supps.js?v=2c9f6a15","views.js?v=2c9f6a15","coach.js?v=2c9f6a15","signup.js?v=2c9f6a15","qrcode.js?v=2c9f6a15","invite.js?v=2c9f6a15","referral.js?v=2c9f6a15","transform.js?v=2c9f6a15","chat.js?v=2c9f6a15","inbox.js?v=2c9f6a15","screens.js?v=2c9f6a15","showcase.js?v=2c9f6a15","flame.js?v=2c9f6a15","photos.js?v=2c9f6a15","firstweek.js?v=2c9f6a15","league.js?v=2c9f6a15","prices.js?v=2c9f6a15","training.js?v=2c9f6a15","sharecard.js?v=2c9f6a15","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




