/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-e5b1c8d3";
const SHELL=["./","index.html","styles.css?v=e5b1c8d3","design.css?v=e5b1c8d3","design.js?v=e5b1c8d3","core.js?v=e5b1c8d3","data.js?v=e5b1c8d3","data-systems2.js?v=e5b1c8d3","media.js?v=e5b1c8d3","pro.js?v=e5b1c8d3","lab.js?v=e5b1c8d3","anatomy.js?v=e5b1c8d3","health.js?v=e5b1c8d3","posing.js?v=e5b1c8d3","minerals.js?v=e5b1c8d3","ghealth.js?v=e5b1c8d3","push.js?v=e5b1c8d3","icons.js?v=e5b1c8d3","supps.js?v=e5b1c8d3","views.js?v=e5b1c8d3","coach.js?v=e5b1c8d3","signup.js?v=e5b1c8d3","qrcode.js?v=e5b1c8d3","invite.js?v=e5b1c8d3","referral.js?v=e5b1c8d3","transform.js?v=e5b1c8d3","chat.js?v=e5b1c8d3","aichat.js?v=e5b1c8d3","ai.js?v=e5b1c8d3","inbox.js?v=e5b1c8d3","screens.js?v=e5b1c8d3","showcase.js?v=e5b1c8d3","flame.js?v=e5b1c8d3","photos.js?v=e5b1c8d3","firstweek.js?v=e5b1c8d3","league.js?v=e5b1c8d3","prices.js?v=e5b1c8d3","training.js?v=e5b1c8d3","sharecard.js?v=e5b1c8d3","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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
