/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-cb1d98b2";
const SHELL=["./","index.html","styles.css?v=cb1d98b2","design.css?v=cb1d98b2","design.js?v=cb1d98b2","core.js?v=cb1d98b2","data.js?v=cb1d98b2","pro.js?v=cb1d98b2","lab.js?v=cb1d98b2","anatomy.js?v=cb1d98b2","health.js?v=cb1d98b2","posing.js?v=cb1d98b2","minerals.js?v=cb1d98b2","icons.js?v=cb1d98b2","supps.js?v=cb1d98b2","views.js?v=cb1d98b2","coach.js?v=cb1d98b2","signup.js?v=cb1d98b2","chat.js?v=cb1d98b2","inbox.js?v=cb1d98b2","screens.js?v=cb1d98b2","prices.js?v=cb1d98b2","training.js?v=cb1d98b2","sharecard.js?v=cb1d98b2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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








