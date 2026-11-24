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
  // header: M-pulse mark + wordmark
  const mg=x.createLinearGradient(0,90,0,190);mg.addColorStop(0,"#FF6B1A");mg.addColorStop(1,"#FFB347");
  rr(80,88,104,104,26);x.fillStyle=mg;x.fill();
  x.strokeStyle="#fff";x.lineWidth=11;x.lineCap="round";x.lineJoin="round";
  x.beginPath();x.moveTo(102,140);x.lineTo(122,140);x.lineTo(134,112);x.lineTo(150,166);x.lineTo(162,140);x.lineTo(180,140);x.stroke();
  x.direction="ltr";x.textAlign="left";x.fillStyle="#fff";x.font="800 62px Outfit, Cairo, sans-serif";
  x.fillText("MOFIT",212,158);
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
  return document.fonts.ready.then(()=>{_scFrame(s,1);return s.cv;});
}
async function _scRecord(d,ms){
  const s=_scSetup(d);
  await document.fonts.ready;
  const stream=s.cv.captureStream(30);
  const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":(MediaRecorder.isTypeSupported("video/webm")?"video/webm":"");
  const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:4000000}:{videoBitsPerSecond:4000000});
  const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const done=new Promise(r=>rec.onstop=r);
  const t0=performance.now();
  (function loop(){const t=((performance.now()-t0)/ms)%1;_scFrame(s,t);if(performance.now()-t0<ms)requestAnimationFrame(loop);else rec.stop();})();
  rec.start();
  await done;
  return new Blob(chunks,{type:rec.mimeType||"video/webm"});
}
async function shareProgressCard(d){
  let blob=null,file=null;
  if(window.MediaRecorder&&document.createElement("canvas").captureStream){
    try{blob=await _scRecord(d,3000);file=new File([blob],"mofit-progress.webm",{type:blob.type||"video/webm"});}catch(e){blob=null;}
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
