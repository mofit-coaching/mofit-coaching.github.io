/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-bd4a91f7";
const SHELL=["./","index.html","styles.css?v=bd4a91f7","design.css?v=bd4a91f7","design.js?v=bd4a91f7","core.js?v=bd4a91f7","data.js?v=bd4a91f7","pro.js?v=bd4a91f7","lab.js?v=bd4a91f7","anatomy.js?v=bd4a91f7","health.js?v=bd4a91f7","posing.js?v=bd4a91f7","minerals.js?v=bd4a91f7","icons.js?v=bd4a91f7","supps.js?v=bd4a91f7","views.js?v=bd4a91f7","coach.js?v=bd4a91f7","signup.js?v=bd4a91f7","chat.js?v=bd4a91f7","inbox.js?v=bd4a91f7","screens.js?v=bd4a91f7","prices.js?v=bd4a91f7","training.js?v=bd4a91f7","sharecard.js?v=bd4a91f7","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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








