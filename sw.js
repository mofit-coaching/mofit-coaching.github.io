/* ======================================================================
   Mofit service worker — Workbox 7 (MIT, vendored in wb/, no CDN needed).
   - App shell precached at install (revisioned by the cache tag V)
   - Navigations: NetworkFirst, falls back to the precached shell offline
   - Same-origin + CDN static assets: StaleWhileRevalidate
   - Supabase API calls are never cached (no route matches them)
   If Workbox fails to load, the worker stays a passthrough (no caching).
   ====================================================================== */
importScripts("wb/workbox-sw.js");
const V="c84d2e1f";
const SHELL0=["./","index.html","styles.css?v=c84d2e1f","design.css?v=c84d2e1f","fonts.css?v=c84d2e1f","fonts/Anton-400-latin.woff2","fonts/Changa-700-arabic.woff2","fonts/Changa-700-latin.woff2","fonts/Changa-800-arabic.woff2","fonts/Changa-800-latin.woff2","fonts/IBMPlexSansArabic-400-arabic.woff2","fonts/IBMPlexSansArabic-400-latin.woff2","fonts/IBMPlexSansArabic-600-arabic.woff2","fonts/IBMPlexSansArabic-600-latin.woff2","fonts/IBMPlexSansArabic-700-arabic.woff2","fonts/IBMPlexSansArabic-700-latin.woff2","fonts/Outfit-600-latin.woff2","fonts/Outfit-700-latin.woff2","fonts/Outfit-800-latin.woff2","icons-anim.css?v=c84d2e1f","coachshell.css?v=c84d2e1f","dark.css?v=c84d2e1f","coachshell.js?v=c84d2e1f","design.js?v=c84d2e1f","core.js?v=c84d2e1f","data.js?v=c84d2e1f","data-systems2.js?v=c84d2e1f","data-systems3.js?v=c84d2e1f","data-systems4.js?v=c84d2e1f","data-rehab2.js?v=c84d2e1f","media.js?v=c84d2e1f","pro.js?v=c84d2e1f","lab.js?v=c84d2e1f","anatomy.js?v=c84d2e1f","health.js?v=c84d2e1f","posing.js?v=c84d2e1f","pose-annotate.js?v=c84d2e1f","minerals.js?v=c84d2e1f","ghealth.js?v=c84d2e1f","stepsboard.js?v=c84d2e1f","push.js?v=c84d2e1f","confetti.js?v=c84d2e1f","celebrate.js?v=c84d2e1f","lottie.min.js?v=c84d2e1f","anims.js?v=c84d2e1f","chart.min.js?v=c84d2e1f","charts.js?v=c84d2e1f","exdb-data.js?v=c84d2e1f","exdb.js?v=c84d2e1f","dayjs.min.js","dayjs-relative.js","dayjs-ar.js","dates.js?v=c84d2e1f","plyrwrap.js","lottie-star.json","lottie-dumbbell.json","icons.js?v=c84d2e1f","supps.js?v=c84d2e1f","views.js?v=c84d2e1f","coach.js?v=c84d2e1f","signup.js?v=c84d2e1f","qrcode.js?v=c84d2e1f","invite.js?v=c84d2e1f","referral.js?v=c84d2e1f","transform.js?v=c84d2e1f","chat.js?v=c84d2e1f","aichat.js?v=c84d2e1f","ai.js?v=c84d2e1f","inbox.js?v=c84d2e1f","screens.js?v=c84d2e1f","showcase.js?v=c84d2e1f","flame.js?v=c84d2e1f","photos.js?v=c84d2e1f","firstweek.js?v=c84d2e1f","league.js?v=c84d2e1f","prices.js?v=c84d2e1f","training.js?v=c84d2e1f","sharecard.js?v=c84d2e1f","manifest.json","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","icon-maskable-512.png","404.html"];
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
