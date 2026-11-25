/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f4c2a817";
const SHELL=["./","index.html","styles.css?v=f4c2a817","design.css?v=f4c2a817","design.js?v=f4c2a817","core.js?v=f4c2a817","data.js?v=f4c2a817","pro.js?v=f4c2a817","lab.js?v=f4c2a817","anatomy.js?v=f4c2a817","health.js?v=f4c2a817","posing.js?v=f4c2a817","minerals.js?v=f4c2a817","icons.js?v=f4c2a817","supps.js?v=f4c2a817","views.js?v=f4c2a817","coach.js?v=f4c2a817","signup.js?v=f4c2a817","qrcode.js?v=f4c2a817","invite.js?v=f4c2a817","chat.js?v=f4c2a817","inbox.js?v=f4c2a817","screens.js?v=f4c2a817","showcase.js?v=f4c2a817","flame.js?v=f4c2a817","firstweek.js?v=f4c2a817","prices.js?v=f4c2a817","training.js?v=f4c2a817","sharecard.js?v=f4c2a817","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




