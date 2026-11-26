// Supabase Edge Function: send-push
// Secrets needed: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//   (VAPID_SUBJECT e.g. "mailto:coach@mofit.com"). Generate the keypair with:
//   node -e 'crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]).then(async k=>{const j=await crypto.subtle.exportKey("jwk",k.privateKey);const p=await crypto.subtle.exportKey("raw",k.publicKey);const b=b=>Buffer.from(b).toString("base64url");console.log("VAPID_PUBLIC_KEY="+b(p));console.log("VAPID_PRIVATE_KEY="+j.d)})'
//
// Callers:
//   - DB triggers / pg_cron via public.push_call (Authorization: Bearer
//     <service_role_key>): actions chat / league_started / nudge.
//   - The app itself for "vapid_public" (no auth; the key is public by design)
//     and "test" (any signed-in user; pushes ONLY their own devices - used for
//     demo-account testing, never touches other users).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPushPayload } from "https://esm.sh/@block65/webcrypto-web-push@2.0.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clip = (s: unknown, n: number) => String(s ?? "").slice(0, n);

type Sub = { endpoint: string; p256dh: string; auth: string };

async function sendAll(vapid: any, subs: Sub[], note: { title: string; body: string; url: string; tag: string }, admin: any) {
  let sent = 0, gone = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      const payload = await buildPushPayload(
        { data: JSON.stringify(note), options: { ttl: 60 * 60 * 12 } },
        { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
        vapid,
      );
      const r = await fetch(s.endpoint, payload);
      if (r.status === 404 || r.status === 410) {
        gone++;
        await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      } else if (r.status >= 200 && r.status < 300) {
        sent++;
      }
    } catch { /* best-effort */ }
  }));
  return { sent, gone };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const b = await req.json().catch(() => ({}));
    if (!b.action && b.kind) b.action = b.kind; // DB triggers send {kind: ...}

    const vapid = {
      subject: Deno.env.get("VAPID_SUBJECT") || "mailto:coach@mofit.com",
      publicKey: Deno.env.get("VAPID_PUBLIC_KEY"),
      privateKey: Deno.env.get("VAPID_PRIVATE_KEY"),
    };
    const configured = !!(vapid.publicKey && vapid.privateKey);

    // public key is public by design - the app needs it to subscribe
    if (b.action === "vapid_public") {
      if (!configured) return out({ configured: false });
      return out({ configured: true, publicKey: vapid.publicKey });
    }

    if (!configured) return out({ error: "not_configured" }, 503);

    // demo testing: any signed-in user can push ONLY their own devices
    if (b.action === "test") {
      const { data: u, error: ue } = await admin.auth.getUser(token);
      if (ue || !u?.user) return out({ error: "غير مصرّح" }, 401);
      const { data: subs } = await admin.from("push_subscriptions")
        .select("endpoint,p256dh,auth").eq("user_id", u.user.id);
      if (!subs?.length) return out({ error: "no_subscriptions" }, 404);
      const r = await sendAll(vapid, subs, {
        title: "إشعار تجريبي من Mofit 🔔",
        body: "لو وصلك ده، الإشعارات شغالة على الجهاز ده.",
        url: "./", tag: "mofit-test",
      }, admin);
      return out({ ok: true, ...r });
    }

    // everything below is service-role only (DB triggers + pg_cron)
    // Verify JWT is ON at the gateway, so the signature is already checked; here we only read the role claim.
    // (SUPABASE_SERVICE_ROLE_KEY may be the new sb_secret key, so an exact string compare would reject the legacy JWT that the DB trigger sends.)
    let role = "";
    try { role = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role || ""; } catch { /* not a jwt */ }
    if (!token || (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") && role !== "service_role")) {
      return out({ error: "غير مصرّح" }, 401);
    }

    if (b.action === "chat") {
      const clientId = clip(b.client_id, 64);
      const sender = b.sender === "coach" ? "coach" : "client";
      const preview = clip(b.preview, 80);
      let userIds: string[] = [];
      if (sender === "client") {
        const { data: coaches } = await admin.from("profiles").select("id").eq("role", "coach").eq("active", true);
        userIds = (coaches || []).map((c: any) => c.id);
      } else {
        userIds = [clientId];
      }
      if (!userIds.length) return out({ ok: true, sent: 0 });
      const { data: subs } = await admin.from("push_subscriptions")
        .select("endpoint,p256dh,auth").in("user_id", userIds);
      if (!subs?.length) return out({ ok: true, sent: 0 });
      const note = sender === "client"
        ? { title: "رسالة جديدة من عميل 💬", body: preview, url: "./?tab=chat", tag: "mofit-chat-" + clientId }
        : { title: "الكوتش رد عليك 💬", body: preview, url: "./?tab=chat", tag: "mofit-chat" };
      const r = await sendAll(vapid, subs, note, admin);
      return out({ ok: true, ...r });
    }

    if (b.action === "league_started") {
      const { data: cfg } = await admin.from("league_config").select("season,prize_1,prize_2,prize_3").eq("id", 1).maybeSingle();
      // every active client gets the invite - pending and joined alike
      const { data: clients } = await admin.from("profiles").select("id").eq("role", "client").eq("active", true);
      const ids = (clients || []).map((c: any) => c.id);
      if (!ids.length) return out({ ok: true, sent: 0 });
      const { data: subs } = await admin.from("push_subscriptions")
        .select("endpoint,p256dh,auth").in("user_id", ids);
      if (!subs?.length) return out({ ok: true, sent: 0 });
      const prizes = [cfg?.prize_1, cfg?.prize_2, cfg?.prize_3].filter(Boolean).join(" · ");
      const r = await sendAll(vapid, subs, {
        title: "الليج بدأ رسمي! 🏆",
        body: prizes ? `الموسم ${cfg?.season} بدأ - الجوايز: ${prizes}` : `الموسم ${cfg?.season} بدأ - ادخل شارك ونافس!`,
        url: "./", tag: "mofit-league-start-" + (cfg?.season ?? ""),
      }, admin);
      return out({ ok: true, ...r });
    }

    if (b.action === "nudge") {
      const { data: cfg } = await admin.from("league_config").select("season,started_at").eq("id", 1).maybeSingle();
      if (!cfg?.started_at) return out({ ok: true, sent: 0 });
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }); // YYYY-MM-DD
      const { data: joined } = await admin.from("league_optins")
        .select("client_id").eq("season", cfg.season).eq("status", "joined");
      const ids = (joined || []).map((o: any) => o.client_id);
      if (!ids.length) return out({ ok: true, sent: 0 });

      // anyone with ANY activity today (workout, habit or checkin) is not "missing"
      const [w, h, c] = await Promise.all([
        admin.from("workout_sessions").select("client_id").in("client_id", ids).eq("log_date", today),
        admin.from("habits").select("client_id").in("client_id", ids).eq("log_date", today),
        admin.from("checkins").select("client_id").in("client_id", ids).eq("checkin_date", today),
      ]);
      const active = new Set<string>();
      for (const r of [w, h, c]) for (const row of (r.data || [])) active.add(row.client_id);
      const missing = ids.filter((id: string) => !active.has(id));
      if (!missing.length) return out({ ok: true, sent: 0, missing: 0 });

      const { data: subs } = await admin.from("push_subscriptions")
        .select("endpoint,p256dh,auth").in("user_id", missing);
      if (!subs?.length) return out({ ok: true, sent: 0 });
      const r = await sendAll(vapid, subs, {
        title: "فاتك تسجل النهارده ⏳",
        body: "لسه ماسجلتش أي نشاط النهارده - أي تمرين أو عادة بتحسب نقاط في الليج.",
        url: "./", tag: "mofit-nudge-" + today,
      }, admin);
      return out({ ok: true, missing: missing.length, ...r });
    }

    if (b.action === "subs") {
      // subscription renewal reminders (Mohammed's round-6 pick, Nov 26):
      // clients get a push exactly 3 days, 1 day and on the day their sub_end
      // arrives; the coach gets one morning digest of everything that needs
      // a renewal follow-up. Days are computed on the Africa/Cairo calendar.
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
      const todayMs = new Date(todayStr + "T00:00:00Z").getTime();
      const dayMs = 86400000;
      const { data: clients } = await admin.from("profiles")
        .select("id,full_name,sub_end,sub_paid")
        .eq("role", "client").eq("active", true).not("sub_end", "is", null);
      const rows = (clients || []).map((c: any) => ({
        id: c.id,
        left: Math.round((new Date(String(c.sub_end).slice(0, 10) + "T00:00:00Z").getTime() - todayMs) / dayMs),
        paid: !!c.sub_paid,
      }));

      // client pushes: exactly T-3, T-1, T-0 (each fires once per cycle)
      let clientSent = 0;
      for (const r of rows.filter((r) => r.left === 3 || r.left === 1 || r.left === 0)) {
        const { data: subs } = await admin.from("push_subscriptions")
          .select("endpoint,p256dh,auth").eq("user_id", r.id);
        if (!subs?.length) continue;
        const note = r.left === 0
          ? { title: "اشتراكك بينتهي النهارده ⏳", body: "جدد مع الكوتش النهارده عشان تكمل برنامجك من غير ما تفصل.", tag: "mofit-sub-end0", url: "./#prices" }
          : { title: r.left === 1 ? "اشتراكك باقيله يوم واحد 📅" : "اشتراكك باقيله 3 أيام 📅", body: "جدد بدري عشان متوقفش تقدمك - التجديد بضغطة من صفحة الأسعار.", tag: "mofit-sub-end" + r.left, url: "./#prices" };
        const res = await sendAll(vapid, subs, note, admin);
        clientSent += res.sent;
      }

      // coach digest: expired, expiring within 7 days, or started-but-unpaid
      const watch = rows.filter((r) => r.left < 0 || r.left <= 7 || !r.paid);
      let coachSent = 0;
      if (watch.length) {
        const { data: coaches } = await admin.from("profiles").select("id").eq("role", "coach").eq("active", true);
        const ids = (coaches || []).map((c: any) => c.id);
        const { data: subs } = await admin.from("push_subscriptions")
          .select("endpoint,p256dh,auth").in("user_id", ids);
        if (subs?.length) {
          const expired = watch.filter((r) => r.left < 0).length;
          const soon = watch.filter((r) => r.left >= 0 && r.left <= 7).length;
          const unpaid = watch.filter((r) => !r.paid).length;
          const parts: string[] = [];
          if (soon) parts.push(soon === 1 ? "اشتراك بينتهي خلال أسبوع" : soon + " اشتراكات بتنتهي خلال أسبوع");
          if (expired) parts.push(expired === 1 ? "اشتراك منتهي" : expired + " اشتراكات منتهية");
          if (unpaid) parts.push(unpaid === 1 ? "واحد غير مدفوع" : unpaid + " غير مدفوع");
          const res = await sendAll(vapid, subs, {
            title: "💳 متابعة الاشتراكات",
            body: parts.join(" · ") + " - افتح تبويب الاشتراكات للمتابعة",
            url: "./?tab=subs", tag: "mofit-subs-digest-" + todayStr,
          }, admin);
          coachSent = res.sent;
        }
      }
      return out({ ok: true, clients_notified: clientSent, coach_notified: coachSent, watching: watch.length });
    }

    return out({ error: "bad_action" }, 400);
  } catch (e) {
    return out({ error: "server" }, 500);
  }
});
