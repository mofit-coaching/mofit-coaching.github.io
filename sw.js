/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="1126a4";
const SHELL0=["./","index.html","styles.css?v=1126a4","design.css?v=1126a4","coachshell.css?v=1126a4","dark.css?v=1126a4","coachshell.js?v=1126a4","design.js?v=1126a4","core.js?v=1126a4","data.js?v=1126a4","data-systems2.js?v=1126a4","data-systems3.js?v=1126a4","data-systems4.js?v=1126a4",
"data-rehab2.js?v=1126a4","media.js?v=1126a4","pro.js?v=1126a4","lab.js?v=1126a4","anatomy.js?v=1126a4","health.js?v=1126a4","posing.js?v=1126a4","minerals.js?v=1126a4","ghealth.js?v=1126a4","stepsboard.js?v=1126a4","push.js?v=1126a4","confetti.js?v=1126a4","celebrate.js?v=1126a4","lottie.min.js?v=1126a4","anims.js?v=1126a4","chart.min.js?v=1126a4","charts.js?v=1126a4","lottie-star.json","lottie-dumbbell.json","icons.js?v=1126a4","supps.js?v=1126a4","views.js?v=1126a4","coach.js?v=1126a4","signup.js?v=1126a4","qrcode.js?v=1126a4","invite.js?v=1126a4","referral.js?v=1126a4","transform.js?v=1126a4","chat.js?v=1126a4","aichat.js?v=1126a4","ai.js?v=1126a4","inbox.js?v=1126a4","screens.js?v=1126a4","showcase.js?v=1126a4","flame.js?v=1126a4","photos.js?v=1126a4","firstweek.js?v=1126a4","league.js?v=1126a4","prices.js?v=1126a4","training.js?v=1126a4","sharecard.js?v=1126a4","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
const SHELL=SHELL0;
if(self.workbox){
  const wb=self.workbox;
  wb.setConfig({modulePathPrefix:"wb/"});
  wb.precaching.precacheAndRoute(SHELL.map(u=>({url:u,revision:V})));
  wb.precaching.cleanupOutdatedCaches();
  wb.routing.registerRoute(({request})=>request.mode==="navigate",
    new wb.strategies.NetworkFirst({cacheName:"mofit-pages-"+V,networkTimeoutSeconds:8}));
  wb.routing.registerRoute(({url,request})=>request.method==="GET"&&(url.origin===location.origin||/jsdelivr|googleapis|gstatic/.test(url.hostname)),
    new wb.strategies.StaleWhileRevalidate({cacheName:"mofit-static-"+V}));
  self.addEventListener("install",e=>self.skipWaiting());
  self.addEventListener("activate",e=>{
    e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf("mofit-")===0&&k.indexOf(V)===-1).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
  });
}

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
