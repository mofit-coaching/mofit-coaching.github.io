/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-7e2d9b4a";
const SHELL=["./","index.html","styles.css?v=7e2d9b4a","design.css?v=7e2d9b4a","coachshell.css?v=7e2d9b4a","coachshell.js?v=7e2d9b4a","design.js?v=7e2d9b4a","core.js?v=7e2d9b4a","data.js?v=7e2d9b4a","data-systems2.js?v=7e2d9b4a","data-systems3.js?v=7e2d9b4a","data-systems4.js?v=7e2d9b4a",
"data-rehab2.js?v=7e2d9b4a","media.js?v=7e2d9b4a","pro.js?v=7e2d9b4a","lab.js?v=7e2d9b4a","anatomy.js?v=7e2d9b4a","health.js?v=7e2d9b4a","posing.js?v=7e2d9b4a","minerals.js?v=7e2d9b4a","ghealth.js?v=7e2d9b4a","stepsboard.js?v=7e2d9b4a","push.js?v=7e2d9b4a","icons.js?v=7e2d9b4a","supps.js?v=7e2d9b4a","views.js?v=7e2d9b4a","coach.js?v=7e2d9b4a","signup.js?v=7e2d9b4a","qrcode.js?v=7e2d9b4a","invite.js?v=7e2d9b4a","referral.js?v=7e2d9b4a","transform.js?v=7e2d9b4a","chat.js?v=7e2d9b4a","aichat.js?v=7e2d9b4a","ai.js?v=7e2d9b4a","inbox.js?v=7e2d9b4a","screens.js?v=7e2d9b4a","showcase.js?v=7e2d9b4a","flame.js?v=7e2d9b4a","photos.js?v=7e2d9b4a","firstweek.js?v=7e2d9b4a","league.js?v=7e2d9b4a","prices.js?v=7e2d9b4a","training.js?v=7e2d9b4a","sharecard.js?v=7e2d9b4a","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
