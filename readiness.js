/* ======================================================================
   MOFIT READINESS TAP (rd-*): three taps before the session, one honest
   recommendation. Everything comes from the client's own answers today
   (stored on the device only, resets each day). Nothing is measured, no
   invented data, and it never changes the program itself.
   readinessCardHTML(p) -> html string   mounted into #hReady on Home.
   ====================================================================== */
(function(){
if(window.__mofitReady) return; window.__mofitReady=1;

const Q=[
  {k:"e", t:"طاقة النهارده", w:40, o:["وحشة","عادية","تمام"]},
  {k:"s", t:"شد عضلي",      w:35, o:["كتير","شوية","مفيش"]},
  {k:"z", t:"نومك",         w:25, o:["قليل","متوسط","كويس"]}
];
const st=document.createElement("style"); st.textContent=`
.rd-card{border-radius:22px;padding:16px;margin-bottom:14px;background:#fff;border:1px solid #E6EAF2;box-shadow:0 10px 26px -22px rgba(11,18,32,.5)}
.rd-h{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.rd-h .ic{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:1.05rem;background:rgba(249,115,22,.12);color:#EA580C}
.rd-h h2{margin:0;font:700 15px/1.3 Outfit,system-ui,sans-serif;color:#0F172A}
.rd-h small{display:block;font-weight:500;font-size:11px;color:#64748B;margin-top:2px}
.rd-q{display:grid;gap:9px;margin-top:6px}
.rd-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rd-lbl{flex:none;width:96px;font-size:12px;color:#475569;font-weight:600}
.rd-opts{display:flex;gap:6px;flex:1;flex-wrap:wrap}
.rd-o{flex:1;min-width:62px;border:1px solid #E2E8F0;background:#F8FAFC;border-radius:11px;padding:8px 6px;font:600 12px/1 system-ui,sans-serif;color:#475569;cursor:pointer;transition:transform .18s cubic-bezier(.2,.9,.2,1),background .18s,border-color .18s,color .18s}
.rd-o:active{transform:scale(.96)}
.rd-o.on{background:linear-gradient(135deg,#FF6B1A,#FFB347);border-color:#FF6B1A;color:#fff;box-shadow:0 8px 18px -10px rgba(255,107,26,.8)}
.rd-res{margin-top:12px;display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;background:#F8FAFC;border:1px solid #E6EAF2}
.rd-ring{flex:none;width:58px;height:58px;position:relative}
.rd-ring svg{display:block;transform:rotate(-90deg)}
.rd-ring b{position:absolute;inset:0;display:grid;place-items:center;font:800 15px/1 Anton,Outfit,system-ui,sans-serif;color:#0F172A}
.rd-txt{flex:1;min-width:0}
.rd-txt b{display:block;font:700 13px/1.4 Outfit,system-ui,sans-serif;color:#0F172A}
.rd-txt small{display:block;font-size:11.5px;line-height:1.75;color:#64748B;margin-top:3px}
.rd-note{margin:10px 0 0;font-size:10.5px;line-height:1.7;color:#94A3B8}
.rd-card[data-band="low"] .rd-res{background:#FFF7ED;border-color:#FED7AA}
.rd-card[data-band="mid"] .rd-res{background:#FFFBEB;border-color:#FDE68A}
.rd-card[data-band="high"] .rd-res{background:#ECFDF5;border-color:#A7F3D0}
@media(prefers-reduced-motion:reduce){.rd-o{transition:none}}
`;

function keyFor(p){ return "mofit_ready_"+p.id+"_"+today(); }
function load(p){ try{ return JSON.parse(localStorage.getItem(keyFor(p))||"{}"); }catch(e){ return {}; } }
function score(ans){
  let s=0, n=0;
  Q.forEach(q=>{ if(ans[q.k]!=null){ s += (ans[q.k]+1)/3*q.w; n+=q.w; } });
  return n? Math.round(s/n*100) : null;
}
function band(v){ return v==null? null : v<50?"low" : v<75?"mid":"high"; }
function rec(v){
  if(v<50) return {t:"خفّف النهارده", s:"نزّل مجموعة واحدة من كل تمرين، وخلّي آخر مجموعة على RIR 3 (يعني تقدر تعمل 3 عدات زيادة). لو الشد العضلي كتير، خد يوم راحة."};
  if(v<75) return {t:"اتمرن عادي بس بتركيز", s:"كمّل برنامجك زي ما هو، بس خلّي آخر مجموعة على RIR 2 وسيب التمارين التقيلة لآخر الأسبوع."};
  return {t:"تمام، كمّل زي ما هو", s:"جسمك مستعد. اشتغل على الأوزان المخططة وخلّي آخر مجموعة على RIR 1-2."};
}
function ring(v){
  const r=24, c=2*Math.PI*r, off=c*(1-(v||0)/100), col=v<50?"#F97316":v<75?"#F59E0B":"#10B981";
  return `<div class="rd-ring"><svg width="58" height="58" viewBox="0 0 58 58"><circle cx="29" cy="29" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="5"/><circle cx="29" cy="29" r="${r}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="transition:stroke-dashoffset .7s cubic-bezier(.2,.9,.2,1)"/></svg><b>${v==null?"—":v}</b></div>`;
}
function body(p){
  const ans=load(p), v=score(ans);
  const rows=Q.map(q=>`<div class="rd-row"><span class="rd-lbl">${q.t}</span><div class="rd-opts" data-q="${q.k}">${q.o.map((o,i)=>`<button class="rd-o ${ans[q.k]===i?"on":""}" data-v="${i}">${o}</button>`).join("")}</div></div>`).join("");
  const R=v!=null?rec(v):null;
  return `<div class="rd-card" data-band="${band(v)||"none"}">
    <div class="rd-h"><div class="ic">⚡</div><div><h2>استعداد النهارده<small>٣ دوسات قبل التمرين، وبعدها قرار واحد</small></h2></div></div>
    <div class="rd-q">${rows}</div>
    <div class="rd-res">${ring(v)}<div class="rd-txt"><b>${R?R.t:"جاوب على التلاتة عشان يطلع قرارك"}</b><small>${R?R.s:"الدرجة بتتحسب من إجاباتك أنت بس: طاقة 40%، شد عضلي 35%، نوم 25%."}</small></div></div>
    <p class="rd-note">ده رأي استرشادي مبني على إحساسك النهارده، مش تشخيص طبي، وبيتصفّر كل يوم. برنامجك نفسه مش بيتغير.</p>
  </div>`;
}
function readinessCardHTML(p){
  if(!document.querySelector("style[data-rd]")){ st.setAttribute("data-rd","1"); document.head.appendChild(st); }
  return body(p);
}
function wireReadiness(root,p){
  const card=root.querySelector(".rd-card"); if(!card) return;
  card.querySelectorAll("[data-q]").forEach(g=>{
    g.querySelectorAll(".rd-o").forEach(b=>{
      b.onclick=()=>{
        const ans=load(p); ans[g.dataset.q]=+b.dataset.v;
        try{ localStorage.setItem(keyFor(p),JSON.stringify(ans)); }catch(e){}
        const v=score(ans);
        card.dataset.band=band(v)||"none";
        g.querySelectorAll(".rd-o").forEach(x=>x.classList.toggle("on",x===b));
        const res=card.querySelector(".rd-res");
        const R=rec(v);
        res.outerHTML=`<div class="rd-res">${ring(v)}<div class="rd-txt"><b>${R.t}</b><small>${R.s}</small></div></div>`;
        try{ navigator.vibrate&&navigator.vibrate(12); }catch(e){}
      };
    });
  });
}
window.readinessCardHTML=readinessCardHTML;
window.wireReadiness=wireReadiness;
})();
