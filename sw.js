/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c7d2f05e";
const SHELL=["./","index.html","styles.css?v=c7d2f05e","design.css?v=c7d2f05e","coachshell.css?v=c7d2f05e","coachshell.js?v=c7d2f05e","design.js?v=c7d2f05e","core.js?v=c7d2f05e","data.js?v=c7d2f05e","data-systems2.js?v=c7d2f05e","data-systems3.js?v=c7d2f05e",
"data-rehab2.js?v=c7d2f05e","media.js?v=c7d2f05e","pro.js?v=c7d2f05e","lab.js?v=c7d2f05e","anatomy.js?v=c7d2f05e","health.js?v=c7d2f05e","posing.js?v=c7d2f05e","minerals.js?v=c7d2f05e","ghealth.js?v=c7d2f05e","stepsboard.js?v=c7d2f05e","push.js?v=c7d2f05e","icons.js?v=c7d2f05e","supps.js?v=c7d2f05e","views.js?v=c7d2f05e","coach.js?v=c7d2f05e","signup.js?v=c7d2f05e","qrcode.js?v=c7d2f05e","invite.js?v=c7d2f05e","referral.js?v=c7d2f05e","transform.js?v=c7d2f05e","chat.js?v=c7d2f05e","aichat.js?v=c7d2f05e","ai.js?v=c7d2f05e","inbox.js?v=c7d2f05e","screens.js?v=c7d2f05e","showcase.js?v=c7d2f05e","flame.js?v=c7d2f05e","photos.js?v=c7d2f05e","firstweek.js?v=c7d2f05e","league.js?v=c7d2f05e","prices.js?v=c7d2f05e","training.js?v=c7d2f05e","sharecard.js?v=c7d2f05e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

