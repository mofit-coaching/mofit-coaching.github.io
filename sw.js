/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-e7a30c52";
const SHELL=["./","index.html","styles.css?v=e7a30c52","design.css?v=e7a30c52","coachshell.css?v=e7a30c52","coachshell.js?v=e7a30c52","design.js?v=e7a30c52","core.js?v=e7a30c52","data.js?v=e7a30c52","data-systems2.js?v=e7a30c52","data-systems3.js?v=e7a30c52",
"data-rehab2.js?v=e7a30c52","media.js?v=e7a30c52","pro.js?v=e7a30c52","lab.js?v=e7a30c52","anatomy.js?v=e7a30c52","health.js?v=e7a30c52","posing.js?v=e7a30c52","minerals.js?v=e7a30c52","ghealth.js?v=e7a30c52","stepsboard.js?v=e7a30c52","push.js?v=e7a30c52","icons.js?v=e7a30c52","supps.js?v=e7a30c52","views.js?v=e7a30c52","coach.js?v=e7a30c52","signup.js?v=e7a30c52","qrcode.js?v=e7a30c52","invite.js?v=e7a30c52","referral.js?v=e7a30c52","transform.js?v=e7a30c52","chat.js?v=e7a30c52","aichat.js?v=e7a30c52","ai.js?v=e7a30c52","inbox.js?v=e7a30c52","screens.js?v=e7a30c52","showcase.js?v=e7a30c52","flame.js?v=e7a30c52","photos.js?v=e7a30c52","firstweek.js?v=e7a30c52","league.js?v=e7a30c52","prices.js?v=e7a30c52","training.js?v=e7a30c52","sharecard.js?v=e7a30c52","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

