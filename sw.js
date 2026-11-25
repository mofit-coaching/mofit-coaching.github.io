/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-e7f2a91c";
const SHELL=["./","index.html","styles.css?v=e7f2a91c","design.css?v=e7f2a91c","design.js?v=e7f2a91c","core.js?v=e7f2a91c","data.js?v=e7f2a91c","pro.js?v=e7f2a91c","lab.js?v=e7f2a91c","anatomy.js?v=e7f2a91c","health.js?v=e7f2a91c","posing.js?v=e7f2a91c","minerals.js?v=e7f2a91c","icons.js?v=e7f2a91c","supps.js?v=e7f2a91c","views.js?v=e7f2a91c","coach.js?v=e7f2a91c","signup.js?v=e7f2a91c","chat.js?v=e7f2a91c","inbox.js?v=e7f2a91c","screens.js?v=e7f2a91c","flame.js?v=e7f2a91c","firstweek.js?v=e7f2a91c","prices.js?v=e7f2a91c","training.js?v=e7f2a91c","sharecard.js?v=e7f2a91c","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




