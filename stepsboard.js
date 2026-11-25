/* Steps board: latest steps per client, from either source (iPhone Shortcut or Google Health).
   Both land in habits.steps, so we only read that column. Read-only, no schema change. */
(function(){
const N=n=>(+n).toLocaleString("en-US");
const SINCE=14;
function when(ymd){
  const d=daysBetween(ymd,today());
  if(d<=0) return "النهارده";
  if(d===1) return "امبارح";
  return "من "+d+" أيام";
}
function pctOf(steps,goal){ return goal>0?Math.max(0,Math.min(100,Math.round(steps/goal*100))):null; }
function bar(steps,goal){
  const p=pctOf(steps,goal); if(p===null) return "";
  return `<div class="bar" style="height:5px"><i style="width:${p}%"></i></div>`;
}

/* Coach main menu: every active client's latest steps. */
async function coachCard(host,C){
  if(!host) return;
  const act=(C||[]).filter(c=>c.active);
  if(!act.length){ host.innerHTML=""; host.hidden=true; return; }
  const head=s=>`<div class="card-h"><div class="ic acc">👣</div><h2>خطوات العملاء<small>${s}</small></h2></div>`;
  host.innerHTML=head("بيحمّل…");
  const { data, error } = await sb.from("habits").select("client_id,log_date,steps").not("steps","is",null).gte("log_date",addDays(today(),-SINCE)).order("log_date",{ascending:false}).range(0,4999);
  if(!host.isConnected) return;
  if(error){ host.innerHTML=""; host.hidden=true; return; }
  const latest={};
  (data||[]).forEach(r=>{ if(+r.steps>0 && !latest[r.client_id]) latest[r.client_id]=r; });
  const rows=act.filter(c=>latest[c.id]).map(c=>({c,r:latest[c.id]}))
    .sort((a,b)=>b.r.log_date.localeCompare(a.r.log_date)||b.r.steps-a.r.steps);
  const none=act.length-rows.length;
  const idle=act.filter(c=>!latest[c.id]);
  const idleHTML=()=>idle.length?`<div class="stp-need" style="margin-top:10px;padding:10px;border-radius:12px;background:#FFF7ED;border:1px solid #FED7AA">
      <b style="font-size:.8rem;color:#9A3412">⚠ محتاجين تفعيل (${idle.length}) <span style="font-weight:600">· مفيش خطوات بتوصل، ابعتلهم يربطوا جوجل أو الاختصار</span></b>
      ${idle.map(c=>`<div class="client" data-need="${c.id}" style="padding:6px 0"><div class="av">${initials(c)}</div><div class="nm"><b>${esc(c.full_name||c.email||"—")}</b></div><span class="pill acc">محتاج تفعيل</span></div>`).join("")}</div>`:"";
  const bindNeed=host=>host.querySelectorAll("[data-need]").forEach(el=>el.onclick=async()=>{ const c=C.find(x=>x.id===el.dataset.need); if(!c) return; await openClient(c); S.tab="habits"; render(); window.scrollTo(0,0); });
  if(!rows.length){ host.innerHTML=head("لسه مفيش خطوات متسجلة")+idleHTML(); bindNeed(host); return; }
  const LIM=6; let all=false;
  const draw=()=>{
    const list=all?rows:rows.slice(0,LIM);
    host.innerHTML=head(rows.length+" عميل"+(none?" · "+none+" محتاج تفعيل":""))+
      list.map(({c,r})=>{ const old=daysBetween(r.log_date,today())>=2;
        return `<div class="client" data-stp="${c.id}" style="${old?"opacity:.6":""}"><div class="av">${initials(c)}</div>
          <div class="nm"><b>${esc(c.full_name||c.email||"—")}</b><small>${when(r.log_date)}${c.steps_goal?" · الهدف "+N(c.steps_goal):""}${daysBetween(r.log_date,today())>=3?` · <span style="color:#C2410C;font-weight:700">⚠ واقف من ${daysBetween(r.log_date,today())} أيام</span>`:""}</small>${bar(r.steps,c.steps_goal)}</div>
          <div style="text-align:center"><b class="num">${N(r.steps)}</b><div class="muted" style="font-size:.66rem">خطوة</div></div></div>`; }).join("")+
      (rows.length>LIM?`<button class="btn sm ghost block" id="stpMore" style="margin-top:8px">${all?"أقل":"عرض الكل ("+rows.length+")"}</button>`:"");
    host.querySelectorAll("[data-stp]").forEach(el=>el.onclick=async()=>{ const c=C.find(x=>x.id===el.dataset.stp); if(!c) return; await openClient(c); S.tab="habits"; render(); window.scrollTo(0,0); });
    host.insertAdjacentHTML("beforeend",idleHTML()); bindNeed(host);
    const m=host.querySelector("#stpMore"); if(m) m.onclick=()=>{ all=!all; draw(); };
  };
  draw();
}

/* Client home: my own latest steps and the last 7 days (dark theme, matches the hero cards). */
const DAYN=["أحد","اتنين","تلات","أربع","خميس","جمعة","سبت"];
function css(){ if(document.getElementById("stpCss")) return; const st=document.createElement("style"); st.id="stpCss"; st.textContent=`
.stp-c{position:relative;overflow:hidden;margin-bottom:14px;border-radius:22px;padding:18px 16px 14px;color:#fff;background:radial-gradient(120% 90% at 100% 0%,rgba(249,115,22,.22),transparent 55%),linear-gradient(135deg,#0F172A,#1E293B);box-shadow:0 10px 28px -12px rgba(15,23,42,.6)}
.stp-h{display:flex;align-items:center;gap:10px}
.stp-ic{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:18px;background:linear-gradient(135deg,#F97316,#FB923C);box-shadow:0 6px 16px -4px rgba(249,115,22,.7)}
.stp-t{flex:1}.stp-t b{display:block;font-size:.95rem}.stp-t small{color:#94A3B8;font-size:.72rem;font-weight:700}
.stp-pill{padding:6px 11px;border-radius:99px;font-weight:800;font-size:.78rem;background:rgba(249,115,22,.16);color:#FDBA74;border:1px solid rgba(249,115,22,.4)}
.stp-pill.ok{background:linear-gradient(135deg,#F97316,#FB923C);color:#fff;border-color:transparent}
.stp-n{display:flex;align-items:baseline;gap:8px;margin:14px 0 10px}
.stp-n b{font-size:2.7rem;line-height:1;font-weight:900;letter-spacing:-1px}
.stp-n span{color:#94A3B8;font-size:.82rem;font-weight:700}
.stp-bar{height:9px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden}
.stp-bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#F97316,#FDBA74);box-shadow:0 0 12px rgba(249,115,22,.7)}
.stp-ch{position:relative;display:flex;align-items:flex-end;gap:7px;height:96px;margin-top:16px}
.stp-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px}
.stp-col u{display:block;width:100%;border-radius:8px 8px 4px 4px;text-decoration:none;background:linear-gradient(180deg,#475569,#334155)}
.stp-col.hit u{background:linear-gradient(180deg,#FDBA74,#F97316)}
.stp-col.td u{background:linear-gradient(180deg,#FB923C,#EA580C);box-shadow:0 0 16px rgba(249,115,22,.65)}
.stp-col.no u{background:rgba(255,255,255,.08)}
.stp-col small{font-size:.62rem;color:#94A3B8;font-weight:700}.stp-col.td small{color:#FDBA74}
.stp-gl{position:absolute;left:0;right:0;border-top:1px dashed rgba(253,186,116,.45)}
.stp-gl em{position:absolute;inset-inline-start:0;top:-15px;font-style:normal;font-size:.6rem;color:#FDBA74;font-weight:700}
.stp-warn{margin-top:12px;font-size:.78rem;color:#FDBA74;font-weight:700}
`; document.head.appendChild(st); }
async function clientCard(host,p,title){
  if(!host||!p) return; css();
  const { data, error } = await sb.from("habits").select("log_date,steps").eq("client_id",p.id).not("steps","is",null).gte("log_date",addDays(today(),-6)).order("log_date",{ascending:false});
  if(!host.isConnected) return;
  if(error){ host.innerHTML=""; return; }
  const rows=(data||[]).filter(r=>+r.steps>0);
  if(!rows.length){ host.innerHTML=title?`<div class="stp-c"><div class="stp-h"><div class="stp-ic">👣</div><div class="stp-t"><b>${title}</b><small>آخر 7 أيام</small></div><span class="stp-pill">محتاج تفعيل</span></div><div class="stp-warn">⚠ مفيش خطوات بتوصل من العميل ده. محتاج يربط جوجل (أندرويد) أو يكمّل إعداد الاختصار (آيفون).</div></div>`:""; return; }
  const last=rows[0], goal=+p.steps_goal||10000, by=Object.fromEntries(rows.map(r=>[r.log_date,+r.steps]));
  const days=[...Array(7)].map((_,i)=>addDays(today(),i-6));
  const mx=Math.max(goal,...days.map(d=>by[d]||0));
  const raw=last.steps/goal*100, pc=raw>=100?100:Math.max(1,Math.round(raw)), CH=70;
  host.innerHTML=`<div class="stp-c"><div class="stp-h"><div class="stp-ic">👣</div><div class="stp-t"><b>${title||"خطواتك"}</b><small>${when(last.log_date)}</small></div><span class="stp-pill ${pc>=100?"ok":""}">${pc>=100?"🔥 ":""}${pc}% من الهدف</span></div>
    <div class="stp-n"><b>${N(last.steps)}</b><span>خطوة · الهدف ${N(goal)}</span></div>
    <div class="stp-bar"><i style="width:${Math.max(3,Math.min(100,raw))}%"></i></div>
    <div class="stp-ch"><div class="stp-gl" style="bottom:${Math.round(goal/mx*CH)+19}px"><em>الهدف</em></div>${days.map(d=>{ const v=by[d]||0, h=v?Math.max(8,Math.round(v/mx*CH)):4, cl=d===today()?"td":v>=goal?"hit":!v?"no":""; return `<div class="stp-col ${cl}" title="${d}: ${N(v)}"><u style="height:${h}px"></u><small>${DAYN[new Date(d+"T12:00:00").getDay()]}</small></div>`; }).join("")}</div></div>`;
}
window.stepsCoachCard=coachCard;
window.stepsClientCard=clientCard;
})();
