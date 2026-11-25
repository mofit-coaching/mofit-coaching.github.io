/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-7873d629";
const SHELL=["./","index.html","styles.css?v=7873d629","design.css?v=7873d629","design.js?v=7873d629","core.js?v=7873d629","data.js?v=7873d629","media.js?v=7873d629","pro.js?v=7873d629","lab.js?v=7873d629","anatomy.js?v=7873d629","health.js?v=7873d629","posing.js?v=7873d629","minerals.js?v=7873d629","icons.js?v=7873d629","supps.js?v=7873d629","views.js?v=7873d629","coach.js?v=7873d629","signup.js?v=7873d629","qrcode.js?v=7873d629","invite.js?v=7873d629","referral.js?v=7873d629","transform.js?v=7873d629","chat.js?v=7873d629","inbox.js?v=7873d629","screens.js?v=7873d629","showcase.js?v=7873d629","flame.js?v=7873d629","photos.js?v=7873d629","firstweek.js?v=7873d629","league.js?v=7873d629","prices.js?v=7873d629","training.js?v=7873d629","sharecard.js?v=7873d629","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




