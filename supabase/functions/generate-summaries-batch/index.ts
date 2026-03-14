import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  CURRICULUM_STRUCTURES, 
  getMarketContext,
} from '../_shared/curriculum-structures.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALL_MARKETS = Object.keys(CURRICULUM_STRUCTURES);

// 180-day program = 6 months × ~4 weeks = ~26 weeks (we'll use 4 weeks per month = 24 weeks)
// But for cleaner labeling: 36 weeks (6 months × 6 weeks) is too many
// Stick with curriculum: 6 months, 4 weeks each = 24 weekly summaries + 6 monthly

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: { market_id?: string; month?: number } = {};
  try { body = await req.json(); } catch { /* no body */ }

  const marketsToProcess = body.market_id ? [body.market_id] : ALL_MARKETS;
  const monthsToProcess = body.month ? [body.month] : [1, 2, 3, 4, 5, 6];

  // Check existing summaries
  const { data: existing } = await supabase
    .from('summaries')
    .select('market_id, summary_type, for_date');

  const existingSet = new Set(
    (existing || []).map((s: any) => `${s.market_id}-${s.summary_type}-${s.for_date}`)
  );

  const results: Record<string, number> = {};

  const processAsync = async () => {
    let totalGenerated = 0;

    for (const marketId of marketsToProcess) {
      const structure = CURRICULUM_STRUCTURES[marketId];
      if (!structure) continue;
      
      let marketCount = 0;
      const marketContext = getMarketContext(marketId);

      for (const month of monthsToProcess) {
        const monthInfo = structure.months[month - 1];
        if (!monthInfo) continue;

        // Generate 4 weekly summaries per month (Week 1-4 of Month X)
        for (let week = 1; week <= 4; week++) {
          const globalWeek = (month - 1) * 4 + week;
          const forDate = new Date();
          forDate.setDate(forDate.getDate() - (24 - globalWeek) * 7);
          const dateStr = forDate.toISOString().split('T')[0];
          
          const key = `${marketId}-WEEKLY-${dateStr}`;
          if (existingSet.has(key)) continue;

          try {
            const content = await generateWeeklySummary(
              LOVABLE_API_KEY, globalWeek, week, month, monthInfo.theme, monthInfo.topics, marketContext
            );
            
            await supabase.from('summaries').insert({
              market_id: marketId,
              summary_type: 'WEEKLY',
              title: content.title,
              content: content.content,
              key_takeaways: content.key_takeaways || [],
              for_date: dateStr,
            });
            
            marketCount++;
            totalGenerated++;
            existingSet.add(key);
            console.log(`Generated WEEKLY summary for ${marketId} Week ${globalWeek}`);
          } catch (e) {
            console.error(`Failed WEEKLY ${marketId} week ${globalWeek}:`, e);
          }
          await new Promise(r => setTimeout(r, 800));
        }

        // Monthly summary
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (6 - month));
        const monthDateStr = monthDate.toISOString().split('T')[0];
        const monthKey = `${marketId}-MONTHLY-${monthDateStr}`;
        
        if (!existingSet.has(monthKey)) {
          try {
            const content = await generateMonthlySummary(
              LOVABLE_API_KEY, month, monthInfo.theme, monthInfo.topics, marketContext
            );
            
            await supabase.from('summaries').insert({
              market_id: marketId,
              summary_type: 'MONTHLY',
              title: content.title,
              content: content.content,
              key_takeaways: content.key_takeaways || [],
              for_date: monthDateStr,
            });
            
            marketCount++;
            totalGenerated++;
          } catch (e) {
            console.error(`Failed MONTHLY ${marketId} month ${month}:`, e);
          }
          await new Promise(r => setTimeout(r, 800));
        }
      }
      
      results[marketId] = marketCount;
      console.log(`Completed ${marketId}: ${marketCount} summaries`);
    }
    console.log(`Total summaries generated: ${totalGenerated}`);
  };

  processAsync().catch(console.error);

  return new Response(JSON.stringify({
    message: 'Summary generation started in background',
    markets: marketsToProcess,
    months: monthsToProcess,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function generateWeeklySummary(
  apiKey: string, globalWeek: number, weekInMonth: number, month: number,
  theme: string, topics: string[], marketContext: string
) {
  const topicFocus = topics[Math.min(weekInMonth - 1, topics.length - 1)] || topics[0];
  const prompt = `Create a WEEKLY recap for Week ${globalWeek} (Week ${weekInMonth} of Month ${month}: "${theme}") for professionals learning ${marketContext}.
Focus topic this week: ${topicFocus}
All month topics: ${topics.join(', ')}

Create an executive-style weekly recap that synthesizes the week's key learnings into actionable knowledge.
The title MUST start with "Week ${globalWeek}:" followed by a descriptive title.
Return JSON: { "title": "Week ${globalWeek}: [descriptive title about the week's focus]", "content": "3-4 paragraphs (600-800 words) summarizing key insights", "key_takeaways": ["takeaway1", "takeaway2", "takeaway3", "takeaway4"] }`;

  return callAI(apiKey, prompt, `senior ${marketContext} industry analyst creating weekly executive recaps`);
}

async function generateMonthlySummary(
  apiKey: string, month: number, theme: string, topics: string[], marketContext: string
) {
  const prompt = `Create a MONTHLY review for Month ${month}: "${theme}" for professionals mastering ${marketContext}.
Topics covered this month: ${topics.join(', ')}

Create a comprehensive month-end review that ties together all weekly learnings.
The title MUST start with "Month ${month}:" followed by the theme.
Return JSON: { "title": "Month ${month}: Mastering ${theme}", "content": "4-5 paragraphs (800-1000 words) reviewing the month's journey", "key_takeaways": ["t1", "t2", "t3", "t4", "t5"] }`;

  return callAI(apiKey, prompt, `senior ${marketContext} industry analyst creating monthly reviews`);
}

async function callAI(apiKey: string, prompt: string, systemRole: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: `You are a ${systemRole}.` },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error(`AI API error: ${response.status}`);
  const r = await response.json();
  return JSON.parse(r.choices?.[0]?.message?.content || '{}');
}
