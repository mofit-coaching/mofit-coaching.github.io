/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b3f5a91c";
const SHELL=["./","index.html","styles.css?v=b3f5a91c","design.css?v=b3f5a91c","design.js?v=b3f5a91c","core.js?v=b3f5a91c","data.js?v=b3f5a91c","pro.js?v=b3f5a91c","lab.js?v=b3f5a91c","anatomy.js?v=b3f5a91c","health.js?v=b3f5a91c","posing.js?v=b3f5a91c","minerals.js?v=b3f5a91c","icons.js?v=b3f5a91c","supps.js?v=b3f5a91c","views.js?v=b3f5a91c","coach.js?v=b3f5a91c","signup.js?v=b3f5a91c","qrcode.js?v=b3f5a91c","invite.js?v=b3f5a91c","referral.js?v=b3f5a91c","chat.js?v=b3f5a91c","inbox.js?v=b3f5a91c","screens.js?v=b3f5a91c","showcase.js?v=b3f5a91c","flame.js?v=b3f5a91c","photos.js?v=b3f5a91c","firstweek.js?v=b3f5a91c","league.js?v=b3f5a91c","prices.js?v=b3f5a91c","training.js?v=b3f5a91c","sharecard.js?v=b3f5a91c","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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

