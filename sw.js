/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-e5a1c7d2";
const SHELL=["./","index.html","styles.css?v=e5a1c7d2","design.css?v=e5a1c7d2","design.js?v=e5a1c7d2","core.js?v=e5a1c7d2","data.js?v=e5a1c7d2","data-systems2.js?v=e5a1c7d2","data-systems3.js?v=e5a1c7d2",
"data-rehab2.js?v=e5a1c7d2","media.js?v=e5a1c7d2","pro.js?v=e5a1c7d2","lab.js?v=e5a1c7d2","anatomy.js?v=e5a1c7d2","health.js?v=e5a1c7d2","posing.js?v=e5a1c7d2","minerals.js?v=e5a1c7d2","ghealth.js?v=e5a1c7d2","stepsboard.js?v=e5a1c7d2","push.js?v=e5a1c7d2","icons.js?v=e5a1c7d2","supps.js?v=e5a1c7d2","views.js?v=e5a1c7d2","coach.js?v=e5a1c7d2","signup.js?v=e5a1c7d2","qrcode.js?v=e5a1c7d2","invite.js?v=e5a1c7d2","referral.js?v=e5a1c7d2","transform.js?v=e5a1c7d2","chat.js?v=e5a1c7d2","aichat.js?v=e5a1c7d2","ai.js?v=e5a1c7d2","inbox.js?v=e5a1c7d2","screens.js?v=e5a1c7d2","showcase.js?v=e5a1c7d2","flame.js?v=e5a1c7d2","photos.js?v=e5a1c7d2","firstweek.js?v=e5a1c7d2","league.js?v=e5a1c7d2","prices.js?v=e5a1c7d2","training.js?v=e5a1c7d2","sharecard.js?v=e5a1c7d2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

