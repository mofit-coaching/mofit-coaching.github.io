/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a8d3f156";
const SHELL=["./","index.html","styles.css?v=a8d3f156","design.css?v=a8d3f156","design.js?v=a8d3f156","core.js?v=a8d3f156","data.js?v=a8d3f156","pro.js?v=a8d3f156","lab.js?v=a8d3f156","anatomy.js?v=a8d3f156","health.js?v=a8d3f156","posing.js?v=a8d3f156","minerals.js?v=a8d3f156","icons.js?v=a8d3f156","supps.js?v=a8d3f156","views.js?v=a8d3f156","coach.js?v=a8d3f156","signup.js?v=a8d3f156","qrcode.js?v=a8d3f156","invite.js?v=a8d3f156","chat.js?v=a8d3f156","inbox.js?v=a8d3f156","screens.js?v=a8d3f156","showcase.js?v=a8d3f156","flame.js?v=a8d3f156","photos.js?v=a8d3f156","firstweek.js?v=a8d3f156","prices.js?v=a8d3f156","training.js?v=a8d3f156","sharecard.js?v=a8d3f156","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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



