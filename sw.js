/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-3b6d58c2";
const SHELL=["./","index.html","styles.css?v=3b6d58c2","design.css?v=3b6d58c2","design.js?v=3b6d58c2","core.js?v=3b6d58c2","data.js?v=3b6d58c2","pro.js?v=3b6d58c2","lab.js?v=3b6d58c2","anatomy.js?v=3b6d58c2","health.js?v=3b6d58c2","posing.js?v=3b6d58c2","minerals.js?v=3b6d58c2","icons.js?v=3b6d58c2","supps.js?v=3b6d58c2","views.js?v=3b6d58c2","coach.js?v=3b6d58c2","signup.js?v=3b6d58c2","qrcode.js?v=3b6d58c2","invite.js?v=3b6d58c2","chat.js?v=3b6d58c2","inbox.js?v=3b6d58c2","screens.js?v=3b6d58c2","showcase.js?v=3b6d58c2","flame.js?v=3b6d58c2","prices.js?v=3b6d58c2","training.js?v=3b6d58c2","sharecard.js?v=3b6d58c2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





