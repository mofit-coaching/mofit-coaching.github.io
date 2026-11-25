/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-5d0e8b36";
const SHELL=["./","index.html","styles.css?v=5d0e8b36","design.css?v=5d0e8b36","coachshell.css?v=5d0e8b36","coachshell.js?v=5d0e8b36","design.js?v=5d0e8b36","core.js?v=5d0e8b36","data.js?v=5d0e8b36","data-systems2.js?v=5d0e8b36","data-systems3.js?v=5d0e8b36",
"data-rehab2.js?v=5d0e8b36","media.js?v=5d0e8b36","pro.js?v=5d0e8b36","lab.js?v=5d0e8b36","anatomy.js?v=5d0e8b36","health.js?v=5d0e8b36","posing.js?v=5d0e8b36","minerals.js?v=5d0e8b36","ghealth.js?v=5d0e8b36","stepsboard.js?v=5d0e8b36","push.js?v=5d0e8b36","icons.js?v=5d0e8b36","supps.js?v=5d0e8b36","views.js?v=5d0e8b36","coach.js?v=5d0e8b36","signup.js?v=5d0e8b36","qrcode.js?v=5d0e8b36","invite.js?v=5d0e8b36","referral.js?v=5d0e8b36","transform.js?v=5d0e8b36","chat.js?v=5d0e8b36","aichat.js?v=5d0e8b36","ai.js?v=5d0e8b36","inbox.js?v=5d0e8b36","screens.js?v=5d0e8b36","showcase.js?v=5d0e8b36","flame.js?v=5d0e8b36","photos.js?v=5d0e8b36","firstweek.js?v=5d0e8b36","league.js?v=5d0e8b36","prices.js?v=5d0e8b36","training.js?v=5d0e8b36","sharecard.js?v=5d0e8b36","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

