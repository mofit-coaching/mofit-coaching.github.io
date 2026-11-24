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
  #chatFab{position:fixed;right:14px;bottom:88px;z-index:40;width:52px;height:52px;border-radius:50%;border:0;background:#F97316;color:#fff;font-size:22px;box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:pointer}
  #chatFab .bdg{position:absolute;top:-4px;left:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#EF4444;color:#fff;font-size:12px;font-weight:700;line-height:20px}
  `;
  document.head.appendChild(s);
})();

const chatMine = () => S.me.role==="coach" ? "coach" : "client";
const chatTime = t => { try{ return new Date(t).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}); }catch(_){ return ""; } };
const chatDay = t => { try{ return new Date(t).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"}); }catch(_){ return ""; } };

function chatBubble(m){
  const d=document.createElement("div"); d.className="msg "+(m.sender_role===chatMine()?"me":"them"); d.dataset.id=m.id;
  const p=document.createElement("p"); p.textContent=m.body; const sm=document.createElement("small"); sm.textContent=chatTime(m.created_at);
  d.append(p,sm); return d;
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
    <form class="chat-f" id="chatF" autocomplete="off"><input id="chatI" maxlength="2000" placeholder="اكتب رسالتك…" aria-label="رسالة"><button class="btn primary" type="submit">إرسال</button></form></div>`);
  $("#chatX").onclick=closeSheet;
  const { data, error } = await sb.from("messages").select("*").eq("client_id",clientId).order("created_at",{ascending:false}).limit(100);
  const L=$("#chatL"); if(!L || CHAT.open!==clientId) return;
  L.innerHTML="";
  if(error){ L.innerHTML=`<div class="chat-empty">تعذر تحميل الرسايل</div>`; return; }
  if(!data.length) L.innerHTML=`<div class="chat-empty">ابدأ المحادثة 👋<br><small>الرسايل بتوصل للكوتش مباشرة</small></div>`;
  data.reverse().forEach(chatAppend);
  chatMarkRead(clientId);
  $("#chatF").onsubmit=async e=>{
    e.preventDefault(); const i=$("#chatI"), body=i.value.trim(); if(!body) return;
    i.value=""; i.focus();
    const { data:m, error:er } = await sb.from("messages").insert({client_id:clientId, sender_role:chatMine(), body}).select().single();
    if(er){ i.value=body; return toast("تعذر الإرسال، جرّب تاني"); }
    chatAppend(m);
  };
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
  CHAT.ch = sb.channel("msgs-"+S.me.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},p=>chatIncoming(p.new)).subscribe();
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
