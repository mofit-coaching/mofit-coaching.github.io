/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-ec256d9f";
const SHELL=["./","index.html","styles.css?v=ec256d9f","design.css?v=ec256d9f","design.js?v=ec256d9f","core.js?v=ec256d9f","data.js?v=ec256d9f","pro.js?v=ec256d9f","lab.js?v=ec256d9f","anatomy.js?v=ec256d9f","health.js?v=ec256d9f","posing.js?v=ec256d9f","minerals.js?v=ec256d9f","icons.js?v=ec256d9f","supps.js?v=ec256d9f","views.js?v=ec256d9f","coach.js?v=ec256d9f","signup.js?v=ec256d9f","chat.js?v=ec256d9f","inbox.js?v=ec256d9f","screens.js?v=ec256d9f","prices.js?v=ec256d9f","training.js?v=ec256d9f","sharecard.js?v=ec256d9f","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




