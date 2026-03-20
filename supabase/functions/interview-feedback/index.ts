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
  persona: string; // consultant | tech_lead | recruiter
  marketId: string;
  path: string; // consulting | academic
  questionNumber?: number; // 1-5 for sequential mock
  totalQuestions?: number;
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

    const { userResponse, scenario, question, buzzwords, persona, marketId, path, questionNumber, totalQuestions } = await req.json() as FeedbackRequest;

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

    // Persona definitions — 3 distinct interviewer styles
    const personaProfiles: Record<string, { name: string; style: string; focus: string }> = {
      consultant: {
        name: "The Consultant",
        style: "Professional and structured. You focus on frameworks, ROI, and business impact. You reward MECE thinking, quantitative reasoning, and clear structure. You speak like a McKinsey partner — direct, analytical, and results-oriented.",
        focus: "frameworks, structured thinking, ROI analysis, MECE logic, and quantitative reasoning",
      },
      tech_lead: {
        name: "The Tech Lead",
        style: "Technical and precise. You deep-dive into specifications, regulatory compliance (FAA/FDA/NIST), and technical feasibility. You reward domain expertise, technical accuracy, and understanding of engineering trade-offs. You speak like a senior engineer — curious, detail-oriented, and rigorous.",
        focus: "technical specifications, regulatory compliance, engineering trade-offs, and domain expertise",
      },
      recruiter: {
        name: "The Recruiter",
        style: "Warm but evaluative. You focus on cultural fit, behavioral competencies, and soft skills. You reward self-awareness, growth mindset, teamwork examples, and authentic storytelling. You speak like a senior talent partner — empathetic, perceptive, and looking for character.",
        focus: "cultural fit, behavioral competencies, teamwork, growth mindset, and authentic storytelling",
      },
      // Legacy personas mapped to new ones
      humble_leader: {
        name: "The Recruiter",
        style: "Warm but evaluative. You focus on cultural fit, behavioral competencies, and soft skills.",
        focus: "cultural fit, behavioral competencies, teamwork, growth mindset, and authentic storytelling",
      },
      tech_genius: {
        name: "The Tech Lead",
        style: "Technical and precise. You deep-dive into specifications and regulatory compliance.",
        focus: "technical specifications, regulatory compliance, engineering trade-offs, and domain expertise",
      },
      creative_dreamer: {
        name: "The Consultant",
        style: "Professional and structured. You focus on frameworks, ROI, and business impact.",
        focus: "frameworks, structured thinking, ROI analysis, MECE logic, and quantitative reasoning",
      },
    };

    const selectedPersona = personaProfiles[persona] || personaProfiles.consultant;
    const qProgress = questionNumber && totalQuestions ? `\n\nThis is question ${questionNumber} of ${totalQuestions} in a mock interview session.` : '';

    const systemPrompt = `You are Sophia Hernandez, a sharp, warm, and inspiring case interview coach. You are currently acting as "${selectedPersona.name}" interviewer persona.

PERSONA STYLE: ${selectedPersona.style}

You are reviewing a ${path === 'academic' ? 'scholarship/academic interview' : 'case interview/consulting prep'} response for the ${marketId} industry.${qProgress}

SCENARIO: ${scenario}
QUESTION: ${question}

INDUSTRY BUZZWORDS TO LOOK FOR: ${buzzwords.join(', ')}

EVALUATE WITH EXTRA FOCUS ON: ${selectedPersona.focus}

GRADING CRITERIA (score each out of 10):
1. INDUSTRY KNOWLEDGE (40%): Did they demonstrate real understanding of the industry? Did they use relevant technical terms naturally? Did they show awareness of current trends?
2. COMMUNICATION STYLE (35%): Was their answer structured? Did they use frameworks? Was the tone appropriate for a professional setting?
3. PERSONA FIT (25%): Does the answer match what "${selectedPersona.name}" would look for?

RESPOND IN THIS EXACT JSON FORMAT:
{
  "score": <number 1-10>,
  "industryKnowledgeScore": <number 1-10>,
  "communicationScore": <number 1-10>,
  "personaFitScore": <number 1-10>,
  "whatWentWell": "One specific, concrete positive point about their answer (1-2 sentences)",
  "roomForImprovement": "One specific suggestion with an industry-specific way to rephrase (1-2 sentences)",
  "betterVersion": "A rewritten version of their answer that would score 9-10/10, written in their persona style. Keep it under 120 words.",
  "buzzwordsUsed": ["list of industry buzzwords they correctly used"],
  "buzzwordsMissed": ["list of key buzzwords they should have included"],
  "sophiaSays": "A 1-2 sentence encouraging message in Sophia's voice — warm, direct, inspiring"
}

IMPORTANT: Write for a 15-year-old reader. Be warm, direct, and inspiring. Use active language. Score honestly — most first attempts should be 4-6/10.`;

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
        score: 5,
        industryKnowledgeScore: 4,
        communicationScore: 5,
        personaFitScore: 5,
        whatWentWell: "You attempted the question — that takes courage and is the first step to mastering interviews!",
        roomForImprovement: "Try using a clear framework (First, Second, Third) and include industry-specific terms to show domain expertise.",
        betterVersion: "I couldn't generate a specific rewrite, but try starting with 'I'd approach this in three steps...' and include specific numbers and industry terms.",
        buzzwordsUsed: [],
        buzzwordsMissed: buzzwords.slice(0, 3),
        sophiaSays: "Hey, good start! The fact that you're practicing already puts you ahead. Let's polish this answer together!",
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
