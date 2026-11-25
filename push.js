/* ======================================================================
   WEB PUSH (ph-*) - timed permission ask + subscription sync.
   - Shows a payoff-first ask card on the home screen once per device
     (20s after the home view renders), for coach and clients alike.
     "لاحقاً" snoozes for 3 days; enabling never asks again.
   - iOS: push needs the PWA installed to the home screen first - the
     card then explains the install instead of asking for permission.
   - Denied permission is never re-asked: in-app surfaces stay the
     fallback. Granted permission re-syncs the subscription silently.
   - window.pushTest() pushes the signed-in user's OWN devices only
     (demo testing path; never touches other users).
   ====================================================================== */
(function(){
const CSS=`
.ph-card{position:relative;margin:0 0 14px;padding:14px 14px 12px;border-radius:18px;
  background:linear-gradient(160deg,#141E33 0%,#0F1830 100%);
  border:1px solid rgba(255,138,61,.35);box-shadow:0 10px 28px rgba(0,0,0,.35)}
.ph-card h3{margin:0 0 4px;font-family:"Noto Kufi Arabic",sans-serif;font-size:16px;color:#FFB35C}
.ph-card p{margin:0 0 10px;font-size:13px;line-height:1.7;color:#C7D2E8}
.ph-row{display:flex;gap:8px}
.ph-btn{flex:1;padding:10px 12px;border-radius:12px;border:0;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer}
.ph-yes{background:linear-gradient(135deg,#FF8A3D,#F97316);color:#1A0E05;box-shadow:0 4px 14px rgba(249,115,22,.35)}
.ph-no{background:rgba(148,163,184,.12);color:#94A3B8;font-weight:600}
`;
const style=document.createElement("style"); style.textContent=CSS; document.head.appendChild(style);

const LSK="mofit_push_ask_v1";           // {ans:"yes"|"later", at:epoch}
const SNOOZE=3*24*3600*1000, DELAY=20000;

const ios=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone=()=>navigator.standalone===true||matchMedia("(display-mode: standalone)").matches;
const supported=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;

function askState(){
  try{ const v=JSON.parse(localStorage.getItem(LSK)||"null");
    if(!v) return "new";
    if(v.ans==="yes") return "done";
    if(v.ans==="later"&&Date.now()-(v.at||0)<SNOOZE) return "snoozed";
  }catch(e){}
  return "new";
}
function mark(ans){ try{ localStorage.setItem(LSK,JSON.stringify({ans,at:Date.now()})); }catch(e){} }

function b64ToU8(b64){
  const s=b64.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-b64.length%4)%4);
  const raw=atob(s); const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
  return out;
}

async function syncSubscription(){
  try{
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub){
      const {data}=await sb.functions.invoke("send-push",{body:{action:"vapid_public"}});
      if(!data||!data.configured) return false;
      sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToU8(data.publicKey)});
    }
    const j=sub.toJSON(), uid=S.me&&(S.me.id||S.me.user_id);
    if(!uid||!j.endpoint||!j.keys) return false;
    const {error}=await sb.from("push_subscriptions").upsert({
      user_id:uid, endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth,
      user_agent:navigator.userAgent.slice(0,200), last_seen_at:new Date().toISOString()
    },{onConflict:"endpoint"});
    return !error;
  }catch(e){ return false; }
}

async function enable(btn){
  if(btn){ btn.disabled=true; btn.textContent="لحظة..."; }
  try{
    if(ios()&&!standalone()){
      toast("على الآيفون: ثبّت التطبيق الأول من زرار مشاركة في سفاري ← إضافة إلى الشاشة الرئيسية");
      mark("later"); removeCard(); return;
    }
    const perm=await Notification.requestPermission();
    if(perm!=="granted"){ mark("later"); removeCard(); return; }
    mark("yes"); removeCard();
    const ok=await syncSubscription();
    toast(ok?"تمام! الإشعارات اشتغلت 🔔":"الإشعارات اتفعلت بس حصلت مشكلة في الحفظ - هنحاول تاني لوحدها");
  }catch(e){
    mark("later"); removeCard();
  }
}

let cardEl=null, homeEl=null;
function removeCard(){ if(cardEl){ cardEl.remove(); cardEl=null; } }
function showCard(){
  if(cardEl||document.querySelector(".ph-card")||!homeEl) return;
  if(!supported()||Notification.permission!=="default"||askState()!=="new") return;
  const coach=S.me&&S.me.role==="coach";
  const card=document.createElement("div");
  card.className="ph-card";
  card.innerHTML=coach
    ?`<h3>فعّل الإشعارات 🔔</h3>
      <p>توصلك رسالة لحظية لما أي عميل يبعتلك في الشات، حتى والتطبيق مقفول.</p>
      <div class="ph-row"><button class="ph-btn ph-yes" id="phYes">فعّلها</button>
      <button class="ph-btn ph-no" id="phNo">لاحقاً</button></div>`
    :`<h3>ماتفوتكش حاجة 🔔</h3>
      <p>إشعار لما الليج يبدأ وبتفاصيل الجوايز، لما الكوتش يرد عليك، وفتار لو يوم فاتك من غير ما تسجل.</p>
      <div class="ph-row"><button class="ph-btn ph-yes" id="phYes">فعّل الإشعارات</button>
      <button class="ph-btn ph-no" id="phNo">لاحقاً</button></div>`;
  const host=homeEl.querySelector(".lg-card");
  if(host&&host.parentNode) host.after(card); else homeEl.prepend(card);
  cardEl=card;
  card.querySelector("#phYes").onclick=e=>enable(e.target);
  card.querySelector("#phNo").onclick=()=>{ mark("later"); removeCard(); };
}

let timer=null;
function scheduleAsk(){
  clearTimeout(timer);
  timer=setTimeout(()=>{ if(S.tab==="home"||!S.tab) showCard(); },DELAY);
}

/* boot: hook the home render, and silently sync when already granted */
if(typeof viewHome==="function"&&!viewHome._ph){
  const _vh=viewHome;
  viewHome=async function(el){
    await _vh(el);
    homeEl=el;
    if(!S.me||!supported()) return;
    if(Notification.permission==="granted"){ mark("yes"); syncSubscription(); return; }
    scheduleAsk();
  };
  viewHome._ph=1;
}

/* demo testing: push the signed-in user's OWN devices only */
window.pushTest=async function(){
  const r=await sb.functions.invoke("send-push",{body:{action:"test"}});
  if(r.error){ toast("الإشعار التجريبي فشل"); return r; }
  if(r.data&&r.data.error){ toast("فشل: "+r.data.error); return r; }
  toast("اتبعت الإشعار التجريبي 🔔");
  return r;
};
})();
