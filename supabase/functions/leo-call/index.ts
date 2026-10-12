// Leo voice call — one short spoken turn at a time, plus an end-of-call recap.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";

type CallType = "explain" | "coffee" | "interview";
interface Ctx {
  callType: CallType;
  lessonTitle?: string;
  takeaway?: string;
  briefLines?: { section: string; text: string }[];
  briefSections?: { key: string; title: string }[];
  goal?: string;
  level?: string;
  industry?: string;
  target?: { company?: string; role?: string; date?: string | null } | null;
}
interface Msg { role: "user" | "assistant"; content: string }

const clip = (s: unknown, n: number) => String(s ?? "").slice(0, n);

function persona(c: Ctx): string {
  const industry = c.industry || "the learner's industry";
  if (c.callType === "explain")
    return `You are Leo, a curious friend with no background in ${industry}. The learner just finished a lesson and you want them to explain it to you. Ask simple "wait, so why…?" questions that make them put the idea in their own words.`;
  if (c.callType === "coffee")
    return `You are Leo, playing an engineer at a well-known company working in ${industry}. Name the company once in your first line (a real, well-known one that fits the industry). The learner is on a coffee chat and should be asking YOU questions. Answer briefly and from experience, then nudge them to ask the next question. Do not invent numbers.`;
  const t = c.target;
  const who = t?.company || t?.role
    ? `${t?.role ? `a ${t.role} role` : "a role"}${t?.company ? ` at ${t.company}` : ""}`
    : `an entry-level role in ${industry}`;
  return `You are Leo, playing a friendly but sharp interviewer for ${who}. This is a short warm-up, not the real interview. Ask one interview question at a time, follow up on what they said, and keep it encouraging.`;
}

function instructions(c: Ctx, learnerTurns: number): string {
  const lines = (c.briefLines ?? []).slice(0, 8).map((l) => `- (${clip(l.section, 40)}) ${clip(l.text, 200)}`).join("\n");
  const wrap = learnerTurns >= 7
    ? "\nTIME: The call is at about 3 minutes. Wrap up now with one warm closing line and no question. End your reply with [END]."
    : learnerTurns >= 5
      ? "\nTIME: Close to 3 minutes. Start steering toward a natural close within one or two turns."
      : "";
  return `${persona(c)}

CONTEXT (use naturally, never read it out):
Today's lesson: ${clip(c.lessonTitle, 160) || "unknown"}
Takeaway: ${clip(c.takeaway, 300) || "unknown"}
Learner goal: ${clip(c.goal, 40) || "unknown"} · level: ${clip(c.level, 40) || "unknown"}
Interview target: ${c.target ? `${clip(c.target.company, 60)} · ${clip(c.target.role, 60)} · ${c.target.date || "no date yet"}` : "none"}
The learner's own Interview Brief lines:
${lines || "- none yet"}

HOW YOU TALK (this is a spoken phone call):
- Max 2 short sentences per turn. Ask one question at a time.
- Plain words. No jargon unless the learner used it first.
- React to what the learner actually just said. Never lecture or list.
- If you are unsure of a fact, say so. Never invent numbers.
- No emojis, no markdown, no stage directions.
- Wrap up naturally after about 6 to 8 turns (around 3 minutes).${wrap}`;
}

async function callModel(apiKey: string, body: Record<string, unknown>): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, stream: true, store: false, reasoning: { effort: "low" }, ...body }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    console.error("leo-call gateway", res.status, t);
    let msg = "Leo couldn't answer right now.";
    try { msg = JSON.parse(t)?.message || JSON.parse(t)?.error?.message || msg; } catch { /* keep */ }
    return { ok: false, status: res.status, error: msg };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        else if (ev.type === "response.failed" || ev.type === "error") {
          return { ok: false, status: 500, error: ev.response?.error?.message || ev.message || "Leo couldn't answer right now." };
        }
      } catch { /* partial */ }
    }
  }
  return { ok: true, text: text.trim() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not signed in" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Not signed in" }, 401);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 500);

    const { action = "turn", context, messages = [] } = (await req.json()) as { action?: string; context: Ctx; messages: Msg[] };
    if (!context || !["explain", "coffee", "interview"].includes(context.callType)) return json({ error: "Bad call type" }, 400);
    const history: Msg[] = (Array.isArray(messages) ? messages : []).slice(-24)
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: clip(m.content, 1200) }));

    if (action === "turn") {
      const learnerTurns = history.filter((m) => m.role === "user").length;
      const input = history.length
        ? history
        : [{ role: "user", content: "(The call just connected. Speak first: greet the learner in one short line and ask your first question.)" }];
      const r = await callModel(apiKey, { instructions: instructions(context, learnerTurns), input });
      if (!r.ok) return json({ error: r.error }, r.status);
      const ended = /\[END\]/.test(r.text);
      const reply = r.text.replace(/\[END\]/g, "").replace(/\s+/g, " ").trim();
      if (!reply) return json({ error: "Leo couldn't answer right now." }, 502);
      return json({ reply, ended });
    }

    if (action === "recap") {
      const learnerWords = history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
      if (learnerWords.trim().split(/\s+/).length < 6) return json({ recap: null });
      const sections = (context.briefSections ?? []).slice(0, 10);
      const transcript = history.map((m) => `${m.role === "user" ? "LEARNER" : "LEO"}: ${m.content}`).join("\n");
      const r = await callModel(apiKey, {
        instructions: `You review a short practice call. Write plain, specific, one-line feedback (max 14 words each) grounded only in what the LEARNER said. Never invent facts or numbers.
- explainedWell: something the learner explained or asked well.
- nextTime: one concrete thing to try next time.
- insiderWord: one industry term the learner actually said, or "" if none.
- briefLine: one Interview Brief line in first person, built from the learner's own words (lightly cleaned up, max 28 words).
- sectionKey: the best matching key from: ${sections.map((s) => `${s.key} (${s.title})`).join(", ") || "none"}.`,
        input: [{ role: "user", content: `Lesson: ${clip(context.lessonTitle, 160)}\n\n${transcript}` }],
        text: {
          format: {
            type: "json_schema", name: "recap", strict: true,
            schema: {
              type: "object", additionalProperties: false,
              required: ["explainedWell", "nextTime", "insiderWord", "briefLine", "sectionKey"],
              properties: {
                explainedWell: { type: "string" }, nextTime: { type: "string" }, insiderWord: { type: "string" },
                briefLine: { type: "string" }, sectionKey: { type: "string" },
              },
            },
          },
        },
      });
      if (!r.ok) return json({ error: r.error }, r.status);
      try {
        const recap = JSON.parse(r.text);
        // Only keep a term the learner actually said.
        if (recap.insiderWord && !learnerWords.toLowerCase().includes(String(recap.insiderWord).toLowerCase())) recap.insiderWord = "";
        if (!sections.some((s) => s.key === recap.sectionKey)) recap.sectionKey = sections[0]?.key ?? "";
        return json({ recap });
      } catch {
        return json({ error: "Recap could not be read" }, 502);
      }
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("leo-call error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
