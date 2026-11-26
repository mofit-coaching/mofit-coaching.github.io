/* MOFIT client avatars: two-letter initials (first letters of the first two name words) on a
   gradient picked from the person's own name, so each client keeps the same colour everywhere
   (coach list, inbox, chat, subscriptions, home). Display only, no data is read or written. */
(function(){
  if(window.__fxAv||typeof window.initials!=="function") return; window.__fxAv=1;
  const PAL=[["#FF7A1A","#FFB020"],["#6D5BFF","#9B8CFF"],["#0FB5A6","#4FE0C8"],["#F0457F","#FF8AB0"],["#2F80ED","#6FB1FF"],["#8E44AD","#C77DDB"],["#16A34A","#6EE7A0"],["#E0661A","#FFC27A"]];
  const CSS=`.av{position:relative}
.av>.avi{position:absolute;inset:0;border-radius:inherit;display:grid;place-items:center;color:#fff;font-weight:800;letter-spacing:.02em;line-height:1;
 background:linear-gradient(145deg,var(--a1),var(--a2));box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -6px 12px -6px rgba(0,0,0,.25);text-shadow:0 1px 2px rgba(0,0,0,.28);font-style:normal;overflow:hidden}
.av>.avi::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 20% 0%,rgba(255,255,255,.28),transparent 55%);pointer-events:none}
.av>.avi.two{font-size:.82em}
.av:has(>.avi){background:transparent!important}
@keyframes fxAvIn{from{scale:.6;opacity:0}to{scale:1;opacity:1}}
.av>.avi{animation:fxAvIn .55s var(--spring,cubic-bezier(.34,1.56,.64,1)) both}
@media(prefers-reduced-motion:reduce){.av>.avi{animation:none}}`;
  const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);
  function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  window.initials=function(p){
    const raw=((p&&(p.full_name||p.email))||"?").trim(), base=raw.includes("@")&&!(p&&p.full_name)?raw.split("@")[0]:raw;
    const words=base.split(/[\s._\-]+/).filter(Boolean);
    const first=ch=>{ const a=Array.from(ch||"?")[0]||"?"; return a.toUpperCase(); };
    const txt=words.length>1?first(words[0])+first(words[1]):first(words[0]);
    const pal=PAL[hash(String((p&&(p.id||p.email))||raw))%PAL.length];
    const safe=typeof window.esc==="function"?window.esc(txt):txt.replace(/[&<>"']/g,"");
    return `<i class="avi${txt.length>1?" two":""}" style="--a1:${pal[0]};--a2:${pal[1]}">${safe}</i>`;
  };
})();
