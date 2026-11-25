/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a51c9e02";
const SHELL=["./","index.html","styles.css?v=a51c9e02","design.css?v=a51c9e02","design.js?v=a51c9e02","core.js?v=a51c9e02","data.js?v=a51c9e02","media.js?v=a51c9e02","pro.js?v=a51c9e02","lab.js?v=a51c9e02","anatomy.js?v=a51c9e02","health.js?v=a51c9e02","posing.js?v=a51c9e02","minerals.js?v=a51c9e02","icons.js?v=a51c9e02","supps.js?v=a51c9e02","views.js?v=a51c9e02","coach.js?v=a51c9e02","signup.js?v=a51c9e02","qrcode.js?v=a51c9e02","invite.js?v=a51c9e02","chat.js?v=a51c9e02","inbox.js?v=a51c9e02","screens.js?v=a51c9e02","showcase.js?v=a51c9e02","flame.js?v=a51c9e02","firstweek.js?v=a51c9e02","prices.js?v=a51c9e02","training.js?v=a51c9e02","sharecard.js?v=a51c9e02","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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





