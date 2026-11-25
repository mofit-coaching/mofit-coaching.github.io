/* Mofit Google Health connect (gh-*). Steps auto-sync for Android/Google clients.
   Feature lights up only when the health-sync edge function reports configured
   (identity sets GHEALTH_CLIENT_ID/SECRET after Mohammed's Google Cloud setup).
   Platform-aware: Android/other get the Google connect; iPhone gets its own
   card in the Shortcut phase. APIs:
     window.ghRenderStepsSlot(slot, p, refresh)  — habits view, next to steps field
     window.ghRenderHomeCard(slot, p, refresh)   — client home, prominent card */
(function(){

const css=`
.gh-box{margin-top:12px;border-radius:14px;padding:11px 12px;font-size:12.5px;line-height:1.7}
.gh-box.off{border:1.5px dashed rgba(15,23,42,.18);background:linear-gradient(135deg,#F8FAFF,#EFF4FF)}
.gh-box.on{border:1px solid rgba(34,197,94,.4);background:linear-gradient(135deg,#F0FDF4,#ECFDF5)}
.gh-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid #D5DEEF;background:#fff;font:800 13px/1 inherit;color:var(--navy);cursor:pointer;transition:.2s}
.gh-btn:active{transform:scale(.985)}
.gh-btn .g{display:inline-grid;place-items:center;width:20px;height:20px}
.gh-hint{margin:7px 2px 0;font-size:11px;color:var(--slate)}
.gh-row{display:flex;align-items:center;gap:8px}
.gh-row .dot{flex:0 0 8px;width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.2)}
.gh-row b{flex:1;font-size:12.5px;color:#14532D}
.gh-un{border:0;background:none;color:var(--slate);font:700 11px/1 inherit;text-decoration:underline;cursor:pointer;padding:4px}
.gh-sync{display:block;margin-top:4px;font-size:10.5px;color:#166534}
.gh-code{display:inline-flex;align-items:center;gap:8px;margin:8px 0;padding:7px 12px;border-radius:10px;background:#0F172A;color:#fff;font:800 14px/1.2 "SF Mono",monospace;letter-spacing:1px;cursor:pointer;border:0}
.gh-code small{font:700 10px/1 Cairo,sans-serif;color:#94A3B8;letter-spacing:0}
.gh-ios-steps{margin:10px 0 0;padding:0;list-style:none;counter-reset:gh}
.gh-ios-steps li{counter-increment:gh;position:relative;padding:6px 30px 6px 0;font-size:12.5px;line-height:1.7;color:var(--navy)}
.gh-ios-steps li:before{content:counter(gh);position:absolute;inset-inline-start:0;top:7px;width:20px;height:20px;border-radius:50%;background:#F97316;color:#fff;font:800 11px/20px inherit;text-align:center}
.gh-ios-steps.on li{color:#E2E8F0}
.gh-link-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 14px;border-radius:11px;border:0;background:#F97316;color:#fff;font:800 12.5px/1 inherit;cursor:pointer;text-decoration:none}
.lt{direction:ltr;unicode-bidi:isolate}
.gh-auto{margin-top:12px;border-top:1px dashed #CBD5E1;padding-top:10px}
.gh-auto>b{display:block;font-size:12.5px;margin-bottom:2px}
.gh-st{margin:10px 0;display:flex;gap:10px;align-items:flex-start}
.gh-st>i{flex:none;width:20px;height:20px;border-radius:50%;background:#F97316;color:#fff;font:800 11px/20px inherit;text-align:center;font-style:normal;margin-top:2px}
.gh-st p{margin:0 0 6px;font-size:12.5px;line-height:1.7}
.gh-mk{direction:ltr;text-align:left;border-radius:14px;background:#0F172A;color:#E2E8F0;padding:10px;font:600 12px/1.3 -apple-system,"SF Pro Text",Helvetica,sans-serif;max-width:260px;border:1px solid #1E293B}
.gh-mk .r{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:9px;background:#1E293B;margin-top:5px}
.gh-mk .r.hl{outline:2px solid #F97316;background:#2A1B10}
.gh-mk .tb{display:flex;justify-content:space-around;border-top:1px solid #334155;margin-top:8px;padding-top:7px;font-size:10.5px;color:#94A3B8}
.gh-mk .tb .hl{color:#F97316;font-weight:800}
.gh-mk .plus{width:26px;height:26px;border-radius:50%;background:#F97316;color:#fff;font:800 18px/26px inherit;text-align:center;margin-left:auto;outline:2px solid #FDBA74;outline-offset:2px}
.gh-mk .tg{width:34px;height:20px;border-radius:12px;background:#475569;position:relative}
.gh-mk .tg:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff}
.gh-mk .big{font:800 30px/1 -apple-system,Helvetica,sans-serif;text-align:center;color:#fff;padding:6px 0;letter-spacing:1px}
.gh-mk .sm{font-size:10px;color:#94A3B8}
.gh-mk .ok{color:#F97316;font-weight:800}
.gh-note{font-size:10.5px;color:var(--slate);margin-top:8px}
.gh-hero .gh-note{color:#94A3B8}
.gh-hero{margin-bottom:14px;border-radius:18px;padding:16px;color:#fff;background:linear-gradient(135deg,#0F172A,#1E293B);position:relative;overflow:hidden}
.gh-hero:before{content:"";position:absolute;inset-inline-end:-40px;top:-40px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.35),transparent 70%)}
.gh-hero h3{margin:0 0 4px;font-size:15px;font-weight:900}
.gh-hero p{margin:0 0 12px;font-size:12px;line-height:1.7;color:#CBD5E1}
.gh-hero-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px 16px;border-radius:13px;border:0;background:#fff;color:#0F172A;font:900 14px/1 inherit;cursor:pointer;transition:.2s;box-shadow:0 6px 16px rgba(0,0,0,.25)}
.gh-hero-btn:active{transform:scale(.98)}
.gh-hero-btn .g{display:inline-grid;place-items:center;width:20px;height:20px}
.gh-strip{margin-bottom:14px;border-radius:14px;padding:10px 12px;border:1px solid rgba(34,197,94,.4);background:linear-gradient(135deg,#F0FDF4,#ECFDF5)}
.gh-run{margin-top:10px;border-top:1px dashed #CBD5E1;padding-top:10px}
.gh-run>b{display:block;font-size:12px;margin-bottom:6px}
.gh-run-btn{width:100%;text-align:center}
.gh-hero .gh-run{border-top-color:#334155}
.gh-hero .gh-run>b{color:#E2E8F0}
.gh-re{display:inline-flex;align-items:center;gap:5px;flex:none;border:1px solid rgba(34,197,94,.45);background:#fff;color:#15803D;font:800 11px/1 inherit;padding:6px 10px;border-radius:9px;cursor:pointer;transition:.2s}
.gh-re:active{transform:scale(.96)}
.gh-re:disabled{opacity:.55;cursor:default}
.gh-re svg{width:12px;height:12px}
.gh-re.spin svg{animation:ghspin .8s linear infinite}
@keyframes ghspin{to{transform:rotate(360deg)}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const FN=()=>SUPABASE_URL+"/functions/v1/health-sync";
const G_SVG='<svg class="g" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.2h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.2-7-5.1l-3.9 3C3.2 21.3 7.3 24 12 24z"/><path fill="#FBBC05" d="M5 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-3.9-3C.4 8.2 0 10 0 12s.4 3.8 1.1 5.3l3.9-3z"/><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.1 6.7l3.9 3c1-2.9 3.8-5 7-5z"/></svg>';
const RE_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>';
const SCOPE="https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";

function platform(){
  const ua=navigator.userAgent||"";
  if(/android/i.test(ua)) return "android";
  if(/iphone|ipad|ipod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)) return "ios";
  return "other";
}

async function token(){ try{ const {data}=await sb.auth.getSession(); return data?.session?.access_token||""; }catch(_){ return ""; } }
async function call(action,body){
  const t=await token(); if(!t) throw new Error("auth");
  const r=await fetch(FN(),{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({action,...body})});
  const j=await r.json().catch(()=>({})); if(!r.ok) throw Object.assign(new Error(j.error||"fail"),{code:j.error}); return j;
}
function loadGis(){ return new Promise((res,rej)=>{
  if(window.google&&google.accounts&&google.accounts.oauth2) return res();
  const s=document.createElement("script"); s.src="https://accounts.google.com/gsi/client";
  s.onload=()=>res(); s.onerror=()=>rej(new Error("gis")); document.head.appendChild(s);
}); }

async function state(p){
  let cfg=null;
  try{ cfg=await call("status"); }catch(_){ return null; }       /* dark when not deployed */
  if(!cfg||!cfg.configured||!cfg.client_id) return null;
  let conn=null;
  try{ const {data}=await sb.from("health_connections").select("last_sync_at,connected_at").eq("user_id",p.id).maybeSingle(); conn=data; }catch(_){}
  return {cfg,conn};
   Feature lights up only when the health-sync edge function reports configured
   (identity sets GHEALTH_CLIENT_ID/SECRET after Mohammed's Google Cloud setup).
   Platform-aware: Android/other get the Google connect; iPhone gets its own
   card in the Shortcut phase. APIs:
     window.ghRenderStepsSlot(slot, p, refresh)  — habits view, next to steps field
     window.ghRenderHomeCard(slot, p, refresh)   — client home, prominent card */
(function(){

const css=`
.gh-box{margin-top:12px;border-radius:14px;padding:11px 12px;font-size:12.5px;line-height:1.7}
.gh-box.off{border:1.5px dashed rgba(15,23,42,.18);background:linear-gradient(135deg,#F8FAFF,#EFF4FF)}
.gh-box.on{border:1px solid rgba(34,197,94,.4);background:linear-gradient(135deg,#F0FDF4,#ECFDF5)}
.gh-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid #D5DEEF;background:#fff;font:800 13px/1 inherit;color:var(--navy);cursor:pointer;transition:.2s}
.gh-btn:active{transform:scale(.985)}
.gh-btn .g{display:inline-grid;place-items:center;width:20px;height:20px}
.gh-hint{margin:7px 2px 0;font-size:11px;color:var(--slate)}
.gh-row{display:flex;align-items:center;gap:8px}
.gh-row .dot{flex:0 0 8px;width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.2)}
.gh-row b{flex:1;font-size:12.5px;color:#14532D}
.gh-un{border:0;background:none;color:var(--slate);font:700 11px/1 inherit;text-decoration:underline;cursor:pointer;padding:4px}
.gh-sync{display:block;margin-top:4px;font-size:10.5px;color:#166534}
.gh-code{display:inline-flex;align-items:center;gap:8px;margin:8px 0;padding:7px 12px;border-radius:10px;background:#0F172A;color:#fff;font:800 14px/1.2 "SF Mono",monospace;letter-spacing:1px;cursor:pointer;border:0}
.gh-code small{font:700 10px/1 Cairo,sans-serif;color:#94A3B8;letter-spacing:0}
.gh-ios-steps{margin:10px 0 0;padding:0;list-style:none;counter-reset:gh}
.gh-ios-steps li{counter-increment:gh;position:relative;padding:6px 30px 6px 0;font-size:12.5px;line-height:1.7;color:var(--navy)}
.gh-ios-steps li:before{content:counter(gh);position:absolute;inset-inline-start:0;top:7px;width:20px;height:20px;border-radius:50%;background:#F97316;color:#fff;font:800 11px/20px inherit;text-align:center}
.gh-ios-steps.on li{color:#E2E8F0}
.gh-link-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 14px;border-radius:11px;border:0;background:#F97316;color:#fff;font:800 12.5px/1 inherit;cursor:pointer;text-decoration:none}
.lt{direction:ltr;unicode-bidi:isolate}
.gh-auto{margin-top:12px;border-top:1px dashed #CBD5E1;padding-top:10px}
.gh-auto>b{display:block;font-size:12.5px;margin-bottom:2px}
.gh-st{margin:10px 0;display:flex;gap:10px;align-items:flex-start}
.gh-st>i{flex:none;width:20px;height:20px;border-radius:50%;background:#F97316;color:#fff;font:800 11px/20px inherit;text-align:center;font-style:normal;margin-top:2px}
.gh-st p{margin:0 0 6px;font-size:12.5px;line-height:1.7}
.gh-mk{direction:ltr;text-align:left;border-radius:14px;background:#0F172A;color:#E2E8F0;padding:10px;font:600 12px/1.3 -apple-system,"SF Pro Text",Helvetica,sans-serif;max-width:260px;border:1px solid #1E293B}
.gh-mk .r{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:9px;background:#1E293B;margin-top:5px}
.gh-mk .r.hl{outline:2px solid #F97316;background:#2A1B10}
.gh-mk .tb{display:flex;justify-content:space-around;border-top:1px solid #334155;margin-top:8px;padding-top:7px;font-size:10.5px;color:#94A3B8}
.gh-mk .tb .hl{color:#F97316;font-weight:800}
.gh-mk .plus{width:26px;height:26px;border-radius:50%;background:#F97316;color:#fff;font:800 18px/26px inherit;text-align:center;margin-left:auto;outline:2px solid #FDBA74;outline-offset:2px}
.gh-mk .tg{width:34px;height:20px;border-radius:12px;background:#475569;position:relative}
.gh-mk .tg:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff}
.gh-mk .big{font:800 30px/1 -apple-system,Helvetica,sans-serif;text-align:center;color:#fff;padding:6px 0;letter-spacing:1px}
.gh-mk .sm{font-size:10px;color:#94A3B8}
.gh-mk .ok{color:#F97316;font-weight:800}
.gh-note{font-size:10.5px;color:var(--slate);margin-top:8px}
.gh-hero .gh-note{color:#94A3B8}
.gh-hero{margin-bottom:14px;border-radius:18px;padding:16px;color:#fff;background:linear-gradient(135deg,#0F172A,#1E293B);position:relative;overflow:hidden}
.gh-hero:before{content:"";position:absolute;inset-inline-end:-40px;top:-40px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.35),transparent 70%)}
.gh-hero h3{margin:0 0 4px;font-size:15px;font-weight:900}
.gh-hero p{margin:0 0 12px;font-size:12px;line-height:1.7;color:#CBD5E1}
.gh-hero-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px 16px;border-radius:13px;border:0;background:#fff;color:#0F172A;font:900 14px/1 inherit;cursor:pointer;transition:.2s;box-shadow:0 6px 16px rgba(0,0,0,.25)}
.gh-hero-btn:active{transform:scale(.98)}
.gh-hero-btn .g{display:inline-grid;place-items:center;width:20px;height:20px}
.gh-strip{margin-bottom:14px;border-radius:14px;padding:10px 12px;border:1px solid rgba(34,197,94,.4);background:linear-gradient(135deg,#F0FDF4,#ECFDF5)}
.gh-run{margin-top:10px;border-top:1px dashed #CBD5E1;padding-top:10px}
.gh-run>b{display:block;font-size:12px;margin-bottom:6px}
.gh-run-btn{width:100%;text-align:center}
.gh-hero .gh-run{border-top-color:#334155}
.gh-hero .gh-run>b{color:#E2E8F0}
.gh-re{display:inline-flex;align-items:center;gap:5px;flex:none;border:1px solid rgba(34,197,94,.45);background:#fff;color:#15803D;font:800 11px/1 inherit;padding:6px 10px;border-radius:9px;cursor:pointer;transition:.2s}
.gh-re:active{transform:scale(.96)}
.gh-re:disabled{opacity:.55;cursor:default}
.gh-re svg{width:12px;height:12px}
.gh-re.spin svg{animation:ghspin .8s linear infinite}
@keyframes ghspin{to{transform:rotate(360deg)}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const FN=()=>SUPABASE_URL+"/functions/v1/health-sync";
const G_SVG='<svg class="g" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.2h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.2-7-5.1l-3.9 3C3.2 21.3 7.3 24 12 24z"/><path fill="#FBBC05" d="M5 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-3.9-3C.4 8.2 0 10 0 12s.4 3.8 1.1 5.3l3.9-3z"/><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.1 6.7l3.9 3c1-2.9 3.8-5 7-5z"/></svg>';
const RE_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>';
const SCOPE="https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly https://www.googleapis.com/auth/googlehealth.sleep.readonly";

function platform(){
  const ua=navigator.userAgent||"";
  if(/android/i.test(ua)) return "android";
  if(/iphone|ipad|ipod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)) return "ios";
  return "other";
}

async function token(){ try{ const {data}=await sb.auth.getSession(); return data?.session?.access_token||""; }catch(_){ return ""; } }
async function call(action,body){
  const t=await token(); if(!t) throw new Error("auth");
  const r=await fetch(FN(),{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({action,...body})});
  const j=await r.json().catch(()=>({})); if(!r.ok) throw Object.assign(new Error(j.error||"fail"),{code:j.error}); return j;
}
function loadGis(){ return new Promise((res,rej)=>{
  if(window.google&&google.accounts&&google.accounts.oauth2) return res();
  const s=document.createElement("script"); s.src="https://accounts.google.com/gsi/client";
  s.onload=()=>res(); s.onerror=()=>rej(new Error("gis")); document.head.appendChild(s);
}); }

async function state(p){
  let cfg=null;
  try{ cfg=await call("status"); }catch(_){ return null; }       /* dark when not deployed */
  if(!cfg||!cfg.configured||!cfg.client_id) return null;
  let conn=null;
  try{ const {data}=await sb.from("health_connections").select("last_sync_at,connected_at").eq("user_id",p.id).maybeSingle(); conn=data; }catch(_){}
  return {cfg,conn};
}

async function doConnect(cfg,btn,refresh,rerender){
  btn.disabled=true;
  try{
    await loadGis();
    const cc=google.accounts.oauth2.initCodeClient({
      client_id:cfg.client_id, scope:SCOPE, ux_mode:"popup", prompt:"consent",
      callback:async(resp)=>{
        if(resp&&resp.code){
          try{
            const r=await call("connect",{code:resp.code});
            window.toast&&toast(r.today!=null?`✓ اتربط — خطواتك النهارده: ${r.today.toLocaleString("en-US")}`:"✓ اتربط حساب جوجل");
            refresh&&refresh(); return;
          }catch(e){
            window.toast&&toast(e.code==="scope_missing"?"\u062c\u0648\u062c\u0644 \u0645\u0627 \u0633\u0645\u062d\u0634 \u0628\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u062e\u0637\u0648\u0627\u062a \u2014 \u0641\u0639\u0651\u0644 \u062e\u0627\u0646\u0629 \u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0648\u0627\u0631\u0628\u0637 \u062a\u0627\u0646\u064a":e.code==="no_refresh"?"جوجل ماعملتش إذن كامل — امسح التطبيق من أذونات حسابك وجرب تاني":"تعذر الربط — جرب تاني");
          }
        }else if(resp&&(resp.error||resp.type)){
          if(!/popup_closed|closed/i.test(resp.error||resp.type||"")) window.toast&&toast("الربط اتلغى");
        }
        btn.disabled=false; rerender&&rerender();
      }});
    cc.requestCode();
    setTimeout(()=>{ btn.disabled=false; },30000);
  }catch(e){
    btn.disabled=false;
    window.toast&&toast("مفيش نت — جرب تاني");
  }
}

async function doDisconnect(p,rerender){
  if(!confirm("تفصل حساب جوجل؟ خطواتك هترجع يدوي.")) return;
  try{ await call("disconnect"); window.toast&&toast("اتفصل حساب جوجل"); rerender&&rerender(); }
  catch(e){ window.toast&&toast("تعذر الفصل — جرب تاني"); }
}

async function doResync(p,btn,refresh,rerender){
  btn.disabled=true; btn.classList.add("spin");
  const say=m=>{ window.toast&&toast(m); };
  try{
    const r=await call("sync_me");
    if(typeof r.today==="number"){
      say("\u2713 \u0627\u062a\u062d\u062f\u062b\u062a \u2014 \u062e\u0637\u0648\u0627\u062a\u0643 \u0627\u0644\u0646\u0647\u0627\u0631\u062f\u0647: "+r.today.toLocaleString("en-US")+(r.sleep_days>0?" · 😴 نوم "+r.sleep_days+" ليالي":""));
    }else{
      /* Google answered but sent no steps for today: say so, never fake a success. */
      const why=r.reason||"no_data";
      say(why==="scope_missing"
        ?"\u062c\u0648\u062c\u0644 \u0645\u0627 \u0633\u0645\u062d\u0634 \u0628\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u062e\u0637\u0648\u0627\u062a \u2014 \u0627\u0641\u0635\u0644 \u0648\u0627\u0631\u0628\u0637 \u062a\u0627\u0646\u064a \u0648\u0641\u0639\u0651\u0644 \u062e\u0627\u0646\u0629 \u0627\u0644\u062e\u0637\u0648\u0627\u062a"
        :why==="api_error"
        ?"\u062c\u0648\u062c\u0644 \u0631\u062c\u0651\u0639 \u062e\u0637\u0623 \u2014 \u062c\u0631\u0628 \u0643\u0645\u0627\u0646 \u0634\u0648\u064a\u0629"
        :"\u062c\u0648\u062c\u0644 \u0645\u0627 \u0631\u062c\u0651\u0639\u0634 \u0623\u064a \u062e\u0637\u0648\u0627\u062a \u0644\u0644\u0646\u0647\u0627\u0631\u062f\u0647 \u2014 \u062a\u0623\u0643\u062f \u0625\u0646 \u062e\u0637\u0648\u0627\u062a\u0643 \u0645\u062a\u0633\u062c\u0644\u0629 \u0641\u064a Google Health \u0648\u0625\u0646\u0643 \u0641\u0639\u0651\u0644\u062a \u0625\u0630\u0646 \u0627\u0644\u062e\u0637\u0648\u0627\u062a");
    }
    refresh&&refresh();      /* rebuilds the view: steps field + last-sync line */
    rerender&&rerender();
  }catch(e){
    btn.disabled=false; btn.classList.remove("spin");
    say(e.code==="not_connected"?"\u062c\u0648\u062c\u0644 \u0645\u0634 \u0645\u062a\u0635\u0644 \u2014 \u0627\u0631\u0628\u0637\u0647 \u0627\u0644\u0623\u0648\u0644":"\u062a\u0639\u0630\u0631 \u0627\u0644\u062a\u062d\u062f\u064a\u062b \u2014 \u062c\u0631\u0628 \u062a\u0627\u0646\u064a");
  }
}

function lastSyncLine(conn){
  const d=new Date(conn.last_sync_at);
  const last=conn.last_sync_at?d.toLocaleDateString("ar-EG",{day:"numeric",month:"short"})+", "+d.toLocaleTimeString("ar-EG",{hour:"numeric",minute:"2-digit"}):"لسه أول مزامنة";
  return last;
}

/* Habits view: small slot right under the steps field. */

function autoGuide(){
  const st=(n,t,m)=>`<div class="gh-st"><i>${n}</i><div><p>${t}</p>${m}</div></div>`;
  return `<div class="gh-auto"><b>آخر خطوة: التشغيل التلقائي كل ليلة (مرة واحدة بس، دقيقتين)</b>`+
   st(1,"افتح تطبيق <b>الاختصارات</b> <span class=lt>(Shortcuts)</span> وادخل تبويب <b class=lt>Automation</b> (أتمتة) تحت.",
     `<div class="gh-mk"><div class="r"><span>My Shortcuts</span><span class="sm">&#9656;</span></div><div class="r"><span>Gallery</span><span class="sm">&#9656;</span></div><div class="tb"><span>Shortcuts</span><span class="hl">Automation</span><span>Gallery</span></div></div>`)+
   st(2,"دوس علامة <b>+</b> فوق، وبعدين <b class=lt>Create Personal Automation</b>.",
     `<div class="gh-mk"><div style="display:flex;align-items:center"><span style="font-weight:800;font-size:15px">Automation</span><span class="plus">+</span></div><div class="r"><span>New Automation</span></div></div>`)+
   st(3,"اختار <b class=lt>Time of Day</b> (وقت من اليوم).",
     `<div class="gh-mk"><div class="r"><span>Alarm</span></div><div class="r hl"><span>Time of Day</span><span class="ok">&#10003;</span></div><div class="r"><span>Arrive</span></div></div>`)+
   st(4,"اضبط الوقت على <b class=lt>23:55</b> و<b class=lt>Daily</b>، وبعدين <span class=lt>Next</span>.",
     `<div class="gh-mk"><div class="big">23:55</div><div class="r hl"><span>Repeat</span><span class="ok">Daily</span></div></div>`)+
   st(5,"دوس <b class=lt>Add Action</b>، ابحث عن <b class=lt>Run Shortcut</b> واختار <b class=lt>Mofit</b>.",
     `<div class="gh-mk"><div class="r"><span>Run Shortcut</span></div><div class="r hl"><span>Shortcut</span><span class="ok">Mofit</span></div></div>`)+
   st(6,"في الشاشة الأخيرة خلّي <b class=lt>Run Immediately</b> و <b class=lt>Notify When Run</b> مقفول <span class=lt>(OFF)</span>، وبعدين <b class=lt>Done</b>.",
     `<div class="gh-mk"><div class="r hl"><span>Automation</span><span class="ok">Run Immediately</span></div><div class="r"><span>Notify When Run</span><span class="tg"></span></div></div>`)+
   `<div class="gh-note">تمام كده — خطواتك هتتبعت لوحدها كل ليلة. لو الاختصار طلب إذن للصحة وافق عليه مرة واحدة.</div></div>`;
}
async function iosCard(box,s,refresh){
  /* s = {code, shortcut_url} from shortcut_code action; null = not deployed yet */
  if(!s){ box.innerHTML=""; return; }
  if(refresh) iosRefresh.add(refresh);
  const link=s.shortcut_url
    ?`<a class="gh-link-btn" href="${s.shortcut_url}" target="_blank" rel="noopener">تحميل الاختصار ←</a>`
    :`<span class="gh-note">الكوتش لسه بيجهز رابط الاختصار — كودك جاهز تحت.</span>`;
  box.innerHTML=`<ol class="gh-ios-steps">
    <li>${link} دوس تحميل — الآيفون هيضيف الاختصار لوحده</li>
    <li>شغّل الاختصار أول مرة، ولما يطلب الكود الصق ده: <button type="button" class="gh-code" id="ghCode">${s.code} <small>نسخ</small></button></li>
    </ol>${autoGuide()}
    <div class="gh-run"><b>خلصت الظبط؟ شغّلها في أي وقت:</b>
    <a class="gh-link-btn gh-run-btn" id="ghRun" href="shortcuts://run-shortcut?name=Mofit">▶ شغّل المزامنة دلوقتي</a>
    <div class="gh-note">بيفتح تطبيق الاختصارات ويسجّل خطواتك فورًا — ارجع هنا وهتلاقي الرقم اتحدث.</div></div>
    <div class="gh-note">خطواتك بتتشارك مع التطبيق ده بس، والكتابة اليدوية شغالة برضه.</div>`;
  const run=box.querySelector("#ghRun");
  if(run) run.addEventListener("click",()=>{ iosRunPending=true; });
  box.querySelector("#ghCode").onclick=async ev=>{
    try{ await navigator.clipboard.writeText(s.code); ev.currentTarget.querySelector("small").textContent="✓ اتنسخ"; }
    catch(_){ window.toast&&toast("الكود: "+s.code); }
  };
}
async function renderStepsSlot(slot,p,refresh){
  if(platform()==="ios"){
    let st=null; try{ st=await call("status"); }catch(_){ slot.innerHTML=""; return; }
    if(!st||!st.shortcut_url){ slot.innerHTML=""; return; }   /* hidden until the Shortcut link exists */   /* dark until function deployed */
    let s=null; try{ s=await call("shortcut_code"); }catch(_){}
    if(!slot.isConnected) return;
    slot.innerHTML=`<div class="gh-box off"><b style="font-size:12.5px">🍎 اربط الآيفون — خطواتك تتسجل لوحدها</b><div id="ghIosBody"></div></div>`;
    iosCard(slot.querySelector("#ghIosBody"),s,refresh);
    return;
  }
  const s=await state(p); if(!s){ slot.innerHTML=""; return; }
  if(!slot.isConnected) return;
  const {cfg,conn}=s;
  const rerender=()=>renderStepsSlot(slot,p,refresh);
  if(conn){
    slot.innerHTML=`<div class="gh-box on"><div class="gh-row"><span class="dot"></span><b>جوجل متصل — خطواتك بتتسجل لوحدها كل يوم</b><button type="button" class="gh-re" id="ghRe">${RE_SVG} تحديث</button><button type="button" class="gh-un" id="ghOff">فصل</button></div>
      <span class="gh-sync">آخر مزامنة: ${lastSyncLine(conn)} · دوس تحديث لو عاوز أحدث رقم دلوقتي</span></div>`;
    slot.querySelector("#ghOff").onclick=()=>doDisconnect(p,rerender);
    slot.querySelector("#ghRe").onclick=ev=>doResync(p,ev.currentTarget,refresh,rerender);
    return;
  }
  slot.innerHTML=`<div class="gh-box off">
    <button type="button" class="gh-btn" id="ghOn">${G_SVG} اربط حساب جوجل — خطواتك تتسجل لوحدها</button>
    <p class="gh-hint">لموبايلات أندرويد وساعات فيتبت/بيكسل. مرة واحدة بس، وبعدها مفيش كتابة يدوية. خطواتك بتتشارك مع التطبيق ده بس.</p></div>`;
  slot.querySelector("#ghOn").onclick=ev=>doConnect(cfg,ev.currentTarget,refresh,rerender);
}

/* Client home: prominent card near the top, one press starts the flow. */
async function renderHomeCard(slot,p,refresh){
  if(platform()==="ios"){
    let st=null; try{ st=await call("status"); }catch(_){ slot.innerHTML=""; return; }
    if(!st||!st.shortcut_url){ slot.innerHTML=""; return; }   /* hidden until the Shortcut link exists */
    let s=null; try{ s=await call("shortcut_code"); }catch(_){}
    if(!slot.isConnected||!s) { if(slot.isConnected) slot.innerHTML=""; return; }
    slot.innerHTML=`<div class="gh-hero">
      <h3>👣 خطواتك من الآيفون من غير كتابة</h3>
      <p>اختصار بسيط بيسحب خطواتك من تطبيق صحة آبل ويبعتها للتطبيق كل يوم لوحده — دوس تحميل، الصق كودك مرة واحدة، وخلاص.</p>
      <div id="ghIosHome"></div></div>`;
    const body=slot.querySelector("#ghIosHome");
    iosCard(body,s,refresh);
    body.querySelector(".gh-ios-steps")?.classList.add("on");
    return;
  }
  const s=await state(p); if(!s){ slot.innerHTML=""; return; }
  if(!slot.isConnected) return;
  const {cfg,conn}=s;
  const rerender=()=>renderHomeCard(slot,p,refresh);
  if(conn){
    slot.innerHTML=`<div class="gh-strip"><div class="gh-row"><span class="dot"></span><b>جوجل متصل — خطواتك بتتسجل لوحدها</b><button type="button" class="gh-re" id="ghReH">${RE_SVG} تحديث</button><button type="button" class="gh-un" id="ghOffH">فصل</button></div></div>`;
    slot.querySelector("#ghOffH").onclick=()=>doDisconnect(p,rerender);
    slot.querySelector("#ghReH").onclick=ev=>doResync(p,ev.currentTarget,refresh,rerender);
    return;
  }
  slot.innerHTML=`<div class="gh-hero">
    <h3>👣 سجّل خطواتك من غير ما تكتب حاجة</h3>
    <p>اربط حساب جوجل مرة واحدة — التطبيق هيسحب خطواتك كل يوم لوحده، ولو حبيت تكتب يدوي الخانة موجودة في العادات.</p>
    <button type="button" class="gh-hero-btn" id="ghOnH">${G_SVG} اربط حساب جوجل</button></div>`;
  slot.querySelector("#ghOnH").onclick=ev=>doConnect(cfg,ev.currentTarget,refresh,rerender);
}

/* iOS: after the user taps "run sync now" we refresh the views when they return. */
let iosRunPending=false; const iosRefresh=new Set();
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState!=="visible"||!iosRunPending) return;
  iosRunPending=false;
  iosRefresh.forEach(f=>{ try{ f(); }catch(_){ } });
  iosRefresh.clear();
});

window.ghRenderStepsSlot=renderStepsSlot;
window.ghRenderHomeCard=renderHomeCard;
})();
