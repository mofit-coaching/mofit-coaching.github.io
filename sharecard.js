/* Mofit share card: branded animated progress clip (canvas + MediaRecorder, PNG fallback). */
function _scSetup(d){
  const W=1080,H=1350,cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const x=cv.getContext("2d");
  const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();};
  const F=(w,s)=>`${w} ${s}px Cairo, sans-serif`;
  const ease=t=>1-Math.pow(1-t,3);
  return {W,H,cv,x,rr,F,ease,d};
}
function _scFrame(s,t){
  const {W,H,x,rr,F,ease,d}=s;
  const glow=0.28+0.07*Math.sin(t*2*Math.PI);
  x.fillStyle="#0B1220";x.fillRect(0,0,W,H);
  let g=x.createRadialGradient(W*(0.85+0.04*Math.sin(t*2*Math.PI)),H*0.12,0,W*0.85,H*0.12,520);
  g.addColorStop(0,`rgba(249,115,22,${glow})`);g.addColorStop(1,"rgba(249,115,22,0)");
  x.fillStyle=g;x.fillRect(0,0,W,H);
  g=x.createRadialGradient(W*0.1,H*(0.9+0.03*Math.cos(t*2*Math.PI)),0,W*0.1,H*0.9,560);
  g.addColorStop(0,`rgba(37,99,235,${glow})`);g.addColorStop(1,"rgba(37,99,235,0)");
  x.fillStyle=g;x.fillRect(0,0,W,H);
  // header: dumbbell-M tile + Anton wordmark (matches the app logo)
  const k=104/64,ox=80,oy=88;
  x.save();x.translate(ox,oy);x.scale(k,k);
  const mg=x.createLinearGradient(0,0,64,64);mg.addColorStop(0,"#FF5A0A");mg.addColorStop(1,"#FFB347");
  const ph=(t*2)%1,rg=Math.sin(Math.PI*ph);
  x.save();x.shadowColor="rgba(255,179,0,"+(0.35+0.4*rg)+")";x.shadowBlur=26;
  rr(0,0,64,64,16);x.fillStyle=mg;x.fill();x.restore();
  x.strokeStyle="rgba(255,194,26,"+(0.7*(1-ph))+")";x.lineWidth=1.6;
  const e=ph*7;rr(1-e,1-e,62+2*e,62+2*e,16+e);x.stroke();
  x.fillStyle="#fff";
  [[5,22,6,20],[12,16,6,32],[53,22,6,20],[46,16,6,32]].forEach(r=>{rr(r[0],r[1],r[2],r[3],2.5);x.fill();});
  const M=new Path2D("M18 42V24L26 36 32 28 38 36 46 24V42");
  x.lineCap="round";x.lineJoin="round";x.lineWidth=4.2;x.strokeStyle="rgba(255,255,255,.92)";x.stroke(M);
  x.lineWidth=4.6;x.strokeStyle="#FFE680";x.shadowColor="#FFC21A";x.shadowBlur=10;
  x.setLineDash([0.22*70,70]);x.lineDashOffset=-(((t*2)%1)*1.3-0.22)*70*-1;x.stroke(M);x.setLineDash([]);
  x.restore();
  x.direction="ltr";x.textAlign="left";x.font="400 78px Anton, Outfit, sans-serif";
  const wm=x.measureText("MO").width,sp=6;
  x.save();x.fillStyle="#fff";x.fillText("M",214,166);x.fillText("O",214+x.measureText("M").width+sp,166);
  const fx=214+wm+2*sp,fw=x.measureText("FIT").width+2*sp;
  const fg=x.createLinearGradient(fx,0,fx+fw,0);const sh=(t*1.0)%1;
  fg.addColorStop(0,"#FFB300");fg.addColorStop(Math.max(0,sh-0.18),"#FFB300");fg.addColorStop(sh,"#FFF2B0");fg.addColorStop(Math.min(1,sh+0.18),"#FFB300");fg.addColorStop(1,"#FFE680");
  x.fillStyle=fg;x.shadowColor="rgba(255,179,0,.45)";x.shadowBlur=18;
  let cx=fx;for(const ch of "FIT"){x.fillText(ch,cx,166);cx+=x.measureText(ch).width+sp;}
  x.restore();
  // hero: pulsing flame + counting streak
  x.textAlign="center";x.direction="rtl";
  const pulse=1+0.09*Math.sin(t*2*Math.PI*2);
  x.save();x.translate(W/2,420);x.scale(pulse,pulse);
  x.font="150px Cairo, sans-serif";x.fillText("🔥",0,50);x.restore();
  const shown=Math.round((d.streak||0)*ease(Math.min(1,t/0.4)));
  x.fillStyle="#FF8A3D";x.font=F(800,190);
  x.fillText(String(shown),W/2,680);
  x.fillStyle="#fff";x.font=F(700,64);
  x.fillText(d.streak>2?"أسابيع التزام متتالي":"أسبوع التزام متتالي",W/2,770);
  x.fillStyle="rgba(255,255,255,.75)";x.font=F(600,42);
  x.fillText("حقق هدف التمرين كل أسبوع",W/2,835);
  // stats row: chips slide up + fade in, staggered
  const stats=[[d.total,"تمرين كامل"],[`${d.done}/${d.goal}`,"هذا الأسبوع"],[d.badge||"—",d.badgeName||"أحدث شارة"]];
  const bw=290,bh=200,gap=40,x0=(W-(3*bw+2*gap))/2,y0=940;
  stats.forEach((st,i)=>{const a=x0+i*(bw+gap);
    const it=ease(Math.max(0,Math.min(1,(t-0.15-i*0.12)/0.3)));
    const dy=60*(1-it);
    x.globalAlpha=it;
    rr(a,y0+dy,bw,bh,28);x.fillStyle="rgba(255,255,255,.07)";x.fill();
    x.strokeStyle="rgba(255,255,255,.14)";x.lineWidth=2;x.stroke();
    x.fillStyle="#FFB347";x.font=F(800,i===2?58:76);x.fillText(String(st[0]),a+bw/2,y0+dy+95);
    x.fillStyle="rgba(255,255,255,.8)";x.font=F(600,34);x.fillText(st[1],a+bw/2,y0+dy+155);
    x.globalAlpha=1;});
  // footer
  x.fillStyle="rgba(255,255,255,.9)";x.font=F(700,44);
  x.fillText("برنامجك · تغذيتك · تطورك",W/2,H-110);
  x.fillStyle="rgba(255,255,255,.45)";x.font="600 34px Outfit, Cairo, sans-serif";
  x.fillText("mofit-coaching.github.io",W/2,H-58);
}
function drawShareCard(d){
  const s=_scSetup(d);
  return Promise.all([document.fonts.ready,document.fonts.load("400 78px Anton")]).then(()=>{_scFrame(s,1);return s.cv;});
}
async function _scRecord(d,ms){
  const s=_scSetup(d);
  await document.fonts.ready;try{await document.fonts.load("400 78px Anton");}catch(e){}
  const stream=s.cv.captureStream(30);
  const cands=["video/mp4;codecs=avc1.640028,mp4a.40.2","video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4","video/webm;codecs=vp9","video/webm"];
  let rec=null;
  for(const m of cands){ if(!MediaRecorder.isTypeSupported(m)) continue;
    try{ rec=new MediaRecorder(stream,{mimeType:m,videoBitsPerSecond:4000000}); break; }catch(e){} }
  if(!rec) rec=new MediaRecorder(stream,{videoBitsPerSecond:4000000});
  const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const done=new Promise(r=>rec.onstop=r);
  const t0=performance.now();
  (function loop(){const t=((performance.now()-t0)/ms)%1;_scFrame(s,t);if(performance.now()-t0<ms)requestAnimationFrame(loop);else rec.stop();})();
  rec.start();
  await done;
  return new Blob(chunks,{type:rec.mimeType||"video/webm"});
}
function _scExt(type){return type&&type.indexOf("mp4")>=0?"mp4":"webm";}
async function shareProgressCard(d){
  let blob=null,file=null;
  if(window.MediaRecorder&&document.createElement("canvas").captureStream){
    try{blob=await _scRecord(d,3000);file=new File([blob],"mofit-progress."+_scExt(blob.type),{type:blob.type||"video/webm"});}catch(e){blob=null;}
  }
  if(!blob){
    const cv=await drawShareCard(d);
    blob=await new Promise(r=>cv.toBlob(r,"image/png"));
    file=new File([blob],"mofit-progress.png",{type:"image/png"});
  }
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:"تقدمي في Mofit",text:"تقدمي في التمرين مع Mofit 💪"});return;}catch(e){if(e&&e.name==="AbortError")return;}
  }
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
async function shareStreakCard(btn){
  const d=btn.dataset;
  const old=btn.textContent;btn.disabled=true;btn.textContent="⏳ ...";
  try{await shareProgressCard({streak:+d.streak||0,total:+d.total||0,done:+d.done||0,goal:+d.goal||1,badge:d.badge,badgeName:d.badgename});}
  catch(e){if(typeof toast==="function")toast("مش قادر أجهز الصورة دلوقتي");}
  btn.disabled=false;btn.textContent=old;
}
