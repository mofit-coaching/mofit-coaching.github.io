/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-f85b30c0";
const SHELL=["./","index.html","styles.css?v=f85b30c0","design.css?v=f85b30c0","design.js?v=f85b30c0","core.js?v=f85b30c0","data.js?v=f85b30c0","data-systems2.js?v=f85b30c0","data-systems3.js?v=f85b30c0",
"data-rehab2.js?v=f85b30c0","media.js?v=f85b30c0","pro.js?v=f85b30c0","lab.js?v=f85b30c0","anatomy.js?v=f85b30c0","health.js?v=f85b30c0","posing.js?v=f85b30c0","minerals.js?v=f85b30c0","ghealth.js?v=f85b30c0","push.js?v=f85b30c0","icons.js?v=f85b30c0","supps.js?v=f85b30c0","views.js?v=f85b30c0","coach.js?v=f85b30c0","signup.js?v=f85b30c0","qrcode.js?v=f85b30c0","invite.js?v=f85b30c0","referral.js?v=f85b30c0","transform.js?v=f85b30c0","chat.js?v=f85b30c0","aichat.js?v=f85b30c0","ai.js?v=f85b30c0","inbox.js?v=f85b30c0","screens.js?v=f85b30c0","showcase.js?v=f85b30c0","flame.js?v=f85b30c0","photos.js?v=f85b30c0","firstweek.js?v=f85b30c0","league.js?v=f85b30c0","prices.js?v=f85b30c0","training.js?v=f85b30c0","sharecard.js?v=f85b30c0","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

