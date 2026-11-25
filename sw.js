/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c1e77a42";
const SHELL=["./","index.html","styles.css?v=c1e77a42","design.css?v=c1e77a42","design.js?v=c1e77a42","core.js?v=c1e77a42","data.js?v=c1e77a42","pro.js?v=c1e77a42","lab.js?v=c1e77a42","anatomy.js?v=c1e77a42","health.js?v=c1e77a42","posing.js?v=c1e77a42","minerals.js?v=c1e77a42","icons.js?v=c1e77a42","supps.js?v=c1e77a42","views.js?v=c1e77a42","coach.js?v=c1e77a42","signup.js?v=c1e77a42","qrcode.js?v=c1e77a42","invite.js?v=c1e77a42","referral.js?v=c1e77a42","chat.js?v=c1e77a42","inbox.js?v=c1e77a42","screens.js?v=c1e77a42","showcase.js?v=c1e77a42","flame.js?v=c1e77a42","photos.js?v=c1e77a42","firstweek.js?v=c1e77a42","prices.js?v=c1e77a42","training.js?v=c1e77a42","sharecard.js?v=c1e77a42","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



