/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-cdb69710";
const SHELL=["./","index.html","styles.css?v=cdb69710","design.css?v=cdb69710","coachshell.css?v=cdb69710","coachshell.js?v=cdb69710","design.js?v=cdb69710","core.js?v=cdb69710","data.js?v=cdb69710","data-systems2.js?v=cdb69710","data-systems3.js?v=cdb69710",
"data-rehab2.js?v=cdb69710","media.js?v=cdb69710","pro.js?v=cdb69710","lab.js?v=cdb69710","anatomy.js?v=cdb69710","health.js?v=cdb69710","posing.js?v=cdb69710","minerals.js?v=cdb69710","ghealth.js?v=cdb69710","stepsboard.js?v=cdb69710","push.js?v=cdb69710","icons.js?v=cdb69710","supps.js?v=cdb69710","views.js?v=cdb69710","coach.js?v=cdb69710","signup.js?v=cdb69710","qrcode.js?v=cdb69710","invite.js?v=cdb69710","referral.js?v=cdb69710","transform.js?v=cdb69710","chat.js?v=cdb69710","aichat.js?v=cdb69710","ai.js?v=cdb69710","inbox.js?v=cdb69710","screens.js?v=cdb69710","showcase.js?v=cdb69710","flame.js?v=cdb69710","photos.js?v=cdb69710","firstweek.js?v=cdb69710","league.js?v=cdb69710","prices.js?v=cdb69710","training.js?v=cdb69710","sharecard.js?v=cdb69710","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
