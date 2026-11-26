/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d4e8b2f1";
const SHELL=["./","index.html","styles.css?v=d4e8b2f1","design.css?v=d4e8b2f1","icons-anim.css?v=d4e8b2f1","coachshell.css?v=d4e8b2f1","dark.css?v=d4e8b2f1","coachshell.js?v=d4e8b2f1","design.js?v=d4e8b2f1","core.js?v=d4e8b2f1","data.js?v=d4e8b2f1","data-systems2.js?v=d4e8b2f1","data-systems3.js?v=d4e8b2f1","data-systems4.js?v=d4e8b2f1",
"data-rehab2.js?v=d4e8b2f1","media.js?v=d4e8b2f1","pro.js?v=d4e8b2f1","lab.js?v=d4e8b2f1","anatomy.js?v=d4e8b2f1","health.js?v=d4e8b2f1","posing.js?v=d4e8b2f1","minerals.js?v=d4e8b2f1","ghealth.js?v=d4e8b2f1","stepsboard.js?v=d4e8b2f1","push.js?v=d4e8b2f1","icons.js?v=d4e8b2f1","supps.js?v=d4e8b2f1","views.js?v=d4e8b2f1","coach.js?v=d4e8b2f1","signup.js?v=d4e8b2f1","qrcode.js?v=d4e8b2f1","invite.js?v=d4e8b2f1","referral.js?v=d4e8b2f1","transform.js?v=d4e8b2f1","chat.js?v=d4e8b2f1","aichat.js?v=d4e8b2f1","ai.js?v=d4e8b2f1","inbox.js?v=d4e8b2f1","screens.js?v=d4e8b2f1","showcase.js?v=d4e8b2f1","flame.js?v=d4e8b2f1","photos.js?v=d4e8b2f1","firstweek.js?v=d4e8b2f1","league.js?v=d4e8b2f1","prices.js?v=d4e8b2f1","training.js?v=d4e8b2f1","sharecard.js?v=d4e8b2f1","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
