/* MOFIT hero B "Iron Pulse": weight plate + flexed torso + heartbeat shockwaves + glitch-metal wordmark.
   Self-contained: injects its own CSS and DOM into #loginView. Opt-in preview so it can be compared with the live hero:
     open the app with ?hero=b to turn it on (remembered on that device), ?hero=off to turn it off.
   No data, prices or network calls. Respects prefers-reduced-motion. */
(function () {
  "use strict";
  var KEY = "mofit_hero";
  try {
    var q = /[?&]hero=(\w+)/.exec(location.search);
    if (q) { if (q[1] === "b") localStorage.setItem(KEY, "b"); else localStorage.removeItem(KEY); }
    if (localStorage.getItem(KEY) !== "b") return;
  } catch (e) { return; }

  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- torso outline: one half, mirrored, smoothed ---------- */
  var half = [
    [212, 96], [232, 108], [262, 118], [300, 128], [338, 142], [362, 166], [372, 202], [373, 246],
    [368, 292], [361, 336], [356, 380], [354, 418], [346, 442], [326, 444], [318, 420], [316, 372],
    [315, 326], [313, 284], [306, 264], [298, 276], [284, 312], [266, 356], [254, 404], [250, 446], [252, 486]
  ];
  function smooth(pts) {
    var d = "M" + pts[0][0] + " " + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += "C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0] + " " + p2[1];
    }
    return d;
  }
  var right = half.slice();
  var left = half.map(function (p) { return [400 - p[0], p[1]]; }).reverse();
  var outline = smooth(right.concat(left)) + "Z";
  var headPath = "M200 40C220 40 233 55 233 74C233 92 222 104 211 108L189 108C178 104 167 92 167 74C167 55 180 40 200 40Z";

  /* fibre lines flowing out from the chest */
  function fibres() {
    var s = "", i, a, x, y, cx, cy;
    for (i = 0; i < 46; i++) {
      a = (i / 46) * Math.PI * 2;
      x = 200 + Math.cos(a) * 260; y = 200 + Math.sin(a) * 300;
      cx = 200 + Math.cos(a + 0.5) * 110; cy = 200 + Math.sin(a + 0.5) * 120;
      s += '<path class="hb-fb" style="animation-delay:' + (-(i * 0.37) % 6).toFixed(2) + 's" pathLength="1" d="M200 190Q' + cx.toFixed(0) + " " + cy.toFixed(0) + " " + x.toFixed(0) + " " + y.toFixed(0) + '"/>';
    }
    for (i = 0; i < 14; i++) { /* lat / waist striations */
      var yy = 250 + i * 15;
      s += '<path class="hb-fb h" style="animation-delay:' + (-(i * 0.5)).toFixed(2) + 's" pathLength="1" d="M' + (210 + i * 3) + " " + yy + "Q" + (300 - i * 2) + " " + (yy - 30) + " " + (372 - i * 4) + " " + (yy - 70) + '"/>';
      s += '<path class="hb-fb h" style="animation-delay:' + (-(i * 0.5 + 1)).toFixed(2) + 's" pathLength="1" d="M' + (190 - i * 3) + " " + yy + "Q" + (100 + i * 2) + " " + (yy - 30) + " " + (28 + i * 4) + " " + (yy - 70) + '"/>';
    }
    return s;
  }
  var cuts =
    /* pec underline, ab grid, delt split, lat edge: thin cut lines that read as anatomy */
    '<path class="hb-cut" d="M200 150V400"/>' +
    '<path class="hb-cut" d="M120 214Q160 238 198 218M280 214Q240 238 202 218"/>' +
    '<path class="hb-cut" d="M170 262H230M168 296H232M170 330H230M174 364H226"/>' +
    '<path class="hb-cut" d="M292 134Q300 176 304 232M108 134Q100 176 96 232"/>' +
    '<path class="hb-cut" d="M168 100Q184 128 200 124Q216 128 232 100"/>';

  function torsoSVG(k) {
    return '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet" focusable="false">' +
      '<defs>' +
      '<clipPath id="hbClip' + k + '"><path d="' + outline + '"/><path d="' + headPath + '"/></clipPath>' +
      '<linearGradient id="hbBody' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20283d"/><stop offset=".55" stop-color="#0d1322"/><stop offset="1" stop-color="#05070F"/></linearGradient>' +
      '<radialGradient id="hbHeart' + k + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFB27A" stop-opacity=".95"/><stop offset=".35" stop-color="#FF4D1A" stop-opacity=".55"/><stop offset="1" stop-color="#FF4D1A" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hbRim' + k + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC46B"/><stop offset=".5" stop-color="#FF6B1A"/><stop offset="1" stop-color="#5B6CFF"/></linearGradient>' +
      '<filter id="hbBlur' + k + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>' +
      '</defs>' +
      '<g class="hb-rimglow"><path d="' + outline + '" fill="none" stroke="url(#hbRim' + k + ')" stroke-width="7" filter="url(#hbBlur' + k + ')"/><path d="' + headPath + '" fill="none" stroke="url(#hbRim' + k + ')" stroke-width="7" filter="url(#hbBlur' + k + ')"/></g>' +
      '<path d="' + outline + '" fill="url(#hbBody' + k + ')"/><path d="' + headPath + '" fill="url(#hbBody' + k + ')"/>' +
      '<g clip-path="url(#hbClip' + k + ')">' + fibres() + '<g>' + cuts + '</g>' +
      '<circle class="hb-heart" cx="200" cy="190" r="150" fill="url(#hbHeart' + k + ')"/>' +
      '<rect class="hb-scan2" x="0" y="0" width="400" height="26" fill="url(#hbRim' + k + ')" opacity=".0"/></g>' +
      '<path d="' + outline + '" fill="none" stroke="url(#hbRim' + k + ')" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="' + headPath + '" fill="none" stroke="url(#hbRim' + k + ')" stroke-width="1.6"/>' +
      '</svg>';
  }

  /* ---------- weight plate ---------- */
  function plateSVG() {
    var ticks = "", i, a, c, s;
    for (i = 0; i < 144; i++) {
      a = (i / 144) * Math.PI * 2; c = Math.cos(a); s = Math.sin(a);
      var r1 = 352, r2 = i % 6 === 0 ? 336 : 344;
      ticks += "M" + (400 + c * r1).toFixed(1) + " " + (400 + s * r1).toFixed(1) + "L" + (400 + c * r2).toFixed(1) + " " + (400 + s * r2).toFixed(1);
    }
    var bolts = "";
    for (i = 0; i < 8; i++) {
      a = (i / 8) * Math.PI * 2 + Math.PI / 8; c = Math.cos(a); s = Math.sin(a);
      bolts += '<circle cx="' + (400 + c * 120).toFixed(1) + '" cy="' + (400 + s * 120).toFixed(1) + '" r="9" fill="#0a0e19" stroke="#8d97ad" stroke-width="2"/>';
    }
    return '<svg viewBox="0 0 800 800" focusable="false">' +
      '<defs>' +
      '<radialGradient id="hbPl" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#151b2c"/><stop offset=".86" stop-color="#232b42"/><stop offset=".95" stop-color="#3a4462"/><stop offset="1" stop-color="#0a0e19"/></radialGradient>' +
      '<linearGradient id="hbRimM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8edf7"/><stop offset=".3" stop-color="#6c768e"/><stop offset=".5" stop-color="#1a2133"/><stop offset=".72" stop-color="#FF6B1A"/><stop offset="1" stop-color="#FFC46B"/></linearGradient>' +
      '<path id="hbTx" d="M400 400m-296 0a296 296 0 1 1 592 0a296 296 0 1 1 -592 0"/>' +
      '</defs>' +
      '<circle cx="400" cy="400" r="392" fill="none" stroke="url(#hbRimM)" stroke-width="6"/>' +
      '<circle cx="400" cy="400" r="386" fill="url(#hbPl)"/>' +
      '<circle cx="400" cy="400" r="366" fill="none" stroke="#0a0e19" stroke-width="10"/>' +
      '<path d="' + ticks + '" stroke="#9aa4ba" stroke-opacity=".55" stroke-width="2.2" fill="none"/>' +
      '<circle cx="400" cy="400" r="326" fill="none" stroke="#4a5574" stroke-opacity=".6" stroke-width="2"/>' +
      '<text font-family="Anton,Impact,sans-serif" font-size="46" letter-spacing="14" fill="#c4ccdc" fill-opacity=".62"><textPath href="#hbTx" startOffset="0">MOFIT  ·  20 KG  ·  IRON  ·  PULSE  ·  MOFIT  ·  20 KG  ·  IRON  ·  PULSE  ·</textPath></text>' +
      '<circle cx="400" cy="400" r="262" fill="none" stroke="#FF6B1A" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 12"/>' +
      '<circle cx="400" cy="400" r="228" fill="none" stroke="#0a0e19" stroke-width="14"/>' +
      '<circle cx="400" cy="400" r="196" fill="#0d1322" stroke="#5a6684" stroke-width="2"/>' +
      bolts +
      '<circle cx="400" cy="400" r="62" fill="#05070F" stroke="url(#hbRimM)" stroke-width="5"/>' +
      '<circle cx="400" cy="400" r="30" fill="#000"/>' +
      '</svg>';
  }

  function ecgPath(centres) {
    var d = "M0 100", i, o;
    for (i = 0; i < centres.length; i++) {
      o = centres[i] - 500;
      d += "H" + (380 + o) + "L" + (396 + o) + " 100L" + (408 + o) + " 84L" + (420 + o) + " 100H" + (452 + o) + "L" + (470 + o) + " 36L" + (494 + o) + " 168L" + (514 + o) + " 62L" + (528 + o) + " 108L" + (540 + o) + " 100";
    }
    return d + "H1000";
  }

  var CSS = [
    "html .login.hb{background:#04060c!important;isolation:isolate}",
    "html .login.hb::before,html .login.hb::after{display:none!important}",
    "html .login.hb .login-art::before,html .login.hb .login-art::after,html .login.hb .hero-svg{display:none!important}",
    "html .login.hb .logo-big{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);opacity:0}",
    ".hb-stage{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:radial-gradient(120% 80% at 50% 28%,#121a30 0%,#080c18 55%,#03050a 100%);--b:0;--u:min(100vw,100vh)}",
    ".hb-l{position:absolute;left:50%;will-change:transform}",
    ".hb-plate{top:30%;width:min(150vw,150vh);aspect-ratio:1;margin-left:calc(min(150vw,150vh)/-2);margin-top:calc(min(150vw,150vh)/-2)}",
    ".hb-plate .in{width:100%;height:100%;transform:scale(calc(1 + var(--b)*.012));filter:drop-shadow(0 0 40px rgba(255,107,26,.18))}",
    ".hb-plate svg{width:100%;height:100%;animation:hbSpin 140s linear infinite}",
    "@keyframes hbSpin{to{transform:rotate(360deg)}}",
    ".hb-b2{display:none}.hb-wide .hb-b2{display:block;left:24%;opacity:.62}.hb-wide .hb-b1{left:76%}.hb-body{top:1%;height:min(98vh,125vw);aspect-ratio:.8;margin-left:calc(min(98vh,125vw)*-.4)}",
    ".hb-body svg{width:100%;height:100%;overflow:visible;opacity:.96}",
    ".hb-fb{fill:none;stroke:#FF6B1A;stroke-width:1.1;stroke-opacity:.34;stroke-dasharray:.16 .84;animation:hbFlow 6s linear infinite}",
    ".hb-fb.h{stroke:#FFC46B;stroke-opacity:.2}",
    "@keyframes hbFlow{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}",
    ".hb-cut{fill:none;stroke:#000;stroke-opacity:.55;stroke-width:3;stroke-linecap:round}",
    ".hb-heart{transform-origin:200px 190px;opacity:calc(.28 + var(--bb,0)*.72);transform:scale(calc(.82 + var(--bb,0)*.3))}",
    ".hb-rimglow{opacity:calc(.35 + var(--bb,0)*.5)}",
    ".hb-wave{position:absolute;left:50%;top:37.5%;width:30%;aspect-ratio:1;margin:-15% 0 0 -15%;border-radius:50%;border:2px solid rgba(255,140,60,.9);box-shadow:0 0 24px rgba(255,107,26,.6),inset 0 0 24px rgba(255,107,26,.35);animation:hbWave 2.1s cubic-bezier(.1,.6,.3,1) forwards}",
    "@keyframes hbWave{from{transform:scale(.15);opacity:.95}to{transform:scale(5.4);opacity:0}}",
    ".hb-ecg{position:absolute;left:0;top:calc(1% + min(98vh,125vw)*.375 - 7vh);width:100%;height:14vh;overflow:visible}",
    ".hb-ecg path{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}",
    ".hb-ecg .base{stroke:#fff;stroke-opacity:.1;stroke-width:2}",
    ".hb-ecg .run{stroke:url(#hbEg);stroke-width:5;stroke-dasharray:.22 1;stroke-dashoffset:.22;filter:drop-shadow(0 0 10px #FF6B1A) drop-shadow(0 0 26px rgba(255,107,26,.7))}",
    ".hb-fx{position:absolute;inset:0;width:100%;height:100%}",
    ".hb-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,transparent 38%,rgba(2,3,8,.82) 100%)}",
    ".hb-grain{position:absolute;inset:-50%;opacity:.14;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\");animation:hbGrain .9s steps(5) infinite}",
    "@keyframes hbGrain{0%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-3%)}60%{transform:translate(-2%,-1%)}80%{transform:translate(3%,3%)}100%{transform:translate(0,0)}}",
    ".hb-flash{position:absolute;inset:0;background:#fff;opacity:0}",
    /* title */
    ".hb-title{position:relative;z-index:2;margin:clamp(30px,9vh,90px) 0 0;display:flex;gap:.06em;direction:ltr;justify-content:center;align-items:flex-end;font-family:Anton,Impact,'Arial Narrow',sans-serif;font-weight:400;font-size:clamp(5rem,29vw,17rem);line-height:.86;letter-spacing:.012em;text-transform:uppercase}",
    ".hb-w{position:relative;display:inline-block;color:transparent;-webkit-background-clip:text;background-clip:text;-webkit-text-stroke:1px rgba(0,0,0,.35);" +
      "background-image:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.95) 50%,transparent 62%),linear-gradient(180deg,#ffffff 0%,#d3dae8 26%,#707a91 47%,#161d2e 50%,#8089a0 58%,#eef1f8 80%,#8d97ad 100%);" +
      "background-size:260% 100%,100% 100%;background-repeat:no-repeat;background-position:160% 0,0 0;animation:hbShine 5.2s ease-in-out 2.4s infinite;" +
      "filter:drop-shadow(0 3px 0 rgba(0,0,0,.65)) drop-shadow(0 0 calc(18px + var(--b)*34px) rgba(255,107,26,calc(.14 + var(--b)*.4)))}",
    ".hb-w.fit{background-image:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.95) 50%,transparent 62%),linear-gradient(180deg,#fff6d2 0%,#ffd28a 24%,#ff9a3d 46%,#6a1d00 50%,#ff7a22 58%,#ffc46b 82%,#ff8a3d 100%)}",
    "@keyframes hbShine{0%,55%{background-position:160% 0,0 0}80%,100%{background-position:-60% 0,0 0}}",
    ".hb-w::before,.hb-w::after{content:attr(data-t);position:absolute;left:0;top:0;-webkit-text-fill-color:currentColor;opacity:0;pointer-events:none;mix-blend-mode:screen;filter:none}",
    ".hb-w::before{color:#c4203f;animation:hbG1 7.4s steps(1,end) 1.15s infinite}",
    ".hb-w::after{color:#2f46c8;animation:hbG2 7.4s steps(1,end) 1.15s infinite}",
    "@keyframes hbG1{0%{opacity:.7;transform:translate(-9px,0);clip-path:inset(8% 0 62% 0)}3%{opacity:.7;transform:translate(7px,2px);clip-path:inset(50% 0 20% 0)}6%{opacity:.7;transform:translate(-14px,-2px);clip-path:inset(72% 0 4% 0)}9%{opacity:.7;transform:translate(5px,0);clip-path:inset(24% 0 52% 0)}12%{opacity:0}61%{opacity:.7;transform:translate(-5px,0);clip-path:inset(34% 0 44% 0)}63%{opacity:.7;transform:translate(6px,0);clip-path:inset(66% 0 10% 0)}65%,100%{opacity:0}}",
    "@keyframes hbG2{0%{opacity:.7;transform:translate(10px,0);clip-path:inset(58% 0 12% 0)}3%{opacity:.7;transform:translate(-8px,-2px);clip-path:inset(4% 0 70% 0)}6%{opacity:.7;transform:translate(12px,2px);clip-path:inset(40% 0 36% 0)}9%{opacity:.7;transform:translate(-6px,0);clip-path:inset(76% 0 2% 0)}12%{opacity:0}62%{opacity:.7;transform:translate(6px,0);clip-path:inset(18% 0 60% 0)}64%{opacity:.7;transform:translate(-5px,0);clip-path:inset(54% 0 24% 0)}66%,100%{opacity:0}}",
    ".hb-sub{position:relative;z-index:2;margin-top:clamp(8px,1.8vh,20px);font-size:clamp(1rem,2.3vw,1.6rem);color:#c9d2e4;letter-spacing:.02em;text-shadow:0 2px 14px rgba(0,0,0,.9)}",
    "html .login.hb .login-art{min-height:46svh;min-height:46vh;padding-top:calc(18px + env(safe-area-inset-top))}",
    "html .login.hb .login-art>p{display:none}",
    "html .login.hb .login-card{z-index:3;margin-top:4px}",
    /* intro timeline */
    ".hb-go .hb-plate .in{animation:hbSlam 1.1s cubic-bezier(.12,.9,.2,1) both}",
    "@keyframes hbSlam{0%{opacity:0;transform:scale(1.5);filter:blur(14px)}45%{opacity:.7;transform:scale(.985);filter:blur(0)}60%{transform:scale(1.02)}100%{transform:scale(1)}}",
    ".hb-go .hb-body svg{animation:hbReveal 1.5s cubic-bezier(.3,.7,.2,1) .55s both}",
    "@keyframes hbReveal{from{clip-path:inset(0 0 100% 0);opacity:.2}to{clip-path:inset(0 0 0 0);opacity:.96}}",
    ".hb-go .hb-ecg{animation:hbFade .8s ease .9s both}",
    "@keyframes hbFade{from{opacity:0}to{opacity:1}}",
    ".hb-go .hb-flash{animation:hbFlash .7s ease-out .42s both}",
    "@keyframes hbFlash{0%{opacity:0}5%{opacity:.55}100%{opacity:0}}",
    ".hb-go .hb-title{animation:hbTitle 1.1s cubic-bezier(.2,.9,.2,1) 1.2s both}",
    "@keyframes hbTitle{from{opacity:0;letter-spacing:.3em;filter:blur(10px)}to{opacity:1;letter-spacing:.012em;filter:blur(0)}}",
    ".hb-go .hb-sub{animation:hbFade 1s ease 2s both}",
    ".hb-go .login-card{animation:hbCard .9s cubic-bezier(.2,.9,.25,1) 1.9s both}",
    "@keyframes hbCard{from{opacity:0;transform:translateY(60px)}to{opacity:.7;transform:none}}",
    ".hb-go.hb-shake{animation:hbShake .5s linear .42s}",
    "@keyframes hbShake{0%,100%{transform:none}15%{transform:translate(-8px,5px)}30%{transform:translate(7px,-6px)}45%{transform:translate(-5px,-3px)}60%{transform:translate(4px,4px)}80%{transform:translate(-2px,1px)}}",
    "@media(prefers-reduced-motion:reduce){.hb-stage *,.hb-title,.hb-sub,.login.hb .login-card{animation:none!important}.hb-wave{display:none}.hb-fb{stroke-dasharray:none}}"
  ].join("\n");

  function mk(cls, html) { var d = document.createElement("div"); d.className = cls; if (html) d.innerHTML = html; return d; }

  function mount() {
    var host = document.getElementById("loginView");
    if (!host || host.dataset.hb) return;
    host.dataset.hb = "1";
    var st = document.createElement("style"); st.id = "hb-css"; st.textContent = CSS; document.head.appendChild(st);
    host.classList.add("hb");

    var stage = mk("hb-stage hb-go");
    stage.setAttribute("aria-hidden", "true");
    var plate = mk("hb-l hb-plate"); plate.appendChild(mk("in", plateSVG()));
    var bodyA = mk("hb-l hb-body hb-b2", torsoSVG("a"));
    var bodyB = mk("hb-l hb-body hb-b1", torsoSVG("b"));
    var ecg = document.createElementNS(NS, "svg");
    ecg.setAttribute("class", "hb-ecg"); ecg.setAttribute("viewBox", "0 0 1000 200"); ecg.setAttribute("preserveAspectRatio", "none");
    var fx = document.createElement("canvas"); fx.className = "hb-fx";
    stage.appendChild(plate); stage.appendChild(bodyA); stage.appendChild(bodyB); stage.appendChild(ecg); stage.appendChild(fx);
    stage.appendChild(mk("hb-vig")); stage.appendChild(mk("hb-grain")); stage.appendChild(mk("hb-flash"));
    host.insertBefore(stage, host.firstChild);

    var art = host.querySelector(".login-art");
    if (art) {
      var h = document.createElement("h2"); h.className = "hb-title"; h.setAttribute("aria-hidden", "true");
      h.innerHTML = '<span class="hb-w" data-t="MO">MO</span><span class="hb-w fit" data-t="FIT">FIT</span>';
      art.insertBefore(h, art.firstChild);
      var sub = document.createElement("div"); sub.className = "hb-sub"; sub.textContent = "برنامجك · تغذيتك · تطورك — في مكان واحد";
      h.after(sub);
    }
    if (reduce) { stage.classList.remove("hb-go"); }
    else { stage.classList.add("hb-shake"); setTimeout(function () { stage.classList.remove("hb-go", "hb-shake"); }, 3300); }

    /* ---------- ECG: layout depends on one athlete (phone) or two (wide screens); the pulse head travels along the line and fires each heart as it passes ---------- */
    var mq = window.matchMedia("(min-width:900px)"), run, beats = [];
    function buildEcg() {
      var wide = mq.matches, centres = wide ? [240, 760] : [500];
      stage.classList.toggle("hb-wide", wide);
      var d = ecgPath(centres);
      ecg.innerHTML = '<defs><linearGradient id="hbEg" x1="0" x2="1"><stop offset="0" stop-color="#FF6B1A"/><stop offset="1" stop-color="#FFE3B0"/></linearGradient></defs>' +
        '<path class="base" d="' + d + '"/><path class="run" pathLength="1" d="' + d + '"/>';
      run = ecg.querySelector(".run");
      var tot = run.getTotalLength(), pts = [];
      beats = centres.map(function (c, i) {
        var target = c - 30, f = 0, k;
        for (k = 0; k <= 800; k++) { var p = run.getPointAtLength(tot * k / 800); if (p.x >= target) { f = k / 800; break; } }
        return { el: wide ? (i === 0 ? bodyA : bodyB) : bodyB, at: f, last: -1, env: 0 };
      });
    }
    buildEcg();
    if (mq.addEventListener) mq.addEventListener("change", buildEcg);

    /* ---------- sparks ---------- */
    var ctx = fx.getContext("2d"), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [];
    function size() { W = stage.clientWidth; H = stage.clientHeight; fx.width = W * dpr; fx.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener("resize", size);
    function spawn(x, y, burst) {
      var z = Math.random();
      parts.push({ x: x, y: y, z: z, vx: burst ? (Math.random() - .5) * 7 * (.4 + z) : (Math.random() - .5) * .3, vy: burst ? -Math.random() * 6 - 1 : -(.25 + Math.random() * .9) * (.5 + z),
        life: 0, max: burst ? 50 + Math.random() * 50 : 220 + Math.random() * 260, r: .6 + z * 1.9 });
    }
    var count = Math.min(70, Math.round(W * H / 14000));
    for (var i = 0; i < count; i++) { spawn(Math.random() * W, Math.random() * H, false); parts[parts.length - 1].life = Math.random() * 200; }

    /* ---------- loop ---------- */
    var PERIOD = 2.0, px = 0, py = 0, tx = 0, ty = 0, t0 = performance.now(), scrollY = 0, hit = 0;
    function pulse(x) { return x < 0 || x > .26 ? 0 : Math.pow(1 - x / .26, 2); }
    function wave(el) {
      var w = mk("hb-wave"); el.appendChild(w); setTimeout(function () { w.remove(); }, 2300);
    }
    window.addEventListener("pointermove", function (e) { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
    window.addEventListener("scroll", function () { scrollY = window.scrollY || 0; }, { passive: true });
    var ls = host.querySelector(".login-card"); if (ls) ls.addEventListener("scroll", function () { scrollY = ls.scrollTop; }, { passive: true });

    function frame(now) {
      if (host.classList.contains("hidden")) { setTimeout(function () { requestAnimationFrame(frame); }, 500); return; }
      var t = (now - t0) / 1000 - 1.2;
      var cyc = t / PERIOD, pos = (((cyc % 1) + 1) % 1);
      var head = pos * 1.25, gmax = 0;
      if (run) run.style.strokeDashoffset = (.22 - head).toFixed(4);
      var by = H * .01 + Math.min(H * .98, W * 1.25) * .375;
      for (var q = 0; q < beats.length; q++) {
        var bt = beats[q], dt = (pos - bt.at / 1.25) * PERIOD; if (dt < 0) dt += PERIOD;
        var e = reduce ? 0 : Math.max(pulse(dt), pulse(dt - .3) * .65);
        bt.el.style.setProperty("--bb", e.toFixed(3)); if (e > gmax) gmax = e;
        var n = Math.floor(cyc - (pos < bt.at / 1.25 ? 1 : 0));
        if (!reduce && t > 0 && dt < .1 && n !== bt.last) {
          bt.last = n; wave(bt.el);
          var bx = bt.el.getBoundingClientRect().left + bt.el.offsetWidth / 2;
          for (var k = 0; k < 7; k++) spawn(bx + (Math.random() - .5) * 60, by + (Math.random() - .5) * 40, true);
        }
      }
      stage.style.setProperty("--b", gmax.toFixed(3));
      if (!reduce && t > -.75 && !hit) { hit = 1; for (var m = 0; m < 46; m++) spawn(W / 2, H * .3, true); }
      var dx = tx * .8 + Math.sin(now / 3600) * .45, dy = ty * .6 + Math.cos(now / 4300) * .3;
      px += (dx - px) * .06; py += (dy - py) * .06;
      var lay = [[plate, .5], [bodyA, .85], [bodyB, 1], [ecg, 1]];
      for (var d = 0; d < lay.length; d++) {
        var f = lay[d][1];
        lay[d][0].style.transform = "translate3d(" + (px * -26 * f).toFixed(1) + "px," + (py * -16 * f - scrollY * .1 * f).toFixed(1) + "px,0)";
      }
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j]; p.life++; p.x += p.vx + px * -.25 * p.z; p.y += p.vy; p.vx *= .985;
        if (p.life > p.max || p.y < -10) { if (p.max < 120) { parts.splice(j, 1); continue; } p.x = Math.random() * W; p.y = H + 10; p.life = 0; }
        var a = Math.sin(Math.min(1, p.life / p.max) * Math.PI) * (.35 + p.z * .6);
        ctx.fillStyle = "rgba(255," + (120 + p.z * 100 | 0) + "," + (40 + p.z * 40 | 0) + "," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
