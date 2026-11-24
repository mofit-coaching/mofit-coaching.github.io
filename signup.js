/* ======================================================================
   Mofit — public sign-up with coach approval
   - Public "حساب جديد" tab on the login screen.
   - New account is created inactive (profiles.active=false). The coach sees it
     in "طلبات جديدة" on the clients page and activates it after payment.
   - Payment stays manual over WhatsApp. Needs signup.sql run in Supabase first.
   ====================================================================== */
const SU_DAYS = ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];

async function drawSignup(){
  const box=$("#signupPane"); if(box.dataset.done) return;
  const plans=(await loadPlans().catch(()=>[]))||[];
  box.innerHTML=`<form id="suForm" autocomplete="on" novalidate>
    <p class="hint" style="margin-top:0">املا بياناتك والكوتش هيراجع طلبك ويفعّل حسابك بعد تأكيد الاشتراك.</p>
    <label class="f">الاسم<input id="suName" autocomplete="name" required maxlength="80"></label>
    <label class="f">رقم الواتساب<input id="suPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01xxxxxxxxx" required></label>
    <label class="f">الإيميل<input id="suEmail" type="email" autocomplete="username" required></label>
    <label class="f">كلمة السر (٨ حروف على الأقل)<input id="suPass" type="password" autocomplete="new-password" minlength="8" required></label>
    <div class="f">إيه الأيام اللي هتتمرن فيها؟<div class="scroller" id="suDays" role="group" aria-label="أيام التمرين">${SU_DAYS.map(d=>`<button type="button" class="chip" aria-pressed="false" data-d="${esc(d)}">${esc(d)}</button>`).join("")}</div></div>
    <label class="f">بتمشي كام خطوة في اليوم تقريباً؟<input id="suSteps" type="number" inputmode="numeric" min="0" max="60000" placeholder="مثلاً 6000"></label>
    ${plans.length?`<label class="f">العرض اللي مهتم بيه (اختياري)<select id="suPlan"><option value="">—</option>${plans.map(p=>`<option value="${esc(p.id)}">${esc(planTitle(p))}</option>`).join("")}</select></label>`:""}
    <p class="err" id="suErr"></p>
    <button class="btn primary block" type="submit" id="suBtn">إرسال الطلب</button>
  </form><div id="suDone" class="hidden"></div>`;
  box.dataset.done=1;
  box._plans=plans;
  $("#suDays").onclick=e=>{ const b=e.target.closest(".chip"); if(!b) return; const on=!b.classList.contains("on"); b.classList.toggle("on",on); b.setAttribute("aria-pressed",on); };
  $("#suForm").addEventListener("submit",submitSignup);
}

async function submitSignup(e){
  e.preventDefault();
  const err=m=>{ $("#suErr").textContent=m; }; err("");
  const name=$("#suName").value.trim(), phone=normPhone($("#suPhone").value), email=$("#suEmail").value.trim(), pass=$("#suPass").value;
  const days=[...document.querySelectorAll("#suDays .chip.on")].map(b=>b.dataset.d);
  const steps=num($("#suSteps").value);
  if(name.length<2) return err("اكتب اسمك");
  if(!phone) return err("رقم الواتساب مش صحيح");
  if(!/^\S+@\S+\.\S+$/.test(email)) return err("الإيميل مش صحيح");
  if(pass.length<8) return err("كلمة السر لازم ٨ حروف على الأقل");
  if(!days.length) return err("اختار أيام التمرين");
  if(steps!==null && (steps<0||steps>60000)) return err("عدد الخطوات مش منطقي");
  const planId=$("#suPlan")?.value||"", plan=($("#signupPane")._plans||[]).find(p=>p.id===planId)||null;
  const btn=$("#suBtn"); btn.disabled=true; btn.textContent="⏳ بيتم الإرسال…";
  const { data, error } = await sb.auth.signUp({ email, password:pass, options:{
    emailRedirectTo: location.origin+location.pathname,
    data:{ signup:true, signup_src:(localStorage.getItem("mofit_src")||null), full_name:name, phone, signup_days:days.join("،"), training_days:days.length, signup_steps:steps, signup_plan:plan?planTitle(plan):null } } });
  btn.disabled=false; btn.textContent="إرسال الطلب";
  if(error){ err(/registered|exists/i.test(error.message)?"الإيميل ده مسجل قبل كده – جرّب تسجيل الدخول":"حصلت مشكلة، جرّب تاني بعد شوية"); return; }
  // Supabase hides duplicate emails when confirmation is on: identities comes back empty
  if(data?.user && Array.isArray(data.user.identities) && !data.user.identities.length){ err("الإيميل ده مسجل قبل كده – جرّب تسجيل الدخول"); return; }
  try{ await sb.auth.signOut(); }catch(_){}
  const wa=waLink(`السلام عليكم كوتش 👋\nأنا ${name} وسجّلت طلب اشتراك في Mofit.\n📱 ${phone}\n📧 ${email}\n🗓 أيام التمرين: ${days.join("، ")}`+(steps?`\n👣 الخطوات: ${fmt(steps)}`:"")+(plan?`\n💰 العرض: ${planTitle(plan)}`:"")+`\n\nممكن تفاصيل الدفع؟`);
  $("#suForm").classList.add("hidden"); const d=$("#suDone"); d.classList.remove("hidden");
  d.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:42px">✅</div><h2>طلبك وصل</h2>
    <p class="hint">١) افتح الإيميل اللي بعتناه ليك وأكّد حسابك.<br>٢) كلّم الكوتش على واتساب لتفاصيل الاشتراك.<br>٣) أول ما الكوتش يفعّل حسابك تقدر تسجّل دخول.</p>
    <a class="btn primary block wa-btn" target="_blank" rel="noopener" href="${esc(wa)}">💬 كلّم الكوتش على واتساب</a></div>`;
}

/* ---------- coach: "طلبات جديدة" card on the clients page ---------- */
const _viewClientsBase = viewClients;
viewClients = async function(el){
  await _viewClientsBase(el);
  renderPending(el);
};
function renderPending(el){
  const P=(S.coachClients||[]).filter(c=>!c.active && c.signup_days);
  if(!P.length) return;
  const host=document.createElement("div"); host.className="card"; host.id="pending";
  host.innerHTML=`<div class="card-h"><div class="ic acc">🆕</div><h2>طلبات جديدة (${P.length})<small>اتأكد من الدفع الأول وبعدين فعّل</small></h2></div>`+P.map(c=>`
    <div class="item" style="padding:10px 0;border-top:1px solid rgba(148,163,184,.2)" data-id="${esc(c.id)}">
      <div class="nm"><b>${esc(c.full_name||c.email||"")}</b><small>📱 ${esc(c.phone||"")} · 🗓 ${esc(c.signup_days||"")}${c.signup_steps?` · 👣 ${esc(fmt(c.signup_steps))}`:""}${c.signup_plan?` · 💰 ${esc(c.signup_plan)}`:""}</small></div>
      <div class="row" style="margin-top:8px"><button class="btn primary grow" data-act="ok">✓ تفعيل</button>
      ${c.phone?`<a class="btn" target="_blank" rel="noopener" href="${esc(waLink("أهلاً "+(c.full_name||"")+" 👋 طلبك في Mofit وصل. تفاصيل الاشتراك والدفع:"))}">💬</a>`:""}
      <button class="btn danger" data-act="no">رفض</button></div></div>`).join("");
  const anchor=el.querySelector("#addBtn"); (anchor?anchor.after(host):el.prepend(host));
  host.onclick=async ev=>{
    const b=ev.target.closest("[data-act]"); if(!b) return; const row=b.closest("[data-id]"), id=row.dataset.id, c=P.find(x=>x.id===id); if(!c) return;
    if(b.dataset.act==="ok"){
      b.disabled=true; const { error } = await sb.from("profiles").update({active:true}).eq("id",id);
      if(error){ b.disabled=false; return toast(error.message); }
      toast("✓ اتفعّل – ابعت له رسالة ترحيب"); await loadClients(); render();
    } else {
      if(!confirm(`رفض طلب ${c.full_name||""} وحذف الحساب؟`)) return;
      const { data, error } = await sb.functions.invoke("coach-admin",{ body:{ action:"delete_client", user_id:id } });
      if(error) return toast("تعذر الحذف"); toast("اتحذف الطلب"); await loadClients(); render();
    }
  };
}

