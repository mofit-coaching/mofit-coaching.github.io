/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="c4f81d27";
const SHELL0=["./","rolling.js","sounds.js","crop.js","ba-slider.js","instant.js","index.html","styles.css?v=c4f81d27","design.css?v=c4f81d27","fonts.css?v=c4f81d27","mofit-tokens.css?v=c4f81d27","mofit-look.css?v=c4f81d27","mofit-home.css?v=c4f81d27","mofit-breathe.css?v=c4f81d27","mofit-warn.css?v=c4f81d27","mofit-contrast.css?v=c4f81d27","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=c4f81d27","coachshell.css?v=c4f81d27","dark.css?v=c4f81d27","coachshell.js?v=c4f81d27","design.js?v=c4f81d27","motion.js?v=c4f81d27","core.js?v=c4f81d27","data.js?v=c4f81d27","data-systems2.js?v=c4f81d27","data-systems3.js?v=c4f81d27","data-systems4.js?v=c4f81d27","data-rehab2.js?v=c4f81d27","media.js?v=c4f81d27","pro.js?v=c4f81d27","lab.js?v=c4f81d27","anatomy.js?v=c4f81d27","health.js?v=c4f81d27","posing.js?v=c4f81d27","pose-annotate.js?v=c4f81d27","minerals.js?v=c4f81d27","ghealth.js?v=c4f81d27","stepsboard.js?v=c4f81d27","push.js?v=c4f81d27","confetti.js?v=c4f81d27","celebrate.js?v=c4f81d27","lottie.min.js?v=c4f81d27","anims.js?v=c4f81d27","chart.min.js?v=c4f81d27","charts.js?v=c4f81d27","exdb-data.js?v=c4f81d27","exdb.js?v=c4f81d27","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","swiper.js","vendor/swiper-bundle.min.js","vendor/swiper-bundle.min.css","barcode.js","vendor/zxing.min.js","dates.js?v=c4f81d27","vcall.js","ctable.js","ccalendar.js","tour.js","plyrwrap.js","exdrag.js","lottie-star.json","lottie-dumbbell.json","icons.js?v=c4f81d27","supps.js?v=c4f81d27","views.js?v=c4f81d27","coach.js?v=c4f81d27","signup.js?v=c4f81d27","qrcode.js?v=c4f81d27","invite.js?v=c4f81d27","referral.js?v=c4f81d27","transform.js?v=c4f81d27","chat.js?v=c4f81d27","aichat.js?v=c4f81d27","ai.js?v=c4f81d27","inbox.js?v=c4f81d27","subs.js?v=c4f81d27","screens.js?v=c4f81d27","showcase.js?v=c4f81d27","flame.js?v=c4f81d27","photos.js?v=c4f81d27","firstweek.js?v=c4f81d27","league.js?v=c4f81d27","prices.js?v=c4f81d27","training.js?v=c4f81d27","sharecard.js?v=c4f81d27","annotate.js","diet-pdf.js","fx-avatars.js","fx-rings.js","fx-spring.js","fx-tooltips.js","gallery.js","input-safety.js","install.js","popups.js","rtl.js?v=1","search.js","stepper.js","voice.js","xlsx-export.js","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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







