/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a7d3c916";
const SHELL=["./","index.html","styles.css?v=a7d3c916","design.css?v=a7d3c916","design.js?v=a7d3c916","core.js?v=a7d3c916","data.js?v=a7d3c916","data-systems2.js?v=a7d3c916","data-systems3.js?v=a7d3c916",
"data-rehab2.js?v=a7d3c916","media.js?v=a7d3c916","pro.js?v=a7d3c916","lab.js?v=a7d3c916","anatomy.js?v=a7d3c916","health.js?v=a7d3c916","posing.js?v=a7d3c916","minerals.js?v=a7d3c916","ghealth.js?v=a7d3c916","stepsboard.js?v=a7d3c916","push.js?v=a7d3c916","icons.js?v=a7d3c916","supps.js?v=a7d3c916","views.js?v=a7d3c916","coach.js?v=a7d3c916","signup.js?v=a7d3c916","qrcode.js?v=a7d3c916","invite.js?v=a7d3c916","referral.js?v=a7d3c916","transform.js?v=a7d3c916","chat.js?v=a7d3c916","aichat.js?v=a7d3c916","ai.js?v=a7d3c916","inbox.js?v=a7d3c916","screens.js?v=a7d3c916","showcase.js?v=a7d3c916","flame.js?v=a7d3c916","photos.js?v=a7d3c916","firstweek.js?v=a7d3c916","league.js?v=a7d3c916","prices.js?v=a7d3c916","training.js?v=a7d3c916","sharecard.js?v=a7d3c916","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

