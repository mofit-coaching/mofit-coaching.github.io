/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-4f5e6d7c";
const SHELL=["./","index.html","styles.css?v=4f5e6d7c","design.css?v=4f5e6d7c","design.js?v=4f5e6d7c","core.js?v=4f5e6d7c","data.js?v=4f5e6d7c","pro.js?v=4f5e6d7c","lab.js?v=4f5e6d7c","anatomy.js?v=4f5e6d7c","health.js?v=4f5e6d7c","posing.js?v=4f5e6d7c","minerals.js?v=4f5e6d7c","icons.js?v=4f5e6d7c","supps.js?v=4f5e6d7c","views.js?v=4f5e6d7c","coach.js?v=4f5e6d7c","signup.js?v=4f5e6d7c","qrcode.js?v=4f5e6d7c","invite.js?v=4f5e6d7c","chat.js?v=4f5e6d7c","inbox.js?v=4f5e6d7c","screens.js?v=4f5e6d7c","prices.js?v=4f5e6d7c","training.js?v=4f5e6d7c","sharecard.js?v=4f5e6d7c","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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









