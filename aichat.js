/* ======================================================================
   Mofit - المساعد الذكي: the client AI assistant as its own tab/screen.
   - Nav button appears only after the ai-assist edge function answers the
     status ping as configured (S.aiOn gates the tab).
   - Answers are instant; risky/unsure questions escalate to the coach.
   - History: the client's own ai_asks rows (the coach has admin read
     access from the client card - ai.js aiClientCard).
   - Privacy: the edge function builds context server-side; no names sent.
   ====================================================================== */
(function(){
const AICH={configured:null,checkedAt:0};

async function aichCall(body){
  const { data, error } = await sb.functions.invoke("ai-assist",{ body });
  if(error){ let m=""; try{ const j=await error.context.json(); m=j.error||""; }catch(_){} throw new Error(m||"ai"); }
  return data;
}
/* cached for 60s either way: no repeat pings on every render, but a transient
   error only hides the tab for a minute, not the session */
window.aichConfigured=async function(){
  const now=Date.now();
  if(AICH.configured!==null && now-AICH.checkedAt<60000) return AICH.configured;
  AICH.checkedAt=now;
  try{ AICH.configured=!!(await aichCall({action:"status"})).configured; }
  catch(_){ AICH.configured=false; }
  return AICH.configured;
};

const aichErr=e=>/daily_cap/.test(e.message)?"وصلت للحد اليومي للمساعد (١٥ سؤال) – اسأل الكوتش او جرّب بكرة"
  :/rate/.test(e.message)?"المساعد مشغول دلوقتي، جرّب بعد دقيقة"
  :"مقدرتش أرد، جرّب تاني او اسأل الكوتش";

ICON.ai='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7z"/><path d="M18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/></svg>';

const st=document.createElement("style");
st.textContent=`
.aich-l{height:var(--aich-h,min(52vh,480px));overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:6px 2px;overscroll-behavior:contain}
.aich-m{max-width:85%;padding:9px 12px;border-radius:16px;line-height:1.6;font-size:14.5px;word-break:break-word}
.aich-m p{margin:0;white-space:pre-wrap}
.aich-m.me{align-self:flex-start;background:#F97316;color:#fff;border-bottom-right-radius:4px}
.aich-m.me small{display:block;margin-top:3px;font-size:10.5px;opacity:.75}
.aich-m.ai{align-self:flex-end;background:rgba(255,179,71,.14);border:1px solid rgba(255,179,71,.3);border-bottom-left-radius:4px}
.aich-m.ai small{display:block;margin-top:4px;font-size:10.5px;opacity:.6}
.aich-m.esc{background:rgba(255,179,71,.22);border-color:#FFB347}
.aich-m.esc small{color:#B45309;opacity:1;font-weight:700}
.aich-note{text-align:center;font-size:11px;opacity:.65;margin:2px 0 6px}
.aich-f{display:flex;gap:8px;padding-top:10px}
.aich-f input{flex:1}
.aich-hw{align-self:flex-end}
.aich-hand{font-size:13px;min-height:44px}
.aich-dots{display:inline-flex;gap:4px;padding:4px 2px}
.aich-dots i{width:6px;height:6px;border-radius:50%;background:#F97316;animation:aichd 1s ease-in-out infinite}
.aich-dots i:nth-child(2){animation-delay:.15s}.aich-dots i:nth-child(3){animation-delay:.3s}
@keyframes aichd{50%{opacity:.25}}
body.aich-typing .nav{display:none}
.aich-m{animation:aichin .3s ease both}
@keyframes aichin{from{opacity:0;transform:translateY(6px)}}
@media(prefers-reduced-motion:reduce){.aich-m{animation:none}.aich-dots i{animation:none;opacity:.5}}
`;document.head.appendChild(st);

function aichBubble(kind,text,when){
  const d=document.createElement("div");
  d.className="aich-m "+(kind==="me"?"me":"ai")+(kind==="flag"?" esc":"");
  const p=document.createElement("p"); p.textContent=text; d.append(p);
  const s=document.createElement("small");
  if(kind==="me"){ if(when) s.textContent=when; else return d; }
  else s.textContent=(kind==="flag"?"🔶 اتبعّت للكوتش – هيرد عليك في الشات":"المساعد الذكي · رد فوري، مش بديل عن الكوتش")+(when?" · "+when:"");
  d.append(s); return d;
}
function aichAppend(kind,text){
  const L=document.getElementById("aichL"); if(!L) return;
  L.querySelector(".chat-empty")?.remove();
  L.append(aichBubble(kind,text)); L.scrollTop=L.scrollHeight;
}
const aichWhen=t=>{ try{ return new Date(t).toLocaleString("ar-EG",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}); }catch(_){ return ""; } };

async function aichAsk(q){
  aichAppend("me",q);
  const L=document.getElementById("aichL");
  const t=document.createElement("div"); t.className="aich-m ai";
  t.innerHTML=`<span class="aich-dots"><i></i><i></i><i></i></span>`;
  L.append(t); L.scrollTop=L.scrollHeight;
  try{
    const r=await aichCall({action:"ask",question:q});
    t.remove();
    aichAppend(r.escalated?"flag":"ai",r.answer||"…");
    if(r.escalated) aichHand(q);
  }catch(e){
    t.remove();
    aichAppend("ai",aichErr(e));
    aichHand(q);
  }
}
/* hand-off: send the question to the coach chat (client's own chat, via messages RLS) */
function aichHand(q){
  const L=document.getElementById("aichL"); if(!L) return;
  const b=document.createElement("button"); b.type="button"; b.className="btn aich-hand";
  b.textContent="ابعت سؤالك للكوتش في الشات";
  b.onclick=async()=>{
    b.disabled=true;
    try{
      const { error } = await sb.from("messages").insert({client_id:S.me.id, sender_role:chatMine(), body:"(سؤال من المساعد الذكي) "+q});
      if(error) throw error;
      b.textContent="اتبعت للكوتش ✓ هيرد عليك في الشات";
    }catch(_){ b.disabled=false; b.textContent="مانفعش، جرّب تاني"; }
  };
  const w=document.createElement("div"); w.className="aich-hw"; w.append(b); L.append(w); L.scrollTop=L.scrollHeight;
}


/* fit the message list to the visible screen so the input and send button never sit under the floating nav or the Safari bar */
function aichFit(){
  const L=document.getElementById("aichL"); if(!L) return;
  const vv=window.visualViewport, vh=vv?vv.height:window.innerHeight;
  const nav=document.getElementById("nav"), typing=document.body.classList.contains("aich-typing");
  const navH=(!typing&&nav&&nav.offsetHeight)?nav.offsetHeight+26:12;
  let below=0; for(let n=L.nextElementSibling;n;n=n.nextElementSibling) below+=n.offsetHeight+10;
  const top=L.getBoundingClientRect().top+window.scrollY;
  const h=Math.max(140,Math.min(640,Math.round(vh-top-below-navH-14)));
  const atEnd=L.scrollHeight-L.scrollTop-L.clientHeight<80;
  L.style.setProperty("--aich-h",h+"px");
  if(atEnd) L.scrollTop=L.scrollHeight;
}
if(!window.__aichFit){
  window.__aichFit=1;
  const f=()=>requestAnimationFrame(aichFit);
  window.addEventListener("resize",f); window.addEventListener("orientationchange",f);
  if(window.visualViewport) window.visualViewport.addEventListener("resize",f);
  document.addEventListener("focusin",e=>{ if(e.target&&e.target.id==="aichI"){ document.body.classList.add("aich-typing"); f(); } });
  document.addEventListener("focusout",e=>{ if(e.target&&e.target.id==="aichI"){ document.body.classList.remove("aich-typing"); setTimeout(f,60); } });
}

/* the tab screen (registered in the render map in views.js) */
window.viewAiChat=async function(el){
  el.innerHTML=`<div class="card aich-card"><div class="card-h"><div class="ic acc">🤖</div><h2>المساعد الذكي<small>ردود فورية من برنامجك · متاح ٢٤ ساعة</small></h2></div>
    <div class="aich-l" id="aichL" aria-live="polite"><div class="chat-empty"><div class="sk-wrap" role="status" aria-label="بيتحمل"><i class="sk sk-b"></i><i class="sk sk-l m"></i><i class="sk sk-l s"></i></div></div></div>
    <p class="aich-note">المساعد مش بديل للطبيب ومش نصيحة طبية · الأسئلة الطبية أو الإصابات بتتحوّل للكوتش · الكوتش يقدر يشوف المحادثة دي</p>
    <div class="chat-q" id="aichChips"><button type="button" class="qr" data-q="عايز بديل لأكلة في نظامي">🍽 بديل أكل</button><button type="button" class="qr" data-q="اشرحلي فورم تمرين من برنامجي">🏋️ شرح تمرين</button><button type="button" class="qr" data-q="أنضبط جدول تمريني إزاي؟">🗓 جدول التمرين</button></div>
    <form class="aich-f" id="aichF" autocomplete="off"><input id="aichI" maxlength="600" placeholder="اسأل المساعد…" aria-label="سؤال للمساعد"><button class="btn primary" type="submit">إرسال</button></form></div>`;
  const L=document.getElementById("aichL");
  const { data } = await sb.from("ai_asks").select("question,answer,kind,created_at").order("created_at",{ascending:false}).limit(20);
  if(!document.getElementById("aichL")) return;
  const rows=(data||[]).reverse();
  if(!rows.length){
    L.innerHTML=`<div class="chat-empty">🤖<br>أهلاً بيك يا بطل! أنا مساعدك الذكي، موجود هنا ٢٤ ساعة 💪<br>اسألني عن أكلك أو تمرينك وهجاوبك على طول من برنامجك.<br><small style="opacity:.7">تنبيه: ده مساعد مش دكتور، وكلامه مش نصيحة طبية. لو سؤال طبي أو إصابة بحوّله للكوتش بنفسه.</small></div>`;
  } else {
    L.innerHTML=""; L.classList.add("bulk");
    rows.forEach(r=>{
      L.append(aichBubble("me",r.question,aichWhen(r.created_at)));
      L.append(aichBubble(r.kind==="flag"?"flag":"ai",r.answer));
    });
    L.classList.remove("bulk");
    /* entrance cascade: only the newest 10 bubbles animate, with a short stagger; the rest pop in instantly */
    const bb=[...L.querySelectorAll(".aich-m")], K=Math.max(0,bb.length-10);
    bb.forEach((b,i)=>{ if(i<K) b.classList.add("no-in"); else b.style.animationDelay=((i-K)*45)+"ms"; });
    L.scrollTop=L.scrollHeight;
  }
  requestAnimationFrame(aichFit); setTimeout(aichFit,350);
  document.getElementById("aichChips").querySelectorAll(".qr").forEach(c=>c.onclick=()=>{ const i=document.getElementById("aichI"); if(i){ i.value=c.dataset.q||c.textContent.trim(); i.focus(); } });
  document.getElementById("aichF").onsubmit=async e=>{
    e.preventDefault();
    const i=document.getElementById("aichI"), q=i.value.trim(); if(!q) return;
    const b=e.target.querySelector("button[type=submit]");
    i.value=""; i.disabled=true; b.disabled=true;
    await aichAsk(q);
    i.disabled=false; b.disabled=false; i.focus();
  };
};

/* reveal the nav tab once the function reports configured (checked after each render, 60s cache) */
const _renderAich=render;
render=function(){ _renderAich.apply(this,arguments);
  if(S.me && S.me.role!=="coach" && !S.aiOn && document.getElementById("nav")){
    aichConfigured().then(ok=>{ if(ok && !S.aiOn){ S.aiOn=true; render(); } });
  }
};
})();

