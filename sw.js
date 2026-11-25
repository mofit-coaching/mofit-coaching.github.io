/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c4e19b07";
const SHELL=["./","index.html","styles.css?v=c4e19b07","design.css?v=c4e19b07","design.js?v=c4e19b07","core.js?v=c4e19b07","data.js?v=c4e19b07","data-systems2.js?v=c4e19b07","data-systems3.js?v=c4e19b07",
"data-rehab2.js?v=c4e19b07","media.js?v=c4e19b07","pro.js?v=c4e19b07","lab.js?v=c4e19b07","anatomy.js?v=c4e19b07","health.js?v=c4e19b07","posing.js?v=c4e19b07","minerals.js?v=c4e19b07","ghealth.js?v=c4e19b07","stepsboard.js?v=c4e19b07","push.js?v=c4e19b07","icons.js?v=c4e19b07","supps.js?v=c4e19b07","views.js?v=c4e19b07","coach.js?v=c4e19b07","signup.js?v=c4e19b07","qrcode.js?v=c4e19b07","invite.js?v=c4e19b07","referral.js?v=c4e19b07","transform.js?v=c4e19b07","chat.js?v=c4e19b07","aichat.js?v=c4e19b07","ai.js?v=c4e19b07","inbox.js?v=c4e19b07","screens.js?v=c4e19b07","showcase.js?v=c4e19b07","flame.js?v=c4e19b07","photos.js?v=c4e19b07","firstweek.js?v=c4e19b07","league.js?v=c4e19b07","prices.js?v=c4e19b07","training.js?v=c4e19b07","sharecard.js?v=c4e19b07","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

