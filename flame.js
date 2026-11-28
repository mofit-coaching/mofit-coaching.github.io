/* ======================================================================
   THE FLAME (fl-*): living streak hero for the client Home.
   The client's own streak ignites the brand mark: a molten progress ring
   around the dumbbell-M tile, streak count in golden Anton inside.
   Part 2 adds the IGNITION CEREMONY: the first Home render after the
   weekly goal completes fires the one-time ignition state (god-rays,
   burst, full gold ring, counter tick to the new streak, share-card CTA),
   then the hero returns to the living state. Celebration is remembered
   per client+week in localStorage so it plays exactly once.
   Scoped CSS injected here (fl-* only). styles.css / design.css untouched.
   Motion follows the identity layer; disabled under prefers-reduced-motion.
   flameHeroHTML(p, pre, opts) - pre={W,goal,wkNow} skips the query and
   opts={ignite:true|false} forces the state (static capture harness).
   flameAfter(el,p) - post-render hook: consumes the celebration and
   runs the counter tick. Called from views.js after the fill.
   ====================================================================== */
(function(){
const st=document.createElement("style"); st.textContent=`
.fl-hero{position:relative;overflow:hidden;border-radius:26px;margin-bottom:14px;color:#fff;
  background:
    radial-gradient(420px 300px at 88% -60px,rgba(255,107,26,.30),transparent 62%),
    radial-gradient(380px 340px at 6% 34%,rgba(255,179,0,.09),transparent 65%),
    radial-gradient(460px 420px at 110% 88%,rgba(91,108,255,.13),transparent 60%),
    linear-gradient(178deg,#0B1220 0%,#0F172A 52%,#0B1220 100%);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 22px 44px -20px rgba(11,18,32,.55),inset 0 1px 0 rgba(255,255,255,.06);
  padding:26px 18px 22px;text-align:center}
.fl-hero::before{content:"";position:absolute;top:0;inset-inline:22px;height:2px;border-radius:0 0 4px 4px;
  background:linear-gradient(90deg,transparent,rgba(255,179,71,.8),transparent);pointer-events:none}
.fl-stage{position:relative;width:296px;height:296px;margin:0 auto}
.fl-stage svg.fl-ring{position:absolute;inset:0;overflow:visible}
.fl-glowdisc{position:absolute;inset:42px;border-radius:50%;
  background:radial-gradient(circle at 50% 42%,rgba(255,138,61,.20),rgba(255,90,10,.06) 55%,transparent 72%)}
.fl-halo{position:absolute;left:50%;top:50%;transform:translate(-50%,-92%);width:134px;height:134px;border-radius:32px;
  border:1.5px solid rgba(255,194,26,.35);animation:flHalo 3.2s ease-out infinite}
.fl-halo.b{width:134px;height:134px;animation-delay:1.6s;border-color:rgba(255,194,26,.0)}
.fl-tile{position:absolute;left:50%;top:50%;transform:translate(-50%,-92%);width:90px;height:90px;border-radius:23px;
  background:linear-gradient(135deg,#FF5A0A,#FFB347);
  box-shadow:0 0 0 1px rgba(255,255,255,.14) inset,0 16px 40px -8px rgba(255,90,10,.75),0 0 30px rgba(255,179,0,.42);
  display:grid;place-items:center;animation:flRadiate 2.4s ease-in-out infinite}
.fl-tile svg{width:74px;height:74px;overflow:visible}
.fl-pl{transform-box:fill-box;transform-origin:center;animation:flLift 2.6s ease-in-out infinite}
.fl-pl.b{animation-delay:.25s}
.fl-m2{stroke-dasharray:.2 1;stroke-dashoffset:.2;filter:drop-shadow(0 0 3px #FFC21A) drop-shadow(0 0 7px rgba(255,179,0,.85));
  animation:flTravel 2.4s cubic-bezier(.5,0,.5,1) infinite}
.fl-num{position:absolute;left:50%;top:50%;transform:translate(-50%,10%);text-align:center}
.fl-num .n{display:block;font-family:"Anton","Noto Kufi Arabic",sans-serif;font-size:50px;line-height:1;direction:ltr;
  background:linear-gradient(180deg,#FFE680,#FFB300 72%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 10px rgba(255,179,0,.5))}
.fl-num .l{display:block;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-size:11px;font-weight:700;color:#FED7AA;margin-top:4px}
.fl-dot{animation:flDot 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.fl-px{position:absolute;border-radius:50%;background:#FFB347;opacity:0;animation:flPx 4.5s ease-in infinite}
.fl-px.p2{animation-delay:.9s}.fl-px.p3{animation-delay:1.8s}.fl-px.p4{animation-delay:2.7s}.fl-px.p5{animation-delay:3.4s}
.fl-head{margin-top:18px}
.fl-head h2{margin:0;padding-inline:8px;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:1.14rem;line-height:1.6;color:#fff}
.fl-head h2 em{font-style:normal;background:linear-gradient(100deg,#FFB300,#FFE680);-webkit-background-clip:text;background-clip:text;color:transparent}
.fl-head p{margin:6px 0 0;font-size:.85rem;color:#94A3B8;font-weight:500}
.fl-chips{display:flex;gap:8px;margin-top:14px;justify-content:center;flex-wrap:wrap}
.fl-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;font-size:.78rem;font-weight:700;
  background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.11);color:#E2E8F0}
.fl-chip .fl-d{width:7px;height:7px;border-radius:50%;background:#FF8A3D;box-shadow:0 0 8px #FF8A3D}
.fl-chip.gold{color:#FFE680;border-color:rgba(255,194,26,.35);background:rgba(255,179,0,.08)}
.fl-chip.gold .fl-d{background:#FFC21A;box-shadow:0 0 8px #FFC21A}
.fl-ring-v{stroke-dashoffset:var(--c);animation:flDraw 1.5s cubic-bezier(.2,.8,.2,1) .25s forwards;
  filter:drop-shadow(0 0 6px rgba(255,138,61,.75)) drop-shadow(0 0 14px rgba(255,90,10,.4))}
/* ---- ignition ceremony ---- */
.fl-rays{position:absolute;left:50%;top:50%;width:560px;height:560px;transform:translate(-50%,-50%);border-radius:50%;
  background:repeating-conic-gradient(from -8deg,rgba(255,194,26,.13) 0deg 5deg,transparent 5deg 24deg);
  -webkit-mask-image:radial-gradient(circle,#000 0%,transparent 62%);mask-image:radial-gradient(circle,#000 0%,transparent 62%);
  animation:flSpin 44s linear infinite,flFadeIn 1.1s ease-out both;pointer-events:none}
.fl-burst{position:absolute;left:50%;top:50%;width:296px;height:296px;border-radius:50%;pointer-events:none;
  border:2px solid rgba(255,224,130,.85);transform:translate(-50%,-50%);animation:flBurst 1.15s cubic-bezier(.16,.8,.3,1) .1s both}
.fl-burst.b2{animation-delay:.38s;border-color:rgba(255,179,71,.6)}
.fl-burst.b3{animation-delay:.66s;border-color:rgba(255,138,61,.4)}
.fl-hero.ignite .fl-tile{animation:flRadiate 2.4s ease-in-out infinite,flKick .7s cubic-bezier(.2,1.4,.4,1) both}
.fl-hero.ignite .fl-num .n{animation:flPop .6s cubic-bezier(.2,1.6,.4,1) .35s both}
.fl-cta{display:flex;align-items:center;gap:12px;margin-top:18px;padding:12px 14px;border-radius:18px;text-align:start;
  background:rgba(255,179,0,.07);border:1px solid rgba(255,194,26,.30);animation:flFadeUp .8s cubic-bezier(.2,.8,.2,1) .55s both}
.fl-cta-t{flex:1;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:.88rem;color:#FFE680}
.fl-cta-t small{display:block;font-family:"Cairo";font-weight:500;font-size:.74rem;color:#94A3B8;margin-top:3px}
.fl-cta-btn{flex:none;border:0;cursor:pointer;color:#fff;font-weight:800;font-size:.82rem;font-family:inherit;
  padding:10px 18px;border-radius:14px;background:linear-gradient(135deg,#FF5A0A,#FF8A3D 60%,#FFB347);
  box-shadow:0 12px 24px -8px rgba(255,90,10,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.fl-cta-btn:active{transform:scale(.96)}
@keyframes flDraw{to{stroke-dashoffset:var(--o)}}
@keyframes flRadiate{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.14) inset,0 16px 40px -8px rgba(255,90,10,.75),0 0 30px rgba(255,179,0,.42)}
  40%{box-shadow:0 0 0 1px rgba(255,255,255,.2) inset,0 16px 40px -8px rgba(255,90,10,.85),0 0 46px rgba(255,194,26,.7)}}
@keyframes flLift{0%,100%{transform:scaleY(1)}18%{transform:scaleY(1.13)}36%{transform:scaleY(1)}}
@keyframes flTravel{0%{stroke-dashoffset:.2}70%,100%{stroke-dashoffset:-1}}
@keyframes flHalo{0%{opacity:0;transform:translate(-50%,-92%) scale(1)}10%{opacity:.7}70%,100%{opacity:0;transform:translate(-50%,-92%) scale(1.55)}}
@keyframes flDot{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
@keyframes flPx{0%{opacity:0;transform:translateY(0)}15%{opacity:.9}100%{opacity:0;transform:translateY(-64px)}}
@keyframes flSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes flFadeIn{from{opacity:0}to{opacity:1}}
@keyframes flBurst{0%{opacity:.9;transform:translate(-50%,-50%) scale(.55)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
@keyframes flKick{0%{transform:translate(-50%,-92%) scale(.86)}55%{transform:translate(-50%,-92%) scale(1.07)}100%{transform:translate(-50%,-92%) scale(1)}}
@keyframes flPop{0%{transform:scale(.6);opacity:.2}100%{transform:scale(1);opacity:1}}
@keyframes flFadeUp{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){
  .fl-ring-v{animation:none;stroke-dashoffset:var(--o)}
  .fl-tile,.fl-pl,.fl-halo,.fl-dot,.fl-px,.fl-rays,.fl-burst,.fl-cta,.fl-num .n{animation:none!important}
  .fl-burst{display:none}
  .fl-m2{display:none}}
`;
document.head.appendChild(st);

const TILE=`<svg viewBox="0 0 512 512" aria-hidden="true"><g fill="#fff" class="fl-pl"><rect x="40" y="176" width="48" height="160" rx="20"/><rect x="96" y="128" width="48" height="256" rx="20"/></g><g fill="#fff" class="fl-pl b"><rect x="424" y="176" width="48" height="160" rx="20"/><rect x="368" y="128" width="48" height="256" rx="20"/></g><path d="M144 336V192L208 288 256 224 304 288 368 192V336" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path class="fl-m2" pathLength="1" d="M144 336V192L208 288 256 224 304 288 368 192V336" fill="none" stroke="#FFE680" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

async function flameHeroHTML(p, pre, opts){
  let W, goal, wkNow;
  if(pre){ W=pre.W; goal=pre.goal; wkNow=pre.wkNow; }
  else{
    const { data } = await wsRows(p.id);
    W=data||[];
    goal=Math.max(1,new Set(S.program.map(e=>e.day_no)).size||3);
    wkNow=currentWeek(p);
  }
  const cnt={}; W.forEach(s=>{ cnt[s.week]=(cnt[s.week]||0)+1; });
  const done=cnt[wkNow]||0; let streak=0, w=done>=goal?wkNow:wkNow-1;
  while(w>=1 && (cnt[w]||0)>=goal){ streak++; w--; }
  const total=W.length;

  let ignite;
  if(opts && typeof opts.ignite==="boolean"){ ignite=opts.ignite; }
  else{
    const key="mofit_flame_"+p.id; let rec=null;
    try{ rec=JSON.parse(localStorage.getItem(key)||"null"); }catch(e){}
    if(!rec||rec.week!==wkNow) rec={week:wkNow,celebrated:false};
    ignite=done>=goal && !rec.celebrated;
    if(ignite) window._flameIgnite={key:key,rec:rec,streak:streak};
  }

  const R=132, C=2*Math.PI*R, frac=ignite?1:Math.min(1,goal?done/goal:0), off=C*(1-frac);
  const a=(-90+360*frac)*Math.PI/180, dx=148+R*Math.cos(a), dy=148+R*Math.sin(a);
  const plural=n=>n>2?"تمارين":"تمرين";
  let head, sub;
  if(ignite){ head=`الأسبوع اكتمل يا بطل، <em>الشعلة ولّعت</em>`; sub=`${streak} ${streak>2?"أسابيع":"أسبوع"} ورا بعض من غير ما تفوّت ولا هدف`; }
  else if(streak>0){ head=`جسمك بيتغيّر يا بطل، <em>والشعلة بتكبر</em>`; sub=`${streak} ${streak>2?"أسابيع":"أسبوع"} ورا بعض من غير ما تفوّت هدف`; }
  else if(done>0){ head=`النار بدأت <em>تولّع</em>`; sub="كمّل هدف الأسبوع والشعلة تشتعل"; }
  else{ head=`أول شعلة بتبدأ <em>بتمرين</em>`; sub="حقق هدف الأسبوع والنار تولّع"; }
  const chip2=ignite?`رقمك الجديد: ${streak}`:(done>=goal?`هدف الأسبوع اتحقق`:`فاضل ${goal-done} ${goal-done===1?"تمرين واحد":plural(goal-done)}`);
  const numLabel=ignite?`${streak>2?"أسابيع":"أسبوع"} التزام متتالي`:(streak>0?`${streak>2?"أسابيع":"أسبوع"} التزام متتالي`:"شعلتك لسه بتتولّد");
  const shown=(streak>0||ignite)?streak:`${done}/${goal}`;
  let badge="", badgename="";
  try{ if(typeof BADGES!=="undefined"){ const earned=BADGES.filter(b=>total>=b[0]); if(earned.length){ badge=earned[earned.length-1][1]; badgename=earned[earned.length-1][2]; } } }catch(e){}
  const grad=ignite
    ?`<linearGradient id="flg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FFB300"/><stop offset=".5" stop-color="#FFE680"/><stop offset="1" stop-color="#FFB300"/></linearGradient>`
    :`<linearGradient id="flg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FF5A0A"/><stop offset=".55" stop-color="#FF8A3D"/><stop offset="1" stop-color="#FFE680"/></linearGradient>`;
  return `<div class="fl-hero${ignite?" ignite":""}">
  <div class="fl-stage">
    ${ignite?`<div class="fl-rays"></div><div class="fl-burst"></div><div class="fl-burst b2"></div><div class="fl-burst b3"></div>`:""}
    <div class="fl-glowdisc"></div>
    <div class="fl-halo"></div><div class="fl-halo b"></div>
    <svg class="fl-ring" viewBox="0 0 296 296">
      <defs>${grad}</defs>
      <circle cx="148" cy="148" r="${R}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="10"/>
      ${frac>0?`<circle class="fl-ring-v" cx="148" cy="148" r="${R}" fill="none" stroke="url(#flg)" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${C.toFixed(1)}" style="--c:${C.toFixed(1)};--o:${off.toFixed(1)}" transform="rotate(-90 148 148)"/>
      <circle class="fl-dot" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="7" fill="${ignite?"#FFF2B0":"#FFE680"}" style="filter:drop-shadow(0 0 8px #FFC21A)"/>`:""}
    </svg>
    <div class="fl-tile">${TILE}</div>
    <div class="fl-num"><span class="n"${ignite?` data-to="${streak}"`:""}>${shown}</span><span class="l">${numLabel}</span></div>
    <div class="fl-px" style="width:4px;height:4px;left:66px;top:58px"></div>
    <div class="fl-px p2" style="width:3px;height:3px;left:224px;top:42px"></div>
    <div class="fl-px p3" style="width:5px;height:5px;left:248px;top:114px"></div>
    <div class="fl-px p4" style="width:3px;height:3px;left:48px;top:162px"></div>
    <div class="fl-px p5" style="width:4px;height:4px;left:116px;top:24px"></div>
  </div>
  <div class="fl-head"><h2>${head}</h2><p>${sub}</p></div>
  <div class="fl-chips">
    <span class="fl-chip gold"><span class="fl-d"></span>${done}/${goal} تمرين الأسبوع ده</span>
    <span class="fl-chip"><span class="fl-d"></span>${chip2}</span>
  </div>
  ${ignite?`<div class="fl-cta">
    <div class="fl-cta-t">شهادة الأسبوع جاهزة<small>فيديو التقدم بهويتك الجديدة، شاركه مع صحابك</small></div>
    <button class="fl-cta-btn" onclick="shareStreakCard(this)" data-streak="${streak}" data-total="${total}" data-done="${done}" data-goal="${goal}" data-badge="${badge}" data-badgename="${badgename}">شوفها</button>
  </div>`:""}
</div>`;
}

function flameAfter(el, p){
  const ig=window._flameIgnite; if(!ig) return;
  window._flameIgnite=null;
  ig.rec.celebrated=true;
  try{ localStorage.setItem(ig.key,JSON.stringify(ig.rec)); }catch(e){}
  const n=el&&el.querySelector?el.querySelector(".fl-num .n"):null;
  if(!n||!ig.streak||ig.streak<1) return;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const from=ig.streak-1, t0=performance.now(), dur=750;
  const tick=t=>{ const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,3);
    n.textContent=String(Math.round(from+(ig.streak-from)*e));
    if(k<1) requestAnimationFrame(tick); };
  n.textContent=String(from);
  requestAnimationFrame(tick);
}

window.flameHeroHTML=flameHeroHTML;
window.flameAfter=flameAfter;
})();
