/* ======================================================================
   MOFIT home-calm — calmer client home: one hero focus on top, the rest
   grouped into three animated drawers (تقدّمك / جسمك وصحتك / الكوتش والاشتراك).
   Pure re-arrangement: wraps viewHome after it renders and moves the
   existing cards by id, so every card, chart and async fill keeps working
   exactly as before. Open/closed state is remembered per client.
   ====================================================================== */
(function(){
  "use strict";
  if(window.__homeCalm) return; window.__homeCalm=1;

  var GROUPS=[
    {key:"progress", icon:"📈", title:"تقدّمك",           sub:"ملخص الأسبوع · الالتزام · الفشل العضلي", ids:["hRecap","hFlame","hStreak","hH","hF"]},
    {key:"body",     icon:"🧬", title:"جسمك وصحتك",       sub:"الوزن · القياسات · القوة · النبض",       ids:["hB","hGoal","hComp","hStr","hLoad","hHr","hHealth","hCardio"]},
    {key:"coach",    icon:"🎧", title:"الكوتش والاشتراك", sub:"اشتراكك ومميزاتك مع الكوتش",             ids:["ghHome"]}
  ];
  var store={
    get:function(k){ try{return localStorage.getItem("mhc_"+k)==="1";}catch(e){ return false; } },
    set:function(k,v){ try{ localStorage.setItem("mhc_"+k, v?"1":"0"); }catch(e){} }
  };
  function filled(n){ return !!n && n.innerHTML.replace(/\s+/g,"")!=="" && !n.classList.contains("hidden"); }
  function refreshDrawer(dr){
    var box=dr.querySelector(".hc-in"); if(!box) return;
    var any=false;
    for(var i=0;i<box.children.length;i++){ if(filled(box.children[i])){ any=true; break; } }
    dr.classList.toggle("hc-empty", !any);
  }
  function makeDrawer(g){
    var dr=document.createElement("section");
    dr.className="hc-drawer"; dr.dataset.k=g.key;
    dr.innerHTML='<button class="hc-head" type="button" aria-expanded="false">'
      +'<span class="hc-ic" aria-hidden="true">'+g.icon+'</span>'
      +'<span class="hc-t"><b>'+g.title+'</b><small>'+g.sub+'</small></span>'
      +'<span class="hc-chev" aria-hidden="true">▾</span></button>'
      +'<div class="hc-body"><div class="hc-in"></div></div>';
    var head=dr.querySelector(".hc-head");
    head.addEventListener("click",function(){
      var open=dr.classList.toggle("open");
      head.setAttribute("aria-expanded", open?"true":"false");
      store.set(g.key, open);
    });
    if(store.get(g.key)){ dr.classList.add("open"); head.setAttribute("aria-expanded","true"); }
    var box=dr.querySelector(".hc-in");
    var t=null;
    var mo=new MutationObserver(function(){
      if(t) return;
      t=setTimeout(function(){ t=null; refreshDrawer(dr); },120);
    });
    mo.observe(box,{childList:true,subtree:true,characterData:true});
    return dr;
  }
  function layout(root){
    if(!root || root.dataset.hcBusy==="1") return;
    root.dataset.hcBusy="1";
    try{
      [].forEach.call(root.querySelectorAll(".hsec"),function(h){ h.remove(); });
      var anchor=root.querySelector("#hSteps")||root.querySelector("#hN");
      GROUPS.forEach(function(g){
        var dr=root.querySelector('.hc-drawer[data-k="'+g.key+'"]')||makeDrawer(g);
        var box=dr.querySelector(".hc-in");
        g.ids.forEach(function(id){
          var n=root.querySelector("#"+id);
          if(n && n.parentElement!==box) box.appendChild(n);
        });
        if(anchor){ anchor.insertAdjacentElement("afterend",dr); anchor=dr; }
        else{ root.appendChild(dr); }
        refreshDrawer(dr);
      });
    } finally { root.dataset.hcBusy="0"; }
  }
  var orig=window.viewHome;
  if(typeof orig!=="function") return;
  window.viewHome=function(el){
    var r=orig.apply(this,arguments);
    try{ layout(el); }catch(e){ try{ console.warn("home-calm",e); }catch(_){ } }
    return r;
  };
})();
