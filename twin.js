/* ======================================================================
   MOFIT Digital Twin (twin-*) — التوأم الرقمي
   A front-view avatar drawn from the client's REAL logged measurements
   (body_logs) — never invented numbers. A muscle-glow layer tints the
   muscle groups the client actually trained this week (set_logs via
   muscleVol). Scoped: window.DigitalTwin + twin* only. No DB writes.
   ====================================================================== */
(function () {
  "use strict";

  /* Display-only reference circumferences (cm) used to scale the drawing.
     These are anatomical scaling anchors, not user data and never shown. */
  const REF = { neck: 38, chest: 100, waist: 85, hips: 98, arm: 33, thigh: 55 };
  const clampS = v => Math.min(1.3, Math.max(0.78, v));

  function latestRows(B) {
    const rows = (B || []).filter(r => r && (r.weight || r.chest || r.waist || r.arm || r.thigh || r.hips || r.neck));
    if (!rows.length) return { cur: null, base: null };
    const base = rows.find(r => r.week === 0) || rows[0];
    const cur = rows[rows.length - 1];
    return { cur, base };
  }

  /* Front silhouette as scalable segments. All widths derive from the
     client's measurements; heights stay anatomical. */
  function avatarSVG(cur) {
    const g = k => clampS((+cur[k] || REF[k]) / REF[k]);
    const nN = g("neck"), nC = g("chest"), nW = g("waist"), nH = g("hips"), nA = g("arm"), nT = g("thigh");
    const cx = 100;                       // center x
    const skin = "#F5C9A6", line = "#0F172A";
    const half = (w, s) => (w * s) / 2;
    const chestW = half(86, nC), waistW = half(64, nW), hipW = half(84, nH);
    const neckW = half(26, nN), armW = 13 * nA, thighW = 17 * nT;
    /* torso path: chest line (y=88) → waist (y=140) → hips (y=172) */
    const torso = `M ${cx - chestW} 88 Q ${cx} 78 ${cx + chestW} 88 L ${cx + waistW} 140 Q ${cx + waistW + 3} 156 ${cx + hipW} 168 L ${cx + hipW} 178 L ${cx - hipW} 178 L ${cx - hipW} 168 Q ${cx - waistW - 3} 156 ${cx - waistW} 140 Z`;
    const armL = `M ${cx - chestW - 4} 92 q ${-armW} 6 ${-armW - 3} 26 l 2 44 q 0 8 ${armW * .8} 8 q ${armW * .7} 0 ${armW * .7 - 2} -10 l -2 -42 q 1 -20 ${armW + 6} -26 Z`;
    const armR = armL.replace(`M ${cx - chestW - 4}`, `M ${cx + chestW + 4}`).replace(/q \S+ 6/, m => m).split(" ").map((t, i) => t).join(" ");
    const armRr = `M ${cx + chestW + 4} 92 q ${armW} 6 ${armW + 3} 26 l -2 44 q 0 8 ${-armW * .8} 8 q ${-armW * .7} 0 ${-armW * .7 + 2} -10 l 2 -42 q -1 -20 ${-armW - 6} -26 Z`;
    const legL = `M ${cx - hipW + 4} 178 L ${cx - 6} 178 L ${cx - 8} 252 q 0 8 ${-thighW * .8} 8 q ${-thighW * .75} 0 ${-thighW * .75} -10 L ${cx - thighW - 6} 186 Z`;
    const legR = `M ${cx + hipW - 4} 178 L ${cx + 6} 178 L ${cx + 8} 252 q 0 8 ${thighW * .8} 8 q ${thighW * .75} 0 ${thighW * .75} -10 L ${cx + thighW + 6} 186 Z`;
    return `<svg viewBox="0 0 200 300" class="twin-svg" role="img" aria-label="توأمك الرقمي من قياساتك">
      <ellipse cx="${cx}" cy="46" rx="17" ry="21" fill="${skin}" stroke="${line}" stroke-opacity=".12"/>
      <path d="M ${cx - neckW} 64 L ${cx + neckW} 64 L ${cx + neckW + 4} 84 L ${cx - neckW - 4} 84 Z" fill="${skin}" stroke="${line}" stroke-opacity=".12"/>
      <path d="${torso}" fill="${skin}" stroke="${line}" stroke-opacity=".14"/>
      <path d="${armL}" fill="${skin}" stroke="${line}" stroke-opacity=".12"/>
      <path d="${armRr}" fill="${skin}" stroke="${line}" stroke-opacity=".12"/>
      <path d="${legL}" fill="${skin}" stroke="${line}" stroke-opacity=".12"/>
      <path d="${legR}" fill="${skin}" stroke="${line}" stroke-opacity=".12"/>
      <g class="twin-glow">
        <path data-m="صدر" d="M ${cx - chestW + 8} 92 Q ${cx} 84 ${cx + chestW - 8} 92 L ${cx + chestW - 14} 116 Q ${cx} 110 ${cx - chestW + 14} 116 Z"/>
        <path data-m="أكتاف" d="M ${cx - chestW - 2} 88 q -12 4 -13 18 q 10 6 17 2 q 2 -12 -4 -20 Z M ${cx + chestW + 2} 88 q 12 4 13 18 q -10 6 -17 2 q -2 -12 4 -20 Z"/>
        <path data-m="باي" d="M ${cx - chestW - armW + 1} 118 q -4 16 -2 30 q ${armW * .6} 5 ${armW * .8} 0 q 0 -16 -2 -32 Z M ${cx + chestW + armW - 1} 118 q 4 16 2 30 q ${-armW * .6} 5 ${-armW * .8} 0 q 0 -16 2 -32 Z"/>
        <path data-m="أمامية" d="M ${cx - thighW - 2} 190 L ${cx - 10} 190 L ${cx - 11} 226 q ${-thighW * .5} 6 ${-thighW * .7} 0 Z M ${cx + thighW + 2} 190 L ${cx + 10} 190 L ${cx + 11} 226 q ${thighW * .5} 6 ${thighW * .7} 0 Z"/>
        <path data-m="سمانة" d="M ${cx - 9} 232 L ${cx - thighW} 232 L ${cx - thighW + 1} 252 q ${thighW * .5} 4 ${thighW * .6} 0 Z M ${cx + 9} 232 L ${cx + thighW} 232 L ${cx + thighW - 1} 252 q ${-thighW * .5} 4 ${-thighW * .6} 0 Z"/>
      </g></svg>`;
  }

  function deltaChips(cur, base) {
    if (!base || base === cur) return "";
    const F = [["weight", "الوزن", "كجم"], ["chest", "الصدر", "سم"], ["arm", "الذراع", "سم"], ["waist", "الوسط", "سم"], ["thigh", "الفخذ", "سم"], ["hips", "الأرداف", "سم"]];
    const chips = F.map(([k, l, u]) => {
      if (!base[k] || !cur[k]) return "";
      const d = +cur[k] - +base[k]; if (!d) return "";
      return `<span class="pill ${d < 0 ? "acc-soft" : "acc"}" style="font-size:.75rem">${l} ${d > 0 ? "▲" : "▼"} ${fmt(Math.abs(d), 1)} ${u}</span>`;
    }).filter(Boolean).join(" ");
    return chips ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px">${chips}</div>` : "";
  }

  function cardHTML(p, B) {
    const { cur, base } = latestRows(B);
    if (!cur) return `<div class="card"><div class="card-h"><div class="ic dark">🧍</div><h2>توأمك الرقمي<small>بيترسم من قياساتك</small></h2></div>${emptyBox("📏", "لسه مفيش قياسات — سجّل قياسات البداية فوق والتوأم هيترسم منها، من غير أي أرقام مفترضة.")}</div>`;
    return `<div class="card"><div class="card-h"><div class="ic dark">🧍</div><h2>توأمك الرقمي<small>من قياساتك الحقيقية · ${esc(cur.log_date || ("أسبوع " + cur.week))}</small></h2></div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center">
        <div style="width:132px">${avatarSVG(cur)}</div>
        <div>
          <p class="hint" style="margin:0 0 6px">شكل جسمك بيتتحدث من قياساتك كل أسبوع. العضلات اللي تمرنتها الأسبوع ده بتنوّر:</p>
          <div class="twin-legend" id="twinLegend"><small class="hint">بيحمّل حجم تمرين الأسبوع…</small></div>
          ${cur.weight ? `<div style="margin-top:6px"><b class="num" style="font-size:1.4rem">${fmt(+cur.weight, 1)}</b> <small class="hint">كجم</small>${cur.bodyfat ? ` · <b class="num">${fmt(+cur.bodyfat, 1)}%</b> <small class="hint">دهون</small>` : ""}</div>` : ""}
        </div>
      </div>
      ${deltaChips(cur, base)}</div>`;
  }

  /* Async: tint the muscles trained this week (real set_logs only). */
  async function hydrate(scopeEl, p) {
    const host = (scopeEl || document).querySelector ? scopeEl : document;
    const svg = host.querySelector(".twin-svg"); if (!svg) return;
    const wk = currentWeek(p);
    const [{ data: sets }, { data: exs }] = await Promise.all([
      sb.from("set_logs").select("exercise_id,week,reps,weight").eq("client_id", p.id).eq("week", wk),
      sb.from("program_exercises").select("id,name").eq("client_id", p.id),
    ]);
    const nameOf = {}; (exs || []).forEach(e => nameOf[e.id] = e.name);
    const done = (sets || []).filter(logged);
    const vol = muscleVol(done.map(s => [nameOf[s.exercise_id] || "", 1]));
    const max = Math.max(1, ...Object.values(vol));
    svg.querySelectorAll(".twin-glow path").forEach(path => {
      const m = path.dataset.m, v = vol[m] || 0;
      if (v) { path.setAttribute("fill", mColor(m)); path.setAttribute("fill-opacity", (0.35 + 0.55 * v / max).toFixed(2)); }
      else { path.setAttribute("fill", "transparent"); }
    });
    const lg = host.querySelector("#twinLegend");
    if (lg) lg.innerHTML = done.length
      ? Object.entries(vol).sort((a, b) => b[1] - a[1]).map(([m, v]) => `<span class="mchip" style="--mc:${mColor(m)}"><i></i>${m} ${v}</span>`).join("")
      : `<small class="hint">مفيش مجموعات مسجلة الأسبوع ده لسه — أول تمرين هيضوّي العضلات هنا.</small>`;
  }

  window.DigitalTwin = { cardHTML, hydrate };
})();
