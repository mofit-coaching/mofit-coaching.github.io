/* ======================================================================
   Mofit charts — Chart.js 4 (MIT, vendored chart.min.js).
   Upgrades every lineChart() SVG to an animated, smoothed Chart.js line.
   The original SVG stays as fallback and is hidden only after the Chart
   instance is live, so a missing/blocked library changes nothing.
   ====================================================================== */
(function(){
if(typeof Chart==="undefined"){
  /* Lazy: chart.min.js (206KB) is no longer in index.html. Inject it once, then re-run this module.
     Version tag copied from our own script URL so the service worker cache stays in sync. */
  if(!window.__mofitChartLib){ window.__mofitChartLib=1;
    const me=document.currentScript&&document.currentScript.src||""; const v=(me.split("?v=")[1]||"").split("&")[0];
    const s=document.createElement("script"); s.src="chart.min.js"+(v?"?v="+v:"");
    s.onload=()=>{ const r=document.createElement("script"); r.src="charts.js"+(v?"?v="+v:""); document.head.appendChild(r); };
    document.head.appendChild(s);
  }
  return;
}
Chart.defaults.font.family="Cairo,sans-serif";
Chart.defaults.color="#64748B";
const reg=new Map();
function build(cv){
  let pts=[]; try{ pts=JSON.parse(cv.dataset.pts||"[]"); }catch(e){}
  if(pts.length<2) return;
  const color=cv.dataset.color||"#0F172A";
  const unit=cv.dataset.unit||"";
  const g=cv.getContext("2d").createLinearGradient(0,0,0,170);
  g.addColorStop(0,"rgba(249,115,22,.26)"); g.addColorStop(1,"rgba(249,115,22,0)");
  const chart=new Chart(cv,{type:"line",
    data:{labels:pts.map(p=>p.x===0?"Start":"W"+p.x),
      datasets:[{data:pts.map(p=>p.y),borderColor:color,borderWidth:2.5,tension:.38,fill:true,backgroundColor:g,
        pointRadius:pts.map((_,i)=>i===pts.length-1?5:3.2),
        pointBackgroundColor:pts.map((_,i)=>i===pts.length-1?"#F97316":"#fff"),
        pointBorderColor:pts.map((_,i)=>i===pts.length-1?"#fff":color),pointBorderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:6}},
      animation:{duration:900,easing:"easeOutQuart"},
      plugins:{legend:{display:false},tooltip:{rtl:true,displayColors:false,padding:10,
        backgroundColor:"#0F172A",titleFont:{weight:"700"},
        callbacks:{title:it=>it[0].label==="Start"?"البداية":"أسبوع "+it[0].label.slice(1),
          label:it=>" "+(+it.parsed.y).toFixed(1)+" "+unit}}},
      scales:{x:{grid:{display:false},ticks:{font:{size:10}}},
        y:{grid:{color:"#E2E8F0",borderDash:[3,4]},border:{display:false},ticks:{font:{size:9},maxTicksLimit:4,callback:v=>(+v).toFixed(1)}}}}});
  reg.set(cv,chart);
  const w=cv.closest(".cj-w"); if(w) w.style.display="block";
  const svg=w&&w.parentElement?w.parentElement.querySelector(":scope > svg"):null; if(svg) svg.style.display="none";
}
function scan(root){
  (root.querySelectorAll?root.querySelectorAll("canvas.cj"):[]).forEach(cv=>{ if(!cv.dataset.on){ cv.dataset.on=1; try{ build(cv); }catch(e){} } });
  reg.forEach((ch,cv)=>{ if(!cv.isConnected){ ch.destroy(); reg.delete(cv); } });
}
new MutationObserver(recs=>{ recs.forEach(r=>r.addedNodes.forEach(n=>{ if(n.nodeType===1) scan(n); })); })
  .observe(document.body,{childList:true,subtree:true});
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>scan(document.body)); else scan(document.body);
window.mofitCharts={scan};
})();
