/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="f30c1a7e";
const SHELL0=["./","index.html","styles.css?v=f30c1a7e","design.css?v=f30c1a7e","fonts.css?v=f30c1a7e","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=f30c1a7e","coachshell.css?v=f30c1a7e","dark.css?v=f30c1a7e","coachshell.js?v=f30c1a7e","design.js?v=f30c1a7e","core.js?v=f30c1a7e","data.js?v=f30c1a7e","data-systems2.js?v=f30c1a7e","data-systems3.js?v=f30c1a7e","data-systems4.js?v=f30c1a7e","data-rehab2.js?v=f30c1a7e","media.js?v=f30c1a7e","pro.js?v=f30c1a7e","lab.js?v=f30c1a7e","anatomy.js?v=f30c1a7e","health.js?v=f30c1a7e","posing.js?v=f30c1a7e","pose-annotate.js?v=f30c1a7e","minerals.js?v=f30c1a7e","ghealth.js?v=f30c1a7e","stepsboard.js?v=f30c1a7e","push.js?v=f30c1a7e","confetti.js?v=f30c1a7e","celebrate.js?v=f30c1a7e","lottie.min.js?v=f30c1a7e","anims.js?v=f30c1a7e","chart.min.js?v=f30c1a7e","charts.js?v=f30c1a7e","exdb-data.js?v=f30c1a7e","exdb.js?v=f30c1a7e","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","dates.js?v=f30c1a7e","lottie-star.json","lottie-dumbbell.json","icons.js?v=f30c1a7e","supps.js?v=f30c1a7e","views.js?v=f30c1a7e","coach.js?v=f30c1a7e","signup.js?v=f30c1a7e","qrcode.js?v=f30c1a7e","invite.js?v=f30c1a7e","referral.js?v=f30c1a7e","transform.js?v=f30c1a7e","chat.js?v=f30c1a7e","aichat.js?v=f30c1a7e","ai.js?v=f30c1a7e","inbox.js?v=f30c1a7e","screens.js?v=f30c1a7e","showcase.js?v=f30c1a7e","flame.js?v=f30c1a7e","photos.js?v=f30c1a7e","firstweek.js?v=f30c1a7e","league.js?v=f30c1a7e","prices.js?v=f30c1a7e","training.js?v=f30c1a7e","sharecard.js?v=f30c1a7e","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
const SHELL=SHELL0;
if(self.workbox){
  const wb=self.workbox;
  wb.setConfig({modulePathPrefix:"wb/"});
  wb.precaching.precacheAndRoute(SHELL.map(u=>({url:u,revision:V})));
  wb.precaching.cleanupOutdatedCaches();
  wb.routing.registerRoute(({request})=>request.mode==="navigate",
    new wb.strategies.NetworkFirst({cacheName:"mofit-pages-"+V,networkTimeoutSeconds:8}));
  wb.routing.registerRoute(({url})=>url.origin===location.origin&&url.pathname.indexOf("/vendor/pose/")===0,
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


