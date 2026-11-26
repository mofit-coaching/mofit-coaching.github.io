/* MOFIT Arabic install popup (pwa-install web component by khmyznikov, MIT, pinned v0.7.0 from jsDelivr with SRI hash).
   Shows once after ~20s for people who opened the app in the browser (not installed yet), then stays quiet for 7 days.
   iPhone: shows the Arabic "Share -> Add to Home Screen" steps. Android/Chrome: native install button. Loaded lazily, no tracking. */
(function(){
  if(window.__mofitPwa) return; window.__mofitPwa=1;
  const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  const KEY="mofit_pwa_snooze", test=/pwaTest/.test(location.search);
  try{ if(!test&&(standalone()||localStorage.getItem("mofit_noinst")||+localStorage.getItem(KEY)>Date.now())) return; }catch(e){}
  function show(){
    const lang=Object.getOwnPropertyDescriptor(Navigator.prototype,"language");
    try{ Object.defineProperty(navigator,"language",{get:()=>"ar",configurable:true}); }catch(e){}
    const s=document.createElement("script"); s.charset="utf-8"; s.src="https://cdn.jsdelivr.net/npm/@khmyznikov/pwa-install@0.7.0/dist/pwa-install.bundle.js"; s.integrity="sha384-tvuS5qQPVL6Nyw9WED3Dsy33F1Ie4lk8PxPhrW8XA+rlwFn45/PlAPgbCP7a0eVC"; s.crossOrigin="anonymous";
    s.onload=()=>{
      const el=document.createElement("pwa-install");
      el.setAttribute("name","MOFIT"); el.setAttribute("icon","icon-192.png"); el.setAttribute("manifest-url","manifest.json");
      el.setAttribute("description","تمرينك وأكلك وتقدّمك في مكان واحد، بيفتح زي أي تطبيق ويشتغل حتى من غير نت.");
      el.setAttribute("install-description","ثبّت MOFIT على شاشتك الرئيسية");
      el.setAttribute("manual-apple",""); el.setAttribute("manual-chrome","");
      try{ if(typeof _bip!=="undefined"&&_bip) el.externalPromptEvent=_bip; }catch(e){}
      document.body.appendChild(el);
      setTimeout(()=>{ try{ el.showDialog(true); localStorage.setItem(KEY,String(Date.now()+7*864e5)); }catch(e){} try{ delete navigator.language; }catch(e){} },300);
    };
    document.head.appendChild(s);
  }
  setTimeout(show,test?800:20000);
})();
