/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d5f1a9b3";
const SHELL=["./","index.html","styles.css?v=d5f1a9b3","design.css?v=d5f1a9b3","coachshell.css?v=d5f1a9b3","coachshell.js?v=d5f1a9b3","design.js?v=d5f1a9b3","core.js?v=d5f1a9b3","data.js?v=d5f1a9b3","data-systems2.js?v=d5f1a9b3","data-systems3.js?v=d5f1a9b3",
"data-rehab2.js?v=d5f1a9b3","media.js?v=d5f1a9b3","pro.js?v=d5f1a9b3","lab.js?v=d5f1a9b3","anatomy.js?v=d5f1a9b3","health.js?v=d5f1a9b3","posing.js?v=d5f1a9b3","minerals.js?v=d5f1a9b3","ghealth.js?v=d5f1a9b3","stepsboard.js?v=d5f1a9b3","push.js?v=d5f1a9b3","icons.js?v=d5f1a9b3","supps.js?v=d5f1a9b3","views.js?v=d5f1a9b3","coach.js?v=d5f1a9b3","signup.js?v=d5f1a9b3","qrcode.js?v=d5f1a9b3","invite.js?v=d5f1a9b3","referral.js?v=d5f1a9b3","transform.js?v=d5f1a9b3","chat.js?v=d5f1a9b3","aichat.js?v=d5f1a9b3","ai.js?v=d5f1a9b3","inbox.js?v=d5f1a9b3","screens.js?v=d5f1a9b3","showcase.js?v=d5f1a9b3","flame.js?v=d5f1a9b3","photos.js?v=d5f1a9b3","firstweek.js?v=d5f1a9b3","league.js?v=d5f1a9b3","prices.js?v=d5f1a9b3","training.js?v=d5f1a9b3","sharecard.js?v=d5f1a9b3","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

