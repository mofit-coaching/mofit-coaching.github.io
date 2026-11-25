/* ======================================================================
   Mofit transformation card (tf-*): milestone share image.
   - Client Home teaser (after the Body card): "بطاقة تحوّلك" with a share
     button, shown once there is something worth sharing (weight moved
     >= 1kg across 2+ logs, 5+ workouts, or a streak week).
   - drawTransformCard(p, st) renders a static 1080x1350 PNG in the Flame
     visual language (dark navy, molten orange tile, MOFIT wordmark,
     gold accents) with:
       hero:   weight delta (goal-aware) or total workouts
       chips:  total workouts / streak weeks / waist delta or BMI
       footer: QR of the client's own invite link (?join=1&src=<profile
               id>) so a shared card signs friends up with referral credit.
   - shareTransformCard(btn) shares via the Web Share API (file), falling
     back to a PNG download. No animation/recording: a still image.
   - Reads only: body_logs + workout_sessions + S.client/S.program.
     sharecard.js / flame.js / invite.js untouched; scoped window.tf*.
   ====================================================================== */
(function(){

function tfUrl(p){
  return location.origin+location.pathname+"?join=1&src="+encodeURIComponent(p.id);
}

/* milestone stats from body logs + workout sessions */
function tfStats(p,B,W){
  const wts=(B||[]).filter(b=>b.weight!=null).sort((a,b)=>a.week-b.week);
  const start=(B||[]).find(b=>b.week===0)||{};
  const startW=(start.weight!=null?+start.weight:(p.start_weight!=null?+p.start_weight:(wts.length?+wts[0].weight:null)));
  const cur=wts.length?+wts[wts.length-1].weight:null;
  const dW=(cur!=null&&startW!=null)?cur-startW:null;
  const lastLog=wts.length?wts[wts.length-1]:{};
  const dWa=(lastLog.waist!=null&&start.waist!=null)?(+lastLog.waist-+start.waist):null;
  const cnt={}; (W||[]).forEach(s=>{ cnt[s.week]=(cnt[s.week]||0)+1; });
  const goal=Math.max(1,new Set((S.program||[]).map(e=>e.day_no)).size||3);
  const wkNow=currentWeek(p), done=cnt[wkNow]||0;
  let streak=0,w=done>=goal?wkNow:wkNow-1;
  while(w>=1&&(cnt[w]||0)>=goal){ streak++; w--; }
  const total=(W||[]).length;
  const weeks=Math.max(1,wkNow);
  const g=p.goal||"";
  const goalLoss=/تنشيف|خسارة|تخسيس|حرق/.test(g), goalGain=/زيادة|تضخيم|بناء|عضل/.test(g);
  let hero=null;
  if(dW!=null&&Math.abs(dW)>=1){
    const loss=dW<0;
    const mismatch=(loss&&goalGain)||(!loss&&goalLoss);
    if(!mismatch) hero={n:fmt(Math.abs(dW),1),arrow:loss?"▼":"▲",
      line:loss?"كجم خسيتها مع Mofit":"كجم زدتها مع Mofit",
      sub:(startW!=null&&cur!=null)?("من "+fmt(startW,1)+" لـ "+fmt(cur,1)+" كجم في "+weeks+" "+(weeks>2?"أسابيع":"أسبوع")):null};
  }
  if(!hero&&total>=1) hero={n:String(total),arrow:"💪",line:"تمرين كامل منذ البداية",
    sub:"في "+weeks+" "+(weeks>2?"أسابيع":"أسبوع")+" مع Mofit"};
  const hasData=(wts.length>=2&&dW!=null&&Math.abs(dW)>=1)||total>=5||streak>=1;
  return {startW:startW,cur:cur,dW:dW,dWa:dWa,streak:streak,total:total,weeks:weeks,hero:hero,hasData:hasData};
}

/* QR block drawn straight onto the card canvas (vendored qrcode lib) */
function tfQR(x,cx,cy,size,text){
  const qr=qrcode(0,"M"); qr.addData(text); qr.make();
  const n=qr.getModuleCount(), pad=2, cell=size/(n+pad*2);
  x.save();
  x.beginPath();
  const bx=cx-size/2-16, by=cy-size/2-16, bs=size+32, r=26;
  x.moveTo(bx+r,by); x.arcTo(bx+bs,by,bx+bs,by+bs,r); x.arcTo(bx+bs,by+bs,bx,by+bs,r); x.arcTo(bx,by+bs,bx,by,r); x.arcTo(bx,by,bx+bs,by,r); x.closePath();
  x.fillStyle="#fff"; x.fill();
  x.fillStyle="#0F172A";
  for(let rr2=0;rr2<n;rr2++) for(let cc=0;cc<n;cc++) if(qr.isDark(rr2,cc))
    x.fillRect(cx-size/2+(cc+pad)*cell, cy-size/2+(rr2+pad)*cell, Math.ceil(cell*10)/10, Math.ceil(cell*10)/10);
  x.restore();
}

async function drawTransformCard(p,st){
  const W=1080,H=1350,cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const x=cv.getContext("2d");
  const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();};
  const F=(w,s)=>w+" "+s+"px Cairo, sans-serif";
  await document.fonts.ready; try{ await document.fonts.load("400 78px Anton"); }catch(e){}

  // background: dark navy + molten glows (Flame palette)
  x.fillStyle="#0B1220"; x.fillRect(0,0,W,H);
  let g=x.createRadialGradient(W*0.86,H*0.12,0,W*0.86,H*0.12,540);
  g.addColorStop(0,"rgba(249,115,22,.30)"); g.addColorStop(1,"rgba(249,115,22,0)");
  x.fillStyle=g; x.fillRect(0,0,W,H);
  g=x.createRadialGradient(W*0.10,H*0.92,0,W*0.10,H*0.92,580);
  g.addColorStop(0,"rgba(37,99,235,.26)"); g.addColorStop(1,"rgba(37,99,235,0)");
  x.fillStyle=g; x.fillRect(0,0,W,H);

  // header: dumbbell-M tile + MOFIT wordmark (matches the app logo)
  const k=104/64, ox=80, oy=84;
  x.save(); x.translate(ox,oy); x.scale(k,k);
  const mg=x.createLinearGradient(0,0,64,64); mg.addColorStop(0,"#FF5A0A"); mg.addColorStop(1,"#FFB347");
  x.save(); x.shadowColor="rgba(255,179,0,.55)"; x.shadowBlur=24;
  rr(0,0,64,64,16); x.fillStyle=mg; x.fill(); x.restore();
  x.fillStyle="#fff";
  [[5,22,6,20],[12,16,6,32],[53,22,6,20],[46,16,6,32]].forEach(r2=>{ rr(r2[0],r2[1],r2[2],r2[3],2.5); x.fill(); });
  const M=new Path2D("M18 42V24L26 36 32 28 38 36 46 24V42");
  x.lineCap="round"; x.lineJoin="round"; x.lineWidth=4.2; x.strokeStyle="rgba(255,255,255,.92)"; x.stroke(M);
  x.lineWidth=4.6; x.strokeStyle="#FFE680"; x.shadowColor="#FFC21A"; x.shadowBlur=10; x.stroke(M);
  x.restore();
  x.direction="ltr"; x.textAlign="left"; x.font="400 78px Anton, Outfit, sans-serif";
  x.fillStyle="#fff"; x.fillText("M",214,166); x.fillText("O",214+x.measureText("M").width+6,166);
  const fx=214+x.measureText("MO").width+12;
  const fg=x.createLinearGradient(fx,0,fx+x.measureText("FIT").width+40,0);
  fg.addColorStop(0,"#FFB300"); fg.addColorStop(0.55,"#FFE680"); fg.addColorStop(1,"#FFB300");
  x.fillStyle=fg; x.shadowColor="rgba(255,179,0,.45)"; x.shadowBlur=16;
  let cxp=fx; for(const ch of "FIT"){ x.fillText(ch,cxp,166); cxp+=x.measureText(ch).width+6; }
  x.shadowBlur=0;

  // kicker
  x.textAlign="center"; x.direction="rtl";
  const first=(p.full_name||"").trim().split(/\s+/)[0];
  x.fillStyle="rgba(255,230,128,.95)"; x.font=F(800,50);
  x.fillText("🏆 بطاقة التحوّل"+(first?" · "+first:""),W/2,300);

  // hero: the milestone number
  const hero=st.hero||{n:String(st.total),arrow:"💪",line:"تمرين كامل منذ البداية",sub:null};
  x.direction="ltr";
  const hg=x.createLinearGradient(0,380,0,560); hg.addColorStop(0,"#FFE680"); hg.addColorStop(0.72,"#FF8A3D"); hg.addColorStop(1,"#FF5A0A");
  x.fillStyle=hg; x.font=F(800,196);
  x.shadowColor="rgba(255,138,61,.5)"; x.shadowBlur=26;
  const heroTxt=(hero.arrow==="💪"?"":hero.arrow+" ")+hero.n;
  x.fillText(heroTxt,W/2,565);
  x.shadowBlur=0;
  x.direction="rtl";
  x.fillStyle="#fff"; x.font=F(700,64);
  x.fillText(hero.line,W/2,680);
  if(hero.sub){ x.fillStyle="rgba(255,255,255,.75)"; x.font=F(600,42); x.fillText(hero.sub,W/2,748); }

  // chips row
  const chips=[];
  chips.push([String(st.total),"تمرين كامل 💪"]);
  if(st.streak>0) chips.push([String(st.streak),(st.streak>2?"أسابيع":"أسبوع")+" التزام 🔥"]);
  else chips.push([String(st.weeks),(st.weeks>2?"أسابيع":"أسبوع")+" مع Mofit"]);
  if(st.dWa!=null) chips.push([fmt(Math.abs(st.dWa),1)+(st.dWa<0?"▼":"▲"),"سم من الوسط 📏"]);
  else if(st.cur!=null&&p.height_cm) chips.push([fmt(st.cur/((p.height_cm/100)*(p.height_cm/100)),1),"BMI دلوقتي"]);
  else chips.push(["🔥","الشعلة شغالة"]);
  const bw=300,bh=175,gap=34,x0=(W-(3*bw+2*gap))/2,y0=815;
  chips.forEach((c2,i)=>{
    const a=x0+i*(bw+gap);
    rr(a,y0,bw,bh,28); x.fillStyle="rgba(255,255,255,.07)"; x.fill();
    x.strokeStyle="rgba(255,255,255,.14)"; x.lineWidth=2; x.stroke();
    x.fillStyle="#FFB347"; x.font=F(800,64); x.fillText(String(c2[0]),a+bw/2,y0+86);
    x.fillStyle="rgba(255,255,255,.8)"; x.font=F(600,32); x.fillText(c2[1],a+bw/2,y0+136);
  });

  // footer: invite QR (carries the client's referral code)
  x.fillStyle="rgba(255,255,255,.92)"; x.font=F(700,44);
  x.fillText("عايز تبدأ تحوّلك انت كمان؟ امسح الكود 📲",W/2,1062);
  tfQR(x,W/2,1210,205,tfUrl(p));
  x.fillStyle="rgba(255,255,255,.45)"; x.font="600 27px Outfit, Cairo, sans-serif"; x.direction="ltr";
  x.fillText("mofit-coaching.github.io",W/2,H-6);
  return cv;
}

async function shareTransformCard(btn){
  const p=S.client; if(!p) return;
  const old=btn.textContent; btn.disabled=true; btn.textContent="⏳ ...";
  try{
    const id=p.id;
    const [B,W]=await Promise.all([
      sb.from("body_logs").select("week,weight,waist").eq("client_id",id).order("week"),
      sb.from("workout_sessions").select("week").eq("client_id",id)
    ]);
    const st=tfStats(p,B.data||[],W.data||[]);
    const cv=await drawTransformCard(p,st);
    const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
    const file=new File([blob],"mofit-transformation.png",{type:"image/png"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file],title:"تحوّلي مع Mofit",text:"تحوّلي مع Mofit 🔥 ابدأ انت كمان: "+tfUrl(p)}); btn.disabled=false; btn.textContent=old; return; }
      catch(e){ if(e&&e.name==="AbortError"){ btn.disabled=false; btn.textContent=old; return; } }
    }
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=file.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  }catch(e){ if(typeof toast==="function") toast("مش قادر أجهز الصورة دلوقتي"); }
  btn.disabled=false; btn.textContent=old;
}

/* Home teaser (client only), after the Body card */
const _vhTransform=viewHome;
viewHome=async function(el){
  await _vhTransform(el);
  try{ await renderTransformTeaser(el); }catch(e){}
};
async function renderTransformTeaser(el){
  const p=S.client; if(!p||S.me.role!=="client") return;
  if(el.querySelector("#tfCard")) return;
  const id=p.id;
  const [B,W]=await Promise.all([
    sb.from("body_logs").select("week,weight,waist").eq("client_id",id).order("week"),
    sb.from("workout_sessions").select("week").eq("client_id",id)
  ]);
  const st=tfStats(p,B.data||[],W.data||[]);
  if(!st.hasData) return;
  const line=st.hero&&st.hero.arrow!=="💪"
    ?("وزنك اتحرّك "+st.hero.n+" كجم "+(st.hero.arrow==="▼"?"نازل":"طالع")+" — ورّي صحابك الشغل 💪")
    :("عندك "+st.total+" تمرين كامل — ورّي صحابك الشغل 💪");
  const host=document.createElement("div"); host.className="card"; host.id="tfCard";
  host.innerHTML=`<div class="card-h"><div class="ic acc">🏆</div><h2>بطاقة تحوّلك<small>صورة تقدم بهوية Mofit + لينك دعوتك، جاهزة للمشاركة</small></h2></div>
    <p class="hint" style="margin:0 0 10px">${line}</p>
    <div class="row"><button class="btn primary grow" id="tfShare">📤 شارك بطاقة التحوّل</button></div>`;
  const anchor=el.querySelector("#hB");
  if(anchor&&anchor.parentNode===el) anchor.after(host); else el.appendChild(host);
  host.querySelector("#tfShare").onclick=ev=>shareTransformCard(ev.currentTarget);
}

window.tfStats=tfStats;
window.drawTransformCard=drawTransformCard;
window.shareTransformCard=shareTransformCard;
})();
