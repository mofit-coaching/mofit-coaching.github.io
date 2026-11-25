/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f3a71c02";
const SHELL=["./","index.html","styles.css?v=e91a3d70","design.css?v=e91a3d70","design.js?v=e91a3d70","core.js?v=e91a3d70","data.js?v=e91a3d70","pro.js?v=e91a3d70","lab.js?v=e91a3d70","anatomy.js?v=e91a3d70","health.js?v=e91a3d70","posing.js?v=e91a3d70","minerals.js?v=e91a3d70","icons.js?v=e91a3d70","supps.js?v=e91a3d70","views.js?v=e91a3d70","coach.js?v=e91a3d70","signup.js?v=e91a3d70","qrcode.js?v=e91a3d70","invite.js?v=e91a3d70","chat.js?v=e91a3d70","inbox.js?v=e91a3d70","screens.js?v=e91a3d70","showcase.js?v=e91a3d70","flame.js?v=e91a3d70","prices.js?v=e91a3d70","training.js?v=e91a3d70","sharecard.js?v=e91a3d70","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





