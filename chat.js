/* ======================================================================
   Mofit — in-app chat between coach and client
   - Client: 💬 button opens the thread with the coach.
   - Coach: opens a client, taps the floating 💬 to chat; the clients page
     shows a card with unread messages.
   - Supabase table `messages` + realtime. Needs chat.sql run first.
   - Messages arrive live while the app is open (no push notifications yet).
   ====================================================================== */
const CHAT = { open:null, ch:null, unread:{}, started:false };

(function chatStyle(){
  const s=document.createElement("style");
  s.textContent=`
  .chat{display:flex;flex-direction:column;height:min(70vh,560px)}
  .chat-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 2px 10px}
  .chat-h b{font-size:17px}
  .chat-l{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:6px 2px;overscroll-behavior:contain}
  .msg{max-width:82%;padding:9px 12px;border-radius:16px;line-height:1.55;font-size:15px;word-break:break-word}
  .msg p{margin:0;white-space:pre-wrap}
  .msg small{display:block;margin-top:3px;font-size:11px;opacity:.65}
  .msg.me{align-self:flex-start;background:#F97316;color:#fff;border-bottom-right-radius:4px}
  .msg.them{align-self:flex-end;background:rgba(148,163,184,.18);border-bottom-left-radius:4px}
  .chat-day{align-self:center;font-size:11px;opacity:.6;margin:4px 0}
  .chat-empty{margin:auto;text-align:center;opacity:.7;padding:20px}
  .chat-f{display:flex;gap:8px;padding-top:10px}
  .chat-f input{flex:1}
  .msg.media{padding:5px}.msg.media small{padding:0 6px 2px}
  .cimg{display:block;max-width:100%;width:230px;max-height:300px;object-fit:cover;border-radius:12px;background:rgba(0,0,0,.1);min-height:90px;cursor:zoom-in}
  .cvoice{display:flex;align-items:center;gap:8px;padding:4px 6px;min-width:190px}
  .cplay{width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.28);color:inherit;font-size:13px;cursor:pointer}
  .msg.them .cplay{background:#F97316;color:#fff}
  .cbars{display:flex;align-items:center;gap:3px;height:26px;flex:1}.cbars i{display:block;width:3px;border-radius:2px;background:currentColor;opacity:.7;height:30%}
  .cbars i:nth-child(2n){height:70%}.cbars i:nth-child(3n){height:100%}.cbars i:nth-child(5n){height:45%}
  .cvoice.on .cbars i{animation:cbar .7s ease-in-out infinite}.cvoice.on .cbars i:nth-child(2n){animation-delay:.15s}.cvoice.on .cbars i:nth-child(3n){animation-delay:.3s}
  @keyframes cbar{50%{transform:scaleY(.35)}}
  .cvoice em{font-style:normal;font-size:12px;opacity:.8}
  .tick2{margin-inline-start:6px;letter-spacing:-2px;font-weight:700}.tick2.seen{color:#7DD3FC;opacity:1}
  .chat-q{display:flex;gap:6px;overflow-x:auto;padding:8px 0 2px;scrollbar-width:none}.chat-q::-webkit-scrollbar{display:none}
  .qr{flex:none;border:1.5px solid rgba(249,115,22,.4);background:rgba(249,115,22,.08);color:inherit;border-radius:99px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer;transition:transform .2s}.qr:active,.qr.pop{transform:scale(.92)}
  .chat-h a.btn{color:inherit;text-decoration:none}
  .cb{display:grid;place-items:center;flex:none;width:42px;height:42px;border-radius:14px;border:1.5px solid rgba(148,163,184,.4);background:transparent;font-size:18px;cursor:pointer}
  .chat-rec{display:flex;align-items:center;gap:8px;padding:8px 10px;margin-top:8px;border-radius:14px;background:rgba(239,68,68,.12)}.chat-rec.hidden{display:none}
  .recdot{width:10px;height:10px;border-radius:50%;background:#EF4444;animation:recp 1s ease-in-out infinite}@keyframes recp{50%{transform:scale(1.6);opacity:.4}}
  .recs{flex:1;font-size:12px;opacity:.75}
  .msg{animation:msgin .35s cubic-bezier(.2,1.4,.4,1) both}@keyframes msgin{from{opacity:0;transform:translateY(10px) scale(.92)}}
  @media(prefers-reduced-motion:reduce){.msg,.recdot,.cvoice.on .cbars i{animation:none}}
  #chatFab{position:fixed;right:14px;bottom:88px;z-index:40;width:52px;height:52px;border-radius:50%;border:0;background:#F97316;color:#fff;font-size:22px;box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:pointer}
  #chatFab .bdg{position:absolute;top:-4px;left:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#EF4444;color:#fff;font-size:12px;font-weight:700;line-height:20px}
  `;
  document.head.appendChild(s);
})();

const chatMine = () => S.me.role==="coach" ? "coach" : "client";
const chatTime = t => { try{ return new Date(t).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}); }catch(_){ return ""; } };
const chatDay = t => { try{ return new Date(t).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"}); }catch(_){ return ""; } };

const CHAT_URLS={};
async function chatUrl(path){ if(CHAT_URLS[path]) return CHAT_URLS[path]; const { data } = await sb.storage.from("checkins").createSignedUrl(path,3600); CHAT_URLS[path]=data?.signedUrl||""; return CHAT_URLS[path]; }
function chatTick(d,m){ let t=d.querySelector(".tick2"); if(m.sender_role!==chatMine()) return; if(!t){ t=document.createElement("span"); t.className="tick2"; d.querySelector("small").append(t); } t.textContent=m.read_at?"✓✓":"✓"; t.classList.toggle("seen",!!m.read_at); }
function chatBubble(m){
  const d=document.createElement("div"); d.className="msg "+(m.sender_role===chatMine()?"me":"them")+(m.kind&&m.kind!=="text"?" media":""); d.dataset.id=m.id;
  const sm=document.createElement("small"); sm.textContent=chatTime(m.created_at);
  if(m.kind==="image"){
    const img=document.createElement("img"); img.className="cimg"; img.alt="صورة"; img.loading="lazy"; d.append(img);
    chatUrl(m.media_path).then(u=>{ if(u){ img.src=u; img.onclick=()=>window.open(u,"_blank"); } });
  } else if(m.kind==="voice"){
    const w=document.createElement("div"); w.className="cvoice"; const b=document.createElement("button"); b.type="button"; b.className="cplay"; b.textContent="▶";
    const bars=document.createElement("span"); bars.className="cbars"; bars.innerHTML="<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
    const dur=document.createElement("em"); const sec=Math.max(1,Math.round((m.duration_ms||0)/1000)); dur.textContent=Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
    w.append(b,bars,dur); d.append(w); let a=null;
    b.onclick=async()=>{ if(!a){ const u=await chatUrl(m.media_path); if(!u) return toast("تعذر تشغيل الصوت"); a=new Audio(u); a.onended=()=>{b.textContent="▶";w.classList.remove("on");}; a.onpause=()=>{b.textContent="▶";w.classList.remove("on");}; a.onplay=()=>{b.textContent="❚❚";w.classList.add("on");}; }
      if(a.paused){ document.querySelectorAll(".cvoice.on .cplay").forEach(x=>x!==b&&x.click()); a.play().catch(()=>toast("تعذر تشغيل الصوت")); } else a.pause(); };
  } else { const p=document.createElement("p"); p.textContent=m.body; d.append(p); }
  d.append(sm); chatTick(d,m); return d;
}
function chatAppend(m){
  const L=document.getElementById("chatL"); if(!L || L.querySelector(`[data-id="${m.id}"]`)) return;
  L.querySelector(".chat-empty")?.remove();
  const day=chatDay(m.created_at); if(L.dataset.day!==day){ const h=document.createElement("div"); h.className="chat-day"; h.textContent=day; L.append(h); L.dataset.day=day; }
  L.append(chatBubble(m)); L.scrollTop=L.scrollHeight;
}
async function chatMarkRead(cid){
  const { error } = await sb.from("messages").update({read_at:new Date().toISOString()}).eq("client_id",cid).neq("sender_role",chatMine()).is("read_at",null);
  if(!error){ delete CHAT.unread[cid]; chatBadge(); }
}
function chatBadge(){
  const fab=document.getElementById("chatFab"); if(!fab) return;
  const n = S.me.role==="coach" ? (S.client ? (CHAT.unread[S.client.id]||0) : 0) : (CHAT.unread[S.me.id]||0);
  fab.querySelector(".bdg")?.remove();
  if(n>0){ const b=document.createElement("span"); b.className="bdg"; b.textContent=n>9?"9+":n; fab.append(b); }
}
function chatFabUpdate(){
  let fab=document.getElementById("chatFab");
  const show = !!S.me && !document.getElementById("appView").classList.contains("hidden") && (S.me.role!=="coach" || !!S.client);
  if(!show){ fab?.remove(); return; }
  if(!fab){ fab=document.createElement("button"); fab.id="chatFab"; fab.type="button"; fab.textContent="💬"; fab.setAttribute("aria-label","محادثة الكوتش");
    fab.onclick=()=> S.me.role==="coach" ? openChat(S.client.id, S.client.full_name||"العميل") : openChat(S.me.id,"الكوتش"); document.body.append(fab); }
  chatBadge();
}

async function openChat(clientId, title){
  chatStart(); CHAT.open=clientId;
  const wa = S.me.role!=="coach" && typeof waLink==="function" ? `<a class="btn" target="_blank" rel="noopener" href="${esc(waLink("السلام عليكم كوتش 👋"))}">واتساب</a>` : "";
  openSheet(`<div class="chat"><div class="chat-h"><b>💬 ${esc(title)}</b><div class="row">${wa}<button class="btn" type="button" id="chatX">إغلاق</button></div></div>
    <div class="chat-l" id="chatL" aria-live="polite"><div class="chat-empty">⏳ بيتحمل…</div></div>
    <div class="chat-q" id="chatQ"></div><div class="chat-rec hidden" id="chatRec"><span class="recdot"></span><b id="recT">0:00</b><span class="recs">بيسجّل… دوس ■ للإرسال</span><button class="btn" type="button" id="recX">إلغاء</button></div>
    <form class="chat-f" id="chatF" autocomplete="off"><button class="cb" type="button" id="chatCam" aria-label="صورة">📷</button><input type="file" id="chatFile" accept="image/*" hidden><input id="chatI" maxlength="2000" placeholder="اكتب رسالتك…" aria-label="رسالة"><button class="cb" type="button" id="chatMic" aria-label="تسجيل صوتي"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button><button class="btn primary" type="submit" id="chatSend">إرسال</button></form></div>`);
  $("#chatX").onclick=closeSheet;
  const { data, error } = await sb.from("messages").select("*").eq("client_id",clientId).order("created_at",{ascending:false}).limit(100);
  const L=$("#chatL"); if(!L || CHAT.open!==clientId) return;
  L.innerHTML="";
  if(error){ L.innerHTML=`<div class="chat-empty">تعذر تحميل الرسايل</div>`; return; }
  if(!data.length) L.innerHTML=`<div class="chat-empty">ابدأ المحادثة 👋<br><small>الرسايل بتوصل للكوتش مباشرة</small></div>`;
  data.reverse().forEach(chatAppend);
  chatMarkRead(clientId);
  const send=async(f)=>{ const { data:m, error:er } = await sb.from("messages").insert({client_id:clientId, sender_role:chatMine(), ...f}).select().single(); if(er){ toast("تعذر الإرسال، جرّب تاني"); return null; } chatAppend(m); return m; };
  $("#chatF").onsubmit=async e=>{
    e.preventDefault(); const i=$("#chatI"), body=i.value.trim(); if(!body) return;
    i.value=""; i.focus(); const m=await send({body}); if(!m) i.value=body;
  };
  const QR = S.me.role==="coach" ? ["برافو 🔥","كمّل كده 💪","ابعتلي فيديو التمرين","هراجع وأرد عليك"] : ["تمام 👍","هبعتلك صور النهارده 📸","عندي سؤال","مش هقدر أتمرن النهارده"];
  $("#chatQ").innerHTML=QR.map(q=>`<button type="button" class="qr">${esc(q)}</button>`).join("");
  $("#chatQ").querySelectorAll(".qr").forEach(b=>b.onclick=()=>{ b.classList.add("pop"); send({body:b.textContent}); });
  const upload=async(blob,ext,ct)=>{ const path=`${clientId}/chat/${Date.now()}.${ext}`; const { error } = await sb.storage.from("checkins").upload(path,blob,{contentType:ct,upsert:false}); if(error){ toast("تعذر رفع الملف"); return null; } return path; };
  $("#chatCam").onclick=()=>$("#chatFile").click();
  $("#chatFile").onchange=async e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return; toast("⏳ بيرفع الصورة…");
    try{ const bmp=await createImageBitmap(f); const r=Math.min(1,1280/Math.max(bmp.width,bmp.height)); const c=document.createElement("canvas"); c.width=Math.round(bmp.width*r); c.height=Math.round(bmp.height*r); c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
      const blob=await new Promise(ok=>c.toBlob(ok,"image/jpeg",.82)); const path=await upload(blob,"jpg","image/jpeg"); if(path) await send({kind:"image",media_path:path,body:"📷 صورة"}); }catch(_){ toast("الصورة دي مش مدعومة"); } };
  let rec=null, chunks=[], t0=0, tick=0, cancelled=false;
  const stopUi=()=>{ clearInterval(tick); $("#chatRec")?.classList.add("hidden"); $("#chatF")?.classList.remove("hide"); const mb=$("#chatMic"); if(mb) mb.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`; };
  $("#recX").onclick=()=>{ cancelled=true; try{rec.stop();}catch(_){} };
  $("#chatMic").onclick=async()=>{
    if(rec&&rec.state==="recording"){ rec.stop(); return; }
    if(!navigator.mediaDevices||!window.MediaRecorder) return toast("التسجيل الصوتي مش مدعوم هنا");
    try{ const st=await navigator.mediaDevices.getUserMedia({audio:true}); const mt=["audio/mp4","audio/webm;codecs=opus","audio/webm"].find(t=>MediaRecorder.isTypeSupported(t))||""; rec=new MediaRecorder(st,mt?{mimeType:mt}:{}); chunks=[]; cancelled=false;
      rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
      rec.onstop=async()=>{ st.getTracks().forEach(t=>t.stop()); const dur=Date.now()-t0; stopUi(); if(cancelled||dur<700) return; const type=rec.mimeType||mt||"audio/mp4"; const blob=new Blob(chunks,{type}); const ext=/mp4/.test(type)?"m4a":"webm"; toast("⏳ بيبعت الصوت…"); const path=await upload(blob,ext,type.split(";")[0]); if(path) await send({kind:"voice",media_path:path,duration_ms:dur,body:"🎤 رسالة صوتية"}); };
      rec.start(); t0=Date.now(); $("#chatRec").classList.remove("hidden"); $("#chatMic").textContent="■"; $("#recT").textContent="0:00"; tick=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); $("#recT").textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); },250);
    }catch(_){ toast("محتاج تسمح بالميكروفون"); } };
  setTimeout(()=>$("#chatI")?.focus(),50);
}

function chatIncoming(m){
  if(m.sender_role===chatMine()) return;                       // my own message, already shown
  if(CHAT.open===m.client_id && !$("#sheet").classList.contains("hidden")){ chatAppend(m); chatMarkRead(m.client_id); return; }
  CHAT.unread[m.client_id]=(CHAT.unread[m.client_id]||0)+1; chatBadge();
  toast("💬 رسالة جديدة"+(S.me.role==="coach"?"":" من الكوتش"));
  if(S.me.role==="coach" && S.tab==="clients" && !S.client) { try{ render(); }catch(_){} }
}

async function chatStart(){
  if(CHAT.started || !S.me) return; CHAT.started=true;
  const { data } = await sb.from("messages").select("client_id").is("read_at",null).neq("sender_role",chatMine()).limit(500);
  (data||[]).forEach(r=>{ CHAT.unread[r.client_id]=(CHAT.unread[r.client_id]||0)+1; });
  CHAT.ch = sb.channel("msgs-"+S.me.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},p=>chatIncoming(p.new)).on("postgres_changes",{event:"UPDATE",schema:"public",table:"messages"},p=>{ const m=p.new, el=document.querySelector(`#chatL [data-id="${m.id}"]`); if(el) chatTick(el,m); }).subscribe();
  chatBadge();
}

/* client header button used to open WhatsApp: now opens the in-app chat */
contactCoach = function(){ openChat(S.me.id,"الكوتش"); };

/* keep state clean when the sheet closes */
const _closeSheetBase = closeSheet;
closeSheet = function(){ CHAT.open=null; _closeSheetBase(); };

/* show/hide the floating button after every render, and start the live feed */
const _renderBase = render;
render = function(){ _renderBase.apply(this,arguments); if(S.me){ chatStart(); chatFabUpdate(); } };

/* coach clients page: unread card */
const _viewClientsChat = viewClients;
viewClients = async function(el){
  await _viewClientsChat(el);
  const ids=Object.keys(CHAT.unread).filter(k=>CHAT.unread[k]>0); if(!ids.length) return;
  const C=S.coachClients||[]; const host=document.createElement("div"); host.className="card"; host.id="chatUnread";
  host.innerHTML=`<div class="card-h"><div class="ic acc">💬</div><h2>رسائل جديدة</h2></div>`+ids.map(id=>{ const c=C.find(x=>x.id===id); return `<div class="item" style="padding:8px 0"><button type="button" class="btn block" data-cid="${esc(id)}">${esc(c?.full_name||c?.email||"عميل")} · ${esc(CHAT.unread[id])}</button></div>`; }).join("");
  host.onclick=e=>{ const b=e.target.closest("[data-cid]"); if(!b) return; const c=C.find(x=>x.id===b.dataset.cid); openChat(b.dataset.cid, c?.full_name||"العميل"); };
  const anchor=el.querySelector("#addBtn"); anchor?anchor.after(host):el.prepend(host);
};

