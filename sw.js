/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a94f21d7";
const SHELL=["./","index.html","styles.css?v=a94f21d7","design.css?v=a94f21d7","design.js?v=a94f21d7","core.js?v=a94f21d7","data.js?v=a94f21d7","pro.js?v=a94f21d7","lab.js?v=a94f21d7","anatomy.js?v=a94f21d7","health.js?v=a94f21d7","posing.js?v=a94f21d7","minerals.js?v=a94f21d7","icons.js?v=a94f21d7","supps.js?v=a94f21d7","views.js?v=a94f21d7","coach.js?v=a94f21d7","signup.js?v=a94f21d7","qrcode.js?v=a94f21d7","invite.js?v=a94f21d7","referral.js?v=a94f21d7","chat.js?v=a94f21d7","inbox.js?v=a94f21d7","screens.js?v=a94f21d7","showcase.js?v=a94f21d7","flame.js?v=a94f21d7","firstweek.js?v=a94f21d7","prices.js?v=a94f21d7","training.js?v=a94f21d7","sharecard.js?v=a94f21d7","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




