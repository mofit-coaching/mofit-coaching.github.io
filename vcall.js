/* ======================================================================
   MOFIT video-call button (vc-*): مكالمة فيديو لكل عميل بضغطة واحدة.
   - زر 📹 في ملف العميل (الهب) يفتح شيت فيها لينك المكالمة: ابدأ، ابعت
     في الشات، ابعت واتساب، انسخ.
   - زر 📹 في هيدر الشات (للكوتش) يبعت اللينك في المحادثة على طول.
   - اللينك غرفة Jitsi Meet مجانية: بتفتح في المتصفح، من غير تسجيل ولا
     تحميل تطبيق، ومن غير أي فلوس.
   - Bonus: أي لينك في الشات بقى قابل للضغط (linkify للرسايل النصية).
   Self-contained. Writes: messages insert فقط (زي أي رسالة كوتش).
   ====================================================================== */
(function(){
const CSS=`
.vc-link{display:flex;align-items:center;gap:8px;background:var(--soft2);border-radius:14px;padding:10px 12px;margin:10px 0;direction:ltr}
.vc-link span{flex:1;font-size:.78rem;font-weight:700;color:var(--slate);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vc-copy{flex:none;border:1.5px solid var(--soft);background:var(--card);border-radius:10px;padding:6px 12px;font-size:.74rem;font-weight:800;color:inherit;cursor:pointer;transition:transform .18s}
.vc-copy:active{transform:scale(.92)}
.vc-copy.ok{border-color:var(--good);color:var(--good);background:var(--good-soft)}
.vc-acts{display:grid;gap:8px}
.vc-acts .btn,.vc-acts a.btn{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;text-align:center}
.vc-hint{margin:10px 2px 0;font-size:.74rem;color:var(--slate);line-height:1.7}
.msg p a{color:inherit;font-weight:800;text-decoration:underline;word-break:break-all}
.vc-pop{animation:vcpop .5s cubic-bezier(.2,1.4,.4,1)}
@keyframes vcpop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1)}}
`;
const style=document.createElement("style"); style.textContent=CSS; document.head.appendChild(style);

function room(){
  const abc="abcdefghjkmnpqrstuvwxyz23456789"; let s="MOFIT-";
  for(let i=0;i<10;i++) s+=abc[Math.floor(Math.random()*abc.length)];
  return s;
}
function sendLink(c,url,onDone){
  const body=`🎥 مكالمة فيديو:\n${url}\nاضغط على اللينك وقت المكالمة — بيفتح من غير ما تحمّل أي حاجة.`;
  return sb.from("messages").insert({client_id:c.id,sender_role:chatMine(),body}).then(({error})=>{
    if(error){ toast("تعذر الإرسال، جرّب تاني"); return; }
    toast("✓ اللينك اتبعت في الشات"); if(onDone) onDone();
  });
}
window.vcallSheet=function(c){
  if(!c) return;
  const url="https://meet.jit.si/"+room();
  const first=(c.full_name||"").split(" ")[0]||"باشا";
  const wa=c.phone&&typeof normPhone==="function"?normPhone(c.phone):null;
  const body=openSheet(`<div class="between" style="margin-bottom:6px"><b>📹 مكالمة فيديو — ${esc(c.full_name||"العميل")}</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
    <p class="hint" style="margin:0 2px">اللينك ده غرفة مكالمة جديدة، صالح لمرة واحدة. ابعته للعميل بأي طريقة ودوس ابدأ.</p>
    <div class="vc-link"><span>${esc(url)}</span><button class="vc-copy" id="vcCopy" type="button">نسخ</button></div>
    <div class="vc-acts">
      <a class="btn primary block vc-pop" href="${esc(url)}" target="_blank" rel="noopener">🎥 ابدأ المكالمة دلوقتي</a>
      <button class="btn block" id="vcChat" type="button">💬 ابعت اللينك في الشات</button>
      ${wa?`<a class="btn block" href="https://wa.me/${wa}?text=${encodeURIComponent(`أهلاً ${first} 👋\n🎥 لينك مكالمة الفيديو بتاعتنا:\n${url}\nاضغط عليه وقت المكالمة — بيفتح من غير ما تحمّل أي حاجة.`)}" target="_blank" rel="noopener">📲 ابعته واتساب</a>`:""}
    </div>
    <p class="vc-hint">💡 المكالمة بتفتح في المتصفح على طول — مفيش تسجيل دخول ولا تحميل تطبيق ولا أي تكلفة.</p>`);
  body.querySelector("#vcCopy").onclick=e=>{
    const b=e.currentTarget;
    const done=()=>{ b.textContent="✓ اتنسخ"; b.classList.add("ok"); setTimeout(()=>{ b.textContent="نسخ"; b.classList.remove("ok"); },1600); };
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done,done);
    else done();
  };
  body.querySelector("#vcChat").onclick=e=>{
    const b=e.currentTarget; b.disabled=true;
    sendLink(c,url,()=>{ b.disabled=false; closeSheet(); });
  };
};

/* 📹 button in the client hub action row */
const _viewHubVC=typeof viewHub==="function"?viewHub:null;
if(_viewHubVC){
  viewHub=async function(el){
    const r=await _viewHubVC.apply(this,arguments);
    try{
      const row=el.querySelector(".hub .inb-a");
      if(row&&!row.querySelector(".vc-btn")&&S.client){
        const b=document.createElement("button");
        b.type="button"; b.className="btn sm vc-btn"; b.innerHTML="📹 فيديو";
        b.onclick=()=>vcallSheet(S.client);
        row.appendChild(b);
      }
    }catch(e){ console.warn(e); }
    return r;
  };
}

/* 📹 button in the chat header (coach side): sends the link straight into the thread */
const _openChatVC=typeof openChat==="function"?openChat:null;
if(_openChatVC){
  openChat=async function(clientId,title){
    const r=await _openChatVC.apply(this,arguments);
    try{
      if(S.me?.role==="coach"){
        const h=document.querySelector("#sheetBody .chat-h");
        if(h&&!h.querySelector(".vc-chatbtn")){
          const b=document.createElement("button");
          b.type="button"; b.className="btn vc-chatbtn"; b.style.flex="none"; b.title="مكالمة فيديو"; b.setAttribute("aria-label","مكالمة فيديو"); b.textContent="📹";
          b.onclick=()=>{
            const c=(S.coachClients||[]).find(x=>x.id===clientId);
            if(!c) return;
            b.disabled=true; const url="https://meet.jit.si/"+room();
            sendLink(c,url,()=>{ b.disabled=false; });
          };
          const wa=h.querySelector("a.btn"); if(wa) h.insertBefore(b,wa); else h.appendChild(b);
        }
      }
    }catch(e){ console.warn(e); }
    return r;
  };
}

/* linkify: any URL in a text bubble becomes tappable (coach + client) */
const URL_RE=/(https?:\/\/[^\s<>"()]+[^\s<>"().,،؛:!?])/g;
function linkifyP(p){
  if(!p||p.dataset.lf) return;
  const t=p.textContent||"";
  if(!URL_RE.test(t)) return;
  URL_RE.lastIndex=0;
  p.dataset.lf="1"; p.textContent="";
  let last=0, m;
  while((m=URL_RE.exec(t))){
    if(m.index>last) p.appendChild(document.createTextNode(t.slice(last,m.index)));
    const a=document.createElement("a");
    a.href=m[0]; a.textContent=m[0]; a.target="_blank"; a.rel="noopener"; a.dir="ltr";
    p.appendChild(a);
    last=m.index+m[0].length;
  }
  if(last<t.length) p.appendChild(document.createTextNode(t.slice(last)));
}
const _chatAppendVC=typeof chatAppend==="function"?chatAppend:null;
if(_chatAppendVC){
  chatAppend=function(m){
    const r=_chatAppendVC.apply(this,arguments);
    try{
      const L=document.getElementById("chatL");
      const el=L&&L.querySelector(`[data-id="${m.id}"]`);
      const p=el&&el.querySelector("p");
      if(p) linkifyP(p);
    }catch(_){ }
    return r;
  };
}
})();
