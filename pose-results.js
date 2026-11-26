/* MOFIT pose results panel (coach + client).
   Shows the summary of a finished whole-video scan: rep summary, joint angles,
   relative joint torque, gravity line stability and movement intensity.
   Pure math on the saved landmark frames: no model, no network, no DB.

   Input track: { fps, ar, frames: [{ t, lms: [[x,y,vis], ...33] }] }
   (the same object AN.auto.track holds in pose-annotate.js; track.series is not needed)

   API (window.MofitPoseResults):
     summarize(track)              -> plain summary object (testable)
     render(host, track, opts)     -> draws the panel inside host
     open(track, opts)             -> full-height sheet with a close button
     close()
   opts: { onSeek(t) } called when the user taps a rep row or the chart. */
(function () {
  "use strict";
  var CSS_ID = "mpr-css";

  /* ---------- math ---------- */
  var SEG = [[0.081, 7, 8], [0.497, "sh", "hp"], [0.028, 11, 13], [0.028, 12, 14], [0.022, 13, 15], [0.022, 14, 16],
    [0.1, 23, 25], [0.1, 24, 26], [0.0465, 25, 27], [0.0465, 26, 28], [0.0145, 27, 31], [0.0145, 28, 32]];
  var JOINTS = [["الركبة", 23, 25, 27, 24, 26, 28], ["الورك", 11, 23, 25, 12, 24, 26],
    ["الكوع", 11, 13, 15, 12, 14, 16], ["الكتف", 23, 11, 13, 24, 12, 14]];
  var SIDE = ["الشمال", "اليمين"];
  var MINV = 0.4;

  function pts(lms, ar) {
    var f = function (i) { var p = lms[i]; return p && (p[2] == null ? 1 : p[2]) >= MINV ? { x: p[0] * ar, y: p[1] } : null; };
    var mid = function (a, b) { return (a && b) ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : (a || b || null); };
    return { f: f, mid: mid };
  }
  function frameAnalyze(lms, ar) {
    var P = pts(lms, ar), f = P.f, mid = P.mid;
    var sh = mid(f(11), f(12)), hp = mid(f(23), f(24));
    if (!sh || !hp) return null;
    var trunk = Math.hypot(sh.x - hp.x, sh.y - hp.y);
    if (trunk < 0.02) return null;
    var pt = function (k) { return k === "sh" ? sh : k === "hp" ? hp : f(k); };
    var M = 0, cx = 0, cy = 0, segC = [];
    SEG.forEach(function (s) {
      var c = mid(pt(s[1]), pt(s[2])); segC.push(c);
      if (c) { M += s[0]; cx += s[0] * c.x; cy += s[0] * c.y; }
    });
    if (M < 0.5) return null;
    var com = { x: cx / M, y: cy / M };
    var feet = [27, 28, 29, 30, 31, 32].map(f).filter(Boolean);
    var bos = feet.length ? [Math.min.apply(0, feet.map(function (p) { return p.x; })), Math.max.apply(0, feet.map(function (p) { return p.x; }))] : null;
    var dist = function (idx) {
      var m = 0, x = 0;
      idx.forEach(function (i) { var c = segC[i]; if (c) { m += SEG[i][0]; x += SEG[i][0] * c.x; } });
      return m > 0 ? { m: m, x: x / m } : null;
    };
    var defs = [["الكوع", 13, dist([4])], ["الكوع", 14, dist([5])], ["الكتف", 11, dist([2, 4])], ["الكتف", 12, dist([3, 5])],
      ["الركبة", 25, dist([8, 10])], ["الركبة", 26, dist([9, 11])],
      ["الورك", 23, dist([1, 0, 2, 3, 4, 5])], ["الورك", 24, dist([1, 0, 2, 3, 4, 5])]];
    var torques = [];
    defs.forEach(function (d, i) {
      var J = f(d[1]); if (!J || !d[2]) return;
      torques.push({ name: d[0], side: i % 2, val: Math.abs(d[2].x - J.x) * d[2].m / trunk * 100 });
    });
    var off = null, inside = null;
    if (bos) { var c0 = (bos[0] + bos[1]) / 2; off = (com.x - c0) / trunk * 100; inside = com.x >= bos[0] && com.x <= bos[1]; }
    return { trunk: trunk, com: com, off: off, inside: inside, torques: torques, sh: sh, hp: hp };
  }
  function ang(lms, a, b, c) {
    var A = lms[a], B = lms[b], C = lms[c]; if (!A || !B || !C) return null;
    if (Math.min(A[2] == null ? 1 : A[2], B[2] == null ? 1 : B[2], C[2] == null ? 1 : C[2]) < MINV) return null;
    var d = Math.abs((Math.atan2(C[1] - B[1], C[0] - B[0]) - Math.atan2(A[1] - B[1], A[0] - B[0])) * 180 / Math.PI);
    return d > 180 ? 360 - d : d;
  }
  function stats(a) {
    if (!a.length) return null;
    var mn = Infinity, mx = -Infinity, s = 0;
    a.forEach(function (v) { if (v < mn) mn = v; if (v > mx) mx = v; s += v; });
    return { min: mn, max: mx, avg: s / a.length, n: a.length };
  }
  function smooth(a, k) { // moving average that skips nulls
    return a.map(function (_, i) {
      var s = 0, n = 0;
      for (var j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) if (a[j] != null) { s += a[j]; n++; }
      return n ? s / n : null;
    });
  }

  function summarize(track) {
    var fr = (track && track.frames) || [], ar = (track && track.ar) || 0.5625;
    var out = { frames: fr.length, dur: 0, angles: [], torque: [], reps: null, gravity: null, intensity: null, primary: null };
    if (!fr.length) return out;
    out.dur = fr[fr.length - 1].t - fr[0].t;

    /* angles per joint and side */
    var series = {}; // key -> [value per frame]
    JOINTS.forEach(function (j) {
      [[j[1], j[2], j[3], 0], [j[4], j[5], j[6], 1]].forEach(function (q) {
        series[j[0] + "|" + q[3]] = fr.map(function (f) { return ang(f.lms, q[0], q[1], q[2]); });
      });
    });
    JOINTS.forEach(function (j) {
      [0, 1].forEach(function (s) {
        var st = stats(series[j[0] + "|" + s].filter(function (v) { return v != null; }));
        if (st && st.n >= 3) out.angles.push({ name: j[0], side: s, min: st.min, max: st.max, avg: st.avg, rom: st.max - st.min, n: st.n });
      });
    });

    /* per-frame analysis */
    var an = fr.map(function (f) { return frameAnalyze(f.lms, ar); });

    /* torque: peak + average per joint+side */
    var tq = {};
    an.forEach(function (A, i) {
      if (!A) return;
      A.torques.forEach(function (q) {
        var k = q.name + "|" + q.side; (tq[k] = tq[k] || []).push({ v: q.val, t: fr[i].t });
      });
    });
    Object.keys(tq).forEach(function (k) {
      var arr = tq[k]; if (arr.length < 3) return;
      var pk = arr.reduce(function (m, x) { return x.v > m.v ? x : m; }, arr[0]);
      var avg = arr.reduce(function (s, x) { return s + x.v; }, 0) / arr.length;
      var p = k.split("|");
      out.torque.push({ name: p[0], side: +p[1], peak: pk.v, peakT: pk.t, avg: avg });
    });

    /* gravity line: COM versus base of support */
    var ins = 0, tot = 0, offs = [], worst = null;
    an.forEach(function (A, i) {
      if (!A || A.inside == null) return;
      tot++; if (A.inside) ins++;
      offs.push(Math.abs(A.off));
      if (!worst || Math.abs(A.off) > Math.abs(worst.off)) worst = { off: A.off, t: fr[i].t };
    });
    if (tot >= 3) {
      var pct = ins / tot * 100;
      out.gravity = { insidePct: pct, avgOff: offs.reduce(function (s, v) { return s + v; }, 0) / offs.length, worst: worst, frames: tot,
        label: pct >= 85 ? "ثابت" : pct >= 60 ? "متوسط" : "مايل", tone: pct >= 85 ? "ok" : pct >= 60 ? "mid" : "bad" };
    }

    /* intensity: mean limb speed in trunk-lengths per second */
    var sp = [];
    for (var i = 1; i < fr.length; i++) {
      var A = an[i], a = fr[i], p = fr[i - 1], v = null;
      if (A && a.t > p.t) {
        var s = 0, n = 0;
        [15, 16, 27, 28].forEach(function (k) {
          var u = a.lms[k], w = p.lms[k];
          if (u && w && (u[2] == null ? 1 : u[2]) > MINV && (w[2] == null ? 1 : w[2]) > MINV) {
            s += Math.hypot((u[0] - w[0]) * ar, u[1] - w[1]) / A.trunk / (a.t - p.t); n++;
          }
        });
        if (n) v = s / n;
      }
      sp.push(v);
    }
    var spv = sp.filter(function (v) { return v != null; });
    if (spv.length >= 3) {
      var sorted = spv.slice().sort(function (x, y) { return x - y; });
      var avgS = spv.reduce(function (s, v) { return s + v; }, 0) / spv.length;
      var p90 = sorted[Math.floor(sorted.length * 0.9)];
      out.intensity = { avg: avgS, peak: p90, level: avgS < 0.35 ? 0 : avgS < 0.9 ? 1 : avgS < 1.6 ? 2 : 3,
        label: ["خفيفة", "متوسطة", "عالية", "قصوى"][avgS < 0.35 ? 0 : avgS < 0.9 ? 1 : avgS < 1.6 ? 2 : 3] };
    }

    /* reps: use the joint with the biggest range of motion (knee or elbow, both sides averaged) */
    var cand = [];
    ["الركبة", "الكوع", "الورك"].forEach(function (nm) {
      var a0 = series[nm + "|0"], a1 = series[nm + "|1"];
      var comb = a0.map(function (v, i) { var w = a1[i]; return v != null && w != null ? (v + w) / 2 : (v != null ? v : w); });
      var sm = smooth(comb, 1), vals = sm.filter(function (v) { return v != null; });
      var st = stats(vals); if (st && st.n >= 6) cand.push({ name: nm, sm: sm, st: st, rom: st.max - st.min });
    });
    /* knee first (squat, lunge, deadlift), then elbow (curl, press), then hip: elbow angles jump around when the wrist is hidden, so the biggest range alone is not a safe pick */
    var order = { "الركبة": 0, "الكوع": 1, "الورك": 2 }, P = null;
    cand.sort(function (x, y) { return order[x.name] - order[y.name]; });
    for (var ci = 0; ci < cand.length; ci++) if (cand[ci].rom >= 35) { P = cand[ci]; break; }
    if (!P) { cand.sort(function (x, y) { return y.rom - x.rom; }); P = cand[0]; }
    if (P) {
      out.primary = { name: P.name, rom: P.rom, sm: P.sm, t: fr.map(function (f) { return f.t; }) };
      var reps = [];
      if (P.rom >= 25) {
        var lo = P.st.min + P.rom * 0.35, hi = P.st.max - P.rom * 0.35;
        var state = null, startI = 0, minV = Infinity, minI = 0;
        P.sm.forEach(function (v, i) {
          if (v == null) return;
          if (state == null) { state = v >= hi ? "high" : v <= lo ? "low" : null; if (state) { startI = i; minV = v; minI = i; } return; }
          if (state === "high" && v <= lo) { state = "low"; minV = v; minI = i; }
          else if (state === "low") {
            if (v < minV) { minV = v; minI = i; }
            if (v >= hi) {
              reps.push({ t0: fr[startI].t, t1: fr[i].t, tBottom: fr[minI].t, bottom: minV, dur: fr[i].t - fr[startI].t, down: fr[minI].t - fr[startI].t, up: fr[i].t - fr[minI].t });
              state = "high"; startI = i; minV = v; minI = i;
            }
          }
        });
      }
      var res = { name: P.name, count: reps.length, list: reps, rom: P.rom };
      if (reps.length) {
        var bs = reps.map(function (r) { return r.bottom; });
        var bavg = bs.reduce(function (s, v) { return s + v; }, 0) / bs.length;
        var sd = Math.sqrt(bs.reduce(function (s, v) { return s + (v - bavg) * (v - bavg); }, 0) / bs.length);
        res.avgDur = reps.reduce(function (s, r) { return s + r.dur; }, 0) / reps.length;
        res.avgBottom = bavg;
        res.consistency = Math.max(0, Math.min(100, 100 - sd / Math.max(10, P.rom) * 100 * 2));
        res.avgDown = reps.reduce(function (s, r) { return s + r.down; }, 0) / reps.length;
        res.avgUp = reps.reduce(function (s, r) { return s + r.up; }, 0) / reps.length;
      }
      out.reps = res;
    }
    return out;
  }

  /* ---------- view ---------- */
  var CSS = "" +
    ".mpr-sheet{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:rgba(3,7,18,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);animation:mprFade .35s ease}" +
    ".mpr-sheet>.mpr{margin-top:auto;max-height:92vh;overflow:auto;border-radius:26px 26px 0 0;animation:mprUp .55s cubic-bezier(.2,.9,.25,1)}" +
    "@media(min-width:900px){.mpr-sheet>.mpr{margin:auto;width:min(980px,94vw);border-radius:26px}}" +
    ".mpr{direction:rtl;font-family:system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;color:#E5EEF9;padding:18px 16px 28px;background:radial-gradient(120% 80% at 80% -10%,rgba(56,189,248,.20),transparent 60%),radial-gradient(90% 70% at 0% 110%,rgba(34,197,94,.16),transparent 60%),#070D1A;border:1px solid rgba(56,189,248,.28);box-shadow:0 0 60px rgba(56,189,248,.18),inset 0 0 0 1px rgba(255,255,255,.03);box-sizing:border-box}" +
    ".mpr *{box-sizing:border-box}" +
    ".mpr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}" +
    ".mpr-title{font-size:19px;font-weight:900;letter-spacing:.2px;display:flex;align-items:center;gap:8px}" +
    ".mpr-title i{display:inline-block;width:10px;height:10px;border-radius:50%;background:#22C55E;box-shadow:0 0 12px #22C55E;animation:mprPulse 1.6s infinite}" +
    ".mpr-x{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;padding:6px 12px;font-size:15px;cursor:pointer}" +
    ".mpr-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:12px;margin-bottom:12px}" +
    "@media(max-width:560px){.mpr-hero{grid-template-columns:1fr}}" +
    ".mpr-card{position:relative;border-radius:20px;padding:14px;background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.09);overflow:hidden;opacity:0;transform:translateY(14px);animation:mprIn .6s cubic-bezier(.2,.9,.25,1) forwards;animation-delay:var(--d,0s)}" +
    ".mpr-card:before{content:'';position:absolute;inset:-1px;border-radius:inherit;background:conic-gradient(from var(--a,0deg),transparent 0 70%,rgba(56,189,248,.55) 85%,transparent 100%);-webkit-mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);padding:1px;animation:mprSpin 6s linear infinite;pointer-events:none}" +
    "@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}" +
    ".mpr-h{font-size:13px;font-weight:800;color:#93C5FD;margin-bottom:10px;display:flex;align-items:center;gap:6px}" +
    ".mpr-big{font-size:74px;line-height:1;font-weight:900;color:#fff;text-shadow:0 0 28px rgba(56,189,248,.8),0 0 60px rgba(56,189,248,.35)}" +
    ".mpr-bigl{font-size:15px;font-weight:700;color:#BAE6FD;margin-top:4px}" +
    ".mpr-kv{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}" +
    ".mpr-chip{background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);border-radius:12px;padding:6px 10px;font-size:12.5px;font-weight:700}" +
    ".mpr-chip b{color:#fff;font-size:15px;margin-inline-start:4px}" +
    ".mpr-ring{display:flex;align-items:center;gap:14px}" +
    ".mpr-ring svg{width:112px;height:112px;flex:none;filter:drop-shadow(0 0 10px var(--c,#22C55E))}" +
    ".mpr-ring .tr{stroke:rgba(255,255,255,.1)}.mpr-ring .fg{stroke:var(--c,#22C55E);stroke-linecap:round;transition:stroke-dashoffset 1.4s cubic-bezier(.2,.9,.25,1)}" +
    ".mpr-ring .num{font-size:25px;font-weight:900;fill:#fff}" +
    ".mpr-lbl{font-size:22px;font-weight:900;color:var(--c,#22C55E);text-shadow:0 0 14px var(--c,#22C55E)}" +
    ".mpr-note{font-size:12px;color:#94A3B8;line-height:1.55;margin-top:6px}" +
    ".mpr-tone-ok{--c:#22C55E}.mpr-tone-mid{--c:#FACC15}.mpr-tone-bad{--c:#F43F5E}" +
    ".mpr-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}" +
    "@media(max-width:700px){.mpr-grid{grid-template-columns:1fr}}" +
    ".mpr-wide{grid-column:1/-1}" +
    ".mpr-row{display:grid;grid-template-columns:112px 1fr 84px;gap:8px;align-items:center;margin:7px 0;font-size:12.5px}" +
    ".mpr-row .nm{font-weight:800;color:#E2E8F0;white-space:nowrap}" +
    ".mpr-bar{position:relative;height:12px;border-radius:8px;background:rgba(255,255,255,.07);overflow:hidden}" +
    ".mpr-bar i{position:absolute;top:0;bottom:0;border-radius:8px;width:0;background:linear-gradient(90deg,#0EA5E9,#38BDF8,#A7F3D0);box-shadow:0 0 12px rgba(56,189,248,.7);transition:width 1.1s cubic-bezier(.2,.9,.25,1)}" +
    ".mpr-bar.t i{background:linear-gradient(90deg,#F59E0B,#F43F5E);box-shadow:0 0 12px rgba(244,63,94,.6)}" +
    ".mpr-row .vl{text-align:left;direction:ltr;font-weight:900;color:#fff;white-space:nowrap}" +
    ".mpr-sub{font-size:11px;color:#94A3B8;font-weight:600}" +
    ".mpr-reps{display:flex;flex-direction:column;gap:6px;margin-top:10px}" +
    ".mpr-rep{display:grid;grid-template-columns:38px 1fr auto auto;gap:10px;align-items:center;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);cursor:pointer;font-size:12.5px;transition:background .2s,transform .2s}" +
    ".mpr-rep:hover,.mpr-rep:active{background:rgba(56,189,248,.16);transform:scale(1.01)}" +
    ".mpr-rep .n{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:900;background:#0EA5E9;color:#031322;box-shadow:0 0 12px rgba(14,165,233,.8)}" +
    ".mpr-rep b{color:#fff}" +
    ".mpr-spark{width:100%;height:96px;display:block}" +
    ".mpr-spark .ln{fill:none;stroke:#38BDF8;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round;filter:drop-shadow(0 0 5px #38BDF8);stroke-dasharray:var(--len,2000);stroke-dashoffset:var(--len,2000);animation:mprDraw 2s ease-out .4s forwards}" +
    ".mpr-spark .dot{fill:#22C55E;filter:drop-shadow(0 0 6px #22C55E)}" +
    ".mpr-gauge{display:flex;gap:6px;margin-top:10px}" +
    ".mpr-gauge span{flex:1;height:14px;border-radius:7px;background:rgba(255,255,255,.08);transition:background .5s,box-shadow .5s}" +
    ".mpr-gauge span.on{box-shadow:0 0 14px currentColor}" +
    ".mpr-empty{padding:22px;text-align:center;color:#94A3B8;font-weight:700}" +
    ".mpr-foot{margin-top:12px;font-size:11.5px;color:#64748B;line-height:1.6}" +
    "@keyframes mprIn{to{opacity:1;transform:none}}" +
    "@keyframes mprUp{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}" +
    "@keyframes mprFade{from{opacity:0}to{opacity:1}}" +
    "@keyframes mprPulse{50%{transform:scale(1.5);opacity:.55}}" +
    "@keyframes mprSpin{to{--a:360deg}}" +
    "@keyframes mprDraw{to{stroke-dashoffset:0}}";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n0(v) { return Math.round(v); }
  function n1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function injectCss() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement("style"); s.id = CSS_ID; s.textContent = CSS; document.head.appendChild(s);
  }
  function ring(pct, tone, caption) {
    var r = 46, C = 2 * Math.PI * r;
    return '<svg viewBox="0 0 112 112"><circle class="tr" cx="56" cy="56" r="' + r + '" fill="none" stroke-width="10"/>' +
      '<circle class="fg" cx="56" cy="56" r="' + r + '" fill="none" stroke-width="10" transform="rotate(-90 56 56)" stroke-dasharray="' + C.toFixed(1) +
      '" stroke-dashoffset="' + C.toFixed(1) + '" data-to="' + (C * (1 - pct / 100)).toFixed(1) + '"/>' +
      '<text class="num" x="56" y="63" text-anchor="middle" data-count="' + n0(pct) + '" data-suf="٪">0٪</text></svg>';
  }
  function spark(P, reps) {
    var W = 320, H = 96, pad = 8, t = P.t, v = P.sm;
    var idx = []; v.forEach(function (x, i) { if (x != null) idx.push(i); });
    if (idx.length < 2) return "";
    var t0 = t[0], t1 = t[t.length - 1] || 1, vmin = Infinity, vmax = -Infinity;
    idx.forEach(function (i) { vmin = Math.min(vmin, v[i]); vmax = Math.max(vmax, v[i]); });
    var X = function (tt) { return pad + (tt - t0) / Math.max(0.001, t1 - t0) * (W - 2 * pad); };
    var Y = function (a) { return pad + (1 - (a - vmin) / Math.max(1, vmax - vmin)) * (H - 2 * pad); };
    var d = idx.map(function (i, k) { return (k ? "L" : "M") + X(t[i]).toFixed(1) + " " + Y(v[i]).toFixed(1); }).join(" ");
    var dots = (reps || []).map(function (r) { return '<circle class="dot" cx="' + X(r.tBottom).toFixed(1) + '" cy="' + Y(r.bottom).toFixed(1) + '" r="4.5"/>'; }).join("");
    return '<svg class="mpr-spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" data-t0="' + t0 + '" data-t1="' + t1 + '"><path class="ln" d="' + d + '" style="--len:' + Math.ceil(W * 3) + '"/>' + dots + "</svg>";
  }

  function build(S) {
    var h = "", d = 0, delay = function () { d += 0.09; return "--d:" + d.toFixed(2) + "s"; };
    if (!S.frames || S.frames < 3) return '<div class="mpr-empty">مفيش نتيجة تحليل لسه. دوس 🤖 تحليل الأول</div>';
    var R = S.reps, G = S.gravity, I = S.intensity;
    /* hero */
    h += '<div class="mpr-hero">';
    h += '<div class="mpr-card" style="' + delay() + '"><div class="mpr-h">🔁 ملخص العدّات</div>';
    if (R && R.count) {
      h += '<div class="mpr-big" data-count="' + R.count + '">0</div><div class="mpr-bigl">عدّة (' + esc(R.name) + ')</div><div class="mpr-kv">' +
        '<span class="mpr-chip">متوسط العدّة<b>' + n1(R.avgDur) + 'ث</b></span>' +
        '<span class="mpr-chip">نزول<b>' + n1(R.avgDown) + 'ث</b></span><span class="mpr-chip">طلوع<b>' + n1(R.avgUp) + 'ث</b></span>' +
        '<span class="mpr-chip">أعمق زاوية<b>' + n0(R.avgBottom) + '°</b></span>' +
        '<span class="mpr-chip">ثبات العدّات<b>' + n0(R.consistency) + '٪</b></span></div>';
    } else {
      h += '<div class="mpr-big">0</div><div class="mpr-bigl">مفيش عدّات واضحة</div><div class="mpr-note">الحركة في الفيديو صغيرة أو الجسم مش باين كفاية. جرّب فيديو من الجنب والجسم كله باين.</div>';
    }
    h += "</div>";
    h += '<div class="mpr-card mpr-tone-' + (G ? G.tone : "mid") + '" style="' + delay() + '"><div class="mpr-h">⚖️ خط الجاذبية</div>';
    if (G) {
      h += '<div class="mpr-ring">' + ring(G.insidePct, G.tone) + '<div><div class="mpr-lbl">' + G.label + '</div><div class="mpr-sub">مركز الثقل جوه قاعدة الرجلين في ' + n0(G.insidePct) + '٪ من الفيديو</div></div></div>' +
        '<div class="mpr-note">أبعد ميل: ' + n0(Math.abs(G.worst.off)) + '٪ من طول الجذع ' + (G.worst.off > 0 ? "لقدّام" : "لورا") + ' عند ' + n1(G.worst.t) + 'ث.</div>';
    } else h += '<div class="mpr-note">الرجلين مش باينين كفاية لحساب خط الجاذبية.</div>';
    h += "</div></div>";

    /* grid */
    h += '<div class="mpr-grid">';
    /* intensity */
    h += '<div class="mpr-card" style="' + delay() + '"><div class="mpr-h">🔥 شدة الحركة</div>';
    if (I) {
      var cols = ["#38BDF8", "#22C55E", "#FACC15", "#F43F5E"];
      h += '<div class="mpr-lbl" style="--c:' + cols[I.level] + '">' + I.label + '</div><div class="mpr-gauge">' +
        cols.map(function (c, i) { return '<span style="color:' + c + '" data-on="' + (i <= I.level ? 1 : 0) + '" data-bg="' + c + '"></span>'; }).join("") + "</div>" +
        '<div class="mpr-kv"><span class="mpr-chip">المتوسط<b>' + n1(I.avg) + '</b></span><span class="mpr-chip">القمة<b>' + n1(I.peak) + '</b></span></div>' +
        '<div class="mpr-note">السرعة بوحدة «طول الجذع في الثانية» عشان تتقارن بين الفيديوهات حتى لو الكاميرا بعيدة أو قريبة.</div>';
    } else h += '<div class="mpr-note">مفيش بيانات كفاية لحساب الشدة.</div>';
    h += "</div>";
    /* rep chart */
    h += '<div class="mpr-card" style="' + delay() + '"><div class="mpr-h">📈 منحنى ' + esc(S.primary ? S.primary.name : "الزاوية") + ' والعدّات</div>' +
      (S.primary ? spark(S.primary, R && R.list) : '<div class="mpr-note">مفيش منحنى.</div>') +
      '<div class="mpr-note">النقط الخضرا هي أعمق نقطة في كل عدّة. دوس على المنحنى للانتقال في الفيديو.</div></div>';
    /* angles */
    h += '<div class="mpr-card" style="' + delay() + '"><div class="mpr-h">📐 الزوايا (أقل / متوسط / أكبر)</div>';
    if (S.angles.length) {
      S.angles.forEach(function (a) {
        h += '<div class="mpr-row"><div class="nm">' + a.name + " " + SIDE[a.side] + '</div><div class="mpr-bar"><i data-l="' + (a.min / 180 * 100).toFixed(1) + '" data-w="' + ((a.max - a.min) / 180 * 100).toFixed(1) + '"></i></div><div class="vl">' + n0(a.min) + "–" + n0(a.max) + "°</div></div>";
      });
      h += '<div class="mpr-note">الشريط بيبين مدى الحركة من 0° لـ 180°. المتوسط: ' + S.angles.slice(0, 4).map(function (a) { return a.name + " " + SIDE[a.side] + " " + n0(a.avg) + "°"; }).join("، ") + "</div>";
    } else h += '<div class="mpr-note">المفاصل مش باينة كفاية.</div>';
    h += "</div>";
    /* torque */
    h += '<div class="mpr-card" style="' + delay() + '"><div class="mpr-h">🏋️ العزم على المفاصل (نسبي)</div>';
    if (S.torque.length) {
      var tmax = Math.max.apply(0, S.torque.map(function (q) { return q.peak; }));
      S.torque.slice().sort(function (a, b) { return b.peak - a.peak; }).forEach(function (q) {
        h += '<div class="mpr-row"><div class="nm">' + q.name + " " + SIDE[q.side] + '</div><div class="mpr-bar t"><i data-l="0" data-w="' + (q.peak / tmax * 100).toFixed(1) + '"></i></div><div class="vl">' + n0(q.peak) + '٪</div></div>';
      });
      var top = S.torque.reduce(function (m, q) { return q.peak > m.peak ? q : m; }, S.torque[0]);
      h += '<div class="mpr-note">أعلى حمل على ' + top.name + " " + SIDE[top.side] + " عند " + n1(top.peakT) + 'ث. العزم نسبي (ذراع العزم × وزن الجزء ÷ طول الجذع)، مش نيوتن متر، لأن وزن الجسم والحديد مش معروفين.</div>';
    } else h += '<div class="mpr-note">مفيش بيانات كفاية.</div>';
    h += "</div>";
    /* rep list */
    if (R && R.list.length) {
      h += '<div class="mpr-card mpr-wide" style="' + delay() + '"><div class="mpr-h">📋 تفاصيل كل عدّة (دوس للانتقال)</div><div class="mpr-reps">';
      R.list.forEach(function (r, i) {
        h += '<div class="mpr-rep" data-seek="' + r.tBottom.toFixed(2) + '"><span class="n">' + (i + 1) + '</span><span>من ' + n1(r.t0) + "ث لـ " + n1(r.t1) + 'ث</span><span>أعمق زاوية <b>' + n0(r.bottom) + '°</b></span><span>المدة <b>' + n1(r.dur) + 'ث</b></span></div>';
      });
      h += "</div></div>";
    }
    h += "</div>";
    h += '<div class="mpr-foot">الأرقام تقديرية من تحليل الفيديو على الجهاز، ومش بديل لتقييم المدرب. أفضل نتيجة بتيجي من فيديو جنبي والجسم كله باين.</div>';
    return h;
  }

  function animate(host) {
    var cnt = host.querySelectorAll("[data-count]");
    cnt.forEach(function (el) {
      var to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suf") || "", t0 = performance.now(), dur = 1200;
      (function tick(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e) + suf;
        if (k < 1) requestAnimationFrame(tick); else el.textContent = to + suf;
      })(t0);
    });
    setTimeout(function () {
      host.querySelectorAll(".fg").forEach(function (c) { c.setAttribute("stroke-dashoffset", c.getAttribute("data-to")); });
      host.querySelectorAll(".mpr-bar i").forEach(function (i) { i.style.insetInlineStart = i.getAttribute("data-l") + "%"; i.style.width = Math.max(2, +i.getAttribute("data-w")) + "%"; });
      host.querySelectorAll(".mpr-gauge span").forEach(function (s, k) {
        setTimeout(function () { if (s.getAttribute("data-on") === "1") { s.classList.add("on"); s.style.background = s.getAttribute("data-bg"); } }, k * 160);
      });
    }, 350);
  }

  function render(host, track, opts) {
    injectCss(); opts = opts || {};
    var S = summarize(track);
    host.classList.add("mpr");
    host.innerHTML = '<div class="mpr-top"><div class="mpr-title"><i></i>نتيجة التحليل</div>' + (opts.onClose ? '<button class="mpr-x" data-x>✕ قفل</button>' : "") + "</div>" + build(S);
    var x = host.querySelector("[data-x]"); if (x) x.onclick = opts.onClose;
    host.querySelectorAll("[data-seek]").forEach(function (el) { el.onclick = function () { if (opts.onSeek) opts.onSeek(+el.getAttribute("data-seek")); }; });
    var sp = host.querySelector(".mpr-spark");
    if (sp) sp.onpointerdown = function (e) {
      var r = sp.getBoundingClientRect(), k = (e.clientX - r.left) / r.width;
      if (opts.onSeek) opts.onSeek(+sp.getAttribute("data-t0") + (+sp.getAttribute("data-t1") - +sp.getAttribute("data-t0")) * Math.max(0, Math.min(1, k)));
    };
    animate(host);
    return S;
  }
  var sheet = null;
  function close() { if (sheet) { sheet.remove(); sheet = null; } }
  function open(track, opts) {
    close(); injectCss(); opts = opts || {};
    sheet = document.createElement("div"); sheet.className = "mpr-sheet";
    var box = document.createElement("div"); sheet.appendChild(box);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) close(); });
    document.body.appendChild(sheet);
    render(box, track, { onSeek: opts.onSeek, onClose: close });
    return summarize(track);
  }
  window.MofitPoseResults = { summarize: summarize, render: render, open: open, close: close };
})();
