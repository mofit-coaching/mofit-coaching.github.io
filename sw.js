/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-89ab859a";
const SHELL=["./","index.html","styles.css?v=89ab859a","design.css?v=89ab859a","design.js?v=89ab859a","core.js?v=89ab859a","data.js?v=89ab859a","pro.js?v=89ab859a","lab.js?v=89ab859a","anatomy.js?v=89ab859a","health.js?v=89ab859a","posing.js?v=89ab859a","minerals.js?v=89ab859a","icons.js?v=89ab859a","supps.js?v=89ab859a","views.js?v=89ab859a","coach.js?v=89ab859a","signup.js?v=89ab859a","qrcode.js?v=89ab859a","invite.js?v=89ab859a","referral.js?v=89ab859a","chat.js?v=89ab859a","inbox.js?v=89ab859a","screens.js?v=89ab859a","showcase.js?v=89ab859a","flame.js?v=89ab859a","firstweek.js?v=89ab859a","prices.js?v=89ab859a","training.js?v=89ab859a","sharecard.js?v=89ab859a","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




