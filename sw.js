/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-26d25c8f";
const SHELL=["./","index.html","styles.css?v=26d25c8f","design.css?v=26d25c8f","coachshell.css?v=26d25c8f","coachshell.js?v=26d25c8f","design.js?v=26d25c8f","core.js?v=26d25c8f","data.js?v=26d25c8f","data-systems2.js?v=26d25c8f","data-systems3.js?v=26d25c8f",
"data-rehab2.js?v=26d25c8f","media.js?v=26d25c8f","pro.js?v=26d25c8f","lab.js?v=26d25c8f","anatomy.js?v=26d25c8f","health.js?v=26d25c8f","posing.js?v=26d25c8f","minerals.js?v=26d25c8f","ghealth.js?v=26d25c8f","stepsboard.js?v=26d25c8f","push.js?v=26d25c8f","icons.js?v=26d25c8f","supps.js?v=26d25c8f","views.js?v=26d25c8f","coach.js?v=26d25c8f","signup.js?v=26d25c8f","qrcode.js?v=26d25c8f","invite.js?v=26d25c8f","referral.js?v=26d25c8f","transform.js?v=26d25c8f","chat.js?v=26d25c8f","aichat.js?v=26d25c8f","ai.js?v=26d25c8f","inbox.js?v=26d25c8f","screens.js?v=26d25c8f","showcase.js?v=26d25c8f","flame.js?v=26d25c8f","photos.js?v=26d25c8f","firstweek.js?v=26d25c8f","league.js?v=26d25c8f","prices.js?v=26d25c8f","training.js?v=26d25c8f","sharecard.js?v=26d25c8f","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
