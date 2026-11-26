/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-8f2b4c6d";
const SHELL=["./","index.html","styles.css?v=8f2b4c6d","design.css?v=8f2b4c6d","coachshell.css?v=8f2b4c6d","coachshell.js?v=8f2b4c6d","design.js?v=8f2b4c6d","core.js?v=8f2b4c6d","data.js?v=8f2b4c6d","data-systems2.js?v=8f2b4c6d","data-systems3.js?v=8f2b4c6d",
"data-rehab2.js?v=8f2b4c6d","media.js?v=8f2b4c6d","pro.js?v=8f2b4c6d","lab.js?v=8f2b4c6d","anatomy.js?v=8f2b4c6d","health.js?v=8f2b4c6d","posing.js?v=8f2b4c6d","minerals.js?v=8f2b4c6d","ghealth.js?v=8f2b4c6d","stepsboard.js?v=8f2b4c6d","push.js?v=8f2b4c6d","icons.js?v=8f2b4c6d","supps.js?v=8f2b4c6d","views.js?v=8f2b4c6d","coach.js?v=8f2b4c6d","signup.js?v=8f2b4c6d","resetpass.js?v=8f2b4c6d","qrcode.js?v=8f2b4c6d","invite.js?v=8f2b4c6d","referral.js?v=8f2b4c6d","transform.js?v=8f2b4c6d","chat.js?v=8f2b4c6d","aichat.js?v=8f2b4c6d","ai.js?v=8f2b4c6d","inbox.js?v=8f2b4c6d","screens.js?v=8f2b4c6d","showcase.js?v=8f2b4c6d","flame.js?v=8f2b4c6d","photos.js?v=8f2b4c6d","firstweek.js?v=8f2b4c6d","league.js?v=8f2b4c6d","prices.js?v=8f2b4c6d","training.js?v=8f2b4c6d","sharecard.js?v=8f2b4c6d","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
