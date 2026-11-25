/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-7b2e9f40";
const SHELL=["./","index.html","styles.css?v=7b2e9f40","design.css?v=7b2e9f40","design.js?v=7b2e9f40","core.js?v=7b2e9f40","data.js?v=7b2e9f40","media.js?v=7b2e9f40","pro.js?v=7b2e9f40","lab.js?v=7b2e9f40","anatomy.js?v=7b2e9f40","health.js?v=7b2e9f40","posing.js?v=7b2e9f40","minerals.js?v=7b2e9f40","icons.js?v=7b2e9f40","supps.js?v=7b2e9f40","views.js?v=7b2e9f40","coach.js?v=7b2e9f40","signup.js?v=7b2e9f40","qrcode.js?v=7b2e9f40","invite.js?v=7b2e9f40","referral.js?v=7b2e9f40","chat.js?v=7b2e9f40","inbox.js?v=7b2e9f40","screens.js?v=7b2e9f40","showcase.js?v=7b2e9f40","flame.js?v=7b2e9f40","photos.js?v=7b2e9f40","firstweek.js?v=7b2e9f40","league.js?v=7b2e9f40","prices.js?v=7b2e9f40","training.js?v=7b2e9f40","sharecard.js?v=7b2e9f40","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



