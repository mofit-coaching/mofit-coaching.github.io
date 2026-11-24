/* Anatomy figure v3: one continuous realistic male silhouette (front/back) with muscle groups laid inside it. Same API as lab.js anatomySVG(vol,{dark}). */
(function(){
  let uid=0;
  const f1=n=>Math.round(n*10)/10;
  function sm(pts,t=1/6){ // closed Catmull-Rom spline through points
    const n=pts.length, P=i=>pts[((i%n)+n)%n]; let s="M"+P(0).join(" ");
    for(let i=0;i<n;i++){ const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);
      s+="C"+[f1(p1[0]+(p2[0]-p0[0])*t),f1(p1[1]+(p2[1]-p0[1])*t),f1(p2[0]-(p3[0]-p1[0])*t),f1(p2[1]-(p3[1]-p1[1])*t),p2[0],p2[1]].join(" "); }
    return s+"Z";
  }
  const mirrorPts=a=>a.map(([x,y])=>[100-x,y]);
  const full=left=>left.concat(mirrorPts(left).reverse()); // left half top->bottom, then right half bottom->top
  const HEAD=sm([[50,2],[55.5,3.5],[58.2,10],[57.6,17],[54.6,23],[50,25.6],[45.4,23],[42.4,17],[41.8,10],[44.5,3.5]]);
  const NECK=sm([[45.6,21],[54.4,21],[55.4,29],[60,33],[40,33],[44.6,29]]);
  const TORSO=sm(full([[50,31],[43,31.5],[36,34],[29.5,38.5],[25.5,43],[28,50],[31.5,57],[33,65],[35.5,74],[38,83],[39,91],[38.4,99],[37,106],[36.2,112],[37.5,117],[43,120],[50,121]]));
  const LEG=sm([[37.5,106],[34.6,113],[31.8,125],[30.6,138],[32.8,149],[34,157],[31.8,167],[32.2,177],[35.6,187],[37,192],[36.6,197],[34,200],[35.5,203],[44.5,203],[45.8,199],[44.8,191],[44,184],[45.2,173],[46.8,164],[47.4,156],[48,150],[48.8,138],[49.8,126],[50,118],[46,110],[41,104]]);
  const ARM=sm([[25.5,40],[21.6,46],[19.4,57],[18.4,68],[17.6,79],[15.2,90],[12.8,100],[11.6,106],[10.2,112],[11.2,118],[14.8,117.4],[17,111],[17.8,104],[20.6,92],[23.6,82],[26.8,72],[30,62],[32.2,56],[29.8,47],[27.6,42]]);
  const R=(x,y,w,h,r=2)=>sm([[x+r,y],[x+w-r,y],[x+w,y+r],[x+w,y+h-r],[x+w-r,y+h],[x+r,y+h],[x,y+h-r],[x,y+r]]);
  const DELT=[[26,38],[32,37],[37,41],[36,51],[31,58],[24,56],[21,49],[22.6,43]];
  const ARMM=[[27,58],[32,60],[29.5,72],[24.5,81],[20.5,81],[20.5,68],[23.5,60]];
  const FRONT=[
    ["أكتاف",DELT],
    ["صدر",[[50,42],[40,40.5],[34,44],[31.5,52],[33.5,59],[42,63],[50,61.5]]],
    ["باي",ARMM],
    ["بطن",[[38,63],[43.5,65.5],[44.4,80],[44,98],[40,93],[37.4,83],[36.4,70]]],
    ["بطن",R(45.4,64,4.6,9.5)],["بطن",R(45.4,75,4.6,9.5)],["بطن",R(45.4,86,4.6,9.5)],["بطن",R(45.4,97,4.6,9)],
    ["أمامية",[[34,114],[45,112],[48.8,121],[47.8,142],[43,152],[35.4,150],[31.6,133]]]
  ];
  const BACK=[
    ["ضهر",[[50,29.5],[44,31.5],[36,36],[27,40],[33,51],[42,58],[50,64]]],
    ["أكتاف",DELT],
    ["ضهر",[[50,66],[42.5,60],[33,58],[31.4,68],[36,83],[43,90],[50,91]]],
    ["ضهر",[[50,92],[43.5,91],[40,98],[42,107],[50,110]]],
    ["تراي",ARMM],
    ["خلفية/أرداف",[[50,103],[39,101],[33.4,108],[33.6,121],[43,126],[50,123]]],
    ["خلفية/أرداف",[[34,127],[48.8,126],[47.8,142],[43,153],[35.4,151],[31.6,137]]],
    ["سمانة",[[33.4,159],[40,157],[45,166],[43.8,179],[38.8,189],[34.4,180],[31.6,168]]]
  ];
  const FRONT_CALF=[["سمانة",[[33.4,160],[40,158],[45,167],[43.8,179],[38.8,188],[34.4,180],[31.6,169]]]];
  window.anatomySVG=function(vol,{dark=false}={}){
    const id="an"+(++uid), max=Math.max(1,...Object.values(vol));
    const ord={}; Object.entries(vol).sort((a,b)=>b[1]-a[1]).forEach(([m],i)=>ord[m]=i);
    const A=dark?"#4A5E8C":"#F6F8FB", B=dark?"#1C2846":"#B9C6D6", edge=dark?"rgba(160,190,255,.45)":"rgba(15,23,42,.25)";
    const sep=dark?"rgba(8,14,30,.5)":"rgba(15,23,42,.2)", inact=dark?"rgba(255,255,255,.045)":"rgba(15,23,42,.05)";
    const cols=[...new Set(Object.keys(vol).filter(m=>vol[m]).map(mColor))];
    const mir='transform="translate(100 0) scale(-1 1)"';
    const SIL=[`<path d="${HEAD}"/>`,`<path d="${NECK}"/>`,`<path d="${TORSO}"/>`,`<path d="${LEG}"/>`,`<path d="${LEG}" ${mir}/>`,`<path d="${ARM}"/>`,`<path d="${ARM}" ${mir}/>`];
    const defs=`<defs>
<linearGradient id="${id}b" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="205"><stop offset="0" stop-color="${A}"/><stop offset="1" stop-color="${B}"/></linearGradient>
<linearGradient id="${id}x" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".28" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
<linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="100" y2="190"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
<linearGradient id="${id}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF6B1A" stop-opacity="${dark?".26":".15"}"/><stop offset="1" stop-color="#FF6B1A" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}f" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity="${dark?".55":".25"}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<pattern id="${id}p" width="2.2" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(62)"><rect width=".8" height="3" fill="#000" opacity=".08"/></pattern>
${cols.map((c,i)=>`<linearGradient id="${id}m${i}" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="100" y2="190"><stop offset="0" stop-color="${c}" stop-opacity=".85"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".8"/></linearGradient>`).join("")}
<clipPath id="${id}c">${SIL.join("")}</clipPath>
</defs>`;
    const fig=(muscles,x,label,k,back)=>{
      const muscleSvg=muscles.map(([m,pts])=>{
        const d=typeof pts==="string"?pts:sm(pts), v=vol[m]||0;
        const pair=(att,extra="")=>`<path d="${d}" ${att}/><path d="${d}" ${mir} ${att}/>`;
        const center=typeof pts==="string"&&false;
        if(!v) return pair(`fill="${inact}" stroke="${sep}" stroke-width=".4" stroke-linejoin="round"`);
        const ci=cols.indexOf(mColor(m)), op=(0.74+0.26*v/max).toFixed(2), top=ord[m]===0;
        const one=tr=>`<g class="mm-on${top?" mm-top":""}" style="--d:${ord[m]*.12}s;--mc:${mColor(m)}" ${tr}><path d="${d}" fill="url(#${id}m${ci})" fill-opacity="${op}" stroke="${mColor(m)}" stroke-width=".5" stroke-linejoin="round"/><path d="${d}" fill="url(#${id}p)"/><path d="${d}" fill="url(#${id}s)" stroke="rgba(255,255,255,.4)" stroke-width=".3" stroke-linejoin="round"/></g>`;
        return one("")+one(mir);
      }).join("");
      const actClip=`<clipPath id="${id}a${k}">${muscles.filter(([m])=>vol[m]).map(([,pts])=>{const d=typeof pts==="string"?pts:sm(pts);return `<path d="${d}"/><path d="${d}" ${mir}/>`}).join("")}</clipPath>`;
      const midline=back?`<path d="M50 30V108" stroke="${sep}" stroke-width=".5" stroke-dasharray="1.2 1.6"/>`:`<path d="M50 62V106" stroke="${sep}" stroke-width=".5"/>`;
      return `<g transform="translate(${x} 4)" class="an-fig"><defs>${actClip}</defs>
<ellipse cx="50" cy="203" rx="28" ry="3.4" fill="url(#${id}f)"/>
<circle class="an-halo" cx="50" cy="104" r="64" fill="url(#${id}h)"/>
<g class="an-hud"><circle cx="50" cy="104" r="72" fill="none" stroke="#FF6B1A" stroke-opacity=".35" stroke-width=".5" stroke-dasharray="1.6 6"/><circle cx="50" cy="104" r="62" fill="none" stroke="${dark?"#fff":"#0F172A"}" stroke-opacity=".12" stroke-width=".4" stroke-dasharray="14 9"/></g>
<g class="an-body">
<g fill="none" stroke="${edge}" stroke-width="1.5" stroke-linejoin="round">${SIL.join("")}</g>
<g fill="url(#${id}b)" stroke="url(#${id}b)" stroke-width=".6">${SIL.join("")}</g>
<g clip-path="url(#${id}c)"><rect x="0" y="0" width="100" height="206" fill="url(#${id}x)"/>${muscleSvg}${midline}</g>
<g clip-path="url(#${id}a${k})"><rect class="an-scan" x="0" y="-50" width="100" height="50" fill="url(#${id}e)"/></g>
<g clip-path="url(#${id}c)"><rect class="an-line" x="0" y="0" width="100" height="1.3" fill="${dark?"#7DD3FC":"#FB923C"}" opacity=".9"/></g></g>
<g class="an-px"><circle cx="14" cy="192" r="1"/><circle cx="86" cy="184" r=".8"/><circle cx="50" cy="198" r="1.1"/><circle cx="6" cy="172" r=".7"/><circle cx="94" cy="192" r=".9"/></g></g>
<text x="${x+50}" y="230" text-anchor="middle" font-size="10" font-weight="700" fill="${dark?"#CBD5E1":"#64748B"}">${label}</text>`;
    };
    return `<svg class="anat" viewBox="0 0 230 236" role="img" aria-label="خريطة العضلات المستهدفة">${defs}${fig(FRONT.concat(FRONT_CALF),5,"أمام",0,false)}${fig(BACK,125,"خلف",1,true)}</svg>`;
  };
})();
