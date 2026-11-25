/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b6e1c4d8";
const SHELL=["./","index.html","styles.css?v=b6e1c4d8","design.css?v=b6e1c4d8","design.js?v=b6e1c4d8","core.js?v=b6e1c4d8","data.js?v=b6e1c4d8","data-systems2.js?v=b6e1c4d8","data-systems3.js?v=b6e1c4d8",
"data-rehab2.js?v=b6e1c4d8","media.js?v=b6e1c4d8","pro.js?v=b6e1c4d8","lab.js?v=b6e1c4d8","anatomy.js?v=b6e1c4d8","health.js?v=b6e1c4d8","posing.js?v=b6e1c4d8","minerals.js?v=b6e1c4d8","ghealth.js?v=b6e1c4d8","push.js?v=b6e1c4d8","icons.js?v=b6e1c4d8","supps.js?v=b6e1c4d8","views.js?v=b6e1c4d8","coach.js?v=b6e1c4d8","signup.js?v=b6e1c4d8","qrcode.js?v=b6e1c4d8","invite.js?v=b6e1c4d8","referral.js?v=b6e1c4d8","transform.js?v=b6e1c4d8","chat.js?v=b6e1c4d8","aichat.js?v=b6e1c4d8","ai.js?v=b6e1c4d8","inbox.js?v=b6e1c4d8","screens.js?v=b6e1c4d8","showcase.js?v=b6e1c4d8","flame.js?v=b6e1c4d8","photos.js?v=b6e1c4d8","firstweek.js?v=b6e1c4d8","league.js?v=b6e1c4d8","prices.js?v=b6e1c4d8","training.js?v=b6e1c4d8","sharecard.js?v=b6e1c4d8","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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
