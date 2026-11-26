/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-8db01ab6";
const SHELL=["./","index.html","styles.css?v=8db01ab6","design.css?v=8db01ab6","coachshell.css?v=8db01ab6","coachshell.js?v=8db01ab6","design.js?v=8db01ab6","core.js?v=8db01ab6","data.js?v=8db01ab6","data-systems2.js?v=8db01ab6","data-systems3.js?v=8db01ab6",
"data-rehab2.js?v=8db01ab6","media.js?v=8db01ab6","pro.js?v=8db01ab6","lab.js?v=8db01ab6","anatomy.js?v=8db01ab6","health.js?v=8db01ab6","posing.js?v=8db01ab6","minerals.js?v=8db01ab6","ghealth.js?v=8db01ab6","stepsboard.js?v=8db01ab6","push.js?v=8db01ab6","icons.js?v=8db01ab6","supps.js?v=8db01ab6","views.js?v=8db01ab6","coach.js?v=8db01ab6","signup.js?v=8db01ab6","qrcode.js?v=8db01ab6","invite.js?v=8db01ab6","referral.js?v=8db01ab6","transform.js?v=8db01ab6","chat.js?v=8db01ab6","aichat.js?v=8db01ab6","ai.js?v=8db01ab6","inbox.js?v=8db01ab6","screens.js?v=8db01ab6","showcase.js?v=8db01ab6","flame.js?v=8db01ab6","photos.js?v=8db01ab6","firstweek.js?v=8db01ab6","league.js?v=8db01ab6","prices.js?v=8db01ab6","training.js?v=8db01ab6","sharecard.js?v=8db01ab6","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
