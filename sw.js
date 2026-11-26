/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-a41f7c2e";
const SHELL=["./","index.html","styles.css?v=a41f7c2e","design.css?v=a41f7c2e","coachshell.css?v=a41f7c2e","coachshell.js?v=a41f7c2e","design.js?v=a41f7c2e","core.js?v=a41f7c2e","data.js?v=a41f7c2e","data-systems2.js?v=a41f7c2e","data-systems3.js?v=a41f7c2e",
"data-rehab2.js?v=a41f7c2e","media.js?v=a41f7c2e","pro.js?v=a41f7c2e","lab.js?v=a41f7c2e","anatomy.js?v=a41f7c2e","health.js?v=a41f7c2e","posing.js?v=a41f7c2e","minerals.js?v=a41f7c2e","ghealth.js?v=a41f7c2e","stepsboard.js?v=a41f7c2e","push.js?v=a41f7c2e","icons.js?v=a41f7c2e","supps.js?v=a41f7c2e","views.js?v=a41f7c2e","coach.js?v=a41f7c2e","signup.js?v=a41f7c2e","qrcode.js?v=a41f7c2e","invite.js?v=a41f7c2e","referral.js?v=a41f7c2e","transform.js?v=a41f7c2e","chat.js?v=a41f7c2e","aichat.js?v=a41f7c2e","ai.js?v=a41f7c2e","inbox.js?v=a41f7c2e","screens.js?v=a41f7c2e","showcase.js?v=a41f7c2e","flame.js?v=a41f7c2e","photos.js?v=a41f7c2e","firstweek.js?v=a41f7c2e","league.js?v=a41f7c2e","prices.js?v=a41f7c2e","training.js?v=a41f7c2e","sharecard.js?v=a41f7c2e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
