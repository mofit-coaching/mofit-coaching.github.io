/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-4e8a1d63";
const SHELL=["./","index.html","styles.css?v=4e8a1d63","design.css?v=4e8a1d63","design.js?v=4e8a1d63","core.js?v=4e8a1d63","data.js?v=4e8a1d63","pro.js?v=4e8a1d63","lab.js?v=4e8a1d63","anatomy.js?v=4e8a1d63","health.js?v=4e8a1d63","posing.js?v=4e8a1d63","minerals.js?v=4e8a1d63","icons.js?v=4e8a1d63","supps.js?v=4e8a1d63","views.js?v=4e8a1d63","coach.js?v=4e8a1d63","signup.js?v=4e8a1d63","qrcode.js?v=4e8a1d63","invite.js?v=4e8a1d63","referral.js?v=4e8a1d63","chat.js?v=4e8a1d63","inbox.js?v=4e8a1d63","screens.js?v=4e8a1d63","showcase.js?v=4e8a1d63","flame.js?v=4e8a1d63","photos.js?v=4e8a1d63","firstweek.js?v=4e8a1d63","league.js?v=4e8a1d63","prices.js?v=4e8a1d63","training.js?v=4e8a1d63","sharecard.js?v=4e8a1d63","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


