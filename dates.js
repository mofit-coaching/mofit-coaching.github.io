/* dates.js — Day.js (MIT, vendored) Arabic date helpers for MOFIT.
   Loaded after dayjs.min.js, dayjs-relative.js, dayjs-ar.js.
   dRel(t): Egyptian-flavored relative time ("من ٥ دقايق", "امبارح", weekday/date for older).
   dDay(t): "الجمعة ٢١ نوفمبر".  dTime(t): "٠٩:٣٠ م". */
(function(){
  if(!window.dayjs) return;
  dayjs.extend(dayjs_plugin_relativeTime);
  dayjs.locale("ar");
  function D(t){ try{ return dayjs(t); }catch(_){ return null; } }
  window.dTime=function(t){ const d=D(t); if(!d||!d.isValid()) return ""; return d.format("hh:mm A"); };
  window.dDay=function(t){ const d=D(t); if(!d||!d.isValid()) return ""; return d.format("dddd D MMMM"); };
  window.dRel=function(t){
    const d=D(t); if(!d||!d.isValid()) return "";
    const now=dayjs();
    if(d.isSame(now,"day")) return d.format("hh:mm A");
    if(d.isSame(now.subtract(1,"day"),"day")) return "امبارح";
    if(now.diff(d,"day")<7) return d.fromNow();
    if(d.isSame(now,"year")) return d.format("D MMMM");
    return d.format("D MMMM YYYY");
  };
})();
