/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-b6c84f1e";
const SHELL=["./","index.html","styles.css?v=b6c84f1e","design.css?v=b6c84f1e","design.js?v=b6c84f1e","core.js?v=b6c84f1e","data.js?v=b6c84f1e","data-systems2.js?v=b6c84f1e","data-systems3.js?v=b6c84f1e",
"data-rehab2.js?v=b6c84f1e","media.js?v=b6c84f1e","pro.js?v=b6c84f1e","lab.js?v=b6c84f1e","anatomy.js?v=b6c84f1e","health.js?v=b6c84f1e","posing.js?v=b6c84f1e","minerals.js?v=b6c84f1e","ghealth.js?v=b6c84f1e","stepsboard.js?v=b6c84f1e","push.js?v=b6c84f1e","icons.js?v=b6c84f1e","supps.js?v=b6c84f1e","views.js?v=b6c84f1e","coach.js?v=b6c84f1e","signup.js?v=b6c84f1e","qrcode.js?v=b6c84f1e","invite.js?v=b6c84f1e","referral.js?v=b6c84f1e","transform.js?v=b6c84f1e","chat.js?v=b6c84f1e","aichat.js?v=b6c84f1e","ai.js?v=b6c84f1e","inbox.js?v=b6c84f1e","screens.js?v=b6c84f1e","showcase.js?v=b6c84f1e","flame.js?v=b6c84f1e","photos.js?v=b6c84f1e","firstweek.js?v=b6c84f1e","league.js?v=b6c84f1e","prices.js?v=b6c84f1e","training.js?v=b6c84f1e","sharecard.js?v=b6c84f1e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

