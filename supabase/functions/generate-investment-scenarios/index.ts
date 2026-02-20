import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALL_MARKETS = [
  "aerospace", "neuroscience", "ai", "fintech", "ev", "biotech",
  "cleanenergy", "agtech", "climatetech", "cybersecurity", "spacetech",
  "robotics", "healthtech", "logistics", "web3"
];

const SCENARIO_TYPES = ["valuation", "due_diligence", "risk", "portfolio"] as const;
type ScenarioType = typeof SCENARIO_TYPES[number];

// Target at least 6 scenarios per type per market (24 total per market → meets 20 cert threshold)
const TARGET_PER_TYPE = 6;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Allow targeting a specific market or run all
  let body: { market_id?: string; scenario_type?: string; count?: number } = {};
  try { body = await req.json(); } catch { /* no body */ }

  const marketsToProcess = body.market_id ? [body.market_id] : ALL_MARKETS;
  const typesToProcess: ScenarioType[] = (body.scenario_type as ScenarioType | undefined)
    ? [body.scenario_type as ScenarioType]
    : [...SCENARIO_TYPES];
  const targetCount = body.count || TARGET_PER_TYPE;

  const results: Record<string, Record<string, number>> = {};
  let totalGenerated = 0;

  // Run generation in background to avoid timeout
  (async () => {
    for (const marketId of marketsToProcess) {
      results[marketId] = {};

      for (const scenarioType of typesToProcess) {
        // Check how many already exist
        const { count: existing } = await supabase
          .from("investment_scenarios")
          .select("id", { count: "exact", head: true })
          .eq("market_id", marketId)
          .eq("scenario_type", scenarioType);

        const toGenerate = Math.max(0, targetCount - (existing || 0));
        let generated = 0;

        for (let i = 0; i < toGenerate; i++) {
          try {
            const scenario = await generateScenario(LOVABLE_API_KEY, marketId, scenarioType, i);
            if (scenario) {
              const { error } = await supabase.from("investment_scenarios").insert(scenario);
              if (!error) {
                generated++;
                totalGenerated++;
              } else {
                console.error(`Insert error ${marketId}/${scenarioType}:`, error);
              }
            }
            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 800));
          } catch (e) {
            console.error(`Generation error ${marketId}/${scenarioType} #${i}:`, e);
          }
        }

        results[marketId][scenarioType] = generated;
        console.log(`${marketId}/${scenarioType}: generated ${generated} (had ${existing})`);
      }
    }
    console.log(`Total generated: ${totalGenerated}`);
  })().catch(e => console.error("Background generation error:", e));

  return new Response(JSON.stringify({
    message: "Investment scenario generation started in background",
    markets: marketsToProcess,
    scenario_types: typesToProcess,
    target_per_type: targetCount,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});

async function generateScenario(
  apiKey: string,
  marketId: string,
  scenarioType: ScenarioType,
  index: number
): Promise<Record<string, unknown> | null> {
  const typeDescriptions: Record<ScenarioType, string> = {
    valuation: "company/startup valuation (DCF, comparables, revenue multiples, growth-adjusted EV/EBITDA)",
    due_diligence: "investment due diligence process (team assessment, market size, IP, competitive moat, financial health)",
    risk: "investment risk assessment (market risk, execution risk, regulatory risk, technology risk, macro factors)",
    portfolio: "portfolio construction and allocation strategy (diversification, concentration, stage-gate, exit strategy)",
  };

  const difficultyLevels = ["intermediate", "advanced", "expert"];
  const difficulty = difficultyLevels[index % 3];

  const systemPrompt = `You are a senior venture capital analyst and investment educator specializing in the ${marketId} industry. 
Create challenging, realistic investment scenarios that test genuine analytical thinking.
Reference real companies, actual market dynamics, and authentic financial metrics from the ${marketId} sector.
All scenarios must be specific, data-driven, and reflect real-world complexity.`;

  const userPrompt = `Generate ONE expert-quality investment scenario for the ${marketId} market focused on: ${typeDescriptions[scenarioType]}.

Difficulty level: ${difficulty}

Requirements:
- The scenario must reference real or highly realistic companies/dynamics in the ${marketId} space
- Include specific numbers (revenue, market size, multiples, growth rates)
- The question must force genuine analytical thinking, not obvious guesses
- Options must all be plausible — only one is clearly best given the context
- The explanation must teach a real mental model or framework
- Real world example must cite an actual deal/company/event

Return ONLY valid JSON (no markdown):
{
  "title": "Short scenario title (max 8 words)",
  "scenario": "Detailed investment scenario with specific numbers and context (200-400 chars)",
  "question": "What is the most appropriate investment action/assessment? (max 150 chars)",
  "options": [
    {"text": "Option A (50-100 chars)", "isCorrect": false},
    {"text": "Option B (50-100 chars)", "isCorrect": true},
    {"text": "Option C (50-100 chars)", "isCorrect": false},
    {"text": "Option D (50-100 chars)", "isCorrect": false}
  ],
  "explanation": "Why the correct answer is right, and what framework applies (200-350 chars)",
  "real_world_example": "Actual deal/company that illustrates this exact scenario (100-200 chars)",
  "valuation_model": "${scenarioType === 'valuation' ? 'e.g. DCF, EV/Revenue, Comparable Analysis' : 'null'}",
  "difficulty": "${difficulty}",
  "tags": ["${marketId}", "${scenarioType}", "${difficulty}"]
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    console.error(`AI error ${response.status}:`, await response.text());
    return null;
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("Parse error:", content);
    return null;
  }

  // Validate required fields
  if (!parsed.title || !parsed.scenario || !parsed.question || !Array.isArray(parsed.options)) {
    console.error("Missing required fields:", parsed);
    return null;
  }

  const options = parsed.options as { text?: string; isCorrect?: boolean }[];
  const correctIndex = options.findIndex(o => o.isCorrect === true);
  if (correctIndex === -1) return null;

  return {
    market_id: marketId,
    scenario_type: scenarioType,
    title: parsed.title,
    scenario: parsed.scenario,
    question: parsed.question,
    options: parsed.options,
    correct_option_index: correctIndex,
    explanation: parsed.explanation || null,
    real_world_example: parsed.real_world_example || null,
    valuation_model: parsed.valuation_model && parsed.valuation_model !== "null" ? parsed.valuation_model : null,
    difficulty: parsed.difficulty || "intermediate",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [marketId, scenarioType],
  };
}
