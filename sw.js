/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-00b606ae";
const SHELL=["./","index.html","styles.css?v=00b606ae","design.css?v=00b606ae","design.js?v=00b606ae","core.js?v=00b606ae","data.js?v=00b606ae","pro.js?v=00b606ae","lab.js?v=00b606ae","anatomy.js?v=00b606ae","health.js?v=00b606ae","posing.js?v=00b606ae","minerals.js?v=00b606ae","icons.js?v=00b606ae","supps.js?v=00b606ae","views.js?v=00b606ae","coach.js?v=00b606ae","signup.js?v=00b606ae","qrcode.js?v=00b606ae","invite.js?v=00b606ae","referral.js?v=00b606ae","transform.js?v=00b606ae","chat.js?v=00b606ae","inbox.js?v=00b606ae","screens.js?v=00b606ae","showcase.js?v=00b606ae","flame.js?v=00b606ae","firstweek.js?v=00b606ae","prices.js?v=00b606ae","training.js?v=00b606ae","sharecard.js?v=00b606ae","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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




