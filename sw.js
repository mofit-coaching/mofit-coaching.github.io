/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c7f04d28";
const SHELL=["./","index.html","styles.css?v=c7f04d28","design.css?v=c7f04d28","design.js?v=c7f04d28","core.js?v=c7f04d28","data.js?v=c7f04d28","pro.js?v=c7f04d28","lab.js?v=c7f04d28","anatomy.js?v=c7f04d28","health.js?v=c7f04d28","posing.js?v=c7f04d28","minerals.js?v=c7f04d28","icons.js?v=c7f04d28","supps.js?v=c7f04d28","views.js?v=c7f04d28","coach.js?v=c7f04d28","signup.js?v=c7f04d28","chat.js?v=c7f04d28","inbox.js?v=c7f04d28","screens.js?v=c7f04d28","flame.js?v=c7f04d28","prices.js?v=c7f04d28","training.js?v=c7f04d28","sharecard.js?v=c7f04d28","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





