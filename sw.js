/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c83a41de";
const SHELL=["./","index.html","styles.css?v=c83a41de","design.css?v=c83a41de","design.js?v=c83a41de","core.js?v=c83a41de","data.js?v=c83a41de","pro.js?v=c83a41de","lab.js?v=c83a41de","anatomy.js?v=c83a41de","health.js?v=c83a41de","posing.js?v=c83a41de","minerals.js?v=c83a41de","icons.js?v=c83a41de","supps.js?v=c83a41de","views.js?v=c83a41de","coach.js?v=c83a41de","signup.js?v=c83a41de","chat.js?v=c83a41de","inbox.js?v=c83a41de","screens.js?v=c83a41de","prices.js?v=c83a41de","training.js?v=c83a41de","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



