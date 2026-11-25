/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c4373acf";
const SHELL=["./","index.html","styles.css?v=c4373acf","design.css?v=c4373acf","coachshell.css?v=c4373acf","coachshell.js?v=c4373acf","design.js?v=c4373acf","core.js?v=c4373acf","data.js?v=c4373acf","data-systems2.js?v=c4373acf","data-systems3.js?v=c4373acf",
"data-rehab2.js?v=c4373acf","media.js?v=c4373acf","pro.js?v=c4373acf","lab.js?v=c4373acf","anatomy.js?v=c4373acf","health.js?v=c4373acf","posing.js?v=c4373acf","minerals.js?v=c4373acf","ghealth.js?v=c4373acf","stepsboard.js?v=c4373acf","push.js?v=c4373acf","icons.js?v=c4373acf","supps.js?v=c4373acf","views.js?v=c4373acf","coach.js?v=c4373acf","signup.js?v=c4373acf","qrcode.js?v=c4373acf","invite.js?v=c4373acf","referral.js?v=c4373acf","transform.js?v=c4373acf","chat.js?v=c4373acf","aichat.js?v=c4373acf","ai.js?v=c4373acf","inbox.js?v=c4373acf","screens.js?v=c4373acf","showcase.js?v=c4373acf","flame.js?v=c4373acf","photos.js?v=c4373acf","firstweek.js?v=c4373acf","league.js?v=c4373acf","prices.js?v=c4373acf","training.js?v=c4373acf","sharecard.js?v=c4373acf","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
