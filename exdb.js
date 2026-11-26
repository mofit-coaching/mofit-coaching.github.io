/* MOFIT exercise form library: photos (free-exercise-db, public domain) + Arabic form cues.
   Usage: mofitExdb.open(name). Button added by views.js on each exercise card. */
(function(){
  const css=`.exdb-ph{position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(145deg,#1c2340,#131832);border:1px solid rgba(255,255,255,.08);margin-bottom:12px}
  .exdb-ph img{display:block;width:100%;aspect-ratio:1;object-fit:contain;opacity:0;transition:opacity .45s ease;position:absolute;inset:0}
  .exdb-ph img.on{opacity:1;position:relative}
  .exdb-dots{position:absolute;bottom:8px;left:0;right:0;display:flex;gap:6px;justify-content:center;z-index:2}
  .exdb-dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.35);transition:background .3s}
  .exdb-dots i.on{background:#FDBA74}
  .exdb-steps{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
  .exdb-steps li{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px 12px;font-size:.85rem;line-height:1.7;animation:exdbIn .35s ease both}
  .exdb-steps li:nth-child(2){animation-delay:.06s}.exdb-steps li:nth-child(3){animation-delay:.12s}.exdb-steps li:nth-child(4){animation-delay:.18s}.exdb-steps li:nth-child(5){animation-delay:.24s}
  .exdb-steps b{flex:0 0 22px;height:22px;border-radius:8px;background:linear-gradient(135deg,#F97316,#FDBA74);color:#131832;display:grid;place-items:center;font-size:.72rem;margin-top:2px}
  @keyframes exdbIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`;
  let timer=null;
  function stop(){ if(timer){ clearInterval(timer); timer=null; } }
  function lookup(name){
    if(!window.EXDB||!name) return null;
    const k=String(name).trim().toUpperCase();
    return EXDB[k]||EXDB[k.replace(/\s+/g," ")]||null;
  }
  window.mofitExdb={
    has:n=>!!lookup(n),
    open(name){
      const e=lookup(name);
      if(!e){
        openSheet(`<div class="between" style="margin-bottom:10px"><b>📸 الأداء</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
        <div style="text-align:center;padding:24px 8px;color:var(--muted,#9aa3c7)"><div style="font-size:2rem;margin-bottom:8px">🏋️</div>مكتبة الصور لسه مش فيها التمرين ده — اسأل كابتن محمد وهيوضحهولك.</div>`);
        return;
      }
      const imgs=[...Array(Math.min(2,e.n||0))].map((_,i)=>`<img src="exdb/img/${e.id}_${i}.jpg" alt="" class="${i===0?'on':''}" ${i>0?'loading="lazy"':''}>`).join("");
      const body=openSheet(`<div class="between" style="margin-bottom:10px"><b>${esc(name)}</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
        ${imgs?`<div class="exdb-ph">${imgs}<div class="exdb-dots">${imgs&&e.n>1?'<i class="on"></i><i></i>':''}</div></div>`:""}
        <ol class="exdb-steps">${e.s.map((s,i)=>`<li><b>${i+1}</b><span>${esc(s)}</span></li>`).join("")}</ol>`);
      stop();
      const frames=body.querySelectorAll(".exdb-ph img");
      if(frames.length>1){
        let cur=0; const dots=body.querySelectorAll(".exdb-dots i");
        timer=setInterval(()=>{
          if(!document.body.contains(frames[0])){ stop(); return; }
          frames[cur].classList.remove("on"); dots[cur]&&dots[cur].classList.remove("on");
          cur=(cur+1)%frames.length;
          frames[cur].classList.add("on"); dots[cur]&&dots[cur].classList.add("on");
        },1100);
      }
    },
    inject(){ const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st); }
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mofitExdb.inject); else mofitExdb.inject();
})();
