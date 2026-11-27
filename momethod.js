/* ======================================================================
   The MO Method (mo-*) — نظام MO FIT وتقييم العميل
   A named MO FIT system card on the client Home (under تقدمك): the MO Score
   /100 built ONLY from the client's real logged data — nothing invented:
     الالتزام   consistency — workout_sessions in the last 28 days vs the
                sessions scheduled by the client's own program (days/week × 4)
     التقدّم   progression — share of active exercises whose best estimated
                1RM (RIR-adjusted Epley, the app's own e1rm()) in the last 2
                weeks beats their previous best by > 0.5%
     الفورم    form — average of the latest Form Lab score per lift
                (form_scans, non-ghost). Missing scans = component hidden,
                not faked.
   MO Score = weighted mean of the available components (weights shown in
   the card). A component with no data is shown as "—" with how to unlock
   it; if nothing exists yet the whole card stays hidden.
   No DB writes. No changes to any program. Scoped: window.moAfterRender +
   mo* only. Mounts via brand.js's render hook, so views.js is untouched.
   ====================================================================== */
(function () {
  "use strict";

  let moBusy = false;

  /* ---------- component scores (0..100 or null) ---------- */
  function moConsistency(p, sessions) {
    const days = [...new Set((S.program || []).map(e => e.day_no))].length;
    if (!days) return null;
    const expected = days * 4; // 28 days
    if (!expected) return null;
    const done = (sessions || []).length;
    if (!done && currentWeek(p) < 2) return null; // brand-new client: no card yet
    return Math.min(100, Math.round((done / expected) * 100));
  }

  function moProgression(sets) {
    const L = (sets || []).filter(logged);
    if (!L.length) return null;
    const wk = Math.max(...L.map(s => +s.week || 0));
    const recent = L.filter(s => s.week >= wk - 1), prior = L.filter(s => s.week < wk - 1);
    const bestBy = rows => { const m = {}; rows.forEach(x => { const v = e1rm(x) || 0; if (v > (m[x.exercise_id] || 0)) m[x.exercise_id] = v; }); return m; };
    const rB = bestBy(recent), pB = bestBy(prior);
    const both = Object.keys(rB).filter(k => pB[k] > 0);
    if (both.length < 2) return null; // needs 2+ exercises with an earlier record
    const improved = both.filter(k => rB[k] > pB[k] * 1.005).length;
    return Math.round((improved / both.length) * 100);
  }

  function moForm(scans) {
    if (!scans || !scans.length) return null;
    const latest = {}; // newest scan per lift (rows arrive newest-first)
    scans.forEach(s => { if (!(s.lift in latest) && typeof s.score === "number") latest[s.lift] = s.score; });
    const vals = Object.values(latest);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, v) => a + v, 0) / vals.length);
  }

  function moTier(score) {
    if (score >= 80) return "نخبة MO FIT 🏆";
    if (score >= 60) return "ثابت وقوي 🔥";
    if (score >= 40) return "على الطريق الصح 🚶";
    return "لسه بنبدأ 💪";
  }

  /* ---------- card ---------- */
  function moBar(label, val, offHint) {
    if (val === null || val === undefined) {
      return `<div class="mo-row mo-off"><div class="mo-lab"><span>${label}</span><span class="mo-val">—</span></div>
        <div class="mo-bar"><i style="width:0%"></i></div><span class="mo-hint">${offHint}</span></div>`;
    }
    return `<div class="mo-row"><div class="mo-lab"><span>${label}</span><span class="mo-val num">${val}/100</span></div>
      <div class="mo-bar"><i style="width:${Math.max(2, Math.min(100, val))}%"></i></div></div>`;
  }

  function moCardHTML(p, cons, prog, form) {
    const parts = [[cons, 0.4], [prog, 0.3], [form, 0.3]].filter(([v]) => v !== null && v !== undefined);
    if (!parts.length) return "";
    const wSum = parts.reduce((a, [, w]) => a + w, 0);
    const score = Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / wSum);
    const hasForm = form !== null && form !== undefined;
    return `<div class="card mo-card">
      <div class="card-h"><div class="ic acc">🧬</div><h2><span class="mo-word" translate="no" lang="en">The MO Method</span><small>تقييم <span class="mo-word" translate="no" lang="en">MO <b>FIT</b></span> من بياناتك الفعلية بس</small></h2>
        <span class="pill acc">${moTier(score)}</span></div>
      <div class="mo-main">
        <div class="mo-score"><div class="mo-num num" translate="no" lang="en">${score}</div><div class="mo-of" translate="no" lang="en">MO Score / 100</div></div>
        <div class="mo-bars">
          ${moBar("📅 الالتزام", cons, "سجّل حضورك في التمرين عشان يتفعّل")}
          ${moBar("📈 التقدّم", prog, "بيحتاج تمرينين على الأقل ليهم سجل من أسبوعين فاتوا")}
          ${moBar("🎯 الفورم", form, "صوّر سيت في <span translate='no' lang='en'>Form Lab</span> عشان يتفعّل")}
        </div>
      </div>
      <details class="mo-how"><summary>إزاي بيتحسب الرقم ده؟</summary>
        <ul>
          <li><b>الالتزام (${hasForm ? "40" : "50"}%):</b> حصصك المسجّلة في آخر ٢٨ يوم مقارنة بالمجدول في برنامجك (أيام التمرين × ٤).</li>
          <li><b>التقدّم (${hasForm ? "30" : "50"}%):</b> نسبة التمارين اللي أفضل 1RM تقديري ليها في آخر أسبوعين عدّى أفضل رقم قبلها بأكتر من 0.5%.</li>
          ${hasForm ? `<li><b>الفورم (30%):</b> متوسط آخر تقييم لكل تمرين صوّرته في <span translate="no" lang="en">Form Lab</span>.</li>` : ""}
          <li>كل الأرقام من سجلاتك أنت بس — مفيش تقديرات ولا مقارنات بحاجة برّه.</li>
        </ul>
      </details>
    </div>`;
  }

  /* ---------- mount on Home, right under ملخص أسبوعك ---------- */
  async function moMount() {
    if (moBusy) return;
    if (S.tab !== "home" || !S.client || !S.me || S.me.role === "assistant") return;
    const anchor = document.querySelector("#hRecap");
    if (!anchor || document.querySelector("#moCard")) return;
    const wrap = document.createElement("div");
    wrap.id = "moCard";
    anchor.insertAdjacentElement("afterend", wrap);
    moBusy = true;
    try {
      const cid = S.client.id;
      const [sets, sessions, scans] = await Promise.all([
        window.moLoadSets(cid), window.moLoadSessions(cid), window.moLoadScans(cid),
      ]);
      if (!document.contains(wrap) || !S.client || S.client.id !== cid) return;
      const cons = moConsistency(S.client, sessions);
      const prog = moProgression(sets);
      const form = moForm(scans);
      wrap.innerHTML = moCardHTML(S.client, cons, prog, form);
    } catch (e) {
      if (document.contains(wrap)) wrap.innerHTML = "";
    } finally { moBusy = false; }
  }

  window.moAfterRender = function () { moMount(); };
  /* if Home was already rendered before this file loaded, mount now */
  moMount();
})();
