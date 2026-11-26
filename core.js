const SUPABASE_URL = "https://bqxyyrmtufureewxneoe.supabase.co";
const SUPABASE_KEY = "sb_publishable_Z6LXvxb2BtSRhCzSkAoFfA_jtd9wiBh";
const MOFIT_TEMPLATE = [{"day_no": 1, "position": 0, "name": "CS DB LATERAL RAISE", "sets": 4}, {"day_no": 1, "position": 1, "name": "DUAL CABLE LATERAL RAISE H-WRIST", "sets": 4}, {"day_no": 1, "position": 2, "name": "PRONE DB REAR DELT ROW", "sets": 4}, {"day_no": 1, "position": 3, "name": "DUAL CABLE SHRUGS", "sets": 4}, {"day_no": 1, "position": 4, "name": "INCLINE DB CURL", "sets": 4}, {"day_no": 1, "position": 5, "name": "DB SKULL CRUSHER", "sets": 4}, {"day_no": 1, "position": 6, "name": "DEAD BUG", "sets": 4}, {"day_no": 2, "position": 0, "name": "INCLINE PRESS MACHINE", "sets": 4}, {"day_no": 2, "position": 1, "name": "FLAT DB PRESS", "sets": 4}, {"day_no": 2, "position": 2, "name": "PEC DECK FLY MACHINE", "sets": 4}, {"day_no": 2, "position": 3, "name": "UPPER BACK ROW MACHINE", "sets": 4}, {"day_no": 2, "position": 4, "name": "UPPER BACK PULLDOWN", "sets": 4}, {"day_no": 2, "position": 5, "name": "SA REVERSE LAT PULLDOWN MACHINE", "sets": 4}, {"day_no": 2, "position": 6, "name": "SA ISO LAT ROW MACHINE", "sets": 4}, {"day_no": 3, "position": 0, "name": "FACE-IN CABLE CURL", "sets": 4}, {"day_no": 3, "position": 1, "name": "FACE-AWAY CABLE CURL", "sets": 4}, {"day_no": 3, "position": 2, "name": "NG SHOULDER PRESS MACHINE", "sets": 4}, {"day_no": 3, "position": 3, "name": "REAR DELT ROW MACHINE", "sets": 4}, {"day_no": 3, "position": 4, "name": "SA CABLE LATERAL RAISE H-KNEE", "sets": 4}, {"day_no": 3, "position": 5, "name": "SA CROSS-BODY TRICEPS EXTENSION", "sets": 4}, {"day_no": 4, "position": 0, "name": "LEG CURL MACHINE", "sets": 4}, {"day_no": 4, "position": 1, "name": "HACK SQUAT MACHINE (QUADS)", "sets": 4}, {"day_no": 4, "position": 2, "name": "CONTRALATERAL LOADED SPLIT SQUAT", "sets": 4}, {"day_no": 4, "position": 3, "name": "LEG EXTENSION MACHINE (QUADS)", "sets": 4}, {"day_no": 4, "position": 4, "name": "45-DEGREE HIP EXTENSION (HAMS)", "sets": 4}, {"day_no": 4, "position": 5, "name": "SEATED CALF RAISE MACHINE", "sets": 4}, {"day_no": 4, "position": 6, "name": "HORIZONTAL CALF RAISE", "sets": 4}, {"day_no": 4, "position": 7, "name": "CABLE ROPE CRUNCH", "sets": 4}, {"day_no": 4, "position": 8, "name": "DEAD BUG", "sets": 4}, {"day_no": 5, "position": 0, "name": "30-DEGREE INCLINE SMITH MACHINE", "sets": 4}, {"day_no": 5, "position": 1, "name": "CHEST PRESS MACHINE", "sets": 4}, {"day_no": 5, "position": 2, "name": "FLAT DB PRESS", "sets": 4}, {"day_no": 5, "position": 3, "name": "COSTAL CABLE FLY", "sets": 4}, {"day_no": 5, "position": 4, "name": "UPPER BACK ROW MACHINE", "sets": 4}, {"day_no": 5, "position": 5, "name": "UPPER BACK PULLDOWN", "sets": 4}, {"day_no": 5, "position": 6, "name": "SA REVERSE LAT PULLDOWN MACHINE", "sets": 4}, {"day_no": 5, "position": 7, "name": "SA ISO LAT ROW MACHINE", "sets": 4}];
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---------- constants ---------- */
const ACTIVITY = [["خامل (بدون رياضة)",1.2],["نشاط خفيف (1-3 أيام/أسبوع)",1.375],["نشاط متوسط (3-5 أيام/أسبوع)",1.55],["نشاط عالي (6-7 أيام/أسبوع)",1.725],["نشاط عالي جداً (رياضي / عمل بدني)",1.9]];
const GOALS = [["تنشيف (خسارة دهون)",-0.2],["ثبات الوزن",0],["زيادة عضل",0.1]];
const SCORE = [[1,"😍","100%"],[0.75,"🙂","75%"],[0.5,"😐","50%"],[0.25,"😕","25%"],[0,"😞","0%"]];
const STRESS = ["مفيش توتر","توتر قليل","عادي","توتر عالي"];
const CYCLE = ["None","PMS","Period"];
const MEAL_ICONS = ["🍳","🍗","🥗","🍎","🥤","🍽","🥛","🍌"];
const COUNT_UNITS = u => !["جم","مل"].includes(u||"جم");

/* ---------- state ---------- */
const S = { me:null, client:null, tab:"home", week:1, day:1, date:today(), program:[], coachClients:[], templates:[], videos:{}, setupTab:"data" };

/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num = v => (v === "" || v === null || v === undefined || isNaN(+v)) ? null : +v;
const fmt = (v, d=0) => v === null || v === undefined || isNaN(v) ? "—" : (+v).toLocaleString("en-US",{maximumFractionDigits:d});
const pct = v => v === null || v === undefined || isNaN(v) ? "—" : Math.round(v*100)+"%";
function today(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function addDays(iso,n){ const d=new Date(iso+"T00:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
function daysBetween(a,b){ return Math.round((new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/864e5); }
function niceDate(iso){ if(iso===today()) return "النهارده"; if(iso===addDays(today(),-1)) return "امبارح"; return new Date(iso+"T00:00:00").toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"}); }
function toast(msg){ document.querySelectorAll(".toast").forEach(t=>t.remove()); const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2200); }
function avg(a){ const x=a.filter(v=>v!==null&&v!==undefined&&!isNaN(v)); return x.length? x.reduce((s,v)=>s+ +v,0)/x.length : null; }
function genPass(){ const c="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; const a=new Uint32Array(10); crypto.getRandomValues(a); return [...a].map(x=>c[x%c.length]).join(""); }
function initials(p){ return esc(((p?.full_name||p?.email||"?").trim()[0]||"?").toUpperCase()); }
async function fnErr(error, data){ if(error){ try{ const j=await error.context.json(); return j.error||error.message; }catch{ return error.message; } } return data?.error||null; }
/* coach-admin edge function call that survives a stale session: refresh first, retry once on 401, then ask to log in again */
async function adminCall(opts){
  const call=()=>sb.functions.invoke("coach-admin",opts);
  const is401=r=>r&&r.error&&r.error.context&&r.error.context.status===401;
  try{ await sb.auth.refreshSession(); }catch(e){}
  let r=await call();
  if(is401(r)){ try{ await sb.auth.refreshSession(); }catch(e){} r=await call(); }
  if(is401(r)) return { data:null, error:{ message:"سجّل دخول تاني", context:{ json:async()=>({error:"سجّل دخول تاني"}) } } };
  return r;
}

/* ---------- calculations (same formulas as the Mofit sheet) ---------- */
/* Weeks are absolute from start_date (1, 2 … 13, 14 …) and are shown in blocks of 12.
   Program length follows the subscription end date (min 12 weeks); with no end date it keeps counting. */
const BLOCK=12, MAX_WEEKS=260;
/* Plan length in weeks: 1 month=4, 3=12, 6=26, 12=52 (other lengths ~4.33 weeks/month), taken from sub_start→sub_end.
   Bonus (gift) weeks from profiles.bonus_weeks (when that column exists) are added on top. No end date = no limit. */
function planBaseWeeks(p){ if(!(p?.sub_start&&p?.sub_end)) return null; const m=Math.max(1,Math.round((daysBetween(p.sub_start,p.sub_end)+1)/30.44)); return m<=3?m*4:m===6?26:m===12?52:Math.round(m*52/12); }
function maxWeek(p){ const b=planBaseWeeks(p); if(b===null) return MAX_WEEKS; return Math.min(b+Math.max(0,Math.floor(+p.bonus_weeks||0)),MAX_WEEKS); }
function currentWeek(p){ if(!p?.start_date) return 1; return Math.min(Math.max(Math.floor(daysBetween(p.start_date,today())/7)+1,1),maxWeek(p)); }
function weekOfDate(p,iso){ if(!p?.start_date) return null; const w=Math.floor(daysBetween(p.start_date,iso)/7)+1; return w>=1&&w<=MAX_WEEKS?w:null; }
const blockOf=w=>Math.ceil(Math.max(+w||1,1)/BLOCK), wInBlock=w=>((Math.max(+w||1,1)-1)%BLOCK)+1;
function blockWeeks(w,p){ const b=blockOf(w), mx=p?maxWeek(p):MAX_WEEKS; return [...Array(BLOCK)].map((_,i)=>(b-1)*BLOCK+i+1).filter(x=>x<=mx); }
/* keep the week chips where they were after a re-render (RTL scroller resets to the start otherwise); no saved spot = centre the selected chip */
function restoreWeekChips(root,saved){ const sc=[...(root||document).querySelectorAll(".scroller")].find(s=>s.querySelector("[data-w]")); if(!sc) return; if(saved!=null&&saved!==undefined){ sc.scrollLeft=saved; return; } const on=sc.querySelector(".chip.on"); if(on){ const dr=sc.getBoundingClientRect(), sr=on.getBoundingClientRect(); sc.scrollLeft=sc.scrollLeft+(sr.left-dr.left)-(sc.clientWidth-sr.width)/2; } }
function weekChipsX(root){ const sc=[...(root||document).querySelectorAll(".scroller")].find(s=>s.querySelector("[data-w]")); return sc?sc.scrollLeft:null; }
/* "‹ block N ›" switcher; buttons carry data-w so every existing [data-w] handler works. Hidden while the client is still in block 1. */
function blockNavHTML(sel,p){
  const now=currentWeek(p), b=blockOf(sel), last=Math.max(blockOf(now),b);
  if(last===1) return "";
  const go=x=> blockOf(now)===x? now : (x-1)*BLOCK+1, r=blockWeeks(sel,p);
  return `<div class="blocknav"><button class="chip" ${b>1?`data-w="${go(b-1)}"`:"disabled"}>→ السابق</button>
    <b>البلوك ${b}<small>أسابيع ${r[0]}–${r[r.length-1]}</small></b>
    <button class="chip" ${b<last?`data-w="${go(b+1)}"`:"disabled"}>التالي ←</button></div>`;
}
function targets(p){
  const r={bmr:null,tdee:null,kcal:null,P:null,C:null,F:null};
  if(p.sex&&p.age&&p.height_cm&&p.start_weight){
    r.bmr=10*p.start_weight+6.25*p.height_cm-5*p.age+(p.sex==="ذكر"?5:-161);
    r.tdee=r.bmr*(+p.activity_factor||1.2);
  }
  r.kcal = p.manual_kcal ? +p.manual_kcal : (r.tdee? r.tdee*(1+(+p.goal_adj||0)) : null);
  if(r.kcal){
    r.F=r.kcal*(+p.f_pct||0)/9;
    if(p.protein_gpk && p.start_weight){ r.P=p.start_weight*p.protein_gpk; r.C=Math.max(r.kcal-r.P*4-r.F*9,0)/4; }
    else { r.P=r.kcal*(+p.p_pct||0)/4; r.C=r.kcal*(+p.c_pct||0)/4; }
  }
  return r;
}
/* RIR-adjusted Epley: estimated 1RM = weight × (1 + (reps + RIR) / 30) */
function e1rm(s){ if(!s.weight||!s.reps) return null; return s.weight*(1+((+s.reps)+(+s.rir||0))/30); }
function isFailure(s){ return s.failure || (s.rir!==null && s.rir!==undefined && +s.rir===0); }
function logged(s){ return s.reps!==null&&s.reps!==undefined || s.weight!==null&&s.weight!==undefined; }
function sumMacros(items){ return items.reduce((a,i)=>({kcal:a.kcal+(+i.kcal||0),P:a.P+(+i.protein||0),C:a.C+(+i.carbs||0),F:a.F+(+i.fat||0)}),{kcal:0,P:0,C:0,F:0}); }
function mealName(p,m){ return (p.meal_names&&p.meal_names[m-1]) || ["الفطار","الغدا","العشا","سناك 1","سناك 2","وجبة 6","وجبة 7","وجبة 8"][m-1]; }
function dayLabel(d){ const e=S.program.find(x=>x.day_no===d&&x.day_label); return e?e.day_label:""; }
function todayDayNo(){ const days=[...new Set(S.program.map(e=>e.day_no))].sort((a,b)=>a-b); if(!days.length) return null; const start=S.client?.start_date||today(); const n=((daysBetween(start,today())%7)+7)%7+1; return days.includes(n)?n:null; }

/* ---------- food units ---------- */
/* DB values are per 100 of the unit: per 100 g/ml, or per 100 pieces (slice, egg, cup…) */
function unitInfo(f){
  const cnt=COUNT_UNITS(f.unit), k=cnt?0.01:1;
  return { cnt, base: cnt? `1 ${f.unit}` : `100 ${f.unit}`, qtyLabel: cnt? `العدد (${f.unit})` : `الكمية (${f.unit})`,
    per:{kcal:f.kcal*k,P:f.protein*k,C:f.carbs*k,F:f.fat*k}, quick: cnt?[1,2,3,4]:[50,100,150,200], def: cnt?1:100 };
}
function foodCalc(f,qty){ const k=qty/100; return {kcal:+(f.kcal*k).toFixed(1),protein:+(f.protein*k).toFixed(1),carbs:+(f.carbs*k).toFixed(1),fat:+(f.fat*k).toFixed(1)}; }

/* ---------- visual helpers ---------- */
const ICON = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  train:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/></svg>',
  food:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4.4 0-8-3.6-8-8 0-3 2-5 4.5-5 1.3 0 2.4.6 3.5 1.4C13.1 8.6 14.2 8 15.5 8 18 8 20 10 20 13c0 4.4-3.6 8-8 8z"/><path d="M12 9c0-3 1.5-5 4-6"/></svg>',
  habits:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M8 13l3 3 5-6"/></svg>',
  body:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 20 4M7 17l2 2M10 14l2 2M13 11l2 2M16 8l2 2"/></svg>',
  setup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  clients:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.5c2.3.2 4 1.8 4.5 4.5"/></svg>',
  videos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></svg>',
  foods:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  supps:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="m9.5 9.5 5 5"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
};
function ring(value, max, {size=120, stroke=12, color="#F97316", track="#E2E8F0", label="", sub="", textColor="#0F172A"}={}){
  const r=(size-stroke)/2, c=2*Math.PI*r, p=max?Math.min(value/max,1):0;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset .8s"/>
    <text x="50%" y="${sub?"47%":"53%"}" text-anchor="middle" font-size="${size/5.2}" font-weight="800" fill="${textColor}" direction="ltr">${label}</text>
    ${sub?`<text x="50%" y="66%" text-anchor="middle" font-size="${size/11}" fill="${textColor==="#fff"?"#CBD5E1":"#64748B"}">${sub}</text>`:""}</svg>`;
}
function macroRow(name, v, goal, unit, cls=""){
  const r=goal?v/goal:0;
  return `<div class="macro"><div class="between"><span>${name}</span><span><b class="num">${fmt(v)}</b> <span class="muted">/ ${fmt(goal)} ${unit}</span></span></div>
    <div class="bar ${cls} ${r>1.08?"over":""}"><i style="width:${Math.min(r,1)*100}%"></i></div></div>`;
}
function lineChart(pts, unit, color="#0F172A"){
  pts=pts.filter(p=>p.y!==null&&!isNaN(p.y));
  if(pts.length<2) return `<p class="hint">المنحنى بيظهر بعد تسجيل قياسين أو أكتر.</p>`;
  const W=340,H=150,pl=34,pr=12,pt=14,pb=24, ys=pts.map(p=>p.y), xs=pts.map(p=>p.x);
  let y0=Math.min(...ys), y1=Math.max(...ys); if(y0===y1){y0-=1;y1+=1;} const pad=(y1-y0)*.2; y0-=pad; y1+=pad;
  const x0=Math.min(...xs), x1=Math.max(...xs);
  const X=x=>pl+(x-x0)/((x1-x0)||1)*(W-pl-pr), Y=y=>pt+(1-(y-y0)/(y1-y0))*(H-pt-pb);
  const d=pts.map((p,i)=>(i?"L":"M")+X(p.x).toFixed(1)+" "+Y(p.y).toFixed(1)).join(" ");
  const gid="g"+Math.random().toString(36).slice(2,7);
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;margin-top:6px" direction="ltr">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F97316" stop-opacity=".28"/><stop offset="1" stop-color="#F97316" stop-opacity="0"/></linearGradient></defs>
    ${[0,.5,1].map(t=>{const v=y0+(y1-y0)*(.15+.7*t);return `<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#E2E8F0" stroke-dasharray="3 4"/><text x="${pl-5}" y="${Y(v)+3}" font-size="9" fill="#64748B" text-anchor="end">${v.toFixed(1)}</text>`}).join("")}
    <path d="${d} L${X(pts[pts.length-1].x)} ${H-pb} L${X(pts[0].x)} ${H-pb}Z" fill="url(#${gid})"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
    ${pts.map((p,i)=>`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${i===pts.length-1?5:3.5}" fill="${i===pts.length-1?"#F97316":"#fff"}" stroke="${i===pts.length-1?"#fff":color}" stroke-width="2"/><text x="${X(p.x)}" y="${H-7}" font-size="9" fill="#64748B" text-anchor="middle">${p.x===0?"Start":"W"+p.x}</text>`).join("")}
  </svg><p class="hint" style="margin:0">${unit}</p>`;
}
function emptyBox(icon, text){ return `<div class="empty"><div class="big">${icon}</div>${text}</div>`; }

/* ---------- bottom sheet ---------- */
let _sheetOpener=null;
function openSheet(html){ _sheetOpener=document.activeElement; $("#sheetBody").innerHTML=html; $("#sheet").classList.remove("hidden"); document.body.style.overflow="hidden"; const f=$("#sheetBody").querySelector("input,select,textarea,button"); if(f) try{ f.focus({preventScroll:true}); }catch(e){} return $("#sheetBody"); }
function closeSheet(){ $("#sheet").classList.add("hidden"); $("#sheetBody").innerHTML=""; document.body.style.overflow=""; try{ _sheetOpener?.focus?.({preventScroll:true}); }catch(e){} _sheetOpener=null; }
document.addEventListener("keydown",e=>{ if(e.key==="Escape" && !$("#sheet").classList.contains("hidden") && !$("#sheet").dataset.lock) closeSheet(); });
document.addEventListener("click",e=>{ if(e.target.classList?.contains("sheet-bg") && !$("#sheet").dataset.lock) closeSheet(); });

/* ---------- exercise videos ---------- */
async function loadVideos(){ const { data, error } = await sb.from("exercise_videos").select("name,video_url,alternatives"); if(error) return; S.videos=Object.fromEntries((data||[]).filter(v=>v.video_url).map(v=>[v.name.toUpperCase(),v.video_url])); S.alts=Object.fromEntries((data||[]).filter(v=>v.alternatives?.length).map(v=>[v.name.toUpperCase(),v.alternatives])); }
function videoFor(ex){ return ex.video_url || S.videos[(ex.name||"").toUpperCase()] || null; }
function ytId(url){ const m=String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/); return m?m[1]:null; }
function openVideo(ex){
  const url=videoFor(ex); if(!url){ toast("مفيش فيديو للتمرين ده لسه"); return; }
  const id=ytId(url);
  openSheet(`<div class="between" style="margin-bottom:10px"><b>${esc(ex.name)}</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
    ${id?`<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
        :`<p class="muted">الفيديو على موقع خارجي:</p>`}
    <a class="btn block" style="display:block;text-align:center;margin-top:10px;text-decoration:none" href="${esc(url)}" target="_blank" rel="noopener">فتح في ${id?"YouTube":"المتصفح"} ↗</a>
    ${ex.notes?`<p class="hint">📝 ${esc(ex.notes)}</p>`:""}`);
}

/* ---------- rest timer ---------- */
const T={end:0,total:0,iv:null,label:""};
let audioCtx=null;
function beep(){ try{ audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); [0,.25,.5].forEach(t=>{ const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.frequency.value=880; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(.25,audioCtx.currentTime+t); g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+t+.2); o.start(audioCtx.currentTime+t); o.stop(audioCtx.currentTime+t+.2); }); }catch{} navigator.vibrate?.([300,150,300]); }
function startRest(sec,label){ sec=Math.max(5,+sec||90); T.total=sec; T.end=Date.now()+sec*1000; T.label=label||""; clearInterval(T.iv); T.iv=setInterval(drawTimer,250); drawTimer(); try{ audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); audioCtx.resume?.(); }catch{} }
function stopRest(){ clearInterval(T.iv); T.iv=null; $("#timer").classList.add("hidden"); }
function drawTimer(){
  const el=$("#timer"), left=Math.max(0,Math.round((T.end-Date.now())/1000));
  el.classList.remove("hidden"); el.classList.toggle("done",left===0);
  const mm=String(Math.floor(left/60)).padStart(2,"0"), ss=String(left%60).padStart(2,"0");
  el.innerHTML=`${ring(left,T.total,{size:54,stroke:6,color:"#F97316",track:"#334155",label:left?mm+":"+ss:"✓",textColor:"#fff"})}
    <div class="t-info"><b>${left?"⏱ وقت الراحة":"يلا المجموعة الجاية 💪"}</b><small>${esc(T.label)}</small></div>
    <button class="ibtn" data-t="-15">-15</button><button class="ibtn" data-t="15">+15</button><button class="ibtn" data-t="x">✕</button>`;
  el.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{ const v=b.dataset.t; if(v==="x") return stopRest(); T.end+= (+v)*1000; T.total=Math.max(T.total+(+v),5); if(T.end<Date.now()) T.end=Date.now(); if(!T.iv){T.iv=setInterval(drawTimer,250);} drawTimer(); });
  if(left===0 && T.iv){ clearInterval(T.iv); T.iv=null; beep(); setTimeout(()=>{ if(!T.iv) stopRest(); },8000); }
}
function tempoBlocks(t){
  const p=String(t||"").split(/[-–\/ ]+/).filter(Boolean); if(p.length!==4) return "";
  const L=["نزول","توقف تحت","طلوع","توقف فوق"];
  return `<div class="tempo">${p.map((v,i)=>`<div><b class="num">${esc(v)}</b>${L[i]}</div>`).join("")}</div>`;
}





/* ---- motion helpers (v4): confetti burst + tap ripple; both skip under reduced-motion ---- */
const _rm=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function burst(){
  if(_rm()) return; const w=document.createElement("div"); w.className="burst"; const cols=["#FF6B1A","#FFB347","#5B6CFF","#14B8A6","#F43F8E","#fff"];
  for(let i=0;i<34;i++){ const p=document.createElement("i"), a=Math.random()*Math.PI*2, d=90+Math.random()*170;
    p.style.cssText=`--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d-80}px;--r:${Math.random()*720-360}deg;background:${cols[i%cols.length]};animation-delay:${Math.random()*.12}s;border-radius:${i%3?"2px":"50%"}`; w.appendChild(p); }
  document.body.appendChild(w); setTimeout(()=>w.remove(),1800); if(navigator.vibrate) navigator.vibrate(30);
}
document.addEventListener("pointerdown",e=>{
  if(_rm()) return; const t=e.target.closest&&e.target.closest(".btn,.chip,.nav button,.client,.daycard,.tick"); if(!t||t.closest(".scroller,.seg,.chat-q,.scrollx")) return;
  const r=t.getBoundingClientRect(), s=document.createElement("span"), d=Math.max(r.width,r.height)*1.6; s.className="rip";
  s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  if(getComputedStyle(t).position==="static") t.style.position="relative"; t.style.overflow=t.style.overflow||"hidden"; t.appendChild(s); setTimeout(()=>s.remove(),600);
},{passive:true});

/* campaign tracking: ?src=instagram is remembered and sent with the signup */
try{ const _s=new URLSearchParams(location.search).get("src"); if(_s) localStorage.setItem("mofit_src",_s.slice(0,40)); }catch(e){}

/* v5.6: stagger index + number count-up on freshly rendered screens */
(function(){ const m=document.getElementById("main"); if(!m||!window.MutationObserver) return;
  const rm=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  new MutationObserver(recs=>{ if(rm()) return; if(recs.every(r=>[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType!==1||n.classList.contains("rip")))) return;
    [...m.children].forEach((el,i)=>{ if(el.style&&!el.style.getPropertyValue("--i")) el.style.setProperty("--i",Math.min(i,8)); });
    m.querySelectorAll(".stat .v.num,.stat .v").forEach(el=>{ if(el.dataset.cu) return; el.dataset.cu=1; const t=el.textContent.trim(); if(!/^\d{1,6}(\.\d)?$/.test(t)) return;
      const end=parseFloat(t), dec=t.includes(".")?1:0, t0=performance.now()+300; el.textContent=dec?"0.0":"0";
      (function f(n){ const k=Math.max(0,Math.min(1,(n-t0)/800)), e=1-Math.pow(1-k,3); el.textContent=(end*e).toFixed(dec); if(k<1) requestAnimationFrame(f); })(performance.now()); });
  }).observe(m,{childList:true,subtree:true});
})();

/* v6.0: price count-up when the plan cards appear, confetti when the tour ends */
(function(){ const rm=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run=el=>{ if(el.dataset.pc||rm()) return; el.dataset.pc=1; const raw=el.textContent.replace(/[^\d.]/g,""), end=parseFloat(raw); if(!end) return; const txt=el.textContent, t0=performance.now()+350;
    el.textContent="0"; (function f(n){ const k=Math.max(0,Math.min(1,(n-t0)/1100)), e=1-Math.pow(1-k,4); el.textContent=k>=1?txt:Math.round(end*e).toLocaleString("en-US"); if(k<1) requestAnimationFrame(f); })(performance.now()); };
  new MutationObserver(()=>{ document.querySelectorAll(".plan-price b.num").forEach(run); }).observe(document.body,{childList:true,subtree:true});
  document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("#onbN"); if(b&&/يلا/.test(b.innerText)&&typeof burst==="function") burst(); },true);
})();

/* v7.5: pause decorative animations while scrolling so touch scrolling stays smooth */
(function(){var t,on=false;function s(){if(!on){document.body.classList.add("scrolling");on=true}clearTimeout(t);t=setTimeout(function(){document.body.classList.remove("scrolling");on=false},160)}
document.addEventListener("scroll",s,{passive:true,capture:true});document.addEventListener("touchmove",s,{passive:true,capture:true})})();

/* v7.8 glide: custom drag + inertia for every horizontal row (day cards, week chips, tabs, quick replies) */
(function(){
  var SEL=".scroller,.seg,.chat-q,.scrollx";
  function setup(el){
    if(el._gl) return; el._gl=1; el.classList.add("glide");
    var id=null,x0=0,last=0,lt=0,v=0,moved=false,raf=0;
    function stop(){ cancelAnimationFrame(raf); }
    el.addEventListener("pointerdown",function(e){
      if(e.pointerType==="mouse"&&e.button!==0) return;
      stop(); id=e.pointerId; x0=last=e.clientX; lt=e.timeStamp; v=0; moved=false;
    },{passive:true});
    el.addEventListener("pointermove",function(e){
      if(e.pointerId!==id) return;
      if(!moved){ if(Math.abs(e.clientX-x0)<6) return; moved=true; try{ el.setPointerCapture(id); }catch(_){} document.body.classList.add("scrolling"); last=e.clientX; lt=e.timeStamp; return; }
      var d=e.clientX-last, dt=Math.max(1,e.timeStamp-lt);
      el.scrollLeft-=d; v=0.6*(d/dt)+0.4*v; last=e.clientX; lt=e.timeStamp;
    },{passive:true});
    function end(e){
      if(e.pointerId!==id) return; id=null;
      if(!moved) return;
      el._sup=true; setTimeout(function(){ el._sup=false; },80);
      if(e.timeStamp-lt>90) v=0;
      var pos=el.scrollLeft, t0=performance.now();
      (function f(n){
        var dt=Math.min(32,n-t0); t0=n;
        pos-=v*dt; var before=el.scrollLeft; el.scrollLeft=pos;
        if(Math.abs(el.scrollLeft-pos)>1.5){ v=0; }
        v*=Math.exp(-dt/320);
        if(Math.abs(v)>0.015){ raf=requestAnimationFrame(f); } else { document.body.classList.remove("scrolling"); }
      })(t0);
      if(Math.abs(v)<=0.015) document.body.classList.remove("scrolling");
    }
    el.addEventListener("pointerup",end,{passive:true});
    el.addEventListener("pointercancel",end,{passive:true});
    el.addEventListener("click",function(e){ if(el._sup){ e.stopPropagation(); e.preventDefault(); el._sup=false; } },true);
    el.addEventListener("wheel",function(e){ if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){ el.scrollLeft+=e.deltaX; e.preventDefault(); } },{passive:false});
  }
  function scan(root){ (root.querySelectorAll?root.querySelectorAll(SEL):[]).forEach(setup); if(root.matches&&root.matches(SEL)) setup(root); }
  function init(){ scan(document); new MutationObserver(function(recs){ for(var i=0;i<recs.length;i++){ var a=recs[i].addedNodes; for(var j=0;j<a.length;j++){ if(a[j].nodeType===1&&!(a[j].classList&&a[j].classList.contains("rip"))) scan(a[j]); } } }).observe(document.body,{childList:true,subtree:true}); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();

/* v9 rest timer motion: bouncy entrance, live shimmering progress bar, hot last-5-seconds pulse, confetti when time is up */
(function(){
  const _d=drawTimer, _s=startRest;
  drawTimer=function(){ _d.apply(this,arguments); const el=$("#timer"); if(!el) return; const left=Math.max(0,Math.round((T.end-Date.now())/1000));
    el.style.setProperty("--p",(T.total?Math.max(0,Math.min(1,left/T.total)):0)); el.classList.toggle("hot",left>0&&left<=5);
    if(left===0){ if(!el._fin){ el._fin=1; try{ burst(); }catch(e){} } } else el._fin=0; };
  startRest=function(){ const r=_s.apply(this,arguments); const el=$("#timer"); if(el){ el._fin=0; el.classList.remove("t-in"); void el.offsetWidth; el.classList.add("t-in"); clearTimeout(el._tin); el._tin=setTimeout(()=>el.classList.remove("t-in"),1000); } return r; };
})();


/* ---------- activity ping: lets the coach see "last active". One tiny RPC at most every 3 minutes while a client has the app open; silent if the function is missing. ---------- */
(function(){ let last=0, busy=false;
  const ping=async()=>{ try{ if(busy||document.hidden||typeof S==="undefined"||!S.me||S.me.role!=="client"||Date.now()-last<18e4) return; busy=true; last=Date.now(); await sb.rpc("touch_active"); }catch(e){} busy=false; };
  document.addEventListener("visibilitychange",ping); window.addEventListener("focus",ping); window.addEventListener("pageshow",ping); window.addEventListener("online",ping); setInterval(ping,20000); setTimeout(ping,4000);
  /* right after a fresh login the session is not ready at 4s: retry every 2s until the first ping goes out */
  let en=0; const early=setInterval(()=>{ ping(); if(last||++en>45) clearInterval(early); },2000);
})();


/* pause the Flame hero's loops when it is scrolled out of view */
(function(){ let q=0; const upd=()=>{ q=0; const h=document.querySelector(".fl-hero"); if(!h) return; const r=h.getBoundingClientRect(); h.classList.toggle("fl-off", r.bottom<0||r.top>innerHeight); };
  window.addEventListener("scroll",()=>{ if(!q) q=requestAnimationFrame(upd); },{passive:true}); })();
/* ---------- stale-app check: an installed PWA resumes from memory and can keep running old code for days. When the app comes back to the foreground and the live site has a newer build, reload quietly, but ONLY when it is safe: never on the training tab, never with a sheet, chat, rest timer or focused field open, and never within 20s of the user's last touch. ---------- */
(function(){
  const cur=()=>{ const l=document.querySelector('link[href*="design.css"]'); const m=l&&l.getAttribute("href").match(/v=([0-9a-f]{8})/); return m&&m[1]; };
  let lastTouch=Date.now(), lastCheck=0, busy=false;
  ["touchstart","pointerdown","keydown","scroll"].forEach(e=>window.addEventListener(e,()=>{ lastTouch=Date.now(); },{passive:true,capture:true}));
  const safe=()=>{ if(typeof S==="undefined"||!S.me) return false; if(S.tab==="train") return false;
    const sh=document.getElementById("sheet"), tm=document.getElementById("timer"), ae=document.activeElement;
    if(sh&&!sh.classList.contains("hidden")) return false; if(tm&&!tm.classList.contains("hidden")) return false;
    if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return false; if(Date.now()-lastTouch<20000) return false; return true; };
  async function check(){ try{
    if(busy||document.hidden||Date.now()-lastCheck<10*6e4) return; busy=true; lastCheck=Date.now();
    const mine=cur(); if(!mine) { busy=false; return; }
    const r=await fetch(location.pathname+"?t="+Date.now(),{cache:"no-store"}); const t=await r.text(); const m=t.match(/design\.css\?v=([0-9a-f]{8})/);
    if(m&&m[1]!==mine&&sessionStorage.getItem("mofit_reloaded")!==m[1]){
      const go=()=>{ if(safe()){ sessionStorage.setItem("mofit_reloaded",m[1]); location.reload(); return true; } return false; };
      if(!go()){ let n=0; const iv=setInterval(()=>{ if(go()||++n>30) clearInterval(iv); },10000); }
    }
  }catch(e){} busy=false; }
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) setTimeout(check,3000); }); window.addEventListener("pageshow",()=>setTimeout(check,3000)); setTimeout(check,30000);
})();
