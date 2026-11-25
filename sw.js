/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-7a2f4c9d";
const SHELL=["./","index.html","styles.css?v=7a2f4c9d","design.css?v=7a2f4c9d","design.js?v=7a2f4c9d","core.js?v=7a2f4c9d","data.js?v=7a2f4c9d","pro.js?v=7a2f4c9d","lab.js?v=7a2f4c9d","anatomy.js?v=7a2f4c9d","health.js?v=7a2f4c9d","posing.js?v=7a2f4c9d","minerals.js?v=7a2f4c9d","icons.js?v=7a2f4c9d","supps.js?v=7a2f4c9d","views.js?v=7a2f4c9d","coach.js?v=7a2f4c9d","signup.js?v=7a2f4c9d","qrcode.js?v=7a2f4c9d","invite.js?v=7a2f4c9d","chat.js?v=7a2f4c9d","inbox.js?v=7a2f4c9d","screens.js?v=7a2f4c9d","showcase.js?v=7a2f4c9d","flame.js?v=7a2f4c9d","firstweek.js?v=7a2f4c9d","league.js?v=7a2f4c9d","prices.js?v=7a2f4c9d","training.js?v=7a2f4c9d","sharecard.js?v=7a2f4c9d","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



