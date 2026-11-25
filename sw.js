/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c7e2f9a4";
const SHELL=["./","index.html","styles.css?v=c7e2f9a4","design.css?v=c7e2f9a4","design.js?v=c7e2f9a4","core.js?v=c7e2f9a4","data.js?v=c7e2f9a4","media.js?v=c7e2f9a4","pro.js?v=c7e2f9a4","lab.js?v=c7e2f9a4","anatomy.js?v=c7e2f9a4","health.js?v=c7e2f9a4","posing.js?v=c7e2f9a4","minerals.js?v=c7e2f9a4","ghealth.js?v=c7e2f9a4","push.js?v=c7e2f9a4","icons.js?v=c7e2f9a4","supps.js?v=c7e2f9a4","views.js?v=c7e2f9a4","coach.js?v=c7e2f9a4","signup.js?v=c7e2f9a4","qrcode.js?v=c7e2f9a4","invite.js?v=c7e2f9a4","referral.js?v=c7e2f9a4","transform.js?v=c7e2f9a4","chat.js?v=c7e2f9a4","aichat.js?v=c7e2f9a4","ai.js?v=c7e2f9a4","inbox.js?v=c7e2f9a4","screens.js?v=c7e2f9a4","showcase.js?v=c7e2f9a4","flame.js?v=c7e2f9a4","photos.js?v=c7e2f9a4","firstweek.js?v=c7e2f9a4","league.js?v=c7e2f9a4","prices.js?v=c7e2f9a4","training.js?v=c7e2f9a4","sharecard.js?v=c7e2f9a4","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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
