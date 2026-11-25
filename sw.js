/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f3a71c02";
const SHELL=["./","index.html","styles.css?v=f3a71c02","design.css?v=f3a71c02","design.js?v=f3a71c02","core.js?v=f3a71c02","data.js?v=f3a71c02","pro.js?v=f3a71c02","lab.js?v=f3a71c02","anatomy.js?v=f3a71c02","health.js?v=f3a71c02","posing.js?v=f3a71c02","minerals.js?v=f3a71c02","icons.js?v=f3a71c02","supps.js?v=f3a71c02","views.js?v=f3a71c02","coach.js?v=f3a71c02","signup.js?v=f3a71c02","qrcode.js?v=f3a71c02","invite.js?v=f3a71c02","referral.js?v=f3a71c02","chat.js?v=f3a71c02","inbox.js?v=f3a71c02","screens.js?v=f3a71c02","showcase.js?v=f3a71c02","flame.js?v=f3a71c02","prices.js?v=f3a71c02","training.js?v=f3a71c02","sharecard.js?v=f3a71c02","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





