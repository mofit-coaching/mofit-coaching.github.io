/* ======================================================================
   FIRST WEEK (fw-*): the newbie's first 7 days on Home.
   Two cards for a brand-new client, in The Flame's visual language
   (navy #0B1220, molten orange #FF5A0A, gold #FFC21A/#FFE680):

   1) QUEST CARD "مهمتك في أول أسبوع" - a guided days 1-7 checklist
      (first workout, first meal, first weight, habits, coach chat,
      install, first check-in) so nobody lands on a bare dashboard.
      Items auto-detect from the client's own logs; install can be
      marked manually. A 7-dot day strip shows which days had any
      activity.

   2) HARVEST CARD "تقدمك لحد دلوقتي" - works from day 1: workouts
      logged, meal days, and a daily activity streak, each a golden
      Anton number. On day 7 (or when every quest item is done) the
      card fires a one-time "first week done" celebration (god-rays,
      burst, full gold) and then retires; the celebration is remembered
      per client in localStorage so it plays exactly once.

   Scoped CSS injected here (fw-* only). styles.css / design.css untouched.
   Motion disabled under prefers-reduced-motion. No new globals besides
   window.firstWeekHTML / window.firstWeekAfter.
   firstWeekHTML(p, pre, opts) - pre={W,M,H,B,C,MSG} skips the queries;
   opts={today,forceDay,celebrate} drives the static capture harness.
   firstWeekAfter(el,p) - wires the quest row navigation + install tap.
   ====================================================================== */
(function(){
const st=document.createElement("style"); st.textContent=`
.fw-card{position:relative;overflow:hidden;border-radius:26px;margin-bottom:14px;color:#fff;
  background:
    radial-gradient(420px 260px at 92% -70px,rgba(255,107,26,.26),transparent 62%),
    radial-gradient(360px 300px at 0% 100%,rgba(255,179,0,.07),transparent 65%),
    linear-gradient(178deg,#0B1220 0%,#0F172A 55%,#0B1220 100%);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 22px 44px -20px rgba(11,18,32,.55),inset 0 1px 0 rgba(255,255,255,.06);
  padding:18px 16px 16px}
.fw-card::before{content:"";position:absolute;top:0;inset-inline:22px;height:2px;border-radius:0 0 4px 4px;
  background:linear-gradient(90deg,transparent,rgba(255,179,71,.8),transparent);pointer-events:none}
.fw-h{display:flex;align-items:center;gap:12px}
.fw-ic{width:44px;height:44px;flex:none;border-radius:14px;display:grid;place-items:center;font-size:1.3rem;
  background:linear-gradient(135deg,#FF5A0A,#FFB347);
  box-shadow:0 10px 22px -8px rgba(255,90,10,.8),inset 0 1px 0 rgba(255,255,255,.35)}
.fw-ht{flex:1;min-width:0}
.fw-ht h3{margin:0;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:800;font-size:1.02rem;color:#fff}
.fw-ht small{display:block;font-family:"Cairo",sans-serif;font-size:.76rem;color:#94A3B8;margin-top:2px}
.fw-ring{position:relative;flex:none;width:58px;height:58px}
.fw-ring svg{display:block}
.fw-ring b{position:absolute;inset:0;display:grid;place-items:center;font-family:"Anton","Noto Kufi Arabic",sans-serif;
  font-size:.95rem;direction:ltr;
  background:linear-gradient(180deg,#FFE680,#FFB300 72%);-webkit-background-clip:text;background-clip:text;color:transparent}
/* 7-day strip */
.fw-days{display:flex;gap:6px;margin:14px 2px 4px;direction:rtl}
.fw-day{flex:1;text-align:center}
.fw-day i{display:grid;place-items:center;width:100%;aspect-ratio:1;max-width:34px;margin:0 auto;border-radius:50%;
  font-style:normal;font-family:"Anton",sans-serif;font-size:.82rem;direction:ltr;color:#64748B;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);transition:.3s}
.fw-day small{display:block;font-size:.6rem;color:#64748B;margin-top:3px}
.fw-day.on i{color:#0B1220;font-weight:800;background:linear-gradient(135deg,#FF8A3D,#FFC21A);
  border-color:transparent;box-shadow:0 0 14px rgba(255,179,0,.5)}
.fw-day.now i{border-color:rgba(255,194,26,.7);color:#FFE680;animation:fwPulse 2s ease-in-out infinite}
.fw-day.on.now i{color:#0B1220}
@keyframes fwPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,194,26,.35)}50%{box-shadow:0 0 0 6px rgba(255,194,26,0)}}
/* quest list */
.fw-list{margin-top:10px;display:grid;gap:7px}
.fw-t{display:flex;align-items:center;gap:11px;width:100%;text-align:start;cursor:pointer;
  padding:10px 11px;border-radius:16px;border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04);color:#E2E8F0;font-family:"Cairo",sans-serif;transition:.18s}
.fw-t:active{transform:scale(.98)}
.fw-t .fw-c{width:26px;height:26px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:.8rem;
  border:1.5px solid rgba(255,255,255,.22);color:transparent;transition:.25s}
.fw-t .fw-e{font-size:1.05rem;flex:none}
.fw-t .fw-x{flex:1;min-width:0}
.fw-t .fw-x b{display:block;font-size:.85rem;font-weight:700;color:#F1F5F9}
.fw-t .fw-x small{display:block;font-size:.7rem;color:#8CA0BC;margin-top:1px}
.fw-t .fw-go{flex:none;color:#64748B;font-size:1rem;transform:scaleX(-1)}
.fw-t.done{background:rgba(255,179,0,.07);border-color:rgba(255,194,26,.28)}
.fw-t.done .fw-c{background:linear-gradient(135deg,#FFC21A,#FFE680);border-color:transparent;color:#0B1220;
  box-shadow:0 0 10px rgba(255,194,26,.55)}
.fw-t.done .fw-x b{color:#FFE680}
.fw-t.done .fw-go{color:rgba(255,194,26,.5)}
/* harvest tiles */
.fw-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:14px}
.fw-tile{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:18px;
  padding:12px 6px 10px;text-align:center}
.fw-tile .n{display:block;font-family:"Anton","Noto Kufi Arabic",sans-serif;font-size:1.9rem;line-height:1.1;direction:ltr;
  background:linear-gradient(180deg,#FFE680,#FFB300 72%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 8px rgba(255,179,0,.4))}
.fw-tile .l{display:block;font-size:.7rem;font-weight:700;color:#CBD5E1;margin-top:3px}
.fw-tile .e{font-size:1rem;display:block;margin-bottom:2px}
.fw-note{margin:12px 2px 0;font-size:.76rem;color:#94A3B8;font-family:"Cairo",sans-serif}
.fw-note em{font-style:normal;color:#FFE680;font-weight:700}
/* celebration */
.fw-card.win{border-color:rgba(255,194,26,.45);
  background:
    radial-gradient(460px 320px at 50% -80px,rgba(255,179,0,.28),transparent 65%),
    radial-gradient(420px 260px at 92% -70px,rgba(255,107,26,.22),transparent 62%),
    linear-gradient(178deg,#14102A 0%,#1A1408 55%,#0B1220 100%)}
.fw-rays{position:absolute;left:50%;top:-40px;width:520px;height:520px;transform:translate(-50%,-30%);border-radius:50%;
  background:repeating-conic-gradient(from -8deg,rgba(255,194,26,.12) 0deg 5deg,transparent 5deg 24deg);
  -webkit-mask-image:radial-gradient(circle,#000 0%,transparent 62%);mask-image:radial-gradient(circle,#000 0%,transparent 62%);
  animation:fwSpin 44s linear infinite,fwFadeIn 1.1s ease-out both;pointer-events:none}
.fw-burst{position:absolute;left:50%;top:70px;width:240px;height:240px;border-radius:50%;pointer-events:none;
  border:2px solid rgba(255,224,130,.85);transform:translate(-50%,-50%);animation:fwBurst 1.15s cubic-bezier(.16,.8,.3,1) .1s both}
.fw-burst.b2{animation-delay:.38s;border-color:rgba(255,179,71,.6)}
.fw-win{text-align:center;position:relative;padding:8px 4px 2px}
.fw-win .fw-trophy{font-size:3rem;display:inline-block;animation:fwPop .6s cubic-bezier(.2,1.6,.4,1) .3s both;
  filter:drop-shadow(0 0 18px rgba(255,194,26,.8))}
.fw-win h3{margin:8px 0 0;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:800;font-size:1.25rem;
  background:linear-gradient(100deg,#FFB300,#FFE680 55%,#FFB300);-webkit-background-clip:text;background-clip:text;color:transparent}
.fw-win p{margin:8px 0 0;font-size:.84rem;color:#CBD5E1;font-family:"Cairo",sans-serif}
.fw-winbtn{margin-top:14px;width:100%;border:0;cursor:pointer;color:#fff;font-weight:800;font-size:.95rem;font-family:"Cairo",sans-serif;
  padding:13px 18px;border-radius:16px;background:linear-gradient(135deg,#FF5A0A,#FF8A3D 60%,#FFB347);
  box-shadow:0 14px 28px -10px rgba(255,90,10,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.fw-winbtn:active{transform:scale(.97)}
@keyframes fwSpin{to{transform:translate(-50%,-30%) rotate(360deg)}}
@keyframes fwFadeIn{from{opacity:0}to{opacity:1}}
@keyframes fwBurst{0%{opacity:.9;transform:translate(-50%,-50%) scale(.55)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}}
@keyframes fwPop{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}
@media(prefers-reduced-motion:reduce){
  .fw-day.now i,.fw-rays,.fw-win .fw-trophy{animation:none!important}
  .fw-burst{display:none}}
`;
document.head.appendChild(st);

/* ---------- data ---------- */
async function fwFetch(p){
  const id=p.id;
  const [w,m,h,b,c,msg]=await Promise.all([
    sb.from("workout_sessions").select("log_date").eq("client_id",id),
    sb.from("meal_items").select("log_date").eq("client_id",id),
    sb.from("habits").select("log_date").eq("client_id",id),
    sb.from("body_logs").select("log_date").eq("client_id",id).limit(1),
    sb.from("checkins").select("week").eq("client_id",id).limit(1),
    sb.from("messages").select("created_at").eq("client_id",id).eq("sender_role","client").limit(1),
  ]);
  return {
    W:(w.data||[]).map(x=>x.log_date),
    M:(m.data||[]).map(x=>x.log_date),
    H:(h.data||[]).map(x=>x.log_date),
    B:(b.data||[]).length,
    C:(c.data||[]).length,
    MSG:(msg.data||[]).length,
  };
}

/* ---------- render ---------- */
async function firstWeekHTML(p, pre, opts){
  const TODAY=(opts&&opts.today)||today();
  const key="mofit_fw_"+p.id;
  let rec=null; try{ rec=JSON.parse(localStorage.getItem(key)||"null"); }catch(e){}
  if(rec&&rec.done&&!(opts&&opts.celebrate)) return "";

  const start=p.start_date||TODAY;
  const dayIdx=Math.min(7,Math.max(1,Math.floor(daysBetween(start,TODAY))+1));
  if(!pre && dayIdx>7) return "";

  let D=pre;
  if(!D){ try{ D=await fwFetch(p); }catch(e){ return ""; } }

  const active=new Set([...(D.W||[]),...(D.M||[]),...(D.H||[])]);
  const instDone=(typeof isStandalone==="function"&&isStandalone())||(rec&&rec.inst);
  const TASKS=[
    {k:"w", e:"🏋️", t:"سجّل أول تمرين",    s:"من تبويب التمرين – أي مجموعة تتسجل بتعدّي", go:"train",  done:(D.W||[]).length>0},
    {k:"m", e:"🍽️", t:"سجّل أول وجبة",     s:"من تبويب التغذية – فطار، غدا، أي حاجة",   go:"food",   done:(D.M||[]).length>0},
    {k:"b", e:"⚖️", t:"سجّل وزنك",         s:"من تبويب التقدم – رقم البداية مهم",       go:"body",   done:D.B>0||!!p.start_weight},
    {k:"h", e:"✅", t:"سجّل عادات يومك",    s:"نومك وميتك وخطواتك – من تبويب العادات",   go:"habits", done:(D.H||[]).length>0},
    {k:"c", e:"💬", t:"كلّم كوتشك",         s:"أي سؤال أو سلام – الكوتش معاك",           go:"chat",   done:D.MSG>0},
    {k:"i", e:"📲", t:"ثبّت التطبيق",       s:"على شاشة موبايلك، يفتح كأنه أبلكيشن",     go:"app",    done:!!instDone},
    {k:"s", e:"📸", t:"ابعت متابعتك الأسبوعية", s:"وزن + صور + إحساسك – من تبويب التقدم", go:"body", done:D.C>0},
  ];
  const doneN=TASKS.filter(t=>t.done).length;
  const wCount=(D.W||[]).length, mDays=new Set(D.M||[]).size;

  /* daily activity streak ending today (or yesterday) */
  let streak=0, cur=TODAY;
  if(!active.has(cur)) cur=addDays(cur,-1);
  while(active.has(cur)&&streak<7){ streak++; cur=addDays(cur,-1); }

  /* ----- one-time day-7 / all-done celebration ----- */
  const win=opts&&typeof opts.celebrate==="boolean" ? opts.celebrate
           : (dayIdx>=7||doneN===7) && !(rec&&rec.done);
  if(win){
    window._fwWin={key:key};
    return `<div class="fw-card win">
  <div class="fw-rays"></div><div class="fw-burst"></div><div class="fw-burst b2"></div>
  <div class="fw-win">
    <span class="fw-trophy">🏆</span>
    <h3>أسبوعك الأول خلص يا بطل</h3>
    <p>${wCount} ${wCount>2?"تمارين":"تمرين"} · ${mDays} ${mDays>2?"أيام أكل مسجّلة":"يوم أكل مسجّل"}${streak?` · ${streak} ${streak>2?"أيام":"يوم"} ورا بعض`:""}<br>دي مش بداية عادية – دي بداية أبطال. الكوتش شايف كل رقم.</p>
    <button class="fw-winbtn" id="fwDone">يلا على الأسبوع التاني 💪</button>
  </div>
</div>`;
  }

  /* ----- quest card ----- */
  const R=24, CIRC=2*Math.PI*R, offC=CIRC*(1-doneN/7);
  const strip=[...Array(7)].map((_,i)=>{
    const iso=addDays(start,i), on=active.has(iso), now=iso===TODAY, fut=daysBetween(TODAY,iso)>0;
    return `<div class="fw-day ${on?"on":""} ${now?"now":""}"><i style="${fut?"opacity:.45":""}">${i+1}</i><small>${now?"النهارده":""}</small></div>`;
  }).join("");
  const quest=`<div class="fw-card">
  <div class="fw-h">
    <div class="fw-ic">🗺️</div>
    <div class="fw-ht"><h3>مهمتك في أول أسبوع</h3><small>يوم ${dayIdx} من 7 – 7 خطوات وبيكون إلك نظام كامل</small></div>
    <div class="fw-ring"><svg width="58" height="58" viewBox="0 0 58 58">
      <circle cx="29" cy="29" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
      ${doneN?`<circle cx="29" cy="29" r="${R}" fill="none" stroke="url(#fwg)" stroke-width="6" stroke-linecap="round"
        stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${offC.toFixed(1)}" transform="rotate(-90 29 29)"/>`:""}
      <defs><linearGradient id="fwg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FF5A0A"/><stop offset=".55" stop-color="#FF8A3D"/><stop offset="1" stop-color="#FFE680"/></linearGradient></defs>
    </svg><b>${doneN}/7</b></div>
  </div>
  <div class="fw-days">${strip}</div>
  <div class="fw-list">${TASKS.map(t=>`<button class="fw-t ${t.done?"done":""}" data-fwgo="${t.go}" data-fwk="${t.k}">
      <span class="fw-c">✓</span><span class="fw-e">${t.e}</span>
      <span class="fw-x"><b>${t.t}</b><small>${t.s}</small></span><span class="fw-go">→</span></button>`).join("")}</div>
</div>`;

  /* ----- harvest card ----- */
  const emptyAll=!wCount&&!mDays&&!streak;
  const harvest=`<div class="fw-card">
  <div class="fw-h">
    <div class="fw-ic">🌱</div>
    <div class="fw-ht"><h3>تقدمك لحد دلوقتي</h3><small>${emptyAll?"أول تسجيل بيفرق – ابدأ بأي خطوة من اللي فوق":"من أول يوم لحد النهارده"}</small></div>
  </div>
  <div class="fw-tiles">
    <div class="fw-tile"><span class="e">🏋️</span><span class="n">${wCount}</span><span class="l">${wCount>2?"تمارين":"تمرين"}</span></div>
    <div class="fw-tile"><span class="e">🍽️</span><span class="n">${mDays}</span><span class="l">${mDays>2?"أيام أكل":"يوم أكل"}</span></div>
    <div class="fw-tile"><span class="e">🔥</span><span class="n">${streak}</span><span class="l">${streak>2?"أيام ورا بعض":"يوم ورا بعض"}</span></div>
  </div>
  ${emptyAll?"":`<p class="fw-note">كل رقم هنا <em>الكوتش بيشوفه</em> – كمّل، الأسبوع الجاي الأرقام دي هتكبر.</p>`}
</div>`;

  return quest+harvest;
}

/* ---------- wiring ---------- */
function firstWeekAfter(el,p){
  const wb=el&&el.querySelector?el.querySelector("#fwDone"):null;
  if(wb){
    const ig=window._fwWin; window._fwWin=null;
    wb.onclick=()=>{ try{ localStorage.setItem((ig&&ig.key)||("mofit_fw_"+p.id),JSON.stringify({done:true})); }catch(e){}
      el.innerHTML=""; if(typeof toast==="function") toast("🏆 أسبوع أول مكتمل – يلا نكمل"); };
    if(typeof burst==="function" && !(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)) setTimeout(burst,450);
    return;
  }
  el.querySelectorAll("[data-fwgo]").forEach(b=>b.onclick=()=>{
    const g=b.dataset.fwgo, k=b.dataset.fwk;
    if(k==="i"){
      try{ const key="mofit_fw_"+p.id, rec=JSON.parse(localStorage.getItem(key)||"null")||{}; rec.inst=true; localStorage.setItem(key,JSON.stringify(rec)); }catch(e){}
      b.classList.add("done"); b.querySelector(".fw-c").textContent="✓";
      if(typeof toast==="function") toast("📲 من قائمة المتصفح ⋮ اختار «تثبيت التطبيق»");
      return;
    }
    if(g==="chat"){ if(typeof contactCoach==="function"){ contactCoach(); } return; }
    if(g==="body"){ S.tab="body"; }
    else if(g){ S.tab=g; if(g==="food") S.date=today(); if(g==="train"&&typeof todayDayNo==="function"){ S.day=todayDayNo()||S.day; } }
    if(typeof render==="function"){ render(); window.scrollTo(0,0); }
  });
}

window.firstWeekHTML=firstWeekHTML;
window.firstWeekAfter=firstWeekAfter;
})();
