/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b9c4e6a1";
const SHELL=["./","index.html","styles.css?v=b9c4e6a1","design.css?v=b9c4e6a1","coachshell.css?v=b9c4e6a1","coachshell.js?v=b9c4e6a1","design.js?v=b9c4e6a1","core.js?v=b9c4e6a1","data.js?v=b9c4e6a1","data-systems2.js?v=b9c4e6a1","data-systems3.js?v=b9c4e6a1",
"data-rehab2.js?v=b9c4e6a1","media.js?v=b9c4e6a1","pro.js?v=b9c4e6a1","lab.js?v=b9c4e6a1","anatomy.js?v=b9c4e6a1","health.js?v=b9c4e6a1","posing.js?v=b9c4e6a1","minerals.js?v=b9c4e6a1","ghealth.js?v=b9c4e6a1","stepsboard.js?v=b9c4e6a1","push.js?v=b9c4e6a1","icons.js?v=b9c4e6a1","supps.js?v=b9c4e6a1","views.js?v=b9c4e6a1","coach.js?v=b9c4e6a1","signup.js?v=b9c4e6a1","qrcode.js?v=b9c4e6a1","invite.js?v=b9c4e6a1","referral.js?v=b9c4e6a1","transform.js?v=b9c4e6a1","chat.js?v=b9c4e6a1","aichat.js?v=b9c4e6a1","ai.js?v=b9c4e6a1","inbox.js?v=b9c4e6a1","screens.js?v=b9c4e6a1","showcase.js?v=b9c4e6a1","flame.js?v=b9c4e6a1","photos.js?v=b9c4e6a1","firstweek.js?v=b9c4e6a1","league.js?v=b9c4e6a1","prices.js?v=b9c4e6a1","training.js?v=b9c4e6a1","sharecard.js?v=b9c4e6a1","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

