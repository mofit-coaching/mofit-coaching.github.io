/* Program with receipts: the science reason behind each exercise, with real sources.
   Every claim is tied to a peer-reviewed review/meta-analysis (PubMed / journal page, all verified).
   Matching: exact exercise name first, then movement-pattern regex (same style as LOWER_RE in pro.js),
   then an honest generic fallback. Display-only; no program data is touched.
   w  = the "why" in Egyptian Arabic (coach voice, no unsourced numbers)
   src = [ [short Arabic citation label, URL] ] */
window.RECEIPTS=(function(){
  const MECH=["آليات تضخيم العضلة وتطبيقاتها – Schoenfeld 2010 (J Strength Cond Res)","https://pubmed.ncbi.nlm.nih.gov/20847704/"];
  const VOL=["العلاقة بين الحجم الأسبوعي ونمو العضلة – تحليل شامل، Schoenfeld 2017 (J Sports Sci)","https://pubmed.ncbi.nlm.nih.gov/27433992/"];
  const FREQ=["كم مرة ندرّب العضلة في الأسبوع – تحليل شامل، Schoenfeld 2019 (J Sports Sci)","https://pubmed.ncbi.nlm.nih.gov/30558493/"];
  const ACSM=["الموقف الرسمي للكلية الأمريكية للطب الرياضي: نماذج التدرّج في التمرين – ACSM 2009","https://pubmed.ncbi.nlm.nih.gov/19204579/"];
  const SINGLEMULTI=["التمارين متعددة المفاصل مقابل مفردة المفصل: التأثيرات والتكيفات – مراجعة 2016","https://pubmed.ncbi.nlm.nih.gov/27677913/"];
  const LOWHIGH=["أحمال تقيلة مقابل خفيفة: القوة والتضخيم – تحليل شامل، Schoenfeld 2017","https://pubmed.ncbi.nlm.nih.gov/28834797/"];
  const SQUATKNEE=["الحمل على الركبة والعمود الفقري مع عمق السكوات – Hartmann 2013 (Sports Med)","https://pubmed.ncbi.nlm.nih.gov/23821469/"];
  const HIPT=["نشاط الجلوتس بالـEMG: الهيب ثراست مقابل السكوات – Contreras 2015 (J Appl Biomech)","https://journals.humankinetics.com/view/journals/jab/31/6/article-p452.xml"];
  const LONGLEN=["هل طول العضلة أثناء التمرين بيفرّق في التضخيم؟ – مراجعة وتحليل شامل 2025","https://pubmed.ncbi.nlm.nih.gov/40570881/"];
  const UNI=["تمرين طرف واحد مقابل الطرفين: القوة ونمو العضلة – تحليل شامل 2024","https://pubmed.ncbi.nlm.nih.gov/39794667/"];
  const HIIT=["التمارين المتقطعة عالية الشدة واللياقة القلبية – مراجعة شاملة للمراجعات 2024","https://pubmed.ncbi.nlm.nih.gov/38760916/"];

  /* Exact receipts for signature lifts (flavour + role in the program). */
  const exact={
    "BACK SQUAT":{w:"ملك تمارين الجزء السفلي: كواد وأرداف وثبات جذع في حركة واحدة، ومنه الكوتش بيقيس قوتك الحقيقية. والنزول لعمق مناسب بتكنيك سليم آمن على الركبة والظهر – ده اللي المراجعة بتأكده.",src:[SQUATKNEE,MECH]},
    "FRONT SQUAT":{w:"سكوات بالبار قدام: بيحمّل الكواد أكتر وبيخلّي الجذع شغال جامد عشان يفضل صاحي. اختياره هنا عشان يبني نفس القوة بضغط أقل على الظهر السفلي.",src:[SQUATKNEE,MECH]},
    "GOBLET SQUAT":{w:"أنضف مدخل لتعليم نمط السكوات: الوزن قدام صدرك بيصحّح وضعك لوحده. مناسب ليك في المرحلة دي عشان تبني أساس قوي قبل الأوزان الكبيرة.",src:[SQUATKNEE,ACSM]},
    "CONVENTIONAL DEADLIFT":{w:"أكبر تمرين للسلسلة الخلفية كلها: أرداف وهامسترنج وظهر وقبضة. موجود عشان يبني قوة شاملة تتحسسها في كل حاجة تانية.",src:[MECH,SINGLEMULTI]},
    "ROMANIAN DEADLIFT":{w:"الهامسترنج والأرداف تحت تمدد عميق – والتدريب على أطوال عضلية طويلة زي ده بيحفّز التضخيم أكتر، زي ما المراجعة الحديثة بتوضح.",src:[LONGLEN,MECH]},
    "STIFF-LEG DEADLIFT":{w:"نفس منطق الرومانيان: هامسترنج ممدودة وتحميل مباشر، مع تركيز أكبر على الخلفية. التمدد الطويل هو مفتاح التضخيم هنا.",src:[LONGLEN,MECH]},
    "HIP THRUST":{w:"أعلى تنشيط للجلوتس بالقياس الكهربي للعضلة – حتى أعلى من السكوات نفسها في الدراسة. لو الأرداف هدف عندك، ده التمرين الأساسي.",src:[HIPT]},
    "FLAT BB BENCH PRESS":{w:"أساس الدفع الأفقي: صدر وكتف أمامي وترايسبس بأثقل وزن ممكن. التمارين المركّبة زي ده هي اللي بتقود أكبر تكيفات في القوة والكتلة.",src:[SINGLEMULTI,MECH]},
    "INCLINE BB BENCH PRESS":{w:"نفس قوة البنش بس بزاوية بتركّز على الجزء العلوي من الصدر والكتف الأمامي – عشان شكل صدر متكامل من فوق لتحت.",src:[SINGLEMULTI,MECH]},
    "STANDING OVERHEAD PRESS":{w:"دفع رأسي واقف: أكتاف وترايسبس وثبات جسم كامل. تمرين مركّب بيبني قوة كتف حقيقية بتنعكس على كل تمارين الدفع.",src:[SINGLEMULTI,MECH]},
    "PULL-UP (OR ASSISTED)":{w:"مقياس قوة الضهر الحقيقي: بوزن جسمك كله. موجود عشان يبني عرض الضهر والباي، والمركّبات زيه بتقود التكيفات الكبيرة.",src:[SINGLEMULTI,MECH]},
    "WEIGHTED PULL-UP":{w:"لما البول-أب بالجسم يبقى سهل، التدرّج بيكون بزيادة الوزن – ده مبدأ الزيادة التدريجية اللي كل التطور مبني عليه.",src:[ACSM,SINGLEMULTI]},
    "CHIN-UP (OR ASSISTED)":{w:"مسكة معكوسة بتركّز أكتر على الباي مع الضهر. اختيار ذكي عشان يجمع شغل عضلتين في تمرين مركّب واحد.",src:[SINGLEMULTI,MECH]},
    "BENT-OVER BB ROW":{w:"سحب أفقي بالبار: سماكة الضهر وقوة الوضعية. بيكمّل البول-أب (اللي بيبني العرض) عشان ضهر متكامل.",src:[SINGLEMULTI,MECH]},
    "PUSH PRESS":{w:"دفع رأسي بمساعدة دفعة من الرجلين: بيسمح بحمل أكبر من الضغط العادي وبيحوّل قوة الجسم كله للكتف.",src:[SINGLEMULTI,ACSM]},
    "TRAP BAR DEADLIFT":{w:"ديدليفت بالتراب بار: نفس قوة السحب بضغط أقل على الظهر السفلي ووضعية أسهل في التعلم – اختيار آمن وفعال.",src:[MECH,SINGLEMULTI]},
    "NORDIC CURL (ASSISTED)":{w:"أقوى تمرين إكسنتريك للهامسترنج: بيقوّي العضلة وهي بتطوّل، وده النوع اللي المراجعات بتربطه بحماية وتضخيم أفضل.",src:[LONGLEN]},
    "BULGARIAN SPLIT SQUAT":{w:"رجل واحدة في كل مرة: بيبني الكواد والأرداف وبيصلّح فرق القوة بين الناحيتين. التحليل الشامل بيأكد إن تمرين الطرف الواحد بيوصّل لنفس النمو.",src:[UNI]}
  };

  /* Movement-pattern receipts, checked in order (most specific first). */
  const patterns=[
    {re:/NORDIC/i,w:"إكسنتريك قوي للهامسترنج والعضلة بتطوّل تحت الحمل – النمط اللي بيحمّي العضلة ويبنيها.",src:[LONGLEN]},
    {re:/LEG CURL/i,w:"عزل مباشر للهامسترنج بالثني – مكمّل للديدليفت، والتدريب على أطوال طويلة بيدي نمو أفضل.",src:[LONGLEN,MECH]},
    {re:/ROMANIAN|STIFF-LEG|SUMO DEADLIFT|DEADLIFT/i,w:"نمط الهينج (ثني الحوض): السلسلة الخلفية كلها – أرداف وهامسترنج وظهر. تمرين مركّب بيبني قوة بتتنقل لكل حاجة.",src:[MECH,SINGLEMULTI]},
    {re:/SWING|PULL-THROUGH/i,w:"هينج بسرعة وانفجارية: بيعلّم الحوض يشتغل صح وبيحمّل الأرداف والهامسترنج من غير إجهاد مفاصل زيادة.",src:[MECH]},
    {re:/HIP THRUST|GLUTE BRIDGE/i,w:"تحميل مباشر على الأرداف في أقصى قبضة – أعلى تنشيط جلوتس بالقياس، حتى مقارنة بالسكوات.",src:[HIPT]},
    {re:/KICKBACK|HIP ABDUCTION/i,w:"عزل للجلوتس (الكبيرة والوسطى) في حركة بعيدة عن الركبة – بيكمّل شغل المركّبات على الأرداف.",src:[MECH]},
    {re:/BULGARIAN|SPLIT SQUAT|LUNGE|STEP-UP|SKATER/i,w:"شغل رجل برجل: توازن وثبات وتصحيح فرق القوة بين الناحيتين – والتحليلات بتأكد إن النمو زي الشغل بالطرفين.",src:[UNI]},
    {re:/PISTOL|SQUAT|LEG PRESS|HACK/i,w:"نمط السكوات: كواد وأرداف وجذع ثابت. النزول لعمق مناسب بتكنيك سليم آمن على الركبة زي ما المراجعة بتأكد.",src:[SQUATKNEE,MECH]},
    {re:/LEG EXTENSION/i,w:"عزل كامل للكواد من غير ما حاجة تانية تساعد – بيضيف حجم تدريبي مركّز للعضلة بعد المركّبات.",src:[VOL,MECH]},
    {re:/CALF/i,w:"البطة (السمانة) بتحتاج تكرارات أكتر وأحمال أخف لأنها عضلة صابرة – والأحمال الخفيفة للقرب من الفشل بتضخّم زي التقيلة.",src:[LOWHIGH]},
    {re:/LATERAL RAISE/i,w:"عزل الكتف الجانبية: العضلة اللي بتدي عرض الأكتاف. أحمال خفيفة وتكرارات أعلى بتضخّم نفس التقيلة لما توصل قريب من الفشل.",src:[LOWHIGH,MECH]},
    {re:/REAR DELT|FACE PULL/i,w:"الكتف الخلفية وصحة الوضعية: بيوازن كل شغل الدفع في برنامجك وبيحمي مفصل الكتف.",src:[MECH]},
    {re:/SHRUG/i,w:"شغل مباشر للترابيز (الرقبة والأكتاف من فوق) – بيكمّل شكل الضهر العلوي.",src:[MECH]},
    {re:/PREACHER|INCLINE DB CURL/i,w:"باي والذراع ممدودة أو ثابتة: التمدد الطويل بيحفّز نمو أكتر، والعزل بيمنع الغش.",src:[LONGLEN,LOWHIGH]},
    {re:/CURL/i,w:"عزل الباي: الأحمال الخفيفة للقرب من الفشل بتدي نفس التضخيم – فالتركيز هنا على الإحساس والتكنيك.",src:[LOWHIGH]},
    {re:/SKULL|TRICEP|PUSHDOWN/i,w:"عزل الترايسبس – العضلة اللي بتاخد تلتين حجم الذراع. شغل خفيف-متوسط لقرب الفشل كفاية للتضخيم.",src:[LOWHIGH,MECH]},
    {re:/PULLOVER/i,w:"صدر وضهر تحت تمدد عميق فوق البنش: التحميل على الطول الطويل بيحفّز النمو، وبيوسّع القفص الصدري إحساسياً.",src:[LONGLEN,MECH]},
    {re:/STRAIGHT-ARM PULLDOWN/i,w:"عزل الضهر العريضة (اللاتس) بذراع مفرودة – بيحسّسك العضلة قبل السحوبات التقيلة.",src:[MECH]},
    {re:/PULL-UP|CHIN-UP|PULLDOWN/i,w:"سحب رأسي: عرض الضهر والباي. تمرين مركّب، والمركّبات بتقود أكبر تكيفات قوة وكتلة.",src:[SINGLEMULTI,MECH]},
    {re:/ROW/i,w:"سحب أفقي: سماكة الضهر وقوة الوضعية وصحة الكتف – مكمّل أساسي لكل شغل الدفع.",src:[SINGLEMULTI,MECH]},
    {re:/PEC DECK|CABLE FLY| FLY/i,w:"عزل الصدر بمسار ثابت: توتر مستمر على العضلة من غير ما الكتف والتراي يسرقوا الحركة.",src:[MECH,VOL]},
    {re:/BENCH|CHEST PRESS|PUSH-UP|DIP|MED BALL CHEST|FLOOR PRESS|DB PRESS/i,w:"دفع أفقي: صدر وكتف أمامي وتراي. التمارين المركّبة زي ده هي عمود القوة في أي برنامج.",src:[SINGLEMULTI,MECH]},
    {re:/SHOULDER PRESS|OVERHEAD|ARNOLD|LANDMINE|PIKE/i,w:"دفع رأسي: أكتاف قوية وثبات جذع. مركّب بيبني قوة بتتنقل لباقي الدفع.",src:[SINGLEMULTI,MECH]},
    {re:/PALLOF/i,w:"مقاومة لفّ الجذع: بيعلّم جسمك يثبت تحت الضغط – أساس نقل القوة في كل التمارين التقيلة.",src:[ACSM]},
    {re:/PLANK|DEAD BUG|BIRD DOG|HOLLOW|CRUNCH|KNEE RAISE|LEG RAISE|MCGILL|SUPERMAN|SIDE PLANK|CLIMBER/i,w:"ثبات الجذع والبطن: جذع قوي بيحمي ظهرك وبيخلي القوة توصل كاملة في السكوات والديدليفت.",src:[ACSM,MECH]},
    {re:/FARMER/i,w:"مشي بالحديد: قبضة وجذع ووضعية تحت حمل حقيقي – قوة عملية بتتحسسها في كل سحبة.",src:[ACSM]},
    {re:/INTERVAL|SPRINT|BIKE|BURPEE|BOX JUMP|JUMP/i,w:"شغل متقطع عالي الشدة: أسرع طريق لرفع اللياقة القلبية وحرق أعلى في وقت أقل.",src:[HIIT]},
    {re:/TREADMILL|WALK/i,w:"كارديو منتظم: لياقة قلبية أعلى وحرق إضافي من غير ما ياخد من استشفاء تمارين الحديد.",src:[HIIT]}
  ];

  /* Honest generic fallback for custom coach exercises not in the library. */
  const generic={w:"الكوتش حط التمرين ده جوه خطة متكاملة معمولة على جسمك وهدفك. المبدأ العلمي ورا أي اختيار في البرنامج: حجم تدريبي أسبوعي كافي وتكرار مناسب لكل عضلة – وده اللي المراجعات بتأكده.",src:[VOL,FREQ],gen:true};

  function find(name){
    if(!name) return null;
    const k=String(name).trim().toUpperCase();
    if(exact[k]) return {w:exact[k].w,src:exact[k].src,exact:true};
    const bare=k.replace(/\s*[–-]\s*BBB$/,"");
    if(exact[bare]) return {w:exact[bare].w,src:exact[bare].src,exact:true};
    for(const p of patterns){ if(p.re.test(k)) return {w:p.w,src:p.src,exact:false}; }
    return {w:generic.w,src:generic.src,exact:false,gen:true};
  }
  return {find};
})();
