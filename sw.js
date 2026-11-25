/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c7d2e8f1";
const SHELL=["./","index.html","styles.css?v=c7d2e8f1","design.css?v=c7d2e8f1","design.js?v=c7d2e8f1","core.js?v=c7d2e8f1","data.js?v=c7d2e8f1","media.js?v=c7d2e8f1","pro.js?v=c7d2e8f1","lab.js?v=c7d2e8f1","anatomy.js?v=c7d2e8f1","health.js?v=c7d2e8f1","posing.js?v=c7d2e8f1","minerals.js?v=c7d2e8f1","icons.js?v=c7d2e8f1","supps.js?v=c7d2e8f1","views.js?v=c7d2e8f1","coach.js?v=c7d2e8f1","signup.js?v=c7d2e8f1","qrcode.js?v=c7d2e8f1","invite.js?v=c7d2e8f1","referral.js?v=c7d2e8f1","transform.js?v=c7d2e8f1","chat.js?v=c7d2e8f1","inbox.js?v=c7d2e8f1","screens.js?v=c7d2e8f1","showcase.js?v=c7d2e8f1","flame.js?v=c7d2e8f1","photos.js?v=c7d2e8f1","firstweek.js?v=c7d2e8f1","league.js?v=c7d2e8f1","prices.js?v=c7d2e8f1","training.js?v=c7d2e8f1","sharecard.js?v=c7d2e8f1","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




