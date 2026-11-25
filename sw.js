/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-d6f20a83";
const SHELL=["./","index.html","styles.css?v=d6f20a83","design.css?v=d6f20a83","design.js?v=d6f20a83","core.js?v=d6f20a83","data.js?v=d6f20a83","data-systems2.js?v=d6f20a83","data-systems3.js?v=d6f20a83",
"data-rehab2.js?v=d6f20a83","media.js?v=d6f20a83","pro.js?v=d6f20a83","lab.js?v=d6f20a83","anatomy.js?v=d6f20a83","health.js?v=d6f20a83","posing.js?v=d6f20a83","minerals.js?v=d6f20a83","ghealth.js?v=d6f20a83","stepsboard.js?v=d6f20a83","push.js?v=d6f20a83","icons.js?v=d6f20a83","supps.js?v=d6f20a83","views.js?v=d6f20a83","coach.js?v=d6f20a83","signup.js?v=d6f20a83","qrcode.js?v=d6f20a83","invite.js?v=d6f20a83","referral.js?v=d6f20a83","transform.js?v=d6f20a83","chat.js?v=d6f20a83","aichat.js?v=d6f20a83","ai.js?v=d6f20a83","inbox.js?v=d6f20a83","screens.js?v=d6f20a83","showcase.js?v=d6f20a83","flame.js?v=d6f20a83","photos.js?v=d6f20a83","firstweek.js?v=d6f20a83","league.js?v=d6f20a83","prices.js?v=d6f20a83","training.js?v=d6f20a83","sharecard.js?v=d6f20a83","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

