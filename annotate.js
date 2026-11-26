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
    <div class="an-trans">
      <button class="an-btn" data-an="play" style="min-width:44px">▶</button>
      <button class="an-btn" data-an="back" title="فريم لورا">⟪</button>
      <button class="an-btn" data-an="fwd" title="فريم لقدام">⟫</button>
      <span class="an-time">0:00.0</span>
      <span style="flex:1"></span>
      ${AN_SPEEDS.map(s => `<button class="an-spd${s === 1 ? " on" : ""}" data-spd="${s}">×${s}</button>`).join("")}
    </div>
    <div class="an-tools"></div>
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

/* ---------- tools row (edit mode) ---------- */
const AN_TOOLS = [["pen", "✏️ قلم"], ["line", "— خط"], ["arrow", "➶ سهم"], ["angle", "📐 زاوية"], ["circle", "◯ دايرة"], ["text", "🅣 كتابة"]];
function anDrawTools(root) {
  const t = root.querySelector(".an-tools");
  t.innerHTML = AN_TOOLS.map(([k, l]) => `<button class="an-tool${AN.tool === k ? " on" : ""}" data-tool="${k}">${l}</button>`).join("")
    + `<span style="flex:none;width:4px"></span>`
    + AN_COLORS.map(c => `<button class="an-dot${AN.color === c ? " on" : ""}" data-col="${c}" style="background:${c}" aria-label="لون"></button>`).join("")
    + `<span style="flex:none;width:4px"></span>
       <button class="an-tool" data-an="undo" title="تراجع">↩ تراجع</button>
       <button class="an-tool" data-an="clear" title="مسح اللقطة">🗑 مسح</button>`;
  t.querySelectorAll("[data-tool]").forEach(b => b.onclick = () => { AN.tool = b.dataset.tool; AN.pending = []; anDrawTools(root); });
  t.querySelectorAll("[data-col]").forEach(b => b.onclick = () => { AN.color = b.dataset.col; anDrawTools(root); });
  t.querySelector('[data-an="undo"]').onclick = () => { const m = anCur(); if (m && m.strokes.length) { m.strokes.pop(); AN.dirty = true; } };
  t.querySelector('[data-an="clear"]').onclick = () => { const m = anCur(); if (m && m.strokes.length && confirm("تمسح كل رسم اللقطة دي؟")) { m.strokes = []; AN.dirty = true; } };
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
    + AN.moments.map(m => `<button class="an-mom${m.id === AN.curId ? " on" : ""}" data-mom="${m.id}">⏱ ${anFmt(m.t)}${m.note ? " 💬" : ""}${edit ? `<span class="x" data-momx="${m.id}">✕</span>` : ""}</button>`).join("")
    + (!edit && !AN.moments.length ? `<span class="an-hint">مفيش لقطات</span>` : "");
  bar.querySelectorAll("[data-mom]").forEach(b => b.onclick = e => {
    if (e.target.dataset.momx) return;
    AN.curId = b.dataset.mom;
    const m = anCur();
    if (m) { AN.video.pause(); AN.video.currentTime = m.t; }
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
  AN = { mode: "edit", checkin, moments: (moments || []).map(m => ({ ...m, strokes: (m.strokes || []).map(s => ({ ...s })) })), curId: null, tool: "pen", color: AN_COLORS[0], dirty: false, pending: [], drawing: null, textAt: null };
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
    if (m) m.strokes.forEach(s => anStroke(ctx, W, H, s));
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
  if (AN.curId) { const m = anCur(); video.addEventListener("loadedmetadata", () => { video.currentTime = m.t; }, { once: true }); }

  /* pointer drawing */
  const pos = e => { const r = canvas.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  const ensureMom = () => { let m = anCur(); if (!m) { video.pause(); m = anNewMoment(video.currentTime); anDrawMoms(root, true); anDrawNote(root); } return m; };
  canvas.addEventListener("pointerdown", e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    video.pause();
    const p = pos(e);
    const tool = AN.tool;
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
    if (v && AN.textAt) { ensureMom().strokes.push({ k: "text", c: AN.color, at: AN.textAt, text: v.slice(0, 60) }); AN.dirty = true; }
    AN.textAt = null; bar.style.display = "none";
  };
  bar.querySelector('[data-an="textno"]').onclick = () => { AN.textAt = null; bar.style.display = "none"; };

  /* save */
  root.querySelector('[data-an="save"]').onclick = async b => {
    const btn = b.target; btn.disabled = true; btn.textContent = "بيحفظ…";
    try {
      const clean = AN.moments.filter(m => (m.strokes && m.strokes.length) || (m.note || "").trim())
        .map(m => ({ id: m.id, t: m.t, note: (m.note || "").trim() || null, strokes: m.strokes }));
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
  AN = { mode: "view", checkin, moments: (moments || []).map(m => ({ ...m })), curId: null };
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
  if (AN.curId) { const m = AN.moments[0]; video.addEventListener("loadedmetadata", () => { video.currentTime = m.t; }, { once: true }); }
}

/* test hook (harmless in production) */
window.__anDebug = () => AN;
