/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-2fdd6cf2";
const SHELL=["./","index.html","styles.css?v=2fdd6cf2","design.css?v=2fdd6cf2","design.js?v=2fdd6cf2","core.js?v=2fdd6cf2","data.js?v=2fdd6cf2","data-systems2.js?v=2fdd6cf2","data-systems3.js?v=2fdd6cf2",
"data-rehab2.js?v=2fdd6cf2","media.js?v=2fdd6cf2","pro.js?v=2fdd6cf2","lab.js?v=2fdd6cf2","anatomy.js?v=2fdd6cf2","health.js?v=2fdd6cf2","posing.js?v=2fdd6cf2","minerals.js?v=2fdd6cf2","ghealth.js?v=2fdd6cf2","stepsboard.js?v=2fdd6cf2","push.js?v=2fdd6cf2","icons.js?v=2fdd6cf2","supps.js?v=2fdd6cf2","views.js?v=2fdd6cf2","coach.js?v=2fdd6cf2","signup.js?v=2fdd6cf2","qrcode.js?v=2fdd6cf2","invite.js?v=2fdd6cf2","referral.js?v=2fdd6cf2","transform.js?v=2fdd6cf2","chat.js?v=2fdd6cf2","aichat.js?v=2fdd6cf2","ai.js?v=2fdd6cf2","inbox.js?v=2fdd6cf2","screens.js?v=2fdd6cf2","showcase.js?v=2fdd6cf2","flame.js?v=2fdd6cf2","photos.js?v=2fdd6cf2","firstweek.js?v=2fdd6cf2","league.js?v=2fdd6cf2","prices.js?v=2fdd6cf2","training.js?v=2fdd6cf2","sharecard.js?v=2fdd6cf2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

