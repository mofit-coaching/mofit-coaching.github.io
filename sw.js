/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-65f7a4eb";
const SHELL=["./","index.html","styles.css?v=65f7a4eb","design.css?v=65f7a4eb","design.js?v=65f7a4eb","core.js?v=65f7a4eb","data.js?v=65f7a4eb","pro.js?v=65f7a4eb","lab.js?v=65f7a4eb","anatomy.js?v=65f7a4eb","health.js?v=65f7a4eb","posing.js?v=65f7a4eb","minerals.js?v=65f7a4eb","icons.js?v=65f7a4eb","supps.js?v=65f7a4eb","views.js?v=65f7a4eb","coach.js?v=65f7a4eb","signup.js?v=65f7a4eb","chat.js?v=65f7a4eb","inbox.js?v=65f7a4eb","screens.js?v=65f7a4eb","prices.js?v=65f7a4eb","training.js?v=65f7a4eb","sharecard.js?v=65f7a4eb","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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









