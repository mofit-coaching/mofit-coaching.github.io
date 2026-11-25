/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-9d3e7a1f";
const SHELL=["./","index.html","styles.css?v=9d3e7a1f","design.css?v=9d3e7a1f","design.js?v=9d3e7a1f","core.js?v=9d3e7a1f","data.js?v=9d3e7a1f","media.js?v=9d3e7a1f","pro.js?v=9d3e7a1f","lab.js?v=9d3e7a1f","anatomy.js?v=9d3e7a1f","health.js?v=9d3e7a1f","posing.js?v=9d3e7a1f","minerals.js?v=9d3e7a1f","icons.js?v=9d3e7a1f","supps.js?v=9d3e7a1f","views.js?v=9d3e7a1f","coach.js?v=9d3e7a1f","signup.js?v=9d3e7a1f","qrcode.js?v=9d3e7a1f","invite.js?v=9d3e7a1f","referral.js?v=9d3e7a1f","transform.js?v=9d3e7a1f","chat.js?v=9d3e7a1f","inbox.js?v=9d3e7a1f","screens.js?v=9d3e7a1f","showcase.js?v=9d3e7a1f","flame.js?v=9d3e7a1f","photos.js?v=9d3e7a1f","firstweek.js?v=9d3e7a1f","league.js?v=9d3e7a1f","prices.js?v=9d3e7a1f","training.js?v=9d3e7a1f","sharecard.js?v=9d3e7a1f","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



