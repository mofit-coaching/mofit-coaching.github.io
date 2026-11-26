/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="1126a5";
const SHELL0=["./","index.html","styles.css?v=1126a5","design.css?v=1126a5","coachshell.css?v=1126a5","dark.css?v=1126a5","coachshell.js?v=1126a5","design.js?v=1126a5","core.js?v=1126a5","data.js?v=1126a5","data-systems2.js?v=1126a5","data-systems3.js?v=1126a5","data-systems4.js?v=1126a5",
"data-rehab2.js?v=1126a5","media.js?v=1126a5","pro.js?v=1126a5","lab.js?v=1126a5","anatomy.js?v=1126a5","health.js?v=1126a5","posing.js?v=1126a5","minerals.js?v=1126a5","ghealth.js?v=1126a5","stepsboard.js?v=1126a5","push.js?v=1126a5","confetti.js?v=1126a5","celebrate.js?v=1126a5","lottie.min.js?v=1126a5","anims.js?v=1126a5","chart.min.js?v=1126a5","charts.js?v=1126a5","exdb-data.js?v=1126a5","exdb.js?v=1126a5","lottie-star.json","lottie-dumbbell.json","icons.js?v=1126a5","supps.js?v=1126a5","views.js?v=1126a5","coach.js?v=1126a5","signup.js?v=1126a5","qrcode.js?v=1126a5","invite.js?v=1126a5","referral.js?v=1126a5","transform.js?v=1126a5","chat.js?v=1126a5","aichat.js?v=1126a5","ai.js?v=1126a5","inbox.js?v=1126a5","screens.js?v=1126a5","showcase.js?v=1126a5","flame.js?v=1126a5","photos.js?v=1126a5","firstweek.js?v=1126a5","league.js?v=1126a5","prices.js?v=1126a5","training.js?v=1126a5","sharecard.js?v=1126a5","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
