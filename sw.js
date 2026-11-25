/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b41c0de2";
const SHELL=["./","index.html","styles.css?v=b41c0de2","design.css?v=b41c0de2","design.js?v=b41c0de2","core.js?v=b41c0de2","data.js?v=b41c0de2","media.js?v=b41c0de2","pro.js?v=b41c0de2","lab.js?v=b41c0de2","anatomy.js?v=b41c0de2","health.js?v=b41c0de2","posing.js?v=b41c0de2","minerals.js?v=b41c0de2","ghealth.js?v=b41c0de2","icons.js?v=b41c0de2","supps.js?v=b41c0de2","views.js?v=b41c0de2","coach.js?v=b41c0de2","signup.js?v=b41c0de2","qrcode.js?v=b41c0de2","invite.js?v=b41c0de2","referral.js?v=b41c0de2","transform.js?v=b41c0de2","chat.js?v=b41c0de2","aichat.js?v=b41c0de2","ai.js?v=b41c0de2","inbox.js?v=b41c0de2","screens.js?v=b41c0de2","showcase.js?v=b41c0de2","flame.js?v=b41c0de2","photos.js?v=b41c0de2","firstweek.js?v=b41c0de2","league.js?v=b41c0de2","prices.js?v=b41c0de2","training.js?v=b41c0de2","sharecard.js?v=b41c0de2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



