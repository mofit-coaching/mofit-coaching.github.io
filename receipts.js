/* MOFIT program receipts: "why is this exercise in my program?" sheet.
   Usage: mofitReceipts.open(name). Button added by views.js on each exercise card.
   Display-only; reasons + sources come from receipts-data.js (all peer-reviewed, links verified). */
(function(){
  const css=`.rcpt-tag{display:inline-flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:#FDBA74;background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.25);border-radius:999px;padding:4px 10px;margin-bottom:10px}
  .rcpt-why{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px;font-size:.92rem;line-height:1.9;margin:0 0 14px}
  .rcpt-h{font-size:.8rem;font-weight:800;color:#9aa3c7;margin:0 0 8px}
  .rcpt-src{display:flex;flex-direction:column;gap:8px;margin:0 0 12px;padding:0;list-style:none}
  .rcpt-src a{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 12px;font-size:.8rem;line-height:1.7;color:#cdd6f4;text-decoration:none;transition:border-color .2s}
  .rcpt-src a:active{border-color:rgba(249,115,22,.5)}
  .rcpt-src a b{flex:0 0 auto}
  .rcpt-src a span{text-decoration:underline;text-decoration-color:rgba(249,115,22,.4);text-underline-offset:3px}
  .rcpt-note{font-size:.72rem;color:#9aa3c7;line-height:1.8;margin:0}`;
  function inject(){ const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st); }
  window.mofitReceipts={
    open(name){
      const r=window.RECEIPTS&&RECEIPTS.find(name);
      if(!r) return;
      const body=openSheet(`<div class="between" style="margin-bottom:10px"><b translate="no" lang="en">${esc(name)}</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
        <div class="rcpt-tag">${r.gen?"📚 مبدأ عام":"📚 ليه التمرين ده في برنامجك؟"}</div>
        <p class="rcpt-why">${esc(r.w)}</p>
        <p class="rcpt-h">المصادر العلمية 🔬</p>
        <ul class="rcpt-src">${r.src.map(s=>`<li><a href="${esc(s[1])}" target="_blank" rel="noopener noreferrer"><b>🔗</b><span>${esc(s[0])}</span></a></li>`).join("")}</ul>
        <p class="rcpt-note">دي مراجعات علمية محكّمة للاطلاع – تعليمات كابتن محمد في برنامجك هي الأساس دايماً.</p>`);
      return body;
    }
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",inject); else inject();
})();
