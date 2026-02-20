import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * refresh-market-news
 * 
 * Runs as service role (no user auth needed) to:
 * 1. Fetch fresh articles via Firecrawl for every active market
 * 2. Upsert them into news_items table with today's published_at
 * 3. Optionally enhance summaries with AI (Lovable AI gateway)
 * 
 * Designed to be called by pg_cron 2× per day (8am + 6pm UTC).
 * Can also be triggered on-demand via POST with { marketId?: string }.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Market search configs ──────────────────────────────────────────────────

const marketSearchConfig: Record<string, { queries: string[]; categories: string[] }> = {
  aerospace: {
    queries: ['site:aviationweek.com aerospace', 'site:spacenews.com', 'site:flightglobal.com aviation'],
    categories: ['Space', 'Aviation', 'Defense', 'Deals', 'Innovation'],
  },
  ai: {
    queries: ['site:techcrunch.com artificial intelligence', 'site:wired.com AI machine learning', 'site:venturebeat.com AI'],
    categories: ['Models', 'Hardware', 'Research', 'Startups', 'Enterprise'],
  },
  biotech: {
    queries: ['site:fiercebiotech.com', 'site:biopharmadive.com', 'site:statnews.com biotech'],
    categories: ['Clinical', 'FDA', 'Deals', 'Research', 'IPO'],
  },
  cleanenergy: {
    queries: ['site:renewableenergyworld.com', 'site:utilitydive.com clean energy', 'site:greentechmedia.com'],
    categories: ['Solar', 'Wind', 'Storage', 'Grid', 'Policy'],
  },
  climatetech: {
    queries: ['site:canarymedia.com', 'site:greenbiz.com climate', 'site:climatechangenews.com'],
    categories: ['Carbon', 'Policy', 'Investment', 'Tech', 'Impact'],
  },
  cybersecurity: {
    queries: ['site:darkreading.com', 'site:bleepingcomputer.com', 'site:therecord.media cybersecurity'],
    categories: ['Threats', 'Defense', 'Enterprise', 'Breach', 'Policy'],
  },
  ev: {
    queries: ['site:electrek.co', 'site:insideevs.com', 'site:chargedevs.com'],
    categories: ['Vehicles', 'Charging', 'Battery', 'Policy', 'Deals'],
  },
  fintech: {
    queries: ['site:fintechfutures.com', 'site:pymnts.com fintech', 'site:finextra.com'],
    categories: ['Payments', 'Banking', 'Crypto', 'Lending', 'Deals'],
  },
  healthtech: {
    queries: ['site:mobihealthnews.com', 'site:healthcareitnews.com', 'site:fiercehealthcare.com digital health'],
    categories: ['Telehealth', 'AI', 'Devices', 'FDA', 'Deals'],
  },
  logistics: {
    queries: ['site:freightwaves.com', 'site:supplychaindive.com', 'site:dcvelocity.com logistics'],
    categories: ['Shipping', 'Last-Mile', 'Automation', 'Supply Chain', 'Tech'],
  },
  neuroscience: {
    queries: ['site:neurosciencenews.com', 'site:statnews.com brain'],
    categories: ['BCI', 'Research', 'FDA', 'Therapeutics', 'Devices'],
  },
  robotics: {
    queries: ['site:therobotreport.com', 'site:roboticsandautomationnews.com'],
    categories: ['Industrial', 'Service', 'AI', 'Humanoid', 'Deals'],
  },
  spacetech: {
    queries: ['site:spacenews.com', 'site:arstechnica.com space', 'site:nasaspaceflight.com'],
    categories: ['Launch', 'Satellites', 'Exploration', 'Commercial', 'Policy'],
  },
  agtech: {
    queries: ['site:agfundernews.com', 'site:agweb.com technology'],
    categories: ['Precision', 'Biotech', 'Climate', 'Robotics', 'Deals'],
  },
  web3: {
    queries: ['site:theblock.co', 'site:coindesk.com', 'site:decrypt.co blockchain'],
    categories: ['DeFi', 'NFT', 'Layer2', 'Regulation', 'Deals'],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryFromContent(title: string, content: string, marketId: string): string {
  const combined = (title + ' ' + content).toLowerCase();
  const config = marketSearchConfig[marketId];
  if (!config) return 'Industry';

  if (marketId === 'aerospace') {
    if (combined.includes('spacex') || combined.includes('rocket') || combined.includes('launch')) return 'Space';
    if (combined.includes('boeing') || combined.includes('airbus') || combined.includes('airline')) return 'Aviation';
    if (combined.includes('defense') || combined.includes('military')) return 'Defense';
  } else if (marketId === 'ai') {
    if (combined.includes('gpt') || combined.includes('llm') || combined.includes('model')) return 'Models';
    if (combined.includes('chip') || combined.includes('gpu') || combined.includes('nvidia')) return 'Hardware';
    if (combined.includes('startup') || combined.includes('funding')) return 'Startups';
  } else if (marketId === 'biotech') {
    if (combined.includes('fda') || combined.includes('approval')) return 'FDA';
    if (combined.includes('trial') || combined.includes('phase')) return 'Clinical';
    if (combined.includes('acquisition') || combined.includes('deal')) return 'Deals';
  }

  if (combined.includes('funding') || combined.includes('raises') || combined.includes('investment')) return 'Deals';
  if (combined.includes('research') || combined.includes('study') || combined.includes('discovery')) return 'Research';
  return config.categories[0] || 'Industry';
}

async function fetchAndPersistMarket(
  supabase: any,
  firecrawlKey: string,
  lovableKey: string | undefined,
  marketId: string,
): Promise<{ inserted: number; errors: string[] }> {
  const config = marketSearchConfig[marketId];
  if (!config) return { inserted: 0, errors: [`No config for ${marketId}`] };

  const allResults: any[] = [];
  const errors: string[] = [];

  // Pull up to 3 results per query (last 24h)
  for (const query of config.queries) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 3,
          tbs: 'qdr:d',
          scrapeOptions: { formats: ['markdown'] },
        }),
      });

      if (!res.ok) {
        errors.push(`Firecrawl ${query}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (data.data) allResults.push(...data.data);
    } catch (e) {
      errors.push(`Firecrawl fetch error: ${(e as Error).message}`);
    }
  }

  // Deduplicate by URL
  const uniqueUrls = new Set<string>();
  const deduped: any[] = [];
  for (const item of allResults) {
    if (item.url && !uniqueUrls.has(item.url)) {
      uniqueUrls.add(item.url);
      deduped.push(item);
    }
  }

  const top = deduped.slice(0, 10);
  if (top.length === 0) return { inserted: 0, errors };

  // Build news items
  interface NewsRow {
    market_id: string;
    title: string;
    source_name: string;
    source_url: string;
    published_at: string;
    category_tag: string;
    summary: string;
  }

  const newsRows: NewsRow[] = top.map((item) => {
    let sourceName = 'News';
    try {
      const hostname = new URL(item.url).hostname.replace('www.', '');
      sourceName = hostname.split('.')[0];
      sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
    } catch (_) { /* ok */ }

    let summary = item.description || '';
    if (item.markdown && item.markdown.length > summary.length) {
      const paragraphs = item.markdown.split('\n').filter((p: string) => p.trim().length > 50);
      summary = paragraphs[0]?.substring(0, 250) || summary;
    }
    summary = summary.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').trim();
    if (summary.length > 200) summary = summary.substring(0, 200) + '...';

    return {
      market_id: marketId,
      title: item.title || 'Industry News',
      source_name: sourceName,
      source_url: item.url,
      published_at: new Date().toISOString(), // Always today
      category_tag: getCategoryFromContent(item.title || '', item.markdown || '', marketId),
      summary,
    };
  });

  // AI-enhance summaries
  if (lovableKey && newsRows.length > 0) {
    try {
      const marketName = marketId.charAt(0).toUpperCase() + marketId.slice(1);
      const prompt = `You are a ${marketName} industry analyst. For each headline, write a 1-sentence insight (15-25 words) explaining why this matters for startups and investors in this space.

Headlines:
${newsRows.map((n, i) => `${i + 1}. ${n.title}: ${n.summary}`).join('\n')}

Respond with a JSON array of insight strings only, no other text.`;

      const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an industry analyst. Respond only with valid JSON arrays.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const insights: string[] = JSON.parse(jsonMatch[0]);
          newsRows.forEach((row, i) => {
            if (insights[i] && typeof insights[i] === 'string') {
              row.summary = insights[i];
            }
          });
        }
      }
    } catch (e) {
      errors.push(`AI summary error: ${(e as Error).message}`);
    }
  }

  // Delete old items for this market and insert fresh ones
  await supabase.from('news_items').delete().eq('market_id', marketId);
  const { error: insertError } = await supabase.from('news_items').insert(newsRows);
  if (insertError) {
    errors.push(`DB insert error: ${insertError.message}`);
    return { inserted: 0, errors };
  }

  console.log(`[refresh-market-news] ${marketId}: inserted ${newsRows.length} articles`);
  return { inserted: newsRows.length, errors };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Determine which markets to refresh
    let marketsToRefresh: string[] = Object.keys(marketSearchConfig);
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.marketId && typeof body.marketId === 'string') {
        marketsToRefresh = [body.marketId];
      }
    } catch (_) { /* no body – refresh all */ }

    console.log(`[refresh-market-news] Refreshing ${marketsToRefresh.length} markets`);

    const results: Record<string, { inserted: number; errors: string[] }> = {};

    for (const marketId of marketsToRefresh) {
      results[marketId] = await fetchAndPersistMarket(supabase, firecrawlKey, lovableKey, marketId);
      // Brief pause to respect Firecrawl rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    const totalInserted = Object.values(results).reduce((s, r) => s + r.inserted, 0);
    console.log(`[refresh-market-news] Done. Total inserted: ${totalInserted}`);

    return new Response(
      JSON.stringify({ success: true, refreshed: marketsToRefresh.length, totalInserted, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[refresh-market-news] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
