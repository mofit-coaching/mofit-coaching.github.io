/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="d9a2e61b";
const SHELL0=["./","rolling.js","sounds.js","crop.js","ba-slider.js","instant.js","index.html","styles.css?v=d9a2e61b","design.css?v=d9a2e61b","fonts.css?v=d9a2e61b","mofit-tokens.css?v=d9a2e61b","mofit-look.css?v=d9a2e61b","mofit-home.css?v=d9a2e61b","mofit-breathe.css?v=d9a2e61b","mofit-warn.css?v=d9a2e61b","mofit-contrast.css?v=d9a2e61b","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=d9a2e61b","coachshell.css?v=d9a2e61b","dark.css?v=d9a2e61b","coachshell.js?v=d9a2e61b","design.js?v=d9a2e61b","motion.js?v=d9a2e61b","core.js?v=d9a2e61b","data.js?v=d9a2e61b","data-systems2.js?v=d9a2e61b","data-systems3.js?v=d9a2e61b","data-systems4.js?v=d9a2e61b","data-rehab2.js?v=d9a2e61b","media.js?v=d9a2e61b","pro.js?v=d9a2e61b","lab.js?v=d9a2e61b","anatomy.js?v=d9a2e61b","health.js?v=d9a2e61b","posing.js?v=d9a2e61b","pose-annotate.js?v=d9a2e61b","minerals.js?v=d9a2e61b","ghealth.js?v=d9a2e61b","stepsboard.js?v=d9a2e61b","push.js?v=d9a2e61b","confetti.js?v=d9a2e61b","celebrate.js?v=d9a2e61b","lottie.min.js?v=d9a2e61b","anims.js?v=d9a2e61b","chart.min.js?v=d9a2e61b","charts.js?v=d9a2e61b","exdb-data.js?v=d9a2e61b","exdb.js?v=d9a2e61b","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","swiper.js","vendor/swiper-bundle.min.js","vendor/swiper-bundle.min.css","barcode.js","vendor/zxing.min.js","dates.js?v=d9a2e61b","vcall.js","ctable.js","ccalendar.js","tour.js","plyrwrap.js","exdrag.js","lottie-star.json","lottie-dumbbell.json","icons.js?v=d9a2e61b","supps.js?v=d9a2e61b","views.js?v=d9a2e61b","coach.js?v=d9a2e61b","signup.js?v=d9a2e61b","qrcode.js?v=d9a2e61b","invite.js?v=d9a2e61b","referral.js?v=d9a2e61b","transform.js?v=d9a2e61b","chat.js?v=d9a2e61b","aichat.js?v=d9a2e61b","ai.js?v=d9a2e61b","inbox.js?v=d9a2e61b","subs.js?v=d9a2e61b","screens.js?v=d9a2e61b","showcase.js?v=d9a2e61b","flame.js?v=d9a2e61b","photos.js?v=d9a2e61b","firstweek.js?v=d9a2e61b","league.js?v=d9a2e61b","prices.js?v=d9a2e61b","training.js?v=d9a2e61b","sharecard.js?v=d9a2e61b","annotate.js","diet-pdf.js","fx-avatars.js","fx-rings.js","fx-spring.js","fx-tooltips.js","gallery.js","input-safety.js","install.js","popups.js","rtl.js?v=1","search.js","stepper.js","voice.js","xlsx-export.js","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
    e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf("mofit-")===0&&k.indexOf("mofit-pose")!==0&&k.indexOf(V)===-1).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:"window"})).then(cs=>cs.forEach(c=>c.postMessage({type:"mofit-sw-activated",V:V+"-act"}))));
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






