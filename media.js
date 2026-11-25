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
  .ml-st .ml-bar{height:8px;border-radius:99px;background:rgba(148,163,184,.25);overflow:hidden;margin:10px 0 8px}
  .ml-st .ml-bar i{display:block;height:100%;border-radius:99px;background:#F97316}
  .ml-st .ml-bar.mid i{background:#EA580C}.ml-st .ml-bar.bad i{background:#DC2626}
  .ml-st .ml-big{font-weight:800;font-size:1.05rem}
  .ml-st .ml-rows{display:flex;gap:14px;flex-wrap:wrap;font-size:.8rem;opacity:.8}
  .ml-st .ml-rows b{font-weight:700}
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

/* Coach dashboard storage meter: static, calm. Missing bucket = 0 (empty buckets return no row). */
const ML_CAP_MB=1024, ML_BUCKETS=[["checkins","صور ومحادثات"],["posing","فيديوهات"],["archive","الأرشيف"]];
function mlFmt(b){ return b>=1048576? (b/1048576).toFixed(b>=104857600?0:1)+" MB" : Math.max(0,Math.round(b/1024))+" KB"; }
async function mlStorageMeter(host){
  if(!host) return;
  const { data, error } = await sb.rpc("storage_usage");
  if(error||!Array.isArray(data)){ host.remove(); return; }
  const by=Object.fromEntries(data.map(r=>[r.bucket_id,{f:+r.files||0,b:+r.bytes||0}]));
  const tot=ML_BUCKETS.reduce((s,[k])=>s+(by[k]?.b||0),0), pct=Math.min(100,tot/1048576/ML_CAP_MB*100), tone=pct>=90?"bad":pct>=70?"mid":"";
  host.classList.add("ml-st");
  host.innerHTML=`<div class="card-h"><div class="ic">💾</div><h2>مساحة التخزين<small>الحد المجاني ${ML_CAP_MB} MB</small></h2></div>
    <div class="ml-big">${mlFmt(tot)} <span class="muted" style="font-weight:600;font-size:.8rem">من ${ML_CAP_MB} MB · ${pct<1&&tot?"أقل من 1":Math.round(pct)}%</span></div>
    <div class="ml-bar ${tone}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct}%"></i></div>
    <div class="ml-rows">${ML_BUCKETS.map(([k,l])=>`<span>${l}: <b>${mlFmt(by[k]?.b||0)}</b> · ${by[k]?.f||0} ملف</span>`).join("")}</div>`;
}
