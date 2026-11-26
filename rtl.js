/* Arabic/RTL polish (from the arabic-rtl audit). Nothing here moves or reorders anything.
   1) Arabic letters keep their connections: no letter-spacing on Arabic text.
   2) Email / phone / password boxes use left-to-right typing rules, text stays right-aligned as before.
   3) Arabic-Indic digits (٠١٢٣) typed by the user become 0123 before validation. */
(function(){
const st=document.createElement("style");
st.textContent=`
.sub,th,.login-art p,.pill,h1,h2,h3{letter-spacing:0}
input[type=email],input[type=tel],input[type=password],input[type=url],input[type=number]{direction:ltr;text-align:end}
input[type=email]::placeholder,input[type=tel]::placeholder,input[type=password]::placeholder,input[type=number]::placeholder{direction:ltr;text-align:end}
`;
document.head.appendChild(st);
const AR="٠١٢٣٤٥٦٧٨٩",PR="۰۱۲۳۴۵۶۷۸۹";
window.normDigits=function(s){return String(s==null?"":s).replace(/[٠-٩]/g,c=>AR.indexOf(c)).replace(/[۰-۹]/g,c=>PR.indexOf(c))};
/* paste and old values: phone parsing accepts Arabic digits too */
if(typeof normPhone==="function"){const _np=normPhone;window.normPhone=v=>_np(window.normDigits(v))}
document.addEventListener("beforeinput",e=>{
  const t=e.target;
  if(!t||t.tagName!=="INPUT"||!e.data||!/[٠-٩۰-۹]/.test(e.data))return;
  if(!/^(tel|number|text|search|email|)$/i.test(t.type||""))return;
  e.preventDefault();
  const v=window.normDigits(e.data);
  try{ if(!document.execCommand("insertText",false,v)) throw 0 }
  catch(_){ if(t.setRangeText){t.setRangeText(v,t.selectionStart,t.selectionEnd,"end");t.dispatchEvent(new Event("input",{bubbles:true}))} }
},true);
})();
