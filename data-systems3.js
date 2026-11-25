/* ======================================================================
   WOMEN'S BODYWEIGHT MATRIX (home, zero equipment, 2-5 days)
   ====================================================================== */
Object.assign(B,{
  /* ---- women's home bodyweight (no dumbbells, no bands) ---- */
  WBW_FA:[["BODYWEIGHT SPLIT SQUAT",3,"10-15/رجل","2",F({tempo:"3-1-1-0"})],["PUSH-UP (PROGRESSION)",3,"8-15","2"],["DOOR TOWEL ROW",3,"10-15","2"],["SINGLE-LEG GLUTE BRIDGE",3,"10-12/ناحية","2"],["DEAD BUG",3,"8/ناحية","—"]],
  WBW_FB:[["BULGARIAN SPLIT SQUAT (CHAIR)",3,"8-12/رجل","2"],["PIKE PUSH-UP",3,"6-12","2"],["INVERTED ROW (TABLE / BAR)",3,"8-15","2"],["NORDIC CURL (ASSISTED)",2,"4-8","2",F({note:"رجلك تحت كنبة – انزل ببطء قد ما تقدر"})],["SIDE PLANK",3,"15-30 ث/ناحية","—"]],
  WBW_G:[["SINGLE-LEG HIP THRUST",3,"10-12/ناحية","2",F({note:"ضهرك على كنبة أو كرسي – وقفة ثانية فوق مع عصر الأرداف"})],["SKATER LUNGE",3,"8-10/رجل","2"],["LATERAL LUNGE",3,"10/رجل","2"],["SINGLE-LEG GLUTE BRIDGE",3,"12-15/ناحية","1"],["BIRD DOG",3,"8/ناحية","—"]],
  WBW_LA:[["BODYWEIGHT SPLIT SQUAT",4,"10-15/رجل","2",F({tempo:"3-1-1-0"})],["LATERAL LUNGE",3,"10/رجل","2"],["SINGLE-LEG GLUTE BRIDGE",3,"10-12/ناحية","2"],["PLANK",3,"20-40 ث","—"]],
  WBW_UA:[["PUSH-UP (PROGRESSION)",4,"8-15","2"],["DOOR TOWEL ROW",4,"10-15","2"],["PIKE PUSH-UP",3,"6-12","2"],["CHAIR DIP",2,"8-12","2"],["DEAD BUG",3,"8/ناحية","—"]],
  WBW_LB:[["BULGARIAN SPLIT SQUAT (CHAIR)",3,"8-12/رجل","2"],["NORDIC CURL (ASSISTED)",3,"4-8","2",F({note:"رجلك تحت كنبة – انزل ببطء قد ما تقدر"})],["SKATER LUNGE",3,"8-10/رجل","2"],["SIDE PLANK",3,"15-30 ث/ناحية","—"]],
  WBW_UB:[["DECLINE PUSH-UP",3,"أقصى -2","2"],["INVERTED ROW (TABLE / BAR)",4,"8-15","2"],["CHAIR DIP",3,"8-15","2"],["SUPERMAN HOLD",3,"20-30 ث","—"],["HOLLOW BODY HOLD",3,"20-40 ث","—"]],
});
SYSTEMS.push(
  {key:"wbw2", days:2, cat:"glute", min:"مبتدئ", name:"سيدات بيت بدون معدات – يومين", desc:"وزن جسم بس، من غير دمبلز ولا لاستك – كرسي أو كنبة أو ترابيزة بس. فول بادي مرتين يغطي كل الجسم.", plan:[D("Bodyweight Full A","WBW_FA"),D("Bodyweight Full B","WBW_FB")]},
  {key:"wbw3", days:3, cat:"glute", min:"مبتدئ", name:"سيدات بيت بدون معدات – 3 أيام", desc:"يومين فول بادي + يوم أرداف – كلها بوزن الجسم من غير أي معدات.", plan:[D("Bodyweight Full A","WBW_FA"),D("Bodyweight Full B","WBW_FB"),D("Bodyweight Glutes","WBW_G")]},
  {key:"wbw4", days:4, cat:"glute", min:"مبتدئ", name:"سيدات بيت بدون معدات – 4 أيام", desc:"لوور ×2 وأبر ×2 بوزن الجسم – توزيع كامل من غير معدات.", plan:[D("Bodyweight Lower A","WBW_LA"),D("Bodyweight Upper A","WBW_UA"),D("Bodyweight Lower B","WBW_LB"),D("Bodyweight Upper B","WBW_UB")]},
  {key:"wbw5", days:5, cat:"glute", min:"متوسط", name:"سيدات بيت بدون معدات – 5 أيام", desc:"أقصى توزيع بوزن الجسم: لوور ×2 وأبر ×2 + يوم أرداف. الصعوبة بتيجي من سلم التطور مش من الوزن.", plan:[D("Bodyweight Lower A","WBW_LA"),D("Bodyweight Upper A","WBW_UA"),D("Bodyweight Lower B","WBW_LB"),D("Bodyweight Upper B","WBW_UB"),D("Bodyweight Glutes","WBW_G")]},
);
