/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c3d81e5a";
const SHELL=["./","index.html","styles.css?v=c3d81e5a","design.css?v=c3d81e5a","design.js?v=c3d81e5a","core.js?v=c3d81e5a","data.js?v=c3d81e5a","media.js?v=c3d81e5a","pro.js?v=c3d81e5a","lab.js?v=c3d81e5a","anatomy.js?v=c3d81e5a","health.js?v=c3d81e5a","posing.js?v=c3d81e5a","minerals.js?v=c3d81e5a","icons.js?v=c3d81e5a","supps.js?v=c3d81e5a","views.js?v=c3d81e5a","coach.js?v=c3d81e5a","signup.js?v=c3d81e5a","qrcode.js?v=c3d81e5a","invite.js?v=c3d81e5a","referral.js?v=c3d81e5a","chat.js?v=c3d81e5a","inbox.js?v=c3d81e5a","screens.js?v=c3d81e5a","showcase.js?v=c3d81e5a","flame.js?v=c3d81e5a","photos.js?v=c3d81e5a","firstweek.js?v=c3d81e5a","league.js?v=c3d81e5a","prices.js?v=c3d81e5a","training.js?v=c3d81e5a","sharecard.js?v=c3d81e5a","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



