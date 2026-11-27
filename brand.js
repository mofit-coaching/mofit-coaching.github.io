/* ======================================================================
   MOFIT Living Brand (brand-*) — البراند الحي
   The app's accent mood follows the client's real day (see brand.css):
     fight    — today is a scheduled training day (todayDayNo from the
                client's own program; rest of the app uses the same helper)
     recovery — a rest day
     pr       — a logged e1RM record was broken this week, same rule as the
                existing "ملخص أسبوعك" card (best weekly e1RM per exercise,
                > 0.5% over the previous best). Real logs only, nothing
                invented; no PR found = no gold.
   Applied as body[data-mood] plus a small pill in the header. Client views
   only: the coach's own home (no client open) keeps the default orange.
   Also owns the shared, per-client data cache (moLoad*) that the MO Method
   card (momethod.js) reads, and calls window.moAfterRender after each
   render so feature cards can mount without touching views.js.
   Scoped: window.moLoadSets/moLoadSessions/moLoadScans + moAfterRender hook
   + lb* only. No DB writes.
   ====================================================================== */
(function () {
  "use strict";

  const LB_MOODS = {
    fight:    { label: "يوم قتال 🔥",      sub: "النهارده يوم تمرين – يلا نكسرها" },
    recovery: { label: "يوم استشفاء 😴",    sub: "الراحة جزء من التطور" },
    pr:       { label: "أسبوع الأرقام 🏆",  sub: "واحد أو أكتر من تمارينك كسر رقمه الأسبوع ده" },
  };

  let lbPR = false;          // a record was broken this week (from real set_logs)
  let lbPRcid = null;        // which client that PR state belongs to
  let lbPRCheckedFor = null; // client id the PR check already ran for

  /* ---------- shared per-client data cache (used by momethod.js too) ---------- */
  const lbCache = { cid: null, sets: null, sessions: null, scans: null };
  function lbCacheFor(cid) {
    if (lbCache.cid !== cid) { lbCache.cid = cid; lbCache.sets = lbCache.sessions = lbCache.scans = null; }
    return lbCache;
  }
  window.moLoadSets = function (cid) {
    const c = lbCacheFor(cid);
    if (!c.sets) c.sets = sb.from("set_logs").select("exercise_id,week,reps,weight,rir")
      .eq("client_id", cid).then(r => r.data || []).catch(() => []);
    return c.sets;
  };
  window.moLoadSessions = function (cid) {
    const c = lbCacheFor(cid);
    if (!c.sessions) c.sessions = sb.from("workout_sessions").select("log_date,day_no")
      .eq("client_id", cid).gte("log_date", addDays(today(), -27))
      .then(r => r.data || []).catch(() => []);
    return c.sessions;
  };
  window.moLoadScans = function (cid) {
    const c = lbCacheFor(cid);
    if (!c.scans) c.scans = sb.from("form_scans").select("lift,score,created_at")
      .eq("client_id", cid).eq("is_ghost", false).order("created_at", { ascending: false }).limit(60)
      .then(r => r.data || []).catch(() => []);
    return c.scans;
  };

  /* ---------- mood ---------- */
  function lbBaseMood() {
    try {
      if (!S.client || !S.me) return null;            // coach home with no client open
      if (S.me.role === "assistant") return null;
      const dn = typeof todayDayNo === "function" ? todayDayNo() : null;
      return dn ? "fight" : "recovery";
    } catch (e) { return null; }
  }

  /* same PR rule as views.js weekRecapHTML: this week's best e1RM per exercise
     beats the previous all-time best by more than 0.5% */
  function lbHasPR(sets, wk) {
    const cur = sets.filter(x => x.week === wk && logged(x));
    if (!cur.length) return false;
    const bestBy = rows => { const m = {}; rows.forEach(x => { const v = e1rm(x) || 0; if (v > (m[x.exercise_id] || 0)) m[x.exercise_id] = v; }); return m; };
    const nowB = bestBy(cur), before = bestBy(sets.filter(x => x.week < wk && logged(x)));
    return Object.keys(nowB).some(k => before[k] > 0 && nowB[k] > before[k] * 1.005);
  }

  async function lbCheckPR() {
    try {
      const c = S.client;
      if (!c || lbPRCheckedFor === c.id) return;
      lbPRCheckedFor = c.id;
      const wk = currentWeek(c);
      const sets = await window.moLoadSets(c.id);
      if (lbHasPR(sets, wk)) { lbPR = true; lbPRcid = c.id; if (S.client && S.client.id === c.id) lbApply(); }
    } catch (e) { /* mood stays at the base state */ }
  }

  function lbApply() {
    const base = lbBaseMood();
    if (!base) { document.body.removeAttribute("data-mood"); return; }
    const mood = (lbPR && S.client && lbPRcid === S.client.id) ? "pr" : base;
    document.body.dataset.mood = mood;
    lbPill(mood);
  }

  function lbPill(mood) {
    const row = document.querySelector("#top .top-row");
    if (!row) return;
    let pill = row.querySelector(".brand-mood");
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "pill brand-mood";
      pill.setAttribute("dir", "rtl");
      row.insertBefore(pill, row.querySelector(".sp") || null);
    }
    pill.textContent = LB_MOODS[mood].label;
    pill.title = LB_MOODS[mood].sub;
  }

  /* ---------- hook into the app render cycle without touching views.js ---------- */
  if (typeof window.render === "function") {
    const lbRender = window.render;
    window.render = function () {
      const r = lbRender.apply(this, arguments);
      try { lbApply(); lbCheckPR(); } catch (e) { }
      try { if (window.moAfterRender) window.moAfterRender(); } catch (e) { }
      return r;
    };
  }
  /* the first render usually lands before this file runs — catch up */
  if (document.querySelector("#top .top-row")) { lbApply(); lbCheckPR(); }
  if (window.moAfterRender) { try { window.moAfterRender(); } catch (e) { } }
})();
