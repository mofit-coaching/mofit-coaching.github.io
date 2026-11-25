/* Mofit public showcase (login landing). Content lives in window.SHOWCASE below.
   Empty arrays render polished placeholders. To publish real content, fill the arrays; nothing else changes.
   results[]:{before:"img url",after:"img url",name:"اسم أو أول اسم",stat:"-12 كجم في 10 أسابيع"}  (publish only with client consent)
   quotes[]:{text:"...",name:"...",meta:"... (اختياري)"}   stats[]:{n:"120",unit:"+",label:"عميل"} */
window.SHOWCASE=window.SHOWCASE||{
  stats:[],
  results:[],
  quotes:[],
  steps:[
    {t:"اشترك واختار عرضك",d:"بتختار المدة المناسبة وبتكلّم الكوتش على واتساب."},
    {t:"استلم برنامجك",d:"تمرين وتغذية متحسبين على جسمك وهدفك، جوه التطبيق."},
    {t:"سجّل وتابع تقدّمك",d:"الكوتش بيتابعك أسبوعياً ويعدّل معاك على حسب نتيجتك."}
  ]
};
(function(){
const css=`
#showcase{max-width:520px;margin:0 auto;padding:6px 16px calc(34px + env(safe-area-inset-bottom));color:#fff;direction:rtl}
#showcase *{box-sizing:border-box}
.sc-sec{margin-top:34px}
.sc-eyebrow{display:flex;align-items:center;justify-content:center;gap:8px;font:800 11px/1 var(--font-num,system-ui);letter-spacing:.22em;color:#FF9248;text-transform:uppercase}
.sc-eyebrow:before,.sc-eyebrow:after{content:"";height:1px;width:28px;background:linear-gradient(90deg,transparent,rgba(255,146,72,.7))}
.sc-eyebrow:before{transform:scaleX(-1)}
.sc-h{font:800 24px/1.25 var(--disp);text-align:center;margin:10px 0 6px;color:#fff}
.sc-h b{background:linear-gradient(90deg,#FF6B1A,#FFC46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.sc-sub{text-align:center;color:#9AA6BA;font-size:13px;margin:0 0 16px}
.sc-rv{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.sc-rv.in{opacity:1;transform:none}
.sc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px}
.sc-stat{position:relative;border-radius:18px;padding:16px 6px 13px;text-align:center;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.1);overflow:hidden}
.sc-stat:before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:linear-gradient(90deg,transparent,#FF6B1A,transparent)}
.sc-stat .n{font:800 30px/1 var(--font-num,system-ui);background:linear-gradient(180deg,#FFD08A,#FF6B1A);-webkit-background-clip:text;background-clip:text;color:transparent;direction:ltr;display:block}
.sc-stat .l{display:block;margin-top:7px;font-size:12px;color:#B6C0D2}
.sc-ph .n{opacity:.55}
.sc-ba{position:relative;border-radius:22px;overflow:hidden;aspect-ratio:4/5;direction:ltr;touch-action:pan-y;user-select:none;-webkit-user-select:none;background:#0B1220;border:1px solid rgba(255,255,255,.12);box-shadow:0 22px 44px -20px rgba(0,0,0,.7);--p:50%}
.sc-ba .lay{position:absolute;inset:0}
.sc-ba .lay img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.sc-ba .aft{clip-path:inset(0 calc(100% - var(--p)) 0 0)}
.sc-ba svg{width:100%;height:100%;display:block}
.sc-ba .tag{position:absolute;top:12px;padding:5px 11px;border-radius:99px;font:800 12px/1 var(--disp);background:rgba(11,18,32,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,.18)}
.sc-ba .tag.b{right:12px}.sc-ba .tag.a{left:12px;background:linear-gradient(135deg,#FF6B1A,#FFA24D);border-color:transparent}
.sc-ba .hd{position:absolute;top:0;bottom:0;left:var(--p);width:44px;margin-left:-22px;cursor:ew-resize;display:grid;place-items:center;touch-action:none}
.sc-ba .hd:before{content:"";position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:linear-gradient(180deg,rgba(255,255,255,.2),#fff,rgba(255,255,255,.2));box-shadow:0 0 14px rgba(255,146,72,.8)}
.sc-ba .hd i{position:relative;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#FF6B1A,#FFA24D);display:grid;place-items:center;color:#fff;box-shadow:0 6px 18px rgba(255,107,26,.55),0 0 0 4px rgba(255,255,255,.18);font:800 13px/1 system-ui;font-style:normal;letter-spacing:-2px}
.sc-ba .hd:focus-visible i{outline:3px solid #fff}
.sc-cap{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 4px 0;direction:rtl}
.sc-cap b{font-size:14px}.sc-cap span{font-size:12px;color:#FFB070;font-weight:700}
.sc-ph-flag{position:absolute;inset:auto 0 14px 0;text-align:center;pointer-events:none}
.sc-ph-flag span{display:inline-block;padding:6px 12px;border-radius:99px;background:rgba(11,18,32,.78);border:1px dashed rgba(255,255,255,.35);font-size:12px;color:#CBD5E1}
.sc-rail{display:grid;gap:14px}
.sc-q{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;margin:0 -16px;padding:4px 16px 10px;scrollbar-width:none}
.sc-q::-webkit-scrollbar{display:none}
.sc-qc{flex:0 0 82%;scroll-snap-align:center;position:relative;padding:20px 18px 16px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.1),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12)}
.sc-qc:before{content:"”";position:absolute;top:-4px;right:16px;font:800 74px/1 Georgia,serif;color:rgba(255,107,26,.5)}
.sc-st{color:#FFC46B;letter-spacing:3px;font-size:13px}
.sc-qc p{margin:8px 0 14px;font-size:14.5px;line-height:1.75;color:#E6EBF5}
.sc-who{display:flex;align-items:center;gap:10px}
.sc-av{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font:800 14px/1 var(--disp);color:#fff;background:linear-gradient(135deg,#FF6B1A,#FFA24D)}
.sc-who b{font-size:13px;display:block}.sc-who small{color:#9AA6BA;font-size:11px}
.sc-qc.sc-ph p{color:#8E9AB0;font-style:italic}
.sc-qc.sc-ph .sc-av{background:rgba(255,255,255,.12)}
.sc-dots{display:flex;justify-content:center;gap:6px;margin-top:2px}
.sc-dots i{width:6px;height:6px;border-radius:9px;background:rgba(255,255,255,.22);transition:.3s}
.sc-dots i.on{width:20px;background:#FF6B1A}
.sc-steps{position:relative;display:grid;gap:12px;padding-right:2px}
.sc-steps:before{content:"";position:absolute;top:24px;bottom:24px;right:22px;width:2px;background:linear-gradient(180deg,#FF6B1A,rgba(255,107,26,.1))}
.sc-step{position:relative;display:flex;gap:14px;align-items:flex-start;padding:14px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)}
.sc-step .no{flex:0 0 auto;width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font:800 17px/1 var(--font-num,system-ui);color:#fff;background:linear-gradient(135deg,#FF6B1A,#FFA24D);box-shadow:0 6px 16px rgba(255,107,26,.4);position:relative;z-index:1}
.sc-step b{display:block;font-size:15px;margin-bottom:3px}.sc-step span{font-size:12.5px;color:#A9B4C8;line-height:1.6}
.sc-cta{margin-top:30px;text-align:center}
.sc-btn{position:relative;display:block;padding:17px 20px;border-radius:18px;font:800 17px/1.2 var(--disp);color:#fff;text-decoration:none;background:linear-gradient(135deg,#FF5A0A,#FFA24D);box-shadow:0 14px 30px -10px rgba(255,107,26,.8),inset 0 1px 0 rgba(255,255,255,.4);overflow:hidden;cursor:pointer}
.sc-btn:after{content:"";position:absolute;top:0;bottom:0;width:60px;left:-80px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:scsh 3.6s ease-in-out infinite}
@keyframes scsh{0%,55%{left:-80px}100%{left:120%}}
.sc-note{font-size:11.5px;color:#8591A8;margin:12px 0 0}
.sc-podium{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin-top:10px;direction:ltr}
.sc-pod{width:96px;text-align:center}
.sc-pod .tr{font-size:34px;line-height:1;filter:drop-shadow(0 4px 10px rgba(0,0,0,.45))}
.sc-pod .bk{margin-top:8px;border-radius:12px 12px 0 0;display:grid;place-items:center;color:#fff;font:800 13px/1 var(--disp);border:1px solid rgba(255,255,255,.16);border-bottom:0}
.sc-pod.p1 .bk{height:104px;background:linear-gradient(180deg,#FFC46B,#FF8A3D)}
.sc-pod.p2 .bk{height:80px;background:linear-gradient(180deg,#CBD5E1,#7C8AA5)}
.sc-pod.p3 .bk{height:64px;background:linear-gradient(180deg,#E2A06B,#9A5B2E)}
.sc-chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.sc-chip2{padding:7px 12px;border-radius:99px;font-size:12px;font-weight:700;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#E2E8F0}
.sc-rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.sc-rstep{border-radius:16px;padding:14px 8px 12px;text-align:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)}
.sc-rstep .ic2{font-size:24px;line-height:1}
.sc-rstep b{display:block;font-size:12.5px;margin-top:7px}
.sc-rstep span{display:block;font-size:11px;color:#A9B4C8;margin-top:3px;line-height:1.55}
.sc-tg{margin-top:44px;padding:8px 4px;text-align:center}
.sc-tg p{max-width:680px;margin:0 auto;font:800 28px/1.45 var(--disp);text-wrap:balance}
.sc-tg .w{color:rgba(255,255,255,.3);transition:color .6s cubic-bezier(.22,1,.36,1)}
.sc-tg .w.on{color:#fff}.sc-tg .w.on.hl{color:#FFB070}
.sc-faq{display:grid;gap:8px}
.sc-faq details{border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:0 14px;transition:background .3s cubic-bezier(.22,1,.36,1)}
.sc-faq details[open]{background:rgba(255,255,255,.08)}
.sc-faq summary{list-style:none;cursor:pointer;padding:14px 0;font:700 14px/1.5 var(--disp);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px}
.sc-faq summary::-webkit-details-marker{display:none}
.sc-faq summary:after{content:"+";flex:none;width:24px;height:24px;border-radius:50%;background:rgba(255,107,26,.18);color:#FF9248;text-align:center;font:800 16px/24px system-ui;transition:transform .5s cubic-bezier(.22,1,.36,1)}
.sc-faq details[open] summary:after{transform:rotate(45deg)}
.sc-faq summary:focus-visible,.sc-btn:focus-visible{outline:3px solid #FFB070;outline-offset:3px;border-radius:12px}
.sc-faq p{margin:0 0 14px;color:#B6C0D2;font-size:13.5px;line-height:1.8;text-wrap:pretty}
.sc-btn:active{transform:scale(.98)}
@media(prefers-reduced-motion:reduce){.sc-tg .w{transition:none;color:#fff}.sc-faq summary:after,.sc-faq details{transition:none}}
@media(prefers-reduced-motion:reduce){.sc-rv{opacity:1;transform:none;transition:none}.sc-btn:after{animation:none;display:none}}
`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fig=(k)=>`<svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="scg${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k=="a"?"#3A2012":"#1B2438"}"/><stop offset="1" stop-color="#0B1220"/></linearGradient><linearGradient id="scf${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k=="a"?"#FFA24D":"#5B6A85"}"/><stop offset="1" stop-color="${k=="a"?"#FF6B1A":"#2C374C"}"/></linearGradient></defs><rect width="200" height="250" fill="url(#scg${k})"/>${k=="a"?'<circle cx="100" cy="120" r="90" fill="rgba(255,107,26,.16)"/>':''}<circle cx="100" cy="78" r="${k=="a"?25:27}" fill="url(#scf${k})"/><path d="${k=="a"?"M30 250 C34 170 62 140 100 140 C138 140 166 170 170 250Z":"M36 250 C36 176 64 146 100 146 C136 146 164 176 164 250Z"}" fill="url(#scf${k})"/></svg>`;
function stats(){const a=SHOWCASE.stats||[],ph=!a.length;const list=ph?[{n:"—",label:"عميل اتدرّب"},{n:"—",label:"كيلو اتغيّروا"},{n:"—",label:"أسبوع للتحوّل"}]:a.slice(0,3);
return `<div class="sc-stats sc-rv">${list.map(s=>`<div class="sc-stat${ph?" sc-ph":""}"><span class="n">${esc(s.n)}${esc(s.unit||"")}</span><span class="l">${esc(s.label)}</span></div>`).join("")}</div>`}
function results(){const a=SHOWCASE.results||[],ph=!a.length;const list=ph?[{}]:a;
return `<div class="sc-rail">${list.map(r=>`<div class="sc-rv"><div class="sc-ba" tabindex="-1">
<div class="lay bef">${ph?fig("b"):`<img src="${esc(r.before)}" alt="قبل" loading="lazy">`}</div>
<div class="lay aft">${ph?fig("a"):`<img src="${esc(r.after)}" alt="بعد" loading="lazy">`}</div>
<span class="tag b">قبل</span><span class="tag a">بعد</span>
<div class="hd" role="slider" tabindex="0" aria-label="قارن قبل وبعد" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><i>‹›</i></div>
${ph?'<div class="sc-ph-flag"><span>صورة قبل / بعد، بتتنشر بموافقة العميل</span></div>':''}</div>
${ph?"":`<div class="sc-cap"><b>${esc(r.name)}</b><span>${esc(r.stat)}</span></div>`}</div>`).join("")}</div>`}
function quotes(){const a=SHOWCASE.quotes||[],ph=!a.length;const list=ph?[{},{},{}]:a;
return `<div class="sc-rv"><div class="sc-q" id="scq">${list.map(q=>`<div class="sc-qc${ph?" sc-ph":""}"><div class="sc-st">★★★★★</div><p>${ph?"رأي العميل عن تجربته مع البرنامج والمتابعة هيتنشر هنا بموافقته.":esc(q.text)}</p><div class="sc-who"><div class="sc-av">${ph?"؟":esc((q.name||"?").trim()[0])}</div><div><b>${ph?"عميل Mofit":esc(q.name)}</b>${q.meta?`<small>${esc(q.meta)}</small>`:""}</div></div></div>`).join("")}</div><div class="sc-dots" id="scd">${list.map((_,i)=>`<i${i?"":' class="on"'}></i>`).join("")}</div></div>`}
function steps(){return `<div class="sc-steps">${(SHOWCASE.steps||[]).map((s,i)=>`<div class="sc-step sc-rv"><div class="no">${i+1}</div><div><b>${esc(s.t)}</b><span>${esc(s.d)}</span></div></div>`).join("")}</div>`}
function league(){return `<div class="sc-podium sc-rv"><div class="sc-pod p2"><div class="tr">🥈</div><div class="bk">التاني</div></div><div class="sc-pod p1"><div class="tr">🥇</div><div class="bk">الأول</div></div><div class="sc-pod p3"><div class="tr">🥉</div><div class="bk">التالت</div></div></div><div class="sc-chips sc-rv"><span class="sc-chip2">🏆 مكافآت لأول 3</span><span class="sc-chip2">📊 ترتيب بيتحدث أول بأول</span><span class="sc-chip2">🎯 المشاركة اختيارية</span></div>`}
function invite(){return `<div class="sc-rgrid sc-rv"><div class="sc-rstep"><div class="ic2">🔗</div><b>شارك لينكك</b><span>لينك وQR خاصين بيك من تبويب الإحالة</span></div><div class="sc-rstep"><div class="ic2">✍️</div><b>صاحبك يسجّل</b><span>يفتح اللينك ويعمل حسابه في دقيقة</span></div><div class="sc-rstep"><div class="ic2">🎁</div><b>الأسبوع علينا</b><span>أول ما الكوتش يفعّله، ليك أسبوع مجاني</span></div></div>`}
function tagline(){const t="تمرينك وأكلك ومتابعتك كلهم في مكان واحد. ومعاك كوتش حقيقي بيتابعك كل أسبوع ويعدّل معاك على حسب نتيجتك.";const hl=new Set(["كوتش","حقيقي","مكان","واحد."]);
return `<div class="sc-tg" aria-label="${esc(t)}"><p aria-hidden="true">${t.split(" ").map(w=>`<span class="w${hl.has(w)?" hl":""}">${esc(w)}</span>`).join(" ")}</p></div>`}
/* FAQ content. Entries with a:null are NOT shown until the coach supplies the real answer (policy items).
   TODO coach: payment methods, cancellation/refund policy, women clients, program delivery time, when the subscription period starts. */
const FAQ=[
["البرنامج ده جاهز ولا معمول ليا أنا؟","معمول ليك انت مخصوص. تمرينك وأكلك بيتحسبوا على جسمك وهدفك وأيام تمرينك، مش نسخة واحدة بتتوزع على الكل. كل عميل عندنا ليه نظامه."],
["مين اللي هيتابعني، كوتش حقيقي ولا تطبيق؟","كوتش حقيقي. بيتابعك بنفسه كل أسبوع، يشوف نتيجتك ويعدّل معاك. التطبيق بيسهّل عليك التسجيل والمتابعة، بس القرار دايماً لإنسان."],
["هبدأ إزاي، ومحتاج أعمل إيه؟","اختار العرض اللي يناسبك من تبويب الأسعار والعروض، هيفتحلك واتساب برسالة جاهزة للكوتش. هو اللي بيفعّل حسابك ويكمل معاك الباقي، وانت مش لوحدك في أي خطوة."],
["لو عندي سؤال في نص الطريق؟","كلّم الكوتش مباشرة من جوه التطبيق. وكمان المساعد الذكي بيرد عليك فوراً على أسئلة برنامجك."],
["المساعد الذكي بديل عن الكوتش؟","لأ، ده مساعد مش بديل. بيرد على أسئلة برنامجك بسرعة، وأي سؤال طبي أو عن إصابة بيتحوّل للكوتش عشان يقرره بنفسه."],
["هتنشروا صوري من غير ما أعرف؟","أبداً. مفيش أي صورة ليك بتتنشر على الموقع غير بموافقتك انت. اللي مش عايز يظهر مش هيظهر، والقرار قرارك."],
["هحس إني مجرد رقم في سيستم؟","العكس. نظامك معمول عليك انت، والكوتش بيراجع تقدمك بنفسه كل أسبوع. تقدر تحس إنك في بيتك من أول يوم."],
["خطواتي بتتسجل لوحدها؟","أيوه. على الآيفون بتضيف اختصار بضغطة وتظبط التشغيل الليلي مرة واحدة بإرشاد خطوة بخطوة، وعلى الأندرويد بتربط حساب جوجل. ولو حبيت تكتبها بإيدك ده شغال برضه."],
["الدوري إجباري؟","لأ خالص. الكوتش بيبدأ الدوري وانت اللي بتقرر تشارك ولا لأ، من غير أي ضغط."],
["إزاي آخد أسبوع مجاني؟","شارك لينكك الخاص مع صحابك. كل صاحب يشترك من اللينك وأول ما الكوتش يفعّله، بيتضاف ليك أسبوع مجاني."],
["بدفع إزاي؟","الدفع عن طريق إنستاباي، بسيط وسريع. وتقدر تتواصل معانا على واتساب في أي خطوة لو محتاج مساعدة."],
["لو غيرت رأيي؟","ولا يهمك. تقدر تسترد فلوسك كاملة في أي وقت قبل ما البرنامج يتعمل. بنبدأ شغل برنامجك بعد ما تكون متأكد ومرتاح."],
["الكوتش بيدرّب بنات؟","أيوه طبعاً، وللبنات نظام مختلف مخصوص ليهم، مش نفس نظام الشباب. هتلاقي نفسك مرتاحة ومفهومة من أول يوم."],
["هستلم برنامجي إمتى؟","برنامجك بيتعمل مخصوص ليك، فبيوصلك من يومين لـ٣ أيام. الوقت ده بنقضيه عشان يطلع مظبوط عليك."],
["اشتراكي بيبدأ إمتى؟","من يوم ما تستلم برنامجك، مش من يوم الدفع. يعني مفيش يوم من اشتراكك بيضيع وانت مستني."]];
function faq(){const q=FAQ.filter(x=>x[1]);
return `<div class="sc-faq sc-rv">${q.map(([a,b])=>`<details><summary>${esc(a)}</summary><p>${esc(b)}</p></details>`).join("")}</div>`}
const sec=(eb,h,sub,body)=>`<div class="sc-sec"><div class="sc-eyebrow sc-rv">${eb}</div><h2 class="sc-h sc-rv">${h}</h2>${sub?`<p class="sc-sub sc-rv">${sub}</p>`:""}${body}</div>`;
function bindBA(el){const hd=el.querySelector(".hd");let drag=false;
const set=p=>{p=Math.max(4,Math.min(96,p));el.style.setProperty("--p",p+"%");hd.setAttribute("aria-valuenow",Math.round(p))};
const at=e=>{const r=el.getBoundingClientRect();set((e.clientX-r.left)/r.width*100)};
el.addEventListener("pointerdown",e=>{drag=true;try{el.setPointerCapture(e.pointerId)}catch(_){}at(e);e.preventDefault()});
el.addEventListener("pointermove",e=>{if(drag)at(e)});
["pointerup","pointercancel"].forEach(t=>el.addEventListener(t,()=>{drag=false}));
hd.addEventListener("keydown",e=>{const v=+hd.getAttribute("aria-valuenow");if(e.key==="ArrowLeft"){set(v-5);e.preventDefault()}if(e.key==="ArrowRight"){set(v+5);e.preventDefault()}});
el._hint=()=>{if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;const t0=performance.now();const f=t=>{const k=(t-t0)/1500;if(k>=1||drag){if(!drag)set(50);return}set(50+Math.sin(k*Math.PI*2)*22*(1-k));requestAnimationFrame(f)};requestAnimationFrame(f)}}
window.drawShowcase=function(){const box=document.getElementById("showcase");if(!box||box.dataset.done)return;box.dataset.done=1;
const hasR=(SHOWCASE.results||[]).length, hasQ=(SHOWCASE.quotes||[]).length;
box.innerHTML=tagline()+(hasR?sec("RESULTS",'نتايج <b>حقيقية</b> من متدربينا',"اسحب وقارن قبل وبعد",results()):"")+(SHOWCASE.stats&&SHOWCASE.stats.length?stats().replace('<div class="sc-stats','<div style="margin-top:22px"></div><div class="sc-stats'):"")+(hasQ?sec("VOICES","بيقولوا إيه عننا","",quotes()):"")+sec("HOW IT WORKS","إزاي <b>تبدأ</b>","تلات خطوات وبس",steps())+sec("LEAGUE",'دوري <b>الأسبوع</b>',"الكوتش بيبدأ الدوري وانت بتختار تشارك، نقاطك من تمرينك والتزامك، وأول 3 ليهم المجد",league())+sec("INVITE FRIENDS",'ادعُ صحابك <b>وخد أسبوع هدية</b>',"كل صاحب يشترك من لينكك بيضيفلك أسبوع مجاني",invite())+sec("FAQ","أسئلة <b>ممكن تكون في بالك</b>","هنا عشان تحس إنك في بيتك من أول يوم",faq())+`<div class="sc-cta sc-rv"><a class="sc-btn" href="#plans" onclick="loginTab('plans');window.scrollTo({top:0,behavior:'smooth'});return false">ابدأ رحلتك، اشترك دلوقتي</a><p class="sc-note">* النتيجة بتختلف من شخص لآخر.</p></div>`;
box.querySelectorAll(".sc-ba").forEach(bindBA);
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");const b=e.target.querySelector(".sc-ba");if(b&&b._hint&&!b._h){b._h=1;setTimeout(b._hint,350)}io.unobserve(e.target)}}),{threshold:.15}):null;
box.querySelectorAll(".sc-rv").forEach(n=>io?io.observe(n):n.classList.add("in"));
const ws=[...box.querySelectorAll(".sc-tg .w")];if(ws.length){if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion:reduce)").matches)ws.forEach(w=>w.classList.add("on"));else{const wo=new IntersectionObserver(es=>{let k=0;es.filter(e=>e.isIntersecting).sort((a,b)=>ws.indexOf(a.target)-ws.indexOf(b.target)).forEach(e=>{setTimeout(()=>e.target.classList.add("on"),Math.min(k++*70,500));wo.unobserve(e.target)})},{rootMargin:"0px 0px -38% 0px"});ws.forEach(w=>wo.observe(w));}}

const q=document.getElementById("scq"),d=document.querySelectorAll("#scd i");if(q)q.addEventListener("scroll",()=>{const c=q.children;let best=0,bd=1e9;const mid=q.getBoundingClientRect().left+q.clientWidth/2;[...c].forEach((x,i)=>{const r=x.getBoundingClientRect();const dd=Math.abs(r.left+r.width/2-mid);if(dd<bd){bd=dd;best=i}});d.forEach((x,i)=>x.classList.toggle("on",i===best))},{passive:true})};
if(document.readyState!=="loading")drawShowcase();else document.addEventListener("DOMContentLoaded",drawShowcase);
})();

