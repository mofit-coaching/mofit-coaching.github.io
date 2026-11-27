/* ======================================================================
   MOFIT RANKS (rk-*): the Arabic rank ladder for the client Home.
   Rank is computed ONLY from what the client actually logged: total
   tonnage (sum of reps x weight over every saved set) and the number of
   distinct weeks trained. Bodyweight sets (no weight) count as sets, never
   as kilos. No estimates, no invented numbers.
   rankCardHTML(p) -> Promise<html>   mounted into #hRank on Home.
   ====================================================================== */
(function(){
if(window.__mofitRanks) return; window.__mofitRanks=1;

const RANKS=[
  {n:"مبتدئ",  min:0,       tag:"أول خطوة", ic:"🌱"},
  {n:"متمرس",  min:5000,    tag:"الوزن بقى عادة", ic:"🧱"},
  {n:"وحش",    min:15000,   tag:"الجيم عرفك", ic:"🐺"},
  {n:"دبابة",  min:40000,   tag:"مفيش يوم بيفوت", ic:"🛡"},
  {n:"حديد",   min:80000,   tag:"جسمك بقى حديد", ic:"⚙"},
  {n:"أسطورة", min:150000,  tag:"الناس بتسألك", ic:"👑"},
  {n:"تيتان",  min:300000,  tag:"مش طبيعي", ic:"🗿"}
];

const st=document.createElement("style"); st.textContent=`
.rk-card{position:relative;overflow:hidden;border-radius:22px;margin-bottom:14px;padding:16px;color:#fff;
  background:radial-gradient(300px 200px at 88% -30px,rgba(255,179,71,.26),transparent 62%),
             radial-gradient(260px 220px at 0% 110%,rgba(91,108,255,.16),transparent 60%),
             linear-gradient(170deg,#0B1220,#111C33 55%,#0B1220);
  border:1px solid rgba(255,255,255,.09);box-shadow:0 18px 40px -22px rgba(11,18,32,.6)}
.rk-top{display:flex;align-items:center;gap:12px}
.rk-badge{position:relative;flex:none;width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-size:1.6rem;
  background:linear-gradient(135deg,#FF5A0A,#FFB347);box-shadow:0 10px 24px -8px rgba(255,90,10,.7),inset 0 0 0 1px rgba(255,255,255,.18);
  animation:rkIn .7s cubic-bezier(.2,.9,.2,1) both}
.rk-badge::after{content:"";position:absolute;inset:0;border-radius:18px;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.55) 48%,transparent 62%);
  background-size:220% 100%;animation:rkShine 3.4s ease-in-out infinite}
.rk-meta{flex:1;min-width:0}
.rk-k{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#FFB347;font-weight:700}
.rk-name{font:800 1.45rem/1.15 Anton,Outfit,system-ui,sans-serif;letter-spacing:.02em;margin-top:2px}
.rk-tag{font-size:11.5px;color:#94A3B8;margin-top:2px}
.rk-num{flex:none;text-align:center}
.rk-num b{display:block;font:800 1.05rem/1 Anton,Outfit,system-ui,sans-serif;color:#FFB347}
.rk-num span{font-size:9.5px;color:#94A3B8}
.rk-bar{position:relative;height:9px;border-radius:99px;background:rgba(255,255,255,.1);margin-top:14px;overflow:hidden}
.rk-bar i{position:absolute;inset-inline-start:0;top:0;bottom:0;border-radius:99px;width:0;
  background:linear-gradient(90deg,#FF5A0A,#FFB347);box-shadow:0 0 14px rgba(255,140,40,.6);
  transition:width 1.1s cubic-bezier(.2,.9,.2,1)}
.rk-next{display:flex;justify-content:space-between;gap:10px;margin-top:8px;font-size:11px;color:#94A3B8}
.rk-next b{color:#E7EDF7;font-weight:700}
.rk-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.rk-s{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:9px 8px;text-align:center}
.rk-s b{display:block;font:800 .98rem/1.2 Anton,Outfit,system-ui,sans-serif;color:#fff}
.rk-s span{display:block;font-size:9.5px;color:#94A3B8;margin-top:3px;line-height:1.35}
.rk-note{margin:12px 0 0;font-size:10.5px;line-height:1.7;color:#7C8AA0}
.rk-empty{margin:8px 0 0;font-size:12px;line-height:1.8;color:#94A3B8}
.rk-ladder{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
.rk-step{flex:1;min-width:34px;height:5px;border-radius:99px;background:rgba(255,255,255,.1)}
.rk-step.on{background:linear-gradient(90deg,#FF5A0A,#FFB347)}
@keyframes rkIn{from{opacity:0;transform:scale(.7) rotate(-8deg)}}
@keyframes rkShine{0%,72%{background-position:220% 0}100%{background-position:-40% 0}}
@media(prefers-reduced-motion:reduce){.rk-badge,.rk-badge::after{animation:none}.rk-bar i{transition:none}}
`;

function fmtNum(n){ return (Math.round(n)||0).toLocaleString("en-US"); }
function tons(kg){ return kg>=1000? (kg/1000).toFixed(kg>=10000?0:1)+" طن" : fmtNum(kg)+" كجم"; }

function compute(sets){
  let kg=0, cnt=0, wks={};
  (sets||[]).forEach(s=>{
    if(s.reps==null && s.weight==null) return;
    cnt++;
    wks[s.week]=1;
    if(s.reps!=null && s.weight!=null) kg += (+s.reps||0)*(+s.weight||0);
  });
  const i=Math.max(0,RANKS.map(r=>r.min).filter(m=>m<=kg).length-1);
  const cur=RANKS[i], next=RANKS[i+1]||null;
  const from=cur.min, to=next?next.min:null;
  const pct=next?Math.max(2,Math.min(100,Math.round((kg-from)/(to-from)*100))):100;
  return {kg,cnt,weeks:Object.keys(wks).length,cur,next,pct};
}

function html(d){
  const r=d.cur;
  const ladder=RANKS.map((x,j)=>`<div class="rk-step ${j<=RANKS.indexOf(r)?"on":""}"></div>`).join("");
  return `<div class="rk-card">
    <div class="rk-top">
      <div class="rk-badge">${r.ic}</div>
      <div class="rk-meta"><div class="rk-k">رتبتك</div><div class="rk-name">${r.n}</div><div class="rk-tag">${r.tag}</div></div>
      <div class="rk-num"><b>${fmtNum(d.kg)}</b><span>كجم مرفوعة</span></div>
    </div>
    <div class="rk-ladder">${ladder}</div>
    ${d.next?`<div class="rk-bar"><i data-w="${d.pct}%"></i></div>
      <div class="rk-next"><span>باقي <b>${fmtNum(d.next.min-d.kg)} كجم</b> لرتبة <b>${d.next.n}</b></span><span>${d.pct}%</span></div>`
      :`<div class="rk-bar"><i data-w="100%"></i></div><div class="rk-next"><span>وصلت آخر رتبة — <b>${r.n}</b></span><span>100%</span></div>`}
    <div class="rk-stats">
      <div class="rk-s"><b>${fmtNum(d.cnt)}</b><span>مجموعة مسجلة</span></div>
      <div class="rk-s"><b>${d.weeks}</b><span>أسبوع تمرين</span></div>
      <div class="rk-s"><b>${tons(d.kg)}</b><span>إجمالي الحديد</span></div>
    </div>
    ${d.cnt?`<p class="rk-note">الرتبة بتتحسب من سجلك أنت بس: مجموع (عدات × وزن) لكل مجموعة سجلتها. المجموعات بوزن الجسم بتتحسب مجموعة، مش كيلو.</p>`
      :`<p class="rk-empty">سجّل أول مجموعة وتبدأ رتبتك من هنا.</p>`}
  </div>`;
}

async function rankCardHTML(p){
  if(!document.querySelector("style[data-rk]")){ st.setAttribute("data-rk","1"); document.head.appendChild(st); }
  try{
    const { data } = await sb.from("set_logs").select("week,set_no,reps,weight").eq("client_id",p.id).limit(5000);
    const d=compute(data||[]);
    const out=html(d);
    setTimeout(()=>{ document.querySelectorAll(".rk-bar i").forEach(i=>{ i.style.width=i.dataset.w; }); },60);
    return out;
  }catch(e){
    return `<div class="rk-card"><div class="rk-k">رتبتك</div><p class="rk-empty">مقدرناش نقرأ سجلك دلوقتي.</p></div>`;
  }
}
window.rankCardHTML=rankCardHTML;
window.rankCompute=compute;
})();
