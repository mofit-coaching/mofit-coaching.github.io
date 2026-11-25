// Supabase Edge Function: ai-assist
// Secret needed: GEMINI_API_KEY.  Optional: GEMINI_MODEL (default below).
// Provider: Google Gemini API via its OpenAI-compatible endpoint (free tier).
// Privacy bar: client names/emails/phones NEVER go to the model provider.
//   - Coach actions (digest/reply) receive pseudonyms (C1, C2...) from the app.
//   - Client action (ask) builds context server-side from the caller's uid and
//     never selects name/email/phone.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL_DEFAULT = "gemini-3.5-flash";
const ASK_DAILY_CAP = 15;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clip = (s: unknown, n: number) => String(s ?? "").slice(0, n);

const SYS = `انت مساعد لكوتش لياقة مصري. اكتب بالعامية المصرية، قصير ومباشر وودود. ماتخترعش أرقام ولا معلومات مش موجودة في البيانات. ماتدّيش نصايح طبية ولا وعود بنتايج ولا أسعار. العملاء معروفين بكود (C1, C2...) بس.`;

const ASK_SYS = `انت المساعد الذكي في تطبيق Mofit، بترد على عميل عند كوتش لياقة مصري.
اللهجة (مهم جداً): رد بس بالعامية المصرية بتاعة الشارع، زي صاحبك في الجيم اللي فاهم تمرين - دافي وبيشجع وطبيعي. ممنوع الفصحى نهائي وممنوع الأسلوب الرسمي او الروبوتي. جمل قصيرة (٢-٤ جمل كحد اقصى). استخدم تعبيرات زي: "يا بطل"، "تمام"، "عادي جداً"، "كمّل"، "مش مشكلة" - بس من غير مبالغة.
القواعد:
- جاوب بس من بيانات العميل اللي في السياق (برنامج التمرين، الوجبات، الهدف، الوزن). ماتخترعش تمارين ولا أكل ولا أرقام مش موجودة.
- أسئلة "بديل أكل": اقترح بدائل من نفس قائمة الوجبات بتاعته لو فيه، او أكل مصري عادي بنفس المعادل التقريبي، وقوله يثبت الكمية زي ما في وجبته.
- أسئلة "شرح تمرين": اشرح الفورم ببساطة (نقطتين تلاتة) لو التمرين في برنامجه، من غير أوزان مقترحة.
- أسئلة مواعيد وجدولة: جاوب من عدد ايام التمرين والأسبوع الحالي بتاعه.
- ممنوع نهائي: تشخيص، نصيحة طبية، أدوية، منشطات، هرمونات، وعود بنتايج، أسعار او اشتراكات.
- لو السؤال فيه ألم او اصابة او موضوع طبي او مش متأكد من الاجابة: حط escalate=true وسيب answer فاضي.
- لو السؤال مش عن تمرين ولا أكل: رد قصير ودود ان ده مش شغلك وان الكوتش موجود في الشات، escalate=false.
- escalate=true كمان (وسيب answer فاضي) لو السؤال فيه: حمل او رضاعة، علامات اضطراب أكل (استفراغ بعد الأكل، رعب من الأكل، هوس بالوزن)، تقليل أكل شديد او سعرات اقل من ١٢٠٠ للراجل او ١٠٠٠ للست، صيام طويل، تخسيس سريع جداً، حبوب تخسيس او مكملات، او اي دوا.
- ماتقترحش ابداً سعرات او أوزان اقل من اللي في خطة الكوتش.
رجّع JSON بس بالشكل ده: {"answer":"...","escalate":false}`;

const ASK_ESCALATION = "سؤالك مهم والكوتش نفسه هيرد عليك هنا خلال اليوم ✋";

// Deterministic risk screen: a hit skips the model entirely and escalates.
// Arabic roots match at a word START boundary only (suffixes allowed) and
// ambiguous bare words are excluded: "تمرين صدر" (chest day) and "حمل ثقيل"
// (heavy load) must NOT escalate - chest pain is caught via "صدري" /
// "ألم في الصدر" and pregnancy via "حامل"/"رضاع".
const AR_B = String.raw`(?:^|[\s,.!?؟،؛:;"'()\-])`;
const AR_ROOTS = ["ألم","بيوجع","وجع","مغص","إصاب","اصاب","اتصاب","كسر","تمزق","التوا","دوخ","دوار","غثيان","قيء","أغمى","اغمى","نهجان","مرض","مريض","حامل","حوامل","رضاع","بترضع","دكتور","دكاترة","طبيب","دواء","أدوية","ادوية","كورتيزون","بنادول","مسكن","منشطات","هرمون","تستوستيرون","حقن","ابرة","إبرة","اكتئاب","وسواس","نفسيتي","قلبي","ضغطي","سكري","صدري","شد عضلي","ألم في الصدر","وجع في الصدر","ضغط الدم","استفرغ","اتقيأ","اتقيا","أستفرغ","فقدان الشهية","اضطراب اكل","اضطراب أكل","كلوري","جوع","أجوع","اجوع","ماكلش","مش بأكل","بطّل اكل","بطل اكل","صيام متقطع","صوم","حبوب تخسيس","شاي تخسيس","ملينات","أنحف بسرعة","انحف بسرعة","اخس بسرعة","أخس بسرعة","ضغط الدم","سكر الدم","ضربات قلب","مضاد حيوي"];
const EN_RE = String.raw`\b(?:pain\w*|hurt\w*|injur\w*|fracture\w*|sprain\w*|dizz\w*|nausea|vomit\w*|chest pain|pregnan\w*|medicat\w*|medicine|doctor\w*|steroid\w*|hormone\w*|insulin|depress\w*)\b`;
// Optional common prefixes (conjunctions/prepositions/definite article) so
// "وبيوجعني"، "بالألم"، "الدواء" still match.
const AR_PRE = String.raw`(?:[وبلفك]{0,2})?(?:ال)?`;
const RISK_RE = new RegExp(AR_B + AR_PRE + "(?:" + AR_ROOTS.join("|") + ")|" + AR_B + AR_PRE + "دوا(?=$|[\\s,.!?؟،؛:;\"'()\\-])|" + EN_RE, "i");

// Strip anything that looks like a phone number or email before text goes to the model provider.
const scrub = (s: string) => s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[إيميل محذوف]").replace(/\d{7,}/g, "[رقم محذوف]");

async function llm(key: string, model: string, system: string, user: string, maxTokens: number) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, temperature: 0.4, max_tokens: Math.max(maxTokens * 3, 1500),
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (r.status === 429) return { error: "rate", status: 429 };
  if (!r.ok) return { error: "upstream", status: 502 };
  const j = await r.json();
  try { return { data: JSON.parse(j.choices?.[0]?.message?.content || "{}") }; }
  catch { return { error: "bad_json", status: 502 }; }
}

// Server-side context for the ask action: built from the caller's uid.
// Selects ONLY non-identifying columns - no full_name, email or phone.
async function clientContext(admin: any, uid: string) {
  const { data: p } = await admin.from("profiles")
    .select("sex,age,height_cm,start_weight,target_weight,goal,level,start_date,training_days,split_name,meals_per_day,steps_goal,protein_gpk,activity_factor,manual_kcal,cardio_plan")
    .eq("id", uid).maybeSingle();
  const { data: ex } = await admin.from("program_exercises")
    .select("day_no,day_label,name,sets,target_reps,target_rir")
    .eq("client_id", uid).order("day_no").order("position").limit(80);
  const { data: diet } = await admin.from("diet_plan_items")
    .select("meal_no,food_name,unit,qty,kcal,protein")
    .eq("client_id", uid).order("meal_no").order("position").limit(60);
  const { data: w } = await admin.from("body_logs")
    .select("week,log_date,weight")
    .eq("client_id", uid).order("week", { ascending: false }).limit(2);
  const week = p?.start_date
    ? Math.max(1, Math.floor((Date.now() - new Date(clip(p.start_date, 10) + "T00:00:00Z").getTime()) / 6048e5) + 1)
    : null;
  return {
    week,
    profile: p || {},
    program_days: p?.training_days || null,
    program: (ex || []).map((e: any) => ({ day: e.day_no, label: clip(e.day_label, 40), ex: clip(e.name, 60), sets: e.sets, reps: clip(e.target_reps, 12), rir: clip(e.target_rir, 8) })),
    meals: (diet || []).map((d: any) => ({ meal: d.meal_no, food: clip(d.food_name, 60), qty: d.qty, unit: clip(d.unit, 8), kcal: d.kcal, protein: d.protein })),
    latest_weights: (w || []).map((x: any) => x.weight).filter((x: unknown) => x != null),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return out({ error: "غير مصرّح" }, 401);
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return out({ error: "غير مصرّح" }, 401);

    const key = Deno.env.get("GEMINI_API_KEY") || "";
    const model = Deno.env.get("GEMINI_MODEL") || MODEL_DEFAULT;
    const b = await req.json();

    // Status ping: any authenticated user may ask (the client UI hides until this says configured).
    if (b.action === "status") return out({ configured: !!key });

    const { data: me } = await admin.from("profiles").select("role,active").eq("id", u.user.id).maybeSingle();
    if (!me?.active) return out({ error: "الحساب موقوف" }, 403);

    if (b.action === "ask") {
      if (!key) return out({ error: "not_configured" }, 503);
      const q = clip(b.question, 600).trim();
      if (!q) return out({ error: "no_question" }, 400);

      // Rolling 24h cap per user (protects the shared free-tier quota).
      const windowStart = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await admin.from("ai_asks").select("id", { count: "exact", head: true })
        .eq("user_id", u.user.id).gte("created_at", windowStart);
      if ((count ?? 0) >= ASK_DAILY_CAP) return out({ error: "daily_cap" }, 429);

      const flag = async (reason: string) => {
        await admin.from("client_events").insert({
          client_id: u.user.id, kind: "ai_flag",
          event_date: new Date().toISOString().slice(0, 10),
          ref: "ai-" + Date.now(),
          data: { q: clip(q, 300), reason },
        });
      };
      const log = async (answer: string, kind: string) => {
        await admin.from("ai_asks").insert({ user_id: u.user.id, question: clip(q, 300), answer: clip(answer, 600), kind });
      };

      // Deterministic risk screen: skip the model entirely.
      if (RISK_RE.test(q)) {
        await flag("risk_screen");
        await log(ASK_ESCALATION, "flag");
        return out({ answer: ASK_ESCALATION, escalated: true });
      }

      const ctx = await clientContext(admin, u.user.id);
      const user = `سؤال العميل: ${scrub(q)}\n\nبيانات العميل (من غير اسم):\n${JSON.stringify(ctx)}`;
      const r: any = await llm(key, model, ASK_SYS, user, 500);
      if (r.error) return out({ error: r.error }, r.status);

      if (r.data.escalate === true || !r.data.answer) {
        await flag("model_unsure");
        await log(ASK_ESCALATION, "flag");
        return out({ answer: ASK_ESCALATION, escalated: true });
      }
      const answer = clip(r.data.answer, 600);
      await log(answer, "ok");
      return out({ answer, escalated: false });
    }

    if (me.role !== "coach") return out({ error: "للمدرب فقط" }, 403);
    if (!key) return out({ error: "not_configured" }, 503);

    if (b.action === "digest") {
      const cl = (Array.isArray(b.clients) ? b.clients : []).slice(0, 40).map((c: any) => ({
        id: clip(c.id, 8), week: +c.week || null, goal: clip(c.goal, 30), level: clip(c.level, 20),
        adherence7: c.adherence7 == null ? null : +c.adherence7, weights: Array.isArray(c.weights) ? c.weights.slice(-4).map(Number) : [],
        days_since_start: +c.days_since_start || null, flags: (Array.isArray(c.flags) ? c.flags : []).slice(0, 6).map((f: unknown) => clip(f, 80)),
      }));
      if (!cl.length) return out({ error: "no_clients" }, 400);
      const user = `ده ملخص عملاء الكوتش الاسبوع ده (JSON). اكتب ملخص اسبوعي للكوتش.\nرجّع JSON بالشكل ده بس: {"summary":"٢-٣ جمل عن الصورة العامة","items":[{"id":"C1","note":"جملة واحدة بتقول ايه الوضع","action":"اقتراح خطوة واحدة للكوتش"}]}\nرتّب items بالأهم الاول، وحط بس العملاء اللي محتاجين اهتمام او اللي عملوا تقدم يستاهل الشكر (حد اقصى ١٠).\n${JSON.stringify(cl)}`;
      const r: any = await llm(key, model, SYS, user, 1400);
      if (r.error) return out({ error: r.error }, r.status);
      const items = (Array.isArray(r.data.items) ? r.data.items : []).slice(0, 10).map((i: any) => ({ id: clip(i.id, 8), note: clip(i.note, 300), action: clip(i.action, 300) }));
      return out({ summary: clip(r.data.summary, 600), items });
    }

    if (b.action === "reply") {
      const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-10).map((m: any) => ({ from: m.from === "coach" ? "coach" : "client", text: clip(m.text, 400) })).filter((m: any) => m.text);
      const ctx = clip(b.context, 500);
      if (!msgs.length && !ctx) return out({ error: "no_context" }, 400);
      const user = `اكتب مسودتين مختلفتين لرد الكوتش على العميل (جملة الى ٣ جمل، لهجة الكوتش الودودة، سؤال واحد كحد اقصى، ماتحطش اسم).\nرجّع JSON بالشكل ده بس: {"drafts":["...","..."]}\nسياق: ${ctx || "—"}\nآخر الرسايل (قديم لجديد): ${JSON.stringify(msgs)}`;
      const r: any = await llm(key, model, SYS, user, 500);
      if (r.error) return out({ error: r.error }, r.status);
      const drafts = (Array.isArray(r.data.drafts) ? r.data.drafts : []).slice(0, 2).map((d: unknown) => clip(d, 600)).filter(Boolean);
      return out({ drafts });
    }
    return out({ error: "bad_action" }, 400);
  } catch (e) {
    return out({ error: "server" }, 500);
  }
});
