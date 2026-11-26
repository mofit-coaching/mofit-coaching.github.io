/* ======================================================================
   MOFIT — Plyr player for exercise / correct-form videos (mp-*).

   Replaces the plain YouTube iframe inside the exercise video sheet with
   a branded Plyr player: big play button, MOFIT orange progress bar,
   playback speeds 0.25x–2x (slow-mo for form checks), fullscreen, and
   Arabic tooltips.

   - Plyr (MIT) is lazy-loaded from jsDelivr with SRI the first time a
     video is opened; the rest of the app pays nothing.
   - If the CDN or the YouTube API fails, the sheet falls back to the
     exact original iframe embed — the video always opens.
   - Non-YouTube links keep the old behaviour (external open button).
   ====================================================================== */
(function(){
  const PLYR_JS="https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.min.js";
  const PLYR_JS_SRI="sha384-1r2GCX3Eml88xgbJb7kOe51vEASmv6hbqDRcK55GxMiwWy/5xX1xFlC6z7saa8Ct";
  const PLYR_CSS="https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.css";
  const PLYR_CSS_SRI="sha384-FDFJN4eDoTbFzL8KHLAOmtAicPaFc44D0JrdAwgO91ZDgGmAHrcpMWLCwTxBSVI7";

  const css=`
  .mp-wrap{--plyr-color-main:#F97316;--plyr-color-main-hover:#EA580C;--plyr-font-family:"Cairo",system-ui,sans-serif;
    --plyr-border-radius:16px;--plyr-video-background:#000;--plyr-control-icon-size:18px;
    --plyr-range-thumb-height:14px;--plyr-range-track-height:6px}
  .mp-wrap .plyr{border-radius:16px;overflow:hidden;box-shadow:0 16px 36px -16px rgba(15,23,42,.55)}
  .mp-wrap .plyr__control--overlaid{background:linear-gradient(135deg,#F97316,#FFB347);box-shadow:0 10px 26px -8px rgba(249,115,22,.8)}
  .mp-wrap .plyr__menu{background:#0F172A;color:#F1F5F9;border-radius:14px}
  .mp-wrap .plyr__menu [role=menuitemradio]:hover{background:rgba(249,115,22,.25)}
  .mp-wrap .plyr--youtube .plyr__poster{filter:saturate(1.05)}
  .mp-meta{display:flex;align-items:center;gap:8px;margin:10px 2px 0;font-size:.78rem;font-weight:700;color:var(--slate,#64748B)}
  .mp-meta b{color:var(--acc,#F97316)}
  .mp-skel{aspect-ratio:16/9;border-radius:16px;background:linear-gradient(110deg,#0F172A 30%,#1E293B 45%,#0F172A 60%);
    background-size:200% 100%;animation:mpSh 1.2s linear infinite;display:grid;place-items:center}
  .mp-skel .ring{width:44px;height:44px;animation:mpSpin .9s linear infinite}
  @keyframes mpSh{to{background-position:-200% 0}}
  @keyframes mpSpin{to{transform:rotate(360deg)}}
  @media(prefers-reduced-motion:reduce){.mp-skel,.mp-skel .ring{animation:none}}`;
  const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

  let loading=null, player=null;
  function loadPlyr(){
    if(window.Plyr) return Promise.resolve(true);
    if(loading) return loading;
    loading=new Promise((res,rej)=>{
      const l=document.createElement("link");
      l.rel="stylesheet"; l.href=PLYR_CSS; l.integrity=PLYR_CSS_SRI; l.crossOrigin="anonymous";
      document.head.appendChild(l);
      const s=document.createElement("script");
      s.src=PLYR_JS; s.integrity=PLYR_JS_SRI; s.crossOrigin="anonymous";
      s.onload=()=>res(true); s.onerror=()=>{ loading=null; rej(new Error("plyr-cdn")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function destroy(){
    try{ player&&player.destroy(); }catch(_){}
    player=null;
  }
  /* wipe the player whenever the sheet closes, however it closes */
  const _close=window.closeSheet;
  window.closeSheet=function(){ destroy(); return _close.apply(this,arguments); };

  const I18N={play:"تشغيل",pause:"إيقاف",restart:"من الأول",rewind:"رجوع {seektime} ثانية",fastForward:"تقديم {seektime} ثانية",
    seek:"تقديم",seekLabel:"{currentTime} من {duration}",played:"اتشاف",buffered:"اتحمّل",currentTime:"الوقت الحالي",
    duration:"المدة",volume:"الصوت",mute:"كتم",unmute:"تشغيل الصوت",enterFullscreen:"ملء الشاشة",exitFullscreen:"خروج من ملء الشاشة",
    frameTitle:"مشغل فيديو {title}",captions:"الترجمة",settings:"الإعدادات",menuVideo:"الفيديو",menuAudio:"الصوت",
    speed:"السرعة",normal:"عادية",quality:"الجودة",loop:"تكرار",start:"البداية",end:"النهاية",all:"الكل",reset:"إعادة",
    disabled:"مقفول",enabled:"شغال",download:"تحميل"};

  const _origOpenVideo=window.openVideo;
  window.openVideo=function(ex){
    const url=(typeof videoFor==="function")?videoFor(ex):(ex&&ex.video_url);
    if(!url){ toast("مفيش فيديو للتمرين ده لسه"); return; }
    const id=(typeof ytId==="function")?ytId(url):null;
    if(!id){ _origOpenVideo(ex); return; }           /* not YouTube: keep old sheet */
    loadPlyr().then(()=>openPlyr(ex,url,id)).catch(()=>_origOpenVideo(ex));  /* CDN down → old embed */
  };

  function openPlyr(ex,url,id){
    destroy();
    const body=openSheet(`<div class="between" style="margin-bottom:10px"><b>${esc(ex.name)}</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
      <div class="mp-wrap" dir="ltr">
        <div class="mp-skel"><span class="ring"><svg viewBox="0 0 64 64" width="44" height="44" fill="none"><rect x="6" y="22" width="8" height="20" rx="2" fill="#FF6B1A"/><rect x="14" y="16" width="8" height="32" rx="2" fill="#FF6B1A"/><rect x="22" y="29" width="20" height="6" rx="2" fill="#fff"/><rect x="42" y="16" width="8" height="32" rx="2" fill="#FF6B1A"/><rect x="50" y="22" width="8" height="20" rx="2" fill="#FF6B1A"/></svg></span></div>
        <div class="mp-host" data-plyr-provider="youtube" data-plyr-embed-id="${esc(id)}" hidden></div>
      </div>
      <div class="mp-meta" dir="rtl"><b>🎬</b><span>اسحب على التايم لاين، وبطّئ الفيديو لحد 0.25x من ⚙ عشان تراجع الأداء</span></div>
      <a class="btn block" style="display:block;text-align:center;margin-top:10px;text-decoration:none" href="${esc(url)}" target="_blank" rel="noopener">فتح في YouTube ↗</a>
      ${ex.notes?`<p class="hint">📝 ${esc(ex.notes)}</p>`:""}`);
    const host=body.querySelector(".mp-host");
    try{
      player=new Plyr(host,{
        controls:["play-large","play","progress","current-time","duration","mute","volume","settings","fullscreen"],
        settings:["speed","loop"],
        speed:{selected:1,options:[.25,.5,.75,1,1.25,1.5,1.75,2]},
        i18n:I18N, invertTime:false, ratio:"16:9", playsinline:true,
        keyboard:{focused:true,global:false},
        youtube:{rel:0,showinfo:0,iv_load_policy:3,modestbranding:1,playsinline:1,origin:location.origin}
      });
      player.on("ready",()=>{ const sk=body.querySelector(".mp-skel"); sk&&sk.remove(); host.hidden=false; });
      player.on("error",()=>{ destroy(); _origOpenVideo(ex); });
      setTimeout(()=>{ const sk=body.querySelector(".mp-skel"); if(sk){ sk.remove(); host.hidden=false; } },6000); /* never trap on the loader */
    }catch(e){ _origOpenVideo(ex); }
  }
})();
