/* Polished anatomy figure (replaces the flat-block version in lab.js; same API, same data logic and Arabic labels). */
(function(){
  let uid=0;
  const SIL={
    head:"M60 6C52 6 48.5 12.5 48.8 20C49 27 53 32 56 33.5L56 38H64L64 33.5C67 32 71 27 71.2 20C71.5 12.5 68 6 60 6Z",
    torso:"M60 44Q47 44 34 51Q29 62 30 76Q31 94 36 110Q40 124 41 136L43 148Q50 153 60 153Z",
    leg:"M43 148Q35 170 37 198Q38 209 42 217Q39 237 41 252L52 252Q54 236 52 217Q57 203 58 188Q60 172 61.5 152Z",
    arm:"M31 52Q19 57 18 72Q17 90 19 105Q15 126 14 146Q13 154 16 160Q22 163 24 155Q29 134 32 108Q34 90 34 70Z"
  };
  const FRONT=[
    ["أكتاف","M32 51Q20 55 18.5 70Q19 81 27 85Q34 77 36 62Q35 55 32 51Z"],
    ["صدر","M60 53Q47 50 35.5 58Q31.5 71 38 84Q49 91 60 86Z"],
    ["باي","M27 87Q20.5 93 19.5 105Q26 109 31.5 105Q34 95 32 87Q30 86 27 87Z"],
    ["بطن","M38.5 90Q42 113 44 140L51 141Q49.5 114 52 92Q45 94 38.5 90Z"],
    ["بطن","M54 91.5h6v13h-6z",1],["بطن","M54 107h6v13h-6z",1],["بطن","M54 122.5h6v15h-6z",1],
    ["أمامية","M44 152Q36.5 172 38 198Q40 209 46.5 211Q55 206 57.5 186Q59.5 168 60.5 154Q51 157 44 152Z"]
  ];
  const BACK=[
    ["ضهر","M60 43L52 47Q42 51 33 55Q47 61 60 82Z"],
    ["أكتاف","M32 51Q20 55 18.5 70Q19 81 27 85Q34 77 36 62Q35 55 32 51Z"],
    ["ضهر","M60 85Q47 71 34.5 65Q31 85 40 111Q50 119 60 121Z"],
    ["ضهر","M60 123Q50 121 42 116Q43 129 45 142L60 142Z"],
    ["تراي","M31.5 79Q21 85 19.5 105Q26 109 31.5 105Q35 92 33.5 81Z"],
    ["خلفية/أرداف","M60 144L43 144Q34.5 153 37.5 169Q50 175 60 169Z"],
    ["خلفية/أرداف","M38 172Q35 192 39.5 208Q47.5 212 55.5 206Q58.5 190 60 175Q48 177 38 172Z"],
    ["سمانة","M39.5 217Q33 233 39.5 249L49 251Q55 235 52 217Z"]
  ];
  window.anatomySVG=function(vol,{dark=false}={}){
    const id="an"+(++uid), max=Math.max(1,...Object.values(vol));
    const top=Object.entries(vol).sort((a,b)=>b[1]-a[1]);
    const ord={}; top.forEach(([m],i)=>ord[m]=i);
    const bodyA=dark?"#2B3A5C":"#F1F5F9", bodyB=dark?"#1B2744":"#CBD5E1", line=dark?"rgba(255,255,255,.14)":"rgba(15,23,42,.14)";
    const off=dark?"rgba(255,255,255,.07)":"rgba(15,23,42,.07)", offLine=dark?"rgba(255,255,255,.12)":"rgba(15,23,42,.10)";
    const cols=[...new Set(Object.keys(vol).filter(m=>vol[m]).map(m=>mColor(m)))];
    const defs=`<defs>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bodyA}"/><stop offset="1" stop-color="${bodyB}"/></linearGradient>
<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<radialGradient id="${id}h" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="${dark?"#FF6B1A":"#FB923C"}" stop-opacity="${dark?".22":".16"}"/><stop offset="1" stop-color="#FF6B1A" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}f" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity="${dark?".5":".22"}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
${cols.map((c,i)=>`<linearGradient id="${id}m${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="1"/><stop offset="1" stop-color="${c}"/></linearGradient>`).join("")}
</defs>`;
    const mirror=(d,att)=>`<path d="${d}" ${att}/><path d="${d}" transform="translate(120 0) scale(-1 1)" ${att}/>`;
    const shape=d=>mirror(d,`fill="url(#${id}b)" stroke="${line}" stroke-width=".9" stroke-linejoin="round"`);
    const muscle=([m,d,center])=>{
      const v=vol[m]||0, ci=cols.indexOf(mColor(m));
      if(!v){ return center?`<path d="${d}" fill="${off}" stroke="${offLine}" stroke-width=".6"/>`:mirror(d,`fill="${off}" stroke="${offLine}" stroke-width=".6" stroke-linejoin="round"`); }
      const op=(0.62+0.38*v/max).toFixed(2), isTop=ord[m]===0;
      const cls=`mm-on${isTop?" mm-top":""}`, st=`style="--d:${ord[m]*.12}s;--mc:${mColor(m)}"`;
      const one=(tr)=>`<g class="${cls}" ${st} ${tr}><path d="${d}" fill="url(#${id}m${ci})" fill-opacity="${op}" stroke="${mColor(m)}" stroke-width=".8" stroke-linejoin="round"/><path d="${d}" fill="url(#${id}s)" stroke="rgba(255,255,255,.5)" stroke-width=".5" stroke-linejoin="round"/></g>`;
      return center?one(""):one("")+one('transform="translate(120 0) scale(-1 1)"');
    };
    const fig=(muscles,x,label)=>`<g transform="translate(${x} 0)">
<ellipse cx="60" cy="256" rx="38" ry="5" fill="url(#${id}f)"/>
<circle cx="60" cy="140" r="54" fill="url(#${id}h)"/>
<path d="${SIL.head}" fill="url(#${id}b)" stroke="${line}" stroke-width=".9"/>
${shape(SIL.leg)}${shape(SIL.torso)}${shape(SIL.arm)}
${muscles.map(muscle).join("")}</g>
<text x="${x+60}" y="276" text-anchor="middle" font-size="11" font-weight="700" fill="${dark?"#CBD5E1":"#64748B"}">${label}</text>`;
    return `<svg class="anat" viewBox="0 0 250 282" role="img" aria-label="خريطة العضلات المستهدفة">${defs}${fig(FRONT,0,"أمام")}${fig(BACK,130,"خلف")}</svg>`;
  };
})();
