/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-101c21f2";
const SHELL=["./","index.html","styles.css?v=101c21f2","design.css?v=101c21f2","coachshell.css?v=101c21f2","coachshell.js?v=101c21f2","design.js?v=101c21f2","core.js?v=101c21f2","data.js?v=101c21f2","data-systems2.js?v=101c21f2","data-systems3.js?v=101c21f2",
"data-rehab2.js?v=101c21f2","media.js?v=101c21f2","pro.js?v=101c21f2","lab.js?v=101c21f2","anatomy.js?v=101c21f2","health.js?v=101c21f2","posing.js?v=101c21f2","minerals.js?v=101c21f2","ghealth.js?v=101c21f2","stepsboard.js?v=101c21f2","push.js?v=101c21f2","icons.js?v=101c21f2","supps.js?v=101c21f2","views.js?v=101c21f2","coach.js?v=101c21f2","signup.js?v=101c21f2","qrcode.js?v=101c21f2","invite.js?v=101c21f2","referral.js?v=101c21f2","transform.js?v=101c21f2","chat.js?v=101c21f2","aichat.js?v=101c21f2","ai.js?v=101c21f2","inbox.js?v=101c21f2","screens.js?v=101c21f2","showcase.js?v=101c21f2","flame.js?v=101c21f2","photos.js?v=101c21f2","firstweek.js?v=101c21f2","league.js?v=101c21f2","prices.js?v=101c21f2","training.js?v=101c21f2","sharecard.js?v=101c21f2","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
