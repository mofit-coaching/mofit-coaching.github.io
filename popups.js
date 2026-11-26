/* ======================================================================
   MOFIT رسائل منبثقة بالمصري: toast() بقت أحلى. الرسائل الجاهزة (اتحفظ،
   اتحذف، اتبعت، تعذر...) بتتبدّل بجمل مرحة بتتغير كل مرة، وكل رسالة ليها
   أيقونة بتنط ولمعة. الرسائل اللي فيها تفاصيل (أرقام، أسماء، أخطاء) بتفضل
   بنصها الأصلي بالظبط، وفي حالة الفشل النص الأصلي بيظهر تحت الجملة المرحة.
   - مفيش تغيير في أي مكان بيستدعي toast(): نفس الدالة ونفس الاسم.
   ====================================================================== */
(function(){
const CSS=`.toast.pm{display:flex;align-items:center;gap:10px;max-width:min(92vw,420px);padding:10px 20px 10px 14px;text-align:right;line-height:1.5;overflow:hidden;animation:pmin .5s cubic-bezier(.2,1.5,.4,1) both,pmout .35s ease-in 2.35s both}
.toast.pm .pm-i{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:1.05rem;background:rgba(255,255,255,.12);animation:pmpop .7s cubic-bezier(.2,1.6,.4,1) .1s both}
.toast.pm .pm-t{display:flex;flex-direction:column;min-width:0}.toast.pm .pm-t b{font-size:.88rem;font-weight:700}
.toast.pm .pm-t small{font-size:.72rem;opacity:.7;font-weight:500;word-break:break-word}
.toast.pm.ok{box-shadow:0 10px 30px rgba(15,23,42,.35),0 0 0 1px rgba(34,197,94,.45),0 0 22px rgba(34,197,94,.25)}.toast.pm.ok .pm-i{background:rgba(34,197,94,.25)}
.toast.pm.bad{box-shadow:0 10px 30px rgba(15,23,42,.35),0 0 0 1px rgba(239,68,68,.5),0 0 22px rgba(239,68,68,.22)}.toast.pm.bad .pm-i{background:rgba(239,68,68,.25);animation:pmpop .7s cubic-bezier(.2,1.6,.4,1) .1s both,pmshake .5s ease .35s}
.toast.pm.info .pm-i{background:rgba(249,115,22,.25)}
.toast.pm::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);transform:translateX(-130%);animation:pmshine 1.1s ease .25s 1 both;pointer-events:none}
@keyframes pmin{from{opacity:0;transform:translate(-50%,-26px) scale(.82)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes pmout{to{opacity:0;transform:translate(-50%,-14px) scale(.94)}}
@keyframes pmpop{from{transform:scale(0) rotate(-40deg)}to{transform:scale(1) rotate(0)}}
@keyframes pmshake{25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-3px)}}
@keyframes pmshine{to{transform:translateX(130%)}}
@media (prefers-reduced-motion:reduce){.toast.pm,.toast.pm *,.toast.pm::after{animation:none!important}}`;
const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

/* [regex on the plain message, kind, icon, variants]. Order matters. */
const R=[
 [/^(✓|✅)?\s*(اتحفظ|اتحفظت)[^:–—\-0-9]{0,18}$/,"ok","💾",["اتحفظ يا وحش، كله تمام","اتسجّل واتأمّن، كمّل","اتحفظ، مفيش حاجة هتضيع","خلصنا، اتحفظ بنجاح"]],
 [/^تعذر الحفظ|^مقدرتش أحفظ/,"bad","🛠",["الحفظ مشي معانا تقيل","حاجة وقفت في الحفظ، ثواني وجرّب","مانفعش يتحفظ المرة دي"]],
 [/^(✓|✅)?\s*(اتحذف|اتشال|اتمسح|اتشالت|اتحذفت)[^:–—\-0-9]{0,14}$/,"ok","🗑",["اتشال من الدنيا","اتمسح، نضافة","راح في ستين داهية، تمام"]],
 [/^تعذر (الحذف|الإزالة|مسح|الفصل)/,"bad","🛠",["الحذف عاند معانا","مانفعش يتشال، جرّب تاني"]],
 [/^(✓|✅)?\s*(اتبعت|اتبعتت)[^:–—\-0-9]{0,22}$/,"ok","🚀",["طارت وصلت","اتبعتت، دلوقتي عنده","وصلت يا كبير"]],
 [/^تعذر الإرسال/,"bad","📡",["الرسالة اتعطلت في السكة","مبعتتش، جرّب تاني"]],
 [/^(✓|✅)?\s*(اتضاف|اتضافت|اتسجل|اتسجلت|اتسجّل)[^:–—\-0-9]{0,18}$/,"ok","✨",["اتضاف، حلو كده","نزل مكانه","اتسجّل في الدفتر"]],
 [/^(✓|✅)?\s*(اتنسخ|اتنسخت)\s*$/,"ok","📋",["اتنسخ، الصقه براحتك","في الحافظة يا باشا"]],
 [/^مفيش نت/,"bad","📡",["النت قطع، اتأكد من الواي فاي وجرّب تاني","مفيش إشارة، ارجع جرّب كمان شوية"]],
 [/^(تم|✓ تمام|✓ تم)\s*✓?$/,"ok","👌",["تمام التمام","خلصت يا معلم","تم بنجاح"]],
 [/^اكتب /,"info","✍️",["لسه ناقصنا حاجة، اكتبها","كمّل البيانات الأول يا بطل"]],
 [/^تعذر /,"bad","🛠",["الموضوع مشي معانا ناقص","حاجة مش مظبوطة، جرّب تاني"]]
];
const pick=a=>a[Math.floor(Math.random()*a.length)];
function classify(msg){
  const m=String(msg).trim();
  for(const [re,k,ic,v] of R){ if(re.test(m)) return {k,ic,title:pick(v),sub:k==="bad"&&m.length>8?m:""}; }
  return null;
}
/* kind/icon for messages we keep verbatim */
function guess(m){
  const lead=m.match(/^(\p{Extended_Pictographic}\uFE0F?|✓|✅)\s*/u);
  if(lead){ const l=lead[1]; if(l==="✓"||l==="✅") return {k:"ok",ic:"✅",txt:m.slice(lead[0].length)}; return {k:"info",ic:l,txt:m.slice(lead[0].length)}; }
  if(/^(تعذر|فشل|خطأ|مش قادر|مقدرتش|الفيديو مش|الصورة دي مش)/.test(m)) return {k:"bad",ic:"⚠️",txt:m};
  return {k:"info",ic:"💡",txt:m};
}
const _toast=toast;
toast=function(msg){
  try{
    if(typeof msg!=="string"&&typeof msg!=="number") return _toast.apply(this,arguments);
    const m=String(msg), c=classify(m); let k,ic,title,sub="";
    if(c){ k=c.k; ic=c.ic; title=c.title; sub=c.sub; } else { const g=guess(m); k=g.k; ic=g.ic; title=g.txt; }
    document.querySelectorAll(".toast").forEach(t=>t.remove());
    const t=document.createElement("div"); t.className="toast pm "+k; t.setAttribute("role","status");
    const i=document.createElement("span"); i.className="pm-i"; i.textContent=ic;
    const x=document.createElement("span"); x.className="pm-t"; const b=document.createElement("b"); b.textContent=title; x.appendChild(b);
    if(sub){ const s=document.createElement("small"); s.textContent=sub; x.appendChild(s); }
    t.append(i,x); document.body.appendChild(t);
    setTimeout(()=>t.remove(),2750);
  }catch(e){ _toast.apply(this,arguments); }
};
})();
