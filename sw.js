/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d7a41e03";
const SHELL=["./","index.html","styles.css?v=d7a41e03","design.css?v=d7a41e03","coachshell.css?v=d7a41e03","coachshell.js?v=d7a41e03","design.js?v=d7a41e03","core.js?v=d7a41e03","data.js?v=d7a41e03","data-systems2.js?v=d7a41e03","data-systems3.js?v=d7a41e03",
"data-rehab2.js?v=d7a41e03","media.js?v=d7a41e03","pro.js?v=d7a41e03","lab.js?v=d7a41e03","anatomy.js?v=d7a41e03","health.js?v=d7a41e03","posing.js?v=d7a41e03","minerals.js?v=d7a41e03","ghealth.js?v=d7a41e03","stepsboard.js?v=d7a41e03","push.js?v=d7a41e03","icons.js?v=d7a41e03","supps.js?v=d7a41e03","views.js?v=d7a41e03","coach.js?v=d7a41e03","signup.js?v=d7a41e03","qrcode.js?v=d7a41e03","invite.js?v=d7a41e03","referral.js?v=d7a41e03","transform.js?v=d7a41e03","chat.js?v=d7a41e03","aichat.js?v=d7a41e03","ai.js?v=d7a41e03","inbox.js?v=d7a41e03","screens.js?v=d7a41e03","showcase.js?v=d7a41e03","flame.js?v=d7a41e03","photos.js?v=d7a41e03","firstweek.js?v=d7a41e03","league.js?v=d7a41e03","prices.js?v=d7a41e03","training.js?v=d7a41e03","sharecard.js?v=d7a41e03","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

