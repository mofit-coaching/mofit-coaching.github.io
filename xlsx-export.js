/* ======================================================================
   MOFIT Excel export (coach): العملاء + المدفوعات في ملف .xlsx واحد.
   - Zero dependencies: tiny zip (store) + SpreadsheetML written here.
   - Reads S.coachClients only (profiles + sub_* fields). Writes nothing.
   - Button "📊 تصدير Excel" appears in the الاشتراكات tab header.
   ====================================================================== */
(function(){
const CSS=`.xl-btn{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--good,#16A34A);background:var(--good-soft,#DCFCE7);color:var(--good,#15803D);border-radius:99px;padding:6px 14px;font-weight:800;font-size:.8rem;cursor:pointer;font-family:inherit;transition:transform .18s cubic-bezier(.2,1.4,.4,1)}
.xl-btn:active{transform:scale(.93)}.xl-btn.busy{opacity:.6;pointer-events:none}
.xl-btn svg{width:16px;height:16px}`;
const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

/* ---- zip (store, no compression) ---- */
const CT=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
const crc32=b=>{ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c=CT[(c^b[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; };
function zip(files){
  const enc=new TextEncoder(), parts=[], cen=[]; let off=0;
  const u16=n=>[n&255,(n>>8)&255], u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255];
  files.forEach(([name,txt])=>{
    const nm=enc.encode(name), d=enc.encode(txt), crc=crc32(d);
    const lh=new Uint8Array([0x50,0x4B,3,4,20,0,0,8,0,0,0,0,0x21,0,...u32(crc),...u32(d.length),...u32(d.length),...u16(nm.length),0,0]);
    parts.push(lh,nm,d);
    cen.push(new Uint8Array([0x50,0x4B,1,2,20,0,20,0,0,8,0,0,0,0,0x21,0,...u32(crc),...u32(d.length),...u32(d.length),...u16(nm.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(off)]),nm);
    off+=lh.length+nm.length+d.length;
  });
  let cs=0; cen.forEach(c=>cs+=c.length);
  const end=new Uint8Array([0x50,0x4B,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cs),...u32(off),0,0]);
  return new Blob([...parts,...cen,end],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}

/* ---- SpreadsheetML ---- */
const X=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"");
const col=i=>{ let s=""; i++; while(i){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; };
function sheet(rows,widths){
  const body=rows.map((r,ri)=>`<row r="${ri+1}">`+r.map((v,ci)=>{
    const ref=col(ci)+(ri+1), s=ri===0||(r._b)?' s="1"':"";
    if(v===""||v==null) return `<c r="${ref}"${s}/>`;
    if(typeof v==="number"&&isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${X(v)}</t></is></c>`;
  }).join("")+`</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${body}</sheetData></worksheet>`;
}
function workbook(a,b){
  const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zip([
    ["[Content_Types].xml",H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ["_rels/.rels",H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml",H+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="العملاء" sheetId="1" r:id="rId1"/><sheet name="المدفوعات" sheetId="2" r:id="rId2"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels",H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ["xl/styles.xml",H+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B1220"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" xfId="0" fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>'],
    ["xl/worksheets/sheet1.xml",a],["xl/worksheets/sheet2.xml",b]]);
}

function build(){
  const C=(S.coachClients||[]).slice().sort((a,b)=>String(a.full_name||"").localeCompare(String(b.full_name||""),"ar"));
  const h1=["الاسم","الإيميل","الواتساب","الحالة","الباقة","تاريخ البداية","تاريخ النهاية","السعر (ج.م)","مدفوع؟"];
  const r1=[h1,...C.map(c=>[c.full_name||"",c.email||"",c.phone?String(c.phone):"",c.active?"مفعّل":"غير مفعّل",c.sub_plan||"",c.sub_start||"",c.sub_end||"",c.sub_price!=null&&c.sub_price!==""?+c.sub_price:"",c.sub_paid?"مدفوع":(c.sub_plan||c.sub_price?"غير مدفوع":"")])];
  const P=C.filter(c=>c.sub_plan||c.sub_price||c.sub_start||c.sub_end);
  const h2=["الاسم","الباقة","السعر (ج.م)","مدفوع؟","البداية","النهاية","حالة الاشتراك"];
  const r2=[h2,...P.map(c=>{ let s=null; try{ s=subStatus(c); }catch(e){}
    return [c.full_name||"",c.sub_plan||"",c.sub_price!=null&&c.sub_price!==""?+c.sub_price:"",c.sub_paid?"مدفوع":"غير مدفوع",c.sub_start||"",c.sub_end||"",s&&s.text?s.text:""]; })];
  const sum=f=>P.filter(f).reduce((a,c)=>a+(+c.sub_price||0),0);
  const t1=["إجمالي المدفوع","",sum(c=>c.sub_paid)], t2=["إجمالي غير المدفوع","",sum(c=>!c.sub_paid)];
  t1._b=true; t2._b=true; r2.push([""],t1,t2);
  return workbook(sheet(r1,[26,30,18,12,18,14,14,14,12]),sheet(r2,[26,18,14,12,14,14,24]));
}

function exportXlsx(btn){
  try{
    btn&&btn.classList.add("busy");
    const blob=build(), d=new Date(), pad=n=>String(n).padStart(2,"0");
    const name=`mofit-clients-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.xlsx`;
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ a.remove(); URL.revokeObjectURL(a.href); },4000);
    toast("📊 الملف اتجهز - اتحفظ في التنزيلات");
  }catch(e){ toast("تعذر تجهيز الملف، جرّب تاني"); }
  finally{ btn&&setTimeout(()=>btn.classList.remove("busy"),600); }
}
window.mofitExportXlsx=exportXlsx;

const ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13l4 5M13 13l-4 5"/></svg>';
function inject(){
  const ref=document.getElementById("sbRef");
  if(!ref||document.getElementById("xlBtn")) return;
  const b=document.createElement("button"); b.id="xlBtn"; b.type="button"; b.className="xl-btn"; b.innerHTML=ICON+"تصدير Excel";
  b.onclick=()=>exportXlsx(b); ref.parentNode.insertBefore(b,ref);
}
let _t=0;
new MutationObserver(()=>{ if(_t) return; _t=setTimeout(()=>{ _t=0; try{ inject(); }catch(e){} },80); }).observe(document.body,{childList:true,subtree:true});
})();
