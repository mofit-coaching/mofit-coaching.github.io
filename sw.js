/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a678b59e";
const SHELL=["./","index.html","styles.css?v=a678b59e","design.css?v=a678b59e","design.js?v=a678b59e","core.js?v=a678b59e","data.js?v=a678b59e","media.js?v=a678b59e","pro.js?v=a678b59e","lab.js?v=a678b59e","anatomy.js?v=a678b59e","health.js?v=a678b59e","posing.js?v=a678b59e","minerals.js?v=a678b59e","icons.js?v=a678b59e","supps.js?v=a678b59e","views.js?v=a678b59e","coach.js?v=a678b59e","signup.js?v=a678b59e","qrcode.js?v=a678b59e","invite.js?v=a678b59e","referral.js?v=a678b59e","chat.js?v=a678b59e","inbox.js?v=a678b59e","screens.js?v=a678b59e","showcase.js?v=a678b59e","flame.js?v=a678b59e","photos.js?v=a678b59e","firstweek.js?v=a678b59e","league.js?v=a678b59e","prices.js?v=a678b59e","training.js?v=a678b59e","sharecard.js?v=a678b59e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



