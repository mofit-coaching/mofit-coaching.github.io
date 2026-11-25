/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-9a41c7e2";
const SHELL=["./","index.html","styles.css?v=9a41c7e2","design.css?v=9a41c7e2","coachshell.css?v=9a41c7e2","coachshell.js?v=9a41c7e2","design.js?v=9a41c7e2","core.js?v=9a41c7e2","data.js?v=9a41c7e2","data-systems2.js?v=9a41c7e2","data-systems3.js?v=9a41c7e2",
"data-rehab2.js?v=9a41c7e2","media.js?v=9a41c7e2","pro.js?v=9a41c7e2","lab.js?v=9a41c7e2","anatomy.js?v=9a41c7e2","health.js?v=9a41c7e2","posing.js?v=9a41c7e2","minerals.js?v=9a41c7e2","ghealth.js?v=9a41c7e2","stepsboard.js?v=9a41c7e2","push.js?v=9a41c7e2","icons.js?v=9a41c7e2","supps.js?v=9a41c7e2","views.js?v=9a41c7e2","coach.js?v=9a41c7e2","signup.js?v=9a41c7e2","qrcode.js?v=9a41c7e2","invite.js?v=9a41c7e2","referral.js?v=9a41c7e2","transform.js?v=9a41c7e2","chat.js?v=9a41c7e2","aichat.js?v=9a41c7e2","ai.js?v=9a41c7e2","inbox.js?v=9a41c7e2","screens.js?v=9a41c7e2","showcase.js?v=9a41c7e2","flame.js?v=9a41c7e2","photos.js?v=9a41c7e2","firstweek.js?v=9a41c7e2","league.js?v=9a41c7e2","prices.js?v=9a41c7e2","training.js?v=9a41c7e2","sharecard.js?v=9a41c7e2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

