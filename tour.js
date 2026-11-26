/* ======================================================================
   MOFIT — first-run guided tour for new clients (driver.js, mft-*).

   After a client's first login (and after the existing welcome sheet is
   done), a short spotlight tour walks them through the real app chrome:
   training, nutrition, habits, progress, and the coach chat button.
   Egyptian Arabic, MOFIT-styled popovers, runs exactly once per client
   (localStorage), replayable any time with mofitTour.start(true).

   - driver.js (MIT) is lazy-loaded from jsDelivr with SRI only when the
     tour is actually about to run.
   - Coach, assistants, and the login screen never see it.
   - If the CDN fails, the app simply skips the tour — nothing breaks.
   ====================================================================== */
(function(){
  const DRV_JS="https://cdn.jsdelivr.net/npm/driver.js@1.3.6/dist/driver.js.iife.js";
  const DRV_JS_SRI="sha384-n0+N1F84TRb1beKh+tkD92wsVYiC9StnuPt7veT8Izt/qjUKUwNJEKy8Zhjb9tnk";
  const DRV_CSS="https://cdn.jsdelivr.net/npm/driver.js@1.3.6/dist/driver.css";
  const DRV_CSS_SRI="sha384-eyrYgcjChmzD338JTHFZssgJHOqqOZbajet8yZpCw8ESroLDi28BarMEKCImNGHC";
  const KEY=()=>"mofit_tour_v1_"+(S.me&&S.me.id||"");

  const css=`
  .driver-popover.mft-pop{direction:rtl;text-align:right;font-family:"Cairo",system-ui,sans-serif;
    background:linear-gradient(160deg,#111A30,#0B1220);color:#F1F5F9;border-radius:20px;
    border:1px solid rgba(255,255,255,.1);box-shadow:0 26px 60px -18px rgba(2,6,23,.8);max-width:320px;padding:18px 18px 14px}
  .driver-popover.mft-pop .driver-popover-title{font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-size:1.05rem;color:#fff;margin:0 0 6px}
  .driver-popover.mft-pop .driver-popover-description{font-size:.85rem;line-height:1.8;color:#B7C2D6;margin:0}
  .driver-popover.mft-pop .driver-popover-progress-text{font-size:.72rem;color:#64748B;font-weight:700}
  .driver-popover.mft-pop .driver-popover-footer{margin-top:14px}
  .driver-popover.mft-pop button{font-family:"Cairo",sans-serif;font-weight:800;font-size:.82rem;border-radius:12px;padding:8px 16px;border:0;cursor:pointer}
  .driver-popover.mft-pop .driver-popover-next-btn{background:linear-gradient(135deg,#F97316,#FFB347);color:#131832;
    box-shadow:0 8px 18px -8px rgba(249,115,22,.8)}
  .driver-popover.mft-pop .driver-popover-prev-btn{background:rgba(255,255,255,.07);color:#CBD5E1;border:1px solid rgba(255,255,255,.12)!important}
  .driver-popover.mft-pop .driver-popover-close-btn{color:#64748B;background:transparent;font-size:1rem;padding:4px 8px}
  .driver-popover.mft-pop .driver-popover-close-btn:hover{color:#F1F5F9}
  .driver-popover.mft-pop .driver-popover-arrow{border-color:#111A30}
  .driver-overlay path{transition:d .25s ease}
  @media(prefers-reduced-motion:reduce){.driver-popover.mft-pop,.driver-overlay path{transition:none!important}}`;
  const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

  let loading=null;
  function loadDriver(){
    if(window.driver&&window.driver.js) return Promise.resolve(true);
    if(loading) return loading;
    loading=new Promise((res,rej)=>{
      const l=document.createElement("link");
      l.rel="stylesheet"; l.href=DRV_CSS; l.integrity=DRV_CSS_SRI; l.crossOrigin="anonymous";
      document.head.appendChild(l);
      const s=document.createElement("script");
      s.src=DRV_JS; s.integrity=DRV_JS_SRI; s.crossOrigin="anonymous";
      s.onload=()=>res(true); s.onerror=()=>{ loading=null; rej(new Error("driver-cdn")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  const q=s=>document.querySelector(s);
  function steps(){
    const all=[
      { popover:{ title:"أهلاً بيك في MOFIT 👋", description:"جولة سريعة أقل من دقيقة توريك مكان كل حاجة في التطبيق — تقدر تطلع منها في أي وقت من ✕." } },
      { element:'#nav [data-tab="train"]', popover:{ title:"🏋️ التمرين", description:"برنامجك اليومي هنا: التمارين والمجموعات والعدات، وفيديو الأداء الصح لكل تمرين، وعدّاد راحة بين المجموعات. سجّل كل مجموعة بأوزانها." } },
      { element:'#nav [data-tab="food"]', popover:{ title:"🥗 التغذية", description:"سجّل أكلك يوم بيوم وشوف السعرات والبروتين، والنظام الغذائي بتاع الكوتش أول ما يجهز." } },
      { element:'#nav [data-tab="habits"]', popover:{ title:"✅ العادات", description:"مياه، نوم، خطوات — علّم عليهم كل يوم. الالتزام اليومي هو اللي بيبني النتيجة." } },
      { element:'#nav [data-tab="body"]', popover:{ title:"📈 التقدم", description:"وزنك وصورك وتشيك إن الأسبوع هنا — الكوتش بيتابعهم معاك ويعدّل خطتك على أساسهم." } },
      { element:'#top button[onclick*="contactCoach"]', popover:{ title:"💬 الكوتش", description:"أي سؤال أو وجع أو تعديل محتاجه — كلم الكوتش من هنا في أي وقت." } },
      { popover:{ title:"يلا بينا 💪", description:"كده انت جاهز. ابدأ من تبويب التمرين، وسجّل أول مجموعة — أول خطوة هي أهم خطوة." } },
    ];
    return all.filter(s=>!s.element||q(s.element));
  }

  let running=false;
  async function start(force){
    if(running) return;
    if(typeof S==="undefined"||!S.me||S.me.role!=="client") return;
    if(!force&&localStorage.getItem(KEY())) return;
    try{ await loadDriver(); }catch(e){ return; }
    const stps=steps(); if(stps.length<3) return;
    running=true;
    const d=window.driver.js.driver({
      showProgress:true, animate:true, overlayOpacity:.72, stagePadding:6, stageRadius:14, popoverOffset:14,
      allowClose:true, popoverClass:"mft-pop", smoothScroll:true,
      nextBtnText:"التالي", prevBtnText:"رجعني", doneBtnText:"يلا نبدأ 💪", progressText:"{{current}} / {{total}}",
      steps:stps,
      onDestroyed:()=>{ localStorage.setItem(KEY(),"1"); running=false; }
    });
    d.drive();
  }

  /* auto-start: only for clients, only once, and only when no sheet is on
     screen. The first-run welcome sheet (mofit_onb_) goes first; if it was
     dismissed without finishing (its key never set), a 15s grace from page
     load still lets the tour run afterwards. */
  const t0=Date.now();
  let tries=0;
  const iv=setInterval(()=>{
    if(++tries>240){ clearInterval(iv); return; }                 /* ~4 minutes max */
    try{
      if(typeof S==="undefined"||!S.me) return;
      if(S.me.role!=="client"){ clearInterval(iv); return; }
      if(localStorage.getItem(KEY())){ clearInterval(iv); return; }
      const sheet=document.getElementById("sheet");
      if(sheet&&!sheet.classList.contains("hidden")) return;       /* something open: wait */
      if(!localStorage.getItem("mofit_onb_"+S.me.id)&&Date.now()-t0<15000) return;  /* welcome sheet first */
      if(!document.querySelector('#appView:not(.hidden) #nav [data-tab]')) return;
      clearInterval(iv);
      setTimeout(()=>start(false),900);
    }catch(e){}
  },1000);

  window.mofitTour={ start, reset:()=>localStorage.removeItem(KEY()) };
})();
