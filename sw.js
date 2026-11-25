/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c8e24f61";
const SHELL=["./","index.html","styles.css?v=c8e24f61","design.css?v=c8e24f61","coachshell.css?v=c8e24f61","coachshell.js?v=c8e24f61","design.js?v=c8e24f61","core.js?v=c8e24f61","data.js?v=c8e24f61","data-systems2.js?v=c8e24f61","data-systems3.js?v=c8e24f61",
"data-rehab2.js?v=c8e24f61","media.js?v=c8e24f61","pro.js?v=c8e24f61","lab.js?v=c8e24f61","anatomy.js?v=c8e24f61","health.js?v=c8e24f61","posing.js?v=c8e24f61","minerals.js?v=c8e24f61","ghealth.js?v=c8e24f61","stepsboard.js?v=c8e24f61","push.js?v=c8e24f61","icons.js?v=c8e24f61","supps.js?v=c8e24f61","views.js?v=c8e24f61","coach.js?v=c8e24f61","signup.js?v=c8e24f61","qrcode.js?v=c8e24f61","invite.js?v=c8e24f61","referral.js?v=c8e24f61","transform.js?v=c8e24f61","chat.js?v=c8e24f61","aichat.js?v=c8e24f61","ai.js?v=c8e24f61","inbox.js?v=c8e24f61","screens.js?v=c8e24f61","showcase.js?v=c8e24f61","flame.js?v=c8e24f61","photos.js?v=c8e24f61","firstweek.js?v=c8e24f61","league.js?v=c8e24f61","prices.js?v=c8e24f61","training.js?v=c8e24f61","sharecard.js?v=c8e24f61","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

