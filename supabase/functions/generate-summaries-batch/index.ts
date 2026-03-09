import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  CURRICULUM_STRUCTURES, 
  getMarketContext,
  type CurriculumStructure,
} from '../_shared/curriculum-structures.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALL_MARKETS = Object.keys(CURRICULUM_STRUCTURES);

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

  let totalGenerated = 0;
  const results: Record<string, number> = {};

  // Process in background
  const processAsync = async () => {
    for (const marketId of marketsToProcess) {
      const structure = CURRICULUM_STRUCTURES[marketId];
      if (!structure) continue;
      
      let marketCount = 0;
      const marketContext = getMarketContext(marketId);

      for (const month of monthsToProcess) {
        const monthInfo = structure.months[month - 1];
        if (!monthInfo) continue;

        // Generate 4 weekly summaries + daily summaries for this month
        for (let week = 1; week <= 4; week++) {
          const weekNum = (month - 1) * 4 + week;
          const forDate = new Date();
          forDate.setDate(forDate.getDate() - (24 - weekNum) * 7);
          const dateStr = forDate.toISOString().split('T')[0];
          
          const key = `${marketId}-WEEKLY-${dateStr}`;
          if (existingSet.has(key)) continue;

          try {
            const content = await generateSummary(
              LOVABLE_API_KEY, 'WEEKLY', monthInfo.theme, monthInfo.topics, weekNum, month, marketContext
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
            console.log(`Generated WEEKLY summary for ${marketId} week ${weekNum}`);
          } catch (e) {
            console.error(`Failed WEEKLY ${marketId} week ${weekNum}:`, e);
          }
          await new Promise(r => setTimeout(r, 800));
        }

        // Generate daily summaries for each day in this month
        const startDay = (month - 1) * 30 + 1;
        for (let dayOffset = 0; dayOffset < 30 && startDay + dayOffset <= 180; dayOffset++) {
          const day = startDay + dayOffset;
          const forDate = new Date();
          forDate.setDate(forDate.getDate() - (180 - day));
          const dateStr = forDate.toISOString().split('T')[0];
          
          const key = `${marketId}-DAILY-${dateStr}`;
          if (existingSet.has(key)) continue;

          try {
            const content = await generateDailySummary(
              LOVABLE_API_KEY, day, month, monthInfo.theme, monthInfo.topics, marketContext
            );
            
            await supabase.from('summaries').insert({
              market_id: marketId,
              summary_type: 'DAILY',
              title: content.title,
              content: content.content,
              key_takeaways: content.key_takeaways || [],
              for_date: dateStr,
            });
            
            marketCount++;
            totalGenerated++;
            existingSet.add(key);
          } catch (e) {
            console.error(`Failed DAILY ${marketId} day ${day}:`, e);
          }
          await new Promise(r => setTimeout(r, 600));
        }

        // Monthly summary
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (6 - month));
        const monthDateStr = monthDate.toISOString().split('T')[0];
        const monthKey = `${marketId}-MONTHLY-${monthDateStr}`;
        
        if (!existingSet.has(monthKey)) {
          try {
            const content = await generateSummary(
              LOVABLE_API_KEY, 'MONTHLY', monthInfo.theme, monthInfo.topics, 0, month, marketContext
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

  // Fire and forget
  processAsync().catch(console.error);

  return new Response(JSON.stringify({
    message: 'Summary generation started in background',
    markets: marketsToProcess,
    months: monthsToProcess,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function generateSummary(
  apiKey: string, type: 'WEEKLY' | 'MONTHLY', theme: string, topics: string[],
  weekNum: number, month: number, marketContext: string
) {
  const prompt = type === 'WEEKLY'
    ? `Create a WEEKLY summary for Week ${weekNum} of the "${theme}" module for professionals learning ${marketContext}.
       Topics covered: ${topics.slice(0, 2).join(', ')}
       Create an executive-style summary that synthesizes the week's key learnings into actionable knowledge.
       Return JSON: { "title": "Week ${weekNum}: [title]", "content": "3-4 paragraphs (600-800 words)", "key_takeaways": ["takeaway1", "takeaway2", "takeaway3", "takeaway4"] }`
    : `Create a MONTHLY summary for Month ${month}: "${theme}" for professionals mastering ${marketContext}.
       Topics covered: ${topics.join(', ')}
       Create a comprehensive month-end review.
       Return JSON: { "title": "Month ${month} Complete: Mastering ${theme}", "content": "4-5 paragraphs (800-1000 words)", "key_takeaways": ["t1", "t2", "t3", "t4", "t5"] }`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: `You are a senior ${marketContext} industry analyst creating executive summaries.` },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error(`AI API error: ${response.status}`);
  const r = await response.json();
  return JSON.parse(r.choices?.[0]?.message?.content || '{}');
}

async function generateDailySummary(
  apiKey: string, day: number, month: number, theme: string, topics: string[], marketContext: string
) {
  const prompt = `Create a brief DAILY summary for Day ${day} (Month ${month}: "${theme}") for ${marketContext} learners.
    Topics: ${topics.join(', ')}
    Return JSON: { "title": "Day ${day}: [short insight title]", "content": "2 paragraphs (200-300 words) summarizing one key concept", "key_takeaways": ["key point 1", "key point 2"] }`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: `You are a ${marketContext} industry analyst writing daily learning recaps.` },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error(`AI API error: ${response.status}`);
  const r = await response.json();
  return JSON.parse(r.choices?.[0]?.message?.content || '{}');
}
