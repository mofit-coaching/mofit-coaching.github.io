/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b7e3d190";
const SHELL=["./","index.html","styles.css?v=b7e3d190","design.css?v=b7e3d190","design.js?v=b7e3d190","core.js?v=b7e3d190","data.js?v=b7e3d190","media.js?v=b7e3d190","pro.js?v=b7e3d190","lab.js?v=b7e3d190","anatomy.js?v=b7e3d190","health.js?v=b7e3d190","posing.js?v=b7e3d190","minerals.js?v=b7e3d190","icons.js?v=b7e3d190","supps.js?v=b7e3d190","views.js?v=b7e3d190","coach.js?v=b7e3d190","signup.js?v=b7e3d190","qrcode.js?v=b7e3d190","invite.js?v=b7e3d190","referral.js?v=b7e3d190","chat.js?v=b7e3d190","inbox.js?v=b7e3d190","screens.js?v=b7e3d190","showcase.js?v=b7e3d190","flame.js?v=b7e3d190","photos.js?v=b7e3d190","firstweek.js?v=b7e3d190","league.js?v=b7e3d190","prices.js?v=b7e3d190","training.js?v=b7e3d190","sharecard.js?v=b7e3d190","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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


