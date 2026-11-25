/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d7a24b19";
const SHELL=["./","index.html","styles.css?v=d7a24b19","design.css?v=d7a24b19","design.js?v=d7a24b19","core.js?v=d7a24b19","data.js?v=d7a24b19","media.js?v=d7a24b19","pro.js?v=d7a24b19","lab.js?v=d7a24b19","anatomy.js?v=d7a24b19","health.js?v=d7a24b19","posing.js?v=d7a24b19","minerals.js?v=d7a24b19","icons.js?v=d7a24b19","supps.js?v=d7a24b19","views.js?v=d7a24b19","coach.js?v=d7a24b19","signup.js?v=d7a24b19","qrcode.js?v=d7a24b19","invite.js?v=d7a24b19","referral.js?v=d7a24b19","chat.js?v=d7a24b19","inbox.js?v=d7a24b19","screens.js?v=d7a24b19","showcase.js?v=d7a24b19","flame.js?v=d7a24b19","photos.js?v=d7a24b19","firstweek.js?v=d7a24b19","league.js?v=d7a24b19","prices.js?v=d7a24b19","training.js?v=d7a24b19","sharecard.js?v=d7a24b19","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



