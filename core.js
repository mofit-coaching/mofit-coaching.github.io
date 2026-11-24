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

/* ---------- calculations (same formulas as the Mofit sheet) ---------- */
/* Weeks are absolute from start_date (1, 2 … 13, 14 …) and are shown in blocks of 12.
   Program length follows the subscription end date (min 12 weeks); with no end date it keeps counting. */
const BLOCK=12, MAX_WEEKS=260;
function maxWeek(p){ if(p?.start_date&&p?.sub_end){ const w=Math.ceil((daysBetween(p.start_date,p.sub_end)+1)/7); return Math.min(Math.max(w,BLOCK),MAX_WEEKS); } return MAX_WEEKS; }
function currentWeek(p){ if(!p?.start_date) return 1; return Math.min(Math.max(Math.floor(daysBetween(p.start_date,today())/7)+1,1),maxWeek(p)); }
function weekOfDate(p,iso){ if(!p?.start_date) return null; const w=Math.floor(daysBetween(p.start_date,iso)/7)+1; return w>=1&&w<=MAX_WEEKS?w:null; }
const blockOf=w=>Math.ceil(Math.max(+w||1,1)/BLOCK), wInBlock=w=>((Math.max(+w||1,1)-1)%BLOCK)+1;
function blockWeeks(w){ const b=blockOf(w); return [...Array(BLOCK)].map((_,i)=>(b-1)*BLOCK+i+1); }
/* "‹ block N ›" switcher; buttons carry data-w so every existing [data-w] handler works. Hidden while the client is still in block 1. */
function blockNavHTML(sel,p){
  const now=currentWeek(p), b=blockOf(sel), last=Math.max(blockOf(now),b);
  if(last===1) return "";
  const go=x=> blockOf(now)===x? now : (x-1)*BLOCK+1, r=blockWeeks(sel);
  return `<div class="blocknav"><button class="chip" ${b>1?`data-w="${go(b-1)}"`:"disabled"}>→ السابق</button>
    <b>البلوك ${b}<small>أسابيع ${r[0]}–${r[BLOCK-1]}</small></b>
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
  if(_rm()) return; const t=e.target.closest&&e.target.closest(".btn,.chip,.nav button,.client,.daycard,.tick"); if(!t) return;
  const r=t.getBoundingClientRect(), s=document.createElement("span"), d=Math.max(r.width,r.height)*1.6; s.className="rip";
  s.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
  if(getComputedStyle(t).position==="static") t.style.position="relative"; t.style.overflow=t.style.overflow||"hidden"; t.appendChild(s); setTimeout(()=>s.remove(),600);
},{passive:true});
