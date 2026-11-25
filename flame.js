/* ======================================================================
   THE FLAME (fl-*): living streak hero for the client Home.
   The client's own streak ignites the brand mark: a molten progress ring
   around the dumbbell-M tile, streak count in golden Anton inside.
   Scoped CSS injected here (fl-* only). styles.css / design.css untouched.
   Motion language follows the identity layer (dash travel, radiate glow,
   pulse rings, rising particles); disabled under prefers-reduced-motion.
   Data: same source as streakCardHTML (workout_sessions + program goal).
   flameHeroHTML(p, pre) - pass pre={W,goal,wkNow} to skip the query
   (used by the static capture harness).
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
.fl-head h2{margin:0;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:1.2rem;line-height:1.6;color:#fff}
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
@keyframes flDraw{to{stroke-dashoffset:var(--o)}}
@keyframes flRadiate{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.14) inset,0 16px 40px -8px rgba(255,90,10,.75),0 0 30px rgba(255,179,0,.42)}
  40%{box-shadow:0 0 0 1px rgba(255,255,255,.2) inset,0 16px 40px -8px rgba(255,90,10,.85),0 0 46px rgba(255,194,26,.7)}}
@keyframes flLift{0%,100%{transform:scaleY(1)}18%{transform:scaleY(1.13)}36%{transform:scaleY(1)}}
@keyframes flTravel{0%{stroke-dashoffset:.2}70%,100%{stroke-dashoffset:-1}}
@keyframes flHalo{0%{opacity:0;transform:translate(-50%,-92%) scale(1)}10%{opacity:.7}70%,100%{opacity:0;transform:translate(-50%,-92%) scale(1.55)}}
@keyframes flDot{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
@keyframes flPx{0%{opacity:0;transform:translateY(0)}15%{opacity:.9}100%{opacity:0;transform:translateY(-64px)}}
@media(prefers-reduced-motion:reduce){
  .fl-ring-v{animation:none;stroke-dashoffset:var(--o)}
  .fl-tile,.fl-pl,.fl-halo,.fl-dot,.fl-px{animation:none!important}
  .fl-m2{display:none}}
`;
document.head.appendChild(st);

const TILE=`<svg viewBox="0 0 512 512" aria-hidden="true"><g fill="#fff" class="fl-pl"><rect x="40" y="176" width="48" height="160" rx="20"/><rect x="96" y="128" width="48" height="256" rx="20"/></g><g fill="#fff" class="fl-pl b"><rect x="424" y="176" width="48" height="160" rx="20"/><rect x="368" y="128" width="48" height="256" rx="20"/></g><path d="M144 336V192L208 288 256 224 304 288 368 192V336" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path class="fl-m2" pathLength="1" d="M144 336V192L208 288 256 224 304 288 368 192V336" fill="none" stroke="#FFE680" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

async function flameHeroHTML(p, pre){
  let W, goal, wkNow;
  if(pre){ W=pre.W; goal=pre.goal; wkNow=pre.wkNow; }
  else{
    const { data } = await sb.from("workout_sessions").select("log_date,week").eq("client_id",p.id);
    W=data||[];
    goal=Math.max(1,new Set(S.program.map(e=>e.day_no)).size||3);
    wkNow=currentWeek(p);
  }
  const cnt={}; W.forEach(s=>{ cnt[s.week]=(cnt[s.week]||0)+1; });
  const done=cnt[wkNow]||0; let streak=0, w=done>=goal?wkNow:wkNow-1;
  while(w>=1 && (cnt[w]||0)>=goal){ streak++; w--; }

  const R=132, C=2*Math.PI*R, frac=Math.min(1,goal?done/goal:0), off=C*(1-frac);
  const a=(-90+360*frac)*Math.PI/180, dx=148+R*Math.cos(a), dy=148+R*Math.sin(a);
  const plural=n=>n>2?"تمارين":"تمرين";
  let head, sub;
  if(streak>0){ head=`جسمك بيتغيّر يا بطل، <em>والشعلة بتكبر</em>`; sub=`${streak} ${streak>2?"أسابيع":"أسبوع"} ورا بعض من غير ما تفوّت هدف`; }
  else if(done>0){ head=`النار بدأت <em>تولّع</em>`; sub="كمّل هدف الأسبوع والشعلة تشتعل"; }
  else{ head=`أول شعلة بتبدأ <em>بتمرين</em>`; sub="حقق هدف الأسبوع والنار تولّع"; }
  const chip2=done>=goal?`هدف الأسبوع اتحقق`:`فاضل ${goal-done} ${goal-done===1?"تمرين واحد":plural(goal-done)}`;
  const numLabel=streak>0?`${streak>2?"أسابيع":"أسبوع"} التزام متتالي`:"شعلتك لسه بتتولّد";
  return `<div class="fl-hero">
  <div class="fl-stage">
    <div class="fl-glowdisc"></div>
    <div class="fl-halo"></div><div class="fl-halo b"></div>
    <svg class="fl-ring" viewBox="0 0 296 296">
      <defs><linearGradient id="flg" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="#FF5A0A"/><stop offset=".55" stop-color="#FF8A3D"/><stop offset="1" stop-color="#FFE680"/>
      </linearGradient></defs>
      <circle cx="148" cy="148" r="${R}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="10"/>
      ${frac>0?`<circle class="fl-ring-v" cx="148" cy="148" r="${R}" fill="none" stroke="url(#flg)" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${C.toFixed(1)}" style="--c:${C.toFixed(1)};--o:${off.toFixed(1)}" transform="rotate(-90 148 148)"/>
      <circle class="fl-dot" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="7" fill="#FFE680" style="filter:drop-shadow(0 0 8px #FFC21A)"/>`:""}
    </svg>
    <div class="fl-tile">${TILE}</div>
    <div class="fl-num"><span class="n">${streak>0?streak:`${done}/${goal}`}</span><span class="l">${numLabel}</span></div>
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
</div>`;
}
window.flameHeroHTML=flameHeroHTML;
})();
