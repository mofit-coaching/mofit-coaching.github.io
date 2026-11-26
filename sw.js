/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="7fa31c94";
const SHELL0=["./","index.html","styles.css?v=7fa31c94","design.css?v=7fa31c94","fonts.css?v=7fa31c94","mofit-tokens.css?v=7fa31c94","mofit-look.css?v=7fa31c94","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=7fa31c94","coachshell.css?v=7fa31c94","dark.css?v=7fa31c94","coachshell.js?v=7fa31c94","design.js?v=7fa31c94","core.js?v=7fa31c94","data.js?v=7fa31c94","data-systems2.js?v=7fa31c94","data-systems3.js?v=7fa31c94","data-systems4.js?v=7fa31c94","data-rehab2.js?v=7fa31c94","media.js?v=7fa31c94","pro.js?v=7fa31c94","lab.js?v=7fa31c94","anatomy.js?v=7fa31c94","health.js?v=7fa31c94","posing.js?v=7fa31c94","pose-annotate.js?v=7fa31c94","minerals.js?v=7fa31c94","ghealth.js?v=7fa31c94","stepsboard.js?v=7fa31c94","push.js?v=7fa31c94","confetti.js?v=7fa31c94","celebrate.js?v=7fa31c94","lottie.min.js?v=7fa31c94","anims.js?v=7fa31c94","chart.min.js?v=7fa31c94","charts.js?v=7fa31c94","exdb-data.js?v=7fa31c94","exdb.js?v=7fa31c94","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","barcode.js","vendor/zxing.min.js","dates.js?v=7fa31c94","lottie-star.json","lottie-dumbbell.json","icons.js?v=7fa31c94","supps.js?v=7fa31c94","views.js?v=7fa31c94","coach.js?v=7fa31c94","signup.js?v=7fa31c94","qrcode.js?v=7fa31c94","invite.js?v=7fa31c94","referral.js?v=7fa31c94","transform.js?v=7fa31c94","chat.js?v=7fa31c94","aichat.js?v=7fa31c94","ai.js?v=7fa31c94","inbox.js?v=7fa31c94","subs.js?v=7fa31c94","screens.js?v=7fa31c94","showcase.js?v=7fa31c94","flame.js?v=7fa31c94","photos.js?v=7fa31c94","firstweek.js?v=7fa31c94","league.js?v=7fa31c94","prices.js?v=7fa31c94","training.js?v=7fa31c94","sharecard.js?v=7fa31c94","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
const SHELL=SHELL0;
if(self.workbox){
  const wb=self.workbox;
  wb.setConfig({modulePathPrefix:"wb/"});
  wb.precaching.precacheAndRoute(SHELL.map(u=>({url:u,revision:V})));
  wb.precaching.cleanupOutdatedCaches();
  wb.routing.registerRoute(({request})=>request.mode==="navigate",
    new wb.strategies.NetworkFirst({cacheName:"mofit-pages-"+V,networkTimeoutSeconds:8}));
  wb.routing.registerRoute(({url})=>/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision@1\.2\.3\//.test(url.href)||/storage\.googleapis\.com\/mediapipe-models\/pose_landmarker\//.test(url.href),
    new wb.strategies.CacheFirst({cacheName:"mofit-pose-v1"}));
  wb.routing.registerRoute(({url,request})=>request.method==="GET"&&(url.origin===location.origin||/jsdelivr|googleapis|gstatic/.test(url.hostname)),
    new wb.strategies.StaleWhileRevalidate({cacheName:"mofit-static-"+V}));
  self.addEventListener("install",e=>self.skipWaiting());
  self.addEventListener("activate",e=>{
    e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf("mofit-")===0&&k.indexOf("mofit-pose")!==0&&k.indexOf(V)===-1).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
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





