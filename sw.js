/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="9be44d21";
const SHELL0=["./","index.html","styles.css?v=9be44d21","design.css?v=9be44d21","fonts.css?v=9be44d21","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=9be44d21","coachshell.css?v=9be44d21","dark.css?v=9be44d21","coachshell.js?v=9be44d21","design.js?v=9be44d21","core.js?v=9be44d21","data.js?v=9be44d21","data-systems2.js?v=9be44d21","data-systems3.js?v=9be44d21","data-systems4.js?v=9be44d21","data-rehab2.js?v=9be44d21","media.js?v=9be44d21","pro.js?v=9be44d21","lab.js?v=9be44d21","anatomy.js?v=9be44d21","health.js?v=9be44d21","posing.js?v=9be44d21","pose-annotate.js?v=9be44d21","minerals.js?v=9be44d21","ghealth.js?v=9be44d21","stepsboard.js?v=9be44d21","push.js?v=9be44d21","confetti.js?v=9be44d21","celebrate.js?v=9be44d21","lottie.min.js?v=9be44d21","anims.js?v=9be44d21","chart.min.js?v=9be44d21","charts.js?v=9be44d21","exdb-data.js?v=9be44d21","exdb.js?v=9be44d21","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","dates.js?v=9be44d21","lottie-star.json","lottie-dumbbell.json","icons.js?v=9be44d21","supps.js?v=9be44d21","views.js?v=9be44d21","coach.js?v=9be44d21","signup.js?v=9be44d21","qrcode.js?v=9be44d21","invite.js?v=9be44d21","referral.js?v=9be44d21","transform.js?v=9be44d21","chat.js?v=9be44d21","aichat.js?v=9be44d21","ai.js?v=9be44d21","inbox.js?v=9be44d21","screens.js?v=9be44d21","showcase.js?v=9be44d21","flame.js?v=9be44d21","photos.js?v=9be44d21","firstweek.js?v=9be44d21","league.js?v=9be44d21","prices.js?v=9be44d21","training.js?v=9be44d21","sharecard.js?v=9be44d21","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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



