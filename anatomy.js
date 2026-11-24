/* Anatomy figure v2: refined silhouette, per-muscle shading, animated scan + energy flow. Same API as lab.js anatomySVG. */
(function(){
  let uid=0;
  const HEAD="M60 5.5C52.5 5.5 48.6 11.5 48.9 19C49.1 26 52.6 31 56 33L56 38.5L64 38.5L64 33C67.4 31 70.9 26 71.1 19C71.4 11.5 67.5 5.5 60 5.5Z";
  const BODY="M60 42L56 42Q55.5 46 47 48Q37 50 31 54Q29 65 31 77Q33.5 93 37 107Q40.5 119 40.5 129Q38.5 138 37 150Q34 168 35 186Q36 201 38 212Q35.5 223 36 234Q37 245 40 252L53 252Q54.5 241 54 229Q53.5 219 56 211Q59.5 197 61 177L61.5 154L60 150Z";
  const ARM="M30 55Q19 58 18 74Q17.5 90 20 106Q16 124 14.5 144Q13 153 15.5 160Q21 163 24 156Q28 136 31.5 110Q35 92 34 72Q33.5 62 30 55Z";
  const DELT="M31 53Q20.5 56 18.5 71Q19 81 26 86Q33 79 35.5 64Q35 56 31 53Z";
  const FRONT=[
    ["ضهر","M56 43Q50 47 45 48Q38 50 32 54L36 58Q46 54.5 56 50Z"],
    ["أكتاف",DELT],
    ["صدر","M60 54Q47 51 36 58Q32.5 70 37 82Q41 88 49 88Q56 88 60 85Z"],
    ["باي","M27 88Q20.5 94 20 106Q26 110.5 31 106Q34 96 32.5 88Z"],
    ["بطن","M37.5 87Q38 99 41 112Q43 124 43.5 137L48.5 137Q47.5 118 48 99Q42.5 98 37.5 87Z"],
    ["بطن","M51.5 90.5h8.5v10h-8.5z",1],["بطن","M51.5 102.5h8.5v10h-8.5z",1],["بطن","M51.5 114.5h8.5v10h-8.5z",1],["بطن","M51.5 126.5h8.5v11h-8.5z",1],
    ["أمامية","M40.5 154Q34.5 172 36 192Q37 203 40.5 211Q47 212.5 51.5 209Q57.5 198 59 178Q60.5 164 60.8 156Q52 158.5 44.5 153.5Z"]
  ];
  const BACK=[
    ["ضهر","M60 41L55.5 43Q46 49 33 55Q45 62 60 84Z"],
    ["أكتاف",DELT],
    ["ضهر","M60 88Q47 74 34.5 66Q31.5 86 39 112Q49 121 60 122Z"],
    ["ضهر","M60 124Q51 122 43 117Q43 130 45 142L60 144Z"],
    ["تراي","M31.5 80Q21 86 19.5 106Q26 110.5 31.5 106Q35 94 33.5 82Z"],
    ["خلفية/أرداف","M60 146L42.5 146Q34 155 37 170Q49 177 60 171Z"],
    ["خلفية/أرداف","M37.5 174Q34.5 193 39.5 209Q48 214 56.5 207Q59.5 191 60.5 176Q48 178 37.5 174Z"],
    ["سمانة","M40 217Q34.5 231 39 246L47 248Q50.5 232 47.5 217Z"],
    ["سمانة","M48.5 218Q53.5 231 51 243L48 246Q50 232 48.5 218Z"]
  ];
  window.anatomySVG=function(vol,{dark=false}={}){
    const id="an"+(++uid), max=Math.max(1,...Object.values(vol));
    const ord={}; Object.entries(vol).sort((a,b)=>b[1]-a[1]).forEach(([m],i)=>ord[m]=i);
    const A=dark?"#3A4B73":"#F8FAFC", B=dark?"#16213B":"#CFD8E3", line=dark?"rgba(160,185,235,.28)":"rgba(15,23,42,.16)";
    const off=dark?"rgba(255,255,255,.055)":"rgba(15,23,42,.06)", offLine=dark?"rgba(255,255,255,.10)":"rgba(15,23,42,.09)";
    const cols=[...new Set(Object.keys(vol).filter(m=>vol[m]).map(mColor))];
    const mir='transform="translate(120 0) scale(-1 1)"';
    const both=(d,att)=>`<path d="${d}" ${att}/><path d="${d}" ${mir} ${att}/>`;
    const defs=`<defs>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A}"/><stop offset="1" stop-color="${B}"/></linearGradient>
<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
<linearGradient id="${id}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF6B1A" stop-opacity="${dark?".26":".16"}"/><stop offset="1" stop-color="#FF6B1A" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}f" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity="${dark?".55":".25"}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<pattern id="${id}p" width="2.4" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(62)"><rect width="1" height="3" fill="#000" opacity=".07"/></pattern>
${cols.map((c,i)=>`<linearGradient id="${id}m${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".8"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".78"/></linearGradient>`).join("")}
<clipPath id="${id}c"><path d="${HEAD}"/><path d="${BODY}"/><path d="${BODY}" ${mir}/><path d="${ARM}"/><path d="${ARM}" ${mir}/></clipPath>
</defs>`;
    const fig=(muscles,x,label,k)=>{
      const act=muscles.filter(([m])=>vol[m]);
      const clipId=`${id}a${k}`;
      const clip=`<clipPath id="${clipId}">${act.map(([,d,c])=>c?`<path d="${d}"/>`:`<path d="${d}"/><path d="${d}" ${mir}/>`).join("")}</clipPath>`;
      const muscle=([m,d,center])=>{
        const v=vol[m]||0; if(!v) return center?`<path d="${d}" fill="${off}" stroke="${offLine}" stroke-width=".5"/>`:both(d,`fill="${off}" stroke="${offLine}" stroke-width=".5" stroke-linejoin="round"`);
        const ci=cols.indexOf(mColor(m)), op=(0.7+0.3*v/max).toFixed(2), top=ord[m]===0;
        const one=tr=>`<g class="mm-on${top?" mm-top":""}" style="--d:${ord[m]*.12}s;--mc:${mColor(m)}" ${tr}><path d="${d}" fill="url(#${id}m${ci})" fill-opacity="${op}" stroke="${mColor(m)}" stroke-width=".7" stroke-linejoin="round"/><path d="${d}" fill="url(#${id}p)"/><path d="${d}" fill="url(#${id}s)" stroke="rgba(255,255,255,.45)" stroke-width=".4" stroke-linejoin="round"/></g>`;
        return center?one(""):one("")+one(mir);
      };
      return `<g transform="translate(${x} 0)" class="an-fig">
<defs>${clip}</defs>
<ellipse cx="60" cy="256" rx="40" ry="5" fill="url(#${id}f)"/>
<circle class="an-halo" cx="60" cy="138" r="56" fill="url(#${id}h)"/>
<g class="an-hud"><circle cx="60" cy="138" r="62" fill="none" stroke="#FF6B1A" stroke-opacity=".35" stroke-width=".6" stroke-dasharray="2 7"/><circle cx="60" cy="138" r="52" fill="none" stroke="${dark?"#fff":"#0F172A"}" stroke-opacity=".12" stroke-width=".5" stroke-dasharray="18 10"/></g>
<g class="an-body">
<path d="${HEAD}" fill="url(#${id}b)" stroke="${line}" stroke-width=".8"/>
${both(BODY,`fill="url(#${id}b)" stroke="${line}" stroke-width=".8" stroke-linejoin="round"`)}
${both(ARM,`fill="url(#${id}b)" stroke="${line}" stroke-width=".8" stroke-linejoin="round"`)}
${muscles.map(muscle).join("")}
<g clip-path="url(#${clipId})"><rect class="an-scan" x="0" y="-60" width="120" height="62" fill="url(#${id}e)"/></g>
<g clip-path="url(#${id}c)"><rect class="an-line" x="0" y="0" width="120" height="1.6" fill="${dark?"#7DD3FC":"#FB923C"}" opacity=".9"/></g>
</g>
<g class="an-px"><circle cx="30" cy="250" r="1.2"/><circle cx="92" cy="240" r="1"/><circle cx="60" cy="256" r="1.4"/><circle cx="18" cy="230" r=".9"/><circle cx="102" cy="248" r="1.1"/></g>
</g>
<text x="${x+60}" y="277" text-anchor="middle" font-size="11" font-weight="700" fill="${dark?"#CBD5E1":"#64748B"}">${label}</text>`;
    };
    return `<svg class="anat" viewBox="0 0 250 282" role="img" aria-label="خريطة العضلات المستهدفة">${defs}${fig(FRONT,0,"أمام",0)}${fig(BACK,130,"خلف",1)}</svg>`;
  };
})();
