/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-9e4b7a2d";
const SHELL=["./","index.html","styles.css?v=9e4b7a2d","design.css?v=9e4b7a2d","design.js?v=9e4b7a2d","core.js?v=9e4b7a2d","data.js?v=9e4b7a2d","pro.js?v=9e4b7a2d","lab.js?v=9e4b7a2d","anatomy.js?v=9e4b7a2d","health.js?v=9e4b7a2d","posing.js?v=9e4b7a2d","minerals.js?v=9e4b7a2d","icons.js?v=9e4b7a2d","supps.js?v=9e4b7a2d","views.js?v=9e4b7a2d","coach.js?v=9e4b7a2d","signup.js?v=9e4b7a2d","qrcode.js?v=9e4b7a2d","invite.js?v=9e4b7a2d","referral.js?v=9e4b7a2d","chat.js?v=9e4b7a2d","inbox.js?v=9e4b7a2d","screens.js?v=9e4b7a2d","showcase.js?v=9e4b7a2d","flame.js?v=9e4b7a2d","photos.js?v=9e4b7a2d","firstweek.js?v=9e4b7a2d","league.js?v=9e4b7a2d","prices.js?v=9e4b7a2d","training.js?v=9e4b7a2d","sharecard.js?v=9e4b7a2d","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


