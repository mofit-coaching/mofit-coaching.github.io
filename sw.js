/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a598d9de";
const SHELL=["./","index.html","styles.css?v=a598d9de","design.css?v=a598d9de","design.js?v=a598d9de","core.js?v=a598d9de","data.js?v=a598d9de","pro.js?v=a598d9de","lab.js?v=a598d9de","anatomy.js?v=a598d9de","health.js?v=a598d9de","posing.js?v=a598d9de","minerals.js?v=a598d9de","icons.js?v=a598d9de","supps.js?v=a598d9de","views.js?v=a598d9de","coach.js?v=a598d9de","signup.js?v=a598d9de","chat.js?v=a598d9de","inbox.js?v=a598d9de","screens.js?v=a598d9de","prices.js?v=a598d9de","training.js?v=a598d9de","sharecard.js?v=a598d9de","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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






