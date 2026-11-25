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
  if(!rows.length){ host.innerHTML=head("لسه مفيش خطوات متسجلة")+`<p class="hint">أول ما عميل يربط جوجل أو يشغّل اختصار الآيفون هتلاقي خطواته هنا.</p>`; return; }
  const LIM=6; let all=false;
  const draw=()=>{
    const list=all?rows:rows.slice(0,LIM);
    host.innerHTML=head(rows.length+" عميل"+(none?" · "+none+" من غير خطوات":""))+
      list.map(({c,r})=>{ const old=daysBetween(r.log_date,today())>=2;
        return `<div class="client" data-stp="${c.id}" style="${old?"opacity:.6":""}"><div class="av">${initials(c)}</div>
          <div class="nm"><b>${esc(c.full_name||c.email||"—")}</b><small>${when(r.log_date)}${c.steps_goal?" · الهدف "+N(c.steps_goal):""}</small>${bar(r.steps,c.steps_goal)}</div>
          <div style="text-align:center"><b class="num">${N(r.steps)}</b><div class="muted" style="font-size:.66rem">خطوة</div></div></div>`; }).join("")+
      (rows.length>LIM?`<button class="btn sm ghost block" id="stpMore" style="margin-top:8px">${all?"أقل":"عرض الكل ("+rows.length+")"}</button>`:"");
    host.querySelectorAll("[data-stp]").forEach(el=>el.onclick=async()=>{ const c=C.find(x=>x.id===el.dataset.stp); if(!c) return; await openClient(c); S.tab="habits"; render(); window.scrollTo(0,0); });
    const m=host.querySelector("#stpMore"); if(m) m.onclick=()=>{ all=!all; draw(); };
  };
  draw();
}

/* Client home: my own latest steps and the last 7 days. */
async function clientCard(host,p,title){
  if(!host||!p) return;
  const { data, error } = await sb.from("habits").select("log_date,steps").eq("client_id",p.id).not("steps","is",null).gte("log_date",addDays(today(),-6)).order("log_date",{ascending:false});
  if(!host.isConnected) return;
  const rows=(data||[]).filter(r=>+r.steps>0);
  if(error||!rows.length){ host.innerHTML=""; return; }
  const last=rows[0], goal=+p.steps_goal||0, by=Object.fromEntries(rows.map(r=>[r.log_date,+r.steps]));
  const days=[...Array(7)].map((_,i)=>addDays(today(),i-6));
  const mx=Math.max(goal,...days.map(d=>by[d]||0),1);
  const pc=pctOf(last.steps,goal);
  host.innerHTML=`<div class="card"><div class="card-h"><div class="ic acc">👣</div><h2>${title||"خطواتك"}<small>${when(last.log_date)}</small></h2>${pc!==null?`<span class="pill ${pc>=100?"acc":""}">${pc}%</span>`:""}</div>
    <div style="display:flex;align-items:baseline;gap:6px"><b class="num" style="font-size:2rem">${N(last.steps)}</b><span class="muted">خطوة${goal?" من "+N(goal):""}</span></div>
    ${bar(last.steps,goal)}
    <div style="display:flex;align-items:flex-end;gap:6px;height:46px;margin-top:12px">${days.map(d=>{ const v=by[d]||0; return `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%" title="${d}: ${N(v)}"><i style="display:block;border-radius:4px;background:${d===today()?"#F97316":"#CBD5E1"};height:${v?Math.max(6,Math.round(v/mx*100)):3}%;${v?"":"opacity:.45"}"></i></div>`; }).join("")}</div></div>`;
}
window.stepsCoachCard=coachCard;
window.stepsClientCard=clientCard;
})();
