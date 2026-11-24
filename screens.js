/* ======================================================================
   SCREENS pack (design overhaul, screens half): designed empty states.
   Scoped CSS only (es-* classes) injected here, like chat.js v8.
   No edits to styles.css variables, fonts or theme blocks.
   Keeps the motion language he likes: float + dashed orbit spin,
   disabled under prefers-reduced-motion.
   ====================================================================== */
(function(){
const st=document.createElement("style"); st.textContent=`
.es{position:relative;text-align:center;color:var(--slate);padding:36px 18px 30px;overflow:hidden;border-radius:var(--r)}
.es::before{content:"";position:absolute;inset:0;background:radial-gradient(260px 170px at 50% 26%,rgba(249,115,22,.09),transparent 72%);pointer-events:none}
.es-art{position:relative;width:96px;height:96px;margin:0 auto 18px;display:grid;place-items:center;border-radius:32px;background:linear-gradient(160deg,#fff,#FFEDDC);box-shadow:0 18px 34px -16px rgba(249,115,22,.45),inset 0 0 0 1px rgba(249,115,22,.14);animation:esfloat 4.5s ease-in-out infinite}
.es-art>span{font-size:2.6rem;line-height:1;filter:drop-shadow(0 6px 10px rgba(15,23,42,.16))}
.es-art::after{content:"";position:absolute;inset:-9px;border-radius:38px;border:2px dashed rgba(249,115,22,.32);animation:spin 22s linear infinite}
.es-title{position:relative;font-weight:800;font-size:1.04rem;color:var(--navy)}
.es-desc{position:relative;font-size:.85rem;line-height:1.75;max-width:310px;margin:6px auto 0}
.es-cta{position:relative;margin-top:16px;box-shadow:0 10px 22px -10px rgba(249,115,22,.6)}
/* compact variant for small cards, lists and sheets */
.es.es-sm{padding:20px 12px 18px}
.es.es-sm .es-art{width:64px;height:64px;border-radius:22px;margin-bottom:12px}
.es.es-sm .es-art>span{font-size:1.7rem}
.es.es-sm .es-art::after{inset:-6px;border-radius:27px}
.es.es-sm .es-title{font-size:.95rem}
.es.es-sm .es-desc{font-size:.8rem}
/* inside dark cards */
.card.dark .es-title{color:#fff}
.card.dark .es{color:#CBD5E1}
.card.dark .es-art{background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.05));box-shadow:0 18px 34px -16px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.16)}
/* loading variant: calm pulse instead of the orbit */
.es.es-load .es-art{animation:espulse 1.6s ease-in-out infinite}
.es.es-load .es-art::after{animation:none;opacity:.4}
@keyframes esfloat{50%{transform:translateY(-6px)}}
@keyframes espulse{50%{transform:scale(.94);opacity:.75}}
@media(prefers-reduced-motion:reduce){.es-art,.es-art::after{animation:none}}
/* before/after photo frames (ba-*) */
.ba-grid{display:grid;gap:14px}
.ba{margin:0;background:linear-gradient(180deg,#fff,#FFF4EA);border:1px solid rgba(249,115,22,.16);border-radius:var(--r);padding:10px;box-shadow:0 16px 30px -20px rgba(15,23,42,.3)}
.ba-row{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ba-shot{position:relative;aspect-ratio:3/4;border-radius:14px;overflow:hidden;background:var(--soft2)}
.ba-shot img{width:100%;height:100%;object-fit:cover;display:block}
.ba-after{box-shadow:inset 0 0 0 2px rgba(249,115,22,.6)}
.ba-tag{position:absolute;top:8px;inset-inline-start:8px;padding:3px 12px 4px;border-radius:99px;font-size:.74rem;font-weight:800;color:#fff;box-shadow:0 5px 12px -4px rgba(15,23,42,.55)}
.ba-before .ba-tag{background:linear-gradient(135deg,#64748B,#334155)}
.ba-after .ba-tag{background:linear-gradient(135deg,#FF8A3C,#F97316)}
.ba-div{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;width:30px;height:30px;border-radius:99px;background:var(--navy);border:2px solid #fff;display:grid;place-items:center;box-shadow:0 8px 16px -5px rgba(15,23,42,.6)}
.ba-div svg{width:14px;height:14px}
.ba-cap{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 4px 1px}
.ba-cap b{color:var(--navy);font-size:.86rem}
.ba-cap span{font-size:.76rem;color:var(--slate)}
@media print{.ba{box-shadow:none;background:#fff}}
`; document.head.appendChild(st);
})();

/* Designed empty state. emptyBox(icon, title, desc, cta, cls)
   - icon: emoji/text shown in the art disc
   - title: short bold line (old 2-arg callers pass their text here, still fine)
   - desc: optional helper line
   - cta: optional {label, go:"tab"} to switch tabs, or {label, click:"#selector"} to press an existing button
   - cls: "es-sm" compact, "es-load" loading */
function emptyStateHTML(icon, title, desc, cta, cls){
  return `<div class="es ${cls||""}"><div class="es-art"><span>${icon}</span></div>
    <div class="es-title">${title}</div>
    ${desc?`<p class="es-desc">${desc}</p>`:""}
    ${cta?`<button type="button" class="btn primary es-cta"${cta.go?` data-es-go="${cta.go}"`:""}${cta.click?` data-es-click="${cta.click}"`:""}>${cta.label}</button>`:""}</div>`;
}
emptyBox=function(icon, title, desc, cta, cls){ return emptyStateHTML(icon, title, desc, cta, cls); };

/* one delegated handler for every empty-state action */
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-es-go],[data-es-click]"); if(!b) return;
  if(b.dataset.esClick){ const t=document.querySelector(b.dataset.esClick); if(t) t.click(); return; }
  if(b.dataset.esGo&&window.S){ S.tab=b.dataset.esGo; render(); window.scrollTo(0,0); }
});

/* Branded before/after frame for progress photos.
   baPair(urlBefore, urlAfter, poseLabel, weekA, weekB)
   RTL: first child (قبل) renders on the right, بعد on the left,
   and the navy chevron points the direction of progress. */
function baPair(ua, ub, pose, weekA, weekB){
  return `<figure class="ba"><div class="ba-row">
    <div class="ba-shot ba-before"><img src="${ua}" alt="قبل"><span class="ba-tag">قبل</span></div>
    <span class="ba-div" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M14.5 5.5 8 12l6.5 6.5" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <div class="ba-shot ba-after"><img src="${ub}" alt="بعد"><span class="ba-tag">بعد</span></div>
  </div>
  <figcaption class="ba-cap"><b>${pose}</b><span>أسبوع ${weekA} ← أسبوع ${weekB}</span></figcaption></figure>`;
}
