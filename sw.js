/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c2298c95";
const SHELL=["./","index.html","styles.css?v=c2298c95","design.css?v=c2298c95","coachshell.css?v=c2298c95","coachshell.js?v=c2298c95","design.js?v=c2298c95","core.js?v=c2298c95","data.js?v=c2298c95","data-systems2.js?v=c2298c95","data-systems3.js?v=c2298c95",
"data-rehab2.js?v=c2298c95","media.js?v=c2298c95","pro.js?v=c2298c95","lab.js?v=c2298c95","anatomy.js?v=c2298c95","health.js?v=c2298c95","posing.js?v=c2298c95","minerals.js?v=c2298c95","ghealth.js?v=c2298c95","stepsboard.js?v=c2298c95","push.js?v=c2298c95","icons.js?v=c2298c95","supps.js?v=c2298c95","views.js?v=c2298c95","coach.js?v=c2298c95","signup.js?v=c2298c95","qrcode.js?v=c2298c95","invite.js?v=c2298c95","referral.js?v=c2298c95","transform.js?v=c2298c95","chat.js?v=c2298c95","aichat.js?v=c2298c95","ai.js?v=c2298c95","inbox.js?v=c2298c95","screens.js?v=c2298c95","showcase.js?v=c2298c95","flame.js?v=c2298c95","photos.js?v=c2298c95","firstweek.js?v=c2298c95","league.js?v=c2298c95","prices.js?v=c2298c95","training.js?v=c2298c95","sharecard.js?v=c2298c95","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

