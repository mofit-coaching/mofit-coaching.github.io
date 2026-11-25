/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-3f1c7a52";
const SHELL=["./","index.html","styles.css?v=3f1c7a52","design.css?v=3f1c7a52","coachshell.css?v=3f1c7a52","coachshell.js?v=3f1c7a52","design.js?v=3f1c7a52","core.js?v=3f1c7a52","data.js?v=3f1c7a52","data-systems2.js?v=3f1c7a52","data-systems3.js?v=3f1c7a52",
"data-rehab2.js?v=3f1c7a52","media.js?v=3f1c7a52","pro.js?v=3f1c7a52","lab.js?v=3f1c7a52","anatomy.js?v=3f1c7a52","health.js?v=3f1c7a52","posing.js?v=3f1c7a52","minerals.js?v=3f1c7a52","ghealth.js?v=3f1c7a52","stepsboard.js?v=3f1c7a52","push.js?v=3f1c7a52","icons.js?v=3f1c7a52","supps.js?v=3f1c7a52","views.js?v=3f1c7a52","coach.js?v=3f1c7a52","signup.js?v=3f1c7a52","qrcode.js?v=3f1c7a52","invite.js?v=3f1c7a52","referral.js?v=3f1c7a52","transform.js?v=3f1c7a52","chat.js?v=3f1c7a52","aichat.js?v=3f1c7a52","ai.js?v=3f1c7a52","inbox.js?v=3f1c7a52","screens.js?v=3f1c7a52","showcase.js?v=3f1c7a52","flame.js?v=3f1c7a52","photos.js?v=3f1c7a52","firstweek.js?v=3f1c7a52","league.js?v=3f1c7a52","prices.js?v=3f1c7a52","training.js?v=3f1c7a52","sharecard.js?v=3f1c7a52","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
