/* MOFIT typo-proof Arabic search (Fuse.js v7.5.0, Apache-2.0, loaded from jsDelivr; matching runs fully on the phone, no data leaves the app).
   Hooks the food picker: when the server search returns few/no results (typo, ة/ه, أ/ا, ى/ي ...),
   fuzzy matches from a locally cached food list are appended. Original results always come first. */
(function(){
  if(window.__mofitSearch||typeof sb==="undefined"||!sb.rpc) return; window.__mofitSearch=1;
  const norm=s=>String(s||"").toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
    .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي")
    .replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\s+/g," ").trim();
  window.mofitNorm=norm;
  let fuse=null, loading=null;
  async function load(){
    if(fuse) return fuse; if(loading) return loading;
    loading=(async()=>{
      const rows=[]; for(let from=0;from<10000;from+=1000){
        const { data, error } = await sb.from("foods").select("*").range(from,from+999);
        if(error||!data) break; rows.push(...data); if(data.length<1000) break; }
      if(!rows.length) return null;
      let Fuse; try{ Fuse=(await import("https://cdn.jsdelivr.net/npm/fuse.js@7.5.0/dist/fuse.basic.min.mjs")).default; }catch(e){ return null; }
      rows.forEach(r=>{ r._n=norm(r.name); });
      fuse=new Fuse(rows,{keys:["_n"],threshold:0.38,ignoreLocation:true,minMatchCharLength:2,includeScore:true});
      return fuse; })().catch(()=>null);
    return loading;
  }
  const orig=sb.rpc.bind(sb);
  sb.rpc=function(name,args){
    const p=orig(name,args);
    if(name!=="search_foods"||!args||!args.q) return p;
    return Promise.resolve(p).then(async res=>{
      try{
        const base=(res&&res.data)||[];
        if(base.length>=6) return res;
        const f=await load(); if(!f) return res;
        const q=norm(args.q), seen=new Set(base.map(x=>x.id));
        const extra=f.search(q,{limit:20}).map(r=>r.item).filter(x=>!seen.has(x.id)).map(x=>{ const c={...x}; delete c._n; return c; });
        if(!extra.length) return res;
        return {...res,data:[...base,...extra].slice(0,30)};
      }catch(e){ return res; } });
  };
  /* warm the cache the first time a food picker opens */
  new MutationObserver(()=>{ if(!fuse&&!loading&&document.getElementById("fpQ")) load(); }).observe(document.body,{childList:true,subtree:true});
})();
