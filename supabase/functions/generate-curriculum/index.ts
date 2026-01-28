import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multi-market curriculum structures
const CURRICULUM_STRUCTURES: Record<string, { months: { month: number; theme: string; topics: string[] }[] }> = {
  aerospace: {
    months: [
      {
        month: 1,
        theme: "Foundations",
        topics: [
          "Industry structure (OEMs, Tier 1-3 suppliers)",
          "Certification process (FAA/EASA, DO-178C, DO-160)",
          "Cost-plus vs fixed-price contracts",
          "Dual-use technology and ITAR regulations",
          "Supply chain dependencies and single-source risks",
        ],
      },
      {
        month: 2,
        theme: "Commercial Aviation",
        topics: [
          "Airbus vs Boeing duopoly dynamics and market share battles",
          "Narrow-body vs wide-body economics and fleet planning",
          "MRO (Maintenance, Repair, Overhaul) market and aftermarket revenue",
          "Airline fleet decisions and aircraft lifecycle management",
          "Aircraft leasing companies (AerCap, SMBC, Avolon) and financing structures",
        ],
      },
      {
        month: 3,
        theme: "Defense & Government",
        topics: [
          "Major defense primes (Lockheed Martin, RTX, Northrop Grumman, General Dynamics)",
          "DoD procurement process and SBIR/STTR programs",
          "ITAR compliance and export controls for startups",
          "Classified programs and security clearance requirements",
          "Allied interoperability and Five Eyes partnerships",
        ],
      },
      {
        month: 4,
        theme: "Space Economy",
        topics: [
          "Launch economics and reusability (SpaceX, Rocket Lab, Blue Origin)",
          "Satellite constellations (Starlink, OneWeb, Kuiper) and spectrum management",
          "Space tourism and commercial space stations (Axiom, Vast)",
          "NASA partnerships (Commercial Crew, Artemis) and cost-plus vs fixed-price",
          "Orbital debris mitigation and space sustainability regulations",
        ],
      },
      {
        month: 5,
        theme: "Emerging Technologies",
        topics: [
          "eVTOL development and urban air mobility certification challenges",
          "Autonomous flight systems and Part 135/Part 91 operations",
          "Sustainable aviation fuel (SAF) production and adoption curves",
          "Hydrogen propulsion infrastructure and storage challenges",
          "Advanced materials (carbon composites, titanium alloys, CMCs)",
        ],
      },
      {
        month: 6,
        theme: "Business & Strategy",
        topics: [
          "Aerospace M&A patterns and valuation multiples",
          "Startup survival strategies in long sales cycles",
          "Talent acquisition and workforce development",
          "Geopolitical supply chain risks (China rare earths, Russia titanium)",
          "Venture capital and strategic investor dynamics",
        ],
      },
    ],
  },
  neuroscience: {
    months: [
      {
        month: 1,
        theme: "Brain Science Foundations",
        topics: [
          "Neuroanatomy essentials (cortex, limbic system, brainstem)",
          "Neurotransmitters and synaptic signaling (dopamine, serotonin, GABA)",
          "Brain imaging technologies (fMRI, EEG, MEG, PET)",
          "Neural plasticity and learning mechanisms",
          "Blood-brain barrier and drug delivery challenges",
        ],
      },
      {
        month: 2,
        theme: "Neurotechnology & Devices",
        topics: [
          "Brain-computer interfaces (Neuralink, Synchron, Blackrock Neurotech)",
          "Non-invasive neurostimulation (TMS, tDCS, ultrasound)",
          "Neuroprosthetics and sensory restoration",
          "Wearable EEG and consumer neurotechnology",
          "FDA regulatory pathways for neurodevices (510k, PMA, De Novo)",
        ],
      },
      {
        month: 3,
        theme: "Mental Health Innovation",
        topics: [
          "Digital therapeutics for depression and anxiety (Pear, Akili)",
          "Psychedelic-assisted therapy (psilocybin, MDMA, ketamine)",
          "AI-powered mental health apps and chatbots",
          "Precision psychiatry and biomarker development",
          "Telepsychiatry platforms and reimbursement models",
        ],
      },
      {
        month: 4,
        theme: "Neurological Disease & Therapeutics",
        topics: [
          "Alzheimer's disease drug development (Lecanemab, Donanemab)",
          "Parkinson's and deep brain stimulation advances",
          "Epilepsy management and responsive neurostimulation",
          "Gene therapy for neurological conditions (Zolgensma, Luxturna)",
          "ALS and rare disease orphan drug strategies",
        ],
      },
      {
        month: 5,
        theme: "Cognitive Enhancement & AI",
        topics: [
          "Nootropics and cognitive enhancement supplements",
          "AI for brain mapping and connectome analysis",
          "Sleep optimization technology and circadian science",
          "Neurofeedback training and peak performance",
          "Memory enhancement and cognitive rehabilitation",
        ],
      },
      {
        month: 6,
        theme: "Neuro Business & Ethics",
        topics: [
          "Neurotech startup fundraising and investor landscape",
          "Clinical trial design for CNS therapeutics",
          "Neuroethics: privacy, consent, and cognitive liberty",
          "Healthcare system integration and payer negotiations",
          "Building neurotech teams: scientists, engineers, clinicians",
        ],
      },
    ],
  },
};

// Day types pattern for each week (7 days)
const WEEK_PATTERN = [
  "DAILY_GAME",
  "DAILY_GAME", 
  "MICRO_LESSON",
  "TRAINER",
  "BOOK_SNAPSHOT",
  "DAILY_GAME",
  "MICRO_LESSON",
];

interface GenerateRequest {
  marketId?: string;
  month?: number;
  week?: number;
  day?: number;
  dryRun?: boolean;
  generateSummaries?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marketId = 'aerospace', month, week, day, dryRun = false, generateSummaries = false } = await req.json() as GenerateRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const CURRICULUM_STRUCTURE = CURRICULUM_STRUCTURES[marketId];
    if (!CURRICULUM_STRUCTURE) {
      return new Response(JSON.stringify({
        error: `Unknown market: ${marketId}`,
        availableMarkets: Object.keys(CURRICULUM_STRUCTURES),
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate summaries if requested
    if (generateSummaries && month) {
      const summaryResults = await generateMonthSummaries(supabase, LOVABLE_API_KEY, month, marketId, CURRICULUM_STRUCTURE);
      return new Response(JSON.stringify(summaryResults), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate which days to generate
    let daysToGenerate: number[] = [];
    
    if (day !== undefined) {
      daysToGenerate = [day];
    } else if (week !== undefined) {
      const startDay = (week - 1) * 7 + 1;
      daysToGenerate = Array.from({ length: 7 }, (_, i) => startDay + i).filter(d => d <= 180);
    } else if (month !== undefined) {
      const startDay = (month - 1) * 30 + 1;
      daysToGenerate = Array.from({ length: 30 }, (_, i) => startDay + i).filter(d => d <= 180);
    } else {
      return new Response(JSON.stringify({
        market: marketId,
        structure: CURRICULUM_STRUCTURE,
        weekPattern: WEEK_PATTERN,
        totalDays: 180,
        message: "Specify month (1-6), week (1-26), or day (1-180) to generate content",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check what already exists
    const { data: existingStacks } = await supabase
      .from('stacks')
      .select('tags')
      .eq('market_id', marketId);
    
    const existingDays = new Set<number>();
    existingStacks?.forEach(stack => {
      const dayTag = (stack.tags as string[])?.find(t => t.startsWith('day-'));
      if (dayTag) {
        existingDays.add(parseInt(dayTag.replace('day-', '')));
      }
    });

    const newDays = daysToGenerate.filter(d => !existingDays.has(d));
    
    if (dryRun) {
      const plan = newDays.map(d => ({
        day: d,
        month: Math.ceil(d / 30),
        week: Math.ceil(d / 7),
        type: WEEK_PATTERN[(d - 1) % 7],
        theme: CURRICULUM_STRUCTURE.months[Math.ceil(d / 30) - 1]?.theme,
      }));
      
      return new Response(JSON.stringify({
        market: marketId,
        daysToGenerate: newDays,
        existingDays: Array.from(existingDays).sort((a, b) => a - b),
        plan,
        message: `Would generate ${newDays.length} days of content for ${marketId}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      market: marketId,
      generated: [] as number[],
      skipped: [] as number[],
      errors: [] as { day: number; error: string }[],
    };

    for (const dayNum of newDays) {
      try {
        const monthIndex = Math.ceil(dayNum / 30) - 1;
        const monthInfo = CURRICULUM_STRUCTURE.months[monthIndex];
        const dayType = WEEK_PATTERN[(dayNum - 1) % 7];
        const topicIndex = Math.floor((dayNum - 1) % 30 / 6) % monthInfo.topics.length;
        const topic = monthInfo.topics[topicIndex];

        const content = await generateDayContent(
          LOVABLE_API_KEY,
          dayNum,
          monthInfo.month,
          monthInfo.theme,
          topic,
          dayType,
          marketId
        );

        if (content) {
          await saveContent(supabase, content, dayNum, monthInfo.month, dayType, marketId);
          results.generated.push(dayNum);
        }

        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (error) {
        console.error(`Error generating day ${dayNum}:`, error);
        results.errors.push({ 
          day: dayNum, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    results.skipped = daysToGenerate.filter(d => existingDays.has(d));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Curriculum generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateDayContent(
  apiKey: string,
  day: number,
  month: number,
  theme: string,
  topic: string,
  dayType: string,
  marketId: string
) {
  const marketContext = marketId === 'neuroscience' 
    ? 'neuroscience, neurotech, mental health, and brain science' 
    : 'aerospace, aviation, defense, and space';

  const typePrompts: Record<string, string> = {
    DAILY_GAME: `Create a NEWS stack about a REAL, SPECIFIC, VERIFIABLE current event or development in ${marketContext} related to "${topic}".
      
      CRITICAL REQUIREMENTS:
      - Reference REAL companies, executives, clinical trials, and dollar amounts
      - Include actual dates, trial phases, or announcement details
      - Cite real sources (Nature Neuroscience, STAT News, Endpoints News, FDA announcements)
      - Explain the strategic implications for the industry
      - Include a "Startup Insight" on how founders can leverage this
      
      Structure (6 slides, each body UNDER 280 characters):
      1. What happened - specific event with real details (who, what, when, dollar amounts)
      2. Why it matters - industry implications and market impact
      3. Historical parallel - similar past events and what happened
      4. Expert perspective - "Interpretation:" label required, strategic analysis
      5. Startup opportunity - how founders can act on this trend
      6. Reflection - thought-provoking question for deeper thinking`,
    
    MICRO_LESSON: `Create a LESSON stack teaching a core concept about "${topic}" in ${marketContext}.
      
      CRITICAL REQUIREMENTS:
      - Teach like a Stanford professor explaining to a smart outsider
      - Use REAL numbers, percentages, and timelines from industry
      - Reference actual companies, clinical trials, and research as examples
      - Include common startup mistakes specific to this topic
      - End with actionable advice for founders
      
      Structure (6 slides, each body UNDER 280 characters):
      1. Core concept - explained clearly with a memorable mental model
      2. How it works - the mechanism or process in practice
      3. Real example - specific company/case with actual details
      4. Common mistake - what newcomers get wrong and why
      5. Edge cases - when the rules don't apply
      6. Apply this - concrete next step for startup founders`,
    
    TRAINER: `Create a decision-making SCENARIO about "${topic}" in ${marketContext}.
      
      CRITICAL REQUIREMENTS:
      - Base on REAL situations professionals in this field face
      - Include realistic numbers, timelines, and trade-offs
      - Make the correct answer subtle but clearly best upon analysis
      - Provide expert-level reasoning in feedback
      - Include a mental model that applies broadly
      
      The scenario should be 400-600 characters, presenting a genuine dilemma.
      All 4 options should seem plausible to a novice.
      Only one option should be clearly best to an expert.`,
    
    BOOK_SNAPSHOT: `Create a HISTORY stack about a pivotal past event related to "${topic}" in ${marketContext}.
      
      CRITICAL REQUIREMENTS:
      - Reference REAL historical events with specific dates
      - Name actual researchers, companies, and breakthrough decisions
      - Include original dollar amounts and patient numbers where relevant
      - Connect history to current industry dynamics
      - Extract timeless lessons for today's founders
      
      Structure (6 slides, each body UNDER 280 characters):
      1. What happened - specific historical event with date and actors
      2. Context - what people believed at the time
      3. The twist - what actually unfolded vs expectations
      4. Lessons - what the industry learned too late
      5. Today's echo - how this pattern repeats today
      6. Your move - reflection question for founders`,
  };

  const isTrainer = dayType === 'TRAINER';
  
  const systemPrompt = isTrainer
    ? `You are a senior ${marketId === 'neuroscience' ? 'neuroscience and neurotech' : 'aerospace'} industry strategist with 25+ years experience.
       You create challenging training scenarios that test strategic thinking.
       Your scenarios are based on REAL situations you've encountered or studied.
       You speak with authority but make content accessible to intelligent newcomers.
       Every scenario teaches a valuable lesson that applies beyond the specific situation.`
    : `You are a senior ${marketId === 'neuroscience' ? 'neuroscience and neurotech' : 'aerospace'} industry analyst creating educational content for startup founders.
       You have deep expertise across ${marketContext}.
       You reference REAL companies, clinical trials, regulations, and market dynamics.
       Your content is precise, data-driven, and actionable.
       Each slide body MUST be UNDER 280 characters - be concise and impactful.
       Each slide title MUST be 6 words or fewer.
       Month ${month} theme: ${theme}
       
       Style: Professional, direct, insight-dense. No fluff. Real examples only.`;

  const userPrompt = isTrainer
    ? `${typePrompts[dayType]}
       
       Return valid JSON:
       {
         "scenario": "Detailed scenario description (400-600 chars) with real context",
         "question": "Clear decision question starting with 'What should...' or 'How would you...'",
         "options": [
           {"label": "Option A - specific action (40-80 chars)", "isCorrect": false},
           {"label": "Option B - specific action (40-80 chars)", "isCorrect": true},
           {"label": "Option C - specific action (40-80 chars)", "isCorrect": false},
           {"label": "Option D - specific action (40-80 chars)", "isCorrect": false}
         ],
         "feedback_pro_reasoning": "Expert explanation of why the correct answer is best. Reference industry norms, typical outcomes, and strategic principles. (300-500 chars)",
         "feedback_common_mistake": "The most common error newcomers make and why (100-150 chars)",
         "feedback_mental_model": "A reusable mental model or framework this teaches (50-100 chars)",
         "follow_up_question": "A deeper question to consider for self-reflection",
         "sources": [{"label": "Industry Source", "url": "https://example.com"}],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "strategy"]
       }`
    : `${typePrompts[dayType]}
       
       Return valid JSON:
       {
         "title": "Compelling stack title (max 6 words)",
         "slides": [
           {
             "slide_number": 1,
             "title": "Slide title (max 6 words)",
             "body": "Insight-dense content under 280 characters with real data",
             "sources": [{"label": "Source Name", "url": "https://example.com"}]
           }
         ],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "${theme.toLowerCase()}"]
       }
       
       IMPORTANT: Create exactly 6 slides. Each body MUST be under 280 characters.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated');
  }

  return JSON.parse(content);
}

async function saveContent(
  supabase: any,
  content: any,
  day: number,
  month: number,
  dayType: string,
  marketId: string
) {
  const baseTags = [dayType, `day-${day}`, `month-${month}`];

  if (dayType === 'TRAINER') {
    const correctIndex = content.options?.findIndex((o: any) => o.isCorrect) ?? 1;
    
    await supabase
      .from('trainer_scenarios')
      .insert({
        market_id: marketId,
        scenario: content.scenario,
        question: content.question,
        options: content.options,
        correct_option_index: correctIndex,
        feedback_pro_reasoning: content.feedback_pro_reasoning,
        feedback_common_mistake: content.feedback_common_mistake,
        feedback_mental_model: content.feedback_mental_model,
        follow_up_question: content.follow_up_question,
        sources: content.sources || [],
        tags: [...baseTags, ...(content.tags || [])],
      });
  }

  const stackTypeMap: Record<string, string> = {
    DAILY_GAME: 'NEWS',
    MICRO_LESSON: 'LESSON',
    TRAINER: 'LESSON',
    BOOK_SNAPSHOT: 'HISTORY',
  };

  const { data: stack, error: stackError } = await supabase
    .from('stacks')
    .insert({
      market_id: marketId,
      title: content.title || content.scenario?.substring(0, 50) || `Day ${day}`,
      stack_type: stackTypeMap[dayType] || 'LESSON',
      tags: [...baseTags, ...(content.tags || [])],
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (stackError) {
    throw stackError;
  }

  if (content.slides && Array.isArray(content.slides)) {
    const slideInserts = content.slides.map((slide: any, index: number) => ({
      stack_id: stack.id,
      slide_number: slide.slide_number || index + 1,
      title: (slide.title || `Slide ${index + 1}`).substring(0, 100),
      body: (slide.body || '').substring(0, 280),
      sources: slide.sources || [],
    }));

    await supabase.from('slides').insert(slideInserts);
  }
}

async function generateMonthSummaries(
  supabase: any,
  apiKey: string,
  month: number,
  marketId: string,
  curriculumStructure: { months: { month: number; theme: string; topics: string[] }[] }
) {
  const monthInfo = curriculumStructure.months[month - 1];
  if (!monthInfo) {
    throw new Error(`Invalid month: ${month}`);
  }

  const results = { weekly: [] as any[], monthly: null as any };
  
  // Generate 4 weekly summaries
  for (let week = 1; week <= 4; week++) {
    const weekNum = (month - 1) * 4 + week;
    const weeklyContent = await generateSummary(
      apiKey,
      'WEEKLY',
      monthInfo.theme,
      monthInfo.topics,
      weekNum,
      month,
      marketId
    );
    
    const forDate = new Date();
    forDate.setDate(forDate.getDate() - (4 - week) * 7);
    
    const { data, error } = await supabase
      .from('summaries')
      .insert({
        market_id: marketId,
        summary_type: 'WEEKLY',
        title: weeklyContent.title,
        content: weeklyContent.content,
        key_takeaways: weeklyContent.key_takeaways,
        for_date: forDate.toISOString().split('T')[0],
      })
      .select()
      .single();
    
    if (!error) results.weekly.push(data);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate monthly summary
  const monthlyContent = await generateSummary(
    apiKey,
    'MONTHLY',
    monthInfo.theme,
    monthInfo.topics,
    0,
    month,
    marketId
  );
  
  const { data: monthlyData, error: monthlyError } = await supabase
    .from('summaries')
    .insert({
      market_id: marketId,
      summary_type: 'MONTHLY',
      title: monthlyContent.title,
      content: monthlyContent.content,
      key_takeaways: monthlyContent.key_takeaways,
      for_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();
  
  if (!monthlyError) results.monthly = monthlyData;

  return results;
}

async function generateSummary(
  apiKey: string,
  type: 'WEEKLY' | 'MONTHLY',
  theme: string,
  topics: string[],
  weekNum: number,
  month: number,
  marketId: string
) {
  const marketContext = marketId === 'neuroscience' 
    ? 'neuroscience, neurotech, and brain science' 
    : 'aerospace';

  const prompt = type === 'WEEKLY'
    ? `Create a WEEKLY summary for Week ${weekNum} of the "${theme}" module in ${marketContext} education.
       
       Topics covered: ${topics.slice(0, 2).join(', ')}
       
       Create an executive-style summary that:
       - Synthesizes the week's key learnings
       - Highlights strategic implications for startups
       - Includes 3-4 actionable takeaways
       - References real industry dynamics
       
       Return JSON:
       {
         "title": "Week ${weekNum}: [Compelling title about theme]",
         "content": "3-4 paragraph summary (600-800 words) that reads like a McKinsey brief",
         "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4"]
       }`
    : `Create a MONTHLY summary for Month ${month}: "${theme}" in ${marketContext} education.
       
       Topics covered: ${topics.join(', ')}
       
       Create a comprehensive month-end review that:
       - Synthesizes all major concepts from the month
       - Connects themes to real industry dynamics
       - Provides strategic framework for startup founders
       - Includes 5-6 key takeaways
       
       Return JSON:
       {
         "title": "Month ${month} Complete: Mastering ${theme}",
         "content": "4-5 paragraph summary (800-1000 words) that reads like a Harvard Business Review article",
         "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"]
       }`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: `You are a senior ${marketContext} industry analyst creating executive summaries for startup founders. Write with authority, reference real industry dynamics, and provide actionable insights.` 
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  return JSON.parse(aiResponse.choices?.[0]?.message?.content || '{}');
}
