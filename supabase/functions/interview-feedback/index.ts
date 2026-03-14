import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FeedbackRequest {
  userResponse: string;
  scenario: string;
  question: string;
  buzzwords: string[];
  persona: string; // humble_leader | tech_genius | creative_dreamer
  marketId: string;
  path: string; // consulting | academic
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userResponse, scenario, question, buzzwords, persona, marketId, path } = await req.json() as FeedbackRequest;

    if (!userResponse || userResponse.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Response too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const personaFocus: Record<string, string> = {
      humble_leader: "collaboration, empathy, team dynamics, and servant leadership",
      tech_genius: "data-driven arguments, technical accuracy, analytical rigor, and quantitative reasoning",
      creative_dreamer: "creativity, bold vision, innovative thinking, and storytelling",
    };

    const reviewLens = personaFocus[persona] || personaFocus.humble_leader;

    const structureKeywords = [
      "first", "second", "third", "firstly", "secondly", "thirdly",
      "in conclusion", "to summarize", "let me break this down",
      "on one hand", "on the other hand", "there are two key",
      "i would approach this by", "my framework", "step one", "step two",
    ];

    const systemPrompt = `You are Sophia Hernández, a sharp, warm, and inspiring case interview coach. You speak to students like a cool older sister who went to a top consulting firm. Your tone is encouraging but honest — you push students to be their best.

You are reviewing a ${path === 'academic' ? 'scholarship/academic interview' : 'case interview/consulting prep'} response for the ${marketId} industry.

SCENARIO: ${scenario}
QUESTION: ${question}

INDUSTRY BUZZWORDS TO LOOK FOR: ${buzzwords.join(', ')}

THE USER'S CHOSEN PERSONA: "${persona}" — so evaluate their answer with extra focus on: ${reviewLens}

GRADING CRITERIA:
1. STRUCTURE (40%): Did they use a clear framework? Look for transition words like "First/Second/Third", "Let me break this down", etc.
2. CONTENT (35%): Did they demonstrate industry knowledge? Did they use relevant buzzwords naturally?
3. PERSONA FIT (25%): Does the answer match their chosen persona style?

RESPOND IN THIS EXACT JSON FORMAT:
{
  "score": <number 0-100>,
  "structureScore": <number 0-100>,
  "contentScore": <number 0-100>,
  "personaScore": <number 0-100>,
  "awesome": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "missing": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "trySaying": "A rewritten version of their answer that would score 95+, written in their persona style. Keep it under 150 words.",
  "buzzwordsUsed": ["list of industry buzzwords they correctly used"],
  "buzzwordsMissed": ["list of key buzzwords they should have included"],
  "sophiaSays": "A 1-2 sentence encouraging message in Sophia's voice"
}

IMPORTANT: Write for a 15-year-old reader. Be warm, direct, and inspiring. Use active language. Avoid corporate jargon in YOUR feedback (even if you expect it in their answer).`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userResponse },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — try again in a moment" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed — contact support" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI evaluation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from the response (handle markdown code blocks)
    let feedback;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      feedback = {
        score: 60,
        structureScore: 50,
        contentScore: 60,
        personaScore: 70,
        awesome: ["You attempted the question — that takes courage!", "You showed some relevant thinking", "Good effort on engaging with the scenario"],
        missing: ["Try using a clear framework (First, Second, Third)", "Include industry-specific terms", "Be more specific with numbers and examples"],
        trySaying: "I couldn't generate a specific rewrite, but try starting with 'I'd approach this in three steps...' and include specific numbers.",
        buzzwordsUsed: [],
        buzzwordsMissed: buzzwords.slice(0, 3),
        sophiaSays: "Hey, good start! The fact that you're practicing already puts you ahead. Let's polish this answer together! 💪",
      };
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Interview feedback error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
