/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-7f3b1a9e";
const SHELL=["./","index.html","styles.css?v=7f3b1a9e","design.css?v=7f3b1a9e","design.js?v=7f3b1a9e","core.js?v=7f3b1a9e","data.js?v=7f3b1a9e","pro.js?v=7f3b1a9e","lab.js?v=7f3b1a9e","anatomy.js?v=7f3b1a9e","health.js?v=7f3b1a9e","posing.js?v=7f3b1a9e","minerals.js?v=7f3b1a9e","icons.js?v=7f3b1a9e","supps.js?v=7f3b1a9e","views.js?v=7f3b1a9e","coach.js?v=7f3b1a9e","signup.js?v=7f3b1a9e","qrcode.js?v=7f3b1a9e","invite.js?v=7f3b1a9e","chat.js?v=7f3b1a9e","inbox.js?v=7f3b1a9e","screens.js?v=7f3b1a9e","prices.js?v=7f3b1a9e","training.js?v=7f3b1a9e","sharecard.js?v=7f3b1a9e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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








