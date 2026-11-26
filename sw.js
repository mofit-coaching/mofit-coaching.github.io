/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-1126a3";
const SHELL=["./","index.html","styles.css?v=1126a3","design.css?v=1126a3","coachshell.css?v=1126a3","dark.css?v=1126a3","coachshell.js?v=1126a3","design.js?v=1126a3","core.js?v=1126a3","data.js?v=1126a3","data-systems2.js?v=1126a3","data-systems3.js?v=1126a3","data-systems4.js?v=1126a3",
"data-rehab2.js?v=1126a3","media.js?v=1126a3","pro.js?v=1126a3","lab.js?v=1126a3","anatomy.js?v=1126a3","health.js?v=1126a3","posing.js?v=1126a3","minerals.js?v=1126a3","ghealth.js?v=1126a3","stepsboard.js?v=1126a3","push.js?v=1126a3","confetti.js?v=1126a3","celebrate.js?v=1126a3","lottie.min.js?v=1126a3","anims.js?v=1126a3","chart.min.js?v=1126a3","charts.js?v=1126a3","lottie-star.json","lottie-dumbbell.json","icons.js?v=1126a3","supps.js?v=1126a3","views.js?v=1126a3","coach.js?v=1126a3","signup.js?v=1126a3","qrcode.js?v=1126a3","invite.js?v=1126a3","referral.js?v=1126a3","transform.js?v=1126a3","chat.js?v=1126a3","aichat.js?v=1126a3","ai.js?v=1126a3","inbox.js?v=1126a3","screens.js?v=1126a3","showcase.js?v=1126a3","flame.js?v=1126a3","photos.js?v=1126a3","firstweek.js?v=1126a3","league.js?v=1126a3","prices.js?v=1126a3","training.js?v=1126a3","sharecard.js?v=1126a3","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
