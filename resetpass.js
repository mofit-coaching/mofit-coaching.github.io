/* ======================================================================
   Mofit — نسيت كلمة السر: إعادة تعيين بالإيميل (self-service)
   - "نسيت كلمة السر؟" على شاشة الدخول بيفتح شيت: العميل يكتب إيميله وسوبابيس
     تبعتله لينك (نفس نظام إيميلات تأكيد التسجيل، مفيش إعداد جديد).
   - اللينك بيرجع على التطبيق ومعاه توكن في عنوان الصفحة: كارت الدخول بيتحوّل
     لفورم "كلمة سر جديدة" (updateUser)، وبعدها بيدخل على طول.
   - اللينك المنتهي/المستخدم بيطلّع رسالة واضحة مع زرار يطلب لينك جديد.
   - واتساب الكوتش فاضل موجود كحل بديل لأي حد الإيميل مش واصله.
   ====================================================================== */

/* قراءة عنوان الصفحة بشكل متزامن عند التحميل: سوبابيس بتمسح التوكن من العنوان
   أول ما تقراه، و boot() بيتنده في آخر coach.js — لازم الفلاج ده يتظبط قبلها. */
function rpReadHash(){
  const h=new URLSearchParams(location.hash.replace(/^#/,""));
  if(h.get("error")) return { error:true, desc:(h.get("error_description")||"").replace(/\+/g," ") };
  if(h.get("type")==="recovery" && h.get("access_token")) return { recovery:true };
  return null;
}
window.__mofitRecovery=rpReadHash();
sb.auth.onAuthStateChange(ev=>{ if(ev==="PASSWORD_RECOVERY" && !window.__mofitRecovery){ window.__mofitRecovery={recovery:true}; rpShowRecovery(); } });

/* ---------- الخطوة ١: طلب اللينك ---------- */
function forgotPassSheet(){
  const waHref=(typeof waLink==="function")?waLink("السلام عليكم كوتش، نسيت كلمة السر بتاعة Mofit 🙏\nالإيميل: "):"#";
  const body=openSheet(`<div class="between" style="margin-bottom:10px"><b>🔑 نسيت كلمة السر؟</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
    <p class="hint" style="margin-top:0">اكتب الإيميل اللي سجّلت بيه وهنبعتلك لينك تظبط بيه كلمة سر جديدة.</p>
    <form id="rpForm" novalidate>
      <label class="f">الإيميل<input id="rpEmail" type="email" autocomplete="username" required></label>
      <p class="err" id="rpErr"></p>
      <button class="btn primary block" type="submit" id="rpBtn">ابعت اللينك</button>
    </form>
    <p class="login-links" style="text-align:center;margin-top:10px"><a target="_blank" rel="noopener" href="${esc(waHref)}">مش واصلك الإيميل؟ كلّم الكوتش واتساب</a></p>`);
  body.querySelector("#rpForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const email=body.querySelector("#rpEmail").value.trim(), err=body.querySelector("#rpErr"), btn=body.querySelector("#rpBtn");
    err.textContent="";
    if(!/^\S+@\S+\.\S+$/.test(email)){ err.textContent="الإيميل مش صحيح"; return; }
    btn.disabled=true; btn.textContent="⏳ بيبعت…";
    const { error }=await sb.auth.resetPasswordForEmail(email,{ redirectTo:location.origin+location.pathname });
    btn.disabled=false; btn.textContent="ابعت اللينك";
    if(error){ err.textContent="حصلت مشكلة، جرّب تاني بعد شوية"; return; }
    body.innerHTML=`<div style="text-align:center;padding:8px 0"><div style="font-size:42px">📧</div>
      <h2 style="margin:6px 0">اتبعت اللينك ✅</h2>
      <p class="hint">لو الإيميل ده مسجل عندنا، هيوصلك لينك خلال دقايق تظبط بيه كلمة سر جديدة.<br>اللينك بيشتغل مرة واحدة وبيخلص بعد ساعة — بصّ على سبام/Junk لو مش لاقيه.</p>
      <button class="btn block" onclick="closeSheet()">تمام</button>
      <p class="login-links" style="margin-top:10px"><a target="_blank" rel="noopener" href="${esc(waHref)}">مش واصلك الإيميل؟ كلّم الكوتش واتساب</a></p></div>`;
  });
}

/* ---------- الخطوة ٢: اللينك رجّع العميل هنا — فورم كلمة سر جديدة ---------- */
function rpShowRecovery(){
  const st=window.__mofitRecovery; if(!st) return;
  $("#loginView").classList.remove("hidden"); $("#appView").classList.add("hidden");
  const tabs=document.querySelector(".ltabs"); if(tabs) tabs.classList.add("hidden");
  $("#loginForm").classList.add("hidden"); $("#plansPane").classList.add("hidden"); $("#signupPane").classList.add("hidden");
  const pane=$("#resetPane"); pane.classList.remove("hidden");
  if(st.error){
    pane.innerHTML=`<div style="text-align:center"><div style="font-size:42px">⏰</div>
      <h2 style="margin:6px 0">اللينك مش شغال</h2>
      <p class="hint">لينك إعادة كلمة السر بيشتغل مرة واحدة وبيخلص بعد ساعة. اطلب لينك جديد وهيوصلك على إيميلك.</p>
      <button class="btn primary block" id="rpAgain">اطلب لينك جديد</button>
      <p class="login-links" style="margin-top:10px"><a href="#" id="rpBack">رجوع لتسجيل الدخول</a></p></div>`;
    pane.querySelector("#rpAgain").onclick=()=>{ closeResetPane(); forgotPassSheet(); };
    pane.querySelector("#rpBack").onclick=e=>{ e.preventDefault(); closeResetPane(); };
    return;
  }
  pane.innerHTML=`<form id="rpSet" novalidate>
    <p class="hint" style="margin-top:0">ظبط كلمة سر جديدة لحسابك.</p>
    <label class="f">كلمة السر الجديدة (٨ حروف على الأقل)<input id="rpPass1" type="password" autocomplete="new-password" minlength="8" required></label>
    <label class="f">تأكيد كلمة السر<input id="rpPass2" type="password" autocomplete="new-password" minlength="8" required></label>
    <p class="err" id="rpSetErr"></p>
    <button class="btn primary block" type="submit" id="rpSetBtn">حفظ ودخول</button>
  </form>`;
  pane.querySelector("#rpSet").addEventListener("submit",async e=>{
    e.preventDefault();
    const p1=pane.querySelector("#rpPass1").value, p2=pane.querySelector("#rpPass2").value,
          err=pane.querySelector("#rpSetErr"), btn=pane.querySelector("#rpSetBtn");
    err.textContent="";
    if(p1.length<8){ err.textContent="كلمة السر لازم ٨ حروف على الأقل"; return; }
    if(p1!==p2){ err.textContent="كلمتين السر مش زي بعض"; return; }
    btn.disabled=true; btn.textContent="⏳ بيتحفظ…";
    const { error }=await sb.auth.updateUser({ password:p1 });
    btn.disabled=false; btn.textContent="حفظ ودخول";
    if(error){ err.textContent=/session|token|expired|invalid|jwt/i.test(error.message)?"اللينك خلصت صلاحيته — دوس \"رجوع\" واطلب لينك جديد":"حصلت مشكلة، جرّب تاني"; return; }
    toast("تمام! كلمة السر اتغيّرت ✅");
    window.__mofitRecovery=null;
    try{ history.replaceState(null,"",location.pathname); }catch(_){}
    const t=document.querySelector(".ltabs"); if(t) t.classList.remove("hidden");
    boot();
  });
}
function closeResetPane(){
  const pane=$("#resetPane"); if(pane){ pane.classList.add("hidden"); pane.innerHTML=""; }
  window.__mofitRecovery=null;
  try{ history.replaceState(null,"",location.pathname); }catch(_){}
  const tabs=document.querySelector(".ltabs"); if(tabs) tabs.classList.remove("hidden");
  loginTab("login");
}
