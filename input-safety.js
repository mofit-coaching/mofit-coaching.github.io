/* ======================================================================
   MOFIT input safety (DOMPurify): أي نص حر بيتبعت للقاعدة (رسايل الشات،
   الأسماء، الملاحظات، أسماء الأصناف...) بيتنضّف من أي HTML/سكريبت قبل
   الحفظ. النص العادي (حتى لو فيه < أو >) بيفضل زي ما هو.
   - الأمان عندنا أصلًا بيعمل escape وقت العرض؛ دي طبقة تانية (defense in depth).
   - DOMPurify بيتحمل من jsDelivr بـ SRI في index.html. لو مش موجود بنستخدم
     تنضيف بسيط بدله، والتطبيق ما بيقفش.
   - Wraps sb.from(..).insert/update/upsert only; no schema or data changes.
   ====================================================================== */
(function(){
const KEYS=new Set(["body","full_name","notes","note","name","food_name","goal","caption","title","custom_name","coach_note","bio","nickname","comment","message","text","description","label"]);
const TAG=/<\s*[a-z!\/?]/i;
function cleanText(s){
  if(typeof s!=="string"||!TAG.test(s)) return s;
  try{
    if(window.DOMPurify){
      const f=DOMPurify.sanitize(s,{ALLOWED_TAGS:[],ALLOWED_ATTR:[],RETURN_DOM_FRAGMENT:true});
      return (f.textContent||"").replace(/\s+\n/g,"\n").trim();
    }
  }catch(e){}
  return s.replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi,"").replace(/<[^>]*>/g,"").trim();
}
function cleanRow(r){
  if(!r||typeof r!=="object"||Array.isArray(r)) return r;
  let out=null;
  for(const k of Object.keys(r)){
    if(KEYS.has(k)&&typeof r[k]==="string"){ const c=cleanText(r[k]); if(c!==r[k]){ out=out||{...r}; out[k]=c; } }
  }
  return out||r;
}
const clean=v=>Array.isArray(v)?v.map(cleanRow):cleanRow(v);
window.mofitClean=cleanText;
try{
  const _from=sb.from.bind(sb);
  sb.from=function(t){
    const q=_from(t);
    ["insert","update","upsert"].forEach(m=>{
      const o=q[m]; if(typeof o!=="function") return;
      q[m]=function(v){ const a=Array.prototype.slice.call(arguments); a[0]=clean(v); return o.apply(this,a); };
    });
    return q;
  };
}catch(e){}
})();
