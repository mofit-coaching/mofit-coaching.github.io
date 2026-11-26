/* ======================================================================
   Mofit — Ramadan / Hijri mode (rm-*)
   - Hijri date + iftar/suhoor/taraweeh times computed ON-DEVICE for Egypt
     (adhan-js, Egyptian General Authority method; moment-hijri for dates).
     Nothing leaves the phone: no third-party calls, no client data.
   - Home card: Hijri date, countdown to iftar/suhoor, times row, tips.
   - Food view: meal timing around iftar & suhoor.
   - Train view: best workout windows (before iftar / after taraweeh) with
     optional in-app reminders (fire while the app is open).
   - Mode per device: auto (Ramadan + 14 days before) / on / off.
   Vendor libs lazy-load from ./vendor (self-hosted). License: MIT.
   ====================================================================== */
(function(){
/* resolve ./vendor relative to THIS script's URL so the app works from any path */
const SELF=(document.currentScript&&document.currentScript.src)||(document.querySelector('script[src*="ramadan.js"]')||{}).src||"ramadan.js";
const V=SELF.replace(/ramadan\.js(\?.*)?$/,"")+"vendor/";
const CSS=`
.rm-card{overflow:hidden}
.rm-top{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.rm-moon{width:40px;height:40px;border-radius:14px;background:linear-gradient(150deg,#0F172A,#1E293B);display:grid;place-items:center;flex:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
.rm-moon svg{width:24px;height:24px}
.rm-t{flex:1;min-width:0}
.rm-t b{display:block;font-size:14.5px;color:var(--navy)}
.rm-t span{font-size:11.5px;color:var(--slate)}
.rm-gear{flex:none;width:34px;height:34px;border-radius:12px;border:1.5px solid var(--soft);background:transparent;color:var(--slate);font-size:15px;cursor:pointer;display:grid;place-items:center}
.rm-count{display:flex;align-items:baseline;justify-content:center;gap:7px;padding:12px;border-radius:16px;background:linear-gradient(150deg,#0F172A,#16233C);color:#fff;margin-bottom:10px}
.rm-count .v{font:800 30px/1 var(--font-num,system-ui);letter-spacing:.02em;color:#FFB347;font-variant-numeric:tabular-nums}
.rm-count .l{font-size:12px;color:#C7D2E8;font-weight:700}
.rm-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.rm-cell{text-align:center;padding:9px 4px;border-radius:13px;background:var(--soft2);border:1px solid var(--soft)}
.rm-cell .k{font-size:11px;color:var(--slate);font-weight:700;display:block;margin-bottom:3px}
.rm-cell .t{font:800 14.5px/1 var(--font-num,system-ui);color:var(--navy);font-variant-numeric:tabular-nums}
.rm-tip{font-size:12px;line-height:1.8;color:var(--slate);background:linear-gradient(135deg,rgba(255,179,0,.08),rgba(255,179,0,.03));border:1px dashed rgba(255,179,0,.45);border-radius:12px;padding:8px 12px;margin:0}
.rm-tip b{color:#8A5A00}
.rm-loc{margin-top:8px;text-align:center}
.rm-loc button{background:none;border:none;color:var(--slate);font-size:11px;text-decoration:underline;cursor:pointer;padding:2px}
.rm-modes{display:flex;gap:6px;margin:10px 0 2px}
.rm-modes button{flex:1;padding:8px 4px;border-radius:11px;border:1.5px solid var(--soft);background:transparent;color:var(--slate);font-size:12px;font-weight:800;cursor:pointer}
.rm-modes button.on{border-color:#F97316;background:linear-gradient(135deg,#FFF3E8,#FFE4C7);color:#C2410C}
@media(prefers-color-scheme:dark){.rm-modes button.on{background:rgba(249,115,22,.16);color:#FFB35C}}
.rm-banner{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:15px;background:linear-gradient(150deg,#0F172A,#1E293B);color:#fff;margin-bottom:12px}
.rm-banner .ic{font-size:20px}
.rm-banner b{display:block;font-size:12.5px}
.rm-banner span{font-size:11.5px;color:#C7D2E8;font-variant-numeric:tabular-nums}
.rm-banner .go{flex:none;margin-inline-start:auto;border:1px solid rgba(255,179,92,.6);background:transparent;color:#FFB35C;border-radius:99px;padding:6px 12px;font-size:11.5px;font-weight:800;cursor:pointer}
.rm-slots{display:grid;gap:6px;margin-top:8px}
.rm-slot{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--navy);padding:7px 11px;border-radius:11px;background:var(--soft2);border:1px solid var(--soft)}
.rm-slot .t{margin-inline-start:auto;font:800 12.5px/1 var(--font-num,system-ui);color:var(--acc,#F97316);font-variant-numeric:tabular-nums}
.rm-rem{margin-top:8px;display:flex;gap:6px}
.rm-rem button{flex:1;padding:8px 6px;border-radius:11px;border:1.5px dashed rgba(249,115,22,.55);background:transparent;color:#C2410C;font-size:11.5px;font-weight:800;cursor:pointer}
.rm-rem button.done{border-style:solid;background:#E7F6EC;color:#15803D}
@media(prefers-color-scheme:dark){.rm-rem button{color:#FFB35C}.rm-rem button.done{background:rgba(21,128,61,.18);color:#7AD79A}}
`;
const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

const LSK="mofit_ramadan_v1";            // {mode:"auto"|"on"|"off", lat, lon, label}
const CAIRO={lat:30.0444,lon:31.2357,label:"القاهرة"};
let lib=null, libErr=false, timers=[];

const cfg=()=>{ try{ return {...{mode:"auto"},...(JSON.parse(localStorage.getItem(LSK))||{})}; }catch(e){ return {mode:"auto"}; } };
const save=c=>{ try{ localStorage.setItem(LSK,JSON.stringify(c)); }catch(e){} };

function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
async function ensureLib(){
  if(lib||libErr) return lib;
  try{
    if(!window.moment) await loadScript(V+"moment.min.js");
    if(!window.moment||!window.moment.fn.iYear) await loadScript(V+"moment-hijri.js");
    if(!window.adhan) await loadScript(V+"adhan.iife.min.js");
    lib={moment:window.moment,adhan:window.adhan};
  }catch(e){ libErr=true; lib=null; }
  return lib;
}

/* ---- dates & times ---- */
const hijriToday=()=>{ const m=lib.moment(); return {y:m.iYear(),mo:m.iMonth(),d:m.iDate(),txt:m.format("iD iMMMM iYYYY")+" هـ"}; };
function daysToRamadan(){ const m=lib.moment(); if(m.iMonth()===8) return 0;
  for(let i=1;i<=355;i++){ const x=lib.moment().add(i,"days"); if(x.iMonth()===8&&x.iDate()===1) return i; } return null; }
function times(date){
  const c=cfg(), loc=(c.lat&&c.lon)?c:CAIRO;
  const cr=new lib.adhan.Coordinates(loc.lat,loc.lon);
  const p=lib.adhan.CalculationMethod.Egyptian(); p.madhab=lib.adhan.Madhab.Shafi;
  const t=new lib.adhan.PrayerTimes(cr,date||new Date(),p);
  const sun=new lib.adhan.SunnahTimes(t);
  const min=(d,n)=>new Date(d.getTime()+n*60000);
  return { fajr:t.fajr, imsak:min(t.fajr,-10), sunrise:t.sunrise, maghrib:t.maghrib, isha:t.isha,
    taraweeh:min(t.isha,25), lastThird:sun.lastThirdOfTheNight, loc:loc.label||"مكانك" };
}
const fmtT=d=>{ try{ return d.toLocaleTimeString("ar-EG",{hour:"numeric",minute:"2-digit"}); }catch(e){ return ""; } };
const fmtDur=ms=>{ ms=Math.max(0,ms); const h=Math.floor(ms/3600000),m=Math.ceil(ms%3600000/60000);
  return h?`${h}:${String(m%60).padStart(2,"0")}`:`${m} د`; };

/* what matters right now: fasting until maghrib, then eating window until imsak */
function phaseNow(tm){
  const now=new Date();
  if(now<tm.imsak) return {k:"night",until:tm.imsak,label:"فاضل على الإمساك"};
  if(now<tm.fajr) return {k:"imsak",until:tm.fajr,label:"الإمساك — آخر السحور"};
  if(now<tm.maghrib) return {k:"fast",until:tm.maghrib,label:"فاضل على الفطار"};
  return {k:"iftar",until:times(addDaysDate(1)).imsak,label:"فاضل على السحور"};
}
function addDaysDate(n){ const d=new Date(); d.setDate(d.getDate()+n); return d; }

const moonSvg='<svg viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" fill="#FFB347"/><circle cx="17" cy="5" r="1.4" fill="#FFE680"/><circle cx="21" cy="9" r="1" fill="#FFE680"/></svg>';

/* ---- the home card ---- */
async function renderCard(host,p,rerender){
  if(!host) return;
  const L=await ensureLib();
  if(!L){ host.innerHTML=""; return; }
  const c=cfg(), hj=hijriToday(), dtr=daysToRamadan();
  const show = c.mode==="on" || (c.mode==="auto" && (hj.mo===8 || (dtr!==null&&dtr<=14)));
  if(!show){ host.innerHTML=""; return; }
  const tm=times(), ph=phaseNow(tm);
  const isR=hj.mo===8;
  const tipPool=[
    "اشرب 8-10 كوبايات مياه بين الفطار والسحور، مش مرة واحدة.",
    "ابدأ فطارك بتمر ومياه، وبعدين شوربة — المعدة هتشكرك.",
    "السحور وجبة مش رفاهية: بروتين + كارب معقّد (فول/شوفان) بيثبّت الطاقة.",
    "أحسن وقت للتمرين: قبل المغرب بساعة أو بعد التراويح بنصف ساعة.",
    "قلل الملح والمقليات في السحور عشان العطش في الصيام.",
    "لو نزلت لعب قبل الفطار، خلّي الشدة متوسطة والمجموعات أقل."];
  const tip=tipPool[(hj.d+hj.mo)%tipPool.length];
  host.innerHTML=`<div class="card rm-card">
    <div class="rm-top"><div class="rm-moon">${moonSvg}</div>
      <div class="rm-t"><b>${isR?"🌙 رمضان كريم":"🌙 التاريخ الهجري"}</b><span>${hj.txt}${!isR&&dtr!==null?` · فاضل ${dtr} يوم على رمضان`:""}</span></div>
      <button type="button" class="rm-gear" id="rmGear" aria-label="إعدادات رمضان">⚙</button></div>
    <div class="rm-count"><span class="l">${ph.label}</span><span class="v" id="rmV">${fmtDur(ph.until-new Date())}</span></div>
    <div class="rm-row">
      <div class="rm-cell"><span class="k">الإمساك</span><span class="t">${fmtT(tm.imsak)}</span></div>
      <div class="rm-cell"><span class="k">الفطار 🍽</span><span class="t">${fmtT(tm.maghrib)}</span></div>
      <div class="rm-cell"><span class="k">التراويح</span><span class="t">${fmtT(tm.taraweeh)}</span></div>
    </div>
    <p class="rm-tip">💧 <b>نصيحة اليوم:</b> ${tip}</p>
    <div class="rm-loc"><button type="button" id="rmLoc">📍 المواقيت على ${tm.loc} — اضغط عشان تستخدم مكانك</button></div>
    <div class="rm-modes" id="rmModes" hidden>
      ${[["auto","تلقائي"],["on","دايماً"],["off","مخفي"]].map(([k,l])=>`<button type="button" data-m="${k}" class="${c.mode===k?"on":""}">${l}</button>`).join("")}
    </div></div>`;
  const gear=host.querySelector("#rmGear"), modes=host.querySelector("#rmModes");
  gear.onclick=()=>{ modes.hidden=!modes.hidden; };
  modes.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{ save({...cfg(),mode:b.dataset.m}); rerender&&rerender(); });
  host.querySelector("#rmLoc").onclick=()=>{
    if(!navigator.geolocation) return window.toast&&toast("المكان مش مدعوم على الجهاز ده");
    navigator.geolocation.getCurrentPosition(pos=>{
      save({...cfg(),lat:+pos.coords.latitude.toFixed(4),lon:+pos.coords.longitude.toFixed(4),label:"مكانك"});
      window.toast&&toast("✓ المواقيت بقت على مكانك"); rerender&&rerender();
    },()=>window.toast&&toast("مقدرتش أحدد مكانك"),{timeout:8000});
  };
  /* live countdown */
  const v=host.querySelector("#rmV");
  const iv=setInterval(()=>{ if(!v.isConnected){ clearInterval(iv); return; }
    const t2=times(), p2=phaseNow(t2); v.textContent=fmtDur(p2.until-new Date());
    const lab=v.previousElementSibling; if(lab) lab.textContent=p2.label; },30000);
  timers.push(iv);
}

/* ---- food view: meal timing around iftar/suhoor ---- */
async function foodBanner(el,p){
  const L=await ensureLib(); if(!L) return;
  const c=cfg(), hj=hijriToday();
  if(c.mode==="off"||(c.mode==="auto"&&hj.mo!==8)) return;
  const tm=times();
  const meals=Math.max(1,Math.min(+(p&&p.meals_per_day)||3,8));
  const name=m=>{ try{ return mealName(p,m); }catch(e){ return "وجبة "+m; } };
  let slots=[`<div class="rm-slot">🍽 <b>${name(1)}</b> = الإفطار<span class="t">${fmtT(tm.maghrib)}</span></div>`];
  if(meals>2) slots.push(`<div class="rm-slot">🥪 ${name(2)} بعد التراويح<span class="t">${fmtT(new Date(tm.taraweeh.getTime()+30*60000))}</span></div>`);
  slots.push(`<div class="rm-slot">🌙 <b>${name(meals)}</b> = السحور<span class="t">قبل ${fmtT(tm.imsak)}</span></div>`);
  const b=document.createElement("div"); b.className="rm-banner";
  b.innerHTML=`<span class="ic">🌙</span><div style="flex:1"><b>توقيت وجباتك في رمضان</b><span>الفطار ${fmtT(tm.maghrib)} · السحور لحد ${fmtT(tm.imsak)}</span><div class="rm-slots">${slots.join("")}</div></div>`;
  el.prepend(b);
}

/* ---- train view: workout windows + in-app reminders ---- */
async function trainBanner(el){
  const L=await ensureLib(); if(!L) return;
  const c=cfg(), hj=hijriToday();
  if(c.mode==="off"||(c.mode==="auto"&&hj.mo!==8)) return;
  const tm=times();
  const w1=new Date(tm.maghrib.getTime()-60*60000), w2=new Date(tm.taraweeh.getTime()+30*60000);
  const b=document.createElement("div"); b.className="rm-banner";
  b.innerHTML=`<span class="ic">💪</span><div style="flex:1"><b>التمرين في رمضان</b><span>أحسن وقت النهارده: ${fmtT(w1)} (قبل الفطار) أو ${fmtT(w2)} (بعد التراويح)</span>
    <div class="rm-rem"><button type="button" data-rm-rem="${+w1}">🔔 ذكّرني ${fmtT(w1)}</button><button type="button" data-rm-rem="${+w2}">🔔 ذكّرني ${fmtT(w2)}</button></div></div>`;
  el.prepend(b);
  b.querySelectorAll("[data-rm-rem]").forEach(btn=>btn.onclick=async()=>{
    const at=+btn.dataset.rmRem, delay=at-Date.now();
    if(delay<0) return window.toast&&toast("الوقت ده فات النهارده");
    if("Notification" in window&&Notification.permission==="default"){ try{ await Notification.requestPermission(); }catch(e){} }
    setTimeout(()=>{
      const msg="💪 وقت التمرين — يلا قبل ما الكسل يمسكك";
      window.toast&&toast(msg);
      try{ if("Notification" in window&&Notification.permission==="granted") navigator.serviceWorker?.ready.then(r=>r.showNotification("Mofit",{body:msg,icon:"icon-192.png",dir:"rtl",lang:"ar"})); }catch(e){}
    },Math.min(delay,2147000000));
    btn.classList.add("done"); btn.textContent="✓ هفتكرك (والتطبيق مفتوح)";
  });
}

/* ---- fasting-day pings while the app is open ---- */
let pinged={};
function startPings(){
  setInterval(async()=>{
    if(!lib) return;
    const c=cfg(), hj=hijriToday();
    if(c.mode==="off"||(c.mode==="auto"&&hj.mo!==8)) return;
    const tm=times(), now=Date.now(), day=today();
    const marks=[["iftar",+tm.maghrib,"🍽 أذن المغرب — فطار مقبول يا بطل 🌙"],["suhoor",+tm.imsak,"🌙 الإمساك — اقفل السحور وتوضّى"]];
    for(const [k,at,msg] of marks){
      const key=day+k;
      if(!pinged[key]&&Math.abs(now-at)<45000){ pinged[key]=true;
        window.toast&&toast(msg);
        try{ if("Notification" in window&&Notification.permission==="granted") navigator.serviceWorker?.ready.then(r=>r.showNotification("Mofit",{body:msg,icon:"icon-192.png",dir:"rtl",lang:"ar"})); }catch(e){}
      }
    }
  },30000);
}

/* ---- wiring: wrap the views (same pattern as push.js) ---- */
if(typeof viewHome==="function"&&!viewHome._rm){
  const _vh=viewHome;
  viewHome=async function(el){
    await _vh(el);
    let host=document.getElementById("rmHome");
    if(!host){ host=document.createElement("div"); host.id="rmHome";
      const anchor=document.getElementById("hToday");
      if(anchor&&anchor.parentNode) anchor.before(host); else el.prepend(host); }
    renderCard(host,S.client,()=>{ try{ render(); }catch(e){} });
  };
  viewHome._rm=1;
}
if(typeof viewFood==="function"&&!viewFood._rm){
  const _vf=viewFood;
  viewFood=async function(el){ const r=await _vf(el); if(S.me&&S.me.role!=="coach") foodBanner(el,S.client); return r; };
  viewFood._rm=1;
}
if(typeof viewTrain==="function"&&!viewTrain._rm){
  const _vt=viewTrain;
  viewTrain=async function(el){ const r=await _vt(el); if(S.me&&S.me.role!=="coach") trainBanner(el); return r; };
  viewTrain._rm=1;
}

/* boot: warm the libs + start fasting pings (cheap, on-device) */
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
function boot(){ setTimeout(async()=>{ if(await ensureLib()) startPings(); },2500); }

/* test/demo API */
window.ramadanCard=renderCard; window.ramadanTimes=async()=>{ await ensureLib(); return times(); }; window.ramadanCfg=cfg;
})();
