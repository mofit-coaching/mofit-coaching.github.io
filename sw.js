/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d4a7b3c9";
const SHELL=["./","index.html","styles.css?v=d4a7b3c9","design.css?v=d4a7b3c9","design.js?v=d4a7b3c9","core.js?v=d4a7b3c9","data.js?v=d4a7b3c9","data-systems2.js?v=d4a7b3c9","media.js?v=d4a7b3c9","pro.js?v=d4a7b3c9","lab.js?v=d4a7b3c9","anatomy.js?v=d4a7b3c9","health.js?v=d4a7b3c9","posing.js?v=d4a7b3c9","minerals.js?v=d4a7b3c9","ghealth.js?v=d4a7b3c9","push.js?v=d4a7b3c9","icons.js?v=d4a7b3c9","supps.js?v=d4a7b3c9","views.js?v=d4a7b3c9","coach.js?v=d4a7b3c9","signup.js?v=d4a7b3c9","qrcode.js?v=d4a7b3c9","invite.js?v=d4a7b3c9","referral.js?v=d4a7b3c9","transform.js?v=d4a7b3c9","chat.js?v=d4a7b3c9","aichat.js?v=d4a7b3c9","ai.js?v=d4a7b3c9","inbox.js?v=d4a7b3c9","screens.js?v=d4a7b3c9","showcase.js?v=d4a7b3c9","flame.js?v=d4a7b3c9","photos.js?v=d4a7b3c9","firstweek.js?v=d4a7b3c9","league.js?v=d4a7b3c9","prices.js?v=d4a7b3c9","training.js?v=d4a7b3c9","sharecard.js?v=d4a7b3c9","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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
