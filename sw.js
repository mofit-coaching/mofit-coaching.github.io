/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-60637b68";
const SHELL=["./","index.html","styles.css?v=60637b68","design.css?v=60637b68","design.js?v=60637b68","core.js?v=60637b68","data.js?v=60637b68","pro.js?v=60637b68","lab.js?v=60637b68","anatomy.js?v=60637b68","health.js?v=60637b68","posing.js?v=60637b68","minerals.js?v=60637b68","icons.js?v=60637b68","supps.js?v=60637b68","views.js?v=60637b68","coach.js?v=60637b68","signup.js?v=60637b68","chat.js?v=60637b68","inbox.js?v=60637b68","screens.js?v=60637b68","prices.js?v=60637b68","training.js?v=60637b68","sharecard.js?v=60637b68","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


