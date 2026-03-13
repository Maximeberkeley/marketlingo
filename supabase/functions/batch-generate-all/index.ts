import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  CURRICULUM_STRUCTURES, 
  WEEK_PATTERN, 
  getMarketContext,
  LEARNING_GOALS,
  GOAL_PERSONAS,
  IMMERSIVE_METADATA_PROMPT,
  getGoalTag,
  getLevelTag,
  type CurriculumStructure,
  type LearningGoal,
} from '../_shared/curriculum-structures.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALL_MARKETS = Object.keys(CURRICULUM_STRUCTURES);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service-role auth only — no user auth needed
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { 
      action = 'status',
      markets = ALL_MARKETS,
      month,
      goal,
      batchSize = 1, // Process 1 at a time to stay within edge function timeout
    } = body;

    // STATUS: report progress across all markets
    if (action === 'status') {
      const statusReport: Record<string, any> = {};
      
      for (const marketId of markets) {
        const { data: stacks } = await supabase
          .from('stacks')
          .select('tags')
          .eq('market_id', marketId);
        
        const byGoal: Record<string, Set<number>> = {};
        for (const g of LEARNING_GOALS) byGoal[g] = new Set();
        
        stacks?.forEach(stack => {
          const tags = stack.tags as string[];
          const dayTag = tags?.find((t: string) => t.startsWith('day-'));
          if (!dayTag) return;
          const dayNum = parseInt(dayTag.replace('day-', ''));
          for (const g of LEARNING_GOALS) {
            if (tags.includes(getGoalTag(g))) byGoal[g].add(dayNum);
          }
          if (!LEARNING_GOALS.some(g => tags.includes(getGoalTag(g)))) {
            for (const g of LEARNING_GOALS) byGoal[g].add(dayNum);
          }
        });

        statusReport[marketId] = Object.fromEntries(
          LEARNING_GOALS.map(g => [g, { done: byGoal[g].size, remaining: 180 - byGoal[g].size }])
        );
      }

      const totalDone = Object.values(statusReport).reduce((sum: number, m: any) => 
        sum + Object.values(m).reduce((s: number, g: any) => s + (g as any).done, 0), 0
      );
      const totalTarget = markets.length * 180 * 4;

      return new Response(JSON.stringify({
        markets: statusReport,
        totalDone,
        totalTarget,
        percentComplete: Math.round((totalDone / totalTarget) * 100),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GENERATE: process content
    if (action !== 'start') {
      return new Response(JSON.stringify({ error: 'action must be "status" or "start"' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const goalsToGen: LearningGoal[] = goal ? [goal] : [...LEARNING_GOALS];
    const results = {
      generated: [] as { market: string; day: number; goal: string }[],
      errors: [] as { market: string; day: number; goal: string; error: string }[],
      startedAt: new Date().toISOString(),
    };

    for (const marketId of markets) {
      const curriculum = CURRICULUM_STRUCTURES[marketId];
      if (!curriculum) continue;

      // Find what's missing
      const { data: existing } = await supabase
        .from('stacks')
        .select('tags')
        .eq('market_id', marketId);

      const existingByGoal: Record<string, Set<number>> = {};
      for (const g of LEARNING_GOALS) existingByGoal[g] = new Set();
      
      existing?.forEach(stack => {
        const tags = stack.tags as string[];
        const dayTag = tags?.find((t: string) => t.startsWith('day-'));
        if (!dayTag) return;
        const dayNum = parseInt(dayTag.replace('day-', ''));
        for (const g of LEARNING_GOALS) {
          if (tags.includes(getGoalTag(g))) existingByGoal[g].add(dayNum);
        }
        if (!LEARNING_GOALS.some(g => tags.includes(getGoalTag(g)))) {
          for (const g of LEARNING_GOALS) existingByGoal[g].add(dayNum);
        }
      });

      // Build missing pairs
      const startDay = month ? (month - 1) * 30 + 1 : 1;
      const endDay = month ? month * 30 : 180;
      const toGenerate: { day: number; goal: LearningGoal }[] = [];
      
      for (let d = startDay; d <= endDay; d++) {
        for (const g of goalsToGen) {
          if (!existingByGoal[g].has(d)) {
            toGenerate.push({ day: d, goal: g });
          }
        }
      }

      console.log(`${marketId}: ${toGenerate.length} day-goal pairs to generate`);

      // Limit to maxItems per invocation to stay within edge function timeout (~150s)
      const maxItems = 3;
      const itemsToProcess = toGenerate.slice(0, maxItems);

      // Process sequentially (1 at a time) to avoid timeout
      for (const { day: dayNum, goal: goalKey } of itemsToProcess) {
        try {
          const monthIndex = Math.ceil(dayNum / 30) - 1;
          const monthInfo = curriculum.months[monthIndex];
          const dayType = WEEK_PATTERN[(dayNum - 1) % 7];
          const topic = getTopic(dayNum, curriculum);

          const content = await generateDayContent(
            LOVABLE_API_KEY!,
            dayNum,
            monthInfo.month,
            monthInfo.theme,
            topic,
            dayType,
            marketId,
            goalKey
          );

          if (content) {
            await saveContent(supabase, content, dayNum, monthInfo.month, dayType, marketId, goalKey);
            results.generated.push({ market: marketId, day: dayNum, goal: goalKey });
            console.log(`✅ ${marketId} day ${dayNum} goal ${goalKey}`);

            // Trigger drill generation for MICRO_LESSON days (only once per day, first goal)
            if (dayType === 'MICRO_LESSON' && goalKey === goalsToGen[0]) {
              try {
                const drillUrl = `${supabaseUrl}/functions/v1/generate-drill-questions`;
                await fetch(drillUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({ market_id: marketId, day_number: dayNum }),
                });
                console.log(`🎯 Triggered drill generation for ${marketId} day ${dayNum}`);
              } catch (drillErr) {
                console.warn(`⚠️ Drill generation trigger failed for ${marketId} day ${dayNum}:`, drillErr);
              }
            }
          }
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
          console.error(`❌ ${marketId} day ${dayNum} goal ${goalKey}: ${errMsg}`);
          results.errors.push({ market: marketId, day: dayNum, goal: goalKey, error: errMsg });
        }
      }

      // Break after first market with items (cron will call again for next batch)
      if (itemsToProcess.length > 0) break;
    }

    return new Response(JSON.stringify({
      ...results,
      completedAt: new Date().toISOString(),
      summary: `Generated ${results.generated.length} items, ${results.errors.length} errors`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Batch generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ---- Shared helpers (duplicated from generate-curriculum to keep functions independent) ----

function getTopic(day: number, curriculum: CurriculumStructure): string {
  const monthIndex = Math.ceil(day / 30) - 1;
  const monthInfo = curriculum.months[monthIndex];
  if (!monthInfo) return "Industry fundamentals";
  const dayInMonth = ((day - 1) % 30) + 1;
  const topicIndex = Math.floor((dayInMonth - 1) / 6) % monthInfo.topics.length;
  return monthInfo.topics[topicIndex];
}

async function generateDayContent(
  apiKey: string, day: number, month: number, theme: string,
  topic: string, dayType: string, marketId: string, goal: LearningGoal
) {
  const marketContext = getMarketContext(marketId);
  const persona = GOAL_PERSONAS[goal];
  const isTrainer = dayType === 'TRAINER';

  const typePrompts: Record<string, string> = {
    DAILY_GAME: `Create a NEWS stack about a REAL, SPECIFIC, VERIFIABLE current event or development in ${marketContext} related to "${topic}".
      YOU ARE WRITING EXCLUSIVELY FOR: ${persona.label.toUpperCase()} learners.
      CRITICAL: Reference REAL companies, executives, deals, and dollar amounts.
      Include actual dates, announcement details, or market data.
      Every slide must be framed through the ${persona.label} lens.
      Slide structure (6 slides, each body UNDER 450 characters):
      ${persona.slideGuidance}`,
    MICRO_LESSON: `Create a LESSON stack teaching a core concept about "${topic}" in ${marketContext}.
      YOU ARE WRITING EXCLUSIVELY FOR: ${persona.label.toUpperCase()} learners.
      CRITICAL: Teach like an industry veteran. Use REAL numbers, percentages, timelines.
      Reference actual companies, deals, and case studies.
      ALL 6 slides must serve the ${persona.label} perspective.
      Slide structure (6 slides, each body UNDER 450 characters):
      ${persona.slideGuidance}`,
    TRAINER: `Create a decision-making SCENARIO about "${topic}" in ${marketContext}.
      Frame for a ${persona.label.toUpperCase()} learner.
      CRITICAL: Base on REAL situations. Include realistic numbers, timelines, and trade-offs.
      The correct answer should reflect what an expert ${persona.label} professional would choose.
      The scenario should be 400-600 characters, presenting a genuine dilemma.
      All 4 options should seem plausible to someone new. Only one should be clearly best to an expert.`,
    BOOK_SNAPSHOT: `Create a HISTORY stack about a pivotal past event related to "${topic}" in ${marketContext}.
      YOU ARE WRITING EXCLUSIVELY FOR: ${persona.label.toUpperCase()} learners.
      CRITICAL: Reference REAL historical events with specific dates and actors.
      Frame lessons through the ${persona.label} lens.
      Slide structure (6 slides, each body UNDER 450 characters):
      ${persona.slideGuidance}`,
  };

  const systemPrompt = isTrainer
    ? `${persona.systemPrompt}\nYou create challenging decision scenarios for ${marketContext}. Based on REAL situations — framed for: ${persona.label}.`
    : `${persona.systemPrompt}\nYou create educational content about ${marketContext}.\nEach slide body MUST be UNDER 450 characters. Each title MUST be 6 words or fewer.\nMonth ${month} theme: ${theme}\nStyle: Professional, direct, insight-dense. No fluff. Real examples only.\nCRITICAL: Each slide should teach ONE clear idea with a real example or data point.`;

  const userPrompt = isTrainer
    ? `${typePrompts[dayType]}
       Return valid JSON:
       {
         "scenario": "Detailed scenario (400-600 chars) for ${persona.label} learners",
         "question": "Clear decision question starting with 'What should...' or 'How would you...'",
         "options": [
           {"label": "Option A (40-80 chars)", "isCorrect": false},
           {"label": "Option B (40-80 chars)", "isCorrect": true},
           {"label": "Option C (40-80 chars)", "isCorrect": false},
           {"label": "Option D (40-80 chars)", "isCorrect": false}
         ],
         "feedback_pro_reasoning": "Expert explanation from ${persona.label} perspective (300-500 chars)",
         "feedback_common_mistake": "Common error (100-150 chars)",
         "feedback_mental_model": "Reusable framework (50-100 chars)",
         "follow_up_question": "A deeper question for ${persona.label} learners",
         "sources": [{"label": "Source", "url": "https://example.com"}],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "strategy"]
       }`
    : `${typePrompts[dayType]}
       
       ${IMMERSIVE_METADATA_PROMPT}
       
       Return valid JSON:
       {
         "title": "Stack title for ${persona.label} learners (max 6 words)",
         "learning_objectives": ["Outcome 1 (max 60 chars)", "Outcome 2 (max 60 chars)", "Outcome 3 (max 60 chars)"],
         "key_takeaway": "The single most important insight (max 120 chars)",
         "recap_bridge": "Connection to previous day's topic (max 100 chars)",
         "next_preview": "Teaser for what comes next (max 100 chars)",
         "slides": [
           {
             "slide_number": 1,
             "title": "Slide title (max 6 words)",
             "body": "Insight-dense content under 450 characters",
             "sources": [{"label": "Source", "url": "https://example.com"}]
           }
         ],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "${theme.toLowerCase().replace(/\\s+/g, '-')}"]
       }
       IMPORTANT: Create exactly 6 slides. Each body MUST be under 450 characters.
       ALL slides must serve the ${persona.label} perspective — ONLY for ${persona.label} learners.`;

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
    if (response.status === 429) {
      // Rate limited — wait and retry once
      console.log('Rate limited, waiting 30s...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      return generateDayContent(apiKey, day, month, theme, topic, dayType, marketId, goal);
    }
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content generated');
  return JSON.parse(content);
}

async function saveContent(
  supabase: any, content: any, day: number, month: number,
  dayType: string, marketId: string, goal: LearningGoal
) {
  const goalTag = getGoalTag(goal);
  const levelTag = getLevelTag(day);
  const baseTags = [dayType, `day-${day}`, `month-${month}`, 'MICRO_LESSON', goalTag, levelTag];

  if (dayType === 'TRAINER') {
    const correctIndex = content.options?.findIndex((o: any) => o.isCorrect) ?? 1;
    await supabase.from('trainer_scenarios').insert({
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
    DAILY_GAME: 'NEWS', MICRO_LESSON: 'LESSON', TRAINER: 'LESSON', BOOK_SNAPSHOT: 'HISTORY',
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

  if (stackError) throw stackError;

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
