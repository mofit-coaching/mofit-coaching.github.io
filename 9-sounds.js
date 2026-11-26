/* Mofit sounds: soft rest-timer chime, last-3-seconds ticks, badge and win
   fanfares. Built with WebAudio (no audio files). One 🔊/🔇 switch, saved on
   the device (localStorage "mofit_sound", default on). Replaces the old flat
   beep. Vibration is kept. */
(function(){
let ctx=null;
const on=()=>localStorage.getItem("mofit_sound")!=="0";
function ac(){ try{ ctx=ctx||new (window.AudioContext||window.webkitAudioContext)(); if(ctx.state==="suspended") ctx.resume(); }catch(e){} return ctx; }
function tone(f,t0,d,type,vol){ const c=ac(); if(!c) return;
  const o=c.createOscillator(), g=c.createGain(), t=c.currentTime+t0;
  o.type=type||"sine"; o.frequency.setValueAtTime(f,t); o.connect(g); g.connect(c.destination);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol||.2,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.start(t); o.stop(t+d+.05); }
const play={
  rest(){ [[784,0],[988,.16],[1319,.32]].forEach(([f,t])=>{ tone(f,t,.45,"sine",.22); tone(f*2,t,.3,"sine",.05); }); },
  tick(){ tone(1000,0,.09,"square",.07); },
  badge(){ [523,659,784,1047].forEach((f,i)=>tone(f,i*.09,.4,"triangle",.2)); tone(1568,.4,.6,"sine",.12); },
  win(){ [523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.11,.55,"triangle",.22)); [784,1047,1568].forEach(f=>tone(f,.6,.9,"sine",.14)); },
  mini(){ tone(880,0,.18,"sine",.16); tone(1175,.1,.28,"sine",.16); }
};
window.mofitSound=Object.assign({play:k=>{ if(on()&&play[k]) play[k](); },toggle(){ localStorage.setItem("mofit_sound",on()?"0":"1"); return on(); },enabled:on});
// browsers only allow sound after a touch: unlock once
const unlock=()=>{ ac(); removeEventListener("pointerdown",unlock,true); };
addEventListener("pointerdown",unlock,true);
// replace the old beep (global function in core.js)
window.beep=function(){ mofitSound.play("rest"); try{ navigator.vibrate&&navigator.vibrate([300,150,300]); }catch(e){} };
// badge / win / mini celebration sounds
function hook(){ const c=window.mofitCelebrate; if(!c||c._snd) return false; c._snd=1;
  ["win","badge","mini"].forEach(k=>{ const f=c[k]; c[k]=function(){ mofitSound.play(k); return f.apply(this,arguments); }; }); return true; }
if(!hook()) addEventListener("load",hook);
// ticks for the last 3 seconds of the rest timer (reads T from core.js)
let lastTick=-1;
setInterval(()=>{ try{ if(!T.iv) { lastTick=-1; return; }
  const left=Math.ceil((T.end-Date.now())/1000);
  if(left>=1&&left<=3&&left!==lastTick){ lastTick=left; mofitSound.play("tick"); } if(left>3) lastTick=-1; }catch(e){} },200);
// sound switch inside the timer bar
const tm=document.getElementById("timer");
if(tm){ const css=document.createElement("style");
  css.textContent="#timer .snd{border:0;background:transparent;font-size:1.05rem;padding:4px 6px;cursor:pointer;color:inherit}";
  document.head.appendChild(css);
  const add=()=>{ if(tm.querySelector(".snd")||!tm.querySelector(".t-info")) return;
    const b=document.createElement("button"); b.className="snd"; b.type="button"; b.setAttribute("aria-label","الصوت");
    b.textContent=on()?"🔊":"🔇";
    b.onclick=()=>{ const v=mofitSound.toggle(); b.textContent=v?"🔊":"🔇"; if(v) mofitSound.play("tick"); };
    tm.querySelector(".t-info").after(b); };
  new MutationObserver(add).observe(tm,{childList:true}); add(); }
})();
