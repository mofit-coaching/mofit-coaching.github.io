/* Mofit media lifecycle (ml-*). Shared upload compression, storage purge, and coach media delete.
   Goal: coach delete = file wiped from storage + every reference (client sheet too), so the
   free 1GB storage never fills up. Starred transformation-archive photos keep their own copy
   (copy-on-star, archive bucket), so originals are always purgeable. */
(function(){
  const css=`
  .ml-cell{position:relative}
  .ml-del{position:absolute;top:4px;inset-inline-end:4px;z-index:2;width:26px;height:26px;border-radius:50%;border:0;background:rgba(15,23,42,.72);color:#FCA5A5;font-size:13px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}
  .ml-del.ml-arm{background:#DC2626;color:#fff;width:auto;height:26px;padding:0 10px;border-radius:99px;font-size:11px;font-weight:700}
  .msg.media{position:relative}
  .ml-mdel{position:absolute;top:-7px;inset-inline-start:-7px;z-index:2;width:22px;height:22px;border-radius:50%;border:0;background:#0F172A;color:#FCA5A5;font-size:11px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;box-shadow:0 1px 4px rgba(0,0,0,.4)}
  .ml-mdel.ml-arm{background:#DC2626;color:#fff;width:auto;padding:0 8px;border-radius:99px;font-weight:700}
  @media(prefers-reduced-motion:reduce){.ml-del,.ml-mdel{transition:none}}`;
  const s=document.createElement("style"); s.textContent=css; document.head.appendChild(s);
})();

/* Compress a photo for upload: downscale to <=max px on the long edge, then step JPEG
   quality down from 0.82 until the blob is <=targetKB (quality floor 0.5). */
function mlCompressImage(file,max=1280,targetKB=400){ return new Promise((res,rej)=>{
  const img=new Image();
  img.onload=()=>{ const k=Math.min(1,max/Math.max(img.width,img.height)||1);
    const c=document.createElement("canvas"); c.width=Math.max(1,Math.round(img.width*k)); c.height=Math.max(1,Math.round(img.height*k));
    c.getContext("2d").drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(img.src);
    let q=0.82; const step=()=>c.toBlob(b=>{ if(!b) return rej(new Error("image")); if(b.size<=targetKB*1024||q<=0.5) res(b); else { q=Math.max(0.5,+(q-0.08).toFixed(2)); step(); } },"image/jpeg",q); step(); };
  img.onerror=rej; img.src=URL.createObjectURL(file); }); }

/* Remove storage objects. quiet=true for background cleanup (no toast). Returns true when clean. */
async function mlPurge(bucket,paths,quiet){ const list=(paths||[]).filter(Boolean); if(!list.length) return true;
  const { error } = await sb.storage.from(bucket).remove(list);
  if(error){ if(!quiet) toast("تعذر حذف الملف من التخزين"); return false; } return true; }

/* Two-tap confirm for small destructive buttons: first tap arms (3s window), second runs onGo. */
function mlTwoTap(btn,onGo){
  const reset=()=>{ if(!btn.isConnected) return; btn.disabled=false; btn.classList.remove("ml-arm"); btn.textContent=btn.dataset.ml0||"🗑"; };
  if(!btn.classList.contains("ml-arm")){ btn.dataset.ml0=btn.textContent; btn.classList.add("ml-arm"); btn.textContent="تأكيد؟";
    setTimeout(()=>{ if(btn.isConnected&&!btn.disabled) reset(); },3000); return; }
  btn.disabled=true; Promise.resolve(onGo()).catch(()=>reset());
}
