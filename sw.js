/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b965abf0";
const SHELL=["./","index.html","styles.css?v=b965abf0","design.css?v=b965abf0","design.js?v=b965abf0","core.js?v=b965abf0","data.js?v=b965abf0","data-systems2.js?v=b965abf0","data-systems3.js?v=b965abf0",
"data-rehab2.js?v=b965abf0","media.js?v=b965abf0","pro.js?v=b965abf0","lab.js?v=b965abf0","anatomy.js?v=b965abf0","health.js?v=b965abf0","posing.js?v=b965abf0","minerals.js?v=b965abf0","ghealth.js?v=b965abf0","stepsboard.js?v=b965abf0","push.js?v=b965abf0","icons.js?v=b965abf0","supps.js?v=b965abf0","views.js?v=b965abf0","coach.js?v=b965abf0","signup.js?v=b965abf0","qrcode.js?v=b965abf0","invite.js?v=b965abf0","referral.js?v=b965abf0","transform.js?v=b965abf0","chat.js?v=b965abf0","aichat.js?v=b965abf0","ai.js?v=b965abf0","inbox.js?v=b965abf0","screens.js?v=b965abf0","showcase.js?v=b965abf0","flame.js?v=b965abf0","photos.js?v=b965abf0","firstweek.js?v=b965abf0","league.js?v=b965abf0","prices.js?v=b965abf0","training.js?v=b965abf0","sharecard.js?v=b965abf0","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

