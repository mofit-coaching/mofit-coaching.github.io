/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d8b3f6a2";
const SHELL=["./","index.html","styles.css?v=d8b3f6a2","design.css?v=d8b3f6a2","design.js?v=d8b3f6a2","core.js?v=d8b3f6a2","data.js?v=d8b3f6a2","media.js?v=d8b3f6a2","pro.js?v=d8b3f6a2","lab.js?v=d8b3f6a2","anatomy.js?v=d8b3f6a2","health.js?v=d8b3f6a2","posing.js?v=d8b3f6a2","minerals.js?v=d8b3f6a2","icons.js?v=d8b3f6a2","supps.js?v=d8b3f6a2","views.js?v=d8b3f6a2","coach.js?v=d8b3f6a2","signup.js?v=d8b3f6a2","qrcode.js?v=d8b3f6a2","invite.js?v=d8b3f6a2","referral.js?v=d8b3f6a2","transform.js?v=d8b3f6a2","chat.js?v=d8b3f6a2","aichat.js?v=d8b3f6a2","ai.js?v=d8b3f6a2","inbox.js?v=d8b3f6a2","screens.js?v=d8b3f6a2","showcase.js?v=d8b3f6a2","flame.js?v=d8b3f6a2","photos.js?v=d8b3f6a2","firstweek.js?v=d8b3f6a2","league.js?v=d8b3f6a2","prices.js?v=d8b3f6a2","training.js?v=d8b3f6a2","sharecard.js?v=d8b3f6a2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



