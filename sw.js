/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d4b8e216";
const SHELL=["./","index.html","styles.css?v=d4b8e216","design.css?v=d4b8e216","design.js?v=d4b8e216","core.js?v=d4b8e216","data.js?v=d4b8e216","pro.js?v=d4b8e216","lab.js?v=d4b8e216","anatomy.js?v=d4b8e216","health.js?v=d4b8e216","posing.js?v=d4b8e216","minerals.js?v=d4b8e216","icons.js?v=d4b8e216","supps.js?v=d4b8e216","views.js?v=d4b8e216","coach.js?v=d4b8e216","signup.js?v=d4b8e216","qrcode.js?v=d4b8e216","invite.js?v=d4b8e216","chat.js?v=d4b8e216","inbox.js?v=d4b8e216","screens.js?v=d4b8e216","flame.js?v=d4b8e216","prices.js?v=d4b8e216","training.js?v=d4b8e216","sharecard.js?v=d4b8e216","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





