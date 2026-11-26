/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="6c92fa8b";
const SHELL0=["./","index.html","styles.css?v=6c92fa8b","design.css?v=6c92fa8b","icons-anim.css?v=6c92fa8b","coachshell.css?v=6c92fa8b","dark.css?v=6c92fa8b","coachshell.js?v=6c92fa8b","design.js?v=6c92fa8b","core.js?v=6c92fa8b","data.js?v=6c92fa8b","data-systems2.js?v=6c92fa8b","data-systems3.js?v=6c92fa8b","data-systems4.js?v=6c92fa8b","data-rehab2.js?v=6c92fa8b","media.js?v=6c92fa8b","pro.js?v=6c92fa8b","lab.js?v=6c92fa8b","anatomy.js?v=6c92fa8b","health.js?v=6c92fa8b","posing.js?v=6c92fa8b","minerals.js?v=6c92fa8b","ghealth.js?v=6c92fa8b","stepsboard.js?v=6c92fa8b","push.js?v=6c92fa8b","confetti.js?v=6c92fa8b","celebrate.js?v=6c92fa8b","lottie.min.js?v=6c92fa8b","anims.js?v=6c92fa8b","chart.min.js?v=6c92fa8b","charts.js?v=6c92fa8b","exdb-data.js?v=6c92fa8b","exdb.js?v=6c92fa8b","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","dates.js?v=6c92fa8b","lottie-star.json","lottie-dumbbell.json","icons.js?v=6c92fa8b","supps.js?v=6c92fa8b","views.js?v=6c92fa8b","coach.js?v=6c92fa8b","signup.js?v=6c92fa8b","qrcode.js?v=6c92fa8b","invite.js?v=6c92fa8b","referral.js?v=6c92fa8b","transform.js?v=6c92fa8b","chat.js?v=6c92fa8b","aichat.js?v=6c92fa8b","ai.js?v=6c92fa8b","inbox.js?v=6c92fa8b","screens.js?v=6c92fa8b","showcase.js?v=6c92fa8b","flame.js?v=6c92fa8b","photos.js?v=6c92fa8b","firstweek.js?v=6c92fa8b","league.js?v=6c92fa8b","prices.js?v=6c92fa8b","training.js?v=6c92fa8b","sharecard.js?v=6c92fa8b","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
