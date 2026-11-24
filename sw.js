/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b94d2e6f";
const SHELL=["./","index.html","styles.css?v=b94d2e6f","design.css?v=b94d2e6f","design.js?v=b94d2e6f","core.js?v=b94d2e6f","data.js?v=b94d2e6f","pro.js?v=b94d2e6f","lab.js?v=b94d2e6f","anatomy.js?v=b94d2e6f","health.js?v=b94d2e6f","posing.js?v=b94d2e6f","minerals.js?v=b94d2e6f","icons.js?v=b94d2e6f","supps.js?v=b94d2e6f","views.js?v=b94d2e6f","coach.js?v=b94d2e6f","signup.js?v=b94d2e6f","chat.js?v=b94d2e6f","inbox.js?v=b94d2e6f","prices.js?v=b94d2e6f","training.js?v=b94d2e6f","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




