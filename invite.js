/* ======================================================================
   Mofit — coach invite link (+ QR)
   - Coach clients page: "🔗 دعوة عميل" card with a shareable signup link,
     QR code, copy + WhatsApp share.
   - Link shape: <origin><path>?src=<code>&join=1
     core.js already stores ?src= in localStorage (signup tags the account);
     prices.js initLoginTabs auto-opens the signup tab on ?join=1.
   - QR drawn offline with the vendored qrcode-generator lib (qrcode.js).
   ====================================================================== */
(function(){
function invUrl(code){
  const u=location.origin+location.pathname+"?join=1";
  return code?u+"&src="+encodeURIComponent(code):u;
}
function drawInvQR(cv,text){
  const qr=qrcode(0,"M"); qr.addData(text); qr.make();
  const n=qr.getModuleCount(), pad=2, size=cv.width, cell=Math.floor(size/(n+pad*2)), off=Math.floor((size-cell*n)/2);
  const ctx=cv.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,size,size); ctx.fillStyle="#0F172A";
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) ctx.fillRect(off+c*cell,off+r*cell,cell,cell);
}
const _vcInvite = viewClients;
viewClients = async function(el){
  await _vcInvite(el);
  renderInvite(el);
};
function renderInvite(el){
  if(el.querySelector("#inviteCard")) return;
  const host=document.createElement("div"); host.className="card"; host.id="inviteCard";
  host.innerHTML=`<div class="card-h"><div class="ic acc">🔗</div><h2>دعوة عميل جديد<small>لينك أو QR يفتح صفحة التسجيل على طول</small></h2></div>
    <div style="text-align:center"><canvas id="invQr" width="188" height="188" style="border-radius:14px;background:#fff;padding:8px;width:188px;height:188px"></canvas>
    <p class="hint" style="margin:8px 0 10px;font-size:12px">العميل يفتح اللينك، يسجّل حسابه، ويوصلك طلبه في "طلبات جديدة"</p></div>
    <label class="f" style="margin-bottom:8px">كود الدعوة (اختياري — للتتبع)<input id="invCode" placeholder="مثلاً: جيم-النور" style="text-align:center"></label>
    <div class="row"><button class="btn primary grow" id="invCopy">📋 نسخ اللينك</button><a class="btn grow" id="invWa" target="_blank" rel="noopener">💬 شارك واتساب</a></div>`;
  const anchor=el.querySelector("#addBtn"); if(anchor) anchor.after(host); else el.prepend(host);
  const cv=host.querySelector("#invQr"), codeIn=host.querySelector("#invCode"), wa=host.querySelector("#invWa");
  const refresh=()=>{
    const url=invUrl(codeIn.value.trim());
    try{ drawInvQR(cv,url); }catch(e){}
    wa.href=waLink("السلام عليكم 👋 اشترك في Mofit من اللينك ده وسجّل حسابك، وأنا هفعّلهولك بعد تأكيد الاشتراك 💪\n"+url);
    cv.dataset.url=url;
  };
  codeIn.oninput=refresh; refresh();
  host.querySelector("#invCopy").onclick=async ev=>{
    const b=ev.currentTarget, url=cv.dataset.url||invUrl("");
    try{ await navigator.clipboard.writeText(url); }catch(e){ const t=document.createElement("textarea"); t.value=url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    b.textContent="✅ اتنسخ"; setTimeout(()=>b.textContent="📋 نسخ اللينك",1600);
  };
};
})();
