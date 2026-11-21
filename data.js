/* ---------- training systems library ---------- */
/* [name, sets, reps, target RIR] */
const B = {
  FB_A:[["BACK SQUAT",3,"6-10","2"],["FLAT DB PRESS",3,"8-12","1-2"],["LAT PULLDOWN",3,"8-12","1-2"],["ROMANIAN DEADLIFT",3,"8-10","2"],["SEATED DB SHOULDER PRESS",2,"8-12","1-2"],["CABLE CURL",2,"10-15","1"],["CABLE TRICEPS PUSHDOWN",2,"10-15","1"]],
  FB_B:[["LEG PRESS",3,"10-15","1-2"],["INCLINE DB PRESS",3,"8-12","1-2"],["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["LYING LEG CURL",3,"10-15","1"],["CABLE LATERAL RAISE",3,"12-20","1"],["OVERHEAD CABLE TRICEPS EXTENSION",2,"10-15","1"],["INCLINE DB CURL",2,"10-15","1"]],
  FB_C:[["HACK SQUAT MACHINE",3,"8-12","1-2"],["MACHINE CHEST PRESS",3,"8-12","1-2"],["SEATED CABLE ROW",3,"8-12","1-2"],["45-DEGREE HIP EXTENSION",3,"10-15","1-2"],["REAR DELT FLY MACHINE",3,"12-20","1"],["HAMMER CURL",2,"10-15","1"],["STANDING CALF RAISE",3,"10-15","1"]],
  UPPER_A:[["FLAT BB BENCH PRESS",3,"6-10","2"],["BENT-OVER BB ROW",3,"6-10","2"],["SEATED DB SHOULDER PRESS",3,"8-12","1-2"],["LAT PULLDOWN",3,"8-12","1-2"],["CABLE LATERAL RAISE",3,"12-20","1"],["EZ BAR CURL",2,"8-12","1"],["CABLE TRICEPS PUSHDOWN",2,"10-15","1"]],
  UPPER_B:[["INCLINE DB PRESS",3,"8-12","1-2"],["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["MACHINE SHOULDER PRESS",3,"8-12","1-2"],["NEUTRAL-GRIP PULLDOWN",3,"8-12","1-2"],["PEC DECK FLY MACHINE",2,"12-15","1"],["REAR DELT FLY MACHINE",3,"12-20","1"],["INCLINE DB CURL",2,"10-15","1"],["OVERHEAD CABLE TRICEPS EXTENSION",2,"10-15","1"]],
  LOWER_A:[["BACK SQUAT",3,"6-10","2"],["ROMANIAN DEADLIFT",3,"8-10","2"],["LEG EXTENSION MACHINE",3,"10-15","1"],["SEATED LEG CURL",3,"10-15","1"],["STANDING CALF RAISE",3,"10-15","1"],["CABLE ROPE CRUNCH",3,"10-15","1"]],
  LOWER_B:[["HACK SQUAT MACHINE",3,"8-12","1-2"],["HIP THRUST",3,"8-12","1-2"],["BULGARIAN SPLIT SQUAT",2,"8-12","1-2"],["LYING LEG CURL",3,"10-15","1"],["SEATED CALF RAISE MACHINE",3,"10-15","1"],["HANGING KNEE RAISE",3,"10-15","1"]],
  TORSO_A:[["FLAT BB BENCH PRESS",3,"6-10","2"],["BENT-OVER BB ROW",3,"6-10","2"],["INCLINE DB PRESS",3,"8-12","1-2"],["LAT PULLDOWN",3,"8-12","1-2"],["PEC DECK FLY MACHINE",2,"12-15","1"],["SEATED CABLE ROW",2,"10-12","1"]],
  TORSO_B:[["MACHINE CHEST PRESS",3,"8-12","1-2"],["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["FLAT DB PRESS",3,"8-12","1-2"],["NEUTRAL-GRIP PULLDOWN",3,"8-12","1-2"],["CABLE FLY",2,"12-15","1"],["STRAIGHT-ARM PULLDOWN",2,"12-15","1"]],
  LIMBS_A:[["BACK SQUAT",3,"6-10","2"],["ROMANIAN DEADLIFT",3,"8-10","2"],["LEG EXTENSION MACHINE",2,"10-15","1"],["SEATED DB SHOULDER PRESS",3,"8-12","1-2"],["CABLE LATERAL RAISE",3,"12-20","1"],["EZ BAR CURL",2,"8-12","1"],["CABLE TRICEPS PUSHDOWN",2,"10-15","1"],["STANDING CALF RAISE",3,"10-15","1"]],
  LIMBS_B:[["LEG PRESS",3,"10-15","1-2"],["LYING LEG CURL",3,"10-15","1"],["BULGARIAN SPLIT SQUAT",2,"8-12","1-2"],["MACHINE SHOULDER PRESS",3,"8-12","1-2"],["REAR DELT FLY MACHINE",3,"12-20","1"],["INCLINE DB CURL",2,"10-15","1"],["OVERHEAD CABLE TRICEPS EXTENSION",2,"10-15","1"],["SEATED CALF RAISE MACHINE",3,"10-15","1"]],
  PUSH:[["FLAT BB BENCH PRESS",3,"6-10","2"],["INCLINE DB PRESS",3,"8-12","1-2"],["SEATED DB SHOULDER PRESS",3,"8-12","1-2"],["CABLE LATERAL RAISE",3,"12-20","1"],["PEC DECK FLY MACHINE",2,"12-15","1"],["CABLE TRICEPS PUSHDOWN",3,"10-15","1"],["OVERHEAD CABLE TRICEPS EXTENSION",2,"10-15","1"]],
  PULL:[["LAT PULLDOWN",3,"8-12","1-2"],["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["SEATED CABLE ROW",3,"10-12","1-2"],["STRAIGHT-ARM PULLDOWN",2,"12-15","1"],["REAR DELT FLY MACHINE",3,"12-20","1"],["EZ BAR CURL",3,"8-12","1"],["HAMMER CURL",2,"10-15","1"]],
  LEGS:[["BACK SQUAT",3,"6-10","2"],["ROMANIAN DEADLIFT",3,"8-10","2"],["LEG PRESS",3,"10-15","1-2"],["LEG EXTENSION MACHINE",3,"12-15","1"],["SEATED LEG CURL",3,"10-15","1"],["STANDING CALF RAISE",3,"10-15","1"],["CABLE ROPE CRUNCH",3,"10-15","1"]],
  PUSH_B:[["INCLINE BB BENCH PRESS",3,"6-10","2"],["MACHINE CHEST PRESS",3,"8-12","1-2"],["MACHINE SHOULDER PRESS",3,"8-12","1-2"],["DB LATERAL RAISE",3,"12-20","1"],["CABLE FLY",2,"12-15","1"],["DB SKULL CRUSHER",3,"8-12","1"],["SA CABLE TRICEPS EXTENSION",2,"12-15","1"]],
  PULL_B:[["PULL-UP (OR ASSISTED)",3,"6-10","2"],["BENT-OVER BB ROW",3,"6-10","2"],["SA ISO LAT ROW MACHINE",3,"8-12","1-2"],["NEUTRAL-GRIP PULLDOWN",2,"10-12","1"],["FACE PULL",3,"12-20","1"],["INCLINE DB CURL",3,"10-12","1"],["PREACHER CURL",2,"10-15","1"]],
  LEGS_B:[["HACK SQUAT MACHINE",3,"8-12","1-2"],["HIP THRUST",3,"8-12","1-2"],["BULGARIAN SPLIT SQUAT",2,"8-12","1-2"],["LYING LEG CURL",3,"10-15","1"],["LEG EXTENSION MACHINE",2,"15-20","1"],["SEATED CALF RAISE MACHINE",3,"10-15","1"],["HANGING KNEE RAISE",3,"10-15","1"]],
  ARN_CB:[["FLAT BB BENCH PRESS",3,"6-10","2"],["LAT PULLDOWN",3,"8-12","1-2"],["INCLINE DB PRESS",3,"8-12","1-2"],["BENT-OVER BB ROW",3,"6-10","2"],["CABLE FLY",2,"12-15","1"],["SEATED CABLE ROW",2,"10-12","1"],["STRAIGHT-ARM PULLDOWN",2,"12-15","1"]],
  ARN_SA:[["SEATED DB SHOULDER PRESS",3,"8-12","1-2"],["CABLE LATERAL RAISE",3,"12-20","1"],["REAR DELT FLY MACHINE",3,"12-20","1"],["EZ BAR CURL",3,"8-12","1"],["CLOSE-GRIP BENCH PRESS",3,"6-10","2"],["INCLINE DB CURL",2,"10-15","1"],["OVERHEAD CABLE TRICEPS EXTENSION",2,"10-15","1"]],
  ANT:[["BACK SQUAT",3,"6-10","2"],["FLAT DB PRESS",3,"8-12","1-2"],["LEG EXTENSION MACHINE",3,"12-15","1"],["MACHINE SHOULDER PRESS",3,"8-12","1-2"],["CABLE LATERAL RAISE",3,"12-20","1"],["EZ BAR CURL",2,"8-12","1"],["CABLE ROPE CRUNCH",3,"10-15","1"]],
  POST:[["ROMANIAN DEADLIFT",3,"8-10","2"],["LAT PULLDOWN",3,"8-12","1-2"],["SEATED LEG CURL",3,"10-15","1"],["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["REAR DELT FLY MACHINE",3,"12-20","1"],["CABLE TRICEPS PUSHDOWN",2,"10-15","1"],["STANDING CALF RAISE",3,"10-15","1"]],
  PHAT_UP:[["BENT-OVER BB ROW",3,"3-5","1-2"],["WEIGHTED PULL-UP",2,"6-10","1-2"],["FLAT BB BENCH PRESS",3,"3-5","1-2"],["WEIGHTED DIP",2,"6-10","1-2"],["SEATED DB SHOULDER PRESS",3,"6-10","1-2"],["EZ BAR CURL",3,"6-10","1"],["SKULL CRUSHER",3,"6-10","1"]],
  PHAT_LP:[["BACK SQUAT",3,"3-5","1-2"],["HACK SQUAT MACHINE",2,"6-10","1-2"],["LEG EXTENSION MACHINE",2,"6-10","1"],["ROMANIAN DEADLIFT",3,"5-8","2"],["LYING LEG CURL",2,"6-10","1"],["STANDING CALF RAISE",3,"6-10","1"]],
  PHAT_BS:[["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["LAT PULLDOWN",3,"8-12","1-2"],["SEATED CABLE ROW",2,"12-15","1"],["STRAIGHT-ARM PULLDOWN",2,"15-20","1"],["SEATED DB SHOULDER PRESS",3,"8-12","1-2"],["CABLE LATERAL RAISE",3,"12-20","1"],["REAR DELT FLY MACHINE",3,"15-20","1"]],
  PHAT_LH:[["HACK SQUAT MACHINE",3,"8-12","1-2"],["LEG PRESS",3,"12-15","1-2"],["LEG EXTENSION MACHINE",3,"15-20","1"],["ROMANIAN DEADLIFT",3,"8-12","2"],["SEATED LEG CURL",3,"12-15","1"],["SEATED CALF RAISE MACHINE",4,"10-15","1"]],
  PHAT_CA:[["INCLINE DB PRESS",3,"8-12","1-2"],["FLAT DB PRESS",3,"8-12","1-2"],["CABLE FLY",2,"12-15","1"],["PREACHER CURL",3,"8-12","1"],["INCLINE DB CURL",2,"12-15","1"],["OVERHEAD CABLE TRICEPS EXTENSION",3,"8-12","1"],["CABLE TRICEPS PUSHDOWN",2,"12-15","1"]],
  BRO_CH:[["FLAT BB BENCH PRESS",4,"6-10","2"],["INCLINE DB PRESS",3,"8-12","1-2"],["MACHINE CHEST PRESS",3,"10-12","1"],["CABLE FLY",3,"12-15","1"],["DIPS (CHEST)",2,"8-12","1"]],
  BRO_BK:[["LAT PULLDOWN",4,"8-12","1-2"],["BENT-OVER BB ROW",3,"6-10","2"],["SA ISO LAT ROW MACHINE",3,"8-12","1-2"],["SEATED CABLE ROW",3,"10-12","1"],["STRAIGHT-ARM PULLDOWN",2,"12-15","1"]],
  BRO_SH:[["SEATED DB SHOULDER PRESS",4,"8-12","1-2"],["CABLE LATERAL RAISE",4,"12-20","1"],["REAR DELT FLY MACHINE",3,"12-20","1"],["DUAL CABLE SHRUGS",3,"10-15","1"],["FACE PULL",2,"15-20","1"]],
  BRO_AR:[["EZ BAR CURL",3,"8-12","1"],["CLOSE-GRIP BENCH PRESS",3,"6-10","2"],["INCLINE DB CURL",3,"10-12","1"],["OVERHEAD CABLE TRICEPS EXTENSION",3,"10-12","1"],["HAMMER CURL",2,"10-15","1"],["CABLE TRICEPS PUSHDOWN",2,"12-15","1"]],
};
const D = (label, block) => ({ label, ex: B[block] });
const SYSTEMS = [
  {key:"fb2", days:2, rec:true, name:"فول بادي A / B", plan:[D("Full Body A","FB_A"),D("Full Body B","FB_B")]},
  {key:"ul2", days:2, name:"أبر / لوور", plan:[D("Upper","UPPER_A"),D("Lower","LOWER_A")]},
  {key:"tl2", days:2, name:"تورسو / ليمبز", plan:[D("Torso","TORSO_A"),D("Limbs","LIMBS_A")]},
  {key:"fbeod", days:3, rec:true, name:"فول بادي يوم ويوم (FBEOD)", plan:[D("Full Body A","FB_A"),D("Full Body B","FB_B"),D("Full Body C","FB_C")]},
  {key:"ppl3", days:3, name:"بوش / بول / ليجز", plan:[D("Push","PUSH"),D("Pull","PULL"),D("Legs","LEGS")]},
  {key:"ulf3", days:3, name:"أبر / لوور / فول بادي", plan:[D("Upper","UPPER_A"),D("Lower","LOWER_A"),D("Full Body","FB_C")]},
  {key:"arn3", days:3, name:"أرنولد سبليت", plan:[D("Chest & Back","ARN_CB"),D("Shoulders & Arms","ARN_SA"),D("Legs","LEGS")]},
  {key:"apf3", days:3, name:"أنتيريور / بوستيريور / فول", plan:[D("Anterior","ANT"),D("Posterior","POST"),D("Full Body","FB_B")]},
  {key:"ul4", days:4, rec:true, name:"أبر / لوور ×2", plan:[D("Upper A","UPPER_A"),D("Lower A","LOWER_A"),D("Upper B","UPPER_B"),D("Lower B","LOWER_B")]},
  {key:"tl4", days:4, name:"تورسو / ليمبز ×2", plan:[D("Torso A","TORSO_A"),D("Limbs A","LIMBS_A"),D("Torso B","TORSO_B"),D("Limbs B","LIMBS_B")]},
  {key:"ap4", days:4, name:"أنتيريور / بوستيريور ×2", plan:[D("Anterior A","ANT"),D("Posterior A","POST"),D("Anterior B","LIMBS_B"),D("Posterior B","PULL")]},
  {key:"fb4", days:4, name:"فول بادي ×4", plan:[D("Full Body A","FB_A"),D("Full Body B","FB_B"),D("Full Body C","FB_C"),D("Full Body A","FB_A")]},
  {key:"ulppl", days:5, rec:true, name:"أبر / لوور / بوش / بول / ليجز", plan:[D("Upper","UPPER_A"),D("Lower","LOWER_A"),D("Push","PUSH_B"),D("Pull","PULL_B"),D("Legs","LEGS")]},
  {key:"phat", days:5, name:"PHAT (باور + هايبرتروفي)", plan:[D("Upper Power","PHAT_UP"),D("Lower Power","PHAT_LP"),D("Back & Shoulders Hypertrophy","PHAT_BS"),D("Lower Hypertrophy","PHAT_LH"),D("Chest & Arms Hypertrophy","PHAT_CA")]},
  {key:"pplul", days:5, name:"بوش / بول / ليجز + أبر / لوور", plan:[D("Push","PUSH"),D("Pull","PULL"),D("Legs","LEGS"),D("Upper","UPPER_B"),D("Lower","LOWER_B")]},
  {key:"arnul", days:5, name:"أرنولد + أبر / لوور", plan:[D("Chest & Back","ARN_CB"),D("Shoulders & Arms","ARN_SA"),D("Legs","LEGS"),D("Upper","UPPER_B"),D("Lower","LOWER_B")]},
  {key:"bro5", days:5, name:"برو سبليت (عضلة كل يوم)", plan:[D("Chest","BRO_CH"),D("Back","BRO_BK"),D("Shoulders","BRO_SH"),D("Legs","LEGS"),D("Arms","BRO_AR")]},
  {key:"ppl6", days:6, rec:true, name:"بوش / بول / ليجز ×2", plan:[D("Push A","PUSH"),D("Pull A","PULL"),D("Legs A","LEGS"),D("Push B","PUSH_B"),D("Pull B","PULL_B"),D("Legs B","LEGS_B")]},
  {key:"arn6", days:6, name:"أرنولد سبليت ×2", plan:[D("Chest & Back A","ARN_CB"),D("Shoulders & Arms A","ARN_SA"),D("Legs A","LEGS"),D("Chest & Back B","TORSO_B"),D("Shoulders & Arms B","BRO_AR"),D("Legs B","LEGS_B")]},
  {key:"ul6", days:6, name:"أبر / لوور ×3", plan:[D("Upper A","UPPER_A"),D("Lower A","LOWER_A"),D("Upper B","UPPER_B"),D("Lower B","LOWER_B"),D("Upper C","TORSO_A"),D("Lower C","LEGS")]},
];
/* Hassan's Mofit sheet program (Day 1-5) */
const MOFIT_SYS = { key:"mofit", days:5, name:"برنامج Mofit (الشيت)", plan:[1,2,3,4,5].map(d=>({label:"Day "+d, ex:MOFIT_TEMPLATE.filter(e=>e.day_no===d).map(e=>[e.name,e.sets,null,null])})) };


/* ---------- client level → program adjustments ---------- */
/* Coaching defaults; every value stays editable per client after applying. */
const LEVELS = {
  "مبتدئ": { icon:"🌱", desc:"مجموعات أقل · RIR 2-3 · تمبو بطيء للتكنيك · راحة أطول · 5 تمارين بحد أقصى",
    maxEx:5, setDelta:-1, minSets:2,
    rir:{c:"2-3", i:"2"}, tempo:{c:"3-1-1-0", i:"3-0-1-1"}, rest:{c:150, i:90}, lastToFailure:false },
  "متوسط": { icon:"💪", desc:"الحجم القياسي · RIR 1-2 · تمبو متحكم · راحة متوسطة",
    maxEx:8, setDelta:0, minSets:2,
    rir:{c:"1-2", i:"1"}, tempo:{c:"2-0-1-0", i:"2-1-1-0"}, rest:{c:120, i:75}, lastToFailure:false },
  "متقدم": { icon:"🔥", desc:"مجموعة إضافية للتمارين الأساسية · RIR 0-1 · نزول بطيء · آخر مجموعة عزل للفشل",
    maxEx:8, setDelta:0, compoundExtra:1, minSets:2,
    rir:{c:"1", i:"0-1"}, tempo:{c:"3-0-1-0", i:"3-1-1-0"}, rest:{c:180, i:90}, lastToFailure:true },
};
const COMPOUND_RE=/SQUAT|PRESS|ROW|DEADLIFT|PULLDOWN|PULL-UP|DIP|THRUST|SPLIT|LUNGE|HIP EXTENSION/i;
const isCompound=n=>COMPOUND_RE.test(n) && !/FLY|RAISE|CURL|EXTENSION MACHINE|PUSHDOWN|CRUNCH/i.test(n);
/* exercise tuple: [name, sets, reps, rir, rest, tempo, notes, video] */
function adaptPlan(plan, level){
  const L=LEVELS[level]||LEVELS["متوسط"];
  return plan.map(day=>({label:day.label, ex:day.ex.slice(0,L.maxEx).map(e=>{
    const c=isCompound(e[0]);
    let sets=(e[1]||3)+L.setDelta+(c&&L.compoundExtra?L.compoundExtra:0);
    sets=Math.max(L.minSets,Math.min(sets,6));
    const note=[e[6], (!c&&L.lastToFailure)?"آخر مجموعة للفشل 🔥":null].filter(Boolean).join(" · ")||null;
    return [e[0], sets, e[2]||(c?"6-10":"10-15"), c?L.rir.c:L.rir.i, c?L.rest.c:L.rest.i, c?L.tempo.c:L.tempo.i, note, e[7]||null];
  })}));
}
/* where training days fall in the 7-day cycle (rest days spread between them) */
const DEFAULT_SLOTS={1:[1],2:[1,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6],6:[1,2,3,4,5,6],7:[1,2,3,4,5,6,7]};
function planRows(clientId, plan){
  const rows=[], slots=DEFAULT_SLOTS[plan.length]||plan.map((_,i)=>i+1);
  plan.forEach((day,i)=>day.ex.forEach((e,j)=>rows.push({client_id:clientId,day_no:slots[i],position:j,day_label:day.label,name:e[0],sets:e[1]||3,target_reps:e[2]||null,target_rir:e[3]||null,rest_sec:e[4]||null,tempo:e[5]||null,notes:e[6]||null,video_url:e[7]||null})));
  return rows;
}
/* coach-saved programs are applied as saved (no level adjustment) */
function resolvePlan(sys, level){ return sys.custom ? sys.plan : adaptPlan(sys.plan, level); }
async function applyProgram(client, sys, level){
  const plan=resolvePlan(sys, level);
  const { error:de } = await sb.from("program_exercises").delete().eq("client_id",client.id);
  if(de){ toast(de.message); return false; }
  const { error } = await sb.from("program_exercises").insert(planRows(client.id, plan));
  if(error){ toast(error.message); return false; }
  await sb.from("profiles").update({training_days:plan.length, split_key:sys.key, split_name:sys.name, level, deload_weeks:(typeof DELOAD_DEFAULT!=="undefined"?DELOAD_DEFAULT[level]:null)||[]}).eq("id",client.id);
  return true;
}
async function loadCoachTemplates(){
  const { data } = await sb.from("program_templates").select("*").order("created_at",{ascending:false});
  S.templates=(data||[]).map(t=>({key:"tpl:"+t.id, id:t.id, days:t.days, name:t.name, plan:t.plan, custom:true}));
}
function findSystem(key){ return SYSTEMS.find(s=>s.key===key) || (key==="mofit"?MOFIT_SYS:null) || (S.templates||[]).find(t=>t.key===key); }
function systemOptions(days, selected){
  const list=SYSTEMS.filter(s=>s.days===days), rec=list.find(s=>s.rec);
  const coach=[...(S.templates||[]).filter(t=>t.days===days), ...(days===5?[MOFIT_SYS]:[])];
  return `<option value="${rec?rec.key:""}">⭐ الموصى به (${esc(rec?.name||"")})</option>
    ${coach.length?`<optgroup label="✍ برنامج الكوتش">${coach.map(t=>`<option value="${t.key}" ${selected===t.key?"selected":""}>✍ ${esc(t.name)}</option>`).join("")}</optgroup>`:""}
    <optgroup label="الأنظمة">${list.map(s=>`<option value="${s.key}" ${selected===s.key?"selected":""}>${esc(s.name)}</option>`).join("")}</optgroup>`;
}
function systemPreview(sys, level){
  if(!sys) return "";
  const plan=resolvePlan(sys, level);
  return plan.map((d,i)=>`<div class="pv-day"><div class="pv-h"><span class="pill navy">يوم ${i+1}</span><b>${esc(d.label)}</b><small>${d.ex.length} تمارين</small></div>
    ${d.ex.map(e=>`<div class="pv-ex"><span>${esc(e[0])}</span><em>${e[1]}×${esc(e[2]||"—")} · RIR ${esc(e[3]||"—")}${e[5]?" · "+esc(e[5]):""}${e[4]?" · "+e[4]+"ث":""}</em></div>`).join("")}</div>`).join("");
}
function systemFields(days, level){
  return `<div class="grid3">
    <label class="f">📅 أيام التمرين<select data-sys-days>${[2,3,4,5,6].map(d=>`<option ${d===days?"selected":""}>${d}</option>`).join("")}</select></label>
    <label class="f">🎚 المستوى<select data-sys-level>${Object.keys(LEVELS).map(l=>`<option value="${l}" ${l===level?"selected":""}>${LEVELS[l].icon} ${l}</option>`).join("")}</select></label>
    <label class="f">🧭 نظام التمرين<select data-sys></select></label></div>
    <p class="hint" data-sys-ldesc></p><div data-sys-pv class="pv"></div>`;
}
function wireSystemPicker(root, currentKey){
  const dSel=root.querySelector("[data-sys-days]"), lSel=root.querySelector("[data-sys-level]"), sSel=root.querySelector("[data-sys]"), pv=root.querySelector("[data-sys-pv]"), ld=root.querySelector("[data-sys-ldesc]");
  const draw=()=>{ const sys=findSystem(sSel.value); ld.textContent=sys?.custom?"برنامج الكوتش بيتطبق زي ما اتحفظ (المستوى مش بيغيّره).":LEVELS[lSel.value].desc; pv.innerHTML=systemPreview(sys, lSel.value); };
  const refresh=keep=>{ sSel.innerHTML=systemOptions(+dSel.value, keep); draw(); };
  dSel.onchange=()=>refresh(null); sSel.onchange=draw; lSel.onchange=draw;
  refresh(currentKey);
  return ()=>({ sys:findSystem(sSel.value), level:lSel.value });
}
