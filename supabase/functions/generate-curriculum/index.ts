import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  CURRICULUM_STRUCTURES, 
  WEEK_PATTERN, 
  getMarketContext,
  LEARNING_GOALS,
  GOAL_PERSONAS,
  getGoalTag,
  type CurriculumStructure,
  type LearningGoal,
} from '../_shared/curriculum-structures.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  marketId?: string;
  month?: number;
  week?: number;
  day?: number;
  goal?: LearningGoal; // Generate for specific goal, omit for all goals
  dryRun?: boolean;
  generateSummaries?: boolean;
  batchSize?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no auth token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('Authenticated user for generate-curriculum:', userId);

    // Check if user is admin
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      marketId = 'aerospace', 
      month, 
      week, 
      day, 
      goal,
      dryRun = false, 
      generateSummaries = false,
      batchSize = 5 
    } = await req.json() as GenerateRequest;

    // Determine which goals to generate for
    const goalsToGenerate: LearningGoal[] = goal ? [goal] : [...LEARNING_GOALS];
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
      // Return status/structure info
      const { data: existingContent } = await supabase
        .from('stacks')
        .select('tags')
        .eq('market_id', marketId);
      
      // Track existing days per goal
      const existingByGoal: Record<string, Set<number>> = {};
      for (const g of LEARNING_GOALS) existingByGoal[g] = new Set();
      
      existingContent?.forEach(stack => {
        const tags = stack.tags as string[];
        const dayTag = tags?.find(t => t.startsWith('day-'));
        if (!dayTag) return;
        const dayNum = parseInt(dayTag.replace('day-', ''));
        for (const g of LEARNING_GOALS) {
          if (tags.includes(getGoalTag(g))) {
            existingByGoal[g].add(dayNum);
          }
        }
        // Legacy non-goal-tagged content
        if (!LEARNING_GOALS.some(g => tags.includes(getGoalTag(g)))) {
          // Count as existing for all goals (legacy)
          for (const g of LEARNING_GOALS) existingByGoal[g].add(dayNum);
        }
      });

      const goalStats = Object.fromEntries(
        LEARNING_GOALS.map(g => [g, {
          existing: existingByGoal[g].size,
          missing: 180 - existingByGoal[g].size,
        }])
      );

      return new Response(JSON.stringify({
        market: marketId,
        structure: CURRICULUM_STRUCTURE,
        weekPattern: WEEK_PATTERN,
        totalDays: 180,
        goalStats,
        existingDays: Array.from(existingByGoal[goalsToGenerate[0]]),
        message: "Specify month (1-6), week (1-26), or day (1-180) to generate content",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check what already exists per goal
    const { data: existingStacks } = await supabase
      .from('stacks')
      .select('tags')
      .eq('market_id', marketId);
    
    const existingByGoal: Record<string, Set<number>> = {};
    for (const g of LEARNING_GOALS) existingByGoal[g] = new Set();
    
    existingStacks?.forEach(stack => {
      const tags = stack.tags as string[];
      const dayTag = tags?.find(t => t.startsWith('day-'));
      if (!dayTag) return;
      const dayNum = parseInt(dayTag.replace('day-', ''));
      for (const g of LEARNING_GOALS) {
        if (tags.includes(getGoalTag(g))) {
          existingByGoal[g].add(dayNum);
        }
      }
      if (!LEARNING_GOALS.some(g => tags.includes(getGoalTag(g)))) {
        for (const g of LEARNING_GOALS) existingByGoal[g].add(dayNum);
      }
    });

    // Build list of (day, goal) pairs to generate
    const toGenerate: { day: number; goal: LearningGoal }[] = [];
    for (const dayNum of daysToGenerate) {
      for (const g of goalsToGenerate) {
        if (!existingByGoal[g].has(dayNum)) {
          toGenerate.push({ day: dayNum, goal: g });
        }
      }
    }
    
    if (dryRun) {
      const plan = toGenerate.map(({ day: d, goal: g }) => ({
        day: d,
        goal: g,
        month: Math.ceil(d / 30),
        week: Math.ceil(d / 7),
        type: WEEK_PATTERN[(d - 1) % 7],
        theme: CURRICULUM_STRUCTURE.months[Math.ceil(d / 30) - 1]?.theme,
        topic: getTopic(d, CURRICULUM_STRUCTURE),
      }));

      const goalStats = Object.fromEntries(
        goalsToGenerate.map(g => [g, {
          existing: existingByGoal[g].size,
          toGenerate: daysToGenerate.filter(d => !existingByGoal[g].has(d)).length,
        }])
      );
      
      return new Response(JSON.stringify({
        market: marketId,
        daysToGenerate: toGenerate.map(t => t.day),
        existingDays: Array.from(existingByGoal[goalsToGenerate[0]]).sort((a, b) => a - b),
        goalStats,
        plan,
        estimatedMinutes: Math.ceil(toGenerate.length * 1.5),
        message: `Would generate ${toGenerate.length} day-goal pairs for ${marketId}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      market: marketId,
      generated: [] as { day: number; goal: string }[],
      skipped: [] as number[],
      errors: [] as { day: number; goal: string; error: string }[],
      startedAt: new Date().toISOString(),
    };

    // Process in batches to avoid timeout
    const batches: { day: number; goal: LearningGoal }[][] = [];
    for (let i = 0; i < toGenerate.length; i += batchSize) {
      batches.push(toGenerate.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async ({ day: dayNum, goal: goalKey }) => {
        try {
          const monthIndex = Math.ceil(dayNum / 30) - 1;
          const monthInfo = CURRICULUM_STRUCTURE.months[monthIndex];
          const dayType = WEEK_PATTERN[(dayNum - 1) % 7];
          const topic = getTopic(dayNum, CURRICULUM_STRUCTURE);

          const content = await generateDayContent(
            LOVABLE_API_KEY,
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
            results.generated.push({ day: dayNum, goal: goalKey });
          }
        } catch (error) {
          console.error(`Error generating day ${dayNum} goal ${goalKey}:`, error);
          results.errors.push({ 
            day: dayNum,
            goal: goalKey,
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });

      await Promise.all(batchPromises);
      
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return new Response(JSON.stringify({
      ...results,
      completedAt: new Date().toISOString(),
      summary: `Generated ${results.generated.length} day-goal pairs, ${results.errors.length} errors`,
    }), {
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

function getTopic(day: number, curriculum: CurriculumStructure): string {
  const monthIndex = Math.ceil(day / 30) - 1;
  const monthInfo = curriculum.months[monthIndex];
  if (!monthInfo) return "Industry fundamentals";
  
  // Rotate through topics within the month
  const dayInMonth = ((day - 1) % 30) + 1;
  const topicIndex = Math.floor((dayInMonth - 1) / 6) % monthInfo.topics.length;
  return monthInfo.topics[topicIndex];
}

async function generateDayContent(
  apiKey: string,
  day: number,
  month: number,
  theme: string,
  topic: string,
  dayType: string,
  marketId: string,
  goal: LearningGoal
) {
  const marketContext = getMarketContext(marketId);
  const persona = GOAL_PERSONAS[goal];

  const isTrainer = dayType === 'TRAINER';
  
  // Goal-specific slide structure for non-trainer content
  const typePrompts: Record<string, string> = {
    DAILY_GAME: `Create a NEWS stack about a REAL, SPECIFIC, VERIFIABLE current event or development in ${marketContext} related to "${topic}".
      
      YOU ARE WRITING EXCLUSIVELY FOR: ${persona.label.toUpperCase()} learners.
      
      CRITICAL REQUIREMENTS:
      - Reference REAL companies, executives, deals, and dollar amounts
      - Include actual dates, announcement details, or market data
      - Every slide must be framed through the ${persona.label} lens
      
      Slide structure (6 slides, each body UNDER 280 characters):
      ${persona.slideGuidance}`,
    
    MICRO_LESSON: `Create a LESSON stack teaching a core concept about "${topic}" in ${marketContext}.
      
      YOU ARE WRITING EXCLUSIVELY FOR: ${persona.label.toUpperCase()} learners.
      
      CRITICAL REQUIREMENTS:
      - Teach like an industry veteran speaking to someone with THIS specific goal
      - Use REAL numbers, percentages, timelines, and benchmarks
      - Reference actual companies, deals, and case studies
      - ALL 6 slides must serve the ${persona.label} perspective — not generic content
      
      Slide structure (6 slides, each body UNDER 280 characters):
      ${persona.slideGuidance}`,
    
    TRAINER: `Create a decision-making SCENARIO about "${topic}" in ${marketContext}.
      
      Frame this scenario for a ${persona.label.toUpperCase()} learner.
      
      CRITICAL REQUIREMENTS:
      - Base on REAL situations a ${persona.label} professional would face
      - Include realistic numbers, timelines, and trade-offs
      - The correct answer should reflect what an expert ${persona.label} professional would choose
      - Feedback should explain reasoning from the ${persona.label} perspective
      
      The scenario should be 400-600 characters, presenting a genuine dilemma.
      All 4 options should seem plausible to someone new to the industry.
      Only one option should be clearly best to an experienced professional.`,
    
    BOOK_SNAPSHOT: `Create a HISTORY stack about a pivotal past event related to "${topic}" in ${marketContext}.
      
      YOU ARE WRITING EXCLUSIVELY FOR: ${persona.label.toUpperCase()} learners.
      
      CRITICAL REQUIREMENTS:
      - Reference REAL historical events with specific dates and actors
      - Frame the lessons through the ${persona.label} lens
      - Every slide should help someone with this specific goal
      
      Slide structure (6 slides, each body UNDER 280 characters):
      ${persona.slideGuidance}`,
  };

  const systemPrompt = isTrainer
    ? `${persona.systemPrompt}
       
       You create challenging decision scenarios for ${marketContext} that test strategic thinking.
       Your scenarios are based on REAL situations — framed for someone whose goal is: ${persona.label}.`
    : `${persona.systemPrompt}
       
       You are creating educational content about ${marketContext}.
       Each slide body MUST be UNDER 280 characters - be concise and impactful.
       Each slide title MUST be 6 words or fewer.
       Month ${month} theme: ${theme}
       
       Style: Professional, direct, insight-dense. No fluff. Real examples only.`;

  const userPrompt = isTrainer
    ? `${typePrompts[dayType]}
       
       Return valid JSON:
       {
         "scenario": "Detailed scenario description (400-600 chars) framed for ${persona.label} learners",
         "question": "Clear decision question starting with 'What should...' or 'How would you...'",
         "options": [
           {"label": "Option A - specific action (40-80 chars)", "isCorrect": false},
           {"label": "Option B - specific action (40-80 chars)", "isCorrect": true},
           {"label": "Option C - specific action (40-80 chars)", "isCorrect": false},
           {"label": "Option D - specific action (40-80 chars)", "isCorrect": false}
         ],
         "feedback_pro_reasoning": "Expert explanation from the ${persona.label} perspective (300-500 chars)",
         "feedback_common_mistake": "Common error a ${persona.label} newcomer would make (100-150 chars)",
         "feedback_mental_model": "Reusable framework for ${persona.label} professionals (50-100 chars)",
         "follow_up_question": "A deeper question for ${persona.label} learners",
         "sources": [{"label": "Industry Source", "url": "https://example.com"}],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "strategy"]
       }`
    : `${typePrompts[dayType]}
       
       Return valid JSON:
       {
         "title": "Compelling stack title for ${persona.label} learners (max 6 words)",
         "slides": [
           {
             "slide_number": 1,
             "title": "Slide title (max 6 words)",
             "body": "Insight-dense content under 280 characters with real data",
             "sources": [{"label": "Source Name", "url": "https://example.com"}]
           }
         ],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "${theme.toLowerCase().replace(/\\s+/g, '-')}"]
       }
       
       IMPORTANT: Create exactly 6 slides. Each body MUST be under 280 characters.
       ALL slides must serve the ${persona.label} perspective — this content is ONLY for ${persona.label} learners.`;

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
  marketId: string,
  goal: LearningGoal
) {
  const goalTag = getGoalTag(goal);
  const baseTags = [dayType, `day-${day}`, `month-${month}`, 'MICRO_LESSON', goalTag];

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
  curriculumStructure: CurriculumStructure
) {
  const monthInfo = curriculumStructure.months[month - 1];
  if (!monthInfo) {
    throw new Error(`Invalid month: ${month}`);
  }

  const results = { weekly: [] as any[], monthly: null as any };
  const marketContext = getMarketContext(marketId);
  
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
      marketContext
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
    marketContext
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
  marketContext: string
) {
  const prompt = type === 'WEEKLY'
    ? `Create a WEEKLY summary for Week ${weekNum} of the "${theme}" module for professionals learning ${marketContext}.
       
       Topics covered: ${topics.slice(0, 2).join(', ')}
       
       Target audience: Entrepreneurs entering this industry, career changers, and serious learners seeking mastery.
       
       Create an executive-style summary that:
       - Synthesizes the week's key learnings into actionable knowledge
       - Highlights strategic implications for startups and career decisions
       - Includes 3-4 actionable takeaways with specific next steps
       - References real industry dynamics and benchmarks
       
       Return JSON:
       {
         "title": "Week ${weekNum}: [Compelling title about key insight]",
         "content": "3-4 paragraph summary (600-800 words) that reads like a McKinsey brief",
         "key_takeaways": ["Takeaway 1 with specific action", "Takeaway 2", "Takeaway 3", "Takeaway 4"]
       }`
    : `Create a MONTHLY summary for Month ${month}: "${theme}" for professionals mastering ${marketContext}.
       
       Topics covered: ${topics.join(', ')}
       
       Target audience: Aspiring industry experts who want deep understanding for entrepreneurship or career advancement.
       
       Create a comprehensive month-end review that:
       - Synthesizes all major concepts into a coherent mental framework
       - Connects themes to real industry dynamics professionals must understand
       - Provides strategic framework for startup founders and career builders
       - Includes 5-6 key takeaways with specific applications
       
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
          content: `You are a senior ${marketContext} industry analyst creating executive summaries for professionals seeking industry mastery. Write with authority, reference real industry dynamics, and provide actionable insights.` 
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
