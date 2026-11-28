/* ======================================================================
   MOFIT Form Lab (fl-*) — معمل الفورم
   Client (or coach with the client in the gym) films one set from the side.
   The existing on-device BlazePose engine (pose-auto.js, lazy-loaded) tracks
   the set; this file adds the lift-specific layer on top:
     - bar path (shoulder proxy for squat, wrist proxy for bench/deadlift/press)
     - MOFIT form score /100 from transparent per-lift checks
     - the coach "ghost": the coach marks any scan as the ideal reference for
       that lift; every later score is shown next to the ghost's numbers.
   Privacy/storage: the video never leaves the phone and is never uploaded.
   Only a small metrics row is saved in form_scans (formlab.sql), so the coach
   sees scores and numbers, not footage. Score is advisory (زاوية واحدة),
   never medical. Scoped: window.FormLab + window.viewFormLab + fl* only.
   ====================================================================== */
(function () {
  "use strict";

  /* ---------- tiny local helpers (fl prefix, no clashes) ---------- */
  const flEsc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const flN = (v, d) => (v == null || isNaN(v)) ? "—" : (d == null ? Math.round(v) : Math.round(v * 10 ** d) / 10 ** d);
  const flDate = s => { try { return new Date(s).toLocaleDateString("ar-EG", { day: "numeric", month: "long" }); } catch (e) { return (s || "").slice(0, 10); } };

  const FL_LIFTS = {
    /* exercise names stay English + translate="no" so browser auto-translate can't mangle them */
    squat:    { label: "Back Squat",     icon: "🏋", proxy: "shoulders", tempoPhase: "down", tempoRange: [2, 4],  joint: "الركبة" },
    deadlift: { label: "Deadlift",       icon: "⚙", proxy: "wrists",    tempoPhase: "up",   tempoRange: [1, 3],  joint: "الركبة" },
    bench:    { label: "Bench Press",    icon: "🛏", proxy: "wrists",    tempoPhase: "down", tempoRange: [1.5, 4], joint: "الكوع" },
    ohp:      { label: "Overhead Press", icon: "🙆", proxy: "wrists",    tempoPhase: "up",   tempoRange: [1, 3],  joint: "الكوع" },
    /* movement-pattern models: one detailed model per pattern, mapped to
       every library exercise of that pattern (see FL_MODEL_OF) */
    hpress:   { label: "ضغط أفقي",   icon: "🤜", proxy: "wrists",    tempoPhase: "down", tempoRange: [1.5, 4], joint: "الكوع" },
    vpress:   { label: "ضغط فوقي",   icon: "🙌", proxy: "wrists",    tempoPhase: "up",   tempoRange: [1, 3],  joint: "الكوع" },
    row:      { label: "سحب أفقي",   icon: "🚣", proxy: "wrists",    tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الكوع" },
    pulldown: { label: "سحب سفلي",   icon: "🧗", proxy: "wrists",    tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الكوع" },
    hinge:    { label: "هينج (مفصلة الحوض)", icon: "🦵", proxy: "wrists", tempoPhase: "down", tempoRange: [2, 4], joint: "الركبة" },
    lunge:    { label: "لانج / سبليت سكوات", icon: "🦶", proxy: "shoulders", tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الركبة" },
    curl:     { label: "كيرل (باي)", icon: "💪", proxy: "wrists", tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الكوع" },
    extend:   { label: "تراي (فرد)", icon: "🔱", proxy: "wrists", tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الكوع" },
    raise:    { label: "رفرفة / فلاي", icon: "🪽", proxy: "wrists", tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الكوع" },
    calf:     { label: "سمانة", icon: "🦵", proxy: "wrists", tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الركبة" },
    legmach:  { label: "ماكينة رجل", icon: "🦿", proxy: "wrists", tempoPhase: "down", tempoRange: [1.5, 3.5], joint: "الركبة" },
  };
  /* quick chips stay the original four big lifts (the full library picker
     below covers everything else) */
  const FL_QUICK = ["squat", "deadlift", "bench", "ohp"];
  /* canonical library exercise for each dedicated model */
  const FL_CANON = { squat: "BACK SQUAT", deadlift: "CONVENTIONAL DEADLIFT", bench: "FLAT BB BENCH PRESS", ohp: "STANDING OVERHEAD PRESS", hpress: "DB BENCH PRESS", vpress: "DB SHOULDER PRESS", row: "ONE-ARM DB ROW", pulldown: "LAT PULLDOWN", hinge: "ROMANIAN DEADLIFT", lunge: "BULGARIAN SPLIT SQUAT", curl: "DB CURL", extend: "CABLE TRICEPS PUSHDOWN", raise: "DB LATERAL RAISE", calf: "STANDING CALF RAISE", legmach: "LEG EXTENSION MACHINE" };
  /* exercises matching a dedicated model get the detailed checks; every other
     exercise gets the honest generic fallback, labelled approximate (تقريبي) */
  const FL_MODEL_OF = [
    [/^BACK SQUAT$/, "squat"],
    [/BB BENCH PRESS$/, "bench"],
    [/^CONVENTIONAL DEADLIFT$/, "deadlift"],
    [/^TRAP BAR DEADLIFT$/, "deadlift"],
    [/(?:^| )OVERHEAD PRESS$|MILITARY PRESS$/, "ohp"],
    /* exclusions that must NOT fall into a pattern below */
    [/^STRAIGHT-ARM PULLDOWN$/, "generic"],        /* arms stay extended: elbow-ROM checks don't apply */
    [/^DB PULLOVER$/, "generic"],
    /* lunge family first: SPLIT SQUAT/LUNGE names also contain SQUAT */
    [/SPLIT SQUAT|LUNGE$|LUNGE \(|STEP-UP$/, "lunge"],
    [/(?:^| )SQUAT$|SQUAT MACHINE/, "squat"],
    [/^PIKE PUSH-UP$/, "vpress"],
    /* horizontal press */
    [/PUSH-UP|^(FLAT|INCLINE) DB PRESS$|DB (BENCH|FLOOR) PRESS$|CHEST PRESS MACHINE$|^MACHINE CHEST PRESS$|^INCLINE PRESS MACHINE$/, "hpress"],
    /* vertical press */
    [/SHOULDER PRESS( MACHINE)?$|ARNOLD|^LANDMINE PRESS$|^PUSH PRESS$|^PIKE PUSH-UP$/, "vpress"],
    /* vertical pull */
    [/^PULL-UP|^CHIN-UP|WEIGHTED PULL-UP$|PULLDOWN( MACHINE)?$/, "pulldown"],
    /* horizontal pull */
    [/ROW$|ROW \(|ROW MACHINE$|^SA ISO LAT ROW MACHINE$/, "row"],
    /* hinge family */
    [/ROMANIAN DEADLIFT$|^STIFF-LEG DEADLIFT$|^GOOD MORNING/, "hinge"],
    /* batch 2: isolation patterns */
    [/^LEG CURL MACHINE|LEG CURL$|^NORDIC CURL/, "legmach"],   /* before biceps curl: LEG CURL ends in CURL */
    [/CURL$|CURL \(|^PREACHER CURL$/, "curl"],          /* biceps curls */
    [/FACE PULL$/, "row"],
    [/HIP EXTENSION|PULL-THROUGH$/, "hinge"],
    [/TRICEPS|SKULL CRUSHER/, "extend"],
    [/LATERAL RAISE|REAR DELT FLY|CABLE FLY$|COSTAL CABLE FLY$|PEC DECK/, "raise"],
    [/CALF RAISE/, "calf"],
    [/^LEG EXTENSION MACHINE|^LEG PRESS/, "legmach"],
  ];
  function flModelFor(ex) { const m = FL_MODEL_OF.find(([re]) => re.test(ex || "")); return m ? m[1] : "generic"; }
  const FL_GENERIC = { proxy: "wrists" };
  const flLiftOf = lift => FL_LIFTS[lift] || { label: lift, icon: "🎥" };
  const flEn = s => `<span translate="no" lang="en">${flEsc(s)}</span>`;

  /* ---------- landmark math (track frames: {t, lms:[[x,y,vis]x33]}, ar = w/h) ---------- */
  const MINV = 0.4;
  function flPt(lms, i, ar) {
    const p = lms[i]; if (!p) return null;
    const v = p[2] == null ? 1 : p[2]; if (v < MINV) return null;
    return { x: p[0] * ar, y: p[1] };
  }
  function flMid(a, b) { return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : (a || b || null); }
  function flAngle(A, B, C) {
    if (!A || !B || !C) return null;
    let d = Math.abs((Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x)) * 180 / Math.PI);
    return d > 180 ? 360 - d : d;
  }
  /* frame snapshot: the points every check needs, or null when the body is not clear */
  function flFrame(lms, ar) {
    const f = i => flPt(lms, i, ar);
    const sh = flMid(f(11), f(12)), hp = flMid(f(23), f(24));
    if (!sh || !hp) return null;
    const trunk = Math.hypot(sh.x - hp.x, sh.y - hp.y);
    if (trunk < 0.03) return null;
    const knee = flMid(f(25), f(26)), ankle = flMid(f(27), f(28)), elbow = flMid(f(13), f(14)), wrist = flMid(f(15), f(16));
    /* trunk tilt from vertical, degrees (0 = upright) */
    const tilt = Math.abs(Math.atan2(sh.x - hp.x, hp.y - sh.y) * 180 / Math.PI);
    return { sh, hp, knee, ankle, elbow, wrist, trunk, tilt };
  }
  function flProxy(F, lift) { return (FL_LIFTS[lift] || FL_GENERIC).proxy === "shoulders" ? F.sh : F.wrist; }
  /* per-frame snapshots for the whole track */
  function flFrames(track) {
    const ar = track.ar || 0.5625;
    return track.frames.map(fr => ({ t: fr.t, F: flFrame(fr.lms, ar), lms: fr.lms }));
  }
  /* stats helper */
  function flStat(a) {
    a = a.filter(v => v != null && isFinite(v));
    if (!a.length) return null;
    const s = a.reduce((x, y) => x + y, 0), avg = s / a.length;
    const sd = Math.sqrt(a.reduce((x, y) => x + (y - avg) * (y - avg), 0) / a.length);
    return { avg, sd, min: Math.min(...a), max: Math.max(...a), n: a.length };
  }

  /* reference trunk length: median over the clip, so per-frame foreshortening
     mid-rep does not distort normalized distances */
  function flRefTrunk(frames) {
    const ts = frames.map(f => f.F ? f.F.trunk : null).filter(v => v != null).sort((a, b) => a - b);
    return ts.length ? ts[Math.floor(ts.length / 2)] : 1;
  }

  /* bar path: proxy point per valid frame, x in reference trunk lengths (relative to median) */
  function flBarPath(frames, lift) {
    const rt = flRefTrunk(frames);
    const pts = [];
    frames.forEach(({ t, F }) => { if (!F) return; const p = flProxy(F, lift); if (p) pts.push({ t, x: p.x / rt, y: p.y / rt }); });
    if (pts.length < 6) return null;
    const xs = pts.map(p => p.x).sort((a, b) => a - b);
    const med = xs[Math.floor(xs.length / 2)];
    pts.forEach(p => p.dx = p.x - med);
    const drift = Math.max(...pts.map(p => Math.abs(p.dx)));
    return { pts, drift };
  }

  /* rep windows from pose-results summary; fall back to the whole clip */
  function flRepFrames(frames, reps) {
    if (reps && reps.list && reps.list.length) {
      return reps.list.map(r => frames.filter(f => f.t >= r.t0 - 0.05 && f.t <= r.t1 + 0.05));
    }
    return frames.length ? [frames] : [];
  }

  /* ---------- the per-lift checks ----------
     Every check returns { k, label, val, tone:"ok"|"mid"|"bad", pts, tip }
     pts = deduction out of 100. Thresholds are coaching heuristics for a
     side-view video, shown openly to the user; the score is advisory. */
  function flCheck(label, val, tone, pts, tip) { return { label, val, tone, pts: tone === "ok" ? 0 : pts, tip: tip || "" }; }

  function flChecksSquat(frames, reps, summary) {
    const out = [];
    const lists = flRepFrames(frames, reps);
    /* 1) depth: hip crease below the knee at the bottom of each rep (y grows downward) */
    let pass = 0, tot = 0;
    (reps && reps.list ? reps.list : []).forEach(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.tBottom) < Math.abs((b ? b.t : 1e9) - r.tBottom) ? f : b, null);
      if (!fr || !fr.F || !fr.F.knee) return;
      tot++; if (fr.F.hp.y > fr.F.knee.y + 0.005) pass++;
    });
    if (tot) {
      const pct = pass / tot * 100;
      out.push(flCheck("العمق", pass + " من " + tot + " عدات تحت الركبة", pct >= 99 ? "ok" : pct >= 60 ? "mid" : "bad", 16, pct >= 99 ? "" : "انزل لحد ما الحوض يعدّي مستوى الركبة"));
    } else out.push(flCheck("العمق", "متحددش", "mid", 6, "صوّر من الجنب والجسم كامل عشان العمق يتقاس"));
    /* 2) bar path verticality */
    const bp = flBarPath(frames, "squat");
    if (bp) out.push(flCheck("مسار البار", "انحراف " + flN(bp.drift * 100) + "٪ من طول الجذع", bp.drift < 0.14 ? "ok" : bp.drift < 0.24 ? "mid" : "bad", 12, bp.drift < 0.14 ? "" : "خلي البار طالع ونازل في خط واحد فوق نص القدم"));
    /* 3) trunk lean at the bottom */
    const bottomTilts = (reps && reps.list ? reps.list : []).map(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.tBottom) < Math.abs((b ? b.t : 1e9) - r.tBottom) ? f : b, null);
      return fr && fr.F ? fr.F.tilt : null;
    }).filter(v => v != null);
    const tl = flStat(bottomTilts);
    if (tl) out.push(flCheck("ميل الجذع", flN(tl.avg) + "° عند النزول", tl.avg < 30 ? "ok" : tl.avg < 45 ? "mid" : "bad", 12, tl.avg < 30 ? "" : "حافظ على صدرك مرفوع وضهرك ثابت"));
    /* 4) tempo (negative phase) */
    if (reps && reps.avgDown != null) {
      const d = reps.avgDown;
      out.push(flCheck("سرعة النزول", flN(d, 1) + " ثانية", d >= 2 && d <= 4 ? "ok" : (d >= 1 && d < 2) || (d > 4 && d <= 5) ? "mid" : "bad", 6, d < 2 ? "انزل بتحكم ٢-٣ ثواني" : ""));
    }
    /* 5) left/right symmetry from knee ROM */
    const k0 = (summary.angles || []).find(a => a.name === "الركبة" && a.side === 0), k1 = (summary.angles || []).find(a => a.name === "الركبة" && a.side === 1);
    if (k0 && k1) {
      const diff = Math.abs(k0.rom - k1.rom);
      out.push(flCheck("الاتزان يمين/شمال", "فرق " + flN(diff) + "°", diff < 8 ? "ok" : diff < 15 ? "mid" : "bad", 8, diff < 8 ? "" : "في فرق بين الناحيتين — ركّز على دفع متساوي"));
    }
    /* 6) heel stability through the reps */
    const rt = flRefTrunk(frames);
    const all = lists.flat(); const ay = flStat(all.map(f => f.F && f.F.ankle ? f.F.ankle.y / rt : null));
    if (ay && ay.n >= 6) {
      const rng = ay.max - ay.min;
      out.push(flCheck("ثبات الكعب", "حركة " + flN(rng * 100) + "٪", rng < 0.05 ? "ok" : rng < 0.10 ? "mid" : "bad", 8, rng < 0.05 ? "" : "الكعب بيتحرك — ثبّت وزنك على نص القدم"));
    }
    return out;
  }

  function flChecksDeadlift(frames, reps) {
    const out = [];
    /* 1) bar stays close: wrist horizontal offset from the ankle line */
    const rt = flRefTrunk(frames);
    const offs = frames.map(f => (f.F && f.F.wrist && f.F.ankle) ? Math.abs(f.F.wrist.x - f.F.ankle.x) / rt : null);
    const oc = flStat(offs);
    if (oc) out.push(flCheck("البار قريب من الجسم", "متوسط بعد " + flN(oc.avg * 100) + "٪", oc.avg < 0.12 ? "ok" : oc.avg < 0.20 ? "mid" : "bad", 14, oc.avg < 0.12 ? "" : "خلي البار لازق في السمانة طول السحب"));
    /* 2) hips shooting up early: hip rise speed vs shoulder rise speed in the first third of the pull */
    let early = 0, tot = 0;
    (reps && reps.list ? reps.list : []).forEach(r => {
      const span = frames.filter(f => f.t >= r.tBottom && f.t <= r.t1 && f.F);
      if (span.length < 4) return;
      const third = span.slice(0, Math.max(2, Math.ceil(span.length / 3)));
      const hipV = (third[third.length - 1].F.hp.y - third[0].F.hp.y);
      const shV = (third[third.length - 1].F.sh.y - third[0].F.sh.y);
      if (Math.abs(shV) < 1e-4) return;
      tot++; if (hipV / shV > 1.35) early++;
    });
    if (tot) out.push(flCheck("الحوض والكتف مع بعض", early ? early + " من " + tot + " عدات الحوض طلع الأول" : "متزامن", early === 0 ? "ok" : early <= tot / 2 ? "mid" : "bad", 14, early ? "ادفع بالرجل وشيل الصدر مع بعض — متخليش الحوض يطير" : ""));
    /* 3) back angle stability: trunk tilt at lift-off vs mid-pull */
    const changes = (reps && reps.list ? reps.list : []).map(r => {
      const span = frames.filter(f => f.t >= r.tBottom && f.t <= r.t1 && f.F);
      if (span.length < 3) return null;
      return Math.abs(span[Math.floor(span.length / 2)].F.tilt - span[0].F.tilt);
    }).filter(v => v != null);
    const bc = flStat(changes);
    if (bc) out.push(flCheck("ثبات الضهر", "تغيّر " + flN(bc.avg) + "° أثناء السحب", bc.avg < 8 ? "ok" : bc.avg < 15 ? "mid" : "bad", 16, bc.avg < 8 ? "" : "شد جسمك قبل السحب وخلي الضهر ثابت"));
    /* 4) lockout: hip angle at the top */
    const locks = (reps && reps.list ? reps.list : []).map(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.t1) < Math.abs((b ? b.t : 1e9) - r.t1) ? f : b, null);
      if (!fr || !fr.F) return null;
      return flAngle(fr.F.sh, fr.F.hp, fr.F.knee);
    }).filter(v => v != null);
    const lk = flStat(locks);
    if (lk) out.push(flCheck("القفلة فوق", flN(lk.avg) + "°", lk.avg >= 165 ? "ok" : lk.avg >= 150 ? "mid" : "bad", 8, lk.avg >= 165 ? "" : "اقفل الحوض كامل في آخر العدة"));
    /* 5) path drift */
    const bp = flBarPath(frames, "deadlift");
    if (bp) out.push(flCheck("مسار البار", "انحراف " + flN(bp.drift * 100) + "٪", bp.drift < 0.12 ? "ok" : bp.drift < 0.22 ? "mid" : "bad", 8, ""));
    return out;
  }

  function flChecksBench(frames, reps) {
    const out = [];
    /* 1) elbow flare: shoulder angle (hip-shoulder-elbow) at the bottom */
    const flares = (reps && reps.list ? reps.list : []).map(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.tBottom) < Math.abs((b ? b.t : 1e9) - r.tBottom) ? f : b, null);
      if (!fr || !fr.F || !fr.F.elbow) return null;
      return flAngle(fr.F.hp, fr.F.sh, fr.F.elbow);
    }).filter(v => v != null);
    const fa = flStat(flares);
    if (fa) out.push(flCheck("زاوية الكوع", flN(fa.avg) + "° من الجسم", fa.avg >= 40 && fa.avg <= 75 ? "ok" : fa.avg > 75 && fa.avg <= 85 ? "mid" : "bad", 14, fa.avg > 75 ? "قلّل فتحة الكوع شوية (٤٥-٧٠°) لحماية الكتف" : ""));
    /* 2) bar path */
    const bp = flBarPath(frames, "bench");
    if (bp) out.push(flCheck("مسار البار", "انحراف " + flN(bp.drift * 100) + "٪", bp.drift < 0.15 ? "ok" : bp.drift < 0.25 ? "mid" : "bad", 12, bp.drift < 0.15 ? "" : "البار بيتحرك قدّام/ورا كتير — نزّله لنص الصدر وادفع لأعلى ورا شوية"));
    /* 3) touch consistency */
    const rt = flRefTrunk(frames);
    const bottoms = (reps && reps.list ? reps.list : []).map(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.tBottom) < Math.abs((b ? b.t : 1e9) - r.tBottom) ? f : b, null);
      return fr && fr.F && fr.F.wrist ? fr.F.wrist.y / rt : null;
    }).filter(v => v != null);
    const tc = flStat(bottoms);
    if (tc && tc.n >= 2) out.push(flCheck("ثبات نقطة النزول", "تباين " + flN(tc.sd * 100, 1) + "٪", tc.sd < 0.03 ? "ok" : tc.sd < 0.06 ? "mid" : "bad", 8, tc.sd < 0.03 ? "" : "نزّل البار لنفس النقطة في كل عدة"));
    /* 4) tempo */
    if (reps && reps.avgDown != null) {
      const d = reps.avgDown;
      out.push(flCheck("سرعة النزول", flN(d, 1) + " ثانية", d >= 1.5 && d <= 4 ? "ok" : d >= 1 ? "mid" : "bad", 6, d < 1.5 ? "متقعش بالبار على الصدر — نزول متحكم" : ""));
    }
    return out;
  }

  function flChecksOhp(frames, reps) {
    const out = [];
    /* 1) lean back */
    const leans = frames.map(f => f.F ? f.F.tilt : null);
    const ln = flStat(leans);
    if (ln) out.push(flCheck("استقامة الجسم", "أقصى ميل " + flN(ln.max) + "°", ln.max < 12 ? "ok" : ln.max < 20 ? "mid" : "bad", 14, ln.max < 12 ? "" : "شد البطن والأرداف ومتمايلش لورا مع الضغط"));
    /* 2) lockout: elbow angle at the top */
    const locks = (reps && reps.list ? reps.list : []).map(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.t1) < Math.abs((b ? b.t : 1e9) - r.t1) ? f : b, null);
      if (!fr || !fr.F || !fr.F.elbow) return null;
      return flAngle(fr.F.sh, fr.F.elbow, fr.F.wrist);
    }).filter(v => v != null);
    const lk = flStat(locks);
    if (lk) out.push(flCheck("فرد الذراع فوق", flN(lk.avg) + "°", lk.avg >= 160 ? "ok" : lk.avg >= 145 ? "mid" : "bad", 10, lk.avg >= 160 ? "" : "افرد الذراع كامل في آخر العدة"));
    /* 3) bar path */
    const bp = flBarPath(frames, "ohp");
    if (bp) out.push(flCheck("مسار البار", "انحراف " + flN(bp.drift * 100) + "٪", bp.drift < 0.15 ? "ok" : bp.drift < 0.25 ? "mid" : "bad", 10, bp.drift < 0.15 ? "" : "خلّي البار قريب من وشك في أول الضغط"));
    /* 4) tempo */
    if (reps && reps.avgUp != null) {
      const u = reps.avgUp;
      out.push(flCheck("سرعة الضغط", flN(u, 1) + " ثانية", u >= 1 && u <= 3 ? "ok" : u < 4 ? "mid" : "bad", 6, ""));
    }
    return out;
  }

  /* -------- pattern models: one detailed model per movement pattern, mapped
     to every library exercise of that pattern. Each ends with an explicit
     limits line (what a single side-view video cannot measure), tone "ok"
     so it never deducts points. -------- */

  /* horizontal press family: DB/machine bench variants, floor press, push-ups */
  function flChecksHPress(frames, reps) {
    const out = flChecksBench(frames, reps);
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: فرق اليمين عن الشمال ولا اتجاه الكوع من قدّام — لو حابب، صوّر جولة أمامية كمان"));
    return out;
  }

  /* vertical press family: DB/machine shoulder press, arnold, landmine, pike */
  function flChecksVPress(frames, reps) {
    const out = flChecksOhp(frames, reps);
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: فرق اليمين عن الشمال — في الدمبل ممكن دراع تطلع أسرع من التانية من غير ما يبين"));
    return out;
  }

  /* horizontal pull family: rows of all kinds */
  function flChecksRow(frames, reps) {
    const out = [];
    /* 1) trunk stability: the pull should move the arm, not rock the torso */
    const tl = flStat(frames.map(f => f.F ? f.F.tilt : null));
    if (tl) out.push(flCheck("ثبات الجذع", "تذبذب ±" + flN(tl.sd) + "°", tl.sd < 5 ? "ok" : tl.sd < 10 ? "mid" : "bad", 14, tl.sd < 5 ? "" : "الجسم بيهتز مع السحب — اسحب بالدراع وثبّت ضهرك"));
    /* 2) elbow ROM per rep: a full pull swings the elbow through a big angle */
    const roms = (reps && reps.list ? reps.list : []).map(r => {
      const span = frames.filter(f => f.t >= r.t0 - 0.05 && f.t <= r.t1 + 0.05 && f.F && f.F.elbow && f.F.wrist);
      const angs = span.map(f => flAngle(f.F.sh, f.F.elbow, f.F.wrist)).filter(v => v != null);
      return angs.length >= 3 ? Math.max(...angs) - Math.min(...angs) : null;
    }).filter(v => v != null);
    const er = flStat(roms);
    if (er) out.push(flCheck("مدى السحب", flN(er.avg) + "° في العدة", er.avg >= 55 ? "ok" : er.avg >= 35 ? "mid" : "bad", 12, er.avg >= 55 ? "" : "وسّع السحبة — الكوع يعدّي مستوى الضهر ويرجع بفرد شبه كامل"));
    /* 3) path consistency */
    const bp = flBarPath(frames, "row");
    if (bp) out.push(flCheck("ثبات المسار", "انحراف " + flN(bp.drift * 100) + "٪", bp.drift < 0.16 ? "ok" : bp.drift < 0.28 ? "mid" : "bad", 8, bp.drift < 0.16 ? "" : "اسحب لنفس النقطة كل عدة — ناحية السرّة تقريبًا"));
    /* 4) eccentric control */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في الرجوع", flN(d, 1) + " ثانية", d >= 1.5 && d <= 3.5 ? "ok" : d >= 1 ? "mid" : "bad", 6, d < 1.5 ? "ارجع بالوزن بتحكم — متسيبوش يشدّك" : "")); }
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: شدّ لوح الكتف ولا قبضة اليد — ركّز إن الكوع يعدّي الجسم من غير ما الكتف يتقلّب لقدّام"));
    return out;
  }

  /* vertical pull family: pulldowns, pull-ups, chin-ups */
  function flChecksPulldown(frames, reps) {
    const out = [];
    /* 1) pull depth: elbow angle at the end of each pull (full pull = small angle) */
    const mins = (reps && reps.list ? reps.list : []).map(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.tBottom) < Math.abs((b ? b.t : 1e9) - r.tBottom) ? f : b, null);
      if (!fr || !fr.F || !fr.F.elbow || !fr.F.wrist) return null;
      return flAngle(fr.F.sh, fr.F.elbow, fr.F.wrist);
    }).filter(v => v != null);
    const pm = flStat(mins);
    if (pm) out.push(flCheck("عمق السحب", flN(pm.avg) + "° في آخر السحبة", pm.avg <= 95 ? "ok" : pm.avg <= 115 ? "mid" : "bad", 14, pm.avg <= 95 ? "" : "اسحب لحد مستوى الصدر/الذقن — مش نص الطريق"));
    /* 2) swing: trunk tilt range over the set */
    const tl = flStat(frames.map(f => f.F ? f.F.tilt : null));
    if (tl) { const rng = tl.max - tl.min; out.push(flCheck("ثبات الجسم", "تأرجح " + flN(rng) + "°", rng < 12 ? "ok" : rng < 20 ? "mid" : "bad", 12, rng < 12 ? "" : "متتأرجحش بالجسم — السحب بالظهر مش بالهزّة")); }
    /* 3) eccentric control */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في الرجوع", flN(d, 1) + " ثانية", d >= 1.5 && d <= 3.5 ? "ok" : d >= 1 ? "mid" : "bad", 6, d < 1.5 ? "ارجع بتحكم — الإيجابي نص التمرين" : "")); }
    /* 4) rep consistency */
    if (reps && reps.consistency != null) { const c = reps.consistency; out.push(flCheck("ثبات العدات", flN(c) + "٪", c >= 80 ? "ok" : c >= 60 ? "mid" : "bad", 8, c >= 80 ? "" : "خلّي كل عدة بنفس المدى")); }
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: عرض القبضة ولا اتجاه الكوع قدّام/ورا — اختار قبضة مريحة وثبّتها"));
    return out;
  }

  /* hinge family: RDL, stiff-leg deadlift, good morning */
  function flChecksHinge(frames, reps) {
    const out = [];
    /* 1) it IS a hinge: knee angle stays nearly constant while the trunk tilts */
    const all = frames.filter(f => f.F && f.F.knee && f.F.ankle);
    const ks = flStat(all.map(f => flAngle(f.F.hp, f.F.knee, f.F.ankle)));
    const tl = flStat(all.map(f => f.F.tilt));
    if (ks && tl) {
      const kneeRng = ks.max - ks.min, tiltRng = tl.max - tl.min;
      const hinging = kneeRng < 25 && tiltRng > 30;
      out.push(flCheck("الحركة من الحوض", "ركبة ±" + flN(kneeRng) + "° · جذع " + flN(tiltRng) + "°", hinging ? "ok" : kneeRng < 40 && tiltRng > 20 ? "mid" : "bad", 14, hinging ? "" : "الركبة بتنزل كتير — خليها شبه ثابتة وادفع الحوض لورا"));
    }
    /* 2) weight stays close: wrist-to-ankle horizontal offset */
    const rt = flRefTrunk(frames);
    const offs = frames.map(f => (f.F && f.F.wrist && f.F.ankle) ? Math.abs(f.F.wrist.x - f.F.ankle.x) / rt : null);
    const oc = flStat(offs);
    if (oc) out.push(flCheck("الوزن قريب من الجسم", "متوسط بعد " + flN(oc.avg * 100) + "٪", oc.avg < 0.12 ? "ok" : oc.avg < 0.20 ? "mid" : "bad", 12, oc.avg < 0.12 ? "" : "خلي الوزن لازق في الرجل طول النزول"));
    /* 3) eccentric control */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في النزول", flN(d, 1) + " ثانية", d >= 2 && d <= 4 ? "ok" : d >= 1.2 ? "mid" : "bad", 6, d < 2 ? "انزل بتحكم وانت حاسس بشد الخلفية" : "")); }
    /* 4) back stability through the pull (reuse the deadlift rule) */
    const changes = (reps && reps.list ? reps.list : []).map(r => {
      const span = frames.filter(f => f.t >= r.tBottom && f.t <= r.t1 && f.F);
      if (span.length < 3) return null;
      return Math.abs(span[Math.floor(span.length / 2)].F.tilt - span[0].F.tilt);
    }).filter(v => v != null);
    const bc = flStat(changes);
    if (bc) out.push(flCheck("ثبات الضهر", "تغيّر " + flN(bc.avg) + "° أثناء الرجوع", bc.avg < 8 ? "ok" : bc.avg < 15 ? "mid" : "bad", 14, bc.avg < 8 ? "" : "شد جسمك وخلي الضهر ثابت من أول لآخر العدة"));
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: دوران الحوض جانبيًا ولا فرق الرجلين — في السينجل ليج صوّر الناحيتين لو تقدر"));
    return out;
  }

  /* lunge / split-squat family */
  function flChecksLunge(frames, reps) {
    const out = [];
    /* 1) depth: front knee angle at the bottom of each rep */
    const bottoms = (reps && reps.list ? reps.list : []).map(r => {
      const fr = frames.reduce((b, f) => Math.abs(f.t - r.tBottom) < Math.abs((b ? b.t : 1e9) - r.tBottom) ? f : b, null);
      if (!fr || !fr.F || !fr.F.knee || !fr.F.ankle) return null;
      return flAngle(fr.F.hp, fr.F.knee, fr.F.ankle);
    }).filter(v => v != null);
    const dp = flStat(bottoms);
    if (dp) out.push(flCheck("العمق", flN(dp.avg) + "° عند النزول", dp.avg <= 100 ? "ok" : dp.avg <= 120 ? "mid" : "bad", 14, dp.avg <= 100 ? "" : "انزل أعمق — الركبة الخلفية تقرب من الأرض"));
    /* 2) torso stays upright */
    const tl = flStat(frames.map(f => f.F ? f.F.tilt : null));
    if (tl) out.push(flCheck("استقامة الجذع", "متوسط ميل " + flN(tl.avg) + "°", tl.avg < 15 ? "ok" : tl.avg < 25 ? "mid" : "bad", 12, tl.avg < 15 ? "" : "ارفع صدرك — الميل لقدّام بيحمّل على الركبة الأمامية"));
    /* 3) tempo */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("سرعة النزول", flN(d, 1) + " ثانية", d >= 1.5 && d <= 3.5 ? "ok" : d >= 1 ? "mid" : "bad", 6, d < 1.5 ? "انزل بتحكم — متقعش في العدة" : "")); }
    /* 4) rep consistency */
    if (reps && reps.consistency != null) { const c = reps.consistency; out.push(flCheck("ثبات العدات", flN(c) + "٪", c >= 80 ? "ok" : c >= 60 ? "mid" : "bad", 8, c >= 80 ? "" : "خلّي كل عدة بنفس العمق والسرعة")); }
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: الركبة بتلف لجوه ولا لبره (محتاج تصوير أمامي) — ركّز إن الركبة في اتجاه صوابع القدم"));
    return out;
  }


  /* curl family: elbow stays pinned, only the forearm moves */
  function flChecksCurl(frames, reps) {
    const out = [];
    /* 1) elbow drift: shoulder->elbow point should stay almost still */
    const rt = flRefTrunk(frames);
    const ex = flStat(frames.map(f => (f.F && f.F.elbow) ? f.F.elbow.x / rt : null));
    if (ex) { const rng = ex.max - ex.min; out.push(flCheck("الكوع ثابت", "حركة " + flN(rng * 100) + "٪", rng < 0.06 ? "ok" : rng < 0.12 ? "mid" : "bad", 14, rng < 0.06 ? "" : "الكوع بيمشي لقدّام مع الكيرل — ثبّته جنب جسمك")); }
    /* 2) ROM per rep */
    const roms = (reps && reps.list ? reps.list : []).map(r => {
      const span = frames.filter(f => f.t >= r.t0 - 0.05 && f.t <= r.t1 + 0.05 && f.F && f.F.elbow && f.F.wrist);
      const angs = span.map(f => flAngle(f.F.sh, f.F.elbow, f.F.wrist)).filter(v => v != null);
      return angs.length >= 3 ? Math.max(...angs) - Math.min(...angs) : null;
    }).filter(v => v != null);
    const er = flStat(roms);
    if (er) out.push(flCheck("مدى الحركة", flN(er.avg) + "° في العدة", er.avg >= 80 ? "ok" : er.avg >= 50 ? "mid" : "bad", 12, er.avg >= 80 ? "" : "افرد الذراع تحت خالص واقبض لفوق — مدى كامل"));
    /* 3) trunk rock */
    const tl = flStat(frames.map(f => f.F ? f.F.tilt : null));
    if (tl) out.push(flCheck("ثبات الجسم", "تذبذب ±" + flN(tl.sd) + "°", tl.sd < 5 ? "ok" : tl.sd < 10 ? "mid" : "bad", 10, tl.sd < 5 ? "" : "الجسم بيهز مع العدة — قلّل الوزن أو ثبّت ضهرك"));
    /* 4) eccentric */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في النزول", flN(d, 1) + " ثانية", d >= 1.5 ? "ok" : d >= 1 ? "mid" : "bad", 6, d >= 1.5 ? "" : "انزل بتحكم — النزول بيبني العضلة")); }
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: فرق اليمين عن الشمال ولا لفّ الرسغ — لو دراع أضعف من التانية صوّرها لوحدها"));
    return out;
  }

  /* triceps extension family: pushdowns, overhead extensions, skull crushers */
  function flChecksExtend(frames, reps) {
    const out = flChecksCurl(frames, reps); /* same physics: pinned elbow, ROM, sway, eccentric */
    out[0] = (function(){ const c = out[0]; return flCheck("الكوع ثابت", c.val, c.tone, 14, c.tone === "ok" ? "" : "الكوع بيتحرك مع العدة — ثبّته وخلّي الحركة من الساعد بس"); })();
    out[out.length - 1] = flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: اتجاه الكوع لبره/لجوه — خليه ثابت قريب من جسمك");
    return out;
  }

  /* lateral raise / fly family */
  function flChecksRaise(frames, reps) {
    const out = [];
    /* 1) raise height: wrist-shoulder angle from the body line at the top */
    const tops = (reps && reps.list ? reps.list : []).map(r => {
      const span = frames.filter(f => f.t >= r.t0 - 0.05 && f.t <= r.t1 + 0.05 && f.F && f.F.wrist);
      if (!span.length) return null;
      const fr = span.reduce((b, f) => f.F.wrist.y < b.F.wrist.y ? f : b, span[0]);
      return flAngle(fr.F.hp, fr.F.sh, fr.F.wrist);
    }).filter(v => v != null);
    const ra = flStat(tops);
    if (ra) out.push(flCheck("ارتفاع الرفعة", flN(ra.avg) + "° من الجسم", ra.avg >= 60 && ra.avg <= 100 ? "ok" : ra.avg >= 45 ? "mid" : "bad", 12, ra.avg < 60 ? "ارفع لمستوى الكتف تقريبًا" : ra.avg > 100 ? "متطلعش فوق مستوى الكتف بكتير" : ""));
    /* 2) trunk sway */
    const tl = flStat(frames.map(f => f.F ? f.F.tilt : null));
    if (tl) out.push(flCheck("ثبات الجسم", "تذبذب ±" + flN(tl.sd) + "°", tl.sd < 5 ? "ok" : tl.sd < 10 ? "mid" : "bad", 12, tl.sd < 5 ? "" : "الجسم بيهتز مع الرفعة — وزن أخف وتحكم أكتر"));
    /* 3) eccentric */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في النزول", flN(d, 1) + " ثانية", d >= 1.5 ? "ok" : d >= 1 ? "mid" : "bad", 6, d >= 1.5 ? "" : "انزل بتحكم — متسيبش الوزن يقع")); }
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس بدقة: مسار الذراع من قدّام — الرفعة الجانبية بتتشاف أوضح من الكاميرا الأمامية"));
    return out;
  }

  /* calf raise family: ankle ROM, control, full range */
  function flChecksCalf(frames, reps) {
    const out = [];
    /* 1) ankle travel per rep (vertical movement range, normalized) */
    const rt = flRefTrunk(frames);
    const travels = (reps && reps.list ? reps.list : []).map(r => {
      const span = frames.filter(f => f.t >= r.t0 - 0.05 && f.t <= r.t1 + 0.05 && f.F && f.F.ankle);
      const ys = span.map(f => f.F.ankle.y / rt);
      return ys.length >= 3 ? Math.max(...ys) - Math.min(...ys) : null;
    }).filter(v => v != null);
    const tr = flStat(travels);
    if (tr) out.push(flCheck("مدى الحركة", flN(tr.avg * 100) + "٪ من طول الجذع", tr.avg >= 0.10 ? "ok" : tr.avg >= 0.06 ? "mid" : "bad", 14, tr.avg >= 0.10 ? "" : "اطلع على صوابعك لأعلى نقطة وانزل لمدى كامل"));
    /* 2) tempo: calves love control, not bouncing */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم", flN(d, 1) + " ثانية نزول", d >= 1.5 ? "ok" : d >= 0.9 ? "mid" : "bad", 10, d >= 1.5 ? "" : "متعملهاش نطّة — نزول بطيء ووقفة لحظة تحت")); }
    /* 3) rep consistency */
    if (reps && reps.consistency != null) { const c = reps.consistency; out.push(flCheck("ثبات العدات", flN(c) + "٪", c >= 80 ? "ok" : c >= 60 ? "mid" : "bad", 8, c >= 80 ? "" : "خلّي كل عدة بنفس المدى")); }
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: الوقفة في أعلى نقطة بدقة الكسر من الثانية — حاول تثبت لحظة فوق قبل النزول"));
    return out;
  }

  /* leg machine family: leg extension, leg curl, leg press (knee-driven ROM) */
  function flChecksLegMach(frames, reps) {
    const out = [];
    /* 1) knee ROM per rep */
    const roms = (reps && reps.list ? reps.list : []).map(r => {
      const span = frames.filter(f => f.t >= r.t0 - 0.05 && f.t <= r.t1 + 0.05 && f.F && f.F.knee && f.F.ankle);
      const angs = span.map(f => flAngle(f.F.hp, f.F.knee, f.F.ankle)).filter(v => v != null);
      return angs.length >= 3 ? Math.max(...angs) - Math.min(...angs) : null;
    }).filter(v => v != null);
    const er = flStat(roms);
    if (er) out.push(flCheck("مدى الحركة", flN(er.avg) + "° في العدة", er.avg >= 60 ? "ok" : er.avg >= 40 ? "mid" : "bad", 14, er.avg >= 60 ? "" : "وسّع المدى — فرد/ثني كامل بتحكم"));
    /* 2) control: no swinging */
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في الرجوع", flN(d, 1) + " ثانية", d >= 1.5 ? "ok" : d >= 0.9 ? "mid" : "bad", 10, d >= 1.5 ? "" : "ارجع بالوزن بتحكم — مترميش الفيم")); }
    /* 3) consistency */
    if (reps && reps.consistency != null) { const c = reps.consistency; out.push(flCheck("ثبات العدات", flN(c) + "٪", c >= 80 ? "ok" : c >= 60 ? "mid" : "bad", 8, c >= 80 ? "" : "خلّي كل عدة بنفس المدى والسرعة")); }
    out.push(flCheck("ℹ️ حدود القياس", "من فيديو جانبي واحد", "ok", 0, "مش بيتقاس: ضبط الكرسي/الظهر في الماكينة — ظبطها بحيث الركبة على محور الحركة"));
    return out;
  }

  /* generic fallback for every exercise without a dedicated model:
     honest whole-movement metrics only — reps, tempo, consistency, ROM,
     trunk stability, path, balance. Score is capped and labelled تقريبي. */
  function flChecksGeneric(frames, reps, summary) {
    const out = [];
    if (reps && reps.count) {
      out.push(flCheck("العدات والإيقاع", reps.count + " عدة · نزول " + flN(reps.avgDown, 1) + " ث · طلوع " + flN(reps.avgUp, 1) + " ث", "ok", 0, ""));
      if (reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في النزول", flN(d, 1) + " ثانية", d >= 1.5 ? "ok" : d >= 0.9 ? "mid" : "bad", 8, d >= 1.5 ? "" : "نزّل بتحكم — حوالي ثانية ونص لـ ٣ ثواني")); }
      if (reps.consistency != null) { const c = reps.consistency; out.push(flCheck("ثبات العدات", flN(c) + "٪", c >= 80 ? "ok" : c >= 60 ? "mid" : "bad", 8, c >= 80 ? "" : "خلّي كل عدة بنفس المدى والسرعة")); }
    } else out.push(flCheck("العدات", "متحددش", "mid", 6, "صوّر من الجنب والجسم كامل عشان العدات تتعد"));
    if (reps && reps.rom) { const r = reps.rom; out.push(flCheck("مدى الحركة", flN(r) + "° (" + reps.name + ")", r >= 60 ? "ok" : r >= 35 ? "mid" : "bad", 6, r >= 35 ? "" : "مدى الحركة صغير — وسّع الحركة بتحكم لو ده مش جزء من التمرين")); }
    const tl = flStat(frames.map(f => f.F ? f.F.tilt : null));
    if (tl) out.push(flCheck("ثبات الجذع", "تذبذب ±" + flN(tl.sd) + "°", tl.sd < 6 ? "ok" : tl.sd < 12 ? "mid" : "bad", 8, tl.sd < 6 ? "" : "شدّ جسمك وثبّت وضعك طول التمرين"));
    const bp = flBarPath(frames, "generic");
    if (bp) out.push(flCheck("مسار الحركة", "انحراف " + flN(bp.drift * 100) + "٪", bp.drift < 0.18 ? "ok" : bp.drift < 0.30 ? "mid" : "bad", 8, bp.drift < 0.18 ? "" : "الحركة بتلف بين العدات — ثبّت المسار"));
    if (summary && summary.gravity) { const g = summary.gravity; out.push(flCheck("اتزان الجسم", g.label + " · " + flN(g.insidePct) + "٪", g.tone, 6, g.tone === "ok" ? "" : "وزنك مايل — وزّعه على نص القدم")); }
    return out;
  }

  /* full analysis: returns { score, grade, checks, metrics, barPath } — pure, testable */
  /* ---------- camera angle (front / back / side / diagonal) ---------- */
  const FL_ANG = { front: { t: "أمامي / خلفي", ic: "🧍" }, back: { t: "أمامي / خلفي", ic: "🔙" }, side: { t: "جانبي", ic: "↔️" }, diag: { t: "قُطري (٣/٤)", ic: "↗️" } };
  let flAngleOverride = null;
  const flMedian = a => { a = a.filter(v => v != null && isFinite(v)).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
  /* one sample from a getter get(i) -> {x,y,v} | null; ar = width/height */
  function flAngSample(get, ar) {
    const a = get(11), b = get(12), c = get(23), d = get(24);
    if (!a || !b || !c || !d) return null;
    if (Math.min(a.v, b.v, c.v, d.v) < 0.4) return null;
    const sw = Math.abs(a.x - b.x) * ar, sx = (a.x + b.x) / 2 * ar, sy = (a.y + b.y) / 2, hx = (c.x + d.x) / 2 * ar, hy = (c.y + d.y) / 2;
    const tr = Math.hypot(sx - hx, sy - hy); if (tr < 0.05) return null;
    const fv = [get(0), get(2), get(5)].map(p => p ? p.v : 0);
    return { r: sw / tr, face: (fv[0] + fv[1] + fv[2]) / 3, lr: a.x > b.x ? 1 : 0 };
  }
  function flAngFromSamples(S) {
    S = S.filter(Boolean);
    if (S.length < 3) return { key: null, yaw: null, conf: "low", n: S.length };
    const r = flMedian(S.map(s => s.r)), face = flMedian(S.map(s => s.face));
    const R0 = 0.68, yaw = Math.round(Math.acos(Math.min(1, r / R0)) * 180 / Math.PI);
    /* front and back look the same to the model (its left/right labels flip on back views), and the checks are identical, so they share one bucket */
    const key = yaw < 30 ? "front" : yaw < 65 ? "diag" : "side";
    const spread = flMedian(S.map(s => Math.abs(Math.acos(Math.min(1, s.r / R0)) * 180 / Math.PI - yaw)));
    const near = Math.min(Math.abs(yaw - 30), Math.abs(yaw - 65)) < 8;
    const faceUnsure = false;
    return { key, yaw, r: +r.toFixed(2), face: +face.toFixed(2), conf: (near || faceUnsure || spread > 15) ? "low" : "high", n: S.length };
  }
  function flAngleOfTrack(track) {
    const ar = track.ar || 0.5625;
    const S = track.frames.filter((_, i) => i % 2 === 0).map(fr => flAngSample(i => { const p = fr.lms[i]; return p ? { x: p[0], y: p[1], v: p[2] == null ? 1 : p[2] } : null; }, ar));
    return flAngFromSamples(S);
  }
  function flResolveAngle(track) {
    const est = flAngleOfTrack(track);
    if (flAngleOverride) return Object.assign({}, est, { key: flAngleOverride, manual: true, conf: "high" });
    return est.key ? est : Object.assign(est, { key: "side", conf: "low", fallback: true });
  }
  /* checks that only make sense from the side (joint depth, bar path, forward lean) */
  const FL_SIDE_ONLY = /العمق|مسار البار|مسار الحركة|ثبات المسار|ثبات نقطة النزول|البار قريب|الوزن قريب|ميل الجذع|استقامة الجذع|ثبات الضهر|الحركة من الحوض|الحوض والكتف|زاوية الكوع|مدى الحركة|مدى السحب|عمق السحب|فرد الذراع|القفلة فوق|التحكم في الرجوع/;
  const FL_LOWER = { squat: 1, deadlift: 1, hinge: 1, lunge: 1, calf: 1, legmach: 1 };
  function flChecksFB(frames, reps, model) {
    const out = [];
    const sl = frames.map(f => { const l = f.lms; if (!l || !l[11] || !l[12] || Math.min(l[11][2] == null ? 1 : l[11][2], l[12][2] == null ? 1 : l[12][2]) < MINV) return null; return Math.abs(Math.atan2((l[11][1] - l[12][1]), (l[11][0] - l[12][0]) * 0.5625) * 180 / Math.PI); }).map(v => v == null ? null : (v > 90 ? 180 - v : v));
    const sls = flStat(sl);
    if (sls) out.push(flCheck("استواء الكتفين", "ميل ±" + flN(sls.avg) + "°", sls.avg < 3.5 ? "ok" : sls.avg < 7 ? "mid" : "bad", 8, "الكتف الواحد أعلى من التاني — ظبّط وقفتك"));
    const rt = flRefTrunk(frames);
    const shift = flStat(frames.map(f => f.F && f.F.hp ? f.F.hp.x / rt : null));
    if (shift) out.push(flCheck("ثبات الجسم يمين/شمال", "تذبذب ±" + flN(shift.sd * 100) + "٪ من طول الجذع", shift.sd < 0.08 ? "ok" : shift.sd < 0.16 ? "mid" : "bad", 10, "الجسم بيتحرك جنب — ثبّت الحوض"));
    if (FL_LOWER[model]) {
      const ys = frames.filter(f => f.F && f.F.knee && f.F.ankle);
      const low = ys.slice().sort((a, b) => b.F.hp.y - a.F.hp.y).slice(0, Math.max(3, Math.floor(ys.length * 0.3)));
      const ratios = low.map(f => { const l = f.lms; const kv = [25, 26, 27, 28].map(i => l[i] && (l[i][2] == null ? 1 : l[i][2]) >= MINV); if (kv.some(v => !v)) return null; const kd = Math.abs(l[25][0] - l[26][0]), ad = Math.abs(l[27][0] - l[28][0]); return ad > 0.02 ? kd / ad : null; });
      const rs = flStat(ratios);
      if (rs) out.push(flCheck("الركبة للداخل", "الركبتين " + flN(rs.avg * 100) + "٪ من عرض الرجلين", rs.avg >= 0.9 ? "ok" : rs.avg >= 0.75 ? "mid" : "bad", 14, "الركبة بتقع للداخل — ادفعها لبرا في اتجاه صوابع الرجل"));
      const wl = flStat(low.map(f => { const l = f.lms; return l[25] && l[26] && l[25][2] >= MINV && l[26][2] >= MINV ? Math.abs(l[25][1] - l[26][1]) / rt : null; }));
      if (wl) out.push(flCheck("توازن الرجلين", "فرق ارتفاع الركبتين " + flN(wl.avg * 100) + "٪", wl.avg < 0.12 ? "ok" : wl.avg < 0.25 ? "mid" : "bad", 8, "جنب أقل شغل من التاني — وزّع الوزن"));
    }
    return out;
  }
  /* lateral raise from front/back: per-arm raise angle, own rep detection */
  function flRaiseSeries(frames) {
    const side = s => frames.map(f => { const l = f.lms; const i = s === 0 ? [11, 13, 15, 23] : [12, 14, 16, 24]; const v = i.map(k => l[k] ? (l[k][2] == null ? 1 : l[k][2]) : 0); if (Math.min(v[0], v[2], v[3]) < MINV) return { t: f.t, a: null }; const P = k => ({ x: l[k][0] * 0.5625, y: l[k][1] }); return { t: f.t, a: flAngle(P(i[3]), P(i[0]), P(i[2])), el: v[1] >= MINV ? flAngle(P(i[0]), P(i[1]), P(i[2])) : null, trunk: f.F ? f.F.trunk : null, shy: l[i[0]][1], hpy: l[i[3]][1] }; });
    return [side(0), side(1)];
  }
  function flRaiseReps(frames) {
    const S = flRaiseSeries(frames);
    const rng = s => { const v = s.map(p => p.a).filter(x => x != null).sort((a, b) => a - b); return v.length > 5 ? [v[Math.floor(v.length * 0.05)], v[Math.floor(v.length * 0.95)]] : null; };
    const R = S.map(rng);
    const idx = R[0] && R[1] ? ((R[1][1] - R[1][0]) > (R[0][1] - R[0][0]) ? 1 : 0) : R[0] ? 0 : R[1] ? 1 : -1;
    if (idx < 0) return null;
    const lo = R[idx][0], hi = R[idx][1];
    if (hi - lo < 25) return { count: 0, list: [], series: S, arm: idx, ranges: R };
    const raw = S[idx].filter(p => p.a != null), sm = raw.map((p, i) => ({ t: p.t, a: (raw[Math.max(0, i - 1)].a + p.a + raw[Math.min(raw.length - 1, i + 1)].a) / 3 }));
    const up = lo + (hi - lo) * 0.65, dn = lo + (hi - lo) * 0.35;
    const list = []; let st = "low", t0 = sm[0].t, peak = -1, tp = 0;
    sm.forEach(p => {
      if (st === "low") { if (p.a < dn) t0 = p.t; if (p.a > up) { st = "high"; peak = p.a; tp = p.t; } }
      else { if (p.a > peak) { peak = p.a; tp = p.t; } if (p.a < dn) { list.push({ t0, t1: p.t, tBottom: tp, bottom: peak, dur: p.t - t0, down: p.t - tp, up: tp - t0, peak: true }); st = "low"; t0 = p.t; peak = -1; } }
    });
    const good = list.filter(r => r.dur >= 0.8 && r.dur <= 15);
    const avg = k => good.length ? good.reduce((a, r) => a + r[k], 0) / good.length : null;
    return { count: good.length, list: good, avgDown: avg("down"), avgUp: avg("up"), avgBottom: avg("bottom"), rom: good.length ? avg("bottom") - lo : 0, series: S, arm: idx, ranges: R };
  }
  function flChecksRaiseFB(frames, reps, rr) {
    const out = [];
    if (!rr || !rr.series) return out;
    const S = rr.series, W = S[rr.arm], O = S[1 - rr.arm];
    const spans = (reps && reps.list ? reps.list : []);
    const peaks = spans.map(r => r.bottom);
    const ra = flStat(peaks);
    if (ra) out.push(flCheck("ارتفاع الرفعة", flN(ra.avg) + "° من الجسم", ra.avg >= 70 && ra.avg <= 100 ? "ok" : ra.avg >= 55 && ra.avg <= 115 ? "mid" : "bad", 14, ra.avg < 70 ? "ارفع لحد مستوى الكتف (٩٠° تقريبًا)" : "متعديش مستوى الكتف"));
    const at = (arr, t) => arr.reduce((b, p) => p.a != null && (!b || Math.abs(p.t - t) < Math.abs(b.t - t)) ? p : b, null);
    const els = flStat(spans.map(r => { const p = at(W, r.tBottom); return p ? p.el : null; }));
    if (els) out.push(flCheck("ثني الكوع", flN(els.avg) + "° وقت الرفعة", els.avg >= 120 ? "ok" : els.avg >= 100 ? "mid" : "bad", 8, "الكوع بيتني كتير — خلّيه شبه مفرود بثنية خفيفة"));
    const rest = flStat(W.filter(p => p.a != null && p.a < (rr.ranges[rr.arm][0] + 15)).map(p => p.trunk && p.shy != null ? (p.hpy - p.shy) / p.trunk : null));
    const top = flStat(spans.map(r => { const p = at(W, r.tBottom); return p && p.trunk ? (p.hpy - p.shy) / p.trunk : null; }));
    if (rest && top && rest.avg > 0) { const sh = Math.max(0, (1 - top.avg / rest.avg) * 100); out.push(flCheck("شد الكتف لفوق", flN(sh) + "٪", sh < 6 ? "ok" : sh < 12 ? "mid" : "bad", 8, "الكتف بيطلع ناحية ودنك — نزّله واستخدم الجانبي بس")); }
    const tl = flStat(frames.map(f => f.F ? f.F.tilt : null));
    if (tl) out.push(flCheck("ثبات الجسم", "تذبذب ±" + flN(tl.sd) + "°", tl.sd < 4 ? "ok" : tl.sd < 8 ? "mid" : "bad", 10, "الجسم بيميل مع الرفعة — وزن أخف وتحكم أكتر"));
    if (reps && reps.avgDown != null) { const d = reps.avgDown; out.push(flCheck("التحكم في النزول", flN(d, 1) + " ثانية", d >= 1.5 ? "ok" : d >= 1 ? "mid" : "bad", 6, "انزل بتحكم — متسيبش الوزن يقع")); }
    const rO = rr.ranges[1 - rr.arm];
    if (rO && rO[1] - rO[0] >= 25 && O) {
      const po = flStat(spans.map(r => { const p = at(O, r.tBottom); return p ? p.a : null; }));
      if (po && ra) { const df = Math.abs(po.avg - ra.avg); out.push(flCheck("تماثل الدراعين", "فرق " + flN(df) + "°", df < 10 ? "ok" : df < 20 ? "mid" : "bad", 8, "دراع بيرفع أعلى من التانية — ركّز على الأضعف")); }
    } else out.push(flCheck("ℹ️ ذراع واحدة", "اتحسب الذراع الأكتر حركة", "ok", 0, ""));
    return out;
  }
  function flApplyAngle(checks, angle, model, frames, reps, rr) {
    if (!angle || !angle.key) return checks;
    const A = FL_ANG[angle.key];
    const base = checks.filter(c => c.label.indexOf("ℹ️ حدود القياس") !== 0);
    let out;
    if (angle.key === "front" || angle.key === "back") {
      out = base.map(c => FL_SIDE_ONLY.test(c.label) ? { label: c.label, val: "غير قابل للقياس من زاوية " + A.t, tone: "na", pts: 0, tip: "" } : c);
      if (model === "raise" && rr) out = out.filter(c => c.tone === "na" ? false : true).filter(c => !/ثبات الجسم|التحكم في النزول|ارتفاع الرفعة/.test(c.label)).concat(flChecksRaiseFB(frames, reps, rr));
      out = out.concat(flChecksFB(frames, reps, model));
      /* hide NA rows that now have a front/back replacement of the same name */
    } else if (angle.key === "diag") {
      out = base.map(c => FL_SIDE_ONLY.test(c.label) && c.pts ? Object.assign({}, c, { val: c.val + " (تقريبي — زاوية قُطرية)", pts: Math.round(c.pts / 2) }) : c);
      if (model === "raise" && rr) out = out.filter(c => !/ثبات الجسم|التحكم في النزول|ارتفاع الرفعة/.test(c.label)).concat(flChecksRaiseFB(frames, reps, rr));
    } else out = base;
    out.push(flCheck("📐 زاوية التصوير", A.t + (angle.manual ? " (اخترتها انت)" : angle.conf === "low" ? " (مش متأكد — غيّرها لو غلط)" : ""), "ok", 0, ""));
    return out;
  }

  function flAnalyze(lift, track, summary, angle) {
    const frames = flFrames(track);
    angle = angle || flResolveAngle(track);
    console.debug("MOFIT angle", JSON.stringify(angle));
    let rr = null;
    if (lift === "raise" && angle.key !== "side") rr = flRaiseReps(frames);
    const reps = (rr || summary.reps) || null;
    const FL_CHECK = { squat: flChecksSquat, deadlift: flChecksDeadlift, bench: flChecksBench, ohp: flChecksOhp, hpress: flChecksHPress, vpress: flChecksVPress, row: flChecksRow, pulldown: flChecksPulldown, hinge: flChecksHinge, lunge: flChecksLunge, curl: flChecksCurl, extend: flChecksExtend, raise: flChecksRaise, calf: flChecksCalf, legmach: flChecksLegMach };
    const checks = flApplyAngle((FL_CHECK[lift] || flChecksGeneric)(frames, reps, summary), angle, lift, frames, reps, rr);
    const lost = checks.reduce((a, c) => a + c.pts, 0);
    let score = Math.max(5, Math.min(100, 100 - lost));
    if (lift === "generic") score = Math.min(score, 85); /* approximate model: honest cap */
    const grade = score >= 90 ? { t: "ممتاز 🏆", tone: "ok" } : score >= 75 ? { t: "كويس 💪", tone: "ok" } : score >= 60 ? { t: "محتاج شغل 🛠", tone: "mid" } : { t: "ركّز على الأساسيات 🎯", tone: "bad" };
    const bp = flBarPath(frames, lift);
    const metrics = {
      v: 1, lift, angle: angle.key, yaw: angle.yaw, angleManual: !!angle.manual,
      model: lift, approx: lift === "generic",
      score, reps: reps ? reps.count : 0,
      checks: checks.map(c => ({ label: c.label, val: c.val, tone: c.tone, pts: c.pts })),
      drift: bp ? +bp.drift.toFixed(3) : null,
      tempoDown: reps && reps.avgDown != null ? +reps.avgDown.toFixed(2) : null,
      tempoUp: reps && reps.avgUp != null ? +reps.avgUp.toFixed(2) : null,
      bottomAngle: reps && reps.avgBottom != null ? Math.round(reps.avgBottom) : null,
      rom: reps ? Math.round(reps.rom) : null,
      frames: track.frames.length,
      dur: summary.dur ? +summary.dur.toFixed(1) : null,
    };
    return { score, grade, checks, metrics, barPath: bp, frames, angle, reps };
  }

  window.FormLab = { analyze: flAnalyze, LIFTS: FL_LIFTS, modelFor: flModelFor, CANON: FL_CANON };

  /* ==================================================================
     UI
     ================================================================== */
  let flCssDone = false;
  function flCss() {
    if (flCssDone) return; flCssDone = true;
    const st = document.createElement("style"); st.id = "flCss"; st.textContent = `
/* horizontal chip row: LTR scroll container (iOS Safari jitters on RTL
   overflow-x) + RTL track so visual order stays right-to-left; momentum
   scroll, soft snap, no layout jump when the active chip changes */
.fl-lifts{display:flex;overflow-x:auto;padding:2px 2px 8px;margin-bottom:10px;-webkit-overflow-scrolling:touch;touch-action:pan-x;overscroll-behavior-x:contain;scroll-snap-type:x proximity;direction:ltr;scrollbar-width:none}
.fl-lifts::-webkit-scrollbar{display:none}
.fl-lifts-t{display:flex;gap:8px;direction:rtl;width:max-content;min-width:100%}
.fl-lift{flex:none;scroll-snap-align:start;border:1.5px solid var(--soft2,#E2E8F0);background:var(--soft,#F1F5F9);border-radius:14px;padding:10px 14px;font-weight:800;font-size:.9rem;cursor:pointer;color:var(--navy);font-family:inherit;min-height:44px}
.fl-exwrap{margin-bottom:10px}
.fl-exwrap>summary{cursor:pointer;font-weight:800;font-size:.9rem;padding:10px 12px;border:1.5px dashed var(--soft2,#CBD5E1);border-radius:14px;list-style:none}
.fl-exwrap>summary::-webkit-details-marker{display:none}
.fl-exq{width:100%;margin:8px 0 6px;padding:10px 12px;border:1.5px solid var(--soft2,#E2E8F0);border-radius:12px;font-family:inherit;font-size:.9rem;background:var(--card,#fff);color:var(--navy)}
.fl-exlist{max-height:260px;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;padding-left:4px}
.fl-exg{font-size:.78rem;font-weight:800;color:var(--mut,#64748B);margin:8px 2px 4px}
.fl-exs{display:flex;flex-wrap:wrap;gap:6px}
.fl-ex{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--soft2,#E2E8F0);background:var(--soft,#F1F5F9);border-radius:12px;padding:8px 10px;font-weight:700;font-size:.8rem;cursor:pointer;color:var(--navy);font-family:inherit;min-height:40px}
.fl-ex.on{background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;border-color:#EA580C}
.fl-ex .fl-mdl{font-style:normal;font-size:.68rem;opacity:.75}
.fl-sel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 10px;font-size:.9rem}
.fl-approx{margin:10px 0;padding:10px 12px;border-radius:12px;background:#FFFBEB;border:1px solid #FDE68A;color:#92400E;font-size:.85rem;font-weight:700}
.fl-lift.on{background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;border-color:#EA580C;box-shadow:0 8px 18px -8px rgba(249,115,22,.7)}
.fl-prog{margin-top:12px;border:1.5px solid var(--soft2,#E2E8F0);border-radius:14px;padding:12px;background:var(--soft,#F8FAFC)}
.fl-prog .t{font-weight:800;font-size:.88rem;color:var(--navy);display:flex;justify-content:space-between;margin-bottom:8px}
.fl-prog .tr{height:8px;border-radius:8px;background:#E2E8F0;overflow:hidden}
.fl-prog .tr i{display:block;height:100%;width:0;background:linear-gradient(90deg,#FB923C,#EA580C);transition:width .2s}
.fl-prog.bad{border-color:#FCA5A5;background:#FEF2F2}
.fl-prog.bad .t{color:#B91C1C}
.fl-prog.bad .tr i{width:100%!important;background:#EF4444}
.fl-fail{margin-top:10px;border:1.5px solid #FCA5A5;border-radius:14px;padding:12px;background:var(--card,#fff);color:var(--navy)}
.fl-fail h3{margin:0 0 6px;font-size:1rem;color:#B91C1C}
.fl-fail ul{margin:8px 0;padding-inline-start:20px;font-size:.86rem;line-height:1.9}
.fl-fail code{display:block;direction:ltr;text-align:left;font-size:.72rem;opacity:.7;margin-top:6px;word-break:break-all}
.fl-fail .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.fl-pc-stage{position:relative;border-radius:14px;overflow:hidden;background:#000;margin:8px 0;max-height:52vh;display:flex;justify-content:center}
.fl-pc-stage video{max-width:100%;max-height:52vh;display:block}
.fl-pc-stage canvas{position:absolute;inset:0;margin:auto;max-width:100%;max-height:52vh;width:100%;height:100%;object-fit:contain;pointer-events:none}
.fl-pc-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.fl-pc-chip{font-size:.8rem;font-weight:800;padding:6px 10px;border-radius:999px;border:1.5px solid var(--soft2,#E2E8F0);background:var(--soft,#F1F5F9)}
.fl-pc-chip.ok{border-color:#86EFAC;background:#F0FDF4;color:#166534}
.fl-pc-chip.warn{border-color:#FDE68A;background:#FFFBEB;color:#92400E}
.fl-pc-chip.bad{border-color:#FCA5A5;background:#FEF2F2;color:#B91C1C}
.fl-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--soft2,#EEF2F7);cursor:pointer}
.fl-row:last-child{border-bottom:0}
.fl-score{flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-weight:900;font-size:1.02rem;color:#fff}
.fl-score.ok{background:linear-gradient(135deg,#22C55E,#15803D);box-shadow:0 8px 16px -8px rgba(34,197,94,.8)}
.fl-score.mid{background:linear-gradient(135deg,#FACC15,#CA8A04);box-shadow:0 8px 16px -8px rgba(250,204,21,.8)}
.fl-score.bad{background:linear-gradient(135deg,#F43F5E,#BE123C);box-shadow:0 8px 16px -8px rgba(244,63,94,.8)}
.fl-row .nm{flex:1;min-width:0}
.fl-row .nm b{display:block;color:var(--navy)}
.fl-row .nm small{color:var(--slate)}
.fl-ghost{color:#CA8A04;font-size:1.05rem}
.fl-ghostbtn{flex:none;border:1.5px solid #FDE68A;background:#FFFBEB;border-radius:10px;padding:6px 9px;font-size:.75rem;font-weight:800;color:#92400E;cursor:pointer;font-family:inherit}
.fl-hero-score{display:flex;align-items:center;gap:16px;margin:6px 0 12px}
.fl-hero-score .gv{display:flex;flex-direction:column;gap:4px}
.fl-grade{font-size:1.25rem;font-weight:900;color:var(--navy)}
.fl-grade.ok{color:#15803D}.fl-grade.mid{color:#A16207}.fl-grade.bad{color:#BE123C}
.fl-check{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px dashed var(--soft2,#EEF2F7)}
.fl-check:last-child{border-bottom:0}
.fl-dot{flex:none;width:12px;height:12px;border-radius:50%;margin-top:4px}
.fl-dot.ok{background:#22C55E;box-shadow:0 0 8px rgba(34,197,94,.7)}
.fl-dot.mid{background:#FACC15;box-shadow:0 0 8px rgba(250,204,21,.7)}
.fl-dot.bad{background:#F43F5E;box-shadow:0 0 8px rgba(244,63,94,.7)}
.fl-dot.na{background:#CBD5E1}
.fl-modes{display:flex;gap:8px;margin:0 0 10px}
.fl-modes button{flex:1;font:inherit;font-weight:900;padding:12px;border-radius:14px;border:2px solid var(--soft2,#E2E8F0);background:var(--card,#fff);color:var(--navy,#0f172a)}
.fl-modes button.on{background:var(--navy,#0f172a);color:#fff;border-color:var(--navy,#0f172a)}
.fl-pz{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fl-pslot{display:flex;flex-direction:column;gap:6px;align-items:stretch}
.fl-pslot b{font-size:.9rem}.fl-pslot small{opacity:.75;font-size:.72rem}
.fl-pslot .btn{padding:9px 6px;font-size:.78rem}
.fl-pph{min-height:120px;border:1.5px dashed var(--soft2,#CBD5E1);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;overflow:hidden}
.fl-pimg{position:relative;width:100%}.fl-pimg img{width:100%;display:block;border-radius:8px;max-height:260px;object-fit:contain;background:#000}
.fl-pimg canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
.fl-angbar{margin:10px 0;padding:10px 12px;border:1.5px solid #BAE6FD;background:#F0F9FF;border-radius:14px;display:flex;flex-direction:column;gap:6px;color:#075985}
.fl-angbar small{opacity:.85}
.fl-angpick{display:flex;flex-wrap:wrap;gap:6px}
.fl-angb{font:inherit;font-size:.8rem;font-weight:800;padding:6px 12px;border-radius:999px;border:1.5px solid #7DD3FC;background:#fff;color:#075985}
.fl-angb.on{background:#0284C7;color:#fff;border-color:#0284C7}
.fl-check .fl-cb{flex:1;display:block;min-width:0}
.fl-check .cb b{display:block;font-size:.9rem;color:var(--navy)}
.fl-check .cb small{color:var(--slate)}
.fl-check .ct{font-size:.78rem;color:#92400E;background:#FFFBEB;border-radius:8px;padding:4px 8px;margin-top:4px;display:inline-block}
.fl-ghostbox{border:1.5px solid #FDE68A;background:linear-gradient(160deg,#FFFBEB,#FEF3C7);border-radius:16px;padding:12px;margin:10px 0}
.fl-ghostbox h4{margin:0 0 8px;font-size:.88rem;color:#92400E}
.fl-gcmp{display:grid;grid-template-columns:1fr auto auto;gap:4px 10px;font-size:.84rem;align-items:center}
.fl-gcmp .h{color:#92400E;font-weight:800;font-size:.75rem}
.fl-gcmp b{color:var(--navy)}
.fl-reps{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.fl-rep{display:flex;align-items:center;gap:10px;background:var(--soft,#F8FAFC);border:1px solid var(--soft2,#EEF2F7);border-radius:12px;padding:8px 10px;font-size:.84rem}
.fl-rep .n{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:900;background:var(--navy);color:#fff;font-size:.8rem}
.fl-rep small{color:var(--slate)}
.fl-vid{position:relative;border-radius:16px;overflow:hidden;background:#000;margin-top:10px}
.fl-vid video{width:100%;display:block;max-height:46vh;object-fit:contain}
.fl-vid canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
.fl-note{font-size:.75rem;color:var(--slate);line-height:1.7;margin-top:10px}
.fl-barpath{background:var(--navy,#0F172A);border-radius:16px;padding:10px;margin-top:10px}
.fl-barpath svg{width:100%;display:block}
`; document.head.appendChild(st);
  }

  function flLoadScript(src) {
    return new Promise((res, rej) => {
      const sc = document.createElement("script");
      sc.src = src + "?v=formlab-20261127-6"; sc.onload = res; sc.onerror = rej;
      document.head.appendChild(sc);
    });
  }
  async function flEnsureModel() {
    if (!window.apInit) {
      toast("⏳ بيحمّل نموذج التحليل أول مرة (~١٧ ميجا، بعدها فوري حتى أوفلاين)…");
      await flLoadScript("pose-auto.js");
    }
    return apInit("lite", null, "VIDEO");
  }

  /* skeleton overlay on the scanned video (session only, frames in memory) */
  const FL_EDGES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]];
  function flDrawSkel(canvas, video, track, lift) {
    const ctx = canvas.getContext("2d");
    const draw = () => {
      if (!canvas.isConnected) return;
      const r = video.getBoundingClientRect();
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) { canvas.width = video.videoWidth || 360; canvas.height = video.videoHeight || 640; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = video.currentTime, fr = track.frames;
      if (!fr.length) return;
      let best = fr[0], bd = 1e9;
      for (const f of fr) { const d = Math.abs(f.t - t); if (d < bd) { bd = d; best = f; } }
      if (bd > 0.4) return;
      const lms = best.lms, W = canvas.width, H = canvas.height;
      ctx.lineWidth = Math.max(2, W / 160); ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(56,189,248,.9)"; ctx.shadowColor = "rgba(56,189,248,.8)"; ctx.shadowBlur = 6;
      FL_EDGES.forEach(([a, b]) => {
        const p = lms[a], q = lms[b]; if (!p || !q) return;
        if (Math.min(p[2] == null ? 1 : p[2], q[2] == null ? 1 : q[2]) < MINV) return;
        ctx.beginPath(); ctx.moveTo(p[0] * W, p[1] * H); ctx.lineTo(q[0] * W, q[1] * H); ctx.stroke();
      });
      [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(i => {
        const p = lms[i]; if (!p || (p[2] == null ? 1 : p[2]) < MINV) return;
        ctx.beginPath(); ctx.fillStyle = "#F97316"; ctx.arc(p[0] * W, p[1] * H, Math.max(3, W / 90), 0, Math.PI * 2); ctx.fill();
      });
      /* bar point */
      const ar = track.ar || (W / H);
      const F = flFrame(lms, ar);
      if (F) { const p = flProxy(F, lift); if (p) { ctx.beginPath(); ctx.fillStyle = "#FACC15"; ctx.arc(p.x / ar * W, p.y * H, Math.max(5, W / 55), 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); } }
    };
    video.addEventListener("timeupdate", draw); video.addEventListener("seeked", draw);
    draw();
  }

  /* bar path mini chart (navy card) */
  function flBarPathSVG(bp, lift) {
    if (!bp || !bp.pts.length) return "";
    const W = 300, H = 190, pad = 16;
    const ys = bp.pts.map(p => p.y), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const X = dx => W / 2 + dx * (W * 0.9);
    const Y = y => pad + (1 - (y - y0) / ((y1 - y0) || 1)) * (H - 2 * pad);
    const line = bp.pts.map((p, i) => (i ? "L" : "M") + X(p.dx).toFixed(1) + " " + Y(p.y).toFixed(1)).join(" ");
    return `<div class="fl-barpath"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><b style="color:#fff;font-size:.85rem">مسار البار</b><small style="color:#94A3B8">انحراف ${flN(bp.drift * 100)}٪ · الخط المنقط = العمود المثالي</small></div>
      <svg viewBox="0 0 ${W} ${H}" direction="ltr"><line x1="${W / 2}" y1="${pad}" x2="${W / 2}" y2="${H - pad}" stroke="#64748B" stroke-dasharray="4 5" stroke-width="1.5"/>
      <path d="${line}" fill="none" stroke="#38BDF8" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 5px #38BDF8)"/>
      <circle cx="${X(bp.pts[0].dx)}" cy="${Y(bp.pts[0].y)}" r="4" fill="#22C55E"/><circle cx="${X(bp.pts[bp.pts.length - 1].dx)}" cy="${Y(bp.pts[bp.pts.length - 1].y)}" r="4" fill="#F97316"/></svg></div>`;
  }

  /* ghost comparison block */
  function flGhostBox(lift, metrics, ghost) {
    const L = flLiftOf(lift);
    if (!ghost || !ghost.metrics) return `<div class="fl-ghostbox"><h4>👻 شبح الكوتش</h4><p class="hint" style="margin:0">الكوتش لسه ما حددش الأداء المثالي لـ${flEn(L.label)}. أول ما يحدده، هتشوف مقارنتك بيه هنا.</p></div>`;
    const g = ghost.metrics, rows = [];
    const cmp = (label, mine, his, unit, betterLow) => {
      if (mine == null || his == null) return;
      const win = betterLow ? mine <= his : mine >= his;
      rows.push(`<span>${label}</span><b>${flN(mine)}${unit}</b><span style="color:${win ? "#15803D" : "#B45309"};font-weight:800">الشبح ${flN(his)}${unit} ${win ? "✓" : "←"}</span>`);
    };
    cmp("التقييم", metrics.score, g.score, "");
    cmp("العمق (زاوية الركبة)", metrics.bottomAngle, g.bottomAngle, "°", true);
    cmp("انحراف البار", metrics.drift != null ? metrics.drift * 100 : null, g.drift != null ? g.drift * 100 : null, "٪", true);
    cmp("سرعة النزول", metrics.tempoDown, g.tempoDown, " ث");
    return `<div class="fl-ghostbox"><h4>👻 مقارنتك بشبح الكوتش (${flDate(ghost.created_at)})</h4><div class="fl-gcmp"><span class="h"></span><span class="h">أنت</span><span class="h">الشبح</span>${rows.join("")}</div></div>`;
  }

  /* the result sheet, used right after a scan (with live video+track) and from history (metrics only) */
  function flResultSheet(o) {
    flCss();
    const L = flLiftOf(o.lift);
    const approx = o.metrics && o.metrics.approx;
    const tone = o.score >= 75 ? "ok" : o.score >= 50 ? "mid" : "bad";
    const checks = o.checks || (o.metrics.checks || []).map(c => ({ ...c, tip: "" }));
    const repList = o.repList || [];
    const body = openSheet(`<div class="between" style="margin-bottom:6px"><b style="font-size:1.1rem">${L.icon} ${flEn(L.label)} — نتيجة الفورم</b><button class="btn sm ghost" onclick="closeSheet()">✕</button></div>
      <div class="fl-hero-score">${ring(o.score, 100, { size: 110, stroke: 11, label: flN(o.score), sub: "من ١٠٠", color: tone === "ok" ? "#22C55E" : tone === "mid" ? "#FACC15" : "#F43F5E" })}
        <div class="gv"><span class="fl-grade ${o.grade.tone}">${o.grade.t}</span><small class="hint">${(o.metrics.reps || 0) > 0 ? "تقييم MOFIT الاسترشادي — " + o.metrics.reps + " عدات متعرف عليها" : "تقييم مبدئي من الحركة العامة — مفيش عدات واضحة في الفيديو"}</small></div></div>
      ${approx ? `<div class="fl-approx">🔎 تحليل تقريبي — التمرين ده ملوش نموذج مخصص لسه، فالتقييم من الحركة العامة (عدات · إيقاع · ثبات · اتزان) ومحددش تفاصيل زي العمق أو زاوية الكوع. أقصى تقييم هنا ٨٥.</div>` : ""}
      ${o.angle && o.angle.key ? `<div class="fl-angbar"><b>📐 صُوّر من: ${FL_ANG[o.angle.key].t}</b>${o.angle.conf === "low" && !o.angle.manual ? `<small>مش متأكد من الزاوية — اختار الصح:</small>` : `<small>غلط؟ غيّر الزاوية:</small>`}<div class="fl-angpick">${["front", "side", "diag"].map(k => `<button type="button" class="fl-angb${o.angle.key === k ? " on" : ""}" data-ang="${k}">${FL_ANG[k].t}</button>`).join("")}</div></div>` : ""}
      ${flGhostBox(o.lift, o.metrics, o.ghost)}
      <div class="card" style="box-shadow:none;border:1px solid var(--soft2,#EEF2F7)"><div class="card-h"><div class="ic acc">✅</div><h2>تفاصيل التقييم</h2></div>
        ${checks.map(c => `<div class="fl-check"><span class="fl-dot ${c.tone}"></span><div class="fl-cb"><b>${flEsc(c.label)}</b><small>${flEsc(c.val)}</small>${c.tip && c.tone !== "ok" ? `<span class="fl-ct">💡 ${flEsc(c.tip)}</span>` : ""}</div>${c.tone === "na" ? `<b style="color:#94A3B8">—</b>` : c.pts ? `<b style="color:#BE123C">-${c.pts}</b>` : `<b style="color:#15803D">✓</b>`}</div>`).join("")}</div>
      ${o.barPath ? flBarPathSVG(o.barPath, o.lift) : ""}
      ${repList.length ? `<div class="card" style="box-shadow:none;border:1px solid var(--soft2,#EEF2F7);margin-top:10px"><div class="card-h"><div class="ic dark">🔁</div><h2>العدات (${repList.length})</h2></div><div class="fl-reps">
        ${repList.map((r, i) => `<div class="fl-rep" data-t="${r.t0}"><span class="n">${i + 1}</span><div><b>${r.peak ? "ارتفاع" : "عمق"} ${flN(r.bottom)}°</b> <small>· نزول ${flN(r.down, 1)} ث · طلوع ${flN(r.up, 1)} ث · ${flN(r.dur, 1)} ث</small></div></div>`).join("")}</div></div>` : ""}
      <div id="flVidHost"></div>
      <div class="row" style="margin-top:12px;gap:8px">
        ${o.track && window.MofitPoseResults && !(o.angle && (o.angle.key === "front" || o.angle.key === "back")) ? `<button class="btn navy grow" id="flDeep">📊 التحليل الكامل (عزوم وزوايا)</button>` : ""}
        ${o.canGhost ? `<button class="btn grow" id="flGhost" style="border:1.5px solid #FDE68A;background:#FFFBEB;color:#92400E;font-weight:800">⭐ خلّي دي الشبح المثالي</button>` : ""}
      </div>
      <p class="fl-note">⚠️ التقييم استرشادي من زاوية تصوير واحدة وبيكمّل عين الكوتش — مش تشخيص طبي. لو حاسس بألم في أي تمرين، وقّف وكلّم الكوتش. الفيديو ما بيترفعش ولا بيتحفظ — بيتم التحليل على موبايلك وبيتشال.</p>`);
    body.querySelectorAll(".fl-angb").forEach(b => b.onclick = () => { flAngleOverride = b.dataset.ang; if (o.reanalyze) o.reanalyze(); });
    if (o.track && window.MofitPoseResults && body.querySelector("#flDeep")) body.querySelector("#flDeep").onclick = () => MofitPoseResults.open(o.track, { onSeek: t => { const v = body.querySelector("video"); if (v) v.currentTime = t; } });
    if (o.canGhost) body.querySelector("#flGhost").onclick = async e => { await flSetGhost(o.lift, o.scanId, e.currentTarget); };
    body.querySelectorAll(".fl-rep").forEach(r => r.onclick = () => { const v = body.querySelector("video"); if (v) { v.currentTime = +r.dataset.t; v.pause(); } });
    if (o.videoURL && o.track) {
      const host = body.querySelector("#flVidHost");
      host.innerHTML = `<div class="fl-vid"><video src="${o.videoURL}" controls playsinline muted preload="auto"></video><canvas></canvas></div>`;
      const v = host.querySelector("video");
      v.addEventListener("loadedmetadata", () => flDrawSkel(host.querySelector("canvas"), v, o.track, o.lift), { once: true });
    }
    return body;
  }

  /* ---------- storage ---------- */
  async function flLoadScans(cid) {
    const { data, error } = await sb.from("form_scans").select("id,lift,score,reps,metrics,is_ghost,created_at").eq("client_id", cid).order("created_at", { ascending: false }).limit(30);
    return error ? { error, rows: [] } : { rows: data || [] };
  }
  async function flLoadGhosts() {
    const { data, error } = await sb.from("form_scans").select("id,lift,score,metrics,client_id,created_at").eq("is_ghost", true);
    if (error) return {};
    const g = {}; (data || []).forEach(r => { g[r.lift] = r; }); return g;
  }
  async function flSaveScan(cid, lift, analysis) {
    const row = { client_id: cid, lift, score: analysis.score, reps: analysis.metrics.reps || 0, metrics: analysis.metrics };
    const r = await dbWrite({ op: "insert", table: "form_scans", row });
    return r;
  }
  async function flSetGhost(lift, scanId, btn) {
    if (!scanId) return toast("احفظ التحليل الأول");
    if (btn) { btn.disabled = true; btn.textContent = "⏳ بيتحدد…"; }
    await sb.from("form_scans").update({ is_ghost: false }).eq("lift", lift).eq("is_ghost", true);
    const { error } = await sb.from("form_scans").update({ is_ghost: true }).eq("id", scanId);
    if (error) { if (btn) { btn.disabled = false; btn.textContent = "⭐ خلّي دي الشبح المثالي"; } return toast("تعذر الحفظ، جرّب تاني"); }
    toast("⭐ دي بقت الشبح المثالي لـ" + flLiftOf(lift).label);
    closeSheet(); render();
  }


  /* ---------- pre-check, auto-trim, failure screen ---------- */
  const FL_KEY = [0, 11, 12, 23, 24, 25, 26, 27, 28];
  function flBodyState(lms) {
    if (!lms) return { found: false };
    const vis = i => (lms[i] && (lms[i].visibility ?? 1)) || 0;
    const full = FL_KEY.every(i => lms[i] && vis(i) >= 0.5 && lms[i].x > 0.01 && lms[i].x < 0.99 && lms[i].y > 0.01 && lms[i].y < 0.99);
    const ys = FL_KEY.filter(i => lms[i]).map(i => lms[i].y);
    const h = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
    return { found: true, full, h };
  }
  /* keep the stretch of the clip where the body is actually in frame (drops phone set-up and walk-away seconds) */
  function flTrimFrames(frames, dur) {
    const ok = frames.map(fr => { const l = fr.lms; const v = i => (l[i] && l[i][2]) || 0; return v(11) >= 0.5 && v(12) >= 0.5 && v(23) >= 0.5 && v(24) >= 0.5; });
    let best = null, cur = null;
    frames.forEach((fr, i) => {
      if (!ok[i]) return;
      if (cur && fr.t - cur.end <= 1.2) { cur.end = fr.t; cur.n++; }
      else { cur = { start: fr.t, end: fr.t, n: 1 }; }
      if (!best || cur.n > best.n) best = cur;
    });
    if (!best || best.n < 6) return { frames, from: 0, to: dur, cutStart: 0, cutEnd: 0 };
    const from = Math.max(0, best.start - 0.4), to = Math.min(dur, best.end + 0.4);
    const kept = frames.filter(fr => fr.t >= from && fr.t <= to);
    return { frames: kept, from, to, cutStart: from, cutEnd: Math.max(0, dur - to) };
  }
  const FL_TIPS = ["الجسم كامل في الكادر من الراس للرجلين", "الموبايل ثابت ومسنود على حاجة، من مستوى الوسط تقريباً", "إضاءة كويسة وخلفية مش زحمة، ومحدش تاني في الكادر", "ابعد ٢ لـ ٣ متر، وابدأ الحركة بعد ٣ ثواني من بداية التصوير"];
  function flFail(prog, title, why, code) {
    prog.hidden = false; prog.classList.add("bad");
    prog.querySelector(".t span").textContent = title; prog.querySelector("b").textContent = "✕";
    const old = document.getElementById("flFail"); if (old) old.remove();
    const box = document.createElement("div"); box.className = "fl-fail"; box.id = "flFail";
    box.innerHTML = `<h3>${title}</h3><div style="font-size:.88rem">${why}</div><ul>${FL_TIPS.map(t => `<li>${t}</li>`).join("")}</ul>
      <div class="row"><button class="btn primary" id="flRetry">🔄 جرّب فيديو تاني</button></div>${code ? `<code>${flEsc(code)}</code>` : ""}`;
    prog.insertAdjacentElement("afterend", box);
    box.querySelector("#flRetry").onclick = () => { box.remove(); prog.hidden = true; prog.classList.remove("bad"); const fi = document.getElementById("flFile"); if (fi) fi.click(); };
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function flClearFail(prog) { prog.classList.remove("bad"); const old = document.getElementById("flFail"); if (old) old.remove(); }

  /* pre-check: show the clip with a live skeleton and framing checks before the long scan */
  async function flPrecheck(file, sel, p, prog) {
    flCss();
    flAngleOverride = null;
    const url = URL.createObjectURL(file);
    let alive = true;
    const body = openSheet(`<div class="between" style="margin-bottom:6px"><b style="font-size:1.05rem">🔍 فحص سريع قبل التحليل</b><button class="btn sm ghost" id="flPcX">✕</button></div>
      <div class="hint" id="flPcMsg">جاري تجهيز النموذج…</div>
      <div class="fl-pc-stage"><video src="${url}" muted playsinline loop preload="auto"></video><canvas></canvas></div>
      <div class="fl-pc-chips" id="flPcChips"></div>
      <div class="fl-angbar" style="margin:4px 0 8px"><b id="flPcAng">📐 زاوية التصوير: بنحددها…</b><small>لو غلط اختار الزاوية بنفسك:</small><div class="fl-angpick"><button type="button" class="fl-angb on" data-ang="">تلقائي</button>${["front", "side", "diag"].map(k => `<button type="button" class="fl-angb" data-ang="${k}">${FL_ANG[k].t}</button>`).join("")}</div></div>
      <div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="flPcGo" disabled>▶ ابدأ التحليل</button><button class="btn ghost" id="flPcOther">🎥 اختار فيديو تاني</button></div>`);
    const video = body.querySelector("video"), cv = body.querySelector("canvas"), msg = body.querySelector("#flPcMsg"), chips = body.querySelector("#flPcChips"), go = body.querySelector("#flPcGo");
    const stop = () => { alive = false; try { video.pause(); } catch (_) {} };
    const finish = () => { stop(); URL.revokeObjectURL(url); };
    body.querySelector("#flPcX").onclick = () => { finish(); closeSheet(); };
    body.querySelector("#flPcOther").onclick = () => { finish(); closeSheet(); const fi = document.getElementById("flFile"); if (fi) fi.click(); };
    go.onclick = () => { finish(); closeSheet(); flScan(file, sel, p, prog); };
    body.querySelectorAll(".fl-angb").forEach(b => b.onclick = () => { flAngleOverride = b.dataset.ang || null; body.querySelectorAll(".fl-angb").forEach(x => x.classList.toggle("on", x === b)); showAng(); });
    const angS = [];
    const showAng = () => {
      const el = body.querySelector("#flPcAng"); if (!el) return;
      if (flAngleOverride) { el.textContent = "📐 زاوية التصوير: " + FL_ANG[flAngleOverride].t + " (اخترتها انت)"; return; }
      const e = flAngFromSamples(angS.slice(-12));
      el.textContent = e.key ? "📐 زاوية التصوير: " + FL_ANG[e.key].t + (e.conf === "low" ? " (مش متأكد)" : "") : "📐 زاوية التصوير: بنحددها…";
    };
    try { await new Promise((res, rej) => { if (video.readyState >= 1) return res(); video.onloadedmetadata = res; video.onerror = () => rej(new Error("video")); setTimeout(res, 5000); }); } catch (_) {}
    try { await flEnsureModel(); } catch (e) { msg.textContent = "تعذر تجهيز النموذج، تقدر تبدأ التحليل برضه."; go.disabled = false; return; }
    go.disabled = false; msg.textContent = "الفيديو شغال بدون صوت. السكيلتون الأخضر بيوريك لو الجسم ظاهر كويس.";
    if (video.duration && isFinite(video.duration)) { try { video.currentTime = Math.min(video.duration * 0.4, Math.max(0, video.duration - 0.1)); } catch (_) {} }
    video.play().catch(() => {});
    const hist = [];
    const chip = (cls, t) => `<span class="fl-pc-chip ${cls}">${t}</span>`;
    const draw = lms => {
      const w = video.videoWidth || 360, h = video.videoHeight || 640;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const c = cv.getContext("2d"); c.clearRect(0, 0, w, h);
      if (!lms) return;
      c.lineWidth = Math.max(2, w / 160); c.strokeStyle = "#22C55E"; c.fillStyle = "#F97316";
      FL_EDGES.forEach(([a, b]) => { const A = lms[a], B = lms[b]; if (!A || !B || (A.visibility ?? 1) < 0.4 || (B.visibility ?? 1) < 0.4) return; c.beginPath(); c.moveTo(A.x * w, A.y * h); c.lineTo(B.x * w, B.y * h); c.stroke(); });
      [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(i => { const P = lms[i]; if (!P || (P.visibility ?? 1) < 0.4) return; c.beginPath(); c.arc(P.x * w, P.y * h, Math.max(3, w / 100), 0, 7); c.fill(); });
    };
    while (alive && body.isConnected) {
      const r = await apDetectFrame(video);
      const st = flBodyState(r.lms);
      hist.push({ st, luma: r.luma, blank: r.blank }); if (hist.length > 8) hist.shift();
      if (r.lms) angS.push(flAngSample(i => { const q = r.lms[i]; return q ? { x: q.x, y: q.y, v: q.visibility == null ? 1 : q.visibility } : null; }, (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : 0.5625));
      showAng();
      draw(r.lms);
      const n = hist.length, found = hist.filter(x => x.st.found).length, full = hist.filter(x => x.st.full).length, big = hist.filter(x => x.st.found && x.st.h >= 0.35).length;
      const lumas = hist.map(x => x.luma).filter(v => v != null), luma = lumas.length ? lumas.reduce((a, b) => a + b, 0) / lumas.length : null;
      const blank = hist.every(x => x.blank);
      let h = "";
      if (blank) h += chip("bad", "⚠️ الفيديو ظاهر أسود — جرّب فيديو تاني");
      else {
        h += found / n >= 0.5 ? chip("ok", "✅ الجسم ظاهر") : chip("bad", "⚠️ مش شايف جسم دلوقتي");
        if (found / n >= 0.5) h += full / n >= 0.5 ? chip("ok", "✅ الجسم كامل في الكادر") : chip("warn", "⚠️ جزء من الجسم برا الكادر أو مش واضح");
        if (found / n >= 0.5) h += big / n >= 0.5 ? chip("ok", "✅ حجم الجسم مناسب") : chip("warn", "⚠️ الجسم صغير، قرّب شوية");
        if (luma != null) h += luma >= 55 ? chip("ok", "✅ الإضاءة كويسة") : chip("warn", "⚠️ الإضاءة ضعيفة");
      }
      chips.innerHTML = h;
      await new Promise(r2 => setTimeout(r2, 350));
    }
    if (!body.isConnected) finish();
  }

  /* ---------- the scan flow ---------- */
  async function flScan(file, sel, p, prog) {
    const lift = sel.model, exName = sel.ex;
    flClearFail(prog);
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.preload = "auto"; video.src = url;
    const show = (f, txt) => { prog.hidden = false; prog.querySelector(".t span").textContent = txt; prog.querySelector("b").textContent = Math.round(f * 100) + "٪"; prog.querySelector(".tr i").style.width = Math.round(f * 100) + "%"; };
    try {
      await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = () => rej(new Error("video")); setTimeout(res, 4000); });
      if (!video.duration || !isFinite(video.duration)) throw new Error("duration");
      show(0.02, "جاري تجهيز النموذج…");
      await flEnsureModel();
      const fps = /iPhone|iPad|Android/i.test(navigator.userAgent) ? 5 : 6;
      const res = await apTrack(video, fps, (f2, stage) => show(Math.max(0.03, f2), stage === "warming" ? "جاري تجهيز النموذج…" : "جاري تحليل المجموعة…"));
      if (!res.frames.length) {
        const d = res.diag || {}, code = [d.delegate, d.w + "x" + d.h, (d.tries || []).join(","), "err" + (res.errors || []).length].join(" ");
        const blank = (res.errors || []).indexOf("blank-frames") >= 0;
        console.warn("MOFIT form lab: no body found", code, (res.errors || []).slice(0, 3));
        if (blank) flFail(prog, "الفيديو ظاهر أسود", "المتصفح مقدرش يقرا صورة الفيديو. جرّب تصوّر بالكاميرا العادية وارفعه تاني.", code);
        else if (res.errors && res.errors.length) flFail(prog, "التحليل مشتغلش على الجهاز ده", "حصلت مشكلة تقنية. ابعت الكود اللي تحت لمحمد.", code);
        else flFail(prog, "مفيش جسم واضح في الفيديو", "مش قادر أشوف جسم كامل في الفيديو. جرّب الخطوات دي:", code);
        URL.revokeObjectURL(url);
        return;
      }
      const trimmed = flTrimFrames(res.frames, video.duration || 0);
      if (trimmed.frames.length >= 6) {
        const cs = Math.round(trimmed.cutStart), ce = Math.round(trimmed.cutEnd);
        if (cs >= 2 || ce >= 2) toast("✂️ قصّينا " + (cs >= 2 ? "أول " + flN(cs) + " ث " : "") + (cs >= 2 && ce >= 2 ? "و" : "") + (ce >= 2 ? "آخر " + flN(ce) + " ث " : "") + "(الجسم مكنش ظاهر فيهم)");
        res.frames = trimmed.frames;
      }
      const ar = (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : 0.5625;
      const track = { fps: res.fps, ar, frames: res.frames };
      show(0.98, "جاري حساب التقييم…");
      const summary = window.MofitPoseResults ? MofitPoseResults.summarize(track) : { angles: [], reps: null };
      /* rep sanity: drop impossible reps (a rep over 15 s or under 0.5 s is noise) and recompute the totals */
      if (summary.reps && Array.isArray(summary.reps.list)) {
        const good = summary.reps.list.filter(r => { const d = r.t1 - r.t0; return d >= 0.5 && d <= 15; });
        if (good.length !== summary.reps.list.length) {
          const avg = k => { const v = good.map(r => r[k]).filter(x => x != null && isFinite(x) && x < 15); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
          summary.reps = Object.assign({}, summary.reps, { list: good, count: good.length, avgDown: avg("down"), avgUp: avg("up") });
        }
      }
      const analysis = flAnalyze(lift, track, summary);
      show(1, "✓ خلص");
      const repList = (analysis.reps && analysis.reps.list) || [];
      if (!repList.length) toast("اتحلل الفيديو بس متعرفش على عدات واضحة — التقييم من الحركة العامة");
      /* auto-save the metrics row (never the video) */
      const saved = await flSaveScan(p.id, exName, analysis);
      const scanId = saved && saved.data && saved.data.id && !String(saved.data.id).startsWith("local-") ? saved.data.id : null;
      if (saved && saved.error) { console.warn("formlab save", saved.error); toast("⚠️ التحليل ظهر لكن ماتحفظش في السجل — بلّغ المدرب"); }
      if (saved && saved.queued) toast("📴 التحليل اتحفظ على الموبايل وهيتبعت لما النت يرجع");
      const ghosts = await flLoadGhosts();
      const baseOpts = { lift: exName, ghost: ghosts[exName] || null, videoURL: url, track, canGhost: S.me.role === "coach" && !!scanId, scanId };
      const showAnalysis = a => flResultSheet(Object.assign({}, baseOpts, { score: a.score, grade: a.grade, checks: a.checks, metrics: a.metrics, barPath: a.barPath, repList: (a.reps && a.reps.list) || [], angle: a.angle, reanalyze: () => { closeSheet(); showAnalysis(flAnalyze(lift, track, summary)); } }));
      showAnalysis(analysis);
      setTimeout(() => { prog.hidden = true; }, 600);
      flRefreshList(p);
    } catch (e) {
      console.warn("formlab scan", e);
      flFail(prog, "تعذر تحليل الفيديو", "حصلت مشكلة وقت التحليل. جرّب فيديو تاني بالخطوات دي:", String(e && e.message || e));
      URL.revokeObjectURL(url);
    }
  }

  /* ---------- the tab view ---------- */
  async function flRefreshList(p) {
    const host = document.getElementById("flScans"); if (!host) return;
    const isCoach = S.me.role === "coach";
    const [{ rows, error }, ghosts] = await Promise.all([flLoadScans(p.id), flLoadGhosts()]);
    if (error) { host.innerHTML = `<div class="card"><p class="hint">جدول التحليلات لسه مش متجهز (formlab.sql) — التحليل شغال، بس الحفظ هيبقى جاهز أول ما الجدول يتعمل.</p></div>`; return; }
    host.innerHTML = `<div class="card"><div class="card-h"><div class="ic dark">📋</div><h2>التحليلات السابقة<small>${rows.length ? rows.length + " تحليل" : ""}</small></h2></div>
      ${rows.length ? rows.map(r => {
        const L = flLiftOf(r.lift);
        const tone = r.score >= 75 ? "ok" : r.score >= 50 ? "mid" : "bad";
        return `<div class="fl-row" data-id="${r.id}"><span class="fl-score ${tone}">${flN(r.score)}</span>
          <div class="nm"><b>${L.icon} ${flEn(L.label)}${r.is_ghost ? " <span class='fl-ghost'>⭐ الشبح</span>" : ""}${r.metrics && r.metrics.approx ? " <span class='pill acc-soft' style='font-size:.68rem'>≈ تقريبي</span>" : ""}</b><small>${r.reps || 0} عدات · ${flDate(r.created_at)}</small></div>
          ${isCoach ? `<button class="fl-ghostbtn" data-ghost="${r.id}" data-lift="${r.lift}">${r.is_ghost ? "⭐ الشبح الحالي" : "⭐ خلّيها الشبح"}</button>` : ""}</div>`;
      }).join("") : emptyBox("🎥", "مفيش تحليلات لسه", "صوّر أول مجموعة من الجنب والتقييم هيظهر هنا — التحليل على الموبايل والفيديو ما بيترفعش.")}</div>`;
    host.querySelectorAll("[data-ghost]").forEach(b => b.onclick = e => { e.stopPropagation(); if (b.textContent.includes("الحالي")) return; flSetGhost(b.dataset.lift, b.dataset.ghost, b); });
    host.querySelectorAll(".fl-row").forEach(row => row.onclick = () => {
      const r = rows.find(x => x.id === row.dataset.id); if (!r) return;
      const m = r.metrics || {};
      flResultSheet({
        lift: r.lift, score: r.score,
        grade: r.score >= 90 ? { t: "ممتاز 🏆", tone: "ok" } : r.score >= 75 ? { t: "كويس 💪", tone: "ok" } : r.score >= 60 ? { t: "محتاج شغل 🛠", tone: "mid" } : { t: "ركّز على الأساسيات 🎯", tone: "bad" },
        checks: (m.checks || []), metrics: m, ghost: ghosts[r.lift] && ghosts[r.lift].id !== r.id ? ghosts[r.lift] : null,
        barPath: null, repList: [], canGhost: false, scanId: r.id,
      });
    });
  }

  /* ==================================================================
     Posture Lab: front + side photo, on-device, nothing uploaded
     ================================================================== */
  async function flDetectImage(img) {
    const out = { lms: null, w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
    try {
      if (typeof apLandmarker === "undefined" || !apLandmarker) return out;
      const m = Math.max(out.w, out.h), sc = m > 960 ? 960 / m : 1;
      const cv = document.createElement("canvas"); cv.width = Math.max(2, Math.round(out.w * sc)); cv.height = Math.max(2, Math.round(out.h * sc));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      try { apLandmarker.setOptions({ runningMode: "IMAGE" }); } catch (_) {}
      const res = apLandmarker.detect(cv);
      out.lms = (res && res.landmarks && res.landmarks[0]) || null;
    } catch (e) { out.err = String(e && e.message || e); }
    return out;
  }
  const flLoadImg = file => new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => res({ im, u }); im.onerror = () => rej(new Error("image")); im.src = u; });
  const flTone = (v, okMax, midMax) => v <= okMax ? "ok" : v <= midMax ? "mid" : "bad";
  /* front photo checks. lms: [{x,y,visibility}] normalized, ar = width/height */
  function flPostureFront(lms, ar) {
    const g = i => { const p = lms[i]; return p && (p.visibility == null ? 1 : p.visibility) >= 0.4 ? { x: p.x * ar, y: p.y } : null; };
    const deg = (a, b) => { const d = Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI); return d > 90 ? 180 - d : d; };
    const out = [];
    const sL = g(11), sR = g(12), hL = g(23), hR = g(24), nose = g(0), eL = g(7), eR = g(8);
    if (sL && sR) { const t = deg(sL, sR); out.push({ key: "shoulders", label: "استواء الكتفين", val: "ميل " + t.toFixed(1) + "°", tone: flTone(t, 2, 4), pts: 12 }); }
    if (hL && hR) { const t = deg(hL, hR); out.push({ key: "hips", label: "استواء الحوض", val: "ميل " + t.toFixed(1) + "°", tone: flTone(t, 2, 4), pts: 12 }); }
    if (nose && sL && sR) {
      const sw = Math.abs(sL.x - sR.x) || 1, off = Math.abs(nose.x - (sL.x + sR.x) / 2) / sw;
      out.push({ key: "head", label: "الراس فوق الكتفين", val: "إزاحة " + Math.round(off * 100) + "٪ من عرض الكتف", tone: flTone(off, 0.1, 0.2), pts: 10 });
    }
    if (eL && eR) { const t = deg(eL, eR); out.push({ key: "headtilt", label: "ميل الراس", val: "ميل " + t.toFixed(1) + "°", tone: flTone(t, 3, 6), pts: 6 }); }
    const knee = (h, k, a) => { if (!h || !k || !a) return null; const len = Math.hypot(a.x - h.x, a.y - h.y) || 1, t = (k.y - h.y) / ((a.y - h.y) || 1), lx = h.x + (a.x - h.x) * t; return { dev: (k.x - lx) / len, side: k.x }; };
    const kL = knee(g(23), g(25), g(27)), kR = knee(g(24), g(26), g(28));
    if (kL || kR) {
      const dv = [kL, kR].filter(Boolean).map(k => Math.abs(k.dev)), m = Math.max(...dv);
      out.push({ key: "knees", label: "استقامة الركبتين", val: "انحراف " + Math.round(m * 100) + "٪ من طول الرجل", tone: flTone(m, 0.04, 0.08), pts: 10 });
    }
    return out;
  }
  /* side photo checks */
  function flPostureSide(lms, ar) {
    const g = i => { const p = lms[i]; return p && (p.visibility == null ? 1 : p.visibility) >= 0.4 ? { x: p.x * ar, y: p.y, v: p.visibility == null ? 1 : p.visibility } : null; };
    const out = [];
    const useL = ((lms[7] && lms[7].visibility) || 0) + ((lms[11] && lms[11].visibility) || 0) >= ((lms[8] && lms[8].visibility) || 0) + ((lms[12] && lms[12].visibility) || 0);
    const ear = g(useL ? 7 : 8), sh = g(useL ? 11 : 12), hip = g(useL ? 23 : 24), ank = g(useL ? 27 : 28), nose = g(0);
    if (ear && sh) {
      const dir = nose ? Math.sign(nose.x - ear.x) || 1 : 1;
      const cva = Math.atan2(sh.y - ear.y, Math.abs(ear.x - sh.x)) * 180 / Math.PI, fwd = (ear.x - sh.x) * dir;
      out.push({ key: "fhead", label: "الراس لقدام", val: "زاوية الرقبة " + Math.round(cva) + "° (تقريبي)" + (fwd <= 0 ? " · الراس فوق الكتف" : ""), tone: cva >= 52 || fwd <= 0 ? "ok" : cva >= 46 ? "mid" : "bad", pts: 16 });
      if (hip) {
        const tr = Math.hypot(sh.x - hip.x, sh.y - hip.y) || 1, so = (sh.x - hip.x) * dir / tr;
        out.push({ key: "shoulder", label: "الكتف قدام الحوض", val: "إزاحة " + Math.round(so * 100) + "٪ من طول الجذع", tone: so <= 0.08 ? "ok" : so <= 0.16 ? "mid" : "bad", pts: 10 });
      }
    }
    if (hip && ank && sh) {
      const tr = Math.hypot(sh.x - hip.x, sh.y - hip.y) || 1, lean = Math.abs((sh.x - ank.x)) / tr;
      out.push({ key: "plumb", label: "الوقفة على خط الجاذبية", val: "الكتف بعيد " + Math.round(lean * 100) + "٪ عن خط الكعب", tone: flTone(lean, 0.12, 0.25), pts: 8 });
    }
    return out;
  }
  const FL_DRILLS = {
    fhead: { t: "تمارين الرقبة والضهر العلوي", s: ["تراجع الذقن (Chin Tucks): ٢×١٠ ببطء", "ملائكة الحيطة (Wall Angels): ٢×١٠", "تمدد الصدر عند الباب: ٢×٣٠ ثانية"] },
    shoulder: { t: "فتح الصدر وتقوية الضهر", s: ["تمدد الصدر عند الباب: ٢×٣٠ ثانية", "سحب الكتف للخلف (Band Pull-Apart): ٢×١٥", "ملائكة الحيطة: ٢×١٠"] },
    shoulders: { t: "توازن الكتفين", s: ["تمدد جانب الرقبة: ٢×٣٠ ثانية لكل جنب", "شراغ كتف بتحكم: ٢×١٠", "شيل شنطة/دمبل في إيد واحدة وامشي ٣٠ ثانية لكل إيد"] },
    hips: { t: "توازن الحوض", s: ["جسر الأرداف (Glute Bridge): ٢×١٢", "وقفة على رجل واحدة: ٣٠ ثانية لكل رجل", "تمدد الفخذ من قدام: ٢×٣٠ ثانية"] },
    head: { t: "وضع الراس", s: ["تراجع الذقن: ٢×١٠", "تمدد جانب الرقبة: ٢×٣٠ ثانية", "قف قدام المراية وظبّط الراس في النص ٣٠ ثانية"] },
    headtilt: { t: "وضع الراس", s: ["تمدد جانب الرقبة: ٢×٣٠ ثانية لكل جنب", "قف قدام المراية وظبّط الراس ٣٠ ثانية"] },
    knees: { t: "ثبات الركبة", s: ["جسر الأرداف بشريط حول الركبة: ٢×١٢", "خطوة جانبية بشريط: ٢×١٠ لكل جنب", "سكوات بوزن الجسم قدام المراية: ٢×١٠"] },
    plumb: { t: "الوقفة المتزنة", s: ["قف ضهرك للحيطة: كعب وحوض وكتف وراس يلمسوها ٣٠ ثانية", "مشي بتحكم وانت ماسك الجسم طويل: ٢ دقيقة"] },
  };
  function flPostureResult(front, side) {
    const checks = [].concat(front || [], side || []);
    if (!checks.length) return null;
    const lost = checks.reduce((a, c) => a + (c.tone === "ok" ? 0 : c.tone === "mid" ? Math.round(c.pts / 2) : c.pts), 0);
    const score = Math.max(10, Math.min(100, 100 - lost));
    const worst = checks.filter(c => c.tone !== "ok").sort((a, b) => (b.tone === "bad") - (a.tone === "bad") || b.pts - a.pts)[0] || null;
    return { score, checks, worst, drill: worst ? FL_DRILLS[worst.key] : null };
  }
  function flPostureHist(cid) { try { return JSON.parse(localStorage.getItem("mofit_posture_" + cid) || "[]"); } catch (_) { return []; } }
  function flPostureSaveHist(cid, r, hasF, hasS) {
    const h = flPostureHist(cid); h.push({ t: Date.now(), score: r.score, f: hasF, s: hasS }); try { localStorage.setItem("mofit_posture_" + cid, JSON.stringify(h.slice(-12))); } catch (_) {}
    return h.slice(-12);
  }
  async function flViewPosture(el, p) {
    flCss();
    const st = { front: null, side: null };
    el.innerHTML = `<div class="card dark hero"><div class="card-h"><div class="ic">🧍</div><h2>معمل القوام <small style="display:block">صورتين، والتطبيق يقيس وقفتك على موبايلك</small></h2></div>
        <p class="hero-sub">صوّر نفسك من قدام ومن الجنب والتطبيق يقيس ميل الكتفين والحوض ووضع الراس واستقامة الركبتين ويديك تقييم من ١٠٠ وتمرين ٥ دقايق. الصور ما بتترفعش.</p></div>
      <div class="card"><div class="fl-pz">
        <div class="fl-pslot" data-k="front"><b>🧍 صورة من قدام</b><small>واقف عادي، الجسم كامل، الإيدين جنبك</small><div class="fl-pph" id="flPzFront"></div><button class="btn primary" data-pick="front">📷 صوّر أو اختار صورة</button></div>
        <div class="fl-pslot" data-k="side"><b>↔️ صورة من الجنب</b><small>واقف عادي، الجسم كامل، بصّ لقدام</small><div class="fl-pph" id="flPzSide"></div><button class="btn primary" data-pick="side">📷 صوّر أو اختار صورة</button></div></div>
        <input type="file" id="flPzFile" accept="image/*" class="hidden">
        <p class="hint" style="margin-top:8px">📌 الموبايل ثابت على مستوى الوسط، من بعيد ٢ لـ ٣ متر، إضاءة كويسة، لبس ضيق شوية. تقدر تحلل بصورة واحدة بس الصورتين أدق.</p>
        <button class="btn primary block" id="flPzGo" disabled>🔍 حلّل القوام</button>
        <div class="fl-prog" id="flPzProg" hidden><div class="t"><span>جاري التحليل…</span><b></b></div></div></div>
      <div id="flPzOut"></div>`;
    let target = null; const fileIn = el.querySelector("#flPzFile"), go = el.querySelector("#flPzGo"), out = el.querySelector("#flPzOut"), prog = el.querySelector("#flPzProg");
    const sync = () => { go.disabled = !(st.front || st.side); };
    el.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { target = b.dataset.pick; fileIn.click(); });
    fileIn.onchange = async () => {
      const f = fileIn.files && fileIn.files[0]; fileIn.value = ""; if (!f || !target) return;
      const k = target, ph = el.querySelector(k === "front" ? "#flPzFront" : "#flPzSide");
      ph.innerHTML = `<span class="hint">بيتحمّل…</span>`;
      try {
        const { im, u } = await flLoadImg(f);
        await flEnsureModel();
        const d = await flDetectImage(im);
        st[k] = { url: u, w: d.w, h: d.h, lms: d.lms };
        ph.innerHTML = `<div class="fl-pimg"><img src="${u}"><canvas></canvas></div>${d.lms ? `<small class="hint">✅ الجسم ظاهر</small>` : `<small class="hint" style="color:#B91C1C">⚠️ مش شايف جسم في الصورة دي، جرّب صورة أوضح والجسم كامل</small>`}`;
        const cv = ph.querySelector("canvas"); cv.width = d.w; cv.height = d.h;
        if (d.lms) { const c = cv.getContext("2d"); c.lineWidth = Math.max(3, d.w / 150); c.strokeStyle = "#22C55E"; c.fillStyle = "#F97316"; FL_EDGES.forEach(([a, b]) => { const A = d.lms[a], B = d.lms[b]; if (!A || !B || (A.visibility ?? 1) < 0.4 || (B.visibility ?? 1) < 0.4) return; c.beginPath(); c.moveTo(A.x * d.w, A.y * d.h); c.lineTo(B.x * d.w, B.y * d.h); c.stroke(); }); }
        if (!d.lms) st[k].lms = null;
      } catch (e) { ph.innerHTML = `<small class="hint" style="color:#B91C1C">تعذر قراءة الصورة. جرّب صورة تانية. (${flEsc(String(e && e.message || e))})</small>`; st[k] = null; }
      sync();
    };
    go.onclick = () => {
      const f = st.front && st.front.lms ? flPostureFront(st.front.lms, st.front.w / st.front.h) : null;
      const s = st.side && st.side.lms ? flPostureSide(st.side.lms, st.side.w / st.side.h) : null;
      const r = flPostureResult(f, s);
      if (!r) { out.innerHTML = `<div class="card"><b style="color:#B91C1C">مقدرناش نقيس القوام</b><p class="hint">مفيش جسم واضح في الصور. صوّر والجسم كامل من الراس للرجلين، إضاءة كويسة، وخلفية بسيطة.</p></div>`; return; }
      const hist = flPostureSaveHist(p.id, r, !!f, !!s);
      const prev = hist.length > 1 ? hist[hist.length - 2] : null;
      const tone = r.score >= 75 ? "ok" : r.score >= 50 ? "mid" : "bad";
      out.innerHTML = `<div class="card"><div class="fl-hero-score">${ring(r.score, 100, { size: 110, stroke: 11, label: flN(r.score), sub: "من ١٠٠", color: tone === "ok" ? "#22C55E" : tone === "mid" ? "#FACC15" : "#F43F5E" })}
          <div class="gv"><b>تقييم القوام</b><small class="hint">${f && s ? "من الصورتين" : f ? "من صورة القدام بس — ضيف صورة الجنب لتقييم الراس والكتف" : "من صورة الجنب بس — ضيف صورة القدام لتقييم الكتفين والحوض والركبة"}${prev ? " · المرة اللي فاتت " + flN(prev.score) : ""}</small></div></div>
        ${r.checks.map(c => `<div class="fl-check"><span class="fl-dot ${c.tone}"></span><div class="fl-cb"><b>${flEsc(c.label)}</b><small>${flEsc(c.val)}</small></div>${c.tone === "ok" ? `<b style="color:#15803D">✓</b>` : `<b style="color:#BE123C">-${c.tone === "mid" ? Math.round(c.pts / 2) : c.pts}</b>`}</div>`).join("")}
        ${r.drill ? `<div class="fl-approx" style="margin-top:10px"><b>🧘 تمرين ٥ دقايق يوميًا: ${flEsc(r.drill.t)}</b><ul style="margin:6px 18px 0">${r.drill.s.map(x => `<li>${flEsc(x)}</li>`).join("")}</ul><small class="hint">صوّر تاني بعد أسبوعين وقارن.</small></div>` : `<div class="fl-approx" style="margin-top:10px">🎉 قوامك كويس في اللي اتقاس. حافظ على حركتك وصوّر كل شهر تتابع.</div>`}
        ${hist.length > 1 ? `<div class="hint" style="margin-top:8px">📈 آخر ${hist.length} مرات: ${hist.map(x => flN(x.score)).join(" ← ")}</div>` : ""}
        <p class="fl-note">⚠️ ده تقدير من صورة موبايل عادية، بيقيس زوايا وإزاحات بس. بيتابع التغيير مع الوقت، مش تشخيص طبي، ومش بيقيس ميل الحوض للأمام أو الخلف. لو عندك ألم مستمر، كلّم الكوتش أو دكتور.</p></div>`;
    };
  }

  async function flViewExercise(el) {
    flCss();
    const p = S.client; if (!p) { el.innerHTML = ""; return; }
    const isCoach = S.me.role === "coach";
    S.formLift = S.formLift || "squat";
    S.formEx = S.formEx || FL_CANON[S.formLift];
    /* full exercise library, grouped by muscle, English names (translate-proof) */
    const exNames = Object.keys(window.EXDB || {}).sort();
    const groups = {};
    exNames.forEach(n => { const m = (typeof muscleOf === "function" ? muscleOf(n) : "أخرى"); (groups[m] = groups[m] || []).push(n); });
    const gOrder = ["أمامية", "صدر", "ضهر", "أكتاف", "باي", "تراي", "خلفية/أرداف", "سمانة", "بطن", "أخرى"].filter(g => groups[g]);
    const exBtn = n => { const mdl = flModelFor(n); return `<button class="fl-ex ${S.formEx === n ? "on" : ""}" data-ex="${flEsc(n)}">${flEn(n)}<i class="fl-mdl">${mdl === "generic" ? "≈ تقريبي" : "🎯 مفصّل"}</i></button>`; };
    const exListHTML = q => {
      const f = (q || "").trim().toUpperCase();
      return gOrder.map(g => {
        const items = groups[g].filter(n => !f || n.includes(f));
        return items.length ? `<div class="fl-exg">${g} · ${items.length}</div><div class="fl-exs">${items.map(exBtn).join("")}</div>` : "";
      }).join("") || `<p class="hint" style="margin:8px 2px">مفيش تمرين بالاسم ده — جرّب اسم تاني بالإنجليزي.</p>`;
    };
    const selHTML = () => { const mdl = flModelFor(S.formEx); return `التمرين: ${flEn(S.formEx)} ${mdl === "generic" ? `<span class="pill acc-soft">≈ تحليل تقريبي</span>` : `<span class="pill acc">🎯 تحليل مفصّل</span>`}`; };
    el.innerHTML = `
      <div class="card dark hero"><div class="card-h"><div class="ic">🧪</div><h2>معمل الفورم<small>تحليل الأداء بالذكاء الاصطناعي — على موبايلك</small></h2></div>
        <p class="hero-sub">صوّر مجموعة من الجنب 📱 والتطبيق يحسب زوايا المفاصل ومسار البار ويديك تقييم MOFIT من ١٠٠، وتقارن نفسك بـ👻 شبح الكوتش المثالي. الفيديو ما بيترفعش — التحليل كله على جهازك.</p></div>
      <div class="card"><div class="card-h"><div class="ic acc">🎥</div><h2>${isCoach ? "تحليل جديد للعميل" : "تحليل جديد"}</h2></div>
        <div class="fl-lifts"><div class="fl-lifts-t" id="flLifts">${FL_QUICK.map(k => [k, FL_LIFTS[k]]).map(([k, L]) => `<button class="fl-lift ${S.formLift === k ? "on" : ""}" data-lift="${k}" data-ex="${FL_CANON[k]}">${L.icon} ${flEn(L.label)}</button>`).join("")}</div></div>
        <details class="fl-exwrap" id="flExWrap"><summary>📚 كل التمارين (${exNames.length}) — اختار أي حركة من المكتبة</summary>
          <input class="fl-exq" id="flExQ" inputmode="search" placeholder="🔍 دوّر بالاسم الإنجليزي…" translate="no" lang="en">
          <div class="fl-exlist" id="flExList">${exListHTML("")}</div></details>
        <div class="fl-sel" id="flSel">${selHTML()}</div>
        <button class="btn primary block" id="flPick">🎥 صوّر أو ارفع فيديو المجموعة</button>
        <input type="file" id="flFile" accept="video/*" class="hidden">
        <p class="hint" style="margin-top:8px">📌 لأحسن نتيجة: الموبايل ثابت من الجنب · الجسم كامل في الكادر · إضاءة كويسة · ٣ لـ ٥ عدات. التمارين اللي عليها ≈ تقييمها تقريبي من الحركة العامة.</p>
        <div class="fl-prog" id="flProg" hidden><div class="t"><span>جاري التحليل…</span><b>0٪</b></div><div class="tr"><i></i></div></div></div>
      <div id="flScans"><div class="card"><p class="hint">بيحمّل التحليلات…</p></div></div>`;
    const syncSel = () => {
      el.querySelector("#flSel").innerHTML = selHTML();
      el.querySelectorAll("[data-lift]").forEach(x => x.classList.toggle("on", x.dataset.lift === S.formLift));
      el.querySelectorAll("[data-ex]").forEach(x => x.classList.toggle("on", x.dataset.ex === S.formEx));
    };
    el.querySelectorAll("[data-lift]").forEach(b => b.onclick = () => { S.formLift = b.dataset.lift; S.formEx = b.dataset.ex; syncSel(); });
    const bindEx = () => el.querySelectorAll("#flExList [data-ex]").forEach(b => b.onclick = () => {
      S.formEx = b.dataset.ex; S.formLift = flModelFor(S.formEx); syncSel();
      const d = el.querySelector("#flExWrap"); if (d) d.open = false;
    });
    bindEx();
    el.querySelector("#flExQ").addEventListener("input", e => { el.querySelector("#flExList").innerHTML = exListHTML(e.target.value); bindEx(); });
    const file = el.querySelector("#flFile"), prog = el.querySelector("#flProg");
    el.querySelector("#flPick").onclick = () => file.click();
    file.onchange = () => { const f = file.files && file.files[0]; file.value = ""; if (f) flPrecheck(f, { model: S.formLift, ex: S.formEx }, p, prog); };
    flRefreshList(p);
  }
  window.viewFormLab = async function viewFormLab(el) {
    flCss();
    const p = S.client; if (!p) { el.innerHTML = ""; return; }
    S.formMode = S.formMode || "ex";
    el.innerHTML = `<div class="fl-modes"><button type="button" data-m="ex">🏋️ تمرين</button><button type="button" data-m="pose">🧍 قوام</button></div><div id="flModeBody"></div>`;
    const draw = () => {
      el.querySelectorAll(".fl-modes [data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === S.formMode));
      const body = el.querySelector("#flModeBody");
      if (S.formMode === "pose") flViewPosture(body, p); else flViewExercise(body);
    };
    el.querySelectorAll(".fl-modes [data-m]").forEach(b => b.onclick = () => { S.formMode = b.dataset.m; draw(); });
    draw();
  };
})();
