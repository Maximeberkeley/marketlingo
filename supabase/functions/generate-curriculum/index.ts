import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 6-month aerospace curriculum structure
const CURRICULUM_STRUCTURE = {
  months: [
    {
      month: 1,
      theme: "Foundations",
      topics: [
        "Industry structure (OEMs, Tier 1-3 suppliers)",
        "Certification process (FAA/EASA)",
        "Cost-plus vs fixed-price contracts",
        "Dual-use technology",
        "Supply chain dependencies",
      ],
    },
    {
      month: 2,
      theme: "Commercial Aviation",
      topics: [
        "Airbus vs Boeing duopoly",
        "Narrow-body vs wide-body economics",
        "MRO (Maintenance, Repair, Overhaul)",
        "Airline fleet decisions",
        "Leasing companies (AerCap, GECAS)",
      ],
    },
    {
      month: 3,
      theme: "Defense & Government",
      topics: [
        "Major defense primes (Lockheed, RTX, Northrop)",
        "Procurement process",
        "ITAR and export controls",
        "Black programs and classified work",
        "Allied vs adversary capabilities",
      ],
    },
    {
      month: 4,
      theme: "Space Economy",
      topics: [
        "Launch economics (SpaceX, ULA, Rocket Lab)",
        "Satellite constellations (Starlink, OneWeb)",
        "Space tourism and commercialization",
        "NASA partnerships and contracts",
        "Orbital debris and sustainability",
      ],
    },
    {
      month: 5,
      theme: "Emerging Technologies",
      topics: [
        "eVTOL and urban air mobility",
        "Autonomous flight systems",
        "Sustainable aviation fuel (SAF)",
        "Hydrogen propulsion",
        "Advanced materials (composites, titanium)",
      ],
    },
    {
      month: 6,
      theme: "Business & Strategy",
      topics: [
        "Aerospace M&A patterns",
        "Startup survival strategies",
        "Talent and workforce issues",
        "Geopolitical supply chain risks",
        "Future of aerospace investment",
      ],
    },
  ],
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
  month?: number; // 1-6, generate specific month
  week?: number; // 1-30, generate specific week
  day?: number; // 1-180, generate specific day
  dryRun?: boolean; // If true, return curriculum plan without generating
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { month, week, day, dryRun = false } = await req.json() as GenerateRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
      // Return curriculum structure overview
      return new Response(JSON.stringify({
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
      .eq('market_id', 'aerospace');
    
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
        daysToGenerate: newDays,
        existingDays: Array.from(existingDays).sort((a, b) => a - b),
        plan,
        message: `Would generate ${newDays.length} days of content`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate content for each day
    const results = {
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

        // Generate content using AI
        const content = await generateDayContent(
          LOVABLE_API_KEY,
          dayNum,
          monthInfo.month,
          monthInfo.theme,
          topic,
          dayType
        );

        if (content) {
          // Save to database
          await saveContent(supabase, content, dayNum, monthInfo.month, dayType);
          results.generated.push(dayNum);
        }

        // Rate limiting - wait between API calls
        await new Promise(resolve => setTimeout(resolve, 500));

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
  dayType: string
) {
  const typePrompts: Record<string, string> = {
    DAILY_GAME: `Create a NEWS stack about a real current event or development in aerospace related to "${topic}". 
      Structure:
      1. What happened (specific event/announcement)
      2. Why it matters for the industry
      3. Historical parallel or precedent
      4. Expert perspective (label as "Interpretation:")
      5. Implication for companies/startups
      6. Reflection question for the reader`,
    
    MICRO_LESSON: `Create a LESSON stack teaching a core concept about "${topic}" in aerospace.
      Structure:
      1. Core idea explained simply
      2. Mental model or framework
      3. Real-world example
      4. Common failure mode or mistake
      5. When this doesn't apply (edge case)
      6. Apply to your work prompt`,
    
    TRAINER: `Create a decision-making SCENARIO about "${topic}" in aerospace.
      The scenario should present a realistic business/technical dilemma.
      Provide 4 options where only one is clearly best.
      Include feedback explaining the pro reasoning.`,
    
    BOOK_SNAPSHOT: `Create a HISTORY stack about a pivotal past event related to "${topic}" in aerospace.
      Structure:
      1. What happened (historical event)
      2. What people believed at the time
      3. What actually unfolded
      4. What people learned too late
      5. Why it matters today
      6. Reflection question`,
  };

  const isTrainer = dayType === 'TRAINER';
  
  const systemPrompt = isTrainer
    ? `You are an aerospace industry expert creating training scenarios. 
       Create challenging scenarios that test strategic thinking about the aerospace industry.
       Focus on real decisions that professionals face.
       Each scenario should have one clearly best answer with nuanced reasoning.`
    : `You are an aerospace industry expert creating educational content.
       Create concise, insightful content for professionals learning about aerospace.
       Each slide body MUST be under 280 characters.
       Each slide title MUST be under 6 words.
       Include 1-2 credible sources per slide.
       Month ${month} theme: ${theme}`;

  const userPrompt = isTrainer
    ? `${typePrompts[dayType]}
       
       Return valid JSON:
       {
         "scenario": "Scenario description (max 600 chars)",
         "question": "What should...?",
         "options": [
           {"label": "Option A text", "isCorrect": false},
           {"label": "Option B text", "isCorrect": true},
           {"label": "Option C text", "isCorrect": false},
           {"label": "Option D text", "isCorrect": false}
         ],
         "feedback_pro_reasoning": "Why the correct answer is best (max 500 chars)",
         "feedback_common_mistake": "One line about common mistake",
         "feedback_mental_model": "Key mental model to remember",
         "follow_up_question": "A follow-up question to ponder",
         "sources": [{"label": "Source Name", "url": "https://example.com"}],
         "tags": ["relevant", "topic", "tags"]
       }`
    : `${typePrompts[dayType]}
       
       Return valid JSON:
       {
         "title": "Stack title (max 6 words)",
         "slides": [
           {
             "slide_number": 1,
             "title": "Slide title (max 6 words)",
             "body": "Content under 280 characters",
             "sources": [{"label": "Source Name", "url": "https://example.com"}]
           }
         ],
         "tags": ["relevant", "topic", "tags"]
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
  dayType: string
) {
  const marketId = 'aerospace';
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

  // Create stack for all types
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

  // Create slides if present
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
