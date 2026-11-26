/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="d91c4b2a";
const SHELL0=["./","index.html","styles.css?v=d91c4b2a","design.css?v=d91c4b2a","icons-anim.css?v=d91c4b2a","coachshell.css?v=d91c4b2a","dark.css?v=d91c4b2a","coachshell.js?v=d91c4b2a","design.js?v=d91c4b2a","core.js?v=d91c4b2a","data.js?v=d91c4b2a","data-systems2.js?v=d91c4b2a","data-systems3.js?v=d91c4b2a","data-systems4.js?v=d91c4b2a","data-rehab2.js?v=d91c4b2a","media.js?v=d91c4b2a","pro.js?v=d91c4b2a","lab.js?v=d91c4b2a","anatomy.js?v=d91c4b2a","health.js?v=d91c4b2a","posing.js?v=d91c4b2a","minerals.js?v=d91c4b2a","ghealth.js?v=d91c4b2a","stepsboard.js?v=d91c4b2a","push.js?v=d91c4b2a","confetti.js?v=d91c4b2a","celebrate.js?v=d91c4b2a","lottie.min.js?v=d91c4b2a","anims.js?v=d91c4b2a","chart.min.js?v=d91c4b2a","charts.js?v=d91c4b2a","exdb-data.js?v=d91c4b2a","exdb.js?v=d91c4b2a","lottie-star.json","lottie-dumbbell.json","icons.js?v=d91c4b2a","supps.js?v=d91c4b2a","views.js?v=d91c4b2a","coach.js?v=d91c4b2a","signup.js?v=d91c4b2a","qrcode.js?v=d91c4b2a","invite.js?v=d91c4b2a","referral.js?v=d91c4b2a","transform.js?v=d91c4b2a","chat.js?v=d91c4b2a","aichat.js?v=d91c4b2a","ai.js?v=d91c4b2a","inbox.js?v=d91c4b2a","subs.js?v=d91c4b2a","screens.js?v=d91c4b2a","showcase.js?v=d91c4b2a","flame.js?v=d91c4b2a","photos.js?v=d91c4b2a","firstweek.js?v=d91c4b2a","league.js?v=d91c4b2a","prices.js?v=d91c4b2a","training.js?v=d91c4b2a","sharecard.js?v=d91c4b2a","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

