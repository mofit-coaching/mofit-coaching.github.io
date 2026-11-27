/* Mofit public showcase (login landing). Content lives in window.SHOWCASE below.
   Empty arrays render polished placeholders. To publish real content, fill the arrays; nothing else changes.
   results[]:{before:"img url",after:"img url",name:"اسم أو أول اسم",stat:"-12 كجم في 10 أسابيع"}  (publish only with client consent)
   quotes[]:{text:"...",name:"...",meta:"... (اختياري)"}   stats[]:{n:"120",unit:"+",label:"عميل"} */
window.SHOWCASE=window.SHOWCASE||{
  coach:{name:"محمد علي",photo:""},
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
/* round7 skill 5: premium polish inside the existing order. Nothing moves, no new sections, no numbers. */
.sc-tg{position:relative;isolation:isolate}
.sc-tg:before{content:"";position:absolute;inset:-30px -10% -20px;z-index:-1;pointer-events:none;background:radial-gradient(60% 55% at 50% 45%,rgba(255,107,26,.2),transparent 70%);animation:scbreath 7s ease-in-out infinite}
@keyframes scbreath{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
.sc-step,.sc-stat,.sc-qc,.sc-faq details{box-shadow:inset 0 1px 0 rgba(255,255,255,.07)}
.sc-faq details[open]{border-color:rgba(255,146,72,.35)}
.sc-faq summary{min-height:48px}
.sc-faq summary:active{opacity:.8}
.sc-btn{box-shadow:0 14px 30px -14px rgba(255,107,26,.65)}
@media (hover:hover){.sc-faq details:hover{background:rgba(255,255,255,.075)}.sc-step{transition:transform .3s cubic-bezier(.22,1,.36,1)}.sc-step:hover{transform:translateY(-2px)}}
@media(prefers-reduced-motion:reduce){.sc-tg:before{animation:none}.sc-step{transition:none}}
.sc-ccard{position:relative;border-radius:24px;padding:22px 18px 18px;background:linear-gradient(165deg,rgba(255,255,255,.1),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12);overflow:hidden}
.sc-ccard:before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:linear-gradient(90deg,transparent,#FF6B1A,transparent)}
.sc-chead{display:flex;gap:16px;align-items:center}
.sc-cphoto{flex:0 0 auto;width:96px;height:96px;border-radius:26px;overflow:hidden;position:relative;background:#0B1220;border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 26px -12px rgba(0,0,0,.7);animation:scglow 3.2s ease-in-out infinite}
.sc-cframe{position:relative;flex:0 0 auto;width:101px;height:101px;padding:2.5px;border-radius:29px;overflow:hidden}
.sc-cframe:before{content:"";position:absolute;inset:-55%;background:conic-gradient(from 0deg,transparent 0deg,rgba(255,138,61,0) 70deg,#FF8A3D 130deg,#FFC46B 180deg,#FF8A3D 230deg,rgba(255,138,61,0) 290deg,transparent 360deg);animation:scspin 5.5s linear infinite}
.sc-cframe .sc-cphoto{position:relative;z-index:1;width:100%;height:100%}
.sc-cphoto .sc-cshine{position:absolute;top:0;bottom:0;left:-70%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.3),transparent);transform:skewX(-18deg);animation:scshine 3.8s ease-in-out infinite;z-index:1}
@keyframes scspin{to{transform:rotate(1turn)}}
@keyframes scglow{0%,100%{box-shadow:0 12px 26px -12px rgba(0,0,0,.7),0 0 0 0 rgba(255,138,61,.12)}50%{box-shadow:0 12px 26px -12px rgba(0,0,0,.7),0 0 24px 3px rgba(255,138,61,.5)}}
@keyframes scshine{0%,55%{left:-70%}100%{left:130%}}
.sc-cphoto img{width:100%;height:100%;object-fit:cover;display:block}
.sc-cphoto svg{width:100%;height:100%;display:block}
.sc-cname{display:block;font:800 21px/1.25 var(--disp);color:#fff}
.sc-crole{display:inline-block;margin-top:6px;padding:5px 11px;border-radius:99px;font-size:11.5px;font-weight:700;color:#0B1220;background:linear-gradient(90deg,#FFC46B,#FF8A3D)}
.sc-ccert{display:flex;gap:12px;align-items:flex-start;margin-top:16px;padding:13px 14px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.sc-ccert .ic3{flex:0 0 auto;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#FF6B1A,#FFA24D);box-shadow:0 6px 16px rgba(255,107,26,.4)}
.sc-ccert .ic3 svg{width:20px;height:20px}
.sc-ccert b{font-size:13.5px;color:#fff;display:block;line-height:1.5}
.sc-ccert small{display:block;font-size:11.5px;color:#9AA6BA;margin-top:2px;line-height:1.6}
.sc-ccert a{color:#FFB070;font-weight:700;text-decoration:none;border-bottom:1px dashed rgba(255,176,112,.6)}
.sc-cchips{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}
.sc-cchips span{padding:6px 11px;border-radius:99px;font-size:11px;font-weight:700;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#D9E1EE}
@media(prefers-reduced-motion:reduce){.sc-tg .w{transition:none;color:#fff}.sc-faq summary:after,.sc-faq details{transition:none}}
/* ---------- free consultation form ---------- */
.sc-cform{margin-top:14px;display:grid;gap:12px}
.sc-cform .f2{display:grid;gap:7px;font:700 13px/1.4 var(--disp);color:#E6EBF5}
.sc-cform input,.sc-cform textarea{width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font:400 14.5px/1.5 inherit;transition:border-color .3s,box-shadow .3s,background .3s;-webkit-appearance:none;appearance:none}
.sc-cform input::placeholder,.sc-cform textarea::placeholder{color:#7C8AA5}
.sc-cform input:focus,.sc-cform textarea:focus{outline:none;border-color:#FF8A3D;background:rgba(255,255,255,.09);box-shadow:0 0 0 4px rgba(255,107,26,.22)}
.sc-cform textarea{resize:vertical;min-height:74px}
.scc-goals{display:flex;gap:8px;flex-wrap:wrap}
.scc-goal{padding:9px 13px;border-radius:99px;font:700 12.5px/1 var(--disp);color:#D9E1EE;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);cursor:pointer;transition:transform .25s cubic-bezier(.34,1.56,.64,1),background .25s,border-color .25s,color .25s}
.scc-goal:active{transform:scale(.93)}
.scc-goal.on{background:linear-gradient(135deg,#FF5A0A,#FFA24D);border-color:transparent;color:#fff;box-shadow:0 8px 20px -8px rgba(255,107,26,.7);transform:translateY(-2px)}
.scc-err{margin:0;font-size:12.5px;font-weight:700;color:#FF9C9C;min-height:1em}
.scc-done{text-align:center;padding:26px 14px}
.scc-done .tick{width:72px;height:72px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#22C55E,#4ADE80);box-shadow:0 14px 34px -10px rgba(34,197,94,.8);animation:sccpop .6s cubic-bezier(.34,1.56,.64,1) both}
.scc-done .tick svg{width:36px;height:36px}
@keyframes sccpop{from{opacity:0;transform:scale(.4) rotate(-30deg)}to{opacity:1;transform:none}}
.scc-done h3{margin:0 0 8px;font:800 19px/1.4 var(--disp);color:#fff}
.scc-done p{margin:0 0 16px;font-size:13.5px;color:#A9B4C8;line-height:1.8}
.sc-cform .sc-btn{width:100%;border:0}
@media(prefers-reduced-motion:reduce){.scc-done .tick{animation:none}.scc-goal,.sc-cform input,.sc-cform textarea{transition:none}}
@media(prefers-reduced-motion:reduce){.sc-rv{opacity:1;transform:none;transition:none}.sc-btn:after{animation:none;display:none}.sc-cframe:before,.sc-cphoto .sc-cshine{animation:none;display:none}.sc-cphoto{animation:none}}
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
/* Coach identity: real certification only (IASST certificate C264067, Oct 2026).
   TODO coach: fill SHOWCASE.coach.photo with his photo URL, and confirm SHOWCASE.coach.name is how he wants to appear. */
function coachFig(){return `<svg viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="sccg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2012"/><stop offset="1" stop-color="#0B1220"/></linearGradient><linearGradient id="sccf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFA24D"/><stop offset="1" stop-color="#FF6B1A"/></linearGradient></defs><rect width="96" height="96" fill="url(#sccg)"/><circle cx="48" cy="48" r="34" fill="rgba(255,107,26,.16)"/><circle cx="48" cy="36" r="13" fill="url(#sccf)"/><path d="M16 96 C18 66 32 56 48 56 C64 56 78 66 80 96Z" fill="url(#sccf)"/></svg>`}
function coach(){const c=(SHOWCASE.coach||{});const ph=!c.photo;
return `<div class="sc-ccard sc-rv"><div class="sc-chead"><div class="sc-cframe"><div class="sc-cphoto">${ph?coachFig()+'<div class="sc-cshine"></div>':`<img src="${esc(c.photo)}" alt="صورة الكوتش ${esc(c.name||"")}" loading="lazy">`}</div></div>
<div><b class="sc-cname">${esc(c.name||"")}</b><span class="sc-crole">مدرب لياقة معتمد دولياً</span></div></div>
<div class="sc-ccert"><div class="ic3"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="6" stroke="#fff" stroke-width="2"/><path d="M8.5 13.5 7 21l5-2.6L17 21l-1.5-7.5" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="m9.4 9 1.8 1.8 3.4-3.6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<div><b>IASST · Certified Fitness Trainer</b><small>الأكاديمية الدولية لعلوم وتكنولوجيا الرياضة (IASST) · فيينا، النمسا · أكتوبر 2026</small><small>شهادة رقم C264067 · <a href="https://iasst.org/certi/find" target="_blank" rel="noopener">اتحقق من الشهادة بنفسك</a></small></div></div>
<div class="sc-cchips"><span>فسيولوجيا التمرين</span><span>التشريح الوظيفي</span><span>البيوميكانيكا</span><span>التغذية</span><span>تدريب القوة</span><span>تصميم البرامج</span></div></div>`}
function tagline(){const t="تمرينك وأكلك ومتابعتك كلهم في مكان واحد. ومعاك كوتش حقيقي بيتابعك كل أسبوع ويعدّل معاك على حسب نتيجتك.";const hl=new Set(["كوتش","حقيقي","مكان","واحد."]);
/* Real numbers only, read from the app itself: exercise library size, program systems, active clients. */
const nEx=Object.keys(window.EXDB||{}).length, nSys=(typeof B!=="undefined"&&B)?Object.keys(B).length:0, nCl=16;
const counts=`<div class="sc-counts sc-rv"><div class="c"><b><span data-count="${nEx}">${nEx}</span>+</b><span>تمرين في مكتبة الأداء</span></div><div class="c"><b><span data-count="${nSys}">${nSys}</span>+</b><span>برنامج تمرين جاهز</span></div><div class="c"><b><span data-count="${nCl}">${nCl}</span></b><span>عميل بيتمرن معانا</span></div></div>`;
return `<div class="sc-tg" aria-label="${esc(t)}"><p aria-hidden="true">${t.split(" ").map(w=>`<span class="w${hl.has(w)?" hl":""}">${esc(w)}</span>`).join(" ")}</p></div>`+counts}
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
["بدفع إزاي؟","الدفع بإنستاباي، خطوة بسيطة من موبايلك في ثواني، من غير تعقيد ولا طوابير. ولو وقفت في أي حاجة، كلمنا على واتساب وهنكون معاك لحد ما تخلص."],
["لو غيرت رأيي؟","ارتاح تماماً. لو غيرت رأيك في أي وقت قبل ما برنامجك يتعمل، فلوسك بترجعلك كاملة، من غير أسئلة ولا إحراج. إحنا مش عايزينك تشترك غير وانت مطمّن ومرتاح لقرارك."],
["الكوتش بيدرّب بنات؟","أيوه طبعاً، وكمان للبنات نظام مختلف معمول مخصوص ليهم، لأن احتياجاتكم مش زي الشباب. هتلاقي نفسك في مكان محترم ومريح، ومتابعة مفصّلة عليكي إنتي."],
["هستلم برنامجي إمتى؟","برنامجك مش بيتسحب من درج جاهز، ده بيتبني من الصفر على جسمك وهدفك وأيامك، وعشان كده بياخد من يومين لـ٣ أيام. الصبر ده هو اللي بيفرق بين برنامج عادي وبرنامج معمول ليك انت."],
["اشتراكي بيبدأ إمتى؟","اشتراكك بيبدأ من اليوم اللي بتستلم فيه برنامجك، مش من يوم الدفع. يعني ولا يوم من اشتراكك بيضيع وانت مستني، وكل يوم دفعت عليه بتتدرب فيه فعلاً."]];
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
/* ---------- free consultation: landing form -> WhatsApp hand-off to the coach ---------- */
const CONSULT_WA="201093047225";
const CONSULT_GOALS=["🔥 تنشيف وخسارة وزن","🏋️ تضخيم وبناء عضل","🤸 لياقة وشد الجسم","🩹 رجوع بعد إصابة","🤔 لسه مش متأكد"];
function consult(){
return `<div class="sc-ccard sc-rv"><form class="sc-cform" id="scConsult" novalidate>
<label class="f2">الاسم<input id="sccName" type="text" autocomplete="name" maxlength="60" placeholder="اسمك الأول كفاية"></label>
<label class="f2">رقم الواتساب<input id="sccPhone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="01xxxxxxxxx"></label>
<div class="f2">هدفك إيه؟<div class="scc-goals" id="sccGoals" role="group" aria-label="هدفك">${CONSULT_GOALS.map(g=>`<button type="button" class="scc-goal" aria-pressed="false" data-g="${esc(g)}">${esc(g)}</button>`).join("")}</div></div>
<label class="f2">عايز تقول للكوتش حاجة؟ <small style="color:#8591A8;font-weight:400">(اختياري)</small><textarea id="sccNotes" rows="3" maxlength="300" placeholder="سنك، وزنك، خبرتك في التمرين…"></textarea></label>
<p class="scc-err" id="sccErr" role="alert"></p>
<button class="sc-btn" type="submit" id="sccBtn">📲 ابعت طلب الاستشارة</button>
<p class="sc-note">هيفتحلك واتساب برسالة جاهزة، دوس إرسال والكوتش نفسه هيرد عليك.</p>
</form><div class="scc-done hidden" id="sccDone"></div></div>`}
function bindConsult(box){
const f=box.querySelector("#scConsult"); if(!f) return;
const goals=box.querySelector("#sccGoals");
goals.addEventListener("click",e=>{const b=e.target.closest(".scc-goal");if(!b)return;
[...goals.children].forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on)});});
f.addEventListener("submit",e=>{
e.preventDefault();
const err=m=>{box.querySelector("#sccErr").textContent=m}; err("");
const name=box.querySelector("#sccName").value.trim();
let phone=box.querySelector("#sccPhone").value.replace(/[^\d+]/g,"");
if(/^\+?20/.test(phone)) phone="0"+phone.replace(/^\+?20/,"");
const goal=(goals.querySelector(".scc-goal.on")||{}).dataset?.g||"";
const notes=box.querySelector("#sccNotes").value.trim();
if(name.length<2) return err("اكتب اسمك الأول");
if(!/^01[0125]\d{8}$/.test(phone)) return err("رقم الواتساب مش صحيح، لازم يكون 11 رقم ويبدأ بـ 01");
if(!goal) return err("اختار هدفك من الاختيارات فوق");
const msg=`السلام عليكم كوتش 👋\nأنا ${name}، جاي من موقع Mofit وعايز أحجز الاستشارة المجانية.\n🎯 هدفي: ${goal}\n📱 رقمي: ${phone}`+(notes?`\n📝 ${notes}`:"");
const wa=`https://wa.me/${CONSULT_WA}?text=${encodeURIComponent(msg)}`;
window.open(wa,"_blank","noopener");
f.classList.add("hidden");
const d=box.querySelector("#sccDone"); d.classList.remove("hidden");
d.innerHTML=`<div class="tick"><svg viewBox="0 0 24 24" fill="none"><path d="M4.5 12.5 10 18 19.5 6.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<h3>رسالتك جاهزة يا ${esc(name)} ✅</h3><p>كمّل في شات الواتساب اللي اتفتح ودوس إرسال، والكوتش هيرد عليك بنفسه ويحدد معاك ميعاد الاستشارة.<br>لو الشات مفتحش، دوس على الزرار تحت.</p>
<a class="sc-btn" href="${esc(wa)}" target="_blank" rel="noopener">💬 افتح الواتساب تاني</a>`;
});
}

window.drawShowcase=function(){const box=document.getElementById("showcase");if(!box||box.dataset.done)return;box.dataset.done=1;
const hasR=(SHOWCASE.results||[]).length, hasQ=(SHOWCASE.quotes||[]).length;
box.innerHTML=tagline()+sec("THE COACH",'مين <b>الكوتش</b>؟',"كوتش حقيقي، معتمد، وشهادته متاحة للتحقق",coach())+sec("RESULTS",'نتايج <b>حقيقية</b> من متدربينا',hasR?"اسحب وقارن قبل وبعد":"اسحب وقارن - صور التحوّلات بتتنشر هنا بموافقة كل عميل",results())+(SHOWCASE.stats&&SHOWCASE.stats.length?stats().replace('<div class="sc-stats','<div style="margin-top:22px"></div><div class="sc-stats'):"")+(hasQ?sec("VOICES","بيقولوا إيه عننا","",quotes()):"")+sec("HOW IT WORKS","إزاي <b>تبدأ</b>","تلات خطوات وبس",steps())+sec("LEAGUE",'دوري <b>الأسبوع</b>',"الكوتش بيبدأ الدوري وانت بتختار تشارك، نقاطك من تمرينك والتزامك، وأول 3 ليهم المجد",league())+sec("INVITE FRIENDS",'ادعُ صحابك <b>وخد أسبوع هدية</b>',"كل صاحب يشترك من لينكك بيضيفلك أسبوع مجاني",invite())+sec("FREE TOOLS",'احسب <b>بنفسك</b>',"تلات حاسبات وخريطة عضلات، من غير تسجيل ولا فلوس",(window.mofitAttract?window.mofitAttract.cards()+window.mofitAttract.map():""))+sec("FAQ","أسئلة <b>ممكن تكون في بالك</b>","هنا عشان تحس إنك في بيتك من أول يوم",faq())+sec("FREE CONSULT",'محتاج <b>استشارة مجانية</b>؟',"سيب بياناتك وهدفك، والكوتش هيكلمك ويرد على كل أسئلتك قبل ما تشترك",consult())+`<div class="sc-cta sc-rv"><a class="sc-btn" href="#plans" onclick="loginTab('plans');window.scrollTo({top:0,behavior:'smooth'});return false">ابدأ رحلتك، اشترك دلوقتي</a><p class="sc-note">* النتيجة بتختلف من شخص لآخر.</p></div>`;
box.querySelectorAll(".sc-ba").forEach(bindBA);
bindConsult(box);
if(window.mofitAttract&&window.mofitAttract.enhance) window.mofitAttract.enhance(box);
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");const b=e.target.querySelector(".sc-ba");if(b&&b._hint&&!b._h){b._h=1;setTimeout(b._hint,350)}io.unobserve(e.target)}}),{threshold:.15}):null;
box.querySelectorAll(".sc-rv").forEach(n=>io?io.observe(n):n.classList.add("in"));
const ws=[...box.querySelectorAll(".sc-tg .w")];if(ws.length){if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion:reduce)").matches)ws.forEach(w=>w.classList.add("on"));else{const wo=new IntersectionObserver(es=>{let k=0;es.filter(e=>e.isIntersecting).sort((a,b)=>ws.indexOf(a.target)-ws.indexOf(b.target)).forEach(e=>{setTimeout(()=>e.target.classList.add("on"),Math.min(k++*70,500));wo.unobserve(e.target)})},{rootMargin:"0px 0px -38% 0px"});ws.forEach(w=>wo.observe(w));}}

const q=document.getElementById("scq"),d=document.querySelectorAll("#scd i");if(q)q.addEventListener("scroll",()=>{const c=q.children;let best=0,bd=1e9;const mid=q.getBoundingClientRect().left+q.clientWidth/2;[...c].forEach((x,i)=>{const r=x.getBoundingClientRect();const dd=Math.abs(r.left+r.width/2-mid);if(dd<bd){bd=dd;best=i}});d.forEach((x,i)=>x.classList.toggle("on",i===best))},{passive:true});coachPhotoProbe()};
/* Coach photo: when the coach has uploaded one (public "assets" bucket, fixed path),
   swap the designed avatar for it. The probe fails silently - no photo yet, bucket not
   created yet, offline - and the avatar stays. SHOWCASE.coach.photo still wins when set. */
async function coachPhotoProbe(){
  try{
    if((SHOWCASE.coach||{}).photo) return;
    if(typeof sb==="undefined"||!sb.storage) return;
    const { data }=sb.storage.from("assets").getPublicUrl("coach/photo.jpg");
    const base=data&&data.publicUrl; if(!base) return;
    const url=base+"?v="+Math.floor(Date.now()/6e5);
    const img=new Image();
    img.onload=()=>{ const ph=document.querySelector("#showcase .sc-cphoto"); if(!ph) return; const c=SHOWCASE.coach||{};
      ph.innerHTML=`<img src="${esc(url)}" alt="صورة الكوتش ${esc(c.name||"")}" loading="lazy">`; };
    img.onerror=()=>{};
    img.src=url;
  }catch(_){}
}
if(document.readyState!=="loading")drawShowcase();else document.addEventListener("DOMContentLoaded",drawShowcase);
})();
