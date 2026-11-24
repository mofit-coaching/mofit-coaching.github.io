/* Mofit share card: branded progress image for client stories (Web Share API, download fallback). */
function drawShareCard(d){
  const W=1080,H=1350,cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const x=cv.getContext("2d");
  const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();};
  const F=(w,s)=>`${w} ${s}px Cairo, sans-serif`;
  // background
  x.fillStyle="#0B1220";x.fillRect(0,0,W,H);
  let g=x.createRadialGradient(W*.85,H*.12,0,W*.85,H*.12,520);
  g.addColorStop(0,"rgba(249,115,22,.32)");g.addColorStop(1,"rgba(249,115,22,0)");
  x.fillStyle=g;x.fillRect(0,0,W,H);
  g=x.createRadialGradient(W*.1,H*.9,0,W*.1,H*.9,560);
  g.addColorStop(0,"rgba(37,99,235,.30)");g.addColorStop(1,"rgba(37,99,235,0)");
  x.fillStyle=g;x.fillRect(0,0,W,H);
  // header: M-pulse mark + wordmark
  const mg=x.createLinearGradient(0,90,0,190);mg.addColorStop(0,"#FF6B1A");mg.addColorStop(1,"#FFB347");
  rr(80,88,104,104,26);x.fillStyle=mg;x.fill();
  x.strokeStyle="#fff";x.lineWidth=11;x.lineCap="round";x.lineJoin="round";
  x.beginPath();x.moveTo(102,140);x.lineTo(122,140);x.lineTo(134,112);x.lineTo(150,166);x.lineTo(162,140);x.lineTo(180,140);x.stroke();
  x.direction="ltr";x.textAlign="left";x.fillStyle="#fff";x.font="800 62px Outfit, Cairo, sans-serif";
  x.fillText("MOFIT",212,158);
  // hero: streak flame
  x.textAlign="center";x.direction="rtl";
  x.font="150px Cairo, sans-serif";x.fillText("🔥",W/2,470);
  x.fillStyle="#FF8A3D";x.font=F(800,190);
  x.fillText(String(d.streak||0),W/2,680);
  x.fillStyle="#fff";x.font=F(700,64);
  x.fillText(d.streak>2?"أسابيع التزام متتالي":"أسبوع التزام متتالي",W/2,770);
  x.fillStyle="rgba(255,255,255,.75)";x.font=F(600,42);
  x.fillText("حقق هدف التمرين كل أسبوع",W/2,835);
  // stats row
  const stats=[[d.total,"تمرين كامل"],[`${d.done}/${d.goal}`,"هذا الأسبوع"],[d.badge||"—",d.badgeName||"أحدث شارة"]];
  const bw=290,bh=200,gap=40,x0=(W-(3*bw+2*gap))/2,y0=940;
  stats.forEach((s,i)=>{const a=x0+i*(bw+gap);
    rr(a,y0,bw,bh,28);x.fillStyle="rgba(255,255,255,.07)";x.fill();
    x.strokeStyle="rgba(255,255,255,.14)";x.lineWidth=2;x.stroke();
    x.fillStyle="#FFB347";x.font=F(800,i===2?58:76);x.fillText(String(s[0]),a+bw/2,y0+95);
    x.fillStyle="rgba(255,255,255,.8)";x.font=F(600,34);x.fillText(s[1],a+bw/2,y0+155);});
  // footer
  x.fillStyle="rgba(255,255,255,.9)";x.font=F(700,44);
  x.fillText("برنامجك · تغذيتك · تطورك",W/2,H-110);
  x.fillStyle="rgba(255,255,255,.45)";x.font="600 34px Outfit, Cairo, sans-serif";
  x.fillText("mofit-coaching.github.io",W/2,H-58);
  return cv;
}
async function shareProgressCard(d){
  const cv=drawShareCard(d);
  const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
  const file=new File([blob],"mofit-progress.png",{type:"image/png"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:"تقدمي في Mofit",text:"تقدمي في التمرين مع Mofit 💪"});return;}catch(e){if(e&&e.name==="AbortError")return;}
  }
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mofit-progress.png";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
async function shareStreakCard(btn){
  const d=btn.dataset;
  const old=btn.textContent;btn.disabled=true;btn.textContent="⏳ ...";
  try{await shareProgressCard({streak:+d.streak||0,total:+d.total||0,done:+d.done||0,goal:+d.goal||1,badge:d.badge,badgeName:d.badgename});}
  catch(e){if(typeof toast==="function")toast("مش قادر أجهز الصورة دلوقتي");}
  btn.disabled=false;btn.textContent=old;
}
