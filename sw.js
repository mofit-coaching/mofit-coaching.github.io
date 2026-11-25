/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-9a3c5e17";
const SHELL=["./","index.html","styles.css?v=9a3c5e17","design.css?v=9a3c5e17","design.js?v=9a3c5e17","core.js?v=9a3c5e17","data.js?v=9a3c5e17","media.js?v=9a3c5e17","pro.js?v=9a3c5e17","lab.js?v=9a3c5e17","anatomy.js?v=9a3c5e17","health.js?v=9a3c5e17","posing.js?v=9a3c5e17","minerals.js?v=9a3c5e17","ghealth.js?v=9a3c5e17","icons.js?v=9a3c5e17","supps.js?v=9a3c5e17","views.js?v=9a3c5e17","coach.js?v=9a3c5e17","signup.js?v=9a3c5e17","qrcode.js?v=9a3c5e17","invite.js?v=9a3c5e17","referral.js?v=9a3c5e17","transform.js?v=9a3c5e17","chat.js?v=9a3c5e17","aichat.js?v=9a3c5e17","ai.js?v=9a3c5e17","inbox.js?v=9a3c5e17","screens.js?v=9a3c5e17","showcase.js?v=9a3c5e17","flame.js?v=9a3c5e17","photos.js?v=9a3c5e17","firstweek.js?v=9a3c5e17","league.js?v=9a3c5e17","prices.js?v=9a3c5e17","training.js?v=9a3c5e17","sharecard.js?v=9a3c5e17","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




