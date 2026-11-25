/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c41e9b27";
const SHELL=["./","index.html","styles.css?v=c41e9b27","design.css?v=c41e9b27","design.js?v=c41e9b27","core.js?v=c41e9b27","data.js?v=c41e9b27","data-systems2.js?v=c41e9b27","data-systems3.js?v=c41e9b27",
"data-rehab2.js?v=c41e9b27","media.js?v=c41e9b27","pro.js?v=c41e9b27","lab.js?v=c41e9b27","anatomy.js?v=c41e9b27","health.js?v=c41e9b27","posing.js?v=c41e9b27","minerals.js?v=c41e9b27","ghealth.js?v=c41e9b27","stepsboard.js?v=c41e9b27","push.js?v=c41e9b27","icons.js?v=c41e9b27","supps.js?v=c41e9b27","views.js?v=c41e9b27","coach.js?v=c41e9b27","signup.js?v=c41e9b27","qrcode.js?v=c41e9b27","invite.js?v=c41e9b27","referral.js?v=c41e9b27","transform.js?v=c41e9b27","chat.js?v=c41e9b27","aichat.js?v=c41e9b27","ai.js?v=c41e9b27","inbox.js?v=c41e9b27","screens.js?v=c41e9b27","showcase.js?v=c41e9b27","flame.js?v=c41e9b27","photos.js?v=c41e9b27","firstweek.js?v=c41e9b27","league.js?v=c41e9b27","prices.js?v=c41e9b27","training.js?v=c41e9b27","sharecard.js?v=c41e9b27","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

