/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f2b8d4a1";
const SHELL=["./","index.html","styles.css?v=f2b8d4a1","design.css?v=f2b8d4a1","design.js?v=f2b8d4a1","core.js?v=f2b8d4a1","data.js?v=f2b8d4a1","data-systems2.js?v=f2b8d4a1","data-systems3.js?v=f2b8d4a1","media.js?v=f2b8d4a1","pro.js?v=f2b8d4a1","lab.js?v=f2b8d4a1","anatomy.js?v=f2b8d4a1","health.js?v=f2b8d4a1","posing.js?v=f2b8d4a1","minerals.js?v=f2b8d4a1","ghealth.js?v=f2b8d4a1","push.js?v=f2b8d4a1","icons.js?v=f2b8d4a1","supps.js?v=f2b8d4a1","views.js?v=f2b8d4a1","coach.js?v=f2b8d4a1","signup.js?v=f2b8d4a1","qrcode.js?v=f2b8d4a1","invite.js?v=f2b8d4a1","referral.js?v=f2b8d4a1","transform.js?v=f2b8d4a1","chat.js?v=f2b8d4a1","aichat.js?v=f2b8d4a1","ai.js?v=f2b8d4a1","inbox.js?v=f2b8d4a1","screens.js?v=f2b8d4a1","showcase.js?v=f2b8d4a1","flame.js?v=f2b8d4a1","photos.js?v=f2b8d4a1","firstweek.js?v=f2b8d4a1","league.js?v=f2b8d4a1","prices.js?v=f2b8d4a1","training.js?v=f2b8d4a1","sharecard.js?v=f2b8d4a1","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","404.html"];
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
