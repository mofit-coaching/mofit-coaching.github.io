/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="a2c71f55";
const SHELL0=["./","rolling.js","sounds.js","crop.js","ba-slider.js","instant.js","index.html","styles.css?v=a2c71f55","design.css?v=a2c71f55","fonts.css?v=a2c71f55","mofit-tokens.css?v=a2c71f55","mofit-look.css?v=a2c71f55","mofit-home.css?v=a2c71f55","mofit-breathe.css?v=a2c71f55","mofit-warn.css?v=a2c71f55","mofit-contrast.css?v=a2c71f55","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=a2c71f55","coachshell.css?v=a2c71f55","dark.css?v=a2c71f55","coachshell.js?v=a2c71f55","design.js?v=a2c71f55","motion.js?v=a2c71f55","core.js?v=a2c71f55","data.js?v=a2c71f55","data-systems2.js?v=a2c71f55","data-systems3.js?v=a2c71f55","data-systems4.js?v=a2c71f55","data-rehab2.js?v=a2c71f55","media.js?v=a2c71f55","pro.js?v=a2c71f55","lab.js?v=a2c71f55","anatomy.js?v=a2c71f55","health.js?v=a2c71f55","posing.js?v=a2c71f55","pose-annotate.js?v=a2c71f55","minerals.js?v=a2c71f55","ghealth.js?v=a2c71f55","stepsboard.js?v=a2c71f55","push.js?v=a2c71f55","confetti.js?v=a2c71f55","celebrate.js?v=a2c71f55","lottie.min.js?v=a2c71f55","anims.js?v=a2c71f55","chart.min.js?v=a2c71f55","charts.js?v=a2c71f55","exdb-data.js?v=a2c71f55","exdb.js?v=a2c71f55","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","swiper.js","vendor/swiper-bundle.min.js","vendor/swiper-bundle.min.css","barcode.js","vendor/zxing.min.js","dates.js?v=a2c71f55","vcall.js","ctable.js","ccalendar.js","tour.js","plyrwrap.js","exdrag.js","lottie-star.json","lottie-dumbbell.json","icons.js?v=a2c71f55","supps.js?v=a2c71f55","views.js?v=a2c71f55","coach.js?v=a2c71f55","signup.js?v=a2c71f55","qrcode.js?v=a2c71f55","invite.js?v=a2c71f55","referral.js?v=a2c71f55","transform.js?v=a2c71f55","chat.js?v=a2c71f55","aichat.js?v=a2c71f55","ai.js?v=a2c71f55","inbox.js?v=a2c71f55","subs.js?v=a2c71f55","screens.js?v=a2c71f55","showcase.js?v=a2c71f55","flame.js?v=a2c71f55","photos.js?v=a2c71f55","firstweek.js?v=a2c71f55","league.js?v=a2c71f55","prices.js?v=a2c71f55","training.js?v=a2c71f55","sharecard.js?v=a2c71f55","annotate.js","diet-pdf.js","fx-avatars.js","fx-rings.js","fx-spring.js","fx-tooltips.js","gallery.js","input-safety.js","install.js","popups.js","rtl.js?v=1","search.js","stepper.js","voice.js","xlsx-export.js","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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








