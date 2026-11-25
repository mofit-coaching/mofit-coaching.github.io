/* Mofit progress photo archive (pp-*). Monthly photo timeline + drag-compare slider + showcase consent.
   Placeholder local state (localStorage) until the storage schema lands; swap ppLoad/ppSave then.
   API: fillPhotoArchive(el, p, pre) — pre injects photos for demos/tests: [{date,pose,img,starred}]. */
(function(){
const css=`
.pp-card{overflow:hidden}
.pp-eyebrow{display:flex;align-items:center;gap:8px;font:800 10px/1 var(--font-num,system-ui);letter-spacing:.22em;color:#C2410C;text-transform:uppercase;margin-bottom:4px}
.pp-eyebrow:before{content:"";height:1px;flex:0 0 22px;background:linear-gradient(90deg,transparent,rgba(249,115,22,.75))}
.pp-eyebrow:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,rgba(249,115,22,.75),transparent)}
/* compare slider — showcase feel, Flame handle */
.pp-cmp{position:relative;border-radius:20px;overflow:hidden;aspect-ratio:3/4;direction:ltr;touch-action:pan-y;user-select:none;-webkit-user-select:none;background:#0B1220;border:1px solid rgba(15,23,42,.14);box-shadow:0 22px 44px -22px rgba(15,23,42,.55);--p:50%}
.pp-cmp .lay{position:absolute;inset:0}
.pp-cmp .lay img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.pp-cmp .aft{clip-path:inset(0 calc(100% - var(--p)) 0 0)}
.pp-cmp .tag{position:absolute;top:10px;padding:5px 11px 6px;border-radius:99px;font:800 11.5px/1 var(--disp);background:rgba(11,18,32,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,.18)}
.pp-cmp .tag.b{right:10px}
.pp-cmp .tag.a{left:10px;background:linear-gradient(135deg,#FF5A0A,#FFB347);border-color:transparent}
.pp-cmp .hd{position:absolute;top:0;bottom:0;left:var(--p);width:46px;margin-left:-23px;cursor:ew-resize;display:grid;place-items:center;touch-action:none}
.pp-cmp .hd:before{content:"";position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:linear-gradient(180deg,rgba(255,255,255,.15),#fff,rgba(255,255,255,.15));box-shadow:0 0 16px rgba(255,146,72,.9)}
.pp-cmp .hd i{position:relative;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#FF5A0A,#FFB347);display:grid;place-items:center;box-shadow:0 8px 20px rgba(255,90,10,.55),0 0 0 4px rgba(255,255,255,.2);font-style:normal}
.pp-cmp .hd svg{width:20px;height:20px;stroke:#fff;stroke-width:2.6;fill:none;stroke-linecap:round;stroke-linejoin:round}
.pp-cmp .hd:focus-visible i{outline:3px solid #fff;outline-offset:2px}
.pp-cmp-hint{text-align:center;font-size:11.5px;color:var(--slate);margin:7px 0 0}
/* pair picker rails */
.pp-railrow{display:flex;align-items:center;gap:8px;margin-top:10px}
.pp-railrow>span{flex:0 0 auto;font-size:11.5px;font-weight:800;color:var(--navy)}
.pp-rail{display:flex;gap:6px;overflow-x:auto;padding:2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.pp-rail::-webkit-scrollbar{display:none}
.pp-chip{flex:0 0 auto;padding:7px 11px;border-radius:99px;border:1.5px solid #E4E9F1;background:#fff;font-size:11.5px;font-weight:800;color:var(--slate);cursor:pointer;transition:.2s}
.pp-chip.on{border-color:#F97316;background:linear-gradient(135deg,#FFF3E8,#FFE4C7);color:#C2410C;box-shadow:0 4px 10px -4px rgba(249,115,22,.5)}
/* add row */
.pp-add{display:flex;align-items:center;gap:8px;margin-top:14px;flex-wrap:wrap}
.pp-pose{display:flex;gap:6px}
.pp-add .btn{flex:1;min-width:150px}
/* timeline */
.pp-month{margin-top:16px}
.pp-month-h{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;color:var(--navy);margin-bottom:8px}
.pp-month-h i{flex:1;height:1px;background:linear-gradient(90deg,rgba(249,115,22,.4),transparent);font-style:normal}
.pp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.pp-ph{position:relative;margin:0;border-radius:14px;overflow:hidden;aspect-ratio:3/4;background:var(--soft2);border:1px solid rgba(15,23,42,.08)}
.pp-ph img{width:100%;height:100%;object-fit:cover;display:block}
.pp-ph.starred{border:2px solid #FFB300;box-shadow:0 0 0 2px rgba(255,194,26,.35),0 10px 22px -12px rgba(255,179,0,.55)}
.pp-pose-tag{position:absolute;bottom:6px;inset-inline-start:6px;padding:2px 8px 3px;border-radius:99px;font-size:10.5px;font-weight:800;color:#fff;background:rgba(11,18,32,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}

.pp-star{position:absolute;top:6px;inset-inline-start:6px;width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(255,255,255,.85);background:rgba(11,18,32,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:grid;place-items:center;cursor:pointer;padding:0;transition:.2s}
.pp-star svg{width:15px;height:15px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linejoin:round}
.pp-ph.starred .pp-star{background:linear-gradient(135deg,#FFB300,#FFE680);border-color:#fff;box-shadow:0 4px 12px rgba(255,179,0,.6)}
.pp-ph.starred .pp-star svg{fill:#7A4A00;stroke:#7A4A00}
.pp-ic-flame{width:22px;height:22px;display:block}
.pp-art svg{width:38px;height:38px}
.pp-del{position:absolute;top:6px;inset-inline-end:6px;width:26px;height:26px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);background:rgba(11,18,32,.5);color:#fff;font-size:12px;font-weight:800;display:grid;place-items:center;cursor:pointer;padding:0;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);transition:.2s}
.pp-del.arm{background:#DC2626;border-color:#fff;width:auto;padding:0 9px;border-radius:99px;font-size:10.5px}
.pp-note{margin:14px 2px 0;font-size:11.5px;line-height:1.7;color:var(--slate);background:linear-gradient(135deg,#FFF9EC,#FFF3D6);border:1px dashed rgba(255,179,0,.55);border-radius:12px;padding:9px 12px}
.pp-note b{color:#8A5A00}
/* empty state */
.pp-empty{text-align:center;padding:26px 10px 8px}
.pp-art{width:74px;height:74px;margin:0 auto 12px;border-radius:24px;display:grid;place-items:center;font-size:32px;background:linear-gradient(150deg,#0F172A,#1E293B);box-shadow:0 14px 30px -12px rgba(15,23,42,.6),inset 0 1px 0 rgba(255,255,255,.12)}
.pp-empty h3{margin:0 0 4px;font-size:15px;color:var(--navy)}
.pp-empty p{margin:0 0 14px;font-size:12.5px;color:var(--slate);line-height:1.7}
@media(prefers-reduced-motion:reduce){.pp-cmp .hd i,.pp-chip,.pp-star{transition:none}}
`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

const KEY=id=>"mofit_pp_"+id;
function ppLoad(id){ try{ const a=JSON.parse(localStorage.getItem(KEY(id))||"[]"); return Array.isArray(a)?a:[]; }catch(_){ return []; } }
function ppSave(id,a){ try{ localStorage.setItem(KEY(id),JSON.stringify(a)); return true; }catch(_){ window.toast&&toast("مساحة التخزين اتملت — امسح صور قديمة"); return false; } }
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const POSE_L={front:"أمامي",side:"جانبي",back:"خلفي"};
const monthAr=d=>new Date(d.slice(0,7)+"-02T00:00:00").toLocaleDateString("ar-EG",{month:"long",year:"numeric"});
const dayAr=d=>new Date(d+"T00:00:00").toLocaleDateString("ar-EG",{day:"numeric",month:"short"});
const dayNum=d=>new Date(d+"T00:00:00").toLocaleDateString("ar-EG",{day:"numeric"});
const flameSvg=(cls)=>`<svg class="${cls||""}" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ppfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#FF5A0A"/></linearGradient></defs><path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-1.8-5.5-3.4-7.3-.4 1.2-1.1 2.2-2.1 2.8.3-2.9-1-6.3-4.2-8.3.2 2.5-.7 4.3-2.1 5.9C6.3 9.5 4.5 11.6 4.5 14.8 4.5 19 7.6 22 12 22Z" fill="url(#ppfg)"/><path d="M12 22c2.2 0 3.9-1.6 3.9-3.8 0-1.9-1.1-3.1-2-4.1-.5.6-1 1-1.7 1.2.2-1.5-.5-3-2-3.9.1 1.4-.4 2.4-1.2 3.3-.9 1-1.9 2-1.9 3.5C7.1 20.4 9.8 22 12 22Z" fill="#FFE680" opacity=".9"/></svg>`;
const dragSvg='<svg viewBox="0 0 24 24"><path d="M9 6.5 3.5 12 9 17.5"/><path d="m15 6.5 5.5 5.5-5.5 5.5"/></svg>';
const starSvg='<svg viewBox="0 0 24 24"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"/></svg>';

function resize(file,max=900){ return new Promise((res,rej)=>{ const img=new Image();
  img.onload=()=>{ const k=Math.min(1,max/Math.max(img.width,img.height)); const c=document.createElement("canvas");
    c.width=Math.round(img.width*k); c.height=Math.round(img.height*k);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height); const out=c.toDataURL("image/jpeg",.82);
    URL.revokeObjectURL(img.src); res(out); };
  img.onerror=rej; img.src=URL.createObjectURL(file); }); }

/* drag-compare slider (showcase mechanics, pp-* scoped) */
function bindCmp(el){ const hd=el.querySelector(".hd"); let drag=false;
  const set=p=>{ p=Math.max(4,Math.min(96,p)); el.style.setProperty("--p",p+"%"); hd.setAttribute("aria-valuenow",Math.round(p)); };
  const at=e=>{ const r=el.getBoundingClientRect(); set((e.clientX-r.left)/r.width*100); };
  el.addEventListener("pointerdown",e=>{ drag=true; try{el.setPointerCapture(e.pointerId)}catch(_){} at(e); e.preventDefault(); });
  el.addEventListener("pointermove",e=>{ if(drag) at(e); });
  ["pointerup","pointercancel"].forEach(t=>el.addEventListener(t,()=>{ drag=false; }));
  hd.addEventListener("keydown",e=>{ const v=+hd.getAttribute("aria-valuenow");
    if(e.key==="ArrowLeft"){ set(v-5); e.preventDefault(); } if(e.key==="ArrowRight"){ set(v+5); e.preventDefault(); } });
  if(!matchMedia("(prefers-reduced-motion:reduce)").matches && !el._h){ el._h=1;
    const t0=performance.now(), f=t=>{ const k=(t-t0)/1500;
      if(k>=1||drag){ if(!drag) set(50); return; }
      set(50+Math.sin(k*Math.PI*2)*20*(1-k)); requestAnimationFrame(f); };
    setTimeout(()=>requestAnimationFrame(f),400); } }

window.fillPhotoArchive=function(el,p,pre){
  if(!el) return;
  const photos=(pre||ppLoad(p.id)).slice().sort((a,b)=>a.date<b.date?-1:1);
  const save=pre?()=>true:()=>ppSave(p.id,photos);
  window.S&&(S.ppPose=S.ppPose||"front");
  const sel=S.ppSel||(S.ppSel={});
  /* default pair: same pose if possible, oldest vs newest */
  const pick=(fromEnd)=>{ const by={}; photos.forEach(x=>(by[x.pose]=by[x.pose]||[]).push(x));
    const poses=Object.keys(by).sort((a,b)=>by[b].length-by[a].length);
    if(!poses.length) return null; const arr=by[poses[0]];
    return fromEnd?arr[arr.length-1]:arr[0]; };
  const A=photos.find(x=>x.id===sel.a)||pick(false), B=photos.find(x=>x.id===sel.b)||pick(true);
  if(A) sel.a=A.id; if(B) sel.b=B.id;

  let inner="";
  if(!photos.length){
    inner=`<div class="pp-empty"><div class="pp-art">${flameSvg()}</div><h3>لسه مفيش صور في الأرشيف</h3>
      <p>ضيف صورة كل شهر بنفس الزاوية والإضاءة،<br>وشوف تحوّلك قدام عينك.</p></div>`;
  }else{
    const chip=x=>`<button type="button" class="pp-chip" data-pick="${x.id}">${POSE_L[x.pose]||"صورة"} ${dayAr(x.date)}</button>`;
    const cmpHtml=(A&&B&&A.id!==B.id)?`<div class="pp-cmp" tabindex="-1">
        <div class="lay bef"><img src="${A.img}" alt="قبل"></div>
        <div class="lay aft"><img src="${B.img}" alt="بعد"></div>
        <span class="tag b">قبل · ${POSE_L[A.pose]||""}</span><span class="tag a">بعد · ${POSE_L[B.pose]||""}</span>
        <div class="hd" role="slider" tabindex="0" aria-label="قارن قبل وبعد" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><i>${dragSvg}</i></div>
      </div><p class="pp-cmp-hint">اسحب الخط يمين وشمال وقارن ${dayAr(A.date)} ← ${dayAr(B.date)}</p>`
      :(photos.length===1?`<div class="pp-cmp"><div class="lay bef"><img src="${photos[0].img}" alt="صورة التقدم"></div>
        <span class="tag b">${POSE_L[photos[0].pose]||""} · ${dayAr(photos[0].date)}</span></div>
        <p class="pp-cmp-hint">ضيف صورة تانية الشهر الجاي عشان تقارن قبل وبعد 💪</p>`:"");
    inner=`${cmpHtml}
      <div class="pp-railrow"><span>من</span><div class="pp-rail" data-rail="a">${photos.map(x=>chip(x).replace('class="pp-chip"',`class="pp-chip${sel.a===x.id?" on":""}"`)).join("")}</div></div>
      <div class="pp-railrow"><span>إلى</span><div class="pp-rail" data-rail="b">${photos.map(x=>chip(x).replace('class="pp-chip"',`class="pp-chip${sel.b===x.id?" on":""}"`)).join("")}</div></div>`;
    /* month-grouped timeline, newest month first */
    const months={}; photos.forEach(x=>{ const m=x.date.slice(0,7); (months[m]=months[m]||[]).push(x); });
    inner+=Object.keys(months).sort().reverse().map(m=>`<div class="pp-month"><div class="pp-month-h">${monthAr(m)}<i></i></div>
      <div class="pp-grid">${months[m].slice().sort((a,b)=>a.date<b.date?1:-1).map(x=>`<figure class="pp-ph${x.starred?" starred":""}">
        <img src="${x.img}" alt="${POSE_L[x.pose]||"صورة"} ${dayAr(x.date)}" loading="lazy">
        <button type="button" class="pp-star" data-star="${x.id}" aria-pressed="${x.starred?1:0}" title="${x.starred?"من أفضل صورك — اضغط للإلغاء":"علّمها كواحدة من أفضل صورك"}">${starSvg}</button>
        <button type="button" class="pp-del" data-del="${x.id}" aria-label="امسح الصورة">✕</button>
        <span class="pp-pose-tag">${POSE_L[x.pose]||"صورة"} · ${dayNum(x.date)}</span>
      </figure>`).join("")}</div></div>`).join("");
    inner+=`<div class="pp-note">⭐ <b>النجمة = من أفضل صورك</b> عشان ترجعلها بسرعة. 🔒 أرشيفك خاص بيك: لو الكوتش حابب يعرض تحوّلك في معرض النتايج هيسألك صراحة الأول، ومفيش حاجة بتتنشر غير بموافقتك.</div>`;
  }
  el.innerHTML=`<div class="card pp-card"><div class="card-h"><div class="ic acc">${flameSvg("pp-ic-flame")}</div><h2>أرشيف التحوّل<small>صورك الشهرية · قارن قبل وبعد بنفسك</small></h2></div>
    <div class="pp-eyebrow">PROGRESS ARCHIVE</div>
    ${inner}
    <div class="pp-add"><div class="pp-pose">${Object.entries(POSE_L).map(([k,l])=>`<button type="button" class="pp-chip${S.ppPose===k?" on":""}" data-pose="${k}">${l}</button>`).join("")}</div>
      <button type="button" class="btn primary" id="ppAdd">＋ ضيف صورة${photos.length?"":" الأولى"}</button>
      <input type="file" accept="image/*" capture="environment" id="ppFile" hidden></div></div>`;

  const rerender=()=>window.fillPhotoArchive(el,p,pre);
  const cmp=el.querySelector(".pp-cmp"); if(cmp&&cmp.querySelector(".hd")) bindCmp(cmp);
  el.querySelectorAll(".pp-rail .pp-chip.on").forEach(c=>{ try{ c.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"}); }catch(_){}});
  el.querySelectorAll("[data-pose]").forEach(b=>b.onclick=()=>{ S.ppPose=b.dataset.pose; el.querySelectorAll("[data-pose]").forEach(x=>x.classList.toggle("on",x===b)); });
  el.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{ sel[b.closest("[data-rail]").dataset.rail]=b.dataset.pick;
    if(sel.a===sel.b) sel[b.closest("[data-rail]").dataset.rail==="a"?"b":"a"]=null; rerender(); });
  el.querySelectorAll("[data-star]").forEach(b=>b.onclick=()=>{ const x=photos.find(v=>v.id===b.dataset.star); if(!x) return;
    x.starred=!x.starred; save(); window.toast&&toast(x.starred?"⭐ اتعلّمت من أفضل صورك":"اتشالت من المميزة"); rerender(); });
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ if(!b.classList.contains("arm")){ b.classList.add("arm"); b.textContent="تأكيد؟"; setTimeout(()=>{ b.classList.remove("arm"); b.textContent="✕"; },2600); return; }
    const i=photos.findIndex(v=>v.id===b.dataset.del); if(i>-1) photos.splice(i,1); save(); window.toast&&toast("اتمسحت الصورة"); rerender(); });
  const file=el.querySelector("#ppFile");
  el.querySelector("#ppAdd").onclick=()=>file.click();
  file.onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
    const btn=el.querySelector("#ppAdd"); btn.disabled=true; btn.textContent="جارٍ الإضافة…";
    try{ const img=await resize(f);
      photos.push({id:"pp"+Date.now().toString(36), date:new Date().toISOString().slice(0,10), pose:S.ppPose||"front", img, starred:false});
      if(save()){ window.toast&&toast("✓ اتضافت الصورة لأرشيفك"); rerender(); } }
    catch(_){ window.toast&&toast("تعذرت إضافة الصورة"); }
    btn.disabled=false; btn.textContent="＋ ضيف صورة"; };
};
})();
