/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b2e8f471";
const SHELL=["./","index.html","styles.css?v=b2e8f471","design.css?v=b2e8f471","design.js?v=b2e8f471","core.js?v=b2e8f471","data.js?v=b2e8f471","data-systems2.js?v=b2e8f471","data-systems3.js?v=b2e8f471",
"data-rehab2.js?v=b2e8f471","media.js?v=b2e8f471","pro.js?v=b2e8f471","lab.js?v=b2e8f471","anatomy.js?v=b2e8f471","health.js?v=b2e8f471","posing.js?v=b2e8f471","minerals.js?v=b2e8f471","ghealth.js?v=b2e8f471","stepsboard.js?v=b2e8f471","push.js?v=b2e8f471","icons.js?v=b2e8f471","supps.js?v=b2e8f471","views.js?v=b2e8f471","coach.js?v=b2e8f471","signup.js?v=b2e8f471","qrcode.js?v=b2e8f471","invite.js?v=b2e8f471","referral.js?v=b2e8f471","transform.js?v=b2e8f471","chat.js?v=b2e8f471","aichat.js?v=b2e8f471","ai.js?v=b2e8f471","inbox.js?v=b2e8f471","screens.js?v=b2e8f471","showcase.js?v=b2e8f471","flame.js?v=b2e8f471","photos.js?v=b2e8f471","firstweek.js?v=b2e8f471","league.js?v=b2e8f471","prices.js?v=b2e8f471","training.js?v=b2e8f471","sharecard.js?v=b2e8f471","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

