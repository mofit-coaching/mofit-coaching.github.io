/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-eba29075";
const SHELL=["./","index.html","styles.css?v=eba29075","design.css?v=eba29075","design.js?v=eba29075","core.js?v=eba29075","data.js?v=eba29075","pro.js?v=eba29075","lab.js?v=eba29075","anatomy.js?v=eba29075","health.js?v=eba29075","posing.js?v=eba29075","minerals.js?v=eba29075","icons.js?v=eba29075","supps.js?v=eba29075","views.js?v=eba29075","coach.js?v=eba29075","signup.js?v=eba29075","chat.js?v=eba29075","inbox.js?v=eba29075","screens.js?v=eba29075","prices.js?v=eba29075","training.js?v=eba29075","sharecard.js?v=eba29075","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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








