/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-521a368f";
const SHELL=["./","index.html","styles.css?v=521a368f","design.css?v=521a368f","icons-anim.css?v=521a368f","coachshell.css?v=521a368f","dark.css?v=521a368f","coachshell.js?v=521a368f","design.js?v=521a368f","core.js?v=521a368f","data.js?v=521a368f","data-systems2.js?v=521a368f","data-systems3.js?v=521a368f","data-systems4.js?v=521a368f",
"data-rehab2.js?v=521a368f","media.js?v=521a368f","pro.js?v=521a368f","lab.js?v=521a368f","anatomy.js?v=521a368f","health.js?v=521a368f","posing.js?v=521a368f","annotate.js?v=521a368f","minerals.js?v=521a368f","ghealth.js?v=521a368f","stepsboard.js?v=521a368f","push.js?v=521a368f","icons.js?v=521a368f","supps.js?v=521a368f","views.js?v=521a368f","coach.js?v=521a368f","signup.js?v=521a368f","qrcode.js?v=521a368f","invite.js?v=521a368f","referral.js?v=521a368f","transform.js?v=521a368f","chat.js?v=521a368f","aichat.js?v=521a368f","ai.js?v=521a368f","inbox.js?v=521a368f","screens.js?v=521a368f","showcase.js?v=521a368f","flame.js?v=521a368f","photos.js?v=521a368f","firstweek.js?v=521a368f","league.js?v=521a368f","prices.js?v=521a368f","training.js?v=521a368f","sharecard.js?v=521a368f","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
