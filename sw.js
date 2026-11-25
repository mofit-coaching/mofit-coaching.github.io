/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-2391ac99";
const SHELL=["./","index.html","styles.css?v=2391ac99","design.css?v=2391ac99","design.js?v=2391ac99","core.js?v=2391ac99","data.js?v=2391ac99","media.js?v=2391ac99","pro.js?v=2391ac99","lab.js?v=2391ac99","anatomy.js?v=2391ac99","health.js?v=2391ac99","posing.js?v=2391ac99","minerals.js?v=2391ac99","icons.js?v=2391ac99","supps.js?v=2391ac99","views.js?v=2391ac99","coach.js?v=2391ac99","signup.js?v=2391ac99","qrcode.js?v=2391ac99","invite.js?v=2391ac99","referral.js?v=2391ac99","transform.js?v=2391ac99","chat.js?v=2391ac99","inbox.js?v=2391ac99","screens.js?v=2391ac99","showcase.js?v=2391ac99","flame.js?v=2391ac99","photos.js?v=2391ac99","firstweek.js?v=2391ac99","league.js?v=2391ac99","prices.js?v=2391ac99","training.js?v=2391ac99","sharecard.js?v=2391ac99","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



