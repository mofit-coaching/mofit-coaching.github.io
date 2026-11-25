/* ======================================================================
   WEEKLY LEAGUE (lg-*): clients compete every week (Mon-Sun) on
   workouts, habit check-ins and weekly check-ins. The winner is crowned
   on Monday. Clients appear to each other ONLY as auto-generated fun
   nicknames - never real names or photos. The coach sees real names and
   grants the weekly reward (reward mode is a config Mohammed picks
   before launch; default "coach grants manually").

   One RPC (league_board) returns standings + latest winner + config.
   If the SQL is not applied yet the card hides itself silently, so the
   app never breaks before the DB owner runs league.sql.

   Scoped CSS injected here (lg-* only). styles.css / design.css untouched.
   The Flame's visual language: navy #0B1220, molten #FF5A0A/#FF8A3D,
   gold #FFC21A/#FFE680, Anton + Kufi + Cairo. Entrance animations play
   once then rest; nothing loops; motion off under reduced-motion.
   No new globals besides window.leagueHTML / window.leagueAfter.
   leagueHTML(board, opts) - opts={coach, names:{id:name}, capture:true}
   leagueAfter(host, board) - wires coach actions + one-time winner burst.
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
.lg-win{display:flex;align-items:center;gap:12px;margin-top:14px;padding:12px 14px;border-radius:18px;
  background:rgba(255,179,0,.09);border:1px solid rgba(255,194,26,.38);animation:lgIn .7s cubic-bezier(.2,.8,.2,1) .1s both}
.lg-win .crown{font-size:1.7rem;filter:drop-shadow(0 0 10px rgba(255,179,0,.7));animation:lgCrown .7s cubic-bezier(.2,1.5,.4,1) .25s both}
.lg-win-t{flex:1;min-width:0}
.lg-win-t b{display:block;font-family:"Noto Kufi Arabic","Cairo",sans-serif;font-weight:700;font-size:.92rem;
  background:linear-gradient(100deg,#FFB300,#FFE680);-webkit-background-clip:text;background-clip:text;color:transparent}
.lg-win-t small{display:block;font-family:"Cairo",sans-serif;font-size:.74rem;color:#94A3B8;margin-top:3px}
.lg-win.me{background:linear-gradient(135deg,rgba(255,90,10,.22),rgba(255,179,0,.12));border-color:rgba(255,194,26,.65);
  box-shadow:0 0 26px rgba(255,179,0,.28)}
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
@keyframes lgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes lgCrown{0%{transform:scale(.4) rotate(-14deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes lgBar{from{width:0}}
@media(prefers-reduced-motion:reduce){
  .lg-card,.lg-win,.lg-row,.lg-win .crown{animation:none!important}
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
  // endsAt = next Monday 00:00 Africa/Cairo (date string). Static text, no timers.
  try{
    const now=new Date(new Date().toLocaleString("en-US",{timeZone:"Africa/Cairo"}));
    const end=new Date(endsAt+"T00:00:00");
    let ms=end-now; if(ms<0) ms=0;
    const d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5);
    return {d:d,h:h,label:d>0?d+" يوم":h+" ساعة",sub:d>0?"و "+h+" ساعة":"على القفل"};
  }catch(e){ return {d:0,h:0,label:"قريب",sub:""}; }
}
function rowHTML(r,i,top,isCoach,names,leaderPts){
  const rank=i<3?`<span class="lg-rank top">${MEDALS[i]}</span>`:`<span class="lg-rank">${i+1}</span>`;
  const realName=isCoach&&r.client_id&&names&&names[r.client_id]?names[r.client_id]:null;
  const stats=`🏋️ ${r.workouts} · ✅ ${r.habit_days}${r.checkins?` · 📸 ${r.checkins}`:""}`;
  const sub=realName?esc(realName)+" · "+stats:stats;
  const w=leaderPts>0?Math.max(4,Math.round(r.points/leaderPts*100)):4;
  return `<div class="lg-row${r.me?" me":""}" style="--i:${Math.min(i,8)}">
    ${rank}
    <div class="lg-nm"><b>${esc(r.nickname)}${r.me?`<span class="lg-tag">انت</span>`:""}</b>
      <small>${sub}</small>
      <div class="lg-bar" style="--i:${Math.min(i,8)}"><i style="width:${w}%"></i></div></div>
    ${r.streak>0?`<span class="lg-streak">🔥 ${r.streak}</span>`:""}
    <div class="lg-pts"><b>${r.points}</b><small>نقطة</small></div>
  </div>`;
}

/* board → card HTML. opts={coach:boolean, names:{client_id:full_name}} */
function leagueHTML(board, opts){
  opts=opts||{};
  const isCoach=!!opts.coach, names=opts.names||{};
  const rows=board.rows||[], cd=countdown(board.ends_at);
  const leaderPts=rows.length?rows[0].points:0;
  const w=board.winner;
  const winnerName=w&&isCoach&&w.client_id&&names[w.client_id]?names[w.client_id]:null;
  const meIdx=rows.findIndex(r=>r.me);
  const meRow=meIdx>=0?rows[meIdx]:null;
  const show=rows.slice(0,5);
  let prevWs=null;
  try{ const d=new Date(board.week_start+"T00:00:00Z"); d.setUTCDate(d.getUTCDate()-7); prevWs=d.toISOString().slice(0,10); }catch(e){}
  if(w) w.isMe=!!(board.me&&board.me.nickname&&w.nickname===board.me.nickname&&w.week_start===prevWs);
  return `<div class="lg-h">
      <div class="lg-ic">🏆</div>
      <div class="lg-ht"><h3>الليج الأسبوعي</h3><small>${isCoach?"الترتيب بالأسماء الحقيقية - العملاء شايفين ألقاب بس":"نافس باسمك المستعار.. محدش يعرف مين انت 😉"}</small></div>
      <div class="lg-cd"><b>${cd.d>0?cd.d:cd.h}</b><small>${cd.d>0?"يوم":"ساعة"} على القفل</small></div>
    </div>
    ${w?`<div class="lg-win${w.isMe?" me":""}">
      <div class="crown">👑</div>
      <div class="lg-win-t">
        <b>${w.isMe?"انت بطل الأسبوع اللي فات يا وحش! 🏆":"بطل الأسبوع اللي فات: "+esc(w.nickname)}</b>
        <small>${w.points} نقطة من ${w.workouts} تمرين${winnerName?" · "+esc(winnerName):""} · ${esc(rewardText(board.reward_mode,board.reward_note))}</small>
      </div>
      ${isCoach?`<button class="lg-grant" id="lgGrant" data-id="${w.winner_id}" ${w.reward_granted?"disabled":""}>${w.reward_granted?"اتكرم ✅":"✓ سجّل التكريم"}</button>`:""}
    </div>`:""}
    <div class="lg-rows">
      ${show.map((r,i)=>rowHTML(r,i,true,isCoach,names,leaderPts)).join("")}
      ${meRow&&meIdx>=5?`<div class="lg-nm" style="text-align:center"><small>· · ·</small></div>`+rowHTML(meRow,meIdx,false,isCoach,names,leaderPts):""}
      ${!rows.length?`<p style="text-align:center;font-family:Cairo;font-size:.78rem;color:#64748B;margin:8px 0">لسه محدش سجّل الأسبوع ده - كون أول واحد 🔥</p>`:""}
    </div>
    <details class="lg-more"><summary>إزاي بتكسب نقاط؟</summary>
      <p>تمرين مسجّل = <b style="color:#FFE680">10</b> نقاط · يوم عادات مسجّل = <b style="color:#FFE680">4</b> · متابعة أسبوعية = <b style="color:#FFE680">15</b> · كل أسبوع ملتزم (3+ تمارين) = <b style="color:#FFE680">5</b> بونص.<br>الأسبوع بيقفل يوم الحد 12 بالليل والبطل بيتعلن تاني يوم. اسمك الحقيقي مش بيظهر لحد أبداً.</p>
    </details>
    ${isCoach?`<div class="lg-cfg">
      <h4>🎁 مكافأة البطل الأسبوعية</h4>
      <div class="lg-opts" id="lgOpts">
        <div class="lg-opt${board.reward_mode==="manual"?" on":""}" data-m="manual">🎖 الكوتش يكرّم يدوياً</div>
        <div class="lg-opt${board.reward_mode==="free_week"?" on":""}" data-m="free_week">🎁 أسبوع مجاني</div>
        <div class="lg-opt${board.reward_mode==="plan_upgrade"?" on":""}" data-m="plan_upgrade">⭐ ترقية الباقة</div>
      </div>
      <button class="lg-save" id="lgSave">حفظ نوع المكافأة</button>
    </div>`:""}`;
}

/* post-render wiring: coach actions + one-time winner celebration for the client */
function leagueAfter(host, board, opts){
  opts=opts||{};
  if(!host||!board) return;
  const grant=host.querySelector("#lgGrant");
  if(grant&&!grant.disabled){
    grant.onclick=async e=>{
      const b=e.currentTarget; b.disabled=true; b.textContent="…";
      try{
        const { error }=await sb.rpc("league_grant_reward",{p_winner_id:+b.dataset.id});
        if(error) throw error;
        b.textContent="اتكرم ✅"; toast("✅ اتسجل التكريم");
      }catch(err){ b.disabled=false; b.textContent="✓ سجّل التكريم"; toast("تعذر الحفظ - جرب تاني"); }
    };
  }
  const optsBox=host.querySelector("#lgOpts"), save=host.querySelector("#lgSave");
  if(optsBox&&save){
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
  // one-time celebration when the signed-in client sees they won last week
  try{
    if(!opts.coach&&board.winner&&board.winner.isMe){
      const key="mofit_league_win_"+board.winner.week_start;
      if(!localStorage.getItem(key)){
        localStorage.setItem(key,"1");
        if(typeof burst==="function") setTimeout(burst,450);
      }
    }
  }catch(e){}
}

async function fetchBoard(){
  try{
    const { data, error }=await sb.rpc("league_board");
    if(error||!data||data.error) return null;
    return data;
  }catch(e){ return null; }
}

/* ---- client home: league card under the streak card ---- */
if(typeof viewHome==="function"&&!viewHome._lg){
  const _vh=viewHome;
  viewHome=async function(el){
    await _vh(el);
    if(!S.me||S.me.role!=="client") return;
    if(el.querySelector(".lg-card")) return;
    const host=document.createElement("div");
    const anchor=el.querySelector("#hStreak")||el.querySelector("#hFlame")||el.firstChild;
    if(anchor&&anchor.parentNode) anchor.after(host); else el.prepend(host);
    const board=await fetchBoard();
    if(!board){ host.remove(); return; }
    host.innerHTML=`<div class="lg-card">${leagueHTML(board,{coach:false})}</div>`;
    leagueAfter(host,board,{coach:false});
  };
  viewHome._lg=1;
}

/* ---- coach clients page: league card with real names + reward controls ---- */
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
    host.innerHTML=`<div class="lg-card">${leagueHTML(board,{coach:true,names:names})}</div>`;
    leagueAfter(host,board,{coach:true});
  };
  viewClients._lg=1;
}

window.leagueHTML=leagueHTML;
window.leagueAfter=leagueAfter;
})();
