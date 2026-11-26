/* MOFIT video annotation studio (coach) + viewer (client).
   Coach opens a client's posing video, scrubs / slow-mo / frame-steps, draws
   (pen, line, arrow, angle with degrees, circle, text) on paused frames,
   groups drawings into timed "moments" (لقطات) with notes, and saves.
   Everything is stored as normalized vector JSON in posing_annotations —
   no video pixels are read or sent anywhere new; the video itself never
   leaves the existing private "posing" bucket. The client replays the
   drawings overlaid on their own video inside the app. */
"use strict";

const AN_COLORS = ["#F97316", "#FACC15", "#22C55E", "#38BDF8", "#EF4444", "#FFFFFF"];
const AN_SPEEDS = [0.25, 0.5, 1, 1.5];
const AN_FRAME = 1 / 30;

let AN = null; // active session

/* ---------- small helpers (local names, no clashes) ---------- */
const anFmt = t => { t = Math.max(0, +t || 0); const m = Math.floor(t / 60), s = t - m * 60; return m + ":" + s.toFixed(1).padStart(4, "0"); };
const anId = () => "m" + Date.now().toString(36) + Math.floor(Math.random() * 999);
const anEsc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- styles (self-injected, fixed dark studio palette, both themes) ---------- */
function anInjectStyles() {
  if (document.getElementById("anCss")) return;
  const st = document.createElement("style");
  st.id = "anCss";
  st.textContent = `
.an-root{position:fixed;inset:0;z-index:2000;background:#0B1220;color:#F1F5F9;display:flex;flex-direction:column;direction:rtl;font-family:inherit;overscroll-behavior:contain}
.an-top{display:flex;align-items:center;gap:8px;padding:10px 12px;flex:none}
.an-top b{font-size:1rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.an-btn{border:1px solid #2B3750;background:#162036;color:#F1F5F9;border-radius:12px;padding:8px 12px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit}
.an-btn:active{transform:scale(.96)}
.an-btn.primary{background:linear-gradient(135deg,#BF400B,#E2540A);border-color:#C2410C;color:#fff}
.an-btn:disabled{opacity:.5}
.an-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 8px}
.an-wrap{position:relative;max-width:100%;max-height:100%;background:#000;border-radius:14px;overflow:hidden}
.an-wrap video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
.an-wrap canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.an-scrub{flex:none;padding:4px 14px 0}
.an-scrub input{width:100%;accent-color:#F97316;margin:0}
.an-trans{flex:none;display:flex;align-items:center;gap:6px;padding:6px 12px;flex-wrap:wrap}
.an-time{font-size:.78rem;color:#94A3B8;font-variant-numeric:tabular-nums;direction:ltr}
.an-spd{border:1px solid #2B3750;background:transparent;color:#94A3B8;border-radius:999px;padding:4px 9px;font-size:.75rem;font-weight:700;cursor:pointer;font-family:inherit}
.an-spd.on{background:#F97316;border-color:#F97316;color:#fff}
.an-tools{flex:none;display:flex;align-items:center;gap:6px;padding:4px 12px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.an-tool{flex:none;border:1px solid #2B3750;background:#162036;color:#F1F5F9;border-radius:12px;padding:7px 10px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
.an-tool.on{background:#F97316;border-color:#F97316;color:#fff}
.an-tool.an-auto-primary{background:linear-gradient(135deg,#BF400B,#E2540A);border:1px solid #FB923C;color:#fff;font-size:.96rem;padding:10px 16px;min-height:44px;box-shadow:0 6px 18px rgba(226,84,10,.34);animation:anAutoGlow 2.4s ease-in-out infinite}
@keyframes anAutoGlow{0%,100%{box-shadow:0 6px 16px rgba(226,84,10,.28);transform:translateY(0)}50%{box-shadow:0 8px 25px rgba(249,115,22,.55);transform:translateY(-1px)}}
.an-auto-hint{flex:none;text-align:center;color:#FDBA74;font-size:.78rem;font-weight:700;padding:3px 12px 5px;animation:anHintPulse 3s ease-in-out infinite}
@keyframes anHintPulse{0%,100%{opacity:.78}50%{opacity:1}}
.an-dot{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0}
.an-dot.on{border-color:#fff;box-shadow:0 0 0 2px #F97316}
.an-moms{flex:none;display:flex;align-items:center;gap:6px;padding:4px 12px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.an-mom{flex:none;display:inline-flex;align-items:center;gap:5px;border:1px solid #2B3750;background:#162036;color:#F1F5F9;border-radius:999px;padding:5px 10px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;direction:ltr}
.an-mom.on{background:#F97316;border-color:#F97316;color:#fff}
.an-mom .x{border:none;background:transparent;color:inherit;cursor:pointer;font-size:.9rem;padding:0 2px;line-height:1}
.an-note{flex:none;padding:4px 12px 10px}
.an-note input{width:100%;box-sizing:border-box;border:1px solid #2B3750;background:#162036;color:#F1F5F9;border-radius:12px;padding:9px 12px;font-size:.85rem;font-family:inherit}
.an-textbar{flex:none;display:flex;gap:6px;padding:6px 12px;background:#162036;border-top:1px solid #2B3750}
.an-textbar input{flex:1;border:1px solid #2B3750;background:#0B1220;color:#F1F5F9;border-radius:12px;padding:9px 12px;font-size:.85rem;font-family:inherit}
.an-vnote{flex:none;margin:0 12px 10px;background:#162036;border:1px solid #2B3750;border-radius:12px;padding:9px 12px;font-size:.85rem;line-height:1.6}
.an-vnote b{color:#F97316;display:block;margin-bottom:2px}
.an-chartbar{flex:none;padding:2px 12px}
.an-chartbar canvas{width:100%;height:70px;display:block;background:#0F1830;border:1px solid #2B3750;border-radius:10px;touch-action:none}
.an-chips{display:flex;align-items:center;gap:5px;overflow-x:auto;padding:2px 0 5px;-webkit-overflow-scrolling:touch}
.an-chip{flex:none;border:1px solid #2B3750;background:#162036;color:#94A3B8;border-radius:999px;padding:3px 9px;font-size:.72rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
.an-chip.on{background:#38BDF8;border-color:#38BDF8;color:#0B1220}
.an-hint{flex:none;text-align:center;font-size:.75rem;color:#94A3B8;padding:0 12px calc(8px + env(safe-area-inset-bottom,0px))}
`;
  document.head.appendChild(st);
}

/* ---------- overlay skeleton ---------- */
function anShell(title, saveLabel) {
  anInjectStyles();
  const root = document.createElement("div");
  root.className = "an-root";
  root.innerHTML = `
    <div class="an-top">
      <button class="an-btn" data-an="close">✕</button>
      <b>${anEsc(title)}</b>
      ${saveLabel ? `<button class="an-btn primary" data-an="save">${anEsc(saveLabel)}</button>` : ""}
    </div>
    <div class="an-stage"><div class="an-wrap">
      <video playsinline webkit-playsinline preload="auto" disablepictureinpicture></video>
      <canvas></canvas>
    </div></div>
    <div class="an-scrub"><input type="range" min="0" max="100" step="0.01" value="0"></div>
    <div class="an-chartbar" style="display:none"><div class="an-chips"></div><canvas></canvas></div>
    <div class="an-trans">
      <button class="an-btn" data-an="play" style="min-width:44px">▶</button>
      <button class="an-btn" data-an="back" title="فريم لورا">⟪</button>
      <button class="an-btn" data-an="fwd" title="فريم لقدام">⟫</button>
      <span class="an-time">0:00.0</span>
      <span style="flex:1"></span>
      ${AN_SPEEDS.map(s => `<button class="an-spd${s === 1 ? " on" : ""}" data-spd="${s}">×${s}</button>`).join("")}
    </div>
    <div class="an-tools"></div>
    <div class="an-auto-hint">اضغط 🤖 تحليل للتحليل التلقائي الكامل</div>
    <div class="an-moms"></div>
    <div class="an-note"></div>
    <div class="an-textbar" style="display:none">
      <input type="text" placeholder="اكتب الملاحظة على الفيديو" maxlength="60">
      <button class="an-btn primary" data-an="textok">إضافة</button>
      <button class="an-btn" data-an="textno">إلغاء</button>
    </div>`;
  document.body.appendChild(root);
  document.body.style.overflow = "hidden";
  return root;
}

function anClose() {
  if (!AN) return;
  const needConfirm = AN.mode === "edit" && AN.dirty;
  if (needConfirm && !confirm("عندك رسم مش محفوظ، تقفل من غير حفظ؟")) return;
  cancelAnimationFrame(AN.raf);
  AN.root.remove();
  document.body.style.overflow = "";
  AN = null;
}

/* ---------- shared video wiring ---------- */
function anWireVideo(root, url, onTick) {
  const video = root.querySelector("video");
  const canvas = root.querySelector("canvas");
  const wrap = root.querySelector(".an-wrap");
  const scrub = root.querySelector(".an-scrub input");
  const timeEl = root.querySelector(".an-time");
  const playBtn = root.querySelector('[data-an="play"]');
  const ctx = canvas.getContext("2d");

  video.src = url;
  const anSizeCanvas = () => {
    const r = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
  };
  const anFit = () => {
    const st = root.querySelector(".an-stage").getBoundingClientRect();
    const ar = (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : 9 / 16;
    let w = st.width, h = w / ar;
    if (h > st.height) { h = st.height; w = h * ar; }
    wrap.style.width = Math.round(w) + "px";
    wrap.style.height = Math.round(h) + "px";
    anSizeCanvas();
  };
  video.addEventListener("loadedmetadata", () => {
    scrub.max = video.duration || 100;
    anFit();
  });
  window.addEventListener("resize", anFit);
  setTimeout(anFit, 60);

  const setPlaying = p => { playBtn.textContent = p ? "⏸" : "▶"; };
  playBtn.onclick = () => { if (video.paused) { video.play().catch(() => {}); } else video.pause(); };
  video.addEventListener("play", () => setPlaying(true));
  video.addEventListener("pause", () => setPlaying(false));
  video.addEventListener("ended", () => setPlaying(false));
  root.querySelector('[data-an="back"]').onclick = () => { video.pause(); video.currentTime = Math.max(0, video.currentTime - AN_FRAME); };
  root.querySelector('[data-an="fwd"]').onclick = () => { video.pause(); video.currentTime = Math.min(video.duration || 0, video.currentTime + AN_FRAME); };
  scrub.addEventListener("input", () => { video.currentTime = +scrub.value; });
  root.querySelectorAll("[data-spd]").forEach(b => b.onclick = () => {
    video.playbackRate = +b.dataset.spd;
    root.querySelectorAll("[data-spd]").forEach(x => x.classList.toggle("on", x === b));
  });

  const tick = () => {
    if (!AN) return;
    if (!video.seeking) scrub.value = video.currentTime;
    timeEl.textContent = anFmt(video.currentTime) + " / " + anFmt(video.duration);
    onTick(ctx, canvas, video);
    AN.raf = requestAnimationFrame(tick);
  };
  AN.raf = requestAnimationFrame(tick);
  return { video, canvas, wrap, anSizeCanvas };
}

/* ---------- stroke drawing (normalized coords -> canvas px) ---------- */
function anStroke(ctx, W, H, s, dim) {
  if (s.k === "skeleton") return anSkeleton(ctx, W, H, s, dim);
  ctx.save();
  ctx.globalAlpha = dim ? 0.45 : 1;
  ctx.strokeStyle = s.c; ctx.fillStyle = s.c;
  ctx.lineWidth = Math.max(2, (s.w || 0.011) * W);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0,0,0,.65)"; ctx.shadowBlur = 3;
  const X = p => p[0] * W, Y = p => p[1] * H;
  if (s.k === "pen" && s.pts.length > 1) {
    ctx.beginPath(); ctx.moveTo(X(s.pts[0]), Y(s.pts[0]));
    for (let i = 1; i < s.pts.length; i++) ctx.lineTo(X(s.pts[i]), Y(s.pts[i]));
    ctx.stroke();
  } else if ((s.k === "line" || s.k === "arrow") && s.a && s.b) {
    ctx.beginPath(); ctx.moveTo(X(s.a), Y(s.a)); ctx.lineTo(X(s.b), Y(s.b)); ctx.stroke();
    if (s.k === "arrow") {
      const ang = Math.atan2(Y(s.b) - Y(s.a), X(s.b) - X(s.a)), hl = Math.max(10, W * 0.035);
      ctx.beginPath();
      ctx.moveTo(X(s.b), Y(s.b));
      ctx.lineTo(X(s.b) - hl * Math.cos(ang - 0.45), Y(s.b) - hl * Math.sin(ang - 0.45));
      ctx.moveTo(X(s.b), Y(s.b));
      ctx.lineTo(X(s.b) - hl * Math.cos(ang + 0.45), Y(s.b) - hl * Math.sin(ang + 0.45));
      ctx.stroke();
    }
  } else if (s.k === "circle" && s.o && s.r) {
    ctx.beginPath(); ctx.ellipse(X(s.o), Y(s.o), s.r * W, s.r * W, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (s.k === "angle" && s.p1 && s.v && s.p2) {
    ctx.beginPath(); ctx.moveTo(X(s.p1), Y(s.p1)); ctx.lineTo(X(s.v), Y(s.v)); ctx.lineTo(X(s.p2), Y(s.p2)); ctx.stroke();
    const a1 = Math.atan2(Y(s.p1) - Y(s.v), X(s.p1) - X(s.v));
    const a2 = Math.atan2(Y(s.p2) - Y(s.v), X(s.p2) - X(s.v));
    let d = Math.abs(a1 - a2) * 180 / Math.PI; if (d > 180) d = 360 - d;
    const r = W * 0.09;
    let s0 = Math.min(a1, a2), s1 = Math.max(a1, a2);
    if (s1 - s0 > Math.PI) { const t = s0; s0 = s1; s1 = t + Math.PI * 2; }
    ctx.beginPath(); ctx.arc(X(s.v), Y(s.v), r, s0, s1); ctx.stroke();
    ctx.font = `800 ${Math.max(13, W * 0.045)}px system-ui,sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const mid = (s0 + s1) / 2, lx = X(s.v) + Math.cos(mid) * (r + W * 0.05), ly = Y(s.v) + Math.sin(mid) * (r + W * 0.05);
    ctx.shadowBlur = 4; ctx.fillText(Math.round(d) + "°", lx, ly);
  } else if (s.k === "text" && s.at && s.text) {
    ctx.font = `800 ${Math.max(14, W * 0.048)}px system-ui,sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowBlur = 4;
    ctx.fillText(s.text, X(s.at), Y(s.at));
  }
  ctx.restore();
}

/* ---------- auto-pose view rendering (self-contained: clients render the
   saved skeleton/angles/track from JSON only, the model is never loaded) ---------- */
const ANS_BONES = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32],[0,11],[0,12]];
const ANS_MARKABLE = [11,12,13,14,15,16,23,24,25,26,27,28];
const ANS_LM = { 11:"الكتف الشمال",12:"الكتف اليمين",13:"الكوع الشمال",14:"الكوع اليمين",15:"الرسغ الشمال",16:"الرسغ اليمين",23:"الورك الشمال",24:"الورك اليمين",25:"الركبة الشمالية",26:"الركبة اليمنى",27:"الكاحل الشمال",28:"الكاحل اليمين" };
/* ---------- biomechanics overlay: gravity line, relative joint torque, motion intensity ----------
   Pure math on saved landmarks (also used by clients, no model). Distances are measured in
   pixel space; torque is RELATIVE (moment arm x distal mass share, as % of trunk length x body
   weight) because the real body weight and any bar load are not known. */
const ANB_SEG = [ // [mass share, a, b] : segment centre = midpoint(a,b)
  [0.081, 7, 8], [0.497, "sh", "hp"],
  [0.028, 11, 13], [0.028, 12, 14], [0.022, 13, 15], [0.022, 14, 16],
  [0.1, 23, 25], [0.1, 24, 26], [0.0465, 25, 27], [0.0465, 26, 28], [0.0145, 27, 31], [0.0145, 28, 32]];
const ANB_ANG = [["الكوع", 11, 13, 15, 12, 14, 16], ["الركبة", 23, 25, 27, 24, 26, 28], ["الكتف", 23, 11, 13, 24, 12, 14], ["الورك", 11, 23, 25, 12, 24, 26]];
function anbPts(lms, ar) {
  const f = i => { const p = lms[i]; return p && (p[2] == null ? 1 : p[2]) >= 0.4 ? { x: p[0] * ar, y: p[1] } : null; };
  const mid = (a, b) => (a && b) ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : (a || b || null);
  return { f, mid };
}
function anbAnalyze(lms, ar) {
  const { f, mid } = anbPts(lms, ar);
  const sh = mid(f(11), f(12)), hp = mid(f(23), f(24));
  if (!sh || !hp) return null;
  const trunk = Math.hypot(sh.x - hp.x, sh.y - hp.y);
  if (trunk < 0.02) return null;
  const pt = k => k === "sh" ? sh : k === "hp" ? hp : f(k);
  // whole-body centre of mass
  let M = 0, cx = 0, cy = 0;
  const segC = [];
  for (const [m, a, b] of ANB_SEG) {
    const c = mid(pt(a), pt(b)); segC.push(c);
    if (c) { M += m; cx += m * c.x; cy += m * c.y; }
  }
  if (M < 0.5) return null;
  const com = { x: cx / M, y: cy / M };
  const feet = [27, 28, 29, 30, 31, 32].map(f).filter(Boolean);
  const ground = feet.length ? Math.max(...feet.map(p => p.y)) : Math.max(sh.y, hp.y) + trunk * 1.6;
  const bos = feet.length ? [Math.min(...feet.map(p => p.x)), Math.max(...feet.map(p => p.x))] : null;
  // joint torque (relative): distal mass share x horizontal arm to its centre of mass
  const dist = idx => { let m = 0, x = 0, y = 0; idx.forEach(i => { const c = segC[i]; if (c) { m += ANB_SEG[i][0]; x += ANB_SEG[i][0] * c.x; y += ANB_SEG[i][0] * c.y; } }); return m > 0 ? { m, x: x / m, y: y / m } : null; };
  const L = { elbow: [[4], [5]], shoulder: [[2, 4], [3, 5]], knee: [[8, 10], [9, 11]], hip: [[1, 0, 2, 3, 4, 5], [1, 0, 2, 3, 4, 5]] };
  // indices: 0 head,1 trunk,2 Larm,3 Rarm,4 Lfore,5 Rfore,6 Lthigh,7 Rthigh,8 Lshank,9 Rshank,10 Lfoot,11 Rfoot
  const defs = [
    ["الكوع", 13, dist([4]), 0], ["الكوع", 14, dist([5]), 1],
    ["الكتف", 11, dist([2, 4]), 0], ["الكتف", 12, dist([3, 5]), 1],
    ["الركبة", 25, dist([8, 10]), 0], ["الركبة", 26, dist([9, 11]), 1],
    ["الورك", 23, dist([1, 0, 2, 3, 4, 5]), 0], ["الورك", 24, dist([1, 0, 2, 3, 4, 5]), 1]];
  const torques = [];
  for (const [name, j, d, side] of defs) {
    const J = f(j); if (!J || !d) continue;
    const arm = d.x - J.x;
    torques.push({ name, side, j, arm, val: Math.abs(arm) * d.m / trunk * 100, from: J, to: { x: d.x, y: J.y } });
  }
  return { com, ground, bos, trunk, torques, inside: bos ? (com.x >= bos[0] && com.x <= bos[1]) : null };
}
function anbAngles(lms) {
  const out = [];
  for (const [nm, a, b, c, a2, b2, c2] of ANB_ANG) {
    [[a, b, c, 0], [a2, b2, c2, 1]].forEach(([i, j, k, side]) => {
      const A = lms[i], B = lms[j], C = lms[k]; if (!A || !B || !C) return;
      if (Math.min(A[2] ?? 1, B[2] ?? 1, C[2] ?? 1) < 0.4) return;
      let d = Math.abs((Math.atan2(C[1] - B[1], C[0] - B[0]) - Math.atan2(A[1] - B[1], A[0] - B[0])) * 180 / Math.PI);
      if (d > 180) d = 360 - d;
      out.push({ name: nm, side, j, deg: Math.round(d) });
    });
  }
  return out;
}
const ANB_SIDE = ["الشمال", "اليمين"];
/* per-frame speed of limbs (trunk lengths per second) */
function anbSpeeds(frames, ar) {
  const J = [15, 16, 27, 28];
  const out = [];
  for (let i = 0; i < frames.length; i++) {
    const a = frames[i], p = frames[i - 1];
    let v = null;
    if (p && a.t > p.t) {
      const A = anbAnalyze(a.lms, ar); const tr = A ? A.trunk : null;
      if (tr) {
        let s = 0, n = 0;
        J.forEach(k => { const u = a.lms[k], w = p.lms[k]; if (u && w && (u[2] ?? 1) > 0.4 && (w[2] ?? 1) > 0.4) { s += Math.hypot((u[0] - w[0]) * ar, u[1] - w[1]) / tr / (a.t - p.t); n++; } });
        if (n) v = s / n;
      }
    }
    out.push(v);
  }
  return out;
}
/* extra series for the chart: relative torque per joint + movement intensity */
function anbSeries(frames, ar) {
  const m = {}, add = (n, t, v, u) => { (m[n] = m[n] || { name: n, unit: u, pts: [] }).pts.push([t, v]); };
  const sp = anbSpeeds(frames, ar);
  frames.forEach((fr, i) => {
    const A = anbAnalyze(fr.lms, ar); if (!A) return;
    A.torques.forEach(q => add("عزم " + q.name + " " + ANB_SIDE[q.side], fr.t, +q.val.toFixed(1), "%"));
    if (sp[i] != null) add("شدة الحركة", fr.t, +sp[i].toFixed(2), "/s");
  });
  return Object.values(m).filter(s => s.pts.length > 3);
}
function anbSpeedColor(v) { // 0..2.5 trunk/s : blue -> yellow -> red
  const k = Math.max(0, Math.min(1, v / 2.5));
  return "hsl(" + Math.round(210 - k * 210) + ",95%," + Math.round(55 + (1 - Math.abs(k - .5) * 2) * 0) + "%)";
}
function anbOverlay(ctx, W, H, lms, track, t) {
  if (!lms) return;
  const ar = W / H;
  const A = anbAnalyze(lms, ar); if (!A) return;
  const X = x => x / ar * W, Y = y => y * H;
  const fs = Math.max(11, W / 46);
  ctx.save();
  ctx.font = `700 ${fs}px system-ui,sans-serif`; ctx.direction = "ltr"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 3;
  // motion trails (wrists + ankles), coloured by speed
  if (track && track.frames && t != null) {
    const fr = track.frames.filter(f => f.t <= t && f.t > t - 1.2);
    [15, 16, 27, 28].forEach(k => {
      for (let i = 1; i < fr.length; i++) {
        const a = fr[i - 1].lms[k], b = fr[i].lms[k]; if (!a || !b || (a[2] ?? 1) < 0.4 || (b[2] ?? 1) < 0.4) continue;
        const sp = Math.hypot((b[0] - a[0]) * ar, b[1] - a[1]) / A.trunk / Math.max(0.02, fr[i].t - fr[i - 1].t);
        ctx.strokeStyle = anbSpeedColor(sp); ctx.globalAlpha = 0.25 + 0.75 * i / fr.length; ctx.lineWidth = Math.max(2, W / 150) * (0.5 + i / fr.length);
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(a[0] * W, a[1] * H); ctx.lineTo(b[0] * W, b[1] * H); ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }
  // gravity line through the centre of mass + base of support
  const cx = X(A.com.x), cy = Y(A.com.y), gy = Y(A.ground);
  const ok = A.inside !== false;
  ctx.strokeStyle = ok ? "#22C55E" : "#EF4444"; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Math.max(2, W / 260);
  ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(cx, Math.max(0, cy - A.trunk * H * 1.2)); ctx.lineTo(cx, gy); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(5, W / 90), 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#0A1020"; ctx.stroke();
  if (A.bos) { ctx.fillStyle = ok ? "rgba(34,197,94,.9)" : "rgba(239,68,68,.9)"; ctx.fillRect(X(A.bos[0]), gy, Math.max(2, X(A.bos[1]) - X(A.bos[0])), Math.max(3, W / 200)); }
  ctx.fillStyle = ok ? "#86EFAC" : "#FCA5A5";
  ctx.fillText("↓ g", Math.min(W - fs * 3, cx + 8), Math.min(H - 6, gy - 6));
  // torque arms: horizontal arm from joint to the centre of its distal mass
  const shown = [];
  A.torques.forEach(q => {
    const x1 = X(q.from.x), x2 = X(q.to.x), y = Y(q.from.y);
    if (Math.abs(x2 - x1) < 4) return;
    const k = Math.min(1, q.val / 18);
    ctx.strokeStyle = `rgba(${Math.round(250)},${Math.round(204 - 140 * k)},${Math.round(21 + 20 * k)},.95)`;
    ctx.lineWidth = Math.max(2, W / 200 * (1 + k * 1.6));
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    const dir = x2 > x1 ? 1 : -1, hs = Math.max(6, W / 70);
    ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - dir * hs, y - hs * .6); ctx.lineTo(x2 - dir * hs, y + hs * .6); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
    shown.push(q);
  });
  // labels: angle + torque per joint, stacked away from overlaps
  const angs = anbAngles(lms), placed = [];
  const byJ = {}; angs.forEach(a => { byJ[a.j] = a; });
  const labelJ = {}; A.torques.forEach(q => { labelJ[q.j] = q; }); angs.forEach(a => { if (!labelJ[a.j]) labelJ[a.j] = null; });
  Object.keys(labelJ).forEach(j => {
    const p = lms[j]; if (!p) return;
    const a = byJ[j], q = labelJ[j];
    const txt = (a ? a.deg + "°" : "") + (q ? (a ? "  " : "") + "τ" + q.val.toFixed(0) : "");
    if (!txt) return;
    const tw = ctx.measureText(txt).width;
    let lx = p[0] * W < W / 2 ? p[0] * W - tw - 14 : p[0] * W + 14, ly = p[1] * H - 8;
    lx = Math.max(4, Math.min(W - tw - 8, lx));
    let n = 0; while (placed.some(o => Math.abs(o.ly - ly) < fs * 1.4 && Math.abs(o.lx - lx) < tw + 10) && n++ < 8) ly += fs * 1.4;
    placed.push({ lx, ly });
    ctx.shadowBlur = 0; ctx.fillStyle = "rgba(10,16,32,.8)"; ctx.beginPath(); ctx.roundRect(lx - 4, ly - fs * 1.0, tw + 8, fs * 1.35, 5); ctx.fill();
    ctx.fillStyle = "#FACC15"; ctx.fillText(txt, lx, ly);
  });
  // legend
  const lg = ["● مركز الثقل + خط الجاذبية" + (A.inside === false ? " (خارج قاعدة الارتكاز)" : ""), "τ = عزم نسبي (ذراع × وزن الجزء)", "ذيل ملون = سرعة الحركة"];
  ctx.shadowBlur = 0; ctx.font = `600 ${Math.max(10, W / 58)}px system-ui,sans-serif`;
  const lh = Math.max(13, W / 46), lw = Math.max(...lg.map(s => ctx.measureText(s).width)) + 14;
  ctx.fillStyle = "rgba(10,16,32,.7)"; ctx.beginPath(); ctx.roundRect(W - lw - 6, 6, lw, lh * lg.length + 8, 6); ctx.fill();
  ctx.direction = "rtl"; ctx.textAlign = "right";
  ctx.fillStyle = "#E2E8F0"; lg.forEach((s, i) => ctx.fillText(s, W - 13, 6 + lh * (i + 1)));
  ctx.restore();
}

function anSkeleton(ctx, W, H, s, dim, quiet) {
  const lms = s.lms || [];
  const P = i => { const p = lms[i]; return p ? { x: p[0] * W, y: p[1] * H, v: p[2] == null ? 1 : p[2] } : null; };
  ctx.save();
  if (dim) ctx.globalAlpha = 0.45;
  ctx.lineWidth = Math.max(2, W / 300);
  ctx.strokeStyle = s.c || "rgba(56,189,248,.9)";
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 3;
  for (const pr of ANS_BONES) {
    const a = P(pr[0]), b = P(pr[1]);
    if (!a || !b || Math.min(a.v, b.v) < 0.3) continue;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const jm = {}; (s.joints || []).forEach(j => { jm[j.i] = j; });
  for (const i of ANS_MARKABLE) {
    const p = P(i); if (!p || p.v < 0.3) continue;
    const j = jm[i];
    ctx.fillStyle = j ? (j.verdict === "good" ? "#22C55E" : "#EF4444") : "rgba(255,255,255,.4)";
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(4, W / 130), 0, 7); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "#0A1020"; ctx.stroke();
    if (j && j.note) {
      ctx.font = `700 ${Math.max(12, W * 0.036)}px system-ui,sans-serif`;
      ctx.direction = "ltr"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.shadowBlur = 4;
      ctx.fillStyle = j.verdict === "good" ? "#22C55E" : "#FCA5A5";
      const gs = Math.max(12, W * 0.036), tx = Math.max(4, Math.min(W - 12 - ctx.measureText(j.note).width - gs, p.x + 10));
      if (typeof mofitCanvasGlyph === "function" && mofitCanvasGlyph(ctx, j.verdict === "good" ? "check" : "x", tx + gs / 2, p.y - 10 - gs * 0.35, gs, j.verdict === "good" ? "#22C55E" : "#FCA5A5")) ctx.fillText(j.note, tx + gs * 1.2, p.y - 10);
      else ctx.fillText((j.verdict === "good" ? "✓ " : "✕ ") + j.note, tx, p.y - 10);
    }
  }
  if (!quiet && s.angles && s.angles.length) {
    const fs = Math.max(13, W / 42), lh = fs * 1.55;
    ctx.font = `700 ${fs}px system-ui,sans-serif`;
    ctx.direction = "ltr"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.shadowBlur = 0;
    const placed = [];
    for (const an of s.angles) {
      const p = P(an.joint); if (!p) continue;
      const label = an.deg + "° " + an.name;
      const tw = ctx.measureText(label).width;
      const goLeft = p.x < W / 2;
      let lx = goLeft ? p.x - tw - 18 : p.x + 18;
      let ly = p.y - 12;
      lx = Math.max(4, Math.min(W - tw - 10, lx));
      let tries = 0;
      while (placed.some(q => Math.abs(q.ly - ly) < lh && !(q.lx > lx + tw + 12 || lx > q.lx + q.tw + 12)) && tries++ < 6) ly += lh;
      placed.push({ lx, ly, tw, label });
    }
    for (const q of placed) {
      ctx.fillStyle = "rgba(10,16,32,.78)";
      ctx.beginPath(); ctx.roundRect(q.lx - 6, q.ly - fs * 1.05, q.tw + 12, lh, 6); ctx.fill();
    }
    ctx.fillStyle = "#FACC15";
    for (const q of placed) ctx.fillText(q.label, q.lx, q.ly);
  }
  ctx.restore();
  if (!quiet && !dim && s.lms) { try { anbOverlay(ctx, W, H, s.lms, null, null); } catch (_) {} }
}
function anContainDraw(ctx, canvas, img) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const iw = img.width, ih = img.height; if (!iw || !ih) return null;
  const sc = Math.min(W / iw, H / ih), w = iw * sc, h = ih * sc;
  const rect = { x: (W - w) / 2, y: (H - h) / 2, w, h };
  ctx.drawImage(img, rect.x, rect.y, w, h);
  return rect;
}
/* draw normalized strokes mapped into a contained photo rect (letterboxed) */
function anPhotoStrokes(ctx, W, H, rect, strokes, dim) {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / W, rect.h / H);
  (strokes || []).forEach(s => anStroke(ctx, W, H, s, dim));
  ctx.restore();
}
function anTrackFrameAt(track, t) {
  const fr = track.frames; if (!fr || !fr.length) return null;
  let lo = 0, hi = fr.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (fr[mid].t <= t) lo = mid; else hi = mid - 1; }
  return fr[lo];
}
function anChartDraw(canvas, track, curT, selName) {
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();
  if (r.width < 10) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.width = Math.max(2, Math.round(r.width * dpr));
  const H = canvas.height = Math.max(2, Math.round(r.height * dpr));
  const ctx = canvas.getContext("2d");
  const ser = (track.series || []).find(x => x.name === selName);
  const dur = Math.max(0.01, ...track.frames.map(f => f.t));
  if (!ser || !ser.pts.length) return;
  let mn = Infinity, mx = -Infinity; ser.pts.forEach(pt => { mn = Math.min(mn, pt[1]); mx = Math.max(mx, pt[1]); });
  const unit = ser.unit || "°", span = unit === "°" ? 10 : (unit === "%" ? 2 : 0.2);
  if (mx - mn < span) { mn = Math.max(0, mn - span / 2); mx = mx + span / 2; if (unit === "°") mx = Math.min(180, mx); }
  const X = t => (t / dur) * W, Y = d => H - 6 * dpr - ((d - mn) / (mx - mn)) * (H - 22 * dpr);
  ctx.strokeStyle = "rgba(148,163,184,.15)"; ctx.lineWidth = 1;
  for (let g = 0; g <= 2; g++) { const y = Y(mn + (mx - mn) * g / 2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = "#F97316"; ctx.lineWidth = 2 * dpr; ctx.beginPath();
  ser.pts.forEach((pt, i) => { const x = X(pt[0]), y = Y(pt[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  ctx.stroke();
  ctx.fillStyle = "#94A3B8"; ctx.font = `700 ${11 * dpr}px system-ui,sans-serif`;
  ctx.direction = "ltr"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  const fmt = v => (unit === "°" ? Math.round(v) : +v.toFixed(1)) + unit; ctx.fillText(fmt(mx), 4 * dpr, 12 * dpr); ctx.fillText(fmt(mn), 4 * dpr, H - 2 * dpr);
  ctx.strokeStyle = "#38BDF8"; ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath(); ctx.moveTo(X(curT), 0); ctx.lineTo(X(curT), H); ctx.stroke();
}
function anShowChart(root, video) {
  const bar = root.querySelector(".an-chartbar");
  if (!bar || !AN.auto || !AN.auto.track || !AN.auto.track.series || !AN.auto.track.series.length) return;
  bar.style.display = "";
  if (AN.chartSel == null || !AN.auto.track.series.some(x => x.name === AN.chartSel)) AN.chartSel = AN.auto.track.series[0].name;
  const chips = bar.querySelector(".an-chips");
  chips.innerHTML = AN.auto.track.series.map(x => `<button class="an-chip${x.name === AN.chartSel ? " on" : ""}" data-chip="${anEsc(x.name)}">${anEsc(x.name)}</button>`).join("")
    + `<span style="flex:1"></span><button class="an-chip${AN.showSkel !== false ? " on" : ""}" data-an="skel">🦴 هيكل</button><button class="an-chip" data-an="chartx">✕</button>`;
  chips.querySelectorAll("[data-chip]").forEach(b => b.onclick = () => { AN.chartSel = b.dataset.chip; anShowChart(root, video); });
  chips.querySelector('[data-an="skel"]').onclick = () => { AN.showSkel = AN.showSkel === false ? true : false; anShowChart(root, video); };
  chips.querySelector('[data-an="chartx"]').onclick = () => { bar.style.display = "none"; };
  const cnv = bar.querySelector("canvas");
  cnv.onpointerdown = e => {
    const r = cnv.getBoundingClientRect();
    const fr = AN.auto.track.frames;
    const dur = video.duration || (fr.length ? fr[fr.length - 1].t : 0);
    if (dur > 0) { video.pause(); video.currentTime = Math.min(dur, Math.max(0, (e.clientX - r.left) / r.width * dur)); }
  };
  anChartTick(root, video.currentTime);
}
function anChartTick(root, curT) {
  const bar = root && root.querySelector(".an-chartbar");
  if (!bar || bar.style.display === "none" || !AN || !AN.auto || !AN.auto.track) return;
  anChartDraw(bar.querySelector("canvas"), AN.auto.track, curT, AN.chartSel);
}
function anLoadScript(src) {
  return new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = src; sc.onload = res; sc.onerror = rej;
    document.head.appendChild(sc);
  });
}
const anPhotoCache = {};
function anPhotoImg(path) {
  let e = anPhotoCache[path];
  if (!e) {
    e = anPhotoCache[path] = { img: new Image(), ok: false };
    poseUrl(path).then(u => { if (!u) return; e.img.onload = () => { e.ok = true; }; e.img.src = u; });
  }
  return e.ok ? e.img : null;
}
function anJointNote(root, j) {
  AN.jointNote = j;
  const bar = root.querySelector(".an-textbar");
  const inp = bar.querySelector("input");
  inp.placeholder = "ملاحظة على " + (j.name || "المفصل") + " (اختياري)";
  inp.value = j.note || "";
  bar.style.display = "";
  setTimeout(() => inp.focus(), 50);
}

/* ---------- tools row (edit mode) ---------- */
const AN_TOOLS = [["pen", "✏️ قلم"], ["line", "— خط"], ["arrow", "➶ سهم"], ["angle", "📐 زاوية"], ["circle", "◯ دايرة"], ["text", "🅣 كتابة"], ["mark", "🦴 صحّح"]];
function anDrawTools(root) {
  const t = root.querySelector(".an-tools");
  t.innerHTML = AN_TOOLS.map(([k, l]) => `<button class="an-tool${AN.tool === k ? " on" : ""}" data-tool="${k}">${l}</button>`).join("")
    + `<span style="flex:none;width:4px"></span>`
    + AN_COLORS.map(c => `<button class="an-dot${AN.color === c ? " on" : ""}" data-col="${c}" style="background:${c}" aria-label="لون"></button>`).join("")
    + `<span style="flex:none;width:4px"></span>
       <button class="an-tool" data-an="undo" title="تراجع">↩ تراجع</button>
       <button class="an-tool" data-an="clear" title="مسح اللقطة">🗑 مسح</button>
       <span style="flex:none;width:4px"></span>
       <button class="an-tool an-auto-primary" data-an="auto" title="تحليل تلقائي كامل للفيديو: زوايا، عزم، جاذبية، شدة">🤖 تحليل</button>
       <button class="an-tool" data-an="track" title="تتبع الزوايا في الفيديو كله">📈 تتبع</button>
       <button class="an-tool" data-an="photo" title="تحليل صورة من الجهاز">📷 صورة</button>
       <button class="an-tool" data-an="variant" title="دقة النموذج">⚙️ خفيف</button>
       <input type="file" data-an="photoinp" accept="image/*" style="display:none">`;
  t.querySelectorAll("[data-tool]").forEach(b => b.onclick = () => { AN.tool = b.dataset.tool; AN.pending = []; anDrawTools(root); });
  t.querySelectorAll("[data-col]").forEach(b => b.onclick = () => { AN.color = b.dataset.col; anDrawTools(root); });
  t.querySelector('[data-an="undo"]').onclick = () => { const m = anCur(); if (m && m.strokes.length) { m.strokes.pop(); AN.dirty = true; } };
  t.querySelector('[data-an="clear"]').onclick = () => { const m = anCur(); if (m && m.strokes.length && confirm("تمسح كل رسم اللقطة دي؟")) { m.strokes = []; AN.dirty = true; } };
  t.querySelector('[data-an="auto"]').onclick = () => AN.autoGo && AN.autoGo();
  t.querySelector('[data-an="track"]').onclick = () => AN.trackGo && AN.trackGo();
  t.querySelector('[data-an="photo"]').onclick = () => AN.photoGo && AN.photoGo();
  t.querySelector('[data-an="photoinp"]').addEventListener("change", ev => AN.photoPicked && AN.photoPicked(ev));
  t.querySelector('[data-an="variant"]').onclick = () => AN.variantGo && AN.variantGo();
  const vb = t.querySelector('[data-an="variant"]');
  if (vb && AN.auto) vb.textContent = AN.auto.variant === "lite" ? "⚙️ خفيف" : "⚙️ عالية";
}

/* ---------- moments ---------- */
const anCur = () => AN ? AN.moments.find(m => m.id === AN.curId) || null : null;
function anNewMoment(t) {
  const m = { id: anId(), t: Math.round((+t || 0) * 10) / 10, note: "", strokes: [] };
  AN.moments.push(m);
  AN.moments.sort((a, b) => a.t - b.t);
  AN.curId = m.id;
  AN.dirty = true;
  return m;
}
function anDrawMoms(root, edit) {
  const bar = root.querySelector(".an-moms");
  bar.innerHTML = (edit ? `<button class="an-mom" data-an="addmom">＋ لقطة هنا</button>` : "")
    + AN.moments.map(m => `<button class="an-mom${m.id === AN.curId ? " on" : ""}" data-mom="${m.id}">${m.photo ? "📷" : "⏱ " + anFmt(m.t)}${m.note ? " 💬" : ""}${edit ? `<span class="x" data-momx="${m.id}">✕</span>` : ""}</button>`).join("")
    + (!edit && !AN.moments.length ? `<span class="an-hint">مفيش لقطات</span>` : "");
  bar.querySelectorAll("[data-mom]").forEach(b => b.onclick = e => {
    if (e.target.dataset.momx) return;
    AN.curId = b.dataset.mom;
    const m = anCur();
    if (m) { AN.video.pause(); if (m.photo) { AN.photoShow = m; } else { AN.photoShow = null; AN.video.currentTime = m.t; } }
    anDrawMoms(root, edit);
    if (edit) anDrawNote(root);
  });
  bar.querySelectorAll("[data-momx]").forEach(x => x.onclick = () => {
    const m = AN.moments.find(mm => mm.id === x.dataset.momx);
    if (!m || !confirm("تحذف اللقطة دي بكل رسمها؟")) return;
    AN.moments = AN.moments.filter(mm => mm !== m);
    if (AN.curId === m.id) AN.curId = AN.moments[0]?.id || null;
    AN.dirty = true;
    anDrawMoms(root, true); anDrawNote(root);
  });
  const add = bar.querySelector('[data-an="addmom"]');
  if (add) add.onclick = () => {
    AN.video.pause();
    anNewMoment(AN.video.currentTime);
    anDrawMoms(root, true); anDrawNote(root);
    toast("✓ لقطة جديدة عند " + anFmt(AN.video.currentTime));
  };
}
function anDrawNote(root) {
  const box = root.querySelector(".an-note");
  const m = anCur();
  box.innerHTML = m ? `<input type="text" placeholder="ملاحظة على اللقطة دي (اختياري)" maxlength="120" value="${anEsc(m.note || "")}">` : "";
  const inp = box.querySelector("input");
  if (inp) inp.oninput = () => { m.note = inp.value.trim(); AN.dirty = true; const chip = root.querySelector(`[data-mom="${m.id}"]`); if (chip) chip.innerHTML = `⏱ ${anFmt(m.t)}${m.note ? " 💬" : ""}<span class="x" data-momx="${m.id}">✕</span>`; };
}

/* ---------- coach studio ---------- */
async function openAnnotateStudio(checkin, videoUrl, moments, onSaved) {
  if (AN) anClose();
  AN = { mode: "edit", checkin, moments: (moments || []).map(m => ({ ...m, strokes: (m.strokes || []).map(s => ({ ...s })) })), curId: null, tool: "pen", color: AN_COLORS[0], dirty: false, pending: [], drawing: null, textAt: null, jointNote: null, photoShow: null, chartSel: null, showSkel: true, auto: null };
  AN.curId = AN.moments[0]?.id || null;
  const root = AN.root = anShell("🎯 تحليل الفيديو", "حفظ التحليل");
  root.querySelector('[data-an="close"]').onclick = anClose;
  anDrawTools(root);
  anDrawMoms(root, true);
  anDrawNote(root);

  const { video, canvas } = anWireVideo(root, videoUrl, (ctx, cnv) => {
    const W = cnv.width, H = cnv.height;
    ctx.clearRect(0, 0, W, H);
    const m = anCur();
    if (m && m.photo) {
      video.style.visibility = "hidden";
      const img = anPhotoImg(m.photo);
      if (img) { const rc = anContainDraw(ctx, cnv, img); if (rc) { AN.photoRect = { x: rc.x / W, y: rc.y / H, w: rc.w / W, h: rc.h / H }; anPhotoStrokes(ctx, W, H, rc, m.strokes); if (AN.drawing) anStroke(ctx, W, H, AN.drawing); } }
      anChartTick(root, video.currentTime);
      return;
    }
    video.style.visibility = "";
    AN.photoRect = null;
    if (m) m.strokes.forEach(s => anStroke(ctx, W, H, s));
    if (AN.auto && AN.auto.skel && AN.auto.skel.lms && !(m && (m.strokes || []).some(s => s.k === "skeleton")))
      anSkeleton(ctx, W, H, { lms: AN.auto.skel.lms, angles: AN.auto.skel.angles, joints: AN.auto.skel.joints });
    if (AN.auto && AN.auto.track && AN.showSkel !== false) {
      const cb = root.querySelector(".an-chartbar");
      if (cb && cb.style.display !== "none") {
        const f = anTrackFrameAt(AN.auto.track, video.currentTime);
        if (f && Math.abs(f.t - video.currentTime) < 0.4) { anSkeleton(ctx, W, H, { lms: f.lms, joints: [], angles: [] }, false, true); try { anbOverlay(ctx, W, H, f.lms, AN.auto.track, video.currentTime); } catch (_) {} }
      }
    }
    anChartTick(root, video.currentTime);
    if (AN.drawing) anStroke(ctx, W, H, AN.drawing);
    // live angle guides while collecting points
    if (AN.tool === "angle" && AN.pending.length) {
      const pts = AN.pending;
      ctx.save(); ctx.strokeStyle = AN.color; ctx.fillStyle = AN.color; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      pts.forEach(p => { ctx.beginPath(); ctx.arc(p[0] * W, p[1] * H, 5, 0, Math.PI * 2); ctx.fill(); });
      if (pts.length === 2) { ctx.beginPath(); ctx.moveTo(pts[0][0] * W, pts[0][1] * H); ctx.lineTo(pts[1][0] * W, pts[1][1] * H); ctx.stroke(); }
      ctx.restore();
    }
  });
  AN.video = video;
/* studio: auto-pose wiring, inserted right after AN.video = video; */
AN.auto = { mode: "off", variant: "lite", track: null };
const anRestoreAuto = () => {
  const t = AN.moments.find(x => x.id === "__track");
  if (t && t.track) { AN.auto.track = t.track; AN.moments = AN.moments.filter(x => x !== t); anDrawMoms(root, true); anShowChart(root, video); }
};
video.addEventListener("loadedmetadata", anRestoreAuto, { once: true });

const anEnsureAuto = async mode => {
  if (!window.apInit) {
    toast("⏳ بيحمّل نموذج التحليل أول مرة (~١٧ ميجا، بعدها بيشتغل فوراً حتى أوفلاين)…");
    await anLoadScript("pose-auto.js");
  }
  return apInit(AN.auto.variant, null, mode);
};

AN.variantGo = async () => {
  if (AN.auto.mode === "tracking") return;
  AN.auto.variant = AN.auto.variant === "lite" ? "full" : "lite";
  anDrawTools(root);
  if (AN.auto.mode !== "off") {
    try { await anEnsureAuto("IMAGE"); toast(AN.auto.variant === "lite" ? "النموذج الخفيف جاهز" : "نموذج الدقة العالية جاهز (~٩ ميجا زيادة أول مرة)"); }
    catch (e) { toast("تعذر تحميل النموذج، اتأكد من النت"); }
  } else {
    toast(AN.auto.variant === "lite" ? "النموذج الخفيف هيشتغل مع أول تحليل" : "الدقة العالية هتشتغل مع أول تحليل (~٩ ميجا زيادة أول مرة)");
  }
};

const anAutoOff = silent => {
  AN.auto.mode = "off";
  AN.auto.skel = null;
  if (!silent) toast("اتقفل التحليل التلقائي");
};

AN.autoGo = async () => {
  if (AN.auto.mode === "tracking") return toast("استنى التحليل يخلص الأول");
  if (AN.auto.mode === "loading") return;
  /* one tap = full automatic analysis of the whole video (angles, torque, gravity, intensity) */
  if (video.duration > 0) { anAutoOff(true); return AN.trackGo(); }
  if (AN.auto.mode !== "off") { anAutoOff(); return; }
  video.pause();
  AN.auto.mode = "loading";
  try { await anEnsureAuto("IMAGE"); }
  catch (e) { AN.auto.mode = "off"; return toast("تعذر تحميل النموذج، اتأكد من النت وجرب تاني"); }
  AN.auto.mode = "photo";
  toast("📷 وجه الكاميرا لشخص واحد واضح، والتحليل هيظهر لحظياً");
  anAutoFrame();
};

/* detect on the current paused frame; keeps verdicts when the frame barely moved */
const anAutoFrame = async () => {
  if (!AN || AN.auto.mode !== "photo") return;
  try {
    const det = await apDetect(video);
    if (!AN || AN.auto.mode !== "photo") return;
    if (det && det.landmarks) {
      const keep = AN.auto.skel && Math.abs(AN.auto.skel.t - video.currentTime) < 0.05;
      AN.auto.skel = { t: video.currentTime, lms: apPack(det.landmarks), angles: apComputeAngles(det.landmarks), joints: keep ? AN.auto.skel.joints : [] };
    } else {
      AN.auto.skel = { t: video.currentTime, lms: null };
      toast("مش لاقي جسم واضح في اللقطة دي");
    }
  } catch (e) { /* keep previous overlay */ }
};
video.addEventListener("pause", anAutoFrame);
video.addEventListener("seeked", anAutoFrame);

/* move the live detection into the current moment as a saved skeleton stroke */
const anSyncSkel = () => {
  if (!AN.auto.skel || !AN.auto.skel.lms) return null;
  const m = anCur() || ensureMom();
  m.strokes = (m.strokes || []).filter(s => s.k !== "skeleton");
  const sk = { k: "skeleton", lms: AN.auto.skel.lms, angles: AN.auto.skel.angles, joints: AN.auto.skel.joints || [] };
  m.strokes.push(sk);
  AN.dirty = true;
  AN.auto.skel = null;
  return sk;
};

AN.trackGo = async () => {
  if (AN.auto.mode === "tracking") return;
  AN.auto.mode = "tracking";
  toast("🤖 بحلّل الفيديو كله: زوايا، عزم، خط الجاذبية، شدة الحركة… ثانية واحدة بعد ما الفيديو يخلص");
  let track = null;
  try {
    await anEnsureAuto("VIDEO");
    const t0 = AN.video.currentTime;
    video.pause(); video.currentTime = 0;
    await new Promise(r => { if (video.readyState >= 2 && !video.seeking) return r(); video.addEventListener("seeked", r, { once: true }); setTimeout(r, 1500); });
    const res = await apTrack(video, 10, p => { const pb = root.querySelector('[data-an="play"]'); if (pb) pb.textContent = Math.round(p * 100) + "٪"; });
    const ar = (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : 0.5625;
    track = { fps: res.fps, ar, frames: res.frames, series: apSeries(res.frames).map(x => ({ ...x, unit: "°" })).concat(anbSeries(res.frames, ar)) };
    video.currentTime = t0;
    const pb = root.querySelector('[data-an="play"]'); if (pb) pb.textContent = "▶";
  } catch (e) {
    AN.auto.mode = "off";
    const pb = root.querySelector('[data-an="play"]'); if (pb) pb.textContent = "▶";
    return toast("التتبع ماكملش، جرّب تاني");
  }
  AN.auto.mode = "off";
  if (!track.frames.length) return toast("مفيش جسم واضح اتحدد في الفيديو");
  AN.auto.track = track;
  AN.chartSel = null;
  AN.dirty = true;
  anShowChart(root, video);
  toast("✓ التحليل خلص: " + track.frames.length + " لقطة. اختار الزاوية أو العزم أو الشدة من فوق");
};

AN.photoGo = () => {
  if (AN.auto.mode === "tracking") return;
  root.querySelector('[data-an="photoinp"]').click();
};
AN.photoPicked = async ev => {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  let bmp;
  try { bmp = await createImageBitmap(f); }
  catch (e) { return toast("الصورة دي مش مدعومة"); }
  const mx = 1600, sc = Math.min(1, mx / Math.max(bmp.width, bmp.height));
  const oc = document.createElement("canvas");
  oc.width = Math.max(2, Math.round(bmp.width * sc));
  oc.height = Math.max(2, Math.round(bmp.height * sc));
  oc.getContext("2d").drawImage(bmp, 0, 0, oc.width, oc.height);
  toast("🤖 بحلّل الصورة…");
  let det = null;
  try { await anEnsureAuto("IMAGE"); det = await apDetect(oc); }
  catch (e) { return toast("تعذر تحميل النموذج، اتأكد من النت وجرب تاني"); }
  if (!det || !det.landmarks) return toast("مش لاقي جسم واضح في الصورة — لازم صورة شخص واحد كامل وواضح");
  const blob = await new Promise(r => oc.toBlob(r, "image/jpeg", 0.85));
  if (!blob) return toast("تعذر تجهيز الصورة");
  const path = "ann/" + checkin.client_id + "/" + checkin.id + "-" + Date.now().toString(36) + ".jpg";
  toast("⏳ برفع الصورة…");
  const { error: ue } = await sb.storage.from("posing").upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (ue) return toast("تعذر رفع الصورة، جرّب تاني");
  const lms = apPack(det.landmarks);
  const m = { id: anId(), t: 0, photo: path, note: "", strokes: [{ k: "skeleton", lms, angles: apComputeAngles(det.landmarks), joints: [] }] };
  AN.moments.push(m);
  AN.moments.sort((a, b) => (a.photo ? -1 : a.t) - (b.photo ? -1 : b.t));
  AN.curId = m.id;
  AN.dirty = true;
  anDrawMoms(root, true);
  anDrawNote(root);
  AN.photoShow = m;
  toast("✓ الصورة اتحللت — فعّل 🦴 صحّح وعلّم على المفاصل");
};

  if (AN.curId) { const m = anCur(); video.addEventListener("loadedmetadata", () => { video.currentTime = m.t; }, { once: true }); }

  /* pointer drawing */
  const pos = e => { const r = canvas.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  const ensureMom = () => { let m = anCur(); if (!m) { video.pause(); m = anNewMoment(video.currentTime); anDrawMoms(root, true); anDrawNote(root); } return m; };
  canvas.addEventListener("pointerdown", e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    video.pause();
    let p = pos(e);
    const tool = AN.tool;
    if (anCur() && anCur().photo && AN.photoRect) { const r = AN.photoRect; p = [Math.min(1, Math.max(0, (p[0] - r.x) / r.w)), Math.min(1, Math.max(0, (p[1] - r.y) / r.h))]; }
    if (tool === "mark") {
      const sk = anSyncSkel() || (anCur() && (anCur().strokes || []).find(x => x.k === "skeleton"));
      if (!sk) { toast("حلّل اللقطة ب🤖 أو صورة ب📷 الأول، وبعدين علّم على المفاصل"); return; }
      const r0 = canvas.getBoundingClientRect();
      let hx = e.clientX - r0.left, hy = e.clientY - r0.top, hw = r0.width, hh = r0.height;
      if (anCur() && anCur().photo && AN.photoRect) { const r = AN.photoRect; hx -= r.x * r0.width; hy -= r.y * r0.height; hw = r.w * r0.width; hh = r.h * r0.height; }
      const i = window.apHit ? apHit(sk.lms, hx, hy, hw, hh) : null;
      if (i == null) return;
      sk.joints = sk.joints || [];
      const j = sk.joints.find(x => x.i === i);
      if (!j) { const nj = { i, name: ANS_LM[i] || ("نقطة " + i), verdict: "fix", note: "" }; sk.joints.push(nj); AN.dirty = true; anJointNote(root, nj); }
      else if (j.verdict === "fix") { j.verdict = "good"; AN.dirty = true; anJointNote(root, j); }
      else { sk.joints = sk.joints.filter(x => x !== j); AN.dirty = true; }
      return;
    }
    if (tool === "pen") { const m = ensureMom(); AN.drawing = { k: "pen", c: AN.color, w: 0.011, pts: [p] }; }
    else if (tool === "line" || tool === "arrow") { AN.drawing = { k: tool, c: AN.color, w: 0.011, a: p, b: p }; }
    else if (tool === "circle") { AN.drawing = { k: "circle", c: AN.color, w: 0.011, o: p, r: 0 }; }
    else if (tool === "angle") {
      AN.pending.push(p);
      if (AN.pending.length === 3) {
        const m = ensureMom();
        m.strokes.push({ k: "angle", c: AN.color, w: 0.011, p1: AN.pending[0], v: AN.pending[1], p2: AN.pending[2] });
        AN.pending = []; AN.dirty = true;
      }
    } else if (tool === "text") {
      AN.textAt = p;
      const bar = root.querySelector(".an-textbar");
      bar.style.display = "";
      const inp = bar.querySelector("input"); inp.value = ""; setTimeout(() => inp.focus(), 50);
    }
  });
  canvas.addEventListener("pointermove", e => {
    if (!AN.drawing) return;
    const p = pos(e), d = AN.drawing;
    if (d.k === "pen") d.pts.push(p);
    else if (d.k === "line" || d.k === "arrow") d.b = p;
    else if (d.k === "circle") { const r = canvas.getBoundingClientRect(); d.r = Math.min(0.9, Math.hypot((p[0] - d.o[0]) * r.width, (p[1] - d.o[1]) * r.height) / Math.max(1, r.width)); }
  });
  const commit = () => {
    if (!AN || !AN.drawing) return;
    const d = AN.drawing;
    AN.drawing = null;
    const ok = d.k === "pen" ? d.pts.length > 2 : d.k === "circle" ? d.r > 0.01 : (d.a && d.b && Math.hypot(d.a[0] - d.b[0], d.a[1] - d.b[1]) > 0.01);
    if (ok) { ensureMom().strokes.push(d); AN.dirty = true; }
  };
  canvas.addEventListener("pointerup", commit);
  canvas.addEventListener("pointercancel", () => { AN && (AN.drawing = null); });

  const bar = root.querySelector(".an-textbar");
  bar.querySelector('[data-an="textok"]').onclick = () => {
    const v = bar.querySelector("input").value.trim();
    if (AN.jointNote) { AN.jointNote.note = v.slice(0, 120); AN.jointNote = null; AN.dirty = true; bar.querySelector("input").placeholder = "اكتب الملاحظة على الفيديو"; bar.style.display = "none"; return; }
    if (v && AN.textAt) { ensureMom().strokes.push({ k: "text", c: AN.color, at: AN.textAt, text: v.slice(0, 60) }); AN.dirty = true; }
    AN.textAt = null; bar.style.display = "none";
  };
  bar.querySelector('[data-an="textno"]').onclick = () => { AN.textAt = null; AN.jointNote = null; bar.querySelector("input").placeholder = "اكتب الملاحظة على الفيديو"; bar.style.display = "none"; };

  /* save */
  root.querySelector('[data-an="save"]').onclick = async b => {
    const btn = b.target; btn.disabled = true; btn.textContent = "بيحفظ…";
    try {
      const clean = AN.moments.filter(m => (m.strokes && m.strokes.length) || (m.note || "").trim())
        .map(m => m.photo
          ? { id: m.id, t: m.t, photo: m.photo, note: (m.note || "").trim() || null, strokes: m.strokes }
          : { id: m.id, t: m.t, note: (m.note || "").trim() || null, strokes: m.strokes });
      if (AN.auto && AN.auto.track && AN.auto.track.frames && AN.auto.track.frames.length)
        clean.push({ id: "__track", t: 0, note: null, strokes: [], track: { fps: AN.auto.track.fps, frames: AN.auto.track.frames, series: AN.auto.track.series } });
      let error;
      if (clean.length) {
        ({ error } = await sb.from("posing_annotations").upsert({ checkin_id: AN.checkin.id, client_id: AN.checkin.client_id, moments: clean, updated_at: new Date().toISOString() }, { onConflict: "checkin_id" }));
      } else {
        ({ error } = await sb.from("posing_annotations").delete().eq("checkin_id", AN.checkin.id));
      }
      if (error) { btn.disabled = false; btn.textContent = "حفظ التحليل"; return toast("تعذر الحفظ، جرّب تاني"); }
      await sb.from("posing_checkins").update({ reviewed_at: new Date().toISOString() }).eq("id", AN.checkin.id);
      AN.dirty = false;
      toast("✓ اتحفظ التحليل، العميل هيشوفه");
      const cb = onSaved; anClose(); if (cb) cb();
    } catch (e) { btn.disabled = false; btn.textContent = "حفظ التحليل"; toast("تعذر الحفظ، جرّب تاني"); }
  };
}

/* ---------- client viewer ---------- */
async function openAnnotateViewer(checkin, videoUrl, moments) {
  if (AN) anClose();
  AN = { mode: "view", checkin, moments: (moments || []).map(m => ({ ...m })), curId: null, photoShow: null, chartSel: null, showSkel: true, auto: null };
  AN.curId = AN.moments[0]?.id || null;
  const root = AN.root = anShell("🎯 تحليل الكوتش", "");
  root.querySelector('[data-an="close"]').onclick = anClose;
  root.querySelector(".an-tools").remove();
  root.querySelector(".an-note").remove();
  const hint = document.createElement("div");
  hint.className = "an-hint";
  hint.textContent = "اضغط على لقطة عشان توقف عندها";
  root.appendChild(hint);
  anDrawMoms(root, false);

  const noteBox = document.createElement("div");
  noteBox.className = "an-vnote"; noteBox.style.display = "none";
  root.insertBefore(noteBox, hint);

  const { video } = anWireVideo(root, videoUrl, (ctx, cnv) => {
    const W = cnv.width, H = cnv.height;
    ctx.clearRect(0, 0, W, H);
    const ct = video.currentTime;
    if (AN.photoShow) {
      video.style.visibility = "hidden";
      const img = anPhotoImg(AN.photoShow.photo);
      if (img) { const rc = anContainDraw(ctx, cnv, img); if (rc) { AN.photoRect = { x: rc.x / W, y: rc.y / H, w: rc.w / W, h: rc.h / H }; anPhotoStrokes(ctx, W, H, rc, AN.photoShow.strokes); } }
      return;
    }
    video.style.visibility = "";
    if (AN.auto && AN.auto.track && AN.showSkel !== false) {
      const cb = root.querySelector(".an-chartbar");
      if (cb && cb.style.display !== "none") {
        const f = anTrackFrameAt(AN.auto.track, ct);
        if (f && Math.abs(f.t - ct) < 0.4) anSkeleton(ctx, W, H, { lms: f.lms, joints: [], angles: [] }, false, true);
      }
    }
    anChartTick(root, ct);
    let note = null;
    AN.moments.forEach(m => {
      const d = ct - m.t;
      if (d >= -0.15 && d <= 3) {
        const alpha = d > 2.5 ? Math.max(0, 1 - (d - 2.5) * 2) : 1;
        ctx.save(); ctx.globalAlpha = alpha;
        (m.strokes || []).forEach(s => anStroke(ctx, W, H, s));
        ctx.restore();
        if (m.note && d >= -0.15) note = { t: m.t, text: m.note };
      }
    });
    if (note) { noteBox.innerHTML = `<b>📝 ملاحظة الكوتش عند ${anFmt(note.t)}</b>${anEsc(note.text)}`; noteBox.style.display = ""; }
    else noteBox.style.display = "none";
  });
  AN.video = video;
  AN.auto = { mode: "off", track: null };
  video.addEventListener("play", () => { AN.photoShow = null; });
  video.addEventListener("loadedmetadata", () => {
    const t = AN.moments.find(x => x.id === "__track");
    if (t && t.track) { AN.auto.track = t.track; AN.moments = AN.moments.filter(x => x !== t); anShowChart(root, video); }
  }, { once: true });
  if (AN.curId) { const m = AN.moments[0]; video.addEventListener("loadedmetadata", () => { video.currentTime = m.t; }, { once: true }); }
}

/* test hook (harmless in production) */
window.__anDebug = () => AN;
