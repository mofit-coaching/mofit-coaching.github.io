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


/* ======================================================================
   v4 library — programs by goal.  Tuple: [name, sets, reps, rir, opts]
   opts: {fixed:true → level doesn't change sets, rest:sec, tempo, rir, note}
   ====================================================================== */
const F=(o)=>Object.assign({fixed:true},o);
Object.assign(B,{
  /* ---- strength ---- */
  W531_SQ:[["BACK SQUAT",3,"5/3/1+","1",F({rest:180,note:"5/3/1: أسبوع1 ‏65/75/85%×5 · أسبوع2 ‏70/80/90%×3 · أسبوع3 ‏75/85/95% (5-3-1) · أسبوع4 ديلود. النسب من 90% من أقصى وزنك. آخر مجموعة أقصى عدات بتكنيك نضيف"})],["BACK SQUAT – BBB",5,"10","3",F({rest:90,note:"Boring But Big: ‏5×10 بـ 50-60% من الأقصى"})],["LYING LEG CURL",3,"10-15","1"],["HANGING KNEE RAISE",3,"10-15","1"]],
  W531_BP:[["FLAT BB BENCH PRESS",3,"5/3/1+","1",F({rest:180,note:"نفس موجات 5/3/1 – آخر مجموعة AMRAP"})],["FLAT BB BENCH PRESS – BBB",5,"10","3",F({rest:90,note:"5×10 بـ 50-60%"})],["DB ROW",5,"10","2",F({rest:60})],["FACE PULL",3,"15-20","1"]],
  W531_DL:[["CONVENTIONAL DEADLIFT",3,"5/3/1+","1",F({rest:180,note:"نفس الموجات – ضهر مستقيم، البار لازق في الرجل"})],["CONVENTIONAL DEADLIFT – BBB",5,"10","3",F({rest:120,note:"5×10 بـ 50% – لو الضهر تعبان استبدلها بـ RDL"})],["WALKING LUNGE",3,"10/رجل","2"],["HANGING LEG RAISE",3,"8-12","1"]],
  W531_OHP:[["STANDING OVERHEAD PRESS",3,"5/3/1+","1",F({rest:180,note:"نفس الموجات – شد البطن والأرداف"})],["STANDING OVERHEAD PRESS – BBB",5,"10","3",F({rest:90,note:"5×10 بـ 50-60%"})],["CHIN-UP (OR ASSISTED)",5,"8-10","2",F({rest:75})],["DB CURL",3,"10-12","1"]],
  PHUL_UP:[["FLAT BB BENCH PRESS",4,"3-5","1-2",F({rest:180})],["BENT-OVER BB ROW",4,"3-5","1-2",F({rest:180})],["SEATED DB SHOULDER PRESS",3,"6-10","1-2"],["LAT PULLDOWN",3,"6-10","1-2"],["EZ BAR CURL",2,"6-10","1"],["SKULL CRUSHER",2,"6-10","1"]],
  PHUL_LP:[["BACK SQUAT",4,"3-5","1-2",F({rest:180})],["CONVENTIONAL DEADLIFT",3,"3-5","2",F({rest:180})],["LEG PRESS",3,"10-15","1-2"],["LYING LEG CURL",3,"6-10","1"],["STANDING CALF RAISE",4,"6-10","1"]],
  PHUL_UH:[["INCLINE DB PRESS",4,"8-12","1-2"],["CABLE FLY",3,"12-15","1"],["SEATED CABLE ROW",4,"8-12","1-2"],["SA DB ROW",3,"8-12","1-2"],["CABLE LATERAL RAISE",4,"12-20","1"],["INCLINE DB CURL",3,"10-15","1"],["OVERHEAD CABLE TRICEPS EXTENSION",3,"10-15","1"]],
  PHUL_LH:[["HACK SQUAT MACHINE",3,"8-12","1-2"],["WALKING LUNGE",3,"10/رجل","1-2"],["LEG EXTENSION MACHINE",3,"12-15","1"],["SEATED LEG CURL",3,"10-15","1"],["SEATED CALF RAISE MACHINE",4,"10-15","1"]],
  PB_AD:[["CABLE LATERAL RAISE",4,"12-20","1",F({rest:45,note:"ميو-ريبس في آخر مجموعة"})],["REAR DELT FLY MACHINE",3,"15-20","1"],["EZ BAR CURL",3,"8-12","1"],["CLOSE-GRIP BENCH PRESS",3,"6-10","2"],["INCLINE DB CURL",3,"10-15","1"],["CABLE TRICEPS PUSHDOWN",3,"12-15","1",F({note:"دروب سِت في آخر مجموعة"})]],
  LP_A:[["BACK SQUAT",3,"5","2",F({rest:180,note:"تطور خطي: زوّد 2.5 كجم كل جلسة طالما خلصت 3×5 بتكنيك نضيف. لو فشلت مرتين: نزّل 10% وابني تاني"})],["FLAT BB BENCH PRESS",3,"5","2",F({rest:180,note:"زوّد 1-2.5 كجم كل جلسة"})],["CONVENTIONAL DEADLIFT",1,"5","2",F({rest:180,note:"مجموعة شغل واحدة بعد إحماء تصاعدي"})],["LAT PULLDOWN",3,"8-10","2"]],
  LP_B:[["BACK SQUAT",3,"5","2",F({rest:180})],["STANDING OVERHEAD PRESS",3,"5","2",F({rest:150,note:"زوّد 1-2.5 كجم كل جلسة"})],["BENT-OVER BB ROW",3,"5","2",F({rest:150})],["CHIN-UP (OR ASSISTED)",3,"أقصى عدات","2"]],
  /* ---- advanced hypertrophy ---- */
  GVT_CB:[["FLAT DB PRESS",10,"10","2",F({rest:90,tempo:"4-0-2-0",note:"A1 – الحجم الألماني: 10×10 بنفس الوزن (~60% من الأقصى). سوبرسِت مع التمرين اللي بعده. زوّد الوزن بس لما تخلص الـ100 عدة"})],["CHEST-SUPPORTED ROW",10,"10","2",F({rest:90,tempo:"4-0-2-0",note:"A2 – بالتبادل مع الضغط"})],["CABLE FLY",3,"10-12","1",F({rest:60})],["SEATED CABLE ROW",3,"10-12","1",F({rest:60})]],
  GVT_LG:[["BACK SQUAT",10,"10","2",F({rest:90,tempo:"4-0-2-0",note:"A1 – 10×10 (~60%). لو حاسس بدوخة اقعد واشرب"})],["LYING LEG CURL",10,"10","2",F({rest:90,tempo:"4-0-2-0",note:"A2"})],["STANDING CALF RAISE",3,"15-20","1",F({rest:60})],["CABLE ROPE CRUNCH",3,"12-15","1",F({rest:60})]],
  GVT_AS:[["EZ BAR CURL",10,"10","2",F({rest:90,tempo:"3-0-2-0",note:"A1 – 10×10"})],["OVERHEAD CABLE TRICEPS EXTENSION",10,"10","2",F({rest:90,tempo:"3-0-2-0",note:"A2"})],["CABLE LATERAL RAISE",3,"12-15","1",F({rest:60})],["REAR DELT FLY MACHINE",3,"12-15","1",F({rest:60})]],
  HIT_SH:[["MACHINE SHOULDER PRESS",2,"6-10","0",F({rest:180,note:"مجموعة إحماء تصاعدية + مجموعة واحدة للفشل التام. لو في مساعد: 1-2 فورسد ريبس"})],["DB LATERAL RAISE",2,"10-12","0",F({rest:150})],["REAR DELT FLY MACHINE",2,"10-12","0",F({rest:150})],["CABLE TRICEPS PUSHDOWN",2,"8-12","0",F({rest:150})],["CLOSE-GRIP BENCH PRESS",2,"6-10","0",F({rest:180})]],
  HIT_BK:[["NEUTRAL-GRIP PULLDOWN",2,"6-10","0",F({rest:180,note:"مجموعة إحماء + مجموعة للفشل التام"})],["SA ISO LAT ROW MACHINE",2,"6-10","0",F({rest:180})],["BENT-OVER BB ROW",2,"6-10","0",F({rest:180})],["45-DEGREE HIP EXTENSION",2,"10-12","0",F({rest:150})]],
  HIT_CB:[["INCLINE BB BENCH PRESS",2,"6-10","0",F({rest:180,note:"مجموعة إحماء + مجموعة للفشل التام"})],["MACHINE CHEST PRESS",2,"6-10","0",F({rest:180})],["CABLE FLY",2,"10-12","0",F({rest:150})],["EZ BAR CURL",2,"6-10","0",F({rest:150})],["HAMMER CURL",2,"8-12","0",F({rest:150})]],
  HIT_LG:[["LEG EXTENSION MACHINE",2,"12-15","0",F({rest:150,note:"تمهيد للركبة قبل الأساسي"})],["LEG PRESS",2,"8-12","0",F({rest:180})],["HACK SQUAT MACHINE",2,"8-12","0",F({rest:180})],["LYING LEG CURL",2,"8-12","0",F({rest:150})],["STIFF-LEG DEADLIFT",2,"8-10","0",F({rest:180})],["STANDING CALF RAISE",2,"10-12","0",F({rest:120})]],
  SPEC_UA:[["FLAT BB BENCH PRESS",3,"6-10","2"],["LAT PULLDOWN",3,"8-12","1-2"],["CABLE LATERAL RAISE",4,"12-20","1",F({rest:45,note:"⭐ أولوية: أول تمرين عزل والطاقة عالية"})],["EZ BAR CURL",3,"8-12","1"],["OVERHEAD CABLE TRICEPS EXTENSION",3,"10-15","1"],["REAR DELT FLY MACHINE",3,"15-20","1"],["HAMMER CURL",2,"10-15","1"]],
  SPEC_UB:[["SEATED DB SHOULDER PRESS",4,"8-12","1-2",F({note:"⭐ أولوية الأكتاف"})],["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["INCLINE DB PRESS",3,"8-12","1-2"],["DB LATERAL RAISE",4,"15-20","1",F({rest:45,note:"آخر مجموعة دروب سِت"})],["PREACHER CURL",3,"10-12","1"],["CABLE TRICEPS PUSHDOWN",3,"12-15","1"],["INCLINE DB CURL",2,"12-15","1"]],
  MYO_A:[["LEG PRESS",4,"15 + 5+5+5","1",F({rest:20,note:"ميو-ريبس: مجموعة تنشيط 12-20 لحد RIR 1، بعدها 5 أنفاس ومجموعات صغيرة 3-5 عدات لحد ما تقل العدات. المجموعة = جولة"})],["MACHINE CHEST PRESS",4,"15 + 5+5+5","1",F({rest:20})],["LAT PULLDOWN",4,"15 + 5+5+5","1",F({rest:20})],["SEATED LEG CURL",3,"15 + 5+5","1",F({rest:20})],["CABLE LATERAL RAISE",3,"20 + 5+5","1",F({rest:20})]],
  MYO_B:[["HACK SQUAT MACHINE",4,"15 + 5+5+5","1",F({rest:20,note:"ميو-ريبس – نفس الطريقة"})],["INCLINE DB PRESS",4,"15 + 5+5+5","1",F({rest:20})],["SEATED CABLE ROW",4,"15 + 5+5+5","1",F({rest:20})],["HIP THRUST",3,"15 + 5+5","1",F({rest:20})],["CABLE CURL",3,"15 + 5+5","1",F({rest:20})],["CABLE TRICEPS PUSHDOWN",3,"15 + 5+5","1",F({rest:20})]],
  /* ---- glutes ---- */
  GL_A:[["HIP THRUST",4,"8-12","1-2",F({rest:120,note:"⭐ وقفة ثانية فوق مع عصر الأرداف، الدقن لتحت"})],["ROMANIAN DEADLIFT",3,"8-10","2"],["CABLE GLUTE KICKBACK",3,"12-15","1"],["HIP ABDUCTION MACHINE",3,"15-20","1",F({note:"اميل لقدام شوية لتركيز أكبر على الجلوتس"})],["LYING LEG CURL",3,"10-15","1"]],
  GL_B:[["BULGARIAN SPLIT SQUAT",3,"8-12","1-2",F({note:"⭐ ميل للأمام شوية والخطوة أطول = تركيز على الجلوتس"})],["LEG PRESS (HIGH FEET)",3,"10-15","1-2",F({note:"الرجل فوق في البلاتفورم وواسعة"})],["45-DEGREE HIP EXTENSION",3,"12-15","1",F({note:"ظهر مدوّر شوية والرجل لبرّه = جلوتس"})],["CABLE PULL-THROUGH",3,"12-15","1"],["HIP ABDUCTION MACHINE",3,"20-25","1"],["CABLE ROPE CRUNCH",3,"12-15","1"]],
  GL_UP:[["LAT PULLDOWN",3,"8-12","1-2"],["SEATED DB SHOULDER PRESS",3,"8-12","1-2"],["SEATED CABLE ROW",3,"10-12","1-2"],["CABLE LATERAL RAISE",3,"12-20","1"],["CABLE TRICEPS PUSHDOWN",2,"10-15","1"],["CABLE CURL",2,"10-15","1"]],
  GL_FB:[["HIP THRUST",3,"10-12","1-2"],["GOBLET SQUAT",3,"10-12","2"],["INCLINE DB PRESS",3,"8-12","1-2"],["CHEST-SUPPORTED ROW",3,"8-12","1-2"],["CABLE GLUTE KICKBACK",2,"15-20","1"],["FACE PULL",2,"15-20","1"]],
  /* ---- fat loss (keep the strength!) ---- */
  SUP_A:[["LEG PRESS",3,"10-15","2",F({rest:15,note:"A1 – سوبرسِت: على طول للتمرين اللي بعده"})],["LAT PULLDOWN",3,"10-12","2",F({rest:75,note:"A2 – الراحة بعد الزوج"})],["DB ROMANIAN DEADLIFT",3,"10-12","2",F({rest:15,note:"B1"})],["FLAT DB PRESS",3,"10-12","2",F({rest:75,note:"B2"})],["CABLE LATERAL RAISE",3,"15-20","1",F({rest:15,note:"C1"})],["CABLE ROPE CRUNCH",3,"12-15","1",F({rest:60,note:"C2"})],["BIKE INTERVALS",1,"10 دقائق","—",F({rest:0,note:"فينيشر: 30ث سريع / 30ث بطيء"})]],
  SUP_B:[["GOBLET SQUAT",3,"10-12","2",F({rest:15,note:"A1"})],["SEATED CABLE ROW",3,"10-12","2",F({rest:75,note:"A2"})],["WALKING LUNGE",3,"10/رجل","2",F({rest:15,note:"B1"})],["SEATED DB SHOULDER PRESS",3,"10-12","2",F({rest:75,note:"B2"})],["CABLE CURL",3,"12-15","1",F({rest:15,note:"C1"})],["CABLE TRICEPS PUSHDOWN",3,"12-15","1",F({rest:60,note:"C2"})],["INCLINE TREADMILL WALK",1,"15 دقيقة","—",F({rest:0,note:"ميل 8-12% · سرعة 5-5.5 كم/س"})]],
  SUP_C:[["HACK SQUAT MACHINE",3,"10-12","2",F({rest:15,note:"A1"})],["CHEST-SUPPORTED ROW",3,"10-12","2",F({rest:75,note:"A2"})],["HIP THRUST",3,"10-12","2",F({rest:15,note:"B1"})],["INCLINE DB PRESS",3,"10-12","2",F({rest:75,note:"B2"})],["FACE PULL",3,"15-20","1",F({rest:15,note:"C1"})],["HANGING KNEE RAISE",3,"10-15","1",F({rest:60,note:"C2"})]],
  CIR_A:[["GOBLET SQUAT",4,"40 ث","2",F({rest:20,note:"دايرة: التمارين الخمسة ورا بعض (40ث شغل/20ث راحة)، وبعدين 90ث راحة. المجموعة = جولة"})],["PUSH-UP",4,"40 ث","2",F({rest:20})],["DB ROW",4,"40 ث","2",F({rest:20})],["KETTLEBELL SWING",4,"40 ث","2",F({rest:20})],["MOUNTAIN CLIMBER",4,"40 ث","—",F({rest:90})]],
  CIR_B:[["DB REVERSE LUNGE",4,"40 ث","2",F({rest:20,note:"دايرة – نفس الطريقة"})],["DB SHOULDER PRESS",4,"40 ث","2",F({rest:20})],["TRX / INVERTED ROW",4,"40 ث","2",F({rest:20})],["DB ROMANIAN DEADLIFT",4,"40 ث","2",F({rest:20})],["PLANK",4,"40 ث","—",F({rest:90})]],
  STR_U:[["FLAT BB BENCH PRESS",3,"5-8","2",F({rest:150,note:"يوم قوة: الهدف تحافظ على العضل والقوة وانت في عجز سعرات"})],["BENT-OVER BB ROW",3,"6-8","2",F({rest:150})],["SEATED DB SHOULDER PRESS",3,"8-10","2"],["LAT PULLDOWN",3,"8-10","2"],["EZ BAR CURL",2,"10-12","1"]],
  STR_L:[["BACK SQUAT",3,"5-8","2",F({rest:150,note:"يوم قوة"})],["ROMANIAN DEADLIFT",3,"6-8","2",F({rest:150})],["LEG PRESS",2,"10-12","2"],["SEATED LEG CURL",3,"10-12","1"],["STANDING CALF RAISE",3,"10-15","1"]],
  /* ---- home ---- */
  HDB_A:[["DB GOBLET SQUAT",3,"10-15","2",F({tempo:"3-1-1-0"})],["DB FLOOR PRESS",3,"8-12","1-2"],["ONE-ARM DB ROW",3,"8-12","1-2"],["DB ROMANIAN DEADLIFT",3,"10-12","2"],["DB LATERAL RAISE",3,"12-20","1"],["DB CURL",2,"10-15","1"]],
  HDB_B:[["DB BULGARIAN SPLIT SQUAT",3,"8-12","1-2"],["DB SHOULDER PRESS",3,"8-12","1-2"],["DB PULLOVER",3,"10-12","1-2"],["SINGLE-LEG HIP THRUST",3,"10-15","1"],["DB OVERHEAD TRICEPS EXTENSION",3,"10-15","1"],["DEAD BUG",3,"8/ناحية","—"]],
  HDB_C:[["DB STEP-UP",3,"10/رجل","2"],["PUSH-UP (DEFICIT ON DBS)",3,"أقصى -2","2",F({note:"لو عملت 20+ حط رجلك على كرسي"})],["DB CHEST-SUPPORTED ROW (ON CHAIR)",3,"10-12","1-2"],["DB SUMO DEADLIFT",3,"10-12","2"],["DB HAMMER CURL",2,"10-15","1"],["SIDE PLANK",3,"30 ث/ناحية","—"]],
  BW_A:[["PUSH-UP (PROGRESSION)",4,"أقصى -2","2",F({tempo:"3-1-1-0",note:"سلم التطور: ركبة ← عادي ← رجل على كرسي ← آرتشر. لو عديت 15 بسهولة اطلع درجة"})],["INVERTED ROW (TABLE / BAR)",4,"8-15","2",F({note:"كل ما الجسم يبقى أفقي أكتر بتصعب"})],["BODYWEIGHT SPLIT SQUAT",3,"12-20/رجل","2",F({tempo:"3-1-1-0"})],["SINGLE-LEG GLUTE BRIDGE",3,"12-15/رجل","1"],["PLANK",3,"30-60 ث","—"]],
  BW_B:[["PIKE PUSH-UP",4,"6-12","2",F({note:"لأكتاف – لو سهل ارفع رجلك على كرسي"})],["DOOR TOWEL ROW",4,"10-15","2",F({note:"فوطة حوالين أوكرة الباب (اتأكد إنه مقفول)"})],["BULGARIAN SPLIT SQUAT (CHAIR)",3,"10-15/رجل","2"],["NORDIC CURL (ASSISTED)",3,"4-8","2",F({note:"رجلك تحت كنبة – انزل ببطء قد ما تقدر"})],["CHAIR DIP",3,"10-15","2"],["HOLLOW BODY HOLD",3,"20-40 ث","—"]],
  BW_C:[["CHIN-UP (IF BAR) OR TOWEL ROW",4,"أقصى -1","2"],["DECLINE PUSH-UP",3,"أقصى -2","2"],["JUMP SQUAT",3,"10","—",F({rest:90,note:"نزول ناعم على أطراف الصوابع"})],["SKATER LUNGE",3,"10/رجل","2"],["SUPERMAN HOLD",3,"20-30 ث","—"],["BURPEE FINISHER",1,"5 دقائق EMOM ×5","—",F({rest:0,note:"أول كل دقيقة 5 بيربي والباقي راحة"})]],
  /* ---- short on time ---- */
  MIN_A:[["BACK SQUAT",3,"6-10","2",F({rest:15,note:"A1 – سوبرسِت عشان الوقت"})],["LAT PULLDOWN",3,"8-12","1-2",F({rest:90,note:"A2"})],["FLAT DB PRESS",3,"8-12","1-2",F({rest:15,note:"B1"})],["ROMANIAN DEADLIFT",3,"8-10","2",F({rest:90,note:"B2"})],["CABLE LATERAL RAISE",2,"12-20","1",F({rest:45})]],
  MIN_B:[["LEG PRESS",3,"10-15","1-2",F({rest:15,note:"A1"})],["CHEST-SUPPORTED ROW",3,"8-12","1-2",F({rest:90,note:"A2"})],["INCLINE DB PRESS",3,"8-12","1-2",F({rest:15,note:"B1"})],["LYING LEG CURL",3,"10-15","1",F({rest:90,note:"B2"})],["CABLE CURL",2,"10-15","1",F({rest:15,note:"C1"})],["CABLE TRICEPS PUSHDOWN",2,"10-15","1",F({rest:45,note:"C2"})]],
  EXP_U:[["INCLINE DB PRESS",3,"8-12","1-2",F({rest:15,note:"A1 – الجلسة كلها ≈30 دقيقة"})],["CHEST-SUPPORTED ROW",3,"8-12","1-2",F({rest:75,note:"A2"})],["SEATED DB SHOULDER PRESS",3,"8-12","1-2",F({rest:15,note:"B1"})],["LAT PULLDOWN",3,"8-12","1-2",F({rest:75,note:"B2"})]],
  EXP_L:[["HACK SQUAT MACHINE",3,"8-12","1-2",F({rest:15,note:"A1 – ≈30 دقيقة"})],["LYING LEG CURL",3,"10-15","1",F({rest:75,note:"A2"})],["HIP THRUST",3,"8-12","1-2",F({rest:15,note:"B1"})],["STANDING CALF RAISE",3,"10-15","1",F({rest:60,note:"B2"})]],
  EXP_U2:[["MACHINE CHEST PRESS",3,"8-12","1-2",F({rest:15,note:"A1"})],["SEATED CABLE ROW",3,"8-12","1-2",F({rest:75,note:"A2"})],["CABLE LATERAL RAISE",3,"12-20","1",F({rest:15,note:"B1"})],["EZ BAR CURL",2,"8-12","1",F({rest:15,note:"B2"})],["CABLE TRICEPS PUSHDOWN",2,"10-15","1",F({rest:60,note:"B3"})]],
  EXP_L2:[["LEG PRESS",3,"10-15","1-2",F({rest:15,note:"A1"})],["ROMANIAN DEADLIFT",3,"8-10","2",F({rest:90,note:"A2"})],["LEG EXTENSION MACHINE",2,"12-15","1",F({rest:15,note:"B1"})],["CABLE ROPE CRUNCH",3,"12-15","1",F({rest:60,note:"B2"})]],
  /* ---- Ramadan ---- */
  RAM_U:[["INCLINE DB PRESS",3,"8-12","2-3",F({rir:"2-3",note:"رمضان: الهدف الحفاظ على العضل – ماتوصلش للفشل"})],["LAT PULLDOWN",3,"8-12","2-3",F({rir:"2-3"})],["SEATED DB SHOULDER PRESS",2,"10-12","2-3",F({rir:"2-3"})],["SEATED CABLE ROW",2,"10-12","2-3",F({rir:"2-3"})],["CABLE CURL",2,"12-15","2",F({rir:"2"})]],
  RAM_L:[["LEG PRESS",3,"10-12","2-3",F({rir:"2-3",note:"رمضان – اشرب مية بين المجموعات"})],["ROMANIAN DEADLIFT",3,"8-10","2-3",F({rir:"2-3"})],["SEATED LEG CURL",2,"12-15","2",F({rir:"2"})],["STANDING CALF RAISE",2,"12-15","2",F({rir:"2"})]],
  RAM_U2:[["MACHINE CHEST PRESS",3,"8-12","2-3",F({rir:"2-3"})],["CHEST-SUPPORTED ROW",3,"8-12","2-3",F({rir:"2-3"})],["CABLE LATERAL RAISE",2,"12-20","2",F({rir:"2"})],["CABLE TRICEPS PUSHDOWN",2,"12-15","2",F({rir:"2"})]],
  RAM_L2:[["HACK SQUAT MACHINE",3,"8-12","2-3",F({rir:"2-3"})],["HIP THRUST",3,"10-12","2-3",F({rir:"2-3"})],["LEG EXTENSION MACHINE",2,"12-15","2",F({rir:"2"})],["CABLE ROPE CRUNCH",2,"12-15","2",F({rir:"2"})]],
  /* ---- athletic ---- */
  ATH_A:[["BOX JUMP",4,"3","—",F({rest:90,note:"انفجار لفوق ونزول هادي على الصندوق – مش إرهاق"})],["TRAP BAR DEADLIFT",4,"4-6","2",F({rest:180})],["DB BULGARIAN SPLIT SQUAT",3,"6-8/رجل","2"],["NORDIC CURL (ASSISTED)",3,"4-6","2"],["FARMER'S WALK",3,"30 م","—",F({rest:90})],["PALLOF PRESS",3,"10/ناحية","—"]],
  ATH_B:[["MED BALL CHEST PASS",4,"5","—",F({rest:60,note:"أقصى سرعة في كل رمية"})],["PUSH PRESS",4,"4-6","2",F({rest:150})],["PULL-UP (OR ASSISTED)",4,"6-8","2",F({rest:120})],["DB BENCH PRESS",3,"8-10","2"],["FACE PULL",3,"15","1"],["SIDE PLANK",3,"30 ث/ناحية","—"]],
  ATH_C:[["KETTLEBELL SWING",4,"10-15","2",F({rest:60,note:"القوة من الحوض مش من الكتف"})],["FRONT SQUAT",3,"5-8","2",F({rest:150})],["SA DB ROW",3,"8-12","1-2"],["LANDMINE PRESS",3,"8-10/ذراع","2"],["LATERAL LUNGE",3,"8/ناحية","2"],["BIKE SPRINT",6,"15 ث","—",F({rest:45,note:"أقصى جهد 15ث / راحة 45ث"})]],
  /* ---- special ---- */
  SAFE_A:[["MCGILL CURL-UP",3,"10 ث ×5","—",F({rest:30,note:"الثلاثي الذهبي لماك جيل – إحماء أساسي قبل أي تمرين"})],["SIDE PLANK",3,"10 ث ×5/ناحية","—",F({rest:30})],["BIRD DOG",3,"10 ث ×5/ناحية","—",F({rest:30})],["LEG PRESS",3,"10-15","2",F({note:"ماتنزلش لدرجة إن الحوض يتلف (Butt wink)"})],["MACHINE CHEST PRESS",3,"8-12","2"],["CHEST-SUPPORTED ROW",3,"8-12","2",F({note:"الصدر على المسند = صفر حمل على أسفل الضهر"})],["HIP THRUST",3,"10-12","2"]],
  SAFE_B:[["MCGILL CURL-UP",3,"10 ث ×5","—",F({rest:30,note:"الثلاثي الذهبي"})],["SIDE PLANK",3,"10 ث ×5/ناحية","—",F({rest:30})],["BIRD DOG",3,"10 ث ×5/ناحية","—",F({rest:30})],["DB SPLIT SQUAT",3,"8-12/رجل","2"],["LAT PULLDOWN",3,"8-12","2"],["MACHINE SHOULDER PRESS",3,"8-12","2"],["SEATED LEG CURL",3,"10-15","1"]],
  FND_A:[["LEG PRESS",3,"10-12","3",F({tempo:"3-1-1-0",rir:"3",note:"تأسيس: الهدف التكنيك والعادة مش الأوزان. خليك بعيد عن الفشل"})],["MACHINE CHEST PRESS",3,"10-12","3",F({tempo:"3-1-1-0",rir:"3"})],["LAT PULLDOWN",3,"10-12","3",F({tempo:"3-1-1-0",rir:"3"})],["SEATED LEG CURL",2,"12-15","3",F({rir:"3"})],["PLANK",3,"20-40 ث","—"]],
  FND_B:[["GOBLET SQUAT",3,"10-12","3",F({tempo:"3-1-1-0",rir:"3",note:"اتعلم السكوات بالدمبل قبل البار"})],["MACHINE SHOULDER PRESS",3,"10-12","3",F({rir:"3"})],["SEATED CABLE ROW",3,"10-12","3",F({tempo:"2-1-1-1",rir:"3"})],["45-DEGREE HIP EXTENSION",2,"12-15","3",F({rir:"3",note:"تعليم مفصلة الحوض (Hip hinge) قبل الديدلفت"})],["DEAD BUG",3,"8/ناحية","—"]],
});

/* categories + coach notes for every system */
const CATS={ hyp:"💪 تضخيم", str:"🏋 قوة", pb:"⚡ باوربيلدنج (قوة + تضخيم)", fat:"🔥 حرق دهون", glute:"🍑 جلوتس / سيدات", home:"🏠 البيت بدون جيم", time:"⏱ وقت قليل", ath:"🤸 رياضي / لياقة", special:"🌙 حالات خاصة" };
const LEVEL_RANK={"مبتدئ":0,"متوسط":1,"متقدم":2};
SYSTEMS.push(
  {key:"lp3", days:3, cat:"str", min:"مبتدئ", name:"قوة خطية للمبتدئين (A/B/A)", desc:"3×5 على الأساسيات وزيادة وزن كل جلسة. أسرع طريقة يبني بيها المبتدئ قوة في أول 3-6 شهور.", plan:[D("Workout A","LP_A"),D("Workout B","LP_B"),D("Workout A","LP_A")]},
  {key:"w531", days:4, cat:"str", min:"متوسط", name:"5/3/1 Boring But Big", desc:"موجات 4 أسابيع على السكوات والبنش والديدلفت والأوفرهيد + 5×10 حجم. ممتاز لما التطور الخطي يقف.", plan:[D("Squat Day","W531_SQ"),D("Bench Day","W531_BP"),D("Deadlift Day","W531_DL"),D("Press Day","W531_OHP")]},
  {key:"phul", days:4, cat:"pb", min:"متوسط", name:"PHUL (باور + تضخيم)", desc:"يومين قوة (3-5 عدات) ويومين تضخيم. لعميل عايز أرقام وشكل في نفس الوقت.", plan:[D("Upper Power","PHUL_UP"),D("Lower Power","PHUL_LP"),D("Upper Hypertrophy","PHUL_UH"),D("Lower Hypertrophy","PHUL_LH")]},
  {key:"pb5", days:5, cat:"pb", min:"متوسط", name:"باوربيلدنج 5 أيام (PHUL + أكتاف وذراعين)", desc:"PHUL كامل + يوم خامس للأكتاف والذراعين بتقنيات كثافة.", plan:[D("Upper Power","PHUL_UP"),D("Lower Power","PHUL_LP"),D("Upper Hypertrophy","PHUL_UH"),D("Lower Hypertrophy","PHUL_LH"),D("Arms & Delts","PB_AD")]},
  {key:"gvt", days:3, cat:"hyp", min:"متقدم", name:"الحجم الألماني GVT ‏(10×10)", desc:"صدمة حجم لمدة 4-6 أسابيع بس، وبعدها ارجع لنظام عادي. مش للمبتدئ. سعرات فائض ونوم كويس شرط.", plan:[D("Chest & Back","GVT_CB"),D("Legs & Abs","GVT_LG"),D("Arms & Shoulders","GVT_AS")]},
  {key:"hit4", days:4, cat:"hyp", min:"متقدم", name:"HIT – مجموعة واحدة للفشل (دوريان ييتس)", desc:"حجم قليل وشدة قصوى: مجموعة إحماء + مجموعة واحدة للفشل. للمتقدم اللي وقته قليل أو جسمه بيستجيب للشدة.", plan:[D("Shoulders & Triceps","HIT_SH"),D("Back","HIT_BK"),D("Chest & Biceps","HIT_CB"),D("Legs","HIT_LG")]},
  {key:"spec4", days:4, cat:"hyp", min:"متوسط", name:"تخصص نقاط الضعف: أكتاف + ذراعين", desc:"أبر/لوور مع أولوية للأكتاف والذراعين (حجم أعلى وتمارينهم بدري في الجلسة). 6-8 أسابيع وبعدين ارجع للتوازن.", plan:[D("Upper A ⭐","SPEC_UA"),D("Lower A","LOWER_A"),D("Upper B ⭐","SPEC_UB"),D("Lower B","LOWER_B")]},
  {key:"myo3", days:3, cat:"time", min:"متوسط", name:"ميو-ريبس (حجم عالي في وقت قليل)", desc:"كل تمرين = مجموعة تنشيط + مجموعات صغيرة براحة 5 أنفاس. نفس التحفيز في نص الوقت تقريباً.", plan:[D("Full Body A","MYO_A"),D("Full Body B","MYO_B"),D("Full Body A","MYO_A")]},
  {key:"gl3", days:3, cat:"glute", min:"مبتدئ", name:"جلوتس فوكس – 3 أيام", desc:"يومين أرداف وخلفية + يوم أبر. ملحوظة للعميلة: مفيش حاجة اسمها \"توننج\" – بنبني العضلة وبعدين الدهون بتنزل بالدايت.", plan:[D("Glutes & Hams","GL_A"),D("Upper","GL_UP"),D("Glutes & Quads","GL_B")]},
  {key:"gl4", days:4, cat:"glute", min:"مبتدئ", name:"جلوتس فوكس – 4 أيام", desc:"يومين أرداف + يوم أبر + يوم فول بادي. أنسب توزيع لعميلة هدفها الأرداف مع جسم متناسق.", plan:[D("Glutes & Hams","GL_A"),D("Upper","GL_UP"),D("Glutes & Quads","GL_B"),D("Full Body","GL_FB")]},
  {key:"sup3", days:3, cat:"fat", min:"مبتدئ", name:"سوبرسِتس حرق – 3 أيام", desc:"تمارين متضادة مع بعض وراحة قصيرة + فينيشر كارديو. الحرق الحقيقي من الدايت – التمرين وظيفته يحافظ على العضل.", plan:[D("Full Body A","SUP_A"),D("Full Body B","SUP_B"),D("Full Body C","SUP_C")]},
  {key:"cir4", days:4, cat:"fat", min:"متوسط", name:"سيركت + قوة – 4 أيام", desc:"يومين دواير ميتابوليك + يومين قوة تقيلة. أذكى من الكارديو بس: بيحرق وبيحافظ على القوة في العجز.", plan:[D("Circuit A","CIR_A"),D("Upper Strength","STR_U"),D("Circuit B","CIR_B"),D("Lower Strength","STR_L")]},
  {key:"hdb3", days:3, cat:"home", min:"مبتدئ", name:"البيت – دمبلز بس", desc:"زوج دمبل قابل للتعديل + كرسي. لعميل مش هيروح جيم أو مسافر.", plan:[D("Home A","HDB_A"),D("Home B","HDB_B"),D("Home C","HDB_C")]},
  {key:"bw3", days:3, cat:"home", min:"مبتدئ", name:"وزن الجسم (بدون أي أدوات)", desc:"تطور بالصعوبة مش بالوزن: كل تمرين ليه سلم مستويات. ينفع في البيت أو الفندق.", plan:[D("Bodyweight A","BW_A"),D("Bodyweight B","BW_B"),D("Bodyweight C","BW_C")]},
  {key:"min2", days:2, cat:"time", min:"مبتدئ", name:"مينيماليست – يومين × 45 دقيقة", desc:"أقل جرعة فعالة: سوبرسِتس للأساسيات. للعميل المشغول جداً – أحسن من صفر بكتير.", plan:[D("Full Body A","MIN_A"),D("Full Body B","MIN_B")]},
  {key:"exp4", days:4, cat:"time", min:"مبتدئ", name:"إكسبريس 30 دقيقة – 4 أيام", desc:"4 تمارين في سوبرسِتس كل يوم. للي بيتمرن قبل/بعد الشغل.", plan:[D("Upper A","EXP_U"),D("Lower A","EXP_L"),D("Upper B","EXP_U2"),D("Lower B","EXP_L2")]},
  {key:"ram4", days:4, cat:"special", min:"مبتدئ", name:"🌙 رمضان – 4 أيام", desc:"حجم أقل وRIR 2-3. أحسن وقت: بعد الفطار بساعة ونص أو قبل السحور. ماتتمرنش تقيل وانت صايم، واشرب 2.5-3 لتر بين الفطار والسحور.", plan:[D("Upper A","RAM_U"),D("Lower A","RAM_L"),D("Upper B","RAM_U2"),D("Lower B","RAM_L2")]},
  {key:"safe3", days:3, cat:"special", min:"مبتدئ", name:"ضهر آمن (لآلام أسفل الضهر)", desc:"بدون حمل على العمود الفقري + ثلاثي ماك جيل كإحماء. مش علاج: لو في تنميل أو ألم نازل للرجل لازم دكتور الأول.", plan:[D("Safe A","SAFE_A"),D("Safe B","SAFE_B"),D("Safe A","SAFE_A")]},
  {key:"fnd3", days:3, cat:"special", min:"مبتدئ", name:"تأسيس التكنيك (أول 4-6 أسابيع)", desc:"أجهزة وتمارين سهلة التعلم، تمبو بطيء وRIR 3. أحسن بداية لعميل عمره ما تمرن – بعدها انقله لفول بادي أو أبر/لوور.", plan:[D("Foundations A","FND_A"),D("Foundations B","FND_B"),D("Foundations A","FND_A")]},
  {key:"ath3", days:3, cat:"ath", min:"متوسط", name:"رياضي: قوة + انفجار", desc:"قفز ورمي وكاريز مع قوة أساسية. للاعب كورة أو أي رياضة أو لعميل عايز لياقة مش شكل بس.", plan:[D("Lower Power","ATH_A"),D("Upper Power","ATH_B"),D("Athletic Full","ATH_C")]},
);
/* default meta for the original library */
SYSTEMS.forEach(s=>{ if(!s.cat) s.cat = s.key==="phat"?"pb":"hyp"; if(!s.min) s.min = ["phat","bro5","ppl6","arn6","ul6"].includes(s.key)?"متوسط":"مبتدئ"; });
Object.assign(SYSTEMS.find(s=>s.key==="phat"),{desc:"باور + تضخيم في نفس الأسبوع (لايل نورتون). محتاج استشفاء كويس."});
Object.assign(SYSTEMS.find(s=>s.key==="bro5"),{desc:"عضلة كل يوم. تردد مرة واحدة للعضلة – للمتوسط اللي بيحب التركيز، مش الأفضل للمبتدئ."});
Object.assign(SYSTEMS.find(s=>s.key==="fbeod"),{desc:"أفضل نقطة بداية لمعظم العملاء: كل عضلة 3 مرات في الأسبوع بحجم معقول."});
Object.assign(SYSTEMS.find(s=>s.key==="ul4"),{desc:"الأكثر توازناً لـ 4 أيام: كل عضلة مرتين في الأسبوع."});
Object.assign(SYSTEMS.find(s=>s.key==="ppl6"),{desc:"تردد مرتين وحجم عالي. للمتوسط/المتقدم اللي يقدر يلتزم 6 أيام ونومه كويس."});

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
const COMPOUND_RE=/SQUAT|PRESS|ROW|DEADLIFT|PULLDOWN|PULL-UP|CHIN-UP|PUSH-UP|DIP|THRUST|SPLIT|LUNGE|HIP EXTENSION|STEP-UP|SWING|FARMER|PULL-THROUGH/i;
const isCompound=n=>COMPOUND_RE.test(n) && !/FLY|RAISE|CURL|EXTENSION MACHINE|PUSHDOWN|CRUNCH/i.test(n);
/* exercise tuple: [name, sets, reps, rir, rest, tempo, notes, video] */
function adaptPlan(plan, level){
  const L=LEVELS[level]||LEVELS["متوسط"];
  return plan.map(day=>({label:day.label, ex:day.ex.slice(0,L.maxEx).map(e=>{
    const c=isCompound(e[0]), o=(e[4]&&typeof e[4]==="object")?e[4]:{};
    let sets=e[1]||3;
    if(!o.fixed){ sets+=L.setDelta+(c&&L.compoundExtra?L.compoundExtra:0); sets=Math.max(L.minSets,Math.min(sets,6)); }
    const note=[o.note||(typeof e[6]==="string"?e[6]:null), (!o.fixed&&!c&&L.lastToFailure)?"آخر مجموعة للفشل 🔥":null].filter(Boolean).join(" · ")||null;
    const rir=o.rir || (o.fixed&&e[3]?e[3]:(c?L.rir.c:L.rir.i));
    const rest=o.rest!==undefined?o.rest:(c?L.rest.c:L.rest.i);
    return [e[0], sets, e[2]||(c?"6-10":"10-15"), rir, rest||null, o.tempo||(c?L.tempo.c:L.tempo.i), note, e[7]||null];
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
  await sb.from("profiles").update({training_days:plan.length, split_key:sys.key, split_name:sys.name, level, program_started_at:new Date().toISOString(), deload_weeks:(typeof DELOAD_DEFAULT!=="undefined"?DELOAD_DEFAULT[level]:null)||[]}).eq("id",client.id);
  return true;
}
async function loadCoachTemplates(){
  const { data } = await sb.from("program_templates").select("*").order("created_at",{ascending:false});
  S.templates=(data||[]).map(t=>({key:"tpl:"+t.id, id:t.id, days:t.days, name:t.name, plan:t.plan, custom:true}));
}
function findSystem(key){ return SYSTEMS.find(s=>s.key===key) || (key==="mofit"?MOFIT_SYS:null) || (S.templates||[]).find(t=>t.key===key); }
function systemOptions(days, selected, cat){
  const ok=s=>s.days===days&&(!cat||s.cat===cat);
  const list=SYSTEMS.filter(ok), rec=SYSTEMS.find(s=>s.days===days&&s.rec);
  const coach=cat?[]:[...(S.templates||[]).filter(t=>t.days===days), ...(days===5?[MOFIT_SYS]:[])];
  if(!list.length&&!coach.length){ const av=[...new Set(SYSTEMS.filter(s=>s.cat===cat).map(s=>s.days))].sort(); return `<option value="">مفيش نظام بالهدف ده لـ ${days} أيام – متاح لـ: ${av.join("، ")} أيام</option>`; }
  const groups=Object.keys(CATS).map(c=>[c,list.filter(s=>s.cat===c)]).filter(([,l])=>l.length);
  return `${!cat&&rec?`<option value="${rec.key}">⭐ الموصى به (${esc(rec.name)})</option>`:""}
    ${coach.length?`<optgroup label="✍ برنامج الكوتش">${coach.map(t=>`<option value="${t.key}" ${selected===t.key?"selected":""}>✍ ${esc(t.name)}</option>`).join("")}</optgroup>`:""}
    ${groups.map(([c,l])=>`<optgroup label="${CATS[c]}">${l.map(s=>`<option value="${s.key}" ${selected===s.key?"selected":""}>${esc(s.name)}</option>`).join("")}</optgroup>`).join("")}`;
}
/* ---------- expert checks: weekly volume per muscle, session time, fit ---------- */
const MUSCLES=[  /* order matters: first match wins */
  ["أكتاف",/SHOULDER PRESS|OVERHEAD PRESS|PUSH PRESS|LANDMINE|LATERAL RAISE|REAR DELT|FACE PULL|PIKE|UPRIGHT/i],
  ["خلفية/أرداف",/DEADLIFT|LEG CURL|NORDIC|HIP THRUST|GLUTE|HIP EXTENSION|PULL-THROUGH|SWING|ABDUCTION|BRIDGE|SUPERMAN/i],
  ["تراي",/TRICEPS|PUSHDOWN|SKULL|CLOSE-GRIP|CHAIR DIP|KICKBACK/i],
  ["باي",/CURL(?!-UP)/i],
  ["صدر",/BENCH|CHEST PRESS|DB PRESS|FLOOR PRESS|FLY|PEC|DIPS \(CHEST|WEIGHTED DIP|PUSH-UP|CHEST PASS/i],
  ["ضهر",/ROW|PULLDOWN|PULL-UP|CHIN-UP|PULLOVER|STRAIGHT-ARM|SHRUG/i],
  ["سمانة",/CALF/i],
  ["أمامية",/SQUAT|LEG PRESS|LEG EXTENSION|LUNGE|SPLIT|STEP-UP|JUMP/i],
  ["بطن",/CRUNCH|RAISE|PLANK|DEAD BUG|BIRD DOG|PALLOF|HOLLOW|CURL-UP|ROLLOUT|CLIMBER/i],
];
const muscleOf=n=>(MUSCLES.find(([,re])=>re.test(n))||["أخرى"])[0];
function planStats(plan){
  const vol={}; let mins=[];
  plan.forEach(d=>{ let sec=0; d.ex.forEach(e=>{ const m=muscleOf(e[0]); vol[m]=(vol[m]||0)+(+e[1]||0); sec+=(+e[1]||0)*(45+(+e[4]||75)); }); mins.push(Math.round((sec+600)/60)); });
  return {vol, mins};
}
function systemChecks(sys, level, plan, cid){
  const W=[], st=planStats(plan), main=["صدر","ضهر","أكتاف","أمامية","خلفية/أرداف"];
  if(sys && !sys.custom && LEVEL_RANK[level]<LEVEL_RANK[sys.min||"مبتدئ"]) W.push(`⚠ النظام ده متصمم لمستوى <b>${esc(sys.min)}</b> – للمستوى ده هيبقى صعب على الاستشفاء والتكنيك.`);
  const h=cid&&S.health?.[cid];
  if(h?.answers?.joint) W.push(`🩺 العميل قال إن عنده إصابة/مشكلة مفاصل${h.details?": "+esc(h.details):""} – راجع التمارين أو استخدم "ضهر آمن".`);
  if(h?.flagged&&!h.cleared_at) W.push(`⚕ العميل محتاج تصريح طبي قبل التمرين التقيل.`);
  const maxM=Math.max(...st.mins); if(maxM>95) W.push(`⏱ أطول جلسة ≈ ${maxM} دقيقة – أكتر من 90 دقيقة بتقلل الالتزام. فكّر في سوبرسِتس أو تقليل تمرين.`);
  if(sys&&!["str","special","time","home","fat","ath"].includes(sys.cat)) main.forEach(m=>{ const v=st.vol[m]||0; if(v>0&&v<8) W.push(`📉 ${m}: ${v} مجموعات/أسبوع – أقل من الحد الأدنى للتضخيم (~10).`); if(v>24) W.push(`📈 ${m}: ${v} مجموعة/أسبوع – عالي جداً، خلي بالك من الاستشفاء.`); });
  const chips=Object.entries(st.vol).sort((a,b)=>b[1]-a[1]).map(([m,v])=>{ const cls=!main.includes(m)?"":v<8?"warn":v>24?"bad":"ok"; return `<span class="vchip ${cls}">${m} <b>${v}</b></span>`; }).join("");
  return `<div class="pv-meta">${sys?.desc?`<p class="pv-desc">💡 ${esc(sys.desc)}</p>`:""}
    <div class="pv-row"><span class="pill navy">⏱ الجلسة ≈ ${Math.min(...st.mins)===maxM?maxM:Math.min(...st.mins)+"–"+maxM} دقيقة</span><span class="pill">${Object.values(st.vol).reduce((a,b)=>a+b,0)} مجموعة/أسبوع</span>${sys?.min?`<span class="pill">من مستوى ${esc(sys.min)}</span>`:""}</div>
    <div class="muted" style="font-size:.72rem;margin:8px 0 4px;font-weight:700">مجموعات أسبوعية لكل عضلة (المدى المثالي للتضخيم 10-20)</div><div class="vchips">${chips}</div>
    ${W.length?`<div class="pv-warn">${W.map(w=>`<div>${w}</div>`).join("")}</div>`:`<div class="pv-ok">✅ البرنامج متوازن للمستوى ده</div>`}</div>`;
}
function systemPreview(sys, level, cid){
  if(!sys) return "";
  const plan=resolvePlan(sys, level);
  return systemChecks(sys, level, plan, cid)+plan.map((d,i)=>`<div class="pv-day"><div class="pv-h"><span class="pill navy">يوم ${i+1}</span><b>${esc(d.label)}</b><small>${d.ex.length} تمارين</small></div>
    ${d.ex.map(e=>`<div class="pv-ex"><span>${esc(e[0])}</span><em>${e[1]}×${esc(e[2]||"—")} · RIR ${esc(e[3]||"—")}${e[5]?" · "+esc(e[5]):""}${e[4]?" · "+e[4]+"ث":""}</em>${e[6]?`<small class="pv-note">${esc(e[6])}</small>`:""}</div>`).join("")}</div>`).join("");
}
function systemFields(days, level){
  return `<div class="grid2">
    <label class="f">📅 أيام التمرين<select data-sys-days>${[2,3,4,5,6].map(d=>`<option ${d===days?"selected":""}>${d}</option>`).join("")}</select></label>
    <label class="f">🎚 المستوى<select data-sys-level>${Object.keys(LEVELS).map(l=>`<option value="${l}" ${l===level?"selected":""}>${LEVELS[l].icon} ${l}</option>`).join("")}</select></label></div>
    <div class="grid2"><label class="f">🎯 الهدف<select data-sys-cat><option value="">كل الأهداف</option>${Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label>
    <label class="f">🧭 نظام التمرين<select data-sys></select></label></div>
    <p class="hint" data-sys-ldesc></p><div data-sys-pv class="pv"></div>`;
}
function wireSystemPicker(root, currentKey, cid){
  const dSel=root.querySelector("[data-sys-days]"), lSel=root.querySelector("[data-sys-level]"), cSel=root.querySelector("[data-sys-cat]"), sSel=root.querySelector("[data-sys]"), pv=root.querySelector("[data-sys-pv]"), ld=root.querySelector("[data-sys-ldesc]");
  const cur=findSystem(currentKey); if(cur?.cat&&cSel&&!cur.custom) cSel.value="";
  const draw=()=>{ const sys=findSystem(sSel.value); ld.textContent=sys?.custom?"برنامج الكوتش بيتطبق زي ما اتحفظ (المستوى مش بيغيّره).":LEVELS[lSel.value].desc; pv.innerHTML=systemPreview(sys, lSel.value, cid); };
  const refresh=keep=>{ sSel.innerHTML=systemOptions(+dSel.value, keep, cSel?.value||""); draw(); };
  dSel.onchange=()=>refresh(null); sSel.onchange=draw; lSel.onchange=draw; if(cSel) cSel.onchange=()=>refresh(null);
  refresh(currentKey);
  return ()=>({ sys:findSystem(sSel.value), level:lSel.value });
}
