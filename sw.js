/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-9c41e7ab";
const SHELL=["./","index.html","styles.css?v=9c41e7ab","design.css?v=9c41e7ab","design.js?v=9c41e7ab","core.js?v=9c41e7ab","data.js?v=9c41e7ab","pro.js?v=9c41e7ab","lab.js?v=9c41e7ab","anatomy.js?v=9c41e7ab","health.js?v=9c41e7ab","posing.js?v=9c41e7ab","minerals.js?v=9c41e7ab","icons.js?v=9c41e7ab","supps.js?v=9c41e7ab","views.js?v=9c41e7ab","coach.js?v=9c41e7ab","signup.js?v=9c41e7ab","chat.js?v=9c41e7ab","inbox.js?v=9c41e7ab","screens.js?v=9c41e7ab","flame.js?v=9c41e7ab","prices.js?v=9c41e7ab","training.js?v=9c41e7ab","sharecard.js?v=9c41e7ab","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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






