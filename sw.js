/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f942f37c";
const SHELL=["./","index.html","styles.css?v=f942f37c","design.css?v=f942f37c","design.js?v=f942f37c","core.js?v=f942f37c","data.js?v=f942f37c","data-systems2.js?v=f942f37c","data-systems3.js?v=f942f37c",
"data-rehab2.js?v=f942f37c","media.js?v=f942f37c","pro.js?v=f942f37c","lab.js?v=f942f37c","anatomy.js?v=f942f37c","health.js?v=f942f37c","posing.js?v=f942f37c","minerals.js?v=f942f37c","ghealth.js?v=f942f37c","stepsboard.js?v=f942f37c","push.js?v=f942f37c","icons.js?v=f942f37c","supps.js?v=f942f37c","views.js?v=f942f37c","coach.js?v=f942f37c","signup.js?v=f942f37c","qrcode.js?v=f942f37c","invite.js?v=f942f37c","referral.js?v=f942f37c","transform.js?v=f942f37c","chat.js?v=f942f37c","aichat.js?v=f942f37c","ai.js?v=f942f37c","inbox.js?v=f942f37c","screens.js?v=f942f37c","showcase.js?v=f942f37c","flame.js?v=f942f37c","photos.js?v=f942f37c","firstweek.js?v=f942f37c","league.js?v=f942f37c","prices.js?v=f942f37c","training.js?v=f942f37c","sharecard.js?v=f942f37c","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

