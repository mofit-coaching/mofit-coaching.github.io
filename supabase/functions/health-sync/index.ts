// Supabase Edge Function: health-sync
// Google Health connect + steps sync (last 10 days) into habits.steps, and sleep hours (last 10 nights) into habits.sleep_hours.
// Secrets needed: GHEALTH_CLIENT_ID, GHEALTH_CLIENT_SECRET, CRON_SECRET (for the scheduled sync).
// Verify JWT: ON (connect/disconnect/status run as the user; sync runs with x-cron-secret).
// Identity deploy note: schedule action=sync 2-3x per evening (see ghealth.sql cron block).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GH_BASE = "https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp";
const SCOPE = "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";
const SLEEP_SCOPE = "https://www.googleapis.com/auth/googlehealth.sleep.readonly";
const SLEEP_URL = "https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints:reconcile";

// Civil date (YYYY-MM-DD) in the client's timezone. The roster is Egypt-based.
const TZ = "Africa/Cairo";
const civilDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const nextDay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return civilDate(new Date(Date.UTC(y, m - 1, d) + 86400000));
};
const civil = (ymd: string) => {
  const [year, month, day] = ymd.split("-").map(Number);
  return { date: { year, month, day }, time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 } };
};

// How many civil days (today included) each sync reads in one call. Google allows up to 90 for steps.
const BACKFILL_DAYS = 10;
const prevDay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return civilDate(new Date(Date.UTC(y, m - 1, d) - 86400000 + 12 * 3600000));
};
const pad = (n: number) => String(n).padStart(2, "0");

// One dailyRollUp call over the last BACKFILL_DAYS days. Returns a map of YYYY-MM-DD -> steps, or why there are none:
// "no_data" (Google answered, nothing in the range), "scope_missing" (401/403) or "api_error" (anything else).
type RangeResult = { days: Record<string, number>; reason?: "no_data" | "scope_missing" | "api_error"; upstream?: string };
async function stepsForRange(accessToken: string, startYmd: string, endYmdExclusive: string): Promise<RangeResult> {
  const r = await fetch(GH_BASE, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ range: { start: civil(startYmd), end: civil(endYmdExclusive) }, windowSizeDays: 1 }),
  });
  if (!r.ok) {
    // Log Google's real answer so an api_error toast can be diagnosed from the function logs.
    let msg = "";
    try { const t = await r.text(); const ej = JSON.parse(t); msg = String(ej?.error?.message || ej?.error?.status || t.slice(0, 200)); } catch { /* keep "" */ }
    console.log("health-sync dailyRollUp upstream error:", r.status, msg.slice(0, 300));
    const reason = r.status === 401 || r.status === 403 ? "scope_missing" : "api_error";
    return { days: {}, reason, upstream: `${r.status} ${msg.slice(0, 140)}`.trim() };
  }
  const j = await r.json().catch(() => ({}));
  // dailyRollUp answers with `rollupDataPoints` (proto3 JSON: camelCase); each point carries its window start in civilStartTime.date.
  const list = Array.isArray(j?.rollupDataPoints) ? j.rollupDataPoints : (Array.isArray(j?.dataPoints) ? j.dataPoints : []);
  const days: Record<string, number> = {};
  for (const dp of list) {
    const d = dp?.civilStartTime?.date;
    if (!d?.year || !d?.month || !d?.day) continue;
    const ymd = `${d.year}-${pad(d.month)}-${pad(d.day)}`;
    const stepsVal = dp?.steps ?? dp?.value ?? null;
    const v = stepsVal?.countSum ?? stepsVal?.count_sum ?? null;
    if (v != null) days[ymd] = Math.max(0, parseInt(String(v), 10) || 0);
  }
  return Object.keys(days).length ? { days } : { days, reason: "no_data" };
}

// Sleep for the last days, as hours per wake-up day (the civil date the session ends on).
// Uses reconcile (no double counting across sources), pageSize 25 is the max for sleep, so we page.
// Never throws and never blocks steps: users who connected before the sleep permission existed just get "scope_missing".
type SleepResult = { days: Record<string, number>; reason?: "no_data" | "scope_missing" | "api_error" };
async function sleepForRange(accessToken: string, startYmd: string, endYmdExclusive: string): Promise<SleepResult> {
  const mins: Record<string, number> = {};
  let pageToken = "";
  try {
    for (let page = 0; page < 5; page++) {
      const qs = new URLSearchParams({
        filter: `sleep.interval.civil_end_time >= "${startYmd}T00:00:00" AND sleep.interval.civil_end_time < "${endYmdExclusive}T00:00:00"`,
        pageSize: "25",
      });
      if (pageToken) qs.set("pageToken", pageToken);
      const r = await fetch(`${SLEEP_URL}?${qs}`, { headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" } });
      if (!r.ok) {
        let msg = "";
        try { const t = await r.text(); const ej = JSON.parse(t); msg = String(ej?.error?.message || ej?.error?.status || t.slice(0, 200)); } catch { /* keep "" */ }
        console.log("health-sync sleep upstream error:", r.status, msg.slice(0, 300));
        return { days: {}, reason: r.status === 401 || r.status === 403 ? "scope_missing" : "api_error" };
      }
      const j = await r.json().catch(() => ({}));
      for (const dp of Array.isArray(j?.dataPoints) ? j.dataPoints : []) {
        const sl = dp?.sleep;
        const m = parseInt(String(sl?.summary?.minutesAsleep ?? "0"), 10) || 0;
        const end = String(sl?.interval?.endTime || "");
        if (!m || !end) continue;
        // Day the user woke up, in the client's timezone.
        const ymd = civilDate(new Date(end));
        mins[ymd] = (mins[ymd] || 0) + m;
      }
      pageToken = String(j?.nextPageToken || "");
      if (!pageToken) break;
    }
  } catch (e) {
    console.log("health-sync sleep error:", String(e).slice(0, 200));
    return { days: {}, reason: "api_error" };
  }
  const days: Record<string, number> = {};
  for (const [d, m] of Object.entries(mins)) days[d] = Math.round((m / 60) * 10) / 10;
  return Object.keys(days).length ? { days } : { days, reason: "no_data" };
}

// Write sleep hours without touching any other habit field.
async function writeSleep(admin: any, userId: string, ymd: string, hours: number) {
  const { data: row } = await admin.from("habits").select("client_id").eq("client_id", userId).eq("log_date", ymd).maybeSingle();
  if (row) {
    await admin.from("habits").update({ sleep_hours: hours, updated_at: new Date().toISOString() }).eq("client_id", userId).eq("log_date", ymd);
  } else {
    await admin.from("habits").insert({ client_id: userId, log_date: ymd, sleep_hours: hours, updated_at: new Date().toISOString() });
  }
}

// Write steps without touching any other habit field.
async function writeSteps(admin: any, userId: string, ymd: string, steps: number) {
  const { data: row } = await admin.from("habits").select("client_id").eq("client_id", userId).eq("log_date", ymd).maybeSingle();
  if (row) {
    await admin.from("habits").update({ steps, updated_at: new Date().toISOString() }).eq("client_id", userId).eq("log_date", ymd);
  } else {
    await admin.from("habits").insert({ client_id: userId, log_date: ymd, steps, updated_at: new Date().toISOString() });
  }
}

async function refreshAccess(cid: string, secret: string, refreshToken: string) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: cid, client_secret: secret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) return { error: j?.error || "refresh_failed" };
  return { access_token: j.access_token };
}

async function syncOne(admin: any, cid: string, secret: string, userId: string, refreshToken: string, freshAccess?: string) {
  let access = freshAccess || "";
  if (!access) {
    const rf = await refreshAccess(cid, secret, refreshToken);
    if (rf.error) return { user: userId, error: rf.error };
    access = rf.access_token!;
  }
  const today = civilDate(new Date());
  const yesterday = prevDay(today);
  let first = today;
  for (let i = 1; i < BACKFILL_DAYS; i++) first = prevDay(first);
  const res: any = { user: userId };
  const s = await stepsForRange(access, first, nextDay(today));
  // Today and yesterday always follow Google (as before). Older days are only filled with a real number,
  // so a 0 from Google never wipes steps the client already logged by hand.
  for (const [day, steps] of Object.entries(s.days)) {
    if (day > today || day < first) continue;
    if (day === today || day === yesterday || steps > 0) await writeSteps(admin, userId, day, steps);
  }
  res.today = s.days[today] ?? null;
  res.yesterday = s.days[yesterday] ?? null;
  res.days = Object.keys(s.days).length;
  if (res.today == null) { res.reason = s.reason ?? "no_data"; if (s.upstream) res.upstream = s.upstream; }   // surfaced to the client so it can say why nothing changed
  // Sleep is best effort: a failure here never changes the steps result above.
  const sl = await sleepForRange(access, first, nextDay(today));
  for (const [day, hours] of Object.entries(sl.days)) {
    if (day > today || day < first || !(hours > 0)) continue;
    await writeSleep(admin, userId, day, hours);
  }
  res.sleep_days = Object.keys(sl.days).length;
  res.sleep = sl.reason ? sl.reason : "ok";
  await admin.from("health_connections").update({ last_sync_at: new Date().toISOString() }).eq("user_id", userId);
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const cid = Deno.env.get("GHEALTH_CLIENT_ID") || "";
    const secret = Deno.env.get("GHEALTH_CLIENT_SECRET") || "";
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const b = await req.json().catch(() => ({}));

    // Scheduled sync: shared-secret path, no user JWT.
    if (b.action === "sync") {
      const cs = Deno.env.get("CRON_SECRET") || "";
      if (!cs || req.headers.get("x-cron-secret") !== cs) return out({ error: "غير مصرّح" }, 401);
      if (!cid || !secret) return out({ error: "not_configured" }, 503);
      const { data: rows } = await admin.from("health_connections").select("user_id,refresh_token").limit(200);
      const results = [];
      for (const row of rows || []) {
        const r = await syncOne(admin, cid, secret, row.user_id, row.refresh_token);
        if (r.error === "invalid_grant") {
          // user revoked access at Google: drop the stale connection
          await admin.from("health_connections").delete().eq("user_id", row.user_id);
        }
        results.push(r);
      }
      return out({ synced: results.filter((r) => !r.error).length, failed: results.filter((r) => r.error).length });
    }

    // iPhone Shortcut ingest: a per-client code that can ONLY write that client's own steps.
    if (b.action === "shortcut_sync") {
      const code = String(b.code || "").trim();
      // Shortcuts sends "" when it reads nothing and a real 0 right after midnight; only the first is bad input.
      const rawSteps = Math.round(parseFloat(String(b.steps ?? "").replace(/,/g, "")));
      const steps = Math.max(0, Math.min(100000, Number.isFinite(rawSteps) ? rawSteps : 0));
      const day = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : civilDate(new Date());
      if (!code) return out({ error: "bad_input", field: "code" }, 400);
      if (!Number.isFinite(rawSteps)) return out({ error: "bad_input", field: "steps" }, 400);
      const { data: prof } = await admin.from("profiles").select("id").eq("steps_code", code).maybeSingle();
      if (!prof) return out({ error: "bad_code" }, 404);
      // A zero never overwrites a number the client already has for that day.
      if (steps > 0) await writeSteps(admin, prof.id, day, steps);
      return out({ ok: true, date: day, steps, saved: steps > 0 });
    }

    // All other actions run as the authed user.
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return out({ error: "غير مصرّح" }, 401);
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return out({ error: "غير مصرّح" }, 401);

    // The client UI hides the feature until this returns a client id.
    if (b.action === "status") return out({ configured: !!cid && !!secret, client_id: cid || null, shortcut_url: Deno.env.get("SHORTCUT_URL") || null });

    if (b.action === "connect") {
      if (!cid || !secret) return out({ error: "not_configured" }, 503);
      const code = String(b.code || "");
      if (!code) return out({ error: "no_code" }, 400);
      const tr = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: cid, client_secret: secret, redirect_uri: "postmessage", grant_type: "authorization_code" }),
      });
      const tj = await tr.json().catch(() => ({}));
      if (!tr.ok || !tj.access_token) return out({ error: "exchange_failed" }, 502);
      if (!tj.refresh_token) return out({ error: "no_refresh" }, 409); // user must re-consent (frontend uses prompt:'consent')
      // Google's consent screen lets people untick the steps permission and still return a token.
      if (!String(tj.scope || "").split(" ").includes(SCOPE)) return out({ error: "scope_missing" }, 409);
      // Sleep permission is optional: steps still work if the user unticks it.
      const hasSleep = String(tj.scope || "").split(" ").includes(SLEEP_SCOPE);
      let sub = "";
      try { sub = JSON.parse(atob(String(tj.id_token || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || ""; } catch { /* sub optional */ }
      await admin.from("health_connections").upsert({
        user_id: u.user.id, provider: "google", google_sub: sub || null,
        refresh_token: tj.refresh_token, scope: hasSleep ? `${SCOPE} ${SLEEP_SCOPE}` : SCOPE, connected_at: new Date().toISOString(),
      });
      const r = await syncOne(admin, cid, secret, u.user.id, tj.refresh_token, tj.access_token);
      return out({ connected: true, today: r.today ?? null, yesterday: r.yesterday ?? null, sleep: hasSleep ? (r.sleep ?? null) : "scope_missing" });
    }

    if (b.action === "shortcut_code") {
      const { data: prof } = await admin.from("profiles").select("steps_code").eq("id", u.user.id).single();
      let code = prof?.steps_code;
      if (!code) {
        code = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
        await admin.from("profiles").update({ steps_code: code }).eq("id", u.user.id);
      }
      return out({ code, shortcut_url: Deno.env.get("SHORTCUT_URL") || null });
    }

    if (b.action === "sync_me") {
      const { data: row } = await admin.from("health_connections").select("refresh_token").eq("user_id", u.user.id).maybeSingle();
      if (!row) return out({ error: "not_connected" }, 404);
      if (!cid || !secret) return out({ error: "not_configured" }, 503);
      const r = await syncOne(admin, cid, secret, u.user.id, row.refresh_token);
      if (r.error) return out({ error: "sync_failed" }, 502);
      return out({ today: r.today ?? null, yesterday: r.yesterday ?? null, reason: r.today == null ? (r.reason ?? "no_data") : null, detail: r.upstream ?? null, sleep: r.sleep ?? null, sleep_days: r.sleep_days ?? 0 });
    }

    if (b.action === "disconnect") {
      const { data: row } = await admin.from("health_connections").select("refresh_token").eq("user_id", u.user.id).maybeSingle();
      if (row?.refresh_token) {
        await fetch(REVOKE_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `token=${encodeURIComponent(row.refresh_token)}` }).catch(() => {});
      }
      await admin.from("health_connections").delete().eq("user_id", u.user.id);
      return out({ disconnected: true });
    }

    return out({ error: "bad_action" }, 400);
  } catch (e) {
    return out({ error: "server" }, 500);
  }
});
