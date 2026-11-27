/* MOFIT Skeleton Scroll: a glowing skeleton on the landing page that moves through lifts as you scroll.
   Pure SVG + scroll progress, no images. Poses are interpolated between keyframes, and the whole thing
   switches off for reduced-motion users or when the landing page is not on screen. */
(function(){
if(window.__mofitSkeleton) return; window.__mofitSkeleton=1;

/* joint angles in degrees. 0 = limb pointing down. Positive = forward (screen right is forward here). */
const POSES=[
  {n:"وقوف",   sh:0,  el:8,  hip:0,   kn:0,   bar:0,  barY:0,  lean:0},
  {n:"سكوات",  sh:-64, el:74, hip:-34, kn:64,  bar:0,  barY:-46, lean:16},
  {n:"سحب",    sh:6,  el:6,  hip:-56, kn:22,  bar:0,  barY:52, lean:42},
  {n:"ضغط فوق",sh:-158,el:-16,hip:0,  kn:4,   bar:0,  barY:-96, lean:0},
  {n:"وقوف",   sh:0,  el:8,  hip:0,   kn:0,   bar:0,  barY:0,  lean:0}
];
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

function poseAt(p){
  const n=POSES.length-1, x=Math.max(0,Math.min(.9999,p))*n, i=Math.floor(x), t=ease(x-i);
  const a=POSES[i], b=POSES[i+1];
  const o={}; ["sh","el","hip","kn","barY","lean"].forEach(k=>o[k]=lerp(a[k],b[k],t));
  o.name=t<.5?a.n:b.n;
  return o;
}
const BONE=(x1,y1,x2,y2,w)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#skG)" stroke-width="${w}" stroke-linecap="round"/>`;

function build(){
  const host=document.createElement("div");
  host.id="skelScroll";
  host.setAttribute("aria-hidden","true");
  host.innerHTML=`<svg viewBox="0 0 200 420" class="skel-svg">
  <defs>
    <linearGradient id="skG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A8"/><stop offset="1" stop-color="#FF6B1A"/></linearGradient>
    <filter id="skGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g class="skel-all" filter="url(#skGlow)">
    <g class="sk-torso">
      <circle class="sk-head" cx="100" cy="52" r="21" fill="none" stroke="url(#skG)" stroke-width="4"/>
      <path class="sk-jaw" d="M88 62 q12 10 24 0" fill="none" stroke="url(#skG)" stroke-width="3" stroke-linecap="round"/>
      <path class="sk-spine" d="M100 74 V196" stroke="url(#skG)" stroke-width="4" stroke-linecap="round"/>
      <path class="sk-ribs" d="M84 96 q16 -6 32 0 M82 112 q18 -6 36 0 M84 128 q16 -6 32 0 M88 144 q12 -5 24 0" fill="none" stroke="url(#skG)" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      <path class="sk-pelvis" d="M84 196 q16 12 32 0" fill="none" stroke="url(#skG)" stroke-width="4" stroke-linecap="round"/>
    </g>
    <g class="sk-armL">${BONE(96,100,0,0,4)}</g>
    <g class="sk-armR">${BONE(104,100,0,0,4)}</g>
    <g class="sk-legL">${BONE(94,196,0,0,5)}</g>
    <g class="sk-legR">${BONE(106,196,0,0,5)}</g>
    <g class="sk-bar"><line x1="42" y1="0" x2="158" y2="0" stroke="#FFB347" stroke-width="5" stroke-linecap="round"/><circle cx="42" cy="0" r="9" fill="none" stroke="#FF6B1A" stroke-width="4"/><circle cx="158" cy="0" r="9" fill="none" stroke="#FF6B1A" stroke-width="4"/></g>
  </g>
  <text class="sk-label" x="100" y="414" text-anchor="middle">وقوف</text>
  </svg>`;
  return host;
}

/* limb maths: each limb is two bones, drawn from its joint with rotation applied to the group */
function setLimb(g, x, y, len, a1, a2){
  const [b1,b2]=g.querySelectorAll("line");
  const r=a1*Math.PI/180, r2=(a1+a2)*Math.PI/180;
  const x1=x+Math.sin(r)*len, y1=y+Math.cos(r)*len;
  const x2=x1+Math.sin(r2)*len*0.92, y2=y1+Math.cos(r2)*len*0.92;
  b1.setAttribute("x1",x); b1.setAttribute("y1",y); b1.setAttribute("x2",x1); b1.setAttribute("y2",y1);
  b2.setAttribute("x1",x1); b2.setAttribute("y1",y1); b2.setAttribute("x2",x2); b2.setAttribute("y2",y2);
}

function render(host, p){
  const s=poseAt(p);
  const svg=host.querySelector(".skel-svg");
  const torso=host.querySelector(".sk-torso");
  torso.setAttribute("transform",`rotate(${s.lean} 100 196)`);
  setLimb(host.querySelector(".sk-armL"), 96, 100, 46, s.sh, s.el);
  setLimb(host.querySelector(".sk-armR"), 104, 100, 46, s.sh+6, s.el);
  setLimb(host.querySelector(".sk-legL"), 94, 196, 54, s.hip, s.kn);
  setLimb(host.querySelector(".sk-legR"), 106, 196, 54, s.hip+4, s.kn);
  const bar=host.querySelector(".sk-bar");
  bar.setAttribute("transform",`translate(0 ${100+s.barY})`);
  const lab=host.querySelector(".sk-label");
  if(lab) lab.textContent=s.name;
  svg.dataset.pose=s.name;
}

function start(){
  const landing=document.getElementById("loginView");
  if(!landing) return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let host=document.getElementById("skelScroll");
  if(!host){ host=build(); document.body.appendChild(host); }
  let raf=0;
  const tick=()=>{
    raf=0;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const p=Math.min(1,Math.max(0,scrollY/max));
    render(host,p*1.0);
    host.classList.toggle("skel-on", p>0.02);
  };
  const onScroll=()=>{ if(!raf) raf=requestAnimationFrame(tick); };
  addEventListener("scroll",onScroll,{passive:true});
  addEventListener("resize",onScroll,{passive:true});
  tick();
  /* keep it only while the landing page is the visible screen */
  const sync=()=>{ const app=document.getElementById("appView"); const on=!(app&&!app.classList.contains("hidden")); host.style.display=on?"":"none"; };
  sync(); setInterval(sync,1200);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
window.mofitSkeleton={start,poseAt};
})();
