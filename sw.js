/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c84d2e1f";
const SHELL=["./","index.html","styles.css?v=c84d2e1f","design.css?v=c84d2e1f","icons-anim.css?v=c84d2e1f","coachshell.css?v=c84d2e1f","dark.css?v=c84d2e1f","coachshell.js?v=c84d2e1f","design.js?v=c84d2e1f","core.js?v=c84d2e1f","data.js?v=c84d2e1f","data-systems2.js?v=c84d2e1f","data-systems3.js?v=c84d2e1f","data-systems4.js?v=c84d2e1f",
"data-rehab2.js?v=c84d2e1f","media.js?v=c84d2e1f","pro.js?v=c84d2e1f","lab.js?v=c84d2e1f","anatomy.js?v=c84d2e1f","health.js?v=c84d2e1f","posing.js?v=c84d2e1f","minerals.js?v=c84d2e1f","ghealth.js?v=c84d2e1f","stepsboard.js?v=c84d2e1f","push.js?v=c84d2e1f","confetti.js?v=c84d2e1f","celebrate.js?v=c84d2e1f","lottie.min.js?v=c84d2e1f","anims.js?v=c84d2e1f","lottie-star.json","lottie-dumbbell.json","icons.js?v=c84d2e1f","supps.js?v=c84d2e1f","views.js?v=c84d2e1f","coach.js?v=c84d2e1f","signup.js?v=c84d2e1f","qrcode.js?v=c84d2e1f","invite.js?v=c84d2e1f","referral.js?v=c84d2e1f","transform.js?v=c84d2e1f","chat.js?v=c84d2e1f","aichat.js?v=c84d2e1f","ai.js?v=c84d2e1f","inbox.js?v=c84d2e1f","screens.js?v=c84d2e1f","showcase.js?v=c84d2e1f","flame.js?v=c84d2e1f","photos.js?v=c84d2e1f","firstweek.js?v=c84d2e1f","league.js?v=c84d2e1f","prices.js?v=c84d2e1f","training.js?v=c84d2e1f","sharecard.js?v=c84d2e1f","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
