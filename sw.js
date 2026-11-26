/* Mofit offline cache: app shell + CDN libs. Supabase API calls are never cached. */
const C="mofit-c4a91f7e";
const SHELL=["./","index.html","styles.css?v=c4a91f7e","design.css?v=c4a91f7e","icons-anim.css?v=c4a91f7e","coachshell.css?v=c4a91f7e","dark.css?v=c4a91f7e","coachshell.js?v=c4a91f7e","design.js?v=c4a91f7e","core.js?v=c4a91f7e","data.js?v=c4a91f7e","data-systems2.js?v=c4a91f7e","data-systems3.js?v=c4a91f7e","data-systems4.js?v=c4a91f7e",
"data-rehab2.js?v=c4a91f7e","media.js?v=c4a91f7e","pro.js?v=c4a91f7e","lab.js?v=c4a91f7e","anatomy.js?v=c4a91f7e","health.js?v=c4a91f7e","posing.js?v=c4a91f7e","minerals.js?v=c4a91f7e","ghealth.js?v=c4a91f7e","stepsboard.js?v=c4a91f7e","push.js?v=c4a91f7e","icons.js?v=c4a91f7e","supps.js?v=c4a91f7e","views.js?v=c4a91f7e","coach.js?v=c4a91f7e","signup.js?v=c4a91f7e","qrcode.js?v=c4a91f7e","invite.js?v=c4a91f7e","referral.js?v=c4a91f7e","transform.js?v=c4a91f7e","chat.js?v=c4a91f7e","aichat.js?v=c4a91f7e","ai.js?v=c4a91f7e","inbox.js?v=c4a91f7e","screens.js?v=c4a91f7e","showcase.js?v=c4a91f7e","flame.js?v=c4a91f7e","photos.js?v=c4a91f7e","firstweek.js?v=c4a91f7e","league.js?v=c4a91f7e","prices.js?v=c4a91f7e","training.js?v=c4a91f7e","sharecard.js?v=c4a91f7e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
