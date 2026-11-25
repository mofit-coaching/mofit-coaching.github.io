/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-35756afa";
const SHELL=["./","index.html","styles.css?v=35756afa","design.css?v=35756afa","design.js?v=35756afa","core.js?v=35756afa","data.js?v=35756afa","data-systems2.js?v=35756afa","data-systems3.js?v=35756afa",
"data-rehab2.js?v=35756afa","media.js?v=35756afa","pro.js?v=35756afa","lab.js?v=35756afa","anatomy.js?v=35756afa","health.js?v=35756afa","posing.js?v=35756afa","minerals.js?v=35756afa","ghealth.js?v=35756afa","stepsboard.js?v=35756afa","push.js?v=35756afa","icons.js?v=35756afa","supps.js?v=35756afa","views.js?v=35756afa","coach.js?v=35756afa","signup.js?v=35756afa","qrcode.js?v=35756afa","invite.js?v=35756afa","referral.js?v=35756afa","transform.js?v=35756afa","chat.js?v=35756afa","aichat.js?v=35756afa","ai.js?v=35756afa","inbox.js?v=35756afa","screens.js?v=35756afa","showcase.js?v=35756afa","flame.js?v=35756afa","photos.js?v=35756afa","firstweek.js?v=35756afa","league.js?v=35756afa","prices.js?v=35756afa","training.js?v=35756afa","sharecard.js?v=35756afa","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

/* web push: show the notification, then focus/open the app on tap */
self.addEventListener("push",e=>{
  let d={}; try{ d=e.data?e.data.json():{}; }catch(_){ }
  e.waitUntil(self.registration.showNotification(d.title||"Mofit",{
    body:d.body||"", icon:"icon-192.png", badge:"icon-192.png",
    tag:d.tag||"mofit", dir:"rtl", lang:"ar",
    data:{url:(d.url||"./")}
  }));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const url=(e.notification.data&&e.notification.data.url)||"./";
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const c of list){ if("focus" in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});

