/* Coach-only AI helpers (Groq via the ai-assist edge function). Hidden until the function reports configured.
   Privacy: client names never leave the browser; the digest sends pseudonyms C1..Cn plus stats.
   Nothing is sent automatically: drafts only fill the chat box, the coach edits and presses send. */
(function(){
const AI={ok:null,at:0};
async function call(body){const {data,error}=await sb.functions.invoke("ai-assist",{body});if(error){let m="";try{const j=await error.context.json();m=j.error||""}catch(_){}throw new Error(m||"ai")}return data}
/* cached for 60s either way: no repeat pings, but a transient error only hides features for a minute */
window.aiConfigured=async function(){if(S.me?.role!=="coach")return false;const now=Date.now();if(AI.ok!==null&&now-AI.at<60000)return AI.ok;AI.at=now;try{AI.ok=!!(await call({action:"status"})).configured}catch(_){AI.ok=false}return AI.ok};
const errTxt=e=>/rate/.test(e.message)?"الحد المجاني خلص دلوقتي، جرّب بعد دقيقة":"مقدرتش أجهّز، جرّب تاني";
const st=document.createElement("style");st.textContent=`
.aid-b{display:flex;gap:10px;align-items:center;justify-content:space-between}
.aid-run{border:0;border-radius:14px;padding:11px 16px;font:800 14px/1 inherit;color:#fff;background:linear-gradient(135deg,#FF5A0A,#FF8A3D 60%,#FFB347);box-shadow:0 8px 18px -8px rgba(255,90,10,.7);cursor:pointer}
.aid-run:disabled{opacity:.6}
.aid-sum{margin:12px 0 4px;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,rgba(255,90,10,.08),rgba(255,179,71,.12));font-size:14px;line-height:1.7}
.aid-it{display:flex;gap:10px;align-items:flex-start;padding:11px 0;border-top:1px solid var(--soft)}
.aid-it .av{flex:none}
.aid-it b{display:block;font-size:14px}.aid-it p{margin:3px 0 0;font-size:13px;color:var(--slate);line-height:1.6}
.aid-it .ac{color:var(--navy);font-weight:700}
.aid-dr{flex:none;border:1px solid var(--acc-line);background:var(--acc-soft);color:var(--acc);border-radius:12px;padding:8px 10px;font:700 12px/1 inherit;cursor:pointer}
.aid-note{font-size:11px;color:var(--slate);margin-top:8px}
.aid-chips{display:grid;gap:6px;padding:8px 12px 0}
.aid-chip{text-align:right;border:1px dashed #F97316;background:rgba(249,115,22,.07);border-radius:14px;padding:9px 12px;font-size:13px;line-height:1.55;color:inherit;cursor:pointer}
.aid-chip small{display:block;color:#F97316;font-weight:800;font-size:10.5px;margin-bottom:2px}
`;document.head.appendChild(st);
/* flags with the 🤖 icon are ai_flag alerts and contain client question text - never send them to Groq */
function payload(C,AL){const out=[],map={};C.filter(c=>c.active).slice(0,40).forEach((c,i)=>{const o=S.overview?.[c.id]||{},id="C"+(i+1);map[id]=c;
 out.push({id,week:currentWeek(c),goal:c.goal||"",level:c.level||"",adherence7:o.adherence7==null?null:+(+o.adherence7).toFixed(2),weights:(o.weights||[]).slice(-4).map(w=>+(+w[1]).toFixed(1)),days_since_start:c.start_date?daysBetween(c.start_date,today()):null,flags:(AL[c.id]||[]).filter(a=>a.icon!=="🤖").map(a=>a.text)})});return {out,map}}
window.aiDigestCard=async function(C,AL){const el=document.getElementById("aidg");if(!el)return;if(!(await aiConfigured()))return;
 el.hidden=false;el.innerHTML=`<div class="card-h"><div class="ic acc">🤖</div><h2>ملخص الأسبوع بالذكاء الاصطناعي<small>للكوتش بس، مفيش حاجة بتتبعت للعملاء</small></h2></div><div class="aid-b"><span class="hint" style="margin:0">اضغط يجهّز لك ملخص بوضع العملاء وإيه تعمله.</span><button type="button" class="aid-run" id="aidGo">جهّز الملخص</button></div><div id="aidOut"></div>`;
 document.getElementById("aidGo").onclick=async e=>{const b=e.currentTarget;b.disabled=true;b.textContent="بيجهّز…";const {out,map}=payload(C,AL);
  try{const r=await call({action:"digest",clients:out});const rows=(r.items||[]).filter(i=>map[i.id]);
   document.getElementById("aidOut").innerHTML=`<div class="aid-sum">${esc(r.summary||"")}</div>`+rows.map(i=>{const c=map[i.id];return `<div class="aid-it"><div class="av">${initials(c)}</div><div style="flex:1;min-width:0"><b>${esc(c.full_name||c.email)}</b><p>${esc(i.note)}</p>${i.action?`<p class="ac">← ${esc(i.action)}</p>`:""}</div><button type="button" class="aid-dr" data-c="${c.id}" data-n="${esc((i.note||"")+" "+(i.action||""))}">✉ مسودة</button></div>`}).join("")+`<p class="aid-note">ملخص مولّد بالذكاء الاصطناعي من أرقام العملاء بدون أسمائهم. راجعه قبل ما تتصرف.</p>`;
   document.querySelectorAll("#aidOut .aid-dr").forEach(x=>x.onclick=()=>aiDraftFor(C.find(c=>c.id===x.dataset.c),x.dataset.n));
  }catch(er){document.getElementById("aidOut").innerHTML=`<p class="hint">${esc(errTxt(er))}</p>`}b.disabled=false;b.textContent="جهّز من جديد"}};
async function aiDraftFor(c,ctx){await openChat(c.id,c.full_name||"العميل");aiSuggest(c.id,ctx)}
async function aiSuggest(cid,ctx,btn){const Q=document.getElementById("chatQ");if(!Q)return;btn&&(btn.disabled=true);Q.innerHTML=`<div class="aid-chips"><div class="hint" style="margin:0">⏳ بيكتب مسودات…</div></div>`;
 try{const {data}=await sb.from("messages").select("sender_role,body,created_at").eq("client_id",cid).order("created_at",{ascending:false}).limit(8);
  const msgs=(data||[]).reverse().filter(m=>m.body&&!/^\[(img|voice|image)/i.test(m.body)).map(m=>({from:m.sender_role==="coach"?"coach":"client",text:m.body}));
  const r=await call({action:"reply",messages:msgs,context:ctx||""});const ds=r.drafts||[];
  Q.innerHTML=ds.length?`<div class="aid-chips">${ds.map((d,i)=>`<button type="button" class="aid-chip" data-i="${i}"><small>مسودة ${i+1} · اضغط عشان تحطها في الشات</small>${esc(d)}</button>`).join("")}</div>`:`<div class="aid-chips"><div class="hint" style="margin:0">مفيش مسودات، جرّب تاني</div></div>`;
  Q.querySelectorAll(".aid-chip").forEach(x=>x.onclick=()=>{const i=document.getElementById("chatI");if(i){i.value=ds[+x.dataset.i];i.focus();i.dispatchEvent(new Event("input",{bubbles:true}))}Q.innerHTML=""});
 }catch(er){Q.innerHTML=`<div class="aid-chips"><div class="hint" style="margin:0">${esc(errTxt(er))}</div></div>`}btn&&(btn.disabled=false)}
window.aiChatHook=async function(cid){if(!(await aiConfigured()))return;const f=document.getElementById("chatF"),i=document.getElementById("chatI");if(!f||!i||document.getElementById("chatAi"))return;
 const b=document.createElement("button");b.type="button";b.className="cb";b.id="chatAi";b.title="اقترح رد";b.setAttribute("aria-label","اقترح رد بالذكاء الاصطناعي");b.textContent="✨";f.insertBefore(b,i);b.onclick=()=>aiSuggest(cid,"",b)};
/* coach admin view: read a client's AI conversation from the client card (RLS: coach select on ai_asks) */
window.aiClientCard=async function(p){const el=document.getElementById("aicH");if(!el)return;if(!(await aiConfigured()))return;
 const {data}=await sb.from("ai_asks").select("question,answer,kind,created_at").eq("user_id",p.id).order("created_at",{ascending:false}).limit(30);
 if(!data||!data.length)return;el.hidden=false;
 const when=t=>{try{return new Date(t).toLocaleString("ar-EG",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}catch(_){return""}};
 el.innerHTML=`<div class="card-h"><div class="ic acc">🤖</div><h2>محادثة العميل مع المساعد<small>آخر ${data.length} سؤال · قراءة للكوتش بس</small></h2></div><div class="aich-l" style="height:auto;max-height:380px">`+
  data.reverse().map(r=>`<div class="aich-m me"><p>${esc(r.question)}</p><small>${when(r.created_at)}</small></div><div class="aich-m ai${r.kind==="flag"?" esc":""}"><p>${esc(r.answer)}</p>${r.kind==="flag"?`<small>🔶 اتحوّل ليك</small>`:""}</div>`).join("")+`</div>`};
})();
