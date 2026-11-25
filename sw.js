/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-7c4a2e91";
const SHELL=["./","index.html","styles.css?v=7c4a2e91","design.css?v=7c4a2e91","design.js?v=7c4a2e91","core.js?v=7c4a2e91","data.js?v=7c4a2e91","media.js?v=7c4a2e91","pro.js?v=7c4a2e91","lab.js?v=7c4a2e91","anatomy.js?v=7c4a2e91","health.js?v=7c4a2e91","posing.js?v=7c4a2e91","minerals.js?v=7c4a2e91","icons.js?v=7c4a2e91","supps.js?v=7c4a2e91","views.js?v=7c4a2e91","coach.js?v=7c4a2e91","signup.js?v=7c4a2e91","qrcode.js?v=7c4a2e91","invite.js?v=7c4a2e91","referral.js?v=7c4a2e91","transform.js?v=7c4a2e91","chat.js?v=7c4a2e91","aichat.js?v=7c4a2e91","ai.js?v=7c4a2e91","inbox.js?v=7c4a2e91","screens.js?v=7c4a2e91","showcase.js?v=7c4a2e91","flame.js?v=7c4a2e91","photos.js?v=7c4a2e91","firstweek.js?v=7c4a2e91","league.js?v=7c4a2e91","prices.js?v=7c4a2e91","training.js?v=7c4a2e91","sharecard.js?v=7c4a2e91","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




