/* ======================================================================
   WEEKLY LEAGUE v2 (lg-*) - coach-started, opt-in, trophies for top 3.
   - The coach STARTS the league with a button (league_start). Starting
     resets the baseline: only activity after the start counts.
   - Every active client gets an in-app invite on their home screen and
     chooses to join or not (league_respond). Only joined members get the
     "الليج" tab and appear on the board.
   - Clients see each other ONLY as auto-generated fun nicknames - never
     real names or photos. The coach sees real names.
   - The week closes Monday 00:00 Africa/Cairo; the top 3 get crowned
     🥇🥈🥉 and are kept in the trophy room.

   One RPC (league_board) returns everything. If league-v2.sql is not
   applied yet, the module hides itself for clients and the coach gets a
   start button that toasts an error until the SQL is live - nothing
   breaks. Scoped CSS here only (lg-*); styles.css/design.css untouched.
   Entrance animations play once then rest; nothing loops.
   Exports: window.leagueHTML / window.leagueAfter (harness + tests).
   ====================================================================== */
(function(){
const st=document.createElement("style"); st.textContent=`
.lg-card{position:relative;overflow:hidden;border-radius:26px;margin-bottom:14px;color:#fff;
  background:
    radial-gradient(420px 260px at 92% -70px,rgba(255,107,26,.26),transparent 62%),
    radial-gradient(360px 300px at 0% 100%,rgba(255,179,0,.07),transparent 65%),
    radial-gradient(420px 380px at 110% 90%,rgba(91,108,255,.10),transparent 60%),
    linear-gradient(178deg,#0B1220 0%,#0F172A 55%,#0B1220 100%);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 22px 44px -20px rgba(11,18,32,.55),inset 0 1px 0 rgba(255,255,255,.06);
  padding:18px 16px 14px;animation:lgIn .7s cubic-bezier(.2,.8,.2,1) both}
.lg-card::before{content:"";position:absolute;top:0;inset-inline:22px;height:2px;border-radius:0 0 4px 4px;
  background:linear-gradient(90deg,transparent,rgba(255,179,71,.8),transparent);pointer-events:none}
.lg-h{display:flex;align-items:center;gap:12px}
.lg-ic{width:44px;height:44px;flex:none;border-radius:14px;display:grid;place-items:center;font-size:1.35rem;
  background:linear-gradient(135deg,#FF5A0A,#FFB347);
  box-shadow:0 10px 22px -8px rgba(255,90,10,.8),inset 0 1px 0 rgba(255,255,255,.35)}
.lg-ht{flex:1;min-width:0}
.lg-ht h3{margin:0;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:800;font-size:1.05rem;color:#fff}
.lg-ht small{display:block;font-family:"Cairo",sans-serif;font-size:.74rem;color:#94A3B8;margin-top:2px}
.lg-cd{flex:none;text-align:center;padding:6px 10px;border-radius:12px;
  background:rgba(255,179,0,.08);border:1px solid rgba(255,194,26,.30)}
.lg-cd b{display:block;font-family:"Anton","Noto Kufi Arabic",sans-serif;font-size:1.05rem;direction:ltr;line-height:1;
  background:linear-gradient(180deg,#FFE680,#FFB300 72%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lg-cd small{font-size:.62rem;color:#FED7AA;font-family:"Cairo",sans-serif}
.lg-inv{margin-top:14px;padding:14px;border-radius:18px;text-align:center;
  background:linear-gradient(135deg,rgba(255,90,10,.16),rgba(255,179,0,.08));
  border:1px solid rgba(255,194,26,.42);animation:lgIn .7s cubic-bezier(.2,.8,.2,1) .08s both}
.lg-inv b{display:block;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:800;font-size:1rem;
  background:linear-gradient(100deg,#FFB300,#FFE680);-webkit-background-clip:text;background-clip:text;color:transparent}
.lg-inv p{font-family:"Cairo",sans-serif;font-size:.78rem;color:#B6C2D4;margin:8px 0 12px;line-height:1.8}
.lg-cta{display:flex;gap:10px}
.lg-btn{flex:1;border:0;cursor:pointer;color:#fff;font-weight:800;font-size:.86rem;font-family:"Cairo",sans-serif;
  padding:12px;border-radius:14px;background:linear-gradient(135deg,#FF5A0A,#FF8A3D 60%,#FFB347);
  box-shadow:0 12px 24px -8px rgba(255,90,10,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.lg-btn:active{transform:scale(.97)}
.lg-ghost{flex:1;cursor:pointer;color:#94A3B8;font-weight:700;font-size:.82rem;font-family:"Cairo",sans-serif;
  padding:12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)}
.lg-win{display:flex;align-items:center;gap:12px;margin-top:14px;padding:12px 14px;border-radius:18px;
  background:rgba(255,179,0,.09);border:1px solid rgba(255,194,26,.38);animation:lgIn .7s cubic-bezier(.2,.8,.2,1) .1s both}
.lg-win .crown{font-size:1.7rem;filter:drop-shadow(0 0 10px rgba(255,179,0,.7));animation:lgCrown .7s cubic-bezier(.2,1.5,.4,1) .25s both}
.lg-win-t{flex:1;min-width:0}
.lg-win-t b{display:block;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:.92rem;
  background:linear-gradient(100deg,#FFB300,#FFE680);-webkit-background-clip:text;background-clip:text;color:transparent}
.lg-win-t small{display:block;font-family:"Cairo",sans-serif;font-size:.74rem;color:#94A3B8;margin-top:3px}
.lg-win.me{background:linear-gradient(135deg,rgba(255,90,10,.22),rgba(255,179,0,.12));border-color:rgba(255,194,26,.65);
  box-shadow:0 0 26px rgba(255,179,0,.28)}
.lg-pod{display:flex;gap:8px;margin-top:14px;align-items:flex-end}
.lg-p1,.lg-p2,.lg-p3{flex:1;text-align:center;border-radius:16px;padding:12px 6px 10px;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);animation:lgIn .6s cubic-bezier(.2,.8,.2,1) both}
.lg-p1{flex:1.25;padding-top:16px;background:rgba(255,179,0,.10);border-color:rgba(255,194,26,.45);
  box-shadow:0 0 22px rgba(255,179,0,.18)}
.lg-p2{animation-delay:.08s}.lg-p3{animation-delay:.16s}
.lg-p1 .m,.lg-p2 .m,.lg-p3 .m{font-size:1.5rem;filter:drop-shadow(0 0 8px rgba(255,179,0,.5))}
.lg-p1 .m{font-size:2rem}
.lg-pod b{display:block;margin-top:6px;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:.78rem;color:#E2E8F0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lg-p1 b{color:#FFE680}
.lg-pod small{display:block;font-family:"Cairo",sans-serif;font-size:.66rem;color:#7C8AA0;margin-top:2px}
.lg-rows{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.lg-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:16px;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);
  animation:lgIn .55s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*70ms + .12s)}
.lg-row.me{background:rgba(255,179,0,.10);border-color:rgba(255,194,26,.45)}
.lg-rank{flex:none;width:30px;text-align:center;font-family:"Anton",sans-serif;font-size:1rem;direction:ltr;color:#94A3B8}
.lg-rank.top{font-size:1.25rem}
.lg-nm{flex:1;min-width:0}
.lg-nm b{display:block;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:.86rem;color:#E2E8F0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lg-row.me .lg-nm b{color:#FFE680}
.lg-nm small{display:block;font-family:"Cairo",sans-serif;font-size:.68rem;color:#7C8AA0;margin-top:1px}
.lg-tag{display:inline-block;margin-inline-start:6px;padding:1px 8px;border-radius:999px;font-size:.62rem;font-weight:800;
  font-family:"Cairo",sans-serif;color:#0B1220;background:linear-gradient(135deg,#FF8A3D,#FFC21A)}
.lg-pts{flex:none;text-align:left}
.lg-pts b{display:block;font-family:"Anton","Noto Kufi Arabic",sans-serif;font-size:1.25rem;direction:ltr;line-height:1;
  background:linear-gradient(180deg,#FFE680,#FFB300 72%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lg-pts small{display:block;font-family:"Cairo",sans-serif;font-size:.62rem;color:#7C8AA0;text-align:center}
.lg-bar{height:4px;border-radius:99px;margin-top:6px;background:rgba(255,255,255,.07);overflow:hidden}
.lg-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#FF5A0A,#FFB347,#FFE680);
  box-shadow:0 0 8px rgba(255,179,0,.45);animation:lgBar .9s cubic-bezier(.2,.8,.2,1) calc(var(--i)*70ms + .25s) both}
.lg-streak{flex:none;font-size:.68rem;font-weight:800;font-family:"Cairo",sans-serif;color:#FED7AA;
  padding:3px 8px;border-radius:999px;background:rgba(255,107,26,.14);border:1px solid rgba(255,107,26,.4)}
.lg-me{display:flex;align-items:center;gap:12px;margin-top:14px;padding:13px 14px;border-radius:18px;
  background:linear-gradient(135deg,rgba(255,90,10,.20),rgba(255,179,0,.10));border:1px solid rgba(255,194,26,.5);
  animation:lgIn .7s cubic-bezier(.2,.8,.2,1) .06s both}
.lg-me .rk{flex:none;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;
  font-family:"Anton",sans-serif;font-size:1.5rem;direction:ltr;color:#0B1220;
  background:linear-gradient(180deg,#FFE680,#FFB300 78%);box-shadow:0 10px 20px -8px rgba(255,179,0,.7)}
.lg-me .mt{flex:1;min-width:0}
.lg-me .mt b{display:block;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:800;font-size:.95rem;color:#FFE680}
.lg-me .mt small{display:block;font-family:"Cairo",sans-serif;font-size:.74rem;color:#B6C2D4;margin-top:2px}
.lg-tro{margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.12)}
.lg-tro h4{margin:0 0 8px;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:.8rem;color:#E2E8F0}
.lg-trow{display:flex;align-items:center;gap:8px;padding:6px 4px;font-family:"Cairo",sans-serif;font-size:.74rem;color:#B6C2D4;
  border-bottom:1px solid rgba(255,255,255,.05)}
.lg-trow:last-child{border-bottom:0}
.lg-trow .wk{flex:none;width:74px;color:#64748B;font-size:.66rem}
.lg-trow .p{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lg-trow .p b{color:#E2E8F0;font-weight:700}
.lg-more{margin-top:10px;text-align:center}
.lg-more summary{cursor:pointer;font-family:"Cairo",sans-serif;font-size:.72rem;color:#64748B;list-style:none}
.lg-more summary::-webkit-details-marker{display:none}
.lg-more p{font-family:"Cairo",sans-serif;font-size:.72rem;color:#94A3B8;margin:8px 0 0;line-height:1.8}
.lg-grant{flex:none;border:0;cursor:pointer;color:#fff;font-weight:800;font-size:.74rem;font-family:"Cairo",sans-serif;
  padding:9px 14px;border-radius:12px;background:linear-gradient(135deg,#FF5A0A,#FF8A3D 60%,#FFB347);
  box-shadow:0 10px 20px -8px rgba(255,90,10,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.lg-grant:disabled{background:rgba(255,255,255,.09);box-shadow:none;color:#7C8AA0;cursor:default}
.lg-grant:not(:disabled):active{transform:scale(.96)}
.lg-cfg{margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.12)}
.lg-cfg h4{margin:0 0 8px;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:.8rem;color:#E2E8F0}
.lg-opts{display:flex;gap:8px;flex-wrap:wrap}
.lg-opt{flex:1;min-width:96px;cursor:pointer;text-align:center;padding:9px 8px;border-radius:14px;font-family:"Cairo",sans-serif;
  font-size:.74rem;font-weight:700;color:#94A3B8;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.11)}
.lg-opt.on{color:#FFE680;border-color:rgba(255,194,26,.5);background:rgba(255,179,0,.10)}
.lg-save{margin-top:10px;width:100%;border:0;cursor:pointer;color:#fff;font-weight:800;font-size:.8rem;font-family:"Cairo",sans-serif;
  padding:11px;border-radius:14px;background:linear-gradient(135deg,#FF5A0A,#FF8A3D 60%,#FFB347);
  box-shadow:0 12px 24px -8px rgba(255,90,10,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.lg-save:active{transform:scale(.98)}
.lg-open{margin-top:12px;width:100%;border:0;cursor:pointer;color:#0B1220;font-weight:800;font-size:.82rem;font-family:"Cairo",sans-serif;
  padding:11px;border-radius:14px;background:linear-gradient(135deg,#FFE680,#FFC21A);
  box-shadow:0 12px 24px -10px rgba(255,194,26,.8),inset 0 1px 0 rgba(255,255,255,.5)}
.lg-open:active{transform:scale(.98)}
.lg-meta{margin-top:10px;text-align:center;font-family:"Cairo",sans-serif;font-size:.7rem;color:#64748B}
@keyframes lgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes lgCrown{0%{transform:scale(.4) rotate(-14deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes lgBar{from{width:0}}
@media(prefers-reduced-motion:reduce){
  .lg-card,.lg-win,.lg-row,.lg-inv,.lg-me,.lg-p1,.lg-p2,.lg-p3,.lg-win .crown{animation:none!important}
  .lg-bar i{animation:none!important}}
`;
document.head.appendChild(st);

const MEDALS=["🥇","🥈","🥉"];
const REWARD_TXT={
  manual:"🎖 الكوتش بيكرّم البطل بنفسه",
  free_week:"🎁 مكافأة البطل: أسبوع مجاني",
  plan_upgrade:"⭐ مكافأة البطل: ترقية الباقة"
};
function rewardText(mode,note){ return note||REWARD_TXT[mode]||REWARD_TXT.manual; }
function countdown(endsAt){
  try{
    const now=new Date(new Date().toLocaleString("en-US",{timeZone:"Africa/Cairo"}));
    const end=new Date(endsAt+"T00:00:00");
    let ms=end-now; if(ms<0) ms=0;
    const d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5);
    return {d:d,h:h};
  }catch(e){ return {d:0,h:0}; }
}
function escAr(s){ return typeof esc==="function"?esc(s):String(s); }
function rowHTML(r,i,isCoach,names,leaderPts){
  const rank=i<3?`<span class="lg-rank top">${MEDALS[i]}</span>`:`<span class="lg-rank">${i+1}</span>`;
  const realName=isCoach&&r.client_id&&names&&names[r.client_id]?names[r.client_id]:null;
  const stats=`🏋️ ${r.workouts} · ✅ ${r.habit_days}${r.checkins?` · 📸 ${r.checkins}`:""}`;
  const sub=realName?escAr(realName)+" · "+stats:stats;
  const w=leaderPts>0?Math.max(4,Math.round(r.points/leaderPts*100)):4;
  return `<div class="lg-row${r.me?" me":""}" style="--i:${Math.min(i,8)}">
    ${rank}
    <div class="lg-nm"><b>${escAr(r.nickname)}${r.me?`<span class="lg-tag">انت</span>`:""}</b>
      <small>${sub}</small>
      <div class="lg-bar" style="--i:${Math.min(i,8)}"><i style="width:${w}%"></i></div></div>
    ${r.streak>0?`<span class="lg-streak">🔥 ${r.streak}</span>`:""}
    <div class="lg-pts"><b>${r.points}</b><small>نقطة</small></div>
  </div>`;
}
function podHTML(pod,names,isCoach){
  if(!pod||!pod.length) return "";
  const cell=p=>p?`<div class="lg-p${p.rank}"><div class="m">${MEDALS[p.rank-1]||"🏅"}</div>
      <b>${escAr(p.nickname)}</b><small>${p.points} نقطة${isCoach&&p.client_id&&names[p.client_id]?" · "+escAr(names[p.client_id]):""}</small></div>`:"";
  const one=pod.find(p=>p.rank===1)||pod[0], two=pod.find(p=>p.rank===2), three=pod.find(p=>p.rank===3);
  return `<div class="lg-pod">${cell(two)}${cell(one)}${cell(three)}</div>`;
}
function trophyHTML(trophies){
  if(!trophies||!trophies.length) return "";
  const byWeek={};
  trophies.forEach(t=>{ (byWeek[t.week_start]=byWeek[t.week_start]||[]).push(t); });
  const weeks=Object.keys(byWeek).sort().reverse();
  return `<div class="lg-tro"><h4>🏆 قاعة الأبطال</h4>
    ${weeks.map(w=>`<div class="lg-trow"><span class="wk">أسبوع ${w.slice(5).split("-").reverse().join("/")}</span>
      <span class="p">${byWeek[w].sort((a,b)=>a.rank-b.rank).map(t=>`${MEDALS[t.rank-1]||"🏅"} <b>${escAr(t.nickname)}</b>`).join(" · ")}</span></div>`).join("")}
  </div>`;
}
function headHTML(board,isCoach){
  const cd=countdown(board.ends_at);
  return `<div class="lg-h">
    <div class="lg-ic">🏆</div>
    <div class="lg-ht"><h3>الليج الأسبوعي${board.season>1?" · الموسم "+board.season:""}</h3>
      <small>${isCoach?"الترتيب بالأسماء الحقيقية - العملاء شايفين ألقاب بس":"نافس باسمك المستعار.. محدش يعرف مين انت 😉"}</small></div>
    <div class="lg-cd"><b>${cd.d>0?cd.d:cd.h}</b><small>${cd.d>0?"يوم":"ساعة"} على القفل</small></div>
  </div>`;
}
function explainHTML(){
  return `<details class="lg-more"><summary>إزاي بتكسب نقاط؟</summary>
    <p>تمرين مسجّل = <b style="color:#FFE680">10</b> نقاط · يوم عادات مسجّل = <b style="color:#FFE680">4</b> · متابعة أسبوعية = <b style="color:#FFE680">15</b> · كل أسبوع ملتزم (3+ تمارين) = <b style="color:#FFE680">5</b> بونص.<br>النقاط بتتسجل من يوم ما الكوتش بدأ الليج بس - القديم مش بيتحسب. الأسبوع بيقفل يوم الحد 12 بالليل والأبطال بيتعلنوا تاني يوم. اسمك الحقيقي مش بيظهر لحد أبداً.</p>
  </details>`;
}

/* ------- client: invite card (pending) ------- */
function inviteHTML(board){
  return `${headHTML(board,false)}
  <div class="lg-inv">
    <b>🔥 الكوتش بدأ الليج الأسبوعي!</b>
    <p>نافس زمايلك على التمارين والالتزام طول الأسبوع. اسمك بيظهر بلقب مستعار ومرتب بس - محدش يعرف مين انت. أول 3 بياخدوا 🥇🥈🥉 كل أسبوع.<br>${escAr(rewardText(board.reward_mode,board.reward_note))}</p>
    <div class="lg-cta"><button class="lg-btn" id="lgYes">اشترك في الليج 🔥</button><button class="lg-ghost" id="lgNo">مش دلوقتي</button></div>
  </div>`;
}
/* ------- client: compact teaser on home (joined) ------- */
function teaserHTML(board){
  const rows=board.rows||[], meIdx=rows.findIndex(r=>r.me), me=meIdx>=0?rows[meIdx]:null;
  return `${headHTML(board,false)}
  ${me?`<div class="lg-me"><div class="rk">${meIdx<3?MEDALS[meIdx]:meIdx+1}</div>
    <div class="mt"><b>${meIdx===0?"انت المتصدر يا وحش! 🔥":"مركزك "+(meIdx+1)+" من "+rows.length}</b>
    <small>${escAr(board.me.nickname)} · ${me.points} نقطة · 🔥 ${me.streak||0} يوم</small></div></div>`:""}
  ${podHTML(board.podium,{},false)}
  <button class="lg-open" id="lgOpen">افتح تبويب الليج 🏆</button>`;
}
/* ------- full league tab (joined client) ------- */
function tabHTML(board){
  const rows=board.rows||[], leaderPts=rows.length?rows[0].points:0;
  const meIdx=rows.findIndex(r=>r.me), me=meIdx>=0?rows[meIdx]:null;
  const pod=board.podium||[], first=pod.find(p=>p.rank===1)||pod[0];
  const firstIsMe=!!(first&&board.me&&first.nickname===board.me.nickname);
  return `${headHTML(board,false)}
  ${me?`<div class="lg-me"><div class="rk">${meIdx<3?MEDALS[meIdx]:meIdx+1}</div>
    <div class="mt"><b>${meIdx===0?"انت المتصدر يا وحش! 🔥":meIdx<3?"انت على المنصة! كمّل 💪":"مركزك "+(meIdx+1)+" من "+rows.length}</b>
    <small>${escAr(board.me.nickname)} · ${me.points} نقطة · 🏋️ ${me.workouts} تمرين · 🔥 ${me.streak||0} يوم</small></div></div>`:""}
  ${first?`<div class="lg-win${firstIsMe?" me":""}"><div class="crown">👑</div>
    <div class="lg-win-t"><b>${firstIsMe?"انت بطل الأسبوع اللي فات يا وحش! 🏆":"أبطال الأسبوع اللي فات"}</b>
    <small>${escAr(rewardText(board.reward_mode,board.reward_note))}</small></div></div>`:""}
  ${podHTML(pod,{},false)}
  <div class="lg-rows">${rows.map((r,i)=>rowHTML(r,i,false,null,leaderPts)).join("")}
    ${!rows.length?`<p style="text-align:center;font-family:Cairo;font-size:.78rem;color:#64748B;margin:8px 0">لسه محدش سجّل - كون أول واحد 🔥</p>`:""}</div>
  ${trophyHTML(board.trophies)}
  ${explainHTML()}`;
}
/* ------- coach card ------- */
function coachHTML(board,names){
  if(!board.started){
    return `<div class="lg-h"><div class="lg-ic">🏆</div>
      <div class="lg-ht"><h3>الليج الأسبوعي</h3><small>لسه ما بدأتش - ابدأ وكل عملائك المفعّلين هيوصلهم الدعوة</small></div></div>
      <div class="lg-inv"><b>🔥 ابدأ الليج</b>
      <p>أول ما تبدأ: النقاط بتتحسب من اللحظة دي بس (السجل القديم مش بيتحسب)، وكل عميل مفعّل هيلاقي دعوة على الرئيسية يختار يشترك أو لأ.</p>
      <div class="lg-cta"><button class="lg-btn" id="lgStart">ابدأ الليج دلوقتي 🔥</button></div></div>
      ${cfgHTML(board)}`;
  }
  const rows=board.rows||[], leaderPts=rows.length?rows[0].points:0;
  const pod=board.podium||[], first=pod.find(p=>p.rank===1)||pod[0];
  return `${headHTML(board,true)}
  ${first?`<div class="lg-win"><div class="crown">👑</div>
    <div class="lg-win-t"><b>بطل الأسبوع اللي فات: ${escAr(first.nickname)}${first.client_id&&names[first.client_id]?" ("+escAr(names[first.client_id])+")":""}</b>
    <small>${first.points} نقطة من ${first.workouts} تمرين · ${escAr(rewardText(board.reward_mode,board.reward_note))}</small></div>
    <button class="lg-grant" id="lgGrant" data-id="${first.winner_id}" ${first.reward_granted?"disabled":""}>${first.reward_granted?"اتكرم ✅":"✓ سجّل التكريم"}</button></div>`:""}
  ${podHTML(pod,names,true)}
  <div class="lg-rows">${rows.map((r,i)=>rowHTML(r,i,true,names,leaderPts)).join("")}
    ${!rows.length?`<p style="text-align:center;font-family:Cairo;font-size:.78rem;color:#64748B;margin:8px 0">مفيش مشتركين سجّلوا لسه</p>`:""}</div>
  <div class="lg-meta">الموسم ${board.season} · ${board.members} مشترك</div>
  <div class="lg-tro"><h4>⚙️ إدارة الليج</h4>
    <div class="lg-cta"><button class="lg-ghost" id="lgRestart">🔁 ابدأ موسم جديد (بيقفل الحالي وبيبعت دعوات جديدة)</button></div></div>
  ${trophyHTML(board.trophies)}
  ${cfgHTML(board)}`;
}
function cfgHTML(board){
  return `<div class="lg-cfg"><h4>🎁 مكافأة البطل الأسبوعية</h4>
    <div class="lg-opts" id="lgOpts">
      <div class="lg-opt${(!board.reward_mode||board.reward_mode==="manual")?" on":""}" data-m="manual">🎖 الكوتش يكرّم يدوياً</div>
      <div class="lg-opt${board.reward_mode==="free_week"?" on":""}" data-m="free_week">🎁 أسبوع مجاني</div>
      <div class="lg-opt${board.reward_mode==="plan_upgrade"?" on":""}" data-m="plan_upgrade">⭐ ترقية الباقة</div>
    </div>
    <button class="lg-save" id="lgSave">حفظ نوع المكافأة</button></div>`;
}

/* ------- wiring ------- */
function wireCfg(host,board){
  const optsBox=host.querySelector("#lgOpts"), save=host.querySelector("#lgSave");
  if(!optsBox||!save) return;
  let mode=board.reward_mode||"manual";
  optsBox.querySelectorAll(".lg-opt").forEach(o=>o.onclick=()=>{
    optsBox.querySelectorAll(".lg-opt").forEach(x=>x.classList.remove("on"));
    o.classList.add("on"); mode=o.dataset.m;
  });
  save.onclick=async e=>{
    const b=e.currentTarget; b.disabled=true; b.textContent="…";
    try{
      const { error }=await sb.rpc("league_set_config",{p_mode:mode});
      if(error) throw error;
      b.textContent="✅ اتحفظ"; setTimeout(()=>{ b.textContent="حفظ نوع المكافأة"; b.disabled=false; },1600);
    }catch(err){ b.textContent="حفظ نوع المكافأة"; b.disabled=false; toast("تعذر الحفظ - جرب تاني"); }
  };
}
function wireStart(host,btnId,after){
  const b=host.querySelector(btnId); if(!b) return;
  b.onclick=async()=>{
    b.disabled=true; b.textContent="…";
    try{
      const { data, error }=await sb.rpc("league_start");
      if(error||!data||!data.ok) throw error||new Error("fail");
      toast("🔥 الليج بدأ - الدعوات وصلت للعملاء");
      if(after) after();
    }catch(err){ b.disabled=false; b.textContent="ابدأ الليج دلوقتي 🔥"; toast("تعذر بدء الليج - اتأكد إن قاعدة البيانات اتحدثت"); }
  };
}
function wireRespond(host,after){
  const yes=host.querySelector("#lgYes"), no=host.querySelector("#lgNo");
  const go=async(join,b)=>{
    b.disabled=true; b.textContent="…";
    try{
      const { data, error }=await sb.rpc("league_respond",{p_join:join});
      if(error||!data||!data.ok) throw error||new Error("fail");
      if(join){ toast("🔥 اتسجلت في الليج - بالتوفيق يا بطل"); if(typeof burst==="function") burst(); }
      after(join);
    }catch(err){ b.disabled=false; b.textContent=join?"اشترك في الليج 🔥":"مش دلوقتي"; toast("تعذر الحفظ - جرب تاني"); }
  };
  if(yes) yes.onclick=()=>go(true,yes);
  if(no) no.onclick=()=>go(false,no);
}
function wireGrant(host){
  const grant=host.querySelector("#lgGrant");
  if(!grant||grant.disabled) return;
  grant.onclick=async e=>{
    const b=e.currentTarget; b.disabled=true; b.textContent="…";
    try{
      const { error }=await sb.rpc("league_grant_reward",{p_winner_id:+b.dataset.id});
      if(error) throw error;
      b.textContent="اتكرم ✅"; toast("✅ اتسجل التكريم");
    }catch(err){ b.disabled=false; b.textContent="✓ سجّل التكريم"; toast("تعذر الحفظ - جرب تاني"); }
  };
}

/* ------- module state + fetch ------- */
let LG=null;                 // last board payload
async function fetchBoard(){
  try{
    const { data, error }=await sb.rpc("league_board");
    if(error||!data||data.error) return null;
    return data;
  }catch(e){ return null; }
}
function joinedNow(){ return !!(LG&&LG.started&&LG.me&&LG.me.status==="joined"); }

/* nav icon for the league tab */
ICON.league='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4a1 1 0 0 0-1 1c0 2 1.5 3.5 4 3.5M17 6h3a1 1 0 0 1 1 1c0 2-1.5 3.5-4 3.5"/></svg>';

/* add the "الليج" tab for joined clients (beside التمرين والتغذية) */
if(typeof tabs==="function"&&!tabs._lg){
  const _tb=tabs;
  tabs=function(){
    const t=_tb();
    if(S.me&&S.me.role==="client"&&S._lgNav&&!t.some(x=>x[0]==="league")){
      const i=t.findIndex(x=>x[0]==="food");
      t.splice(i>=0?i+1:t.length,0,["league","الليج"]);
    }
    return t;
  };
  tabs._lg=1;
}

/* full league tab view */
async function viewLeague(el){
  el.innerHTML=`<p class="muted" style="text-align:center;padding:30px 0">جارٍ تحميل الليج…</p>`;
  LG=await fetchBoard();
  if(!joinedNow()){ S.tab="home"; render(); return; }
  el.innerHTML=`<div class="lg-card">${tabHTML(LG)}</div>`;
  const w=LG.podium&&LG.podium.find(p=>p.rank===1);
  try{
    if(w&&LG.me&&w.nickname===LG.me.nickname){
      const key="mofit_league_win_"+w.week_start;
      if(!localStorage.getItem(key)){ localStorage.setItem(key,"1"); if(typeof burst==="function") setTimeout(burst,450); }
    }
  }catch(e){}
}

/* client home: invite / teaser card; league tab intercept */
if(typeof viewHome==="function"&&!viewHome._lg){
  const _vh=viewHome;
  viewHome=async function(el){
    if(S.me&&S.me.role==="client"&&S.tab==="league") return viewLeague(el);
    await _vh(el);
    if(!S.me||S.me.role!=="client") return;
    if(el.querySelector(".lg-card")) return;
    const host=document.createElement("div");
    const anchor=el.querySelector("#hStreak")||el.querySelector("#hFlame")||el.firstChild;
    if(anchor&&anchor.parentNode) anchor.after(host); else el.prepend(host);
    LG=await fetchBoard();
    const st=LG&&LG.started?LG.me.status:null;
    if(st==="pending"){
      host.innerHTML=`<div class="lg-card">${inviteHTML(LG)}</div>`;
      wireRespond(host,()=>{ host.remove(); render(); });
    }else if(st==="joined"){
      host.innerHTML=`<div class="lg-card">${teaserHTML(LG)}</div>`;
      const o=host.querySelector("#lgOpen");
      if(o) o.onclick=()=>{ S.tab="league"; render(); window.scrollTo(0,0); };
    }else{ host.remove(); }
    /* reveal/hide the nav tab if membership changed */
    const jn=joinedNow();
    if(!!S._lgNav!==jn){ S._lgNav=jn; render(); }
  };
  viewHome._lg=1;
}

/* coach clients page: start button + board with real names */
if(typeof viewClients==="function"&&!viewClients._lg){
  const _vc=viewClients;
  viewClients=async function(el){
    await _vc(el);
    if(el.querySelector(".lg-card")) return;
    const host=document.createElement("div");
    const anchor=el.querySelector("#ciov")||el.querySelector("#wrep");
    if(anchor&&anchor.parentNode) anchor.after(host); else el.appendChild(host);
    const board=await fetchBoard();
    if(!board){ host.remove(); return; }
    const names=Object.fromEntries((S.coachClients||[]).map(c=>[c.id,c.full_name||c.email||"عميل"]));
    const paint=()=>{ host.innerHTML=`<div class="lg-card">${coachHTML(board,names)}</div>`;
      wireCfg(host,board); wireGrant(host);
      wireStart(host,"#lgStart",paint); wireStart(host,"#lgRestart",paint);
    };
    paint();
  };
  viewClients._lg=1;
}

/* harness/test exports */
window.leagueHTML=function(board,opts){
  opts=opts||{};
  if(opts.coach) return coachHTML(board,opts.names||{});
  if(board.started&&board.me&&board.me.status==="pending") return inviteHTML(board);
  if(opts.tab) return tabHTML(board);
  return teaserHTML(board);
};
window.leagueAfter=function(host){};
})();
