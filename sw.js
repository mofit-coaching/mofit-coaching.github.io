/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f45a01c9";
const SHELL=["./","index.html","styles.css?v=f45a01c9","design.css?v=f45a01c9","design.js?v=f45a01c9","core.js?v=f45a01c9","data.js?v=f45a01c9","pro.js?v=f45a01c9","lab.js?v=f45a01c9","anatomy.js?v=f45a01c9","health.js?v=f45a01c9","posing.js?v=f45a01c9","minerals.js?v=f45a01c9","icons.js?v=f45a01c9","supps.js?v=f45a01c9","views.js?v=f45a01c9","coach.js?v=f45a01c9","signup.js?v=f45a01c9","chat.js?v=f45a01c9","inbox.js?v=f45a01c9","screens.js?v=f45a01c9","prices.js?v=f45a01c9","training.js?v=f45a01c9","sharecard.js?v=f45a01c9","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




