/* Coach shell (additive): marks the app as the coach's dashboard so coachshell.css can draw the
   right-side rail on wide screens, adds a 4th stat card to the inbox and a two-column inbox layout.
   Clients never get body.coach-shell. No DB access. */
(function(){
  const isCoach=()=>typeof S!=="undefined"&&S.me&&S.me.role==="coach";
  function mark(){
    document.body.classList.toggle("coach-shell",!!isCoach());
    if(!isCoach()) return;
    const nav=document.getElementById("nav");
    if(nav) nav.querySelectorAll("button").forEach(b=>{ const s=b.querySelector("span"); if(s&&!b.title) b.title=s.textContent.trim(); b.setAttribute("aria-label",(s?s.textContent:b.title||"").trim()); });
  }
  if(typeof render==="function"){
    const _r=render;
    render=function(){ const r=_r.apply(this,arguments); try{ mark(); const m=document.getElementById("main"); if(m) m.classList.toggle("inb-grid",isCoach()&&!S.client&&S.tab==="inbox"); }catch(_){ } return r; };
  }
  if(typeof viewInbox==="function"){
    const _v=viewInbox;
    viewInbox=async function(el){
      const r=await _v.apply(this,arguments);
      try{
        const st=el.querySelector(".inbst");
        if(st&&!st.classList.contains("cs4")){
          const C=S.coachClients||[], act=C.filter(c=>c.active).length;
          st.classList.add("cs4");
          st.insertAdjacentHTML("afterbegin",`<div class="stat"><div class="l">👥 عملاء مفعّلين</div><div class="v num">${act}</div><div class="s">من ${C.length}</div></div>`);
        }
      }catch(_){ }
      return r;
    };
  }
  /* sliding pill */
  let pill=null;
  function movePill(){
    if(!pill){ pill=document.createElement("div"); pill.id="csPill"; document.body.appendChild(pill); }
    const b=isCoach()&&document.querySelector("#nav button.on");
    if(!b||document.getElementById("appView")?.classList.contains("hidden")){ pill.classList.remove("on"); return; }
    const r=b.getBoundingClientRect(), first=!pill.classList.contains("on");
    if(first){ pill.style.transition="none"; }
    pill.style.top=r.top+"px"; pill.style.left=r.left+"px"; pill.style.width=r.width+"px"; pill.style.height=r.height+"px";
    if(first){ void pill.offsetWidth; pill.style.transition=""; }
    pill.classList.add("on");
  }
  /* count-up for stat numbers (only when the value changed, so re-renders stay calm) */
  const rm=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countUp(root){
    root.querySelectorAll(".inbst .v.num").forEach(el=>{
      const txt=el.textContent.trim(); if(!/^\d+$/.test(txt)) return;
      const key=(el.previousElementSibling?.textContent||"")+"|"+txt; S._cu=S._cu||{};
      const to=+txt; if(S._cu[key]||rm()||to===0){ S._cu[key]=1; return; } S._cu[key]=1;
      const t0=performance.now(), d=700; el.textContent="0";
      const f=t=>{ const k=Math.min(1,(t-t0)/d), e=1-Math.pow(1-k,3); el.textContent=String(Math.round(to*e)); if(k<1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
  }
  const _r2=render;
  render=function(){ const r=_r2.apply(this,arguments); try{ requestAnimationFrame(movePill); }catch(_){ } return r; };
  const _v2=viewInbox;
  viewInbox=async function(el){ const r=await _v2.apply(this,arguments); try{ countUp(el); }catch(_){ } return r; };
  window.addEventListener("resize",()=>{ if(pill){ pill.style.transition="none"; movePill(); void pill.offsetWidth; pill.style.transition=""; } });
  document.addEventListener("DOMContentLoaded",mark);
})();
