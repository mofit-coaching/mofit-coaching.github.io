/* MOFIT animated progress rings: every ring() on the site fills from empty on a spring,
   the number counts up to the real value, and a ring that hits 100% pulses once.
   Same markup, same values as core.js ring(); only the motion is new. */
(function(){
  if(window.__fxRings||typeof window.ring!=="function") return; window.__fxRings=1;
  const RM=matchMedia("(prefers-reduced-motion: reduce)");
  let uid=0;
  window.ring=function(value,max,o){
    o=o||{}; const size=o.size==null?120:o.size, stroke=o.stroke==null?12:o.stroke, color=o.color||"#F97316",
      track=o.track||"#E2E8F0", label=o.label==null?"":o.label, sub=o.sub||"", tc=o.textColor||"#0F172A";
    const r=(size-stroke)/2, c=2*Math.PI*r, p=max?Math.min(value/max,1):0, id="fxg"+(++uid);
    const to=c*(1-p);
    return `<svg class="fxr" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;overflow:visible" data-p="${p.toFixed(4)}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".62"/></linearGradient></defs>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle class="fxr-v" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${p>0?c:to}" data-to="${to}" data-c="${c}" transform="rotate(-90 ${size/2} ${size/2})"/>
    <text class="fxr-t" x="50%" y="${sub?"47%":"53%"}" text-anchor="middle" font-size="${size/5.2}" font-weight="800" fill="${tc}" direction="ltr">${label}</text>
    ${sub?`<text x="50%" y="66%" text-anchor="middle" font-size="${size/11}" fill="${tc==="#fff"?"#CBD5E1":"#64748B"}">${sub}</text>`:""}</svg>`;
  };
  function spring(z,w,n=40){ const wd=w*Math.sqrt(1-z*z),a=[]; for(let i=0;i<=n;i++){ const t=i/n,e=Math.exp(-z*w*t); a.push(i===n?1:1-e*(Math.cos(wd*t)+z*w/wd*Math.sin(wd*t))); } return a; }
  const S=spring(.62,11);
  const ease=k=>{ const x=Math.min(Math.max(k,0),1)*(S.length-1), i=Math.floor(x); return i>=S.length-1?1:S[i]+(S[i+1]-S[i])*(x-i); };
  function run(svg){
    if(svg._fx) return; svg._fx=1;
    const v=svg.querySelector(".fxr-v"), t=svg.querySelector(".fxr-t"); if(!v) return;
    const to=+v.dataset.to, c=+v.dataset.c, p=+svg.dataset.p, txt=t?t.textContent:"";
    const num=/^\d+(\.\d+)?$/.test(txt.trim())?parseFloat(txt):null, dec=num!==null&&txt.includes(".")?(txt.split(".")[1]||"").length:0;
    if(RM.matches||p===0){ v.setAttribute("stroke-dashoffset",to); return; }
    const d=1100, t0=performance.now()+120;
    if(num!==null&&t) t.textContent=(0).toFixed(dec);
    (function f(now){
      const k=(now-t0)/d; if(k<0) return requestAnimationFrame(f);
      const e=ease(k);
      v.setAttribute("stroke-dashoffset",Math.max(0,c-(c-to)*e));
      if(num!==null&&t) t.textContent=(num*Math.min(1,e)).toFixed(dec);
      if(k<1) requestAnimationFrame(f);
      else{ v.setAttribute("stroke-dashoffset",to); if(t) t.textContent=txt;
        if(p>=1&&v.animate) v.animate([{filter:"drop-shadow(0 0 0 transparent)"},{filter:"drop-shadow(0 0 10px "+"#FFB020"+")"},{filter:"drop-shadow(0 0 0 transparent)"}],{duration:900}); }
    })(performance.now());
  }
  function scan(n){ if(n.nodeType!==1) return; if(n.matches&&n.matches("svg.fxr")) run(n); n.querySelectorAll&&n.querySelectorAll("svg.fxr").forEach(run); }
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.body,{childList:true,subtree:true});
  scan(document.body);
})();
