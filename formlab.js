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
  };
  /* quick chips stay the original four big lifts (the full library picker
     below covers everything else) */
  const FL_QUICK = ["squat", "deadlift", "bench", "ohp"];
  /* canonical library exercise for each dedicated model */
  const FL_CANON = { squat: "BACK SQUAT", deadlift: "CONVENTIONAL DEADLIFT", bench: "FLAT BB BENCH PRESS", ohp: "STANDING OVERHEAD PRESS", hpress: "DB BENCH PRESS", vpress: "DB SHOULDER PRESS", row: "ONE-ARM DB ROW", pulldown: "LAT PULLDOWN", hinge: "ROMANIAN DEADLIFT", lunge: "BULGARIAN SPLIT SQUAT" };
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
    [/ROW$|ROW MACHINE$|^SA ISO LAT ROW MACHINE$/, "row"],
    /* hinge family */
    [/ROMANIAN DEADLIFT$|^STIFF-LEG DEADLIFT$|^GOOD MORNING/, "hinge"],
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
  function flAnalyze(lift, track, summary) {
    const frames = flFrames(track);
    const reps = summary.reps || null;
    const FL_CHECK = { squat: flChecksSquat, deadlift: flChecksDeadlift, bench: flChecksBench, ohp: flChecksOhp, hpress: flChecksHPress, vpress: flChecksVPress, row: flChecksRow, pulldown: flChecksPulldown, hinge: flChecksHinge, lunge: flChecksLunge };
    const checks = (FL_CHECK[lift] || flChecksGeneric)(frames, reps, summary);
    const lost = checks.reduce((a, c) => a + c.pts, 0);
    let score = Math.max(5, Math.min(100, 100 - lost));
    if (lift === "generic") score = Math.min(score, 85); /* approximate model: honest cap */
    const grade = score >= 90 ? { t: "ممتاز 🏆", tone: "ok" } : score >= 75 ? { t: "كويس 💪", tone: "ok" } : score >= 60 ? { t: "محتاج شغل 🛠", tone: "mid" } : { t: "ركّز على الأساسيات 🎯", tone: "bad" };
    const bp = flBarPath(frames, lift);
    const metrics = {
      v: 1, lift,
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
    return { score, grade, checks, metrics, barPath: bp, frames };
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
.fl-vid canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.fl-note{font-size:.75rem;color:var(--slate);line-height:1.7;margin-top:10px}
.fl-barpath{background:var(--navy,#0F172A);border-radius:16px;padding:10px;margin-top:10px}
.fl-barpath svg{width:100%;display:block}
`; document.head.appendChild(st);
  }

  function flLoadScript(src) {
    return new Promise((res, rej) => {
      const sc = document.createElement("script");
      sc.src = src + "?v=formlab-20261127"; sc.onload = res; sc.onerror = rej;
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
      ${flGhostBox(o.lift, o.metrics, o.ghost)}
      <div class="card" style="box-shadow:none;border:1px solid var(--soft2,#EEF2F7)"><div class="card-h"><div class="ic acc">✅</div><h2>تفاصيل التقييم</h2></div>
        ${checks.map(c => `<div class="fl-check"><span class="fl-dot ${c.tone}"></span><div class="fl-cb"><b>${flEsc(c.label)}</b><small>${flEsc(c.val)}</small>${c.tip && c.tone !== "ok" ? `<span class="fl-ct">💡 ${flEsc(c.tip)}</span>` : ""}</div>${c.pts ? `<b style="color:#BE123C">-${c.pts}</b>` : `<b style="color:#15803D">✓</b>`}</div>`).join("")}</div>
      ${o.barPath ? flBarPathSVG(o.barPath, o.lift) : ""}
      ${repList.length ? `<div class="card" style="box-shadow:none;border:1px solid var(--soft2,#EEF2F7);margin-top:10px"><div class="card-h"><div class="ic dark">🔁</div><h2>العدات (${repList.length})</h2></div><div class="fl-reps">
        ${repList.map((r, i) => `<div class="fl-rep" data-t="${r.t0}"><span class="n">${i + 1}</span><div><b>عمق ${flN(r.bottom)}°</b> <small>· نزول ${flN(r.down, 1)} ث · طلوع ${flN(r.up, 1)} ث · ${flN(r.dur, 1)} ث</small></div></div>`).join("")}</div></div>` : ""}
      <div id="flVidHost"></div>
      <div class="row" style="margin-top:12px;gap:8px">
        ${o.track && window.MofitPoseResults ? `<button class="btn navy grow" id="flDeep">📊 التحليل الكامل (عزوم وزوايا)</button>` : ""}
        ${o.canGhost ? `<button class="btn grow" id="flGhost" style="border:1.5px solid #FDE68A;background:#FFFBEB;color:#92400E;font-weight:800">⭐ خلّي دي الشبح المثالي</button>` : ""}
      </div>
      <p class="fl-note">⚠️ التقييم استرشادي من زاوية تصوير واحدة وبيكمّل عين الكوتش — مش تشخيص طبي. لو حاسس بألم في أي تمرين، وقّف وكلّم الكوتش. الفيديو ما بيترفعش ولا بيتحفظ — بيتم التحليل على موبايلك وبيتشال.</p>`);
    if (o.track && window.MofitPoseResults) body.querySelector("#flDeep").onclick = () => MofitPoseResults.open(o.track, { onSeek: t => { const v = body.querySelector("video"); if (v) v.currentTime = t; } });
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

  /* ---------- the scan flow ---------- */
  async function flScan(file, sel, p, prog) {
    const lift = sel.model, exName = sel.ex;
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
      if (!res.frames.length) { show(1, "مفيش جسم واضح"); toast("مفيش جسم واضح في الفيديو — صوّر الجسم كامل من الجنب"); return; }
      const ar = (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : 0.5625;
      const track = { fps: res.fps, ar, frames: res.frames };
      show(0.98, "جاري حساب التقييم…");
      const summary = window.MofitPoseResults ? MofitPoseResults.summarize(track) : { angles: [], reps: null };
      const analysis = flAnalyze(lift, track, summary);
      show(1, "✓ خلص");
      const repList = (summary.reps && summary.reps.list) || [];
      if (!repList.length) toast("اتحلل الفيديو بس متعرفش على عدات واضحة — التقييم من الحركة العامة");
      /* auto-save the metrics row (never the video) */
      const saved = await flSaveScan(p.id, exName, analysis);
      const scanId = saved && saved.data && saved.data.id && !String(saved.data.id).startsWith("local-") ? saved.data.id : null;
      if (saved && saved.queued) toast("📴 التحليل اتحفظ على الموبايل وهيتبعت لما النت يرجع");
      const ghosts = await flLoadGhosts();
      flResultSheet({
        lift: exName, score: analysis.score, grade: analysis.grade, checks: analysis.checks, metrics: analysis.metrics,
        barPath: analysis.barPath, repList, ghost: ghosts[exName] || null,
        videoURL: url, track, canGhost: S.me.role === "coach" && !!scanId, scanId,
      });
      setTimeout(() => { prog.hidden = true; }, 600);
      flRefreshList(p);
    } catch (e) {
      console.warn("formlab scan", e);
      prog.hidden = true;
      toast("تعذر تحليل الفيديو — اتأكد إنه فيديو واضح وجرب تاني");
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

  window.viewFormLab = async function viewFormLab(el) {
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
    file.onchange = () => { const f = file.files && file.files[0]; file.value = ""; if (f) flScan(f, { model: S.formLift, ex: S.formEx }, p, prog); };
    flRefreshList(p);
  };
})();
