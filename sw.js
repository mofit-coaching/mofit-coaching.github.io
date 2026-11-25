/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b3c75a10";
const SHELL=["./","index.html","styles.css?v=b3c75a10","design.css?v=b3c75a10","coachshell.css?v=b3c75a10","coachshell.js?v=b3c75a10","design.js?v=b3c75a10","core.js?v=b3c75a10","data.js?v=b3c75a10","data-systems2.js?v=b3c75a10","data-systems3.js?v=b3c75a10",
"data-rehab2.js?v=b3c75a10","media.js?v=b3c75a10","pro.js?v=b3c75a10","lab.js?v=b3c75a10","anatomy.js?v=b3c75a10","health.js?v=b3c75a10","posing.js?v=b3c75a10","minerals.js?v=b3c75a10","ghealth.js?v=b3c75a10","stepsboard.js?v=b3c75a10","push.js?v=b3c75a10","icons.js?v=b3c75a10","supps.js?v=b3c75a10","views.js?v=b3c75a10","coach.js?v=b3c75a10","signup.js?v=b3c75a10","qrcode.js?v=b3c75a10","invite.js?v=b3c75a10","referral.js?v=b3c75a10","transform.js?v=b3c75a10","chat.js?v=b3c75a10","aichat.js?v=b3c75a10","ai.js?v=b3c75a10","inbox.js?v=b3c75a10","screens.js?v=b3c75a10","showcase.js?v=b3c75a10","flame.js?v=b3c75a10","photos.js?v=b3c75a10","firstweek.js?v=b3c75a10","league.js?v=b3c75a10","prices.js?v=b3c75a10","training.js?v=b3c75a10","sharecard.js?v=b3c75a10","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

