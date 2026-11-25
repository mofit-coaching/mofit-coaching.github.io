// Supabase Edge Function: health-sync
// Google Health connect + daily steps sync into habits.steps.
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

// Returns the steps, or why there are none: "no_data" (Google answered, nothing for that day),
// "scope_missing" (401/403: steps permission not granted) or "api_error" (anything else).
type DayResult = { steps: number | null; reason?: "no_data" | "scope_missing" | "api_error"; upstream?: string };
async function stepsForDay(accessToken: string, ymd: string): Promise<DayResult> {
  const r = await fetch(GH_BASE, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ range: { start: civil(ymd), end: civil(nextDay(ymd)) }, windowSizeDays: 1 }),
  });
  if (!r.ok) {
    // Log Google's real answer so an api_error toast can be diagnosed from the function logs.
    let msg = "";
    try { const t = await r.text(); const ej = JSON.parse(t); msg = String(ej?.error?.message || ej?.error?.status || t.slice(0, 200)); } catch { /* keep "" */ }
    console.log("health-sync dailyRollUp upstream error:", r.status, msg.slice(0, 300));
    const reason = r.status === 401 || r.status === 403 ? "scope_missing" : "api_error";
    return { steps: null, reason, upstream: `${r.status} ${msg.slice(0, 140)}`.trim() };
  }
  const j = await r.json().catch(() => ({}));
  // dailyRollUp answers with `rollupDataPoints` (proto3 JSON: camelCase fields).
  // Tolerate the older/guessed shapes so a Google-side change never reads as "no data" again.
  const list = Array.isArray(j?.rollupDataPoints) ? j.rollupDataPoints : (Array.isArray(j?.dataPoints) ? j.dataPoints : []);
  const dp = list[0] ?? null;
  const stepsVal = dp?.steps ?? dp?.value ?? null;
  const v = stepsVal?.countSum ?? stepsVal?.count_sum ?? null;
  return v == null ? { steps: null, reason: "no_data" } : { steps: Math.max(0, parseInt(String(v), 10) || 0) };
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
  const yesterday = civilDate(new Date(Date.now() - 86400000));
  const res: any = { user: userId };
  for (const day of [today, yesterday]) {
    const s = await stepsForDay(access, day);
    if (s.steps != null) { await writeSteps(admin, userId, day, s.steps); res[day === today ? "today" : "yesterday"] = s.steps; }
    else if (day === today) { res.reason = s.reason; if (s.upstream) res.upstream = s.upstream; }   // surfaced to the client so it can say why nothing changed
  }
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
      let sub = "";
      try { sub = JSON.parse(atob(String(tj.id_token || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || ""; } catch { /* sub optional */ }
      await admin.from("health_connections").upsert({
        user_id: u.user.id, provider: "google", google_sub: sub || null,
        refresh_token: tj.refresh_token, scope: SCOPE, connected_at: new Date().toISOString(),
      });
      const r = await syncOne(admin, cid, secret, u.user.id, tj.refresh_token, tj.access_token);
      return out({ connected: true, today: r.today ?? null, yesterday: r.yesterday ?? null });
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
      return out({ today: r.today ?? null, yesterday: r.yesterday ?? null, reason: r.today == null ? (r.reason ?? "no_data") : null, detail: r.upstream ?? null });
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
