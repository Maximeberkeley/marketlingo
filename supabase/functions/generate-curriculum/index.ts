import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  CURRICULUM_STRUCTURES, 
  WEEK_PATTERN, 
  getMarketContext,
  type CurriculumStructure 
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
  dryRun?: boolean;
  generateSummaries?: boolean;
  batchSize?: number; // For large generation jobs
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
      dryRun = false, 
      generateSummaries = false,
      batchSize = 5 
    } = await req.json() as GenerateRequest;
    
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
      
      const existingDays = new Set<number>();
      existingContent?.forEach(stack => {
        const dayTag = (stack.tags as string[])?.find(t => t.startsWith('day-'));
        if (dayTag) existingDays.add(parseInt(dayTag.replace('day-', '')));
      });

      const missingDays = Array.from({ length: 180 }, (_, i) => i + 1)
        .filter(d => !existingDays.has(d));

      return new Response(JSON.stringify({
        market: marketId,
        structure: CURRICULUM_STRUCTURE,
        weekPattern: WEEK_PATTERN,
        totalDays: 180,
        existingDays: existingDays.size,
        missingDays: missingDays.length,
        missingDaysList: missingDays.slice(0, 50), // First 50 for display
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
      if (dayTag) existingDays.add(parseInt(dayTag.replace('day-', '')));
    });

    const newDays = daysToGenerate.filter(d => !existingDays.has(d));
    
    if (dryRun) {
      const plan = newDays.map(d => ({
        day: d,
        month: Math.ceil(d / 30),
        week: Math.ceil(d / 7),
        type: WEEK_PATTERN[(d - 1) % 7],
        theme: CURRICULUM_STRUCTURE.months[Math.ceil(d / 30) - 1]?.theme,
        topic: getTopic(d, CURRICULUM_STRUCTURE),
      }));
      
      return new Response(JSON.stringify({
        market: marketId,
        daysToGenerate: newDays,
        existingDays: Array.from(existingDays).sort((a, b) => a - b),
        plan,
        estimatedMinutes: Math.ceil(newDays.length * 1.5),
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
      startedAt: new Date().toISOString(),
    };

    // Process in batches to avoid timeout
    const batches = [];
    for (let i = 0; i < newDays.length; i += batchSize) {
      batches.push(newDays.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (dayNum) => {
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
            marketId
          );

          if (content) {
            await saveContent(supabase, content, dayNum, monthInfo.month, dayType, marketId);
            results.generated.push(dayNum);
          }
        } catch (error) {
          console.error(`Error generating day ${dayNum}:`, error);
          results.errors.push({ 
            day: dayNum, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    results.skipped = daysToGenerate.filter(d => existingDays.has(d));

    return new Response(JSON.stringify({
      ...results,
      completedAt: new Date().toISOString(),
      summary: `Generated ${results.generated.length} days, skipped ${results.skipped.length}, ${results.errors.length} errors`,
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
  marketId: string
) {
  const marketContext = getMarketContext(marketId);

  // Enhanced prompts for professional depth
  // Goal-aware multi-perspective lens
  const goalLensInstruction = `
CRITICAL MULTI-PERSPECTIVE REQUIREMENT: Your content serves FOUR types of learners simultaneously:
- CAREER SEEKERS: Skills, terminology, interview-ready insights, hiring signals
- INVESTORS/ANALYSTS: Metrics, valuations, market signals, due diligence frameworks  
- FOUNDERS/BUILDERS: Startup opportunities, unit economics, founder mistakes, business models
- CURIOUS LEARNERS: Fascinating truths, mental models, transferable frameworks

Slides 4-5 MUST explicitly serve different goal perspectives to maximize relevance.`;

  const typePrompts: Record<string, string> = {
    DAILY_GAME: `Create a NEWS stack about a REAL, SPECIFIC, VERIFIABLE current event or development in ${marketContext} related to "${topic}".
      
      ${goalLensInstruction}
      
      CRITICAL REQUIREMENTS FOR INDUSTRY MASTERY:
      - Reference REAL companies, executives, deals, and dollar amounts
      - Include actual dates, announcement details, or market data
      - Cite credible sources (industry publications, company filings, news outlets)
      
      Structure (6 slides, each body UNDER 280 characters):
      1. What happened - specific event with real details (who, what, when, how much)
      2. Why it matters - industry implications with real market data
      3. Historical parallel - similar past events and their outcomes
      4. Career & Investor Lens - what this signals for job seekers OR how investors should evaluate this
      5. Founder Lens - startup opportunity or competitive insight from this development
      6. Reflection - thought-provoking question for deeper industry understanding`,
    
    MICRO_LESSON: `Create a LESSON stack teaching a core concept about "${topic}" in ${marketContext}.
      
      ${goalLensInstruction}
      
      CRITICAL REQUIREMENTS FOR INDUSTRY MASTERY:
      - Teach like an industry veteran explaining to a smart new hire
      - Use REAL numbers, percentages, timelines, and benchmarks
      - Reference actual companies, deals, and case studies
      
      Structure (6 slides, each body UNDER 280 characters):
      1. Core concept - explained clearly with a memorable mental model
      2. How it works - the mechanism or process in practice with real examples
      3. Real example - specific company/case with actual numbers and outcomes
      4. Career & Investor Lens - interview-ready insight, valuation implication, or analyst framework
      5. Founder Lens - startup angle, business model insight, or common founder mistakes
      6. Apply this - concrete next step regardless of learning goal`,
    
    TRAINER: `Create a decision-making SCENARIO about "${topic}" in ${marketContext}.
      
      ${goalLensInstruction}
      
      CRITICAL REQUIREMENTS:
      - Base on REAL situations professionals face — relevant to employees, investors, AND founders
      - Include realistic numbers, timelines, and trade-offs
      - Make the correct answer subtle but clearly best upon expert analysis
      - Feedback should reference how different perspectives (career, investor, founder) evaluate the decision
      
      The scenario should be 400-600 characters, presenting a genuine dilemma.
      All 4 options should seem plausible to someone new to the industry.
      Only one option should be clearly best to an experienced professional.`,
    
    BOOK_SNAPSHOT: `Create a HISTORY stack about a pivotal past event related to "${topic}" in ${marketContext}.
      
      ${goalLensInstruction}
      
      CRITICAL REQUIREMENTS:
      - Reference REAL historical events with specific dates and actors
      - Name actual companies, executives, and breakthrough decisions
      - Include original dollar amounts, market sizes, or outcome metrics
      
      Structure (6 slides, each body UNDER 280 characters):
      1. What happened - specific historical event with date and key players
      2. Context - what people believed at the time, prevailing wisdom
      3. The twist - what actually unfolded vs expectations
      4. Career & Investor Lens - what hiring managers and analysts learned from this
      5. Founder Lens - what entrepreneurs and builders took away, how this pattern guides startups today
      6. Your move - reflection question for aspiring industry participants`,
  };

  const isTrainer = dayType === 'TRAINER';
  
  const systemPrompt = isTrainer
    ? `You are a senior ${marketContext} industry strategist with 25+ years of experience advising startups and training new hires.
       You create challenging scenarios that test strategic thinking and build real industry judgment.
       Your scenarios are based on REAL situations - the kind that separate successful founders from failed ones.
       
       Your goal: Help users BECOME MASTERS of this industry, whether they're:
       - Entrepreneurs building companies in this space
       - Professionals seeking to join or advance in this industry  
       - Researchers and curious learners seeking deep understanding
       
       Every scenario teaches a valuable lesson that transfers across the industry.`
    : `You are a senior ${marketContext} industry analyst creating educational content that builds true industry mastery.
       You have deep expertise and reference REAL companies, deals, regulations, and market dynamics.
       
       Your content serves users who want to BECOME MASTERS of this industry:
       - New entrepreneurs learning the landscape before building
       - Career changers preparing to join this industry
       - Curious learners seeking genuine expert-level understanding
       
       Your content is precise, data-driven, and actionable.
       Each slide body MUST be UNDER 280 characters - be concise and impactful.
       Each slide title MUST be 6 words or fewer.
       Month ${month} theme: ${theme}
       
       Style: Professional, direct, insight-dense. No fluff. Real examples only.`;

  const userPrompt = isTrainer
    ? `${typePrompts[dayType]}
       
       Return valid JSON:
       {
         "scenario": "Detailed scenario description (400-600 chars) with real industry context",
         "question": "Clear decision question starting with 'What should...' or 'How would you...'",
         "options": [
           {"label": "Option A - specific action (40-80 chars)", "isCorrect": false},
           {"label": "Option B - specific action (40-80 chars)", "isCorrect": true},
           {"label": "Option C - specific action (40-80 chars)", "isCorrect": false},
           {"label": "Option D - specific action (40-80 chars)", "isCorrect": false}
         ],
         "feedback_pro_reasoning": "Expert explanation of why the correct answer is best. Reference industry norms, typical outcomes, and strategic principles. (300-500 chars)",
         "feedback_common_mistake": "The most common error newcomers make and why it fails (100-150 chars)",
         "feedback_mental_model": "A reusable mental model or framework this teaches (50-100 chars)",
         "follow_up_question": "A deeper question to consider for continued learning",
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
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "${theme.toLowerCase().replace(/\s+/g, '-')}"]
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
  const baseTags = [dayType, `day-${day}`, `month-${month}`, 'MICRO_LESSON'];

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
