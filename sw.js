/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-5e8d2a41";
const SHELL=["./","index.html","styles.css?v=5e8d2a41","design.css?v=5e8d2a41","coachshell.css?v=5e8d2a41","coachshell.js?v=5e8d2a41","design.js?v=5e8d2a41","core.js?v=5e8d2a41","data.js?v=5e8d2a41","data-systems2.js?v=5e8d2a41","data-systems3.js?v=5e8d2a41",
"data-rehab2.js?v=5e8d2a41","media.js?v=5e8d2a41","pro.js?v=5e8d2a41","lab.js?v=5e8d2a41","anatomy.js?v=5e8d2a41","health.js?v=5e8d2a41","posing.js?v=5e8d2a41","minerals.js?v=5e8d2a41","ghealth.js?v=5e8d2a41","stepsboard.js?v=5e8d2a41","push.js?v=5e8d2a41","icons.js?v=5e8d2a41","supps.js?v=5e8d2a41","views.js?v=5e8d2a41","coach.js?v=5e8d2a41","signup.js?v=5e8d2a41","qrcode.js?v=5e8d2a41","invite.js?v=5e8d2a41","referral.js?v=5e8d2a41","transform.js?v=5e8d2a41","chat.js?v=5e8d2a41","aichat.js?v=5e8d2a41","ai.js?v=5e8d2a41","inbox.js?v=5e8d2a41","screens.js?v=5e8d2a41","showcase.js?v=5e8d2a41","flame.js?v=5e8d2a41","photos.js?v=5e8d2a41","firstweek.js?v=5e8d2a41","league.js?v=5e8d2a41","prices.js?v=5e8d2a41","training.js?v=5e8d2a41","sharecard.js?v=5e8d2a41","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
