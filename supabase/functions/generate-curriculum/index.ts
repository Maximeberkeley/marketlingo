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
import { syllabusDay, type SyllabusDay } from '../_shared/syllabus.ts';

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
  /** Rewrite days that already have content (v2 curriculum rewrite). */
  force?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // The scheduled rewrite worker calls this function server-to-server with the
    // service role key; everyone else must be a signed-in admin.
    const authHeader = req.headers.get('Authorization');
    const internal = authHeader === `Bearer ${supabaseKey}`;

    if (!internal) {
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - no auth token provided' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
    }


    const { 
      marketId = 'aerospace', 
      month, 
      week, 
      day, 
      goal,
      dryRun = false, 
      generateSummaries = false,
      batchSize = 5,
      force = false
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
        if (force || !existingByGoal[g].has(dayNum)) {
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
        topic: getTopic(d, marketId),
        facet: syllabusDay(marketId, d).facetLabel,
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
          const plan = syllabusDay(marketId, dayNum);

          const content = await generateDayContent(
            LOVABLE_API_KEY,
            dayNum,
            monthInfo.month,
            monthInfo.theme,
            plan.topic,
            dayType,
            marketId,
            goalKey,
            plan
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

/**
 * The day's territory now comes from the 180-day syllabus, which also decides
 * the angle taken on it, so six consecutive days on one topic are six
 * different concepts rather than one repeated.
 */
function getTopic(day: number, marketId: string): string {
  return syllabusDay(marketId, day).topic;
}


/** The v2 contract: one concept per day, taught in six named beats, no ceilings. */
const BEATS = [
  { n: 1, name: 'Recap', brief: 'One short paragraph linking what they owned yesterday to today. No new idea here.' },
  { n: 2, name: 'Concept', brief: "Today's single idea, named and defined in plain words a smart outsider understands." },
  { n: 3, name: 'Mechanism', brief: 'How it actually works, cause by cause, in order. Name who pays, who decides, what moves.' },
  { n: 4, name: 'Case', brief: 'ONE real, named company or programme with real figures (dollars, percentages, dates) and the outcome.' },
  { n: 5, name: 'Check', brief: 'The trap a beginner falls into on this exact concept, stated and corrected, with the real reason.' },
  { n: 6, name: 'Takeaway', brief: "The one sentence they keep, plus why tomorrow's idea follows from it." },
];

const MIN_BODY = 350;
const MAX_BODY = 1200;

function endsMidSentence(text: string): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  return !/[.!?"'’”)]$/.test(t);
}

/** Rejects a day that would ship thin, cut, or unsourced. */
function validateDayContent(content: any): string[] {
  const problems: string[] = [];
  if (!content) return ['no content'];
  if (!content.title || String(content.title).trim().length < 6) problems.push('missing title');
  if (!content.concept || String(content.concept).trim().length < 6) problems.push('missing concept name');
  const objectives = Array.isArray(content.learning_objectives) ? content.learning_objectives.filter((o: any) => String(o || '').trim().length > 8) : [];
  if (objectives.length < 3) problems.push('needs 3 real learning objectives');
  for (const field of ['key_takeaway', 'recap_bridge', 'next_preview']) {
    if (!content[field] || String(content[field]).trim().length < 12) problems.push(`missing ${field}`);
  }
  const slides = Array.isArray(content.slides) ? content.slides : [];
  if (slides.length !== 6) problems.push(`needs exactly 6 beats, got ${slides.length}`);
  slides.forEach((slide: any, i: number) => {
    const body = String(slide?.body || '').trim();
    if (body.length < MIN_BODY) problems.push(`beat ${i + 1} too thin (${body.length} chars)`);
    if (body.length > MAX_BODY + 400) problems.push(`beat ${i + 1} too long (${body.length} chars)`);
    if (endsMidSentence(body)) problems.push(`beat ${i + 1} ends mid-sentence`);
    if (!slide?.title || String(slide.title).trim().length < 3) problems.push(`beat ${i + 1} missing title`);
  });
  const caseBeat = slides[3];
  const caseText = String(caseBeat?.body || '');
  if (!/\d/.test(caseText)) problems.push('case beat has no figures');
  const allSources = slides.flatMap((s: any) => (Array.isArray(s?.sources) ? s.sources : []));
  const usableSources = allSources.filter((s: any) => typeof s?.url === 'string' && /^https?:\/\/[^\s]+\.[^\s]+/.test(s.url) && !/example\.com/.test(s.url));
  if (usableSources.length < 2) problems.push('needs at least 2 real sources with links');
  return problems;
}

function dayLessonPrompt(
  day: number,
  month: number,
  theme: string,
  topic: string,
  dayType: string,
  marketContext: string,
  persona: { label: string; slideGuidance: string },
  plan?: SyllabusDay,
): { system: string; user: string } {
  const isConsolidation = plan?.isConsolidation ?? day % 7 === 0;
  // The syllabus decides today's angle on the topic, so consecutive days on the
  // same territory teach genuinely different concepts.
  const planAngle = plan
    ? `TODAY'S ANGLE — "${plan.facetLabel}": ${plan.angle}`
    : isConsolidation
      ? `This is a CONSOLIDATION day. Introduce NO new concept. Take the single most important idea of this week's theme ("${theme}") and make the learner retrieve and connect it.`
      : 'Teach one core operating concept of this industry.';
  const flavour = isConsolidation
    ? ''
    : dayType === 'DAILY_GAME'
      ? ' Anchor it in a real, recent development — a named deal, filing, launch or price move — but it is still ONE concept, not a news roundup.'
      : dayType === 'BOOK_SNAPSHOT'
        ? ' Anchor it in a real historical episode with dates and actors, but it is still ONE concept.'
        : '';
  const angle = `${planAngle}${flavour}`;

  const system = `You are a veteran ${marketContext} insider writing one day of a six-month curriculum for ${persona.label.toUpperCase()} learners.

THE CONTRACT — follow it exactly:
- ONE concept for the whole day. Name it. Do not skim several angles.
- Teach it to the point of ownership: after today the learner can explain the mechanism to someone else without notes.
- Write complete prose. Never abbreviate to fit a length. Never end a sentence or a beat mid-thought.
- Every figure must be real and checkable: actual companies, programmes, dollar amounts, percentages, dates.
- No hollow generalities ("innovation is key", "the market is growing fast"). A domain expert will read this and reject buzz sentences.
- 9th-grade reading level, professional insider tone, no emojis, no hype.
- Each beat body runs roughly ${MIN_BODY}-${MAX_BODY} characters of real substance.

Month ${month} theme: ${theme}. Today's territory: ${topic}. ${angle}`;

  const beatSpec = BEATS.map(b => `Beat ${b.n} — ${b.name}: ${b.brief}`).join('\n');

  const user = `Write day ${day} for ${marketContext}, for ${persona.label.toUpperCase()} learners.

Pick ONE concept inside "${topic}" that this learner genuinely needs, and teach only that.

The six beats, in this order:
${beatSpec}

Keep the ${persona.label} lens throughout (what they should do with this):
${persona.slideGuidance}

Return valid JSON only:
{
  "title": "The concept, stated as a title (max 8 words)",
  "concept": "The single concept in 3-8 words",
  "learning_objectives": [
    "A specific thing they can do or explain afterwards",
    "A second distinct outcome",
    "A third distinct outcome"
  ],
  "key_takeaway": "The one sentence they keep",
  "recap_bridge": "One sentence tying yesterday's idea to today's",
  "next_preview": "One sentence making tomorrow's idea feel necessary",
  "slides": [
    {
      "slide_number": 1,
      "title": "Beat title (max 7 words)",
      "body": "Complete prose, ${MIN_BODY}-${MAX_BODY} characters, ending in a finished sentence",
      "sources": [{"label": "Publication or filing", "url": "https://real-url"}]
    }
  ],
  "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}", "${theme.toLowerCase().replace(/\s+/g, '-')}"]
}

Rules that cause rejection if broken: exactly 6 beats; every body at least ${MIN_BODY} characters and ending in a complete sentence; beat 4 contains real figures; at least two real source links across the day (never example.com); all three objectives written as outcomes.`;

  return { system, user };
}

async function callGateway(apiKey: string, system: string, user: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
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
  if (!content) throw new Error('No content generated');
  return JSON.parse(content.replace(/^```json\s*/i, '').replace(/```\s*$/, ''));
}

async function generateDayContent(
  apiKey: string,
  day: number,
  month: number,
  theme: string,
  topic: string,
  dayType: string,
  marketId: string,
  goal: LearningGoal,
  plan?: SyllabusDay,
) {
  const marketContext = getMarketContext(marketId);
  const persona = GOAL_PERSONAS[goal];

  const isTrainer = dayType === 'TRAINER';

  if (isTrainer) {
    const system = `${persona.systemPrompt}

       You create challenging decision scenarios for ${marketContext} that test strategic thinking.
       Your scenarios are based on REAL situations — framed for someone whose goal is: ${persona.label}.`;

    const user = `Create a decision-making SCENARIO about "${topic}" in ${marketContext}.

       Frame this scenario for a ${persona.label.toUpperCase()} learner.
       - Base it on REAL situations a ${persona.label} professional would face
       - Include realistic numbers, timelines, and trade-offs
       - Only one option should be clearly best to an experienced professional

       The scenario should be 400-600 characters, presenting a genuine dilemma.

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
       }`;

    return await callGateway(apiKey, system, user);
  }

  const { system, user } = dayLessonPrompt(day, month, theme, topic, dayType, marketContext, persona, plan);

  // Up to three attempts: a day that fails the contract is rewritten, never saved thin.
  let lastProblems: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const retryNote = attempt === 0
      ? ''
      : `\n\nYour previous attempt was REJECTED for: ${lastProblems.join('; ')}. Fix every one of these and write the day again in full. The case beat MUST name a real company and carry at least two hard figures (a money amount, a percentage, a count or a date).`;
    const content = await callGateway(apiKey, system, user + retryNote);
    lastProblems = validateDayContent(content);
    if (lastProblems.length === 0) return content;
    console.warn(`Day ${day} (${goal}) attempt ${attempt + 1} rejected:`, lastProblems.join('; '));
  }

  throw new Error(`Contract violation after 3 attempts: ${lastProblems.join('; ')}`);
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
  const levelTag = getLevelTag(day);
  const baseTags = [dayType, `day-${day}`, `month-${month}`, 'MICRO_LESSON', goalTag, levelTag, 'contract-v2'];

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
      metadata: {
        contract: 'v2',
        concept: content.concept || '',
        consolidation: day % 7 === 0,
        learning_objectives: content.learning_objectives || [],
        key_takeaway: content.key_takeaway || '',
        recap_bridge: content.recap_bridge || '',
        next_preview: content.next_preview || '',
      },
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
      // No ceiling: the v2 contract forbids trimming, which is what cut sentences before.
      body: (slide.body || '').trim(),
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
      model: 'google/gemini-2.5-pro',
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
