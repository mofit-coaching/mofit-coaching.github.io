/* Posing check-ins (private video bucket) + Peak week (coach-typed 7-day protocol, independent of diet plan/supplements). */
const POSE_MAX=50*1024*1024;
const PW_FIELDS=[["carbs","🍚 كارب","جم"],["water","💧 مياه","لتر"],["sodium","🧂 صوديوم","مجم"],["potassium","🍌 بوتاسيوم","مجم"],["magnesium","🥬 ماغنيسيوم","مجم"],["calcium","🥛 كالسيوم","مجم"],["zinc","🔩 زنك","مجم"]];
const PW_DAYS=["قبل العرض بـ 7 أيام","قبل بـ 6","قبل بـ 5","قبل بـ 4","قبل بـ 3","قبل بـ 2","قبل يوم (آخر يوم)"];
const poseUrls={};
async function poseUrl(path){ if(poseUrls[path]) return poseUrls[path]; const { data } = await sb.storage.from("posing").createSignedUrl(path,3600); poseUrls[path]=data?.signedUrl||""; return poseUrls[path]; }
const isCoachMe=()=>S.me?.role==="coach";

/* ---------------- posing ---------------- */
async function viewPosing(el){
  const p=S.client, coach=isCoachMe();
  el.innerHTML=emptyBox("⏳","جاري التحميل…","","","es-load es-sm");
  const { data, error } = await sb.from("posing_checkins").select("*").eq("client_id",p.id).order("created_at",{ascending:false});
  if(error){ el.innerHTML=emptyBox("⚠️","تعذر التحميل","جرّب تاني بعد شوية.","","es-sm"); return; }
  const rows=data||[];
  let annMap={};
  if(rows.length){ const { data:anns, error:ae } = await sb.from("posing_annotations").select("checkin_id,moments").in("checkin_id",rows.map(r=>r.id)); if(!ae) (anns||[]).forEach(a=>{ annMap[a.checkin_id]=a.moments||[]; }); }
  el.innerHTML=`${coach?"":`<div class="card"><div class="card-h"><div class="ic acc">🎬</div><h2>فيديو بوزينج جديد<small>خاص بينك وبين الكوتش بس · بيتصغّر تلقائياً قبل الرفع · أقصى حجم 50 ميجا · mp4 / mov / webm</small></h2></div>
      <label class="f">ملاحظة (اختياري)<input id="poN" placeholder="مثلاً: البوزات الإلزامية، إضاءة الجيم"></label>
      <input type="file" id="poF" accept="video/mp4,video/quicktime,video/webm" style="margin:8px 0">
      <div class="prog" id="poP" style="display:none"><i style="width:0%"></i></div>
      <button class="btn primary block" id="poGo">رفع للكوتش</button></div>`}
    <div id="poL">${rows.length?rows.map(r=>poseCard(r,coach,annMap[r.id])).join(""):emptyBox("🎬","لسه مفيش فيديوهات",coach?"العميل لسه مارفعش فيديوهات بوزينج.":"صوّر البوزات وارفعها من فوق عشان الكوتش يراجع وقفتك.")}</div>`;
  el.querySelectorAll("[data-pv]").forEach(async v=>{ const u=await poseUrl(v.dataset.pv); if(u){ v.src=u; } else v.replaceWith(Object.assign(document.createElement("p"),{className:"hint",textContent:"الفيديو مش متاح"})); });
  if(!coach){
    $("#poGo").onclick=async()=>{
      const f0=$("#poF").files[0]; if(!f0) return toast("اختار فيديو الأول");
      let f=f0;
      if(!/^video\//.test(f.type||"") && !/\.(mp4|mov|webm|m4v)$/i.test(f.name||"")) return toast("النوع ده مش مدعوم (mp4 / mov / webm)");
      const btn=$("#poGo"); btn.disabled=true; $("#poP").style.display="";
      if(f.size>6*1024*1024){
        btn.textContent="جاري تصغير الفيديو… سيب الشاشة مفتوحة"; const bar=$("#poP i");
        try{ if(!window.mlShrinkVideo) await new Promise((ok,no)=>{ const s=document.createElement("script"); s.src="videoshrink.js?v=1"; s.onload=ok; s.onerror=no; document.head.appendChild(s); }); }catch(e){}
        if(window.mlShrinkVideo) f=await mlShrinkVideo(f,x=>{ if(bar) bar.style.width=Math.round(x*100)+"%"; });
        if(bar) bar.style.width="0%";
      }
      if(f.size>POSE_MAX){ btn.disabled=false; btn.textContent="رفع للكوتش"; $("#poP").style.display="none"; return toast("الفيديو أكبر من 50 ميجا"); }
      const ext=(f.name.split(".").pop()||"mp4").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,5)||"mp4";
      const ct=f.type||(ext==="mov"?"video/quicktime":"video/mp4");
      if(!/^video\/(mp4|quicktime|webm)$/.test(ct)){ btn.disabled=false; btn.textContent="رفع للكوتش"; $("#poP").style.display="none"; return toast("النوع ده مش مدعوم (mp4 / mov / webm)"); }
      btn.textContent="جاري الرفع…";
      const path=`${p.id}/${Date.now()}.${ext}`;
      const { error:ue } = await sb.storage.from("posing").upload(path,f,{contentType:ct,upsert:false});
      if(ue){ btn.disabled=false; btn.textContent="رفع للكوتش"; $("#poP").style.display="none"; return toast("تعذر الرفع"); }
      const { error:ie } = await sb.from("posing_checkins").insert({client_id:p.id,note:$("#poN").value.trim()||null,video_path:path});
      if(ie){ await sb.storage.from("posing").remove([path]); btn.disabled=false; btn.textContent="رفع للكوتش"; return toast("تعذر الحفظ"); }
      toast("✓ اترفع للكوتش"); viewPosing(el);
    };
  }
  el.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=async()=>{
    if(!confirm("حذف الفيديو نهائياً؟")) return; const r=rows.find(x=>x.id===b.dataset.pdel);
    if(r.video_path) await sb.storage.from("posing").remove([r.video_path]);
    const { error } = await sb.from("posing_checkins").delete().eq("id",r.id); if(error) return toast("تعذر الحذف"); toast("✓ اتحذف"); viewPosing(el); });
  el.querySelectorAll("[data-pfb]").forEach(b=>b.onclick=async()=>{
    const t=el.querySelector(`[data-pft="${b.dataset.pfb}"]`).value.trim();
    const { error } = await sb.from("posing_checkins").update({coach_feedback:t||null,reviewed_at:new Date().toISOString()}).eq("id",b.dataset.pfb); if(error) return toast("تعذر الحفظ"); toast("✓ اتبعت للعميل"); viewPosing(el); });
  el.querySelectorAll("[data-pan]").forEach(b=>b.onclick=async()=>{
    const r=rows.find(x=>String(x.id)===b.dataset.pan); if(!r||!r.video_path) return;
    const u=await poseUrl(r.video_path); if(!u) return toast("الفيديو مش متاح");
    openAnnotateStudio(r,u,annMap[r.id]||[],()=>viewPosing(el));
  });
  el.querySelectorAll("[data-pav]").forEach(b=>b.onclick=async()=>{
    const r=rows.find(x=>String(x.id)===b.dataset.pav); if(!r||!r.video_path) return;
    const u=await poseUrl(r.video_path); if(!u) return toast("الفيديو مش متاح");
    openAnnotateViewer(r,u,annMap[r.id]||[]);
  });
}
function poseCard(r,coach,ann){
  const d=new Date(r.created_at).toLocaleDateString("ar-EG",{day:"numeric",month:"long"});
  const hasAnn=ann&&ann.length;
  return `<div class="card"><div class="card-h"><div class="ic">🎬</div><h2>${d}<small>${r.reviewed_at?"✅ الكوتش راجع":"⏳ مستني مراجعة الكوتش"}</small></h2>${coach?`<button class="btn sm" data-pan="${r.id}" title="ارسم وعلّق على الفيديو">🎯 تحليل${hasAnn?" ✓":""}</button>`:""}<button class="btn sm danger" data-pdel="${r.id}" title="حذف الفيديو من كل مكان">حذف</button></div>
    ${r.video_path?`<video data-pv="${esc(r.video_path)}" controls playsinline preload="metadata" style="width:100%;border-radius:14px;background:#000;max-height:60vh"></video>`:""}
    ${r.note?`<p class="hint">📝 ${esc(r.note)}</p>`:""}
    ${!coach&&hasAnn?`<button class="btn primary block" data-pav="${r.id}" style="margin:8px 0">🎯 شوف تحليل الكوتش بالرسم</button>`:""}
    ${coach?`<label class="f">ملاحظاتك للعميل<textarea data-pft="${r.id}" rows="3" placeholder="رأيك في البوزات، التحسينات…">${esc(r.coach_feedback||"")}</textarea></label><button class="btn primary block" data-pfb="${r.id}">حفظ وإرسال للعميل</button>`
      :(r.coach_feedback?`<div class="card" style="margin-top:8px;background:var(--acc-soft)"><b>رأي الكوتش</b><p style="margin:6px 0 0;white-space:pre-wrap">${esc(r.coach_feedback)}</p></div>`:"")}</div>`;
}

/* ---------------- peak week ---------------- */
async function viewPeak(el){
  const p=S.client, coach=isCoachMe();
  el.innerHTML=emptyBox("⏳","جاري التحميل…","","","es-load es-sm");
  const { data, error } = await sb.from("peak_week_plans").select("*").eq("client_id",p.id).maybeSingle();
  if(error){ el.innerHTML=emptyBox("⚠️","تعذر التحميل","جرّب تاني بعد شوية.","","es-sm"); return; }
  const days=Array.from({length:7},(_,i)=>({label:PW_DAYS[i],...((data?.days||[])[i]||{})}));
  if(!coach){
    if(!data) { el.innerHTML=emptyBox("🏁","خطة البيك ويك لسه","الكوتش لسه ما كتبش الخطة – هتظهر هنا أول ما تجهز."); return; }
    el.innerHTML=`<div class="card dark"><div class="card-h"><div class="ic acc">🏁</div><h2>بيك ويك${data.show_date?`<small>العرض: ${esc(data.show_date)}</small>`:""}</h2></div><p class="hint">الخطة دي من الكوتش بس. التزم بيها زي ما هي.</p></div>`+days.map(dayView).join("");
    return;
  }
  el.innerHTML=`<div class="card"><div class="card-h"><div class="ic acc">🏁</div><h2>بيك ويك<small>انت بتكتب الأرقام بنفسك · مستقلة عن الدايت والمكملات · العميل بيشوفها للقراءة بس</small></h2></div>
    <label class="f">تاريخ العرض<input type="date" id="pwD" value="${esc(data?.show_date||"")}"></label></div>
    ${days.map((d,i)=>`<div class="card" data-pwd="${i}"><div class="card-h"><div class="ic">${i+1}</div><h2><input data-k="label" value="${esc(d.label||"")}" style="font-weight:700"></h2></div>
      <div class="grid3">${PW_FIELDS.map(([k,l,u])=>`<label class="f">${l} <small class="muted">${u}</small><input data-k="${k}" value="${esc(d[k]||"")}" inputmode="decimal"></label>`).join("")}</div>
      <label class="f">🏋️ التمرين<input data-k="training" value="${esc(d.training||"")}"></label>
      <label class="f">📝 ملاحظات<textarea data-k="notes" rows="2">${esc(d.notes||"")}</textarea></label></div>`).join("")}
    <button class="btn primary block" id="pwSave">حفظ الخطة</button>`;
  $("#pwSave").onclick=async()=>{
    const out=[...el.querySelectorAll("[data-pwd]")].map(c=>{ const o={}; c.querySelectorAll("[data-k]").forEach(i=>{ const v=i.value.trim(); if(v) o[i.dataset.k]=v; }); return o; });
    const { error } = await sb.from("peak_week_plans").upsert({client_id:p.id,show_date:$("#pwD").value||null,days:out,updated_at:new Date().toISOString()},{onConflict:"client_id"});
    if(error) return toast("تعذر الحفظ"); toast("✓ اتحفظت الخطة");
  };
}
function dayView(d){
  const vals=PW_FIELDS.filter(([k])=>d[k]);
  return `<div class="card"><div class="card-h"><div class="ic">🗓</div><h2>${esc(d.label||"")}</h2></div>
    ${vals.length?`<div class="grid3">${vals.map(([k,l,u])=>`<div class="zone"><b>${l}</b><span class="num">${esc(d[k])} ${u}</span></div>`).join("")}</div>`:""}
    ${d.training?`<p style="margin:8px 0 0">🏋️ ${esc(d.training)}</p>`:""}${d.notes?`<p class="hint" style="white-space:pre-wrap">📝 ${esc(d.notes)}</p>`:""}</div>`;
}

