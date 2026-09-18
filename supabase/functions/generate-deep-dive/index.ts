import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const GOALS = ['found', 'career', 'invest', 'explore'] as const;
type Goal = typeof GOALS[number];

const GOAL_LENS: Record<Goal, string> = {
  found: 'the reader wants to find a real startup gap: end on where the mechanism leaves an opening',
  career: 'the reader wants to hold their own in a hiring conversation: give the vocabulary and the numbers an insider would expect',
  invest: 'the reader evaluates companies: emphasise the economics, the risk and what would change the call',
  explore: 'the reader is curious: emphasise clarity and why this concept shapes the industry',
};

/**
 * Deep layer on demand — one substantive, sourced explanation of the single
 * concept a lesson teaches. Cached per (stack, goal); never blocks a lesson:
 * on any failure the client keeps the authored text.
 *
 * Body: { stack_id: string, goal_key?: 'found' | 'career' | 'invest' | 'explore' }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await authClient.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    );
    if (claimsError || !claims?.claims) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const stackId = typeof body?.stack_id === 'string' ? body.stack_id.trim() : '';
    const goalKey: Goal = GOALS.includes(body?.goal_key) ? body.goal_key : 'explore';
    if (!/^[0-9a-f-]{36}$/i.test(stackId)) {
      return json({ error: 'stack_id must be a valid lesson id' }, 400);
    }

    const db = createClient(supabaseUrl, serviceKey);

    const { data: cached } = await db
      .from('lesson_deep_dives')
      .select('*')
      .eq('stack_id', stackId)
      .eq('goal_key', goalKey)
      .maybeSingle();
    if (cached) return json({ deep_dive: cached, cached: true });

    const { data: stack, error: stackError } = await db
      .from('stacks')
      .select('id, title, market_id, metadata, markets(name), slides(slide_number, title, body, sources)')
      .eq('id', stackId)
      .maybeSingle();
    if (stackError || !stack) return json({ error: 'Lesson not found' }, 404);

    const slides = ((stack as any).slides || []).sort(
      (a: any, b: any) => a.slide_number - b.slide_number,
    );
    if (!slides.length) return json({ error: 'Lesson has no content yet' }, 404);

    const lessonText = slides
      .map((s: any) => `${s.title}\n${s.body}`)
      .join('\n\n')
      .slice(0, 9000);
    const marketName = (stack as any).markets?.name || (stack as any).market_id;
    const objectives = ((stack as any).metadata?.learning_objectives || []).join('; ');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'AI is not configured' }, 503);

    const systemPrompt = [
      `You write the deep layer of a ${marketName} lesson for an ambitious non-expert.`,
      'Teach ONE concept properly — the concept the lesson already teaches. Never introduce a second idea.',
      'Every claim must be concrete and checkable: named companies, real figures with units and periods, real programmes or regulations.',
      'Forbidden: hype, "game-changing", vague growth claims, unnamed "experts say", invented numbers.',
      'If you are not certain of a figure, describe the relationship instead of inventing a number.',
      'Finish every sentence. Plain language at a 9th-grade reading level. No emojis. No second person hype.',
      `Reader lens: ${GOAL_LENS[goalKey]}.`,
      'Return ONLY JSON matching the schema.',
    ].join(' ');

    const userPrompt = [
      `Lesson title: ${(stack as any).title}`,
      objectives ? `Stated objectives: ${objectives}` : '',
      '',
      'Lesson text the learner just read:',
      lessonText,
      '',
      'Write the deep layer as JSON:',
      '{',
      '  "concept": "the single concept, 3-8 words",',
      '  "summary": "2-3 sentences defining the concept plainly",',
      '  "mechanism": [{"step": "short cause label", "detail": "1-2 sentences of how it actually works"}] (3-5 steps, in causal order),',
      '  "case_study": {"company": "real named company or programme", "situation": "1-2 sentences", "figures": ["figure with unit and period"], "outcome": "1-2 sentences of what happened and what it proves"},',
      '  "key_terms": [{"term": "term", "definition": "one plain sentence"}] (2-4),',
      '  "sources": [{"label": "publication or filing, year", "url": "https://..."}] (1-3, real and stable)',
      '}',
    ]
      .filter(Boolean)
      .join('\n');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (aiResponse.status === 429) return json({ error: 'Busy right now — try again shortly' }, 429);
    if (aiResponse.status === 402) return json({ error: 'AI credits exhausted' }, 402);
    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error('deep-dive ai error', aiResponse.status, detail.slice(0, 500));
      return json({ error: 'Could not write the deep layer' }, 502);
    }

    const payload = await aiResponse.json();
    const raw = payload?.choices?.[0]?.message?.content ?? '';
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
    } catch {
      console.error('deep-dive parse failure', String(raw).slice(0, 400));
      return json({ error: 'Could not read the deep layer' }, 502);
    }

    const asArray = (value: unknown) => (Array.isArray(value) ? value : []);
    const text = (value: unknown, max: number) =>
      typeof value === 'string' ? value.trim().slice(0, max) : '';

    const record = {
      stack_id: stackId,
      market_id: (stack as any).market_id,
      goal_key: goalKey,
      concept: text(parsed.concept, 120) || (stack as any).title,
      summary: text(parsed.summary, 900),
      mechanism: asArray(parsed.mechanism)
        .slice(0, 5)
        .map((step: any) => ({ step: text(step?.step, 80), detail: text(step?.detail, 500) }))
        .filter((step: any) => step.step && step.detail),
      case_study: {
        company: text(parsed.case_study?.company, 120),
        situation: text(parsed.case_study?.situation, 600),
        figures: asArray(parsed.case_study?.figures).slice(0, 4).map((f: any) => text(f, 160)).filter(Boolean),
        outcome: text(parsed.case_study?.outcome, 600),
      },
      key_terms: asArray(parsed.key_terms)
        .slice(0, 4)
        .map((t: any) => ({ term: text(t?.term, 60), definition: text(t?.definition, 300) }))
        .filter((t: any) => t.term && t.definition),
      sources: asArray(parsed.sources)
        .slice(0, 3)
        .map((s: any) => ({ label: text(s?.label, 120), url: text(s?.url, 500) }))
        .filter((s: any) => s.label && /^https?:\/\//.test(s.url)),
      model: 'google/gemini-2.5-flash',
    };

    if (!record.summary || record.mechanism.length < 2) {
      return json({ error: 'Deep layer came back too thin' }, 502);
    }

    const { data: saved, error: saveError } = await db
      .from('lesson_deep_dives')
      .upsert(record, { onConflict: 'stack_id,goal_key' })
      .select('*')
      .single();
    if (saveError) {
      console.error('deep-dive save error', saveError.message);
      return json({ deep_dive: record, cached: false });
    }

    return json({ deep_dive: saved, cached: false });
  } catch (error) {
    console.error('deep-dive unexpected error', error);
    return json({ error: 'Unexpected error' }, 500);
  }
});
