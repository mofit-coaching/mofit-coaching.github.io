/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="a72f5c18";
const SHELL0=["./","index.html","styles.css?v=a72f5c18","design.css?v=a72f5c18","icons-anim.css?v=a72f5c18","coachshell.css?v=a72f5c18","dark.css?v=a72f5c18","coachshell.js?v=a72f5c18","design.js?v=a72f5c18","core.js?v=a72f5c18","data.js?v=a72f5c18","data-systems2.js?v=a72f5c18","data-systems3.js?v=a72f5c18","data-systems4.js?v=a72f5c18","data-rehab2.js?v=a72f5c18","media.js?v=a72f5c18","pro.js?v=a72f5c18","lab.js?v=a72f5c18","anatomy.js?v=a72f5c18","health.js?v=a72f5c18","posing.js?v=a72f5c18","minerals.js?v=a72f5c18","ghealth.js?v=a72f5c18","stepsboard.js?v=a72f5c18","push.js?v=a72f5c18","confetti.js?v=a72f5c18","celebrate.js?v=a72f5c18","lottie.min.js?v=a72f5c18","anims.js?v=a72f5c18","chart.min.js?v=a72f5c18","charts.js?v=a72f5c18","exdb-data.js?v=a72f5c18","exdb.js?v=a72f5c18","lottie-star.json","lottie-dumbbell.json","icons.js?v=a72f5c18","supps.js?v=a72f5c18","views.js?v=a72f5c18","coach.js?v=a72f5c18","signup.js?v=a72f5c18","qrcode.js?v=a72f5c18","invite.js?v=a72f5c18","referral.js?v=a72f5c18","transform.js?v=a72f5c18","chat.js?v=a72f5c18","aichat.js?v=a72f5c18","ai.js?v=a72f5c18","inbox.js?v=a72f5c18","screens.js?v=a72f5c18","showcase.js?v=a72f5c18","flame.js?v=a72f5c18","photos.js?v=a72f5c18","firstweek.js?v=a72f5c18","league.js?v=a72f5c18","prices.js?v=a72f5c18","training.js?v=a72f5c18","sharecard.js?v=a72f5c18","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

