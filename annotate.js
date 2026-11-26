/* ======================================================================
   Mofit — coach photo annotation (an-*): draw on a client's chat photo
   (arrows, angles, correction lines) and send it back into the chat.
   Excalidraw 0.17 (MIT) + React 18 UMD, self-hosted in ./vendor and
   lazy-loaded only when the coach taps "صحّح بالرسم" (~1.3MB once).
   - Coach role only, only on photos the client sent.
   - The photo is loaded from the existing signed URL, drawn on-device,
     and the flattened JPG goes to the same chat storage path the normal
     photo flow uses. Nothing goes to any third party.
   ====================================================================== */
(function(){
const SELF=(document.currentScript&&document.currentScript.src)||(document.querySelector('script[src*="annotate.js"]')||{}).src||"annotate.js";
const V=SELF.replace(/annotate\.js(\?.*)?$/,"")+"vendor/";
const CSS=`
.an-btn{display:flex;align-items:center;gap:6px;margin-top:6px;padding:7px 12px;border-radius:99px;border:1.5px solid rgba(249,115,22,.5);background:rgba(249,115,22,.1);color:inherit;font-size:12px;font-weight:800;cursor:pointer}
.msg.me .an-btn{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.4)}
.an-ov{position:fixed;inset:0;z-index:100;background:#0A1020;display:flex;flex-direction:column}
.an-h{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));direction:rtl;color:#fff;border-bottom:1px solid rgba(148,163,184,.2)}
.an-h b{flex:1;font-size:15px}
.an-h button{border-radius:12px;padding:9px 16px;font-size:13.5px;font-weight:800;cursor:pointer;border:none}
.an-send{background:linear-gradient(135deg,#FF8A3D,#F97316);color:#1A0E05;box-shadow:0 4px 14px rgba(249,115,22,.35)}
.an-send:disabled{opacity:.55}
.an-x{background:rgba(148,163,184,.15);color:#C7D2E8}
.an-body{flex:1;min-height:0;direction:ltr}
.an-body>div{height:100%}
.an-load{flex:1;display:grid;place-items:center;color:#C7D2E8;font-size:13.5px;gap:12px}
.an-spin{width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,138,61,.25);border-top-color:#FF8A3D;animation:anspin .8s linear infinite}
@keyframes anspin{to{transform:rotate(360deg)}}
.an-hint{padding:7px 14px;color:#8B9DBF;font-size:11.5px;text-align:center;direction:rtl;background:#0A1020}
`;
const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

let lib=null, libP=null;
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
function ensureLib(){
  if(lib) return Promise.resolve(lib);
  if(libP) return libP;
  libP=(async()=>{
    try{
      if(!window.React) await loadScript(V+"react.production.min.js");
      if(!window.ReactDOM) await loadScript(V+"react-dom.production.min.js");
      if(!window.ExcalidrawLib) await loadScript(V+"excalidraw.production.min.js");
      lib={React:window.React,ReactDOM:window.ReactDOM,X:window.ExcalidrawLib};
    }catch(e){ libP=null; }
    return lib;
  })();
  return libP;
}
const rnd=()=>Math.floor(Math.random()*2**31);
const blobToDataURL=b=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(b); });
const imgDims=u=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res({w:i.naturalWidth,h:i.naturalHeight}); i.onerror=rej; i.src=u; });

async function openAnnotator(msg){
  const ov=document.createElement("div"); ov.className="an-ov";
  ov.innerHTML=`<div class="an-h"><b>✏️ صحّح على صورة العميل</b>
      <button type="button" class="an-send" disabled>إرسال للشات</button>
      <button type="button" class="an-x">إلغاء</button></div>
    <div class="an-body"><div class="an-load"><div class="an-spin"></div>بيجهّز لوحة الرسم…</div></div>
    <div class="an-hint">ارسم بصوابعك: أسهم ودوائر وزوايا على الصورة، وبعدين اضغط إرسال — هتوصل للعميل في الشات كصورة.</div>`;
  document.body.appendChild(ov);
  const close=()=>{ try{ root&&root.unmount(); }catch(e){} ov.remove(); document.body.style.overflow=""; };
  document.body.style.overflow="hidden";
  ov.querySelector(".an-x").onclick=close;

  const L=await ensureLib();
  const body=ov.querySelector(".an-body");
  if(!L){ body.innerHTML=`<div class="an-load">تعذر تحميل لوحة الرسم — اتأكد من النت وجرّب تاني</div>`; return; }

  /* load the client photo through the same signed-url path the chat uses */
  let dataURL, dims;
  try{
    const signed=await chatUrl(msg.media_path);
    if(!signed) throw 0;
    const blob=await (await fetch(signed,{mode:"cors"})).blob();
    dataURL=await blobToDataURL(blob);
    dims=await imgDims(dataURL);
  }catch(e){ body.innerHTML=`<div class="an-load">الصورة مش متاحة دلوقتي — جرّب تاني</div>`; return; }

  const fileId="an"+Date.now();
  const imgEl={ type:"image", id:"base", x:0, y:0, width:dims.w, height:dims.h, angle:0,
    strokeColor:"transparent", backgroundColor:"transparent", fillStyle:"solid", strokeWidth:1,
    strokeStyle:"solid", roughness:0, opacity:100, groupIds:[], frameId:null, roundness:null,
    seed:rnd(), version:1, versionNonce:rnd(), isDeleted:false, boundElements:null,
    updated:Date.now(), link:null, locked:true, fileId, scale:[1,1], status:"saved" };
  const files={}; files[fileId]={ id:fileId, mimeType:"image/jpeg", dataURL, created:Date.now() };

  let scene={elements:[imgEl],appState:{},files}, apiRef=null, root=null;
  body.innerHTML="";
  const mount=document.createElement("div"); body.appendChild(mount);
  const e=L.React.createElement;
  root=L.ReactDOM.createRoot(mount);
  root.render(e(L.X.Excalidraw,{
    initialData:{ elements:[imgEl], files,
      appState:{ viewBackgroundColor:"#0B1220", currentItemStrokeColor:"#FF6B1A", currentItemStrokeWidth:2, activeTool:{type:"freedraw",customType:null,locked:false,lastActiveTool:null} } },
    langCode:"ar-SA",
    excalidrawAPI:api=>{ apiRef=api;
      setTimeout(()=>{ try{ api.scrollToContent([imgEl],{fitToViewport:true,viewportZoomFactor:.95}); }catch(_){} try{ api.setActiveTool({type:"freedraw"}); }catch(_){} },300);
      try{ api.updateScene({appState:{currentItemStrokeColor:"#FF6B1A",currentItemStrokeWidth:2}}); }catch(_){} },
    UIOptions:{ canvasActions:{ changeViewBackgroundColor:false, clearCanvas:false, export:false,
      loadScene:false, saveAsImage:false, saveToActiveFile:false, theme:false } },
    onChange:(elements,appState,fl)=>{ scene={elements,appState,files:fl||scene.files}; sendBtn.disabled=false; },
  }));

  const sendBtn=ov.querySelector(".an-send");
  sendBtn.disabled=false; /* base photo alone is also sendable */
  sendBtn.onclick=async()=>{
    sendBtn.disabled=true; sendBtn.textContent="بيبعت…";
    try{
      const png=await L.X.exportToBlob({ elements:scene.elements.filter(x=>!x.isDeleted),
        appState:{ ...scene.appState, exportWithDarkMode:false, exportBackground:true, exportScale:2 },
        files:scene.files, mimeType:"image/png" });
      /* flatten to jpeg to match chat storage + smaller size */
      const d=await imgDims(await blobToDataURL(png));
      const c=document.createElement("canvas"); c.width=d.w; c.height=d.h;
      const cx=c.getContext("2d"); cx.fillStyle="#0B1220"; cx.fillRect(0,0,c.width,c.height);
      const im=new Image(); im.src=await blobToDataURL(png); await new Promise(r=>im.onload=r);
      cx.drawImage(im,0,0);
      const jpg=await new Promise(r=>c.toBlob(r,"image/jpeg",.88));
      const cid=(typeof CHAT!=="undefined"&&CHAT.open)||msg.client_id;
      const path=`${cid}/chat/${Date.now()}.jpg`;
      const { error:up } = await sb.storage.from("checkins").upload(path,jpg,{contentType:"image/jpeg",upsert:false});
      if(up) throw up;
      const { data:m2, error:ins } = await sb.from("messages")
        .insert({ client_id:cid, sender_role:"coach", kind:"image", media_path:path, body:"✏️ تصحيح الكوتش" })
        .select().single();
      if(ins) throw ins;
      try{ chatAppend(m2); }catch(_){}
      window.toast&&toast("✓ اتبعت التصحيح للعميل");
      close();
    }catch(err){
      sendBtn.disabled=false; sendBtn.textContent="إرسال للشات";
      window.toast&&toast("تعذر الإرسال — جرّب تاني");
    }
  };
}

/* add the "صحّح بالرسم" button to client photos, coach role only */
function wrap(){
  if(typeof window.chatBubble!=="function"||window.chatBubble._an) return;
  const _cb=window.chatBubble;
  window.chatBubble=function(m){
    const d=_cb.apply(this,arguments);
    try{
      if(window.S&&S.me&&S.me.role==="coach"&&m.kind==="image"&&m.sender_role==="client"&&!m._anSkip){
        const b=document.createElement("button"); b.type="button"; b.className="an-btn";
        b.innerHTML="🖍 صحّح بالرسم";
        b.onclick=ev=>{ ev.stopPropagation(); openAnnotator(m); };
        d.append(b);
      }
    }catch(_){}
    return d;
  };
  window.chatBubble._an=1;
}
wrap();
let n=0; const iv=setInterval(()=>{ wrap(); if((window.chatBubble&&window.chatBubble._an)||++n>30) clearInterval(iv); },300);

window.anOpen=openAnnotator; /* test/demo API */
})();
