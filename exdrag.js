/* ======================================================================
   MOFIT — drag-to-reorder exercises in the coach program editor (exd-*).

   SortableJS is already loaded in index.html. This file only watches for
   the coach's manual program editor (#pList, rendered by coach.js
   setupProgram), injects a grip on each exercise card, and makes the
   cards draggable. The new order is saved to program_exercises.position.

   - Coach screen only: never runs for clients, never touches the saved
     program templates or the coach's original template.
   - The ▲▼ buttons stay exactly as they are (accessibility fallback).
   - If SortableJS fails to load, nothing changes and the buttons keep
     working.
   ====================================================================== */
(function(){
  const css=`
  .exd-grip{display:inline-grid;place-items:center;flex:none;width:34px;height:34px;margin-inline-end:2px;
    border-radius:10px;font-size:1.15rem;color:var(--slate,#64748B);cursor:grab;
    background:var(--soft2,#F1F5F9);border:1.5px dashed var(--soft,#E2E8F0);
    touch-action:none;user-select:none;-webkit-user-select:none;transition:transform .15s,box-shadow .15s,color .15s}
  .exd-grip:active{cursor:grabbing}
  .edit-ex:hover .exd-grip{color:var(--acc,#F97316);border-color:var(--acc-line,#FED7AA)}
  .exd-hint{display:flex;align-items:center;gap:8px;margin:2px 2px 10px;font-size:.78rem;font-weight:700;color:var(--slate,#64748B)}
  .exd-hint b{color:var(--acc,#F97316);font-size:1rem}
  .edit-ex.exd-ghost{opacity:.4;border-style:dashed;border-color:var(--acc,#F97316)}
  .edit-ex.exd-chosen{box-shadow:0 14px 30px -12px rgba(249,115,22,.45)}
  .edit-ex.exd-drag{transform:scale(1.02) rotate(.4deg)}
  @media(prefers-reduced-motion:reduce){.exd-grip,.edit-ex{transition:none}}`;
  const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

  /* current day's exercises in display order (same source + order coach.js renders) */
  const dayExs=()=>S.program.filter(e=>e.day_no===S.day).sort((a,b)=>(+a.position||0)-(+b.position||0));

  function tag(list){
    const exs=dayExs();
    [...list.children].forEach((el,i)=>{
      if(!el.classList.contains("edit-ex")) return;
      el.dataset.exdId=exs[i]?String(exs[i].id):"";
      if(!el.querySelector(".exd-grip")){
        const g=document.createElement("span");
        g.className="exd-grip"; g.textContent="⠿"; g.title="اسحب لإعادة الترتيب"; g.setAttribute("aria-label","اسحب لإعادة ترتيب التمرين");
        const head=el.querySelector(".between");
        head?head.prepend(g):el.prepend(g);
      }
    });
    if(!list.parentElement.querySelector(".exd-hint")){
      const h=document.createElement("p");
      h.className="exd-hint";
      h.innerHTML=`<b>⠿</b><span>اسحب أي تمرين من المقبض وحطّه مكانه — الترتيب الجديد بيتحفظ على طول</span>`;
      list.parentElement.insertBefore(h,list);
    }
  }

  async function persist(list){
    const ids=[...list.children].filter(el=>el.classList&&el.classList.contains("edit-ex")).map(el=>el.dataset.exdId).filter(Boolean);
    if(!ids.length) return;
    const exs=dayExs(), jobs=[];
    ids.forEach((id,i)=>{
      const ex=exs.find(e=>String(e.id)===id);
      if(ex&&+ex.position!==i){ ex.position=i; jobs.push(sb.from("program_exercises").update({position:i}).eq("id",ex.id)); }
    });
    if(!jobs.length) return;
    const res=await Promise.all(jobs);
    if(res.some(r=>r&&r.error)){ toast("حصلت مشكلة في حفظ الترتيب — راجع آخر ترتيب"); }
    else toast("✓ اتحفظ الترتيب الجديد");
    S.program.sort((x,y)=>x.day_no-y.day_no||(+x.position||0)-(+y.position||0));
    rerender();
  }

  /* rebuild the editor so numbers + ▲▼ state refresh (same as tapping the active day chip) */
  function rerender(){
    const chip=document.querySelector('#main .scroller .chip.on[data-d]');
    if(chip) chip.click();
  }

  let sortable=null;
  function init(list){
    if(!window.Sortable||typeof S==="undefined"||!S.me||S.me.role!=="coach"||!S.client) return;
    if(list.dataset.exdInit) return;
    if(!list.querySelector(".edit-ex")) return;
    list.dataset.exdInit="1";
    tag(list);
    sortable=Sortable.create(list,{
      handle:".exd-grip", animation:220, easing:"cubic-bezier(.2,.9,.2,1)",
      ghostClass:"exd-ghost", chosenClass:"exd-chosen", dragClass:"exd-drag",
      forceFallback:true, fallbackTolerance:4, fallbackOnBody:true,
      onEnd:e=>{ if(e.oldIndex!==e.newIndex) persist(list); }
    });
  }

  function scan(root){
    document.querySelectorAll("#pList:not([data-exd-init])").forEach(l=>{ try{ init(l); }catch(e){ console.warn("exdrag",e); } });
  }
  const mo=new MutationObserver(()=>scan());
  const start=()=>{ scan(); mo.observe(document.body,{childList:true,subtree:true}); };
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",start):start();
})();
