/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-60428be4";
const SHELL=["./","index.html","styles.css?v=60428be4","design.css?v=60428be4","design.js?v=60428be4","core.js?v=60428be4","data.js?v=60428be4","media.js?v=60428be4","pro.js?v=60428be4","lab.js?v=60428be4","anatomy.js?v=60428be4","health.js?v=60428be4","posing.js?v=60428be4","minerals.js?v=60428be4","icons.js?v=60428be4","supps.js?v=60428be4","views.js?v=60428be4","coach.js?v=60428be4","signup.js?v=60428be4","qrcode.js?v=60428be4","invite.js?v=60428be4","referral.js?v=60428be4","transform.js?v=60428be4","chat.js?v=60428be4","inbox.js?v=60428be4","screens.js?v=60428be4","showcase.js?v=60428be4","flame.js?v=60428be4","photos.js?v=60428be4","firstweek.js?v=60428be4","league.js?v=60428be4","prices.js?v=60428be4","training.js?v=60428be4","sharecard.js?v=60428be4","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





