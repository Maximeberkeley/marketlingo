// Weekly Case: scoring and release.
//
//   POST {action:"score", caseId}   signed-in learner: grades their own submission (idempotent)
//   POST {action:"release"}         no sign-in: grades anything left ungraded in cases that have closed, then
//                                   releases the scores. It only does work that is already due, and a second
//                                   call changes nothing, so anyone (the hourly cron, or a learner opening
//                                   their results) may call it.
//
// Cases and their private grader key are loaded by the load-weekly-cases function, not here.
// The model call stays here. Learner text is only ever sent as data inside <learner_answer> tags.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildAnswerMessage,
  buildScoringPrompt,
  overallScore,
  parseScore,
  partsOf,
  thinThreshold,
  type PartSpec,
  type ScoringContext,
} from "../_shared/weekly-case.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = Deno.env.get("WEEKLY_CASE_MODEL") || "google/gemini-3-flash-preview";
/** A grading claim older than this is treated as abandoned and may be taken over. */
const CLAIM_MS = 3 * 60 * 1000;
const MAX_ATTEMPTS = 4;
const RELEASE_BATCH = 20;
const LIVE = ["scheduled", "published"];

const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

type Db = ReturnType<typeof admin>;

async function askModel(system: string, user: string, retryNote = ""): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("AI not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(55_000),
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system + retryNote },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`gateway ${res.status}`);
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

type Loaded = { ctx: ScoringContext; parts: PartSpec[]; thinBelow: number };

async function loadContext(db: Db, caseId: string): Promise<Loaded | null> {
  const [{ data: c }, { data: k }] = await Promise.all([
    db.from("weekly_cases").select("title, content").eq("id", caseId).in("status", LIVE).maybeSingle(),
    db.from("weekly_case_scoring").select("rubric, model_answer, common_traps, facts").eq("case_id", caseId).maybeSingle(),
  ]);
  if (!c || !k) return null;
  const parts = partsOf(c.content);
  if (!parts.length || !Array.isArray(k.rubric) || !k.rubric.length) return null;
  const content = c.content as Record<string, any>;
  return {
    parts,
    thinBelow: thinThreshold(parts),
    ctx: {
      title: c.title,
      tension: String(content.tension ?? ""),
      brief: Array.isArray(content.brief) ? content.brief : [],
      exhibits: Array.isArray(content.exhibits) ? content.exhibits : [],
      question: String(content.question?.text ?? ""),
      parts,
      rubric: k.rubric,
      model_answer: k.model_answer ?? { summary: "", parts: [] },
      common_traps: k.common_traps ?? [],
      facts: k.facts ?? [],
    },
  };
}

type Sub = { id: string; case_id: string; answers: Record<string, string>; word_count: number; scored_at: string | null; score_attempts: number };

/** Grades one submission. Returns "scored", "skipped" (done or claimed by someone else) or "failed". */
async function scoreOne(db: Db, sub: Sub, loaded: Loaded): Promise<"scored" | "skipped" | "failed"> {
  if (sub.scored_at) return "skipped";
  // Claim it, so two callers never grade the same answer at once.
  const stale = new Date(Date.now() - CLAIM_MS).toISOString();
  const { data: claimed } = await db.from("weekly_case_submissions")
    .update({ scoring_started_at: new Date().toISOString(), score_attempts: sub.score_attempts + 1 })
    .eq("id", sub.id).is("scored_at", null)
    .or(`scoring_started_at.is.null,scoring_started_at.lt.${stale}`)
    .select("id");
  if (!claimed?.length) return "skipped";

  const system = buildScoringPrompt(loaded.ctx);
  const user = buildAnswerMessage(loaded.parts, sub.answers);
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await askModel(system, user, attempt ? "\n\nYour last reply was not valid. Reply with only the JSON object." : "");
      const parsed = parseScore(raw, loaded.ctx.rubric);
      const score = overallScore(parsed.breakdown, sub.word_count, parsed.manipulation_attempt, loaded.thinBelow);
      await db.from("weekly_case_submissions").update({
        score,
        breakdown: parsed.breakdown,
        strongest_move: parsed.strongest_move,
        sharpen: parsed.sharpen,
        scored_at: new Date().toISOString(),
        score_error: null,
      }).eq("id", sub.id);
      return "scored";
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  // Let the claim lapse so the next call can try again, up to MAX_ATTEMPTS.
  await db.from("weekly_case_submissions").update({ score_error: lastError.slice(0, 200), scoring_started_at: null }).eq("id", sub.id);
  return "failed";
}

async function scoreBatch(db: Db, caseId: string, only?: { userId: string }) {
  const loaded = await loadContext(db, caseId);
  if (!loaded) return { scored: 0, failed: 0, pending: 0, error: "case or grader key missing" };
  let q = db.from("weekly_case_submissions")
    .select("id, case_id, answers, word_count, scored_at, score_attempts")
    .eq("case_id", caseId).eq("status", "submitted").is("scored_at", null).lt("score_attempts", MAX_ATTEMPTS).limit(RELEASE_BATCH);
  if (only) q = q.eq("user_id", only.userId);
  const { data: subs } = await q;
  let scored = 0, failed = 0;
  const queue = [...((subs ?? []) as Sub[])];
  await Promise.all(Array.from({ length: 3 }, async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const r = await scoreOne(db, s, loaded);
      if (r === "scored") scored++; else if (r === "failed") failed++;
    }
  }));
  const { count } = await db.from("weekly_case_submissions").select("id", { count: "exact", head: true })
    .eq("case_id", caseId).eq("status", "submitted").is("scored_at", null).lt("score_attempts", MAX_ATTEMPTS);
  return { scored, failed, pending: count ?? 0 };
}

/** Every case that has closed: grade what is left, then release it. */
async function release(db: Db) {
  const { data: cases } = await db.from("weekly_cases").select("id, week_start")
    .in("status", LIVE).lte("closes_at", new Date().toISOString())
    .order("closes_at", { ascending: false }).limit(4);
  const out: Record<string, unknown>[] = [];
  for (const c of cases ?? []) {
    const { count: unreleased } = await db.from("weekly_case_submissions").select("id", { count: "exact", head: true })
      .eq("case_id", c.id).eq("status", "submitted").is("released_at", null);
    if (!unreleased) continue;
    const graded = await scoreBatch(db, c.id);
    const { data: released } = await db.rpc("finalize_weekly_case", { p_case_id: c.id });
    out.push({ week_start: c.week_start, ...graded, released: released ?? 0 });
  }
  return { cases: out };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const db = admin();

    if (body.action === "release") return json(await release(db));

    if (body.action === "score") {
      const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      const { data: { user } } = await db.auth.getUser(token);
      if (!user) return json({ error: "Not signed in." }, 401);
      if (typeof body.caseId !== "string") return json({ error: "caseId is required." }, 400);
      // Only the learner's own answer.
      return json(await scoreBatch(db, body.caseId, { userId: user.id }));
    }
    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    console.error("weekly-case", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
