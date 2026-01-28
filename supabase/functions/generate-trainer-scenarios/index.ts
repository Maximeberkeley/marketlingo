import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Market-specific scenario themes for professional depth
const MARKET_SCENARIO_THEMES: Record<string, string[]> = {
  aerospace: [
    "OEM procurement negotiations and long sales cycles",
    "Certification pathway decisions (STC vs TC vs PMA)",
    "Defense contract bidding strategy (SBIR, OTA, primes)",
    "Supplier tier positioning and pricing power",
    "eVTOL/UAM market entry timing decisions",
    "Space economy partnerships and exclusivity deals",
    "ITAR compliance for international expansion",
    "MRO market entry vs OEM focus trade-offs",
  ],
  neuroscience: [
    "BCI clinical trial design and FDA pathway selection",
    "Digital therapeutics reimbursement strategy",
    "Psychedelic therapy regulatory navigation",
    "Neurodevice vs pharmaceutical business models",
    "Academic collaboration vs proprietary research",
    "Patient data privacy and neuroethics challenges",
    "CNS drug development timeline management",
    "Neurofeedback consumer vs clinical positioning",
  ],
  ai: [
    "AI platform moat vs feature competition from big tech",
    "Model training costs vs performance trade-offs",
    "Enterprise AI deployment security requirements",
    "Open source vs proprietary model strategy",
    "AI safety and bias mitigation decisions",
    "LLM wrapper startup differentiation",
    "Compute infrastructure build vs buy decisions",
    "AI regulation compliance across jurisdictions",
  ],
  fintech: [
    "Banking charter vs partner bank strategy",
    "Cross-border payments regulatory complexity",
    "Crypto/DeFi compliance and licensing decisions",
    "Neobank customer acquisition cost management",
    "Embedded finance partnership negotiations",
    "Payment fraud prevention vs user friction",
    "Credit underwriting model development",
    "Open banking API strategy and competition",
  ],
  ev: [
    "Battery cell sourcing and supply chain decisions",
    "Charging network build vs partner strategy",
    "EV fleet vs consumer market focus",
    "Solid-state battery timing and technology bets",
    "Automotive OEM partnership negotiations",
    "Recycling and second-life battery economics",
    "EV infrastructure government incentive navigation",
    "Autonomous vehicle integration challenges",
  ],
  biotech: [
    "Drug licensing deal structure optimization",
    "Clinical trial design for accelerated approval",
    "Gene therapy manufacturing scale decisions",
    "FDA vs EMA regulatory pathway selection",
    "Rare disease orphan drug strategy",
    "Biomarker development and precision medicine",
    "CDMO partnership vs in-house manufacturing",
    "Patent cliff preparation and life cycle management",
  ],
  cleanenergy: [
    "Solar/wind project development financing",
    "Energy storage technology selection",
    "Power purchase agreement negotiations",
    "Grid interconnection queue management",
    "Tax credit monetization strategies",
    "Utility relationship building and RFPs",
    "Community solar vs utility scale decisions",
    "Carbon credit revenue and verification",
  ],
  cybersecurity: [
    "Enterprise security sales cycle management",
    "SIEM vs EDR vs XDR product positioning",
    "Government security clearance business strategy",
    "Managed security service vs product model",
    "Security compliance certification decisions",
    "Threat intelligence sharing and partnerships",
    "Zero-trust architecture implementation",
    "Incident response service scalability",
  ],
  spacetech: [
    "Launch vehicle development vs rideshare strategy",
    "Satellite constellation economics and spectrum",
    "Space manufacturing in-orbit vs ground",
    "NASA Commercial partnerships negotiation",
    "Space debris mitigation and regulations",
    "ITAR and export control compliance",
    "Space tourism liability and insurance",
    "Ground segment build vs partner decisions",
  ],
  healthtech: [
    "FDA 510(k) vs PMA pathway selection",
    "Telehealth reimbursement navigation",
    "EHR integration and interoperability",
    "Healthcare payer contract negotiation",
    "Clinical validation study design",
    "HIPAA compliance and data security",
    "Hospital procurement process navigation",
    "Value-based care model development",
  ],
  robotics: [
    "Industrial vs service robot market focus",
    "Custom vs platform robotics strategy",
    "Autonomous navigation safety certification",
    "Manufacturing partner vs in-house production",
    "Robot-as-a-service pricing models",
    "Human-robot interaction design decisions",
    "Warehouse automation market timing",
    "Agricultural robotics seasonal challenges",
  ],
  agtech: [
    "Precision agriculture data ownership",
    "Vertical farming economics and scale",
    "Seed technology IP and licensing",
    "Farm equipment OEM partnership strategy",
    "Carbon credit and regenerative ag revenue",
    "Supply chain traceability implementation",
    "Agricultural drone regulatory compliance",
    "Crop insurance and risk management products",
  ],
  climatetech: [
    "Carbon capture technology selection",
    "Climate finance and project development",
    "Carbon offset verification and quality",
    "Government climate incentive navigation",
    "Sustainable materials market timing",
    "Corporate sustainability buyer engagement",
    "Climate risk assessment product design",
    "Nature-based solutions vs engineered",
  ],
  logistics: [
    "Last-mile delivery economics optimization",
    "Warehouse automation technology selection",
    "Fleet electrification timing decisions",
    "3PL vs asset-light model trade-offs",
    "Supply chain visibility platform strategy",
    "Cross-border logistics compliance",
    "Same-day delivery service economics",
    "Autonomous delivery vehicle deployment",
  ],
  web3: [
    "Token economics and incentive design",
    "Smart contract audit and security",
    "DAO governance structure decisions",
    "Crypto exchange listing strategy",
    "DeFi protocol liquidity bootstrapping",
    "NFT utility vs speculative positioning",
    "Regulatory compliance across jurisdictions",
    "Bridge security and cross-chain strategy",
  ],
};

interface GenerateRequest {
  marketId: string;
  count?: number;
  dryRun?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marketId, count = 10, dryRun = false } = await req.json() as GenerateRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const themes = MARKET_SCENARIO_THEMES[marketId];
    if (!themes) {
      return new Response(JSON.stringify({
        error: `Unknown market: ${marketId}`,
        availableMarkets: Object.keys(MARKET_SCENARIO_THEMES),
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check existing count
    const { count: existingCount } = await supabase
      .from('trainer_scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', marketId);

    if (dryRun) {
      return new Response(JSON.stringify({
        market: marketId,
        existingScenarios: existingCount || 0,
        willGenerate: count,
        themes: themes,
        message: `Would generate ${count} trainer scenarios for ${marketId}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      market: marketId,
      generated: 0,
      errors: [] as string[],
    };

    // Generate scenarios in batches
    for (let i = 0; i < count; i++) {
      try {
        const theme = themes[i % themes.length];
        const scenario = await generateScenario(LOVABLE_API_KEY, marketId, theme);
        
        if (scenario) {
          const { error } = await supabase.from('trainer_scenarios').insert({
            market_id: marketId,
            scenario: scenario.scenario,
            question: scenario.question,
            options: scenario.options,
            correct_option_index: scenario.options.findIndex((o: any) => o.isCorrect),
            feedback_pro_reasoning: scenario.feedback_pro_reasoning,
            feedback_common_mistake: scenario.feedback_common_mistake,
            feedback_mental_model: scenario.feedback_mental_model,
            follow_up_question: scenario.follow_up_question,
            sources: scenario.sources || [],
            tags: scenario.tags || [marketId],
          });

          if (error) {
            results.errors.push(`Insert error: ${error.message}`);
          } else {
            results.generated++;
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1200));
        
      } catch (error) {
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Trainer scenario generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateScenario(apiKey: string, marketId: string, theme: string) {
  const marketNames: Record<string, string> = {
    aerospace: "aerospace and aviation",
    neuroscience: "neuroscience and neurotech",
    ai: "AI and machine learning",
    fintech: "fintech and financial services",
    ev: "electric vehicles and e-mobility",
    biotech: "biotech and pharmaceuticals",
    cleanenergy: "clean energy and renewables",
    cybersecurity: "cybersecurity",
    spacetech: "space technology",
    healthtech: "healthtech and digital health",
    robotics: "robotics and automation",
    agtech: "agricultural technology",
    climatetech: "climate technology",
    logistics: "logistics and supply chain",
    web3: "Web3, blockchain, and crypto",
  };

  const marketName = marketNames[marketId] || marketId;

  const systemPrompt = `You are a senior ${marketName} industry strategist with 25+ years of experience advising Fortune 500 companies and venture-backed startups.

You create challenging, realistic decision-making scenarios that test strategic thinking. Your scenarios are based on REAL situations that professionals in ${marketName} actually face.

Key requirements:
- Make scenarios specific with realistic numbers, timelines, and constraints
- All 4 options should seem reasonable to a novice
- Only ONE option should be clearly superior upon expert analysis  
- Include expert-level reasoning that teaches valuable lessons
- Reference real industry dynamics, regulations, and market conditions`;

  const userPrompt = `Create a challenging strategic decision scenario for a startup founder in ${marketName}, focused on: "${theme}"

Return valid JSON only:
{
  "scenario": "A detailed scenario (400-600 characters) presenting a genuine strategic dilemma with specific context, numbers, timelines, and constraints. Reference realistic market conditions and industry dynamics.",
  "question": "Clear decision question (e.g., 'What is your best strategic move?' or 'How should you respond?')",
  "options": [
    {"label": "Option A - a specific strategic action (50-100 chars)", "isCorrect": false},
    {"label": "Option B - a specific strategic action (50-100 chars)", "isCorrect": true},
    {"label": "Option C - a specific strategic action (50-100 chars)", "isCorrect": false},
    {"label": "Option D - a specific strategic action (50-100 chars)", "isCorrect": false}
  ],
  "feedback_pro_reasoning": "Expert explanation (300-500 chars) of why the correct answer demonstrates superior strategic thinking. Reference industry norms, typical outcomes, and proven frameworks.",
  "feedback_common_mistake": "The most frequent error inexperienced founders make in this situation and why (100-200 chars)",
  "feedback_mental_model": "A reusable principle or framework that applies beyond this specific scenario (50-100 chars)",
  "follow_up_question": "A deeper reflection question that prompts self-examination of the founder's own situation",
  "tags": ["${theme.split(' ')[0].toLowerCase()}", "${marketId}", "strategy"]
}

IMPORTANT: 
- Make the correct answer (isCorrect: true) the one that demonstrates expert-level strategic thinking
- Randomize which option is correct (not always the same position)
- Ensure all option labels are substantive action statements, not one-word answers`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}
