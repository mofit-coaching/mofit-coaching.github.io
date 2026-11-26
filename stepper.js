/* MOFIT stepper v2: +/- buttons on reps, weight and RIR in the workout screen.
   Tempo blocks (نزول/توقف تحت/طلوع/توقف فوق) are display-only: they show the program tempo.
   Input UI only: never touches program data. */
(function(){
  if(window.__stp) return; window.__stp=1;
  var css=
  '.set{grid-template-columns:28px 1fr 1fr 1fr 40px!important;align-items:start!important}'+
  '.set-head{grid-template-columns:28px 1fr 1fr 1fr 40px!important}.set-head span:nth-child(6){display:none}'+
  '.set .no{margin-top:8px}'+
  '.set .fail{grid-column:5;grid-row:1;align-self:start;min-height:42px}'+
  '.set .more{grid-column:5;grid-row:1;align-self:end;min-height:34px}'+
  '.stp{direction:ltr;display:grid;grid-template-columns:1fr 1fr;gap:4px}'+
  '.stp>input,.stp>select{grid-column:1/-1;width:100%;min-width:0;box-sizing:border-box;font-size:1.05rem;transition:transform .15s,box-shadow .15s}'+
  '.stp>input.pop,.stp>select.pop{animation:stppop .22s ease}'+
  '@keyframes stppop{40%{transform:scale(1.12);box-shadow:0 0 0 3px rgba(255,107,26,.55)}}'+
  '.stp button{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer;border:1px solid rgba(255,255,255,.14);color:#fff;font:800 .95rem/1 Outfit,system-ui,sans-serif;transition:transform .08s,background .15s}'+
  '.stp button{min-height:26px;border-radius:8px;background:linear-gradient(180deg,#1E2A47,#16203A);padding:0}'+
  '.stp button.plus{background:linear-gradient(180deg,#FF8A3D,#FF6B1A);border-color:transparent}'+
  '.stp button:active,.stp button.hold{transform:scale(.88)}'+
  '.ex-b .tempo{gap:6px}'+
  '.ex-b .tempo>div{background:linear-gradient(180deg,#1B2744,#131C33)!important;border:1px solid rgba(255,255,255,.12);border-radius:14px!important;padding:6px 3px 6px!important;color:#C7D2EA!important;font-size:.72rem;font-weight:700;animation:none!important;display:flex;flex-direction:column;align-items:center;gap:3px}'+
  '.ex-b .tempo>div b{color:#fff!important;font-size:1.45rem!important;line-height:1}'+
  '@media(prefers-reduced-motion:reduce){.stp>input.pop,.stp>select.pop{animation:none}.stp button{transition:none}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  var rm=function(){return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches};
  var buzz=function(n){try{navigator.vibrate&&navigator.vibrate(n||8)}catch(e){}};
  var pop=function(el){ if(rm()) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

  /* press and hold: first step now, then repeats, speeding up */
  function hold(btn,fn){
    var t1,t2,n=0;
    function stop(){ clearTimeout(t1); clearInterval(t2); btn.classList.remove('hold'); n=0; }
    function tick(){ fn(n>12?5:1); n++; }
    btn.addEventListener('pointerdown',function(e){ e.preventDefault(); btn.classList.add('hold'); try{btn.setPointerCapture(e.pointerId)}catch(x){} tick(); t1=setTimeout(function(){ t2=setInterval(tick,n>8?60:110); },380); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(ev){btn.addEventListener(ev,stop)});
    btn.addEventListener('contextmenu',function(e){e.preventDefault()});
    btn.addEventListener('click',function(e){e.preventDefault()});
  }
  function mk(cls,txt,label){ var b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=txt; b.setAttribute('aria-label',label); return b; }
  var r2=function(v){return Math.round(v*100)/100};

  function wrapSet(row){
    var reps=row.querySelector('input[data-k="reps"]'), w=row.querySelector('input[data-k="weight"]'), rir=row.querySelector('select[data-k="rir"]');
    if(!reps||!w||!rir) return;
    function build(ctl,calc){
      var box=document.createElement('div'); box.className='stp'; ctl.parentNode.insertBefore(box,ctl); box.appendChild(ctl);
      var minus=mk('minus','−','−'), plus=mk('plus','+','+'); box.appendChild(minus); box.appendChild(plus);
      var timer;
      function commit(){ clearTimeout(timer); timer=setTimeout(function(){ ctl.dispatchEvent(new Event('change',{bubbles:true})); },700); }
      function go(dir){ return function(mult){ var nv=calc(dir,mult); if(nv===null) return; ctl.value=nv; pop(ctl); buzz(6); commit(); }; }
      hold(minus,go(-1)); hold(plus,go(1));
      ctl.addEventListener('change',function(){ clearTimeout(timer); });
    }
    build(reps,function(d){ var v=parseInt(reps.value,10); if(isNaN(v)) return String(parseInt(reps.placeholder,10)||10); return String(Math.max(0,Math.min(100,v+d))); });
    build(w,function(d,m){ var cur=parseFloat(String(w.value).replace(',','.')); var step=(m>1?5:2.5); if(isNaN(cur)){ var ph=parseFloat(String(w.placeholder).replace(',','.')); if(isNaN(ph)) ph=0; return String(r2(Math.max(0,ph))); } return String(r2(Math.max(0,Math.min(999,cur+d*step)))); });
    build(rir,function(d){ var v=rir.value===''?NaN:parseInt(rir.value,10); if(isNaN(v)) return '2'; v=Math.max(0,Math.min(5,v+d)); return String(v); });
  }

  function scan(root){
    [].forEach.call(root.querySelectorAll('.set:not([data-stp])'),function(r){ r.setAttribute('data-stp',1); wrapSet(r); });
  }
  function start(){ var m=document.getElementById('main')||document.body; scan(m);
    var busy=false; new MutationObserver(function(){ if(busy) return; busy=true; requestAnimationFrame(function(){ busy=false; scan(m); }); }).observe(m,{childList:true,subtree:true}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
