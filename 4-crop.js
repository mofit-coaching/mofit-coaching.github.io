/* Mofit photo crop: before a progress / pose photo is uploaded, show a crop
   sheet (drag to move, pinch or slider to zoom, ratio chips). The cropped
   JPEG replaces the chosen file and the app's own upload code runs as
   before. "استخدم الأصلية" skips the crop. Chat photos are not touched. */
(function(){
const SKIP="#chatFile,[data-an=photoinp]";
const CSS=`
#crpBg{position:fixed;inset:0;z-index:2000;background:rgba(5,10,20,.88);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:12px;animation:crpIn .25s ease both;direction:rtl;font-family:"IBM Plex Sans Arabic","Cairo",system-ui,sans-serif;color:#fff}
@keyframes crpIn{from{opacity:0;transform:scale(.97)}}
#crpBox{position:relative;width:min(92vw,420px);aspect-ratio:4/5;overflow:hidden;border-radius:18px;background:#000;touch-action:none;box-shadow:0 0 0 2px rgba(255,255,255,.25),0 20px 50px -10px #000}
#crpBox canvas{position:absolute;inset:0;width:100%;height:100%}
#crpBox:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 33.2%,rgba(255,255,255,.22) 33.3% 33.5%,transparent 33.6% 66.5%,rgba(255,255,255,.22) 66.6% 66.8%,transparent 66.9%),linear-gradient(180deg,transparent 33.2%,rgba(255,255,255,.22) 33.3% 33.5%,transparent 33.6% 66.5%,rgba(255,255,255,.22) 66.6% 66.8%,transparent 66.9%)}
#crpBg .chips{display:flex;gap:8px}
#crpBg .chips button{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;padding:7px 14px;border-radius:99px;font:inherit;font-size:.85rem}
#crpBg .chips button.on{background:linear-gradient(135deg,#FF6B1A,#FFA24D);border-color:transparent}
#crpBg input[type=range]{width:min(80vw,320px);accent-color:#FF6B1A}
#crpBg .act{display:flex;gap:10px;width:min(92vw,420px)}
#crpBg .act button{flex:1;border:0;border-radius:14px;padding:13px;font:inherit;font-weight:700;font-size:.95rem}
#crpBg .go{background:linear-gradient(135deg,#FF6B1A,#FFA24D);color:#fff}
#crpBg .sk{background:rgba(255,255,255,.12);color:#fff}
#crpBg .x{background:transparent;color:#cbd5e1;flex:.6!important}`;
const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

function loadImg(file){ return new Promise((res,rej)=>{ const u=URL.createObjectURL(file), im=new Image();
  im.onload=()=>res({im,u}); im.onerror=()=>{URL.revokeObjectURL(u);rej();}; im.src=u; }); }

function open(file){ return new Promise(async resolve=>{
  let L; try{ L=await loadImg(file); }catch(e){ return resolve(file); }
  const im=L.im, nw=im.naturalWidth, nh=im.naturalHeight;
  const bg=document.createElement("div"); bg.id="crpBg";
  bg.innerHTML=`<div class="chips"><button data-r="0.8" class="on">4:5</button><button data-r="1">1:1</button><button data-r="0.75">3:4</button></div>
    <div id="crpBox"><canvas></canvas></div><input type="range" min="1" max="4" step="0.01" value="1" aria-label="تكبير">
    <div class="act"><button class="x">إلغاء</button><button class="sk">استخدم الأصلية</button><button class="go">قص واستخدم ✂️</button></div>`;
  document.body.appendChild(bg);
  const box=bg.querySelector("#crpBox"), cv=bg.querySelector("canvas"), rg=bg.querySelector("input"), g=cv.getContext("2d");
  let ratio=.8, z=1, cx=nw/2, cy=nh/2, W=0,H=0;
  function layout(){ const w=Math.min(innerWidth*.92,420); W=Math.round(w*2); H=Math.round(w/ratio*2);
    box.style.aspectRatio=(1/ratio)<0?"":`${ratio}`; box.style.width=Math.min(innerWidth*.92,420,(innerHeight-260)*ratio)+"px";
    const r=box.getBoundingClientRect(); W=Math.round(r.width*2); H=Math.round(r.height*2); cv.width=W; cv.height=H; draw(); }
  const base=()=>Math.max(W/nw,H/nh);                       // cover scale
  function clamp(){ const s=base()*z, vw=W/s, vh=H/s; cx=Math.max(vw/2,Math.min(nw-vw/2,cx)); cy=Math.max(vh/2,Math.min(nh-vh/2,cy)); }
  function draw(){ clamp(); const s=base()*z; g.fillStyle="#000"; g.fillRect(0,0,W,H); g.drawImage(im,cx-W/s/2,cy-H/s/2,W/s,H/s,0,0,W,H); }
  bg.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>{ bg.querySelectorAll(".chips button").forEach(x=>x.classList.remove("on")); b.classList.add("on"); ratio=+b.dataset.r; box.style.aspectRatio=ratio; layout(); });
  rg.oninput=()=>{ z=+rg.value; draw(); };
  const pts=new Map(); let lastD=0;
  box.addEventListener("pointerdown",e=>{ box.setPointerCapture(e.pointerId); pts.set(e.pointerId,[e.clientX,e.clientY]); lastD=0; });
  box.addEventListener("pointermove",e=>{ if(!pts.has(e.pointerId)) return; const p=pts.get(e.pointerId), s=base()*z, k=W/box.getBoundingClientRect().width;
    if(pts.size===1){ cx-=(e.clientX-p[0])*k/s; cy-=(e.clientY-p[1])*k/s; }
    pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2){ const [a,b]=[...pts.values()], d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(lastD) { z=Math.max(1,Math.min(4,z*d/lastD)); rg.value=z; } lastD=d; }
    draw(); });
  ["pointerup","pointercancel"].forEach(t=>box.addEventListener(t,e=>{ pts.delete(e.pointerId); lastD=0; }));
  box.addEventListener("wheel",e=>{ e.preventDefault(); z=Math.max(1,Math.min(4,z*(e.deltaY<0?1.06:.94))); rg.value=z; draw(); },{passive:false});
  const done=f=>{ URL.revokeObjectURL(L.u); bg.remove(); removeEventListener("resize",layout); resolve(f); };
  bg.querySelector(".x").onclick=()=>done(null);
  bg.querySelector(".sk").onclick=()=>done(file);
  bg.querySelector(".go").onclick=()=>{ const s=base()*z, vw=W/s, vh=H/s;
    const mx=1600, k=Math.min(1,mx/Math.max(vw,vh)), o=document.createElement("canvas"); o.width=Math.round(vw*k); o.height=Math.round(vh*k);
    o.getContext("2d").drawImage(im,cx-vw/2,cy-vh/2,vw,vh,0,0,o.width,o.height);
    o.toBlob(b=>done(b?new File([b],(file.name||"photo").replace(/\.\w+$/,"")+"-crop.jpg",{type:"image/jpeg",lastModified:Date.now()}):file),"image/jpeg",.9); };
  addEventListener("resize",layout); layout();
}); }

document.addEventListener("change",async e=>{
  const inp=e.target;
  if(!inp||inp.type!=="file"||e._crp||inp.matches(SKIP)) return;
  if(!/^image\//.test(inp.accept||"")||!inp.files||inp.files.length!==1) return;
  const f=inp.files[0]; if(!/^image\/(jpeg|png|webp)/.test(f.type)) return;   // leave HEIC etc. to the app
  e.stopImmediatePropagation(); e.preventDefault();
  const out=await open(f);
  if(!out){ inp.value=""; return; }
  try{ const dt=new DataTransfer(); dt.items.add(out); inp.files=dt.files; }catch(err){ /* very old browser: fall through with original */ }
  const ev=new Event("change",{bubbles:true}); ev._crp=1; inp.dispatchEvent(ev);
},true);
})();
