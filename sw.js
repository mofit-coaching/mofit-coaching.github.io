/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="twin-20261127";
const SHELL0=["./","rolling.js","sounds.js","crop.js","ba-slider.js","instant.js","index.html","styles.css?v=gym20261127","design.css?v=gym20261127","fonts.css?v=gym20261127","mofit-tokens.css?v=gym20261127","mofit-look.css?v=gym20261127","mofit-home.css?v=gym20261127","mofit-breathe.css?v=gym20261127","mofit-warn.css?v=gym20261127","mofit-contrast.css?v=gym20261127","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=gym20261127","coachshell.css?v=gym20261127","dark.css?v=gym20261127","coachshell.js?v=gym20261127","design.js?v=gym20261127","motion.js?v=gym20261127","core.js?v=gym20261127","data.js?v=gym20261127","data-systems2.js?v=gym20261127","data-systems3.js?v=gym20261127","data-systems4.js?v=gym20261127","data-rehab2.js?v=gym20261127","media.js?v=gym20261127","pro.js?v=gym20261127","lab.js?v=gym20261127","anatomy.js?v=gym20261127","health.js?v=gym20261127","posing.js?v=gym20261127","pose-annotate.js?v=gym20261127","formlab.js?v=formlab-20261127-2","minerals.js?v=gym20261127","ghealth.js?v=gym20261127","stepsboard.js?v=gym20261127","push.js?v=gym20261127","confetti.js?v=gym20261127","celebrate.js?v=gym20261127","lottie.min.js?v=gym20261127","anims.js?v=gym20261127","chart.min.js?v=gym20261127","charts.js?v=gym20261127","exdb-data.js?v=gym20261127","exdb.js?v=gym20261127","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","swiper.js","vendor/swiper-bundle.min.js","vendor/swiper-bundle.min.css","barcode.js","vendor/zxing.min.js","dates.js?v=gym20261127","vcall.js","ctable.js","ccalendar.js","tour.js","plyrwrap.js","exdrag.js","lottie-star.json","lottie-dumbbell.json","icons.js?v=gym20261127","supps.js?v=gym20261127","views.js?v=gym20261127","coach.js?v=gym20261127","coachbrain.js?v=brain-20261127","twin.js?v=twin-20261127","signup.js?v=gym20261127","qrcode.js?v=gym20261127","invite.js?v=gym20261127","referral.js?v=gym20261127","transform.js?v=gym20261127","chat.js?v=gym20261127","aichat.js?v=gym20261127","ai.js?v=gym20261127","inbox.js?v=gym20261127","subs.js?v=gym20261127","screens.js?v=gym20261127","showcase.js?v=gym20261127","flame.js?v=gym20261127","photos.js?v=gym20261127","firstweek.js?v=gym20261127","league.js?v=gym20261127","prices.js?v=gym20261127","training.js?v=gym20261127","sharecard.js?v=gym20261127","annotate.js","diet-pdf.js","fx-avatars.js","fx-rings.js","fx-spring.js","fx-tooltips.js","gallery.js","input-safety.js","install.js","popups.js","rtl.js?v=1","search.js","stepper.js","voice.js","xlsx-export.js","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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

