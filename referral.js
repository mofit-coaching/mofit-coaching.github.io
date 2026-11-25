/* ======================================================================
   Mofit: client referral screen ("🎁 ادعُ صاحبك")
   - Compact teaser card on the client home opens a dedicated screen.
   - Screen: personal invite link (QR + copy + WhatsApp), referral stats,
     and the friends list with status (signed up / activated / week granted).
   - Data: sb.rpc("my_referrals") — security-definer function; the client
     sees only name + masked phone + status of signups tagged with their
     profile id as the referral code. Coach grants the week from the
     pending-requests card (signup.js).
   ====================================================================== */
(function(){
function refUrl(code){
  return location.origin+location.pathname+"?join=1&src="+encodeURIComponent(code);
}
function drawRefQR(cv,text){
  const qr=qrcode(0,"M"); qr.addData(text); qr.make();
  const n=qr.getModuleCount(), pad=2, size=cv.width, cell=Math.floor(size/(n+pad*2)), off=Math.floor((size-cell*n)/2);
  const ctx=cv.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,size,size); ctx.fillStyle="#0F172A";
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) ctx.fillRect(off+c*cell,off+r*cell,cell,cell);
}
function agoAr(d){
  const m=Math.max(0,Math.floor((Date.now()-new Date(d).getTime())/6e4));
  if(m<60) return m<=1?"دلوقتي":"من "+m+" د";
  if(m<1440) return "من "+Math.floor(m/60)+" س";
  const dd=Math.floor(m/1440); return dd===1?"من يوم":"من "+dd+" يوم";
}
const _vhReferral = viewHome;
viewHome = async function(el){
  await _vhReferral(el);
  if(!S.me||S.me.role!=="client"||el.querySelector("#refTeaser")) return;
  const t=document.createElement("div"); t.className="card"; t.id="refTeaser";
  t.innerHTML=`<div class="card-h"><div class="ic acc">🎁</div><h2>ادعُ صاحبك<small>كل صاحب يتفعّل = أسبوع هدية ليك</small></h2></div>
    <button class="btn primary block" id="refOpen">🎁 افتح صفحة الدعوة</button>`;
  const tip=el.querySelector(".card.tip"), hero=el.querySelector(".card.hero"); if(tip&&tip.parentNode===el) tip.before(t); else if(hero&&hero.parentNode===el) hero.after(t); else el.prepend(t);
  t.querySelector("#refOpen").onclick=()=>{ renderReferral(el); window.scrollTo(0,0); };
};
async function renderReferral(el){
  const me=S.me||{}, code=me.id||"", url=refUrl(code);
  el.innerHTML=`<div class="card" id="refCard"><div class="card-h"><div class="ic acc">🎁</div><h2>ادعُ صاحبك<small>كل صاحب يتفعّل = أسبوع هدية ليك</small></h2></div>
    <div style="text-align:center"><canvas id="refQr" width="172" height="172" style="border-radius:14px;background:#fff;padding:8px;width:172px;height:172px"></canvas>
    <p class="hint" style="margin:8px 0 4px;font-size:12px">ابعت لينكك الشخصي لصاحبك — يسجّل منه، وأول ما الكوتش يفعّل اشتراكه تتضافلك <b style="color:var(--acc)">أسبوع مجاناً</b> على اشتراكك</p>
    <p class="hint" style="margin:0 0 10px;font-size:11px;direction:ltr;opacity:.7">${esc(url)}</p></div>
    <div class="row"><button class="btn primary grow" id="refCopy">📋 نسخ اللينك</button><a class="btn grow" id="refWa" target="_blank" rel="noopener">💬 شارك واتساب</a></div></div>
  <div class="card"><div class="card-h"><div class="ic">📊</div><h2>إحصائياتك</h2></div>
    <div class="row" style="text-align:center" id="refStats"><p class="hint" style="margin:0 auto">بيحمّل…</p></div></div>
  <div class="card"><div class="card-h"><div class="ic">👥</div><h2>أصحابك</h2></div><div id="refList"><p class="hint">بيحمّل…</p></div></div>
  <button class="btn navy block" id="refBack" style="margin-bottom:14px">→ رجوع للرئيسية</button>`;
  el.querySelector("#refBack").onclick=()=>{ S.tab="home"; render(); window.scrollTo(0,0); };
  const cv=el.querySelector("#refQr"); try{ drawRefQR(cv,url); }catch(e){}
  el.querySelector("#refWa").href=waLink("السلام عليكم 👋 اشترك في Mofit من اللينك ده وقول للكوتش إنك من طرفي 💪\n"+url);
  el.querySelector("#refCopy").onclick=async ev=>{
    const b=ev.currentTarget;
    try{ await navigator.clipboard.writeText(url); }catch(e){ const t=document.createElement("textarea"); t.value=url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    b.textContent="✅ اتنسخ"; setTimeout(()=>b.textContent="📋 نسخ اللينك",1600);
  };
  const { data, error } = await sb.rpc("my_referrals");
  if(!el.querySelector("#refStats")) return;
  const R=error?[]:(data||[]);
  const joined=R.length, active=R.filter(r=>r.active).length, rewarded=R.filter(r=>r.reward_granted).length;
  el.querySelector("#refStats").innerHTML=`
    <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--acc)">${joined}</div><div class="hint" style="font-size:11px">أصحاب سجّلوا</div></div>
    <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--acc)">${active}</div><div class="hint" style="font-size:11px">اشتراكات اتفعّلت</div></div>
    <div style="flex:1"><div style="font-size:22px;font-weight:800;color:var(--acc)">${rewarded}</div><div class="hint" style="font-size:11px">أسابيع هدية</div></div>`;
  el.querySelector("#refList").innerHTML=R.length?R.map(r=>{
    const st=!r.active?`<span class="pill">⏳ سجّل — بانتظار التفعيل</span>`:r.reward_granted?`<span class="pill navy">✓ اتفعّل — الهدية مستلمة</span>`:`<span class="pill good">🎁 اتفعّل — أسبوعك الهدية وصل</span>`;
    return `<div class="item" style="padding:10px 0;border-top:1px solid rgba(148,163,184,.2)"><div class="nm"><b>${esc(r.full_name||"—")}</b><small>📱 ${esc(r.phone||"")} · ${agoAr(r.created_at)}</small></div>${st}</div>`;
  }).join(""):`<p class="hint">لسه محدش سجّل من لينكك — ابعته لصاحبك وابدأ اجمع أسابيع هدية 🎁</p>`;
};
})();
