/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c3a9e742";
const SHELL=["./","index.html","styles.css?v=c3a9e742","design.css?v=c3a9e742","design.js?v=c3a9e742","core.js?v=c3a9e742","data.js?v=c3a9e742","data-systems2.js?v=c3a9e742","data-systems3.js?v=c3a9e742",
"data-rehab2.js?v=c3a9e742","media.js?v=c3a9e742","pro.js?v=c3a9e742","lab.js?v=c3a9e742","anatomy.js?v=c3a9e742","health.js?v=c3a9e742","posing.js?v=c3a9e742","minerals.js?v=c3a9e742","ghealth.js?v=c3a9e742","stepsboard.js?v=c3a9e742","push.js?v=c3a9e742","icons.js?v=c3a9e742","supps.js?v=c3a9e742","views.js?v=c3a9e742","coach.js?v=c3a9e742","signup.js?v=c3a9e742","qrcode.js?v=c3a9e742","invite.js?v=c3a9e742","referral.js?v=c3a9e742","transform.js?v=c3a9e742","chat.js?v=c3a9e742","aichat.js?v=c3a9e742","ai.js?v=c3a9e742","inbox.js?v=c3a9e742","screens.js?v=c3a9e742","showcase.js?v=c3a9e742","flame.js?v=c3a9e742","photos.js?v=c3a9e742","firstweek.js?v=c3a9e742","league.js?v=c3a9e742","prices.js?v=c3a9e742","training.js?v=c3a9e742","sharecard.js?v=c3a9e742","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

