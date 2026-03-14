import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate polished drill questions for a given market + day.
 * Creates 3 sets of 7 questions each (21 total) based on that day's lesson
 * plus review from previous days.
 *
 * Body: { market_id: string, day_number: number }
 * Can be called from batch-generate-all or directly.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { market_id, day_number } = await req.json();

    if (!market_id || !day_number) {
      return new Response(
        JSON.stringify({ error: 'market_id and day_number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if drills already exist for this market + day
    const { count } = await supabase
      .from('drill_questions')
      .select('id', { count: 'exact', head: true })
      .eq('market_id', market_id)
      .eq('day_number', day_number);

    if (count && count >= 21) {
      return new Response(
        JSON.stringify({ success: true, message: 'Drills already exist', count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the lesson for this day + a few previous days for review content
    const dayTags = [];
    for (let d = Math.max(1, day_number - 2); d <= day_number; d++) {
      dayTags.push(`day-${d}`);
    }

    const { data: stacks } = await supabase
      .from('stacks')
      .select('id, title, tags, slides (title, body)')
      .eq('market_id', market_id)
      .not('published_at', 'is', null)
      .overlaps('tags', dayTags)
      .limit(6);

    if (!stacks || stacks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No lesson content found for this day', market_id, day_number }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from slides
    const lessonContext = stacks.map((stack: any) => {
      const slides = (stack.slides || []) as any[];
      const slideTexts = slides
        .map((s: any) => `**${s.title}**: ${s.body}`)
        .join('\n');
      return `### ${stack.title}\n${slideTexts}`;
    }).join('\n\n');

    // Determine difficulty based on day
    let difficulty = 'beginner';
    if (day_number > 120) difficulty = 'advanced';
    else if (day_number > 60) difficulty = 'intermediate';

    const systemPrompt = `You are an expert educational assessment designer creating True/False drill questions for a professional market intelligence learning app.

RULES:
- Each statement must be a SINGLE, clear, factual claim (40-120 characters ideally, max 180)
- True statements must be directly supported by the lesson content
- False statements must be plausible but contain ONE specific factual error (wrong number, wrong company, wrong relationship, inverted cause/effect)
- DO NOT use obvious negation words like "not" or "never" to make false statements — change a specific fact instead
- Each explanation must be 1-2 sentences explaining WHY it's true or false, referencing the lesson
- Categories should be specific topics (e.g., "Satellite Launch Costs", "mRNA Delivery", "Battery Chemistry") not generic
- Difficulty: ${difficulty}
- Questions should test comprehension, not memorization of exact numbers

QUALITY STANDARDS:
- No duplicate or near-duplicate statements across sets
- Each set should cover different aspects of the material
- False statements should be tricky enough to require understanding, not just recall
- Mix conceptual understanding with factual knowledge`;

    const userPrompt = `Based on these lessons, generate exactly 3 sets of 7 True/False drill questions each (21 total).

LESSON CONTENT:
${lessonContext}

Return valid JSON:
{
  "sets": [
    {
      "set_number": 1,
      "focus": "Today's lesson core concepts",
      "questions": [
        {
          "question_number": 1,
          "statement": "Clear factual statement",
          "is_true": true,
          "explanation": "Why this is true/false based on the lesson",
          "category": "Specific Topic Name",
          "source_label": "Lesson reference"
        }
      ]
    },
    {
      "set_number": 2,
      "focus": "Applied understanding & connections",
      "questions": [...]
    },
    {
      "set_number": 3,
      "focus": "Review of previous days + deeper analysis",
      "questions": [...]
    }
  ]
}

IMPORTANT:
- Set 1: Focus on today's lesson (day ${day_number}) — test core facts and concepts
- Set 2: Test applied understanding — cause/effect, comparisons, implications
- Set 3: Review previous days' content mixed with today's — test synthesis and connections
- Each set MUST have exactly 7 questions
- Aim for roughly 50/50 true/false split across each set (3-4 true, 3-4 false)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
      const errText = await response.text();
      console.error('AI error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: 'AI generation failed', status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content generated');

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse:', content.slice(0, 500));
      throw new Error('Invalid JSON from AI');
    }

    // Insert all questions
    const rows: any[] = [];
    const todayStack = stacks.find((s: any) => 
      (s.tags as string[])?.some(t => t === `day-${day_number}`)
    );

    for (const set of (parsed.sets || [])) {
      for (const q of (set.questions || [])) {
        rows.push({
          market_id,
          stack_id: todayStack?.id || null,
          day_number,
          set_number: set.set_number,
          question_number: q.question_number,
          statement: q.statement,
          is_true: q.is_true,
          explanation: q.explanation,
          category: q.category || 'Market Insight',
          difficulty,
          source_label: q.source_label || 'Lesson Content',
        });
      }
    }

    if (rows.length === 0) {
      throw new Error('No questions generated');
    }

    const { error: insertError } = await supabase
      .from('drill_questions')
      .upsert(rows, { onConflict: 'market_id,day_number,set_number,question_number' });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, generated: rows.length, day: day_number, market: market_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
