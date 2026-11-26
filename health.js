/* Mofit health sync: client consent + token + manual entry; coach sees only what the client shares (via coach_health RPC). */
const HS_TYPES=[["share_steps","👟","الخطوات"],["share_hr","❤️","نبض الراحة"]];

async function healthCardHTML(p){
  if(S.me?.role==="coach") return coachHealthHTML(p);
  const [c,d,t]=await Promise.all([
    sb.from("health_consent").select("*").eq("client_id",p.id).maybeSingle(),
    sb.from("health_data").select("log_date,steps,resting_hr,source").eq("client_id",p.id).order("log_date",{ascending:false}).limit(7),
    sb.from("health_tokens").select("created_at,last_used_at,revoked_at").eq("client_id",p.id).is("revoked_at",null).limit(1)
  ]);
  const con=c.data||{share_steps:false,share_hr:false}, rows=d.data||[], tok=(t.data||[])[0];
  return `<div class="card" id="hsCard"><div class="card-h"><div class="ic acc">🩺</div><h2>ربط الصحة<small>اختياري · أنت اللي بتقرر الكوتش يشوف إيه</small></h2></div>
    <p class="hint" style="margin:0 0 8px">الأرقام دي بتتسجل عندك بس. الكوتش مش بيشوف أي نوع غير اللي تفتحه تحت، وتقدر تقفله في أي وقت.</p>
    ${HS_TYPES.map(([k,ic,l])=>`<label class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--soft2)"><span>${ic} ${l} <small class="muted">${con[k]?"الكوتش بيشوفها":"الكوتش مش بيشوفها"}</small></span><input type="checkbox" data-hc="${k}" ${con[k]?"checked":""} style="width:auto;min-height:0"></label>`).join("")}
    <div class="card-h" style="margin-top:14px"><div class="ic">✍️</div><h2>سجّل يدوي<small>لو مش عايز تستخدم الاختصار</small></h2></div>
    <div class="grid3"><label class="f">التاريخ${djField(`<input type="date" id="hmD" value="${today()}" max="${today()}">`,today())}</label>
      <label class="f">خطوات<input inputmode="numeric" id="hmS" placeholder="8500"></label>
      <label class="f">نبض الراحة<input inputmode="numeric" id="hmH" placeholder="62"></label></div>
    <button class="btn primary block" id="hmSave">حفظ</button>
    ${rows.length?`<div style="margin-top:10px">${rows.map(r=>`<div class="row" style="justify-content:space-between;font-size:.85rem;padding:4px 0"><span class="num muted">${r.log_date}</span><span class="num">${r.steps!=null?"👟 "+fmt(r.steps):""} ${r.resting_hr!=null?"❤️ "+r.resting_hr:""}</span><small class="muted">${r.source==="shortcut"?"اختصار":"يدوي"}</small></div>`).join("")}</div>`:""}
    <div class="card-h" style="margin-top:14px"><div class="ic dark">🔗</div><h2>مزامنة تلقائية (Shortcuts)<small>${tok?"مفعّلة · آخر استخدام: "+(tok.last_used_at?new Date(tok.last_used_at).toLocaleDateString("ar-EG"):"لسه"):"مش مفعّلة"}</small></h2></div>
    <div class="row"><button class="btn sm navy" id="hsNew">${tok?"توكن جديد (يلغي القديم)":"إنشاء توكن"}</button>${tok?`<button class="btn sm danger" id="hsRev">إيقاف المزامنة</button>`:""}<button class="btn sm" id="hsGuide">📖 الشرح</button></div>
    <div id="hsTok"></div></div>`;
}

function wireHealth(p,redraw){
  const card=$("#hsCard"); if(!card) return;
  card.querySelectorAll("[data-hc]").forEach(i=>i.onchange=async()=>{
    const cur={share_steps:false,share_hr:false}; card.querySelectorAll("[data-hc]").forEach(x=>cur[x.dataset.hc]=x.checked);
    const { error } = await sb.from("health_consent").upsert({client_id:p.id,...cur,updated_at:new Date().toISOString()}); if(error){ i.checked=!i.checked; return toast("تعذر الحفظ"); }
    toast(i.checked?"✓ الكوتش هيشوفها":"✓ اتقفلت"); redraw();
  });
  $("#hmSave").onclick=async()=>{
    const s=num($("#hmS").value), h=num($("#hmH").value), d=$("#hmD").value;
    if(s==null&&h==null) return toast("اكتب الخطوات أو النبض");
    if(s!=null&&(s<0||s>100000||!Number.isInteger(s))) return toast("الخطوات غير منطقية");
    if(h!=null&&(h<25||h>220||!Number.isInteger(h))) return toast("النبض غير منطقي");
    const { data:old } = await sb.from("health_data").select("steps,resting_hr").eq("client_id",p.id).eq("log_date",d).maybeSingle();
    const { error } = await sb.from("health_data").upsert({client_id:p.id,log_date:d,steps:s??old?.steps??null,resting_hr:h??old?.resting_hr??null,source:"manual",updated_at:new Date().toISOString()}); if(error) return toast("تعذر الحفظ");
    if(h!=null && d===today()) localStorage.setItem("mofit_rhr_"+p.id,h);
    toast("✓ اتحفظ"); redraw();
  };
  $("#hsNew").onclick=async()=>{
    if($("#hsRev") && !confirm("التوكن القديم هيقف. تكمل؟")) return;
    const { data, error } = await sb.rpc("health_create_token"); if(error||!data) return toast("تعذر الإنشاء");
    let tk=data;
    $("#hsTok").innerHTML=`<div class="card" style="margin-top:8px;border:1px dashed var(--acc)"><b>التوكن بتاعك (بيظهر مرة واحدة بس)</b>
      <input readonly id="hsTv" value="${tk}" dir="ltr" style="margin-top:6px;font-size:.8rem" onclick="this.select()">
      <div class="row" style="margin-top:6px"><button class="btn sm navy" id="hsCp">📋 نسخ</button><button class="btn sm" id="hsHide">تم، اخفِه</button></div>
      <p class="hint">انسخه وحطه في الاختصار دلوقتي. ماتبعتوش لحد.</p></div>`;
    $("#hsCp").onclick=()=>navigator.clipboard.writeText(tk).then(()=>toast("✓ اتنسخ"));
    $("#hsHide").onclick=()=>{ tk=null; $("#hsTok").innerHTML=""; redraw(); };
  };
  if($("#hsRev")) $("#hsRev").onclick=async()=>{ if(!confirm("إيقاف المزامنة؟ التوكن هيتلغي.")) return; const { error } = await sb.rpc("health_revoke_tokens"); if(error) return toast("تعذر الإيقاف"); toast("✓ اتوقفت"); redraw(); };
  $("#hsGuide").onclick=()=>openSheet(`<div class="card-h"><div class="ic dark">📖</div><h2>إعداد الاختصار على الآيفون</h2></div>
    <ol class="hint" style="font-size:.88rem;line-height:1.9;padding-inline-start:18px;color:inherit">
    <li>اعمل توكن من الزرار اللي فوق وانسخه.</li>
    <li>افتح تطبيق <b>Shortcuts</b> ← اختصار جديد.</li>
    <li>أضف <b>Find Health Samples</b> (الخطوات، النهارده، مجموع) و<b>Find Health Samples</b> تاني (Resting Heart Rate، آخر عينة).</li>
    <li>أضف <b>Get Contents of URL</b> بالرابط:<br><code dir="ltr" style="word-break:break-all">${SUPABASE_URL}/rest/v1/rpc/health_ingest</code></li>
    <li>الطريقة <b>POST</b> والـ Request Body: <b>JSON</b> بالحقول: <code dir="ltr">p_token</code> (التوكن بتاعك) · <code dir="ltr">p_date</code> (تاريخ النهارده yyyy-MM-dd) · <code dir="ltr">p_steps</code> (رقم) · <code dir="ltr">p_hr</code> (رقم).</li>
    <li>Headers: <code dir="ltr">apikey</code> = المفتاح العام للتطبيق، و<code dir="ltr">Content-Type</code> = <code dir="ltr">application/json</code>.</li>
    <li>من <b>Automation</b> خليه يشتغل يومياً بالليل.</li></ol>
    <p class="hint">التوكن بيتبعت جوه الطلب نفسه مش في الرابط. لو اتسرّب اضغط «توكن جديد» أو «إيقاف المزامنة». المفتاح العام: <code dir="ltr" style="word-break:break-all">${SUPABASE_KEY}</code></p>
    <button class="btn block" data-close>إغلاق</button>`).querySelector("[data-close]").onclick=closeSheet;
}

async function coachHealthHTML(p){
  const [c,r]=await Promise.all([sb.from("health_consent").select("*").eq("client_id",p.id).maybeSingle(), sb.rpc("coach_health",{p_client:p.id,p_days:14})]);
  const con=c.data; const shared=con&&(con.share_steps||con.share_hr);
  const rows=(r.data||[]).sort((a,b)=>a.log_date<b.log_date?1:-1);
  return `<div class="card"><div class="card-h"><div class="ic acc">🩺</div><h2>الصحة (اللي العميل شاركه)<small>${shared?[con.share_steps?"الخطوات":null,con.share_hr?"نبض الراحة":null].filter(Boolean).join(" + "):"العميل مش مشارك أي بيانات"}</small></h2></div>
    ${rows.length?rows.map(x=>`<div class="row" style="justify-content:space-between;font-size:.85rem;padding:4px 0"><span class="num muted">${x.log_date}</span><span class="num">${x.steps!=null?"👟 "+fmt(x.steps):""} ${x.resting_hr!=null?"❤️ "+x.resting_hr:""}</span></div>`).join(""):emptyBox("🩺",shared?"مفيش أرقام لسه":"البيانات مش متشاركة",shared?"أول ما تتسجل خطوات أو نبض من الساعة هتظهر هنا.":"العميل لسه ماشاركش بيانات صحته معاك.","","es-sm")}</div>`;
}

async function drawHealth(p){
  const host=$("#hHealth"); if(!host) return;
  try{ host.innerHTML=await healthCardHTML(p); }catch(e){ host.innerHTML=""; return; }
  if(S.me?.role!=="coach") wireHealth(p,()=>drawHealth(p));
}
