import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  categoryTag: string;
  summary: string;
  marketId: string;
  imageUrl: string | null;
}

// Market-specific search configurations — expanded sources
const marketSearchConfig: Record<string, { queries: string[]; categories: string[] }> = {
  aerospace: {
    queries: [
      'site:aviationweek.com aerospace',
      'site:spacenews.com',
      'site:flightglobal.com aviation',
      'site:defensenews.com aerospace defense',
      'aerospace industry news latest deals',
    ],
    categories: ['Space', 'Aviation', 'Defense', 'Deals', 'Innovation'],
  },
  ai: {
    queries: [
      'site:techcrunch.com artificial intelligence',
      'site:wired.com AI machine learning',
      'site:venturebeat.com AI',
      'site:theverge.com artificial intelligence',
      'AI startup funding latest news',
    ],
    categories: ['Models', 'Hardware', 'Research', 'Startups', 'Enterprise'],
  },
  biotech: {
    queries: [
      'site:fiercebiotech.com',
      'site:biopharmadive.com',
      'site:statnews.com biotech',
      'site:endpoints.news biotech',
      'biotech FDA approval clinical trial news',
    ],
    categories: ['Clinical', 'FDA', 'Deals', 'Research', 'IPO'],
  },
  cleanenergy: {
    queries: [
      'site:renewableenergyworld.com',
      'site:utilitydive.com clean energy',
      'site:canarymedia.com clean energy',
      'clean energy solar wind investment news',
    ],
    categories: ['Solar', 'Wind', 'Storage', 'Grid', 'Policy'],
  },
  climatetech: {
    queries: [
      'site:canarymedia.com',
      'site:greenbiz.com climate',
      'site:climatechangenews.com',
      'climate tech startup carbon capture news',
    ],
    categories: ['Carbon', 'Policy', 'Investment', 'Tech', 'Impact'],
  },
  cybersecurity: {
    queries: [
      'site:darkreading.com',
      'site:bleepingcomputer.com',
      'site:therecord.media cybersecurity',
      'site:securityweek.com',
      'cybersecurity breach enterprise latest news',
    ],
    categories: ['Threats', 'Defense', 'Enterprise', 'Breach', 'Policy'],
  },
  ev: {
    queries: [
      'site:electrek.co',
      'site:insideevs.com',
      'site:chargedevs.com',
      'site:theverge.com electric vehicle',
      'electric vehicle EV battery charging news',
    ],
    categories: ['Vehicles', 'Charging', 'Battery', 'Policy', 'Deals'],
  },
  fintech: {
    queries: [
      'site:fintechfutures.com',
      'site:pymnts.com fintech',
      'site:finextra.com',
      'site:tearsheet.co fintech',
      'fintech payments banking startup news',
    ],
    categories: ['Payments', 'Banking', 'Crypto', 'Lending', 'Deals'],
  },
  healthtech: {
    queries: [
      'site:mobihealthnews.com',
      'site:healthcareitnews.com',
      'site:fiercehealthcare.com digital health',
      'site:statnews.com digital health',
      'healthtech telehealth AI medical device news',
    ],
    categories: ['Telehealth', 'AI', 'Devices', 'FDA', 'Deals'],
  },
  logistics: {
    queries: [
      'site:freightwaves.com',
      'site:supplychaindive.com',
      'site:dcvelocity.com logistics',
      'supply chain logistics automation robotics news',
    ],
    categories: ['Shipping', 'Last-Mile', 'Automation', 'Supply Chain', 'Tech'],
  },
  neuroscience: {
    queries: [
      'site:neurosciencenews.com',
      'site:statnews.com brain neuroscience',
      'site:nature.com neuroscience',
      'neuroscience brain-computer interface BCI therapeutics news',
    ],
    categories: ['BCI', 'Research', 'FDA', 'Therapeutics', 'Devices'],
  },
  robotics: {
    queries: [
      'site:therobotreport.com',
      'site:roboticsandautomationnews.com',
      'site:automationworld.com robots',
      'robotics humanoid industrial automation startup news',
    ],
    categories: ['Industrial', 'Service', 'AI', 'Humanoid', 'Deals'],
  },
  spacetech: {
    queries: [
      'site:spacenews.com',
      'site:arstechnica.com space',
      'site:nasaspaceflight.com',
      'site:spacepolicyonline.com',
      'space technology satellite launch commercial news',
    ],
    categories: ['Launch', 'Satellites', 'Exploration', 'Commercial', 'Policy'],
  },
  agtech: {
    queries: [
      'site:agfundernews.com',
      'site:agweb.com technology',
      'site:precisionag.com',
      'agtech precision agriculture robotics startup news',
    ],
    categories: ['Precision', 'Biotech', 'Climate', 'Robotics', 'Deals'],
  },
  web3: {
    queries: [
      'site:theblock.co',
      'site:coindesk.com',
      'site:decrypt.co blockchain',
      'site:dlnews.com web3',
      'web3 blockchain DeFi regulation startup news',
    ],
    categories: ['DeFi', 'NFT', 'Layer2', 'Regulation', 'Deals'],
  },
};

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
  if (combined.includes('launch') || combined.includes('announces') || combined.includes('unveils')) return 'Launch';
  if (combined.includes('research') || combined.includes('study') || combined.includes('discovery')) return 'Research';

  return config.categories[0] || 'Industry';
}

// Determine impact level based on content signals
function getImpactLevel(title: string, summary: string): 'high' | 'medium' | 'low' {
  const text = (title + ' ' + summary).toLowerCase();
  const highSignals = ['billion', 'acquisition', 'merger', 'ipo', 'fda approval', 'breakthrough', 'banned', 'regulation', 'crisis', 'record'];
  const mediumSignals = ['million', 'partnership', 'launch', 'raises', 'new', 'first', 'major', 'expands'];
  
  if (highSignals.some(s => text.includes(s))) return 'high';
  if (mediumSignals.some(s => text.includes(s))) return 'medium';
  return 'low';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { marketId } = await req.json();

    if (!marketId) {
      return new Response(
        JSON.stringify({ success: false, error: 'marketId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = marketSearchConfig[marketId];
    if (!config) {
      return new Response(
        JSON.stringify({ success: false, error: `No search configuration for market: ${marketId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching news for market: ${marketId} (${config.queries.length} queries)`);

    const allResults: any[] = [];

    // Fetch from each configured source — increased limit per query
    for (const query of config.queries) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: 5,
            tbs: 'qdr:d',
            scrapeOptions: { formats: ['markdown', 'html'] },
          }),
        });

        const data = await response.json();
        if (response.ok && data.data) {
          allResults.push(...data.data);
        }
      } catch (e) {
        console.error(`Error fetching from ${query}:`, e);
      }
    }

    console.log(`Fetched ${allResults.length} raw results for ${marketId}`);

    // Deduplicate by URL
    const uniqueUrls = new Set<string>();
    const processedResults: any[] = [];

    for (const item of allResults) {
      if (item.url && !uniqueUrls.has(item.url)) {
        uniqueUrls.add(item.url);
        processedResults.push(item);
      }
    }

    // Transform to news items — increased from 10 to 15
    const newsItems: (NewsItem & { impact: string })[] = processedResults.slice(0, 15).map((item, index) => {
      let sourceName = 'News';
      try {
        const url = new URL(item.url);
        const hostname = url.hostname.replace('www.', '');
        sourceName = hostname.split('.')[0];
        sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
      } catch { /* keep default */ }

      const categoryTag = getCategoryFromContent(item.title || '', item.markdown || '', marketId);

      let summary = item.description || '';
      if (item.markdown && item.markdown.length > summary.length) {
        const paragraphs = item.markdown.split('\n').filter((p: string) => p.trim().length > 50);
        summary = paragraphs[0]?.substring(0, 250) || summary;
      }
      summary = summary.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').trim();
      if (summary.length > 200) {
        summary = summary.substring(0, 200) + '...';
      }

      // Extract image URL
      let imageUrl: string | null = null;
      if (item.metadata?.ogImage) {
        imageUrl = item.metadata.ogImage;
      } else if (item.metadata?.image) {
        imageUrl = item.metadata.image;
      } else if (item.metadata?.['og:image']) {
        imageUrl = item.metadata['og:image'];
      }

      if (!imageUrl && item.html) {
        const ogMatch = item.html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || item.html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogMatch?.[1]) imageUrl = ogMatch[1];
      }

      if (!imageUrl && item.html) {
        const twMatch = item.html.match(/<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
          || item.html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image["']/i);
        if (twMatch?.[1]) imageUrl = twMatch[1];
      }

      if (!imageUrl && item.markdown) {
        const imgMatch = item.markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
        if (imgMatch?.[1] && !imgMatch[1].match(/icon|logo|avatar|favicon|badge|sprite|pixel|1x1|tracking/i)) {
          imageUrl = imgMatch[1];
        }
      }

      const impact = getImpactLevel(item.title || '', summary);

      return {
        id: `news-${marketId}-${index}`,
        title: item.title || 'Industry News',
        sourceName,
        sourceUrl: item.url,
        publishedAt: 'Today',
        categoryTag,
        summary,
        marketId,
        imageUrl,
        impact,
      };
    });

    // Generate AI summaries if available
    if (lovableKey && newsItems.length > 0) {
      console.log('Generating AI summaries...');
      try {
        const marketName = marketId.charAt(0).toUpperCase() + marketId.slice(1);
        const summaryPrompt = `You are a ${marketName} industry analyst. For each headline, provide a 1-sentence insight (15-25 words) explaining why this matters for professionals or startups in this space.

Headlines:
${newsItems.map((n, i) => `${i + 1}. ${n.title}: ${n.summary}`).join('\n')}

Respond with a JSON array of insight strings only.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are an industry analyst. Respond only with valid JSON arrays.' },
              { role: 'user', content: summaryPrompt },
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              const insights = JSON.parse(jsonMatch[0]);
              newsItems.forEach((item, i) => {
                if (insights[i] && typeof insights[i] === 'string') {
                  item.summary = insights[i];
                }
              });
              console.log('AI summaries added successfully');
            } catch (parseError) {
              console.error('Error parsing AI response:', parseError);
            }
          }
        }
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError);
      }
    }

    console.log(`Processed ${newsItems.length} news items for ${marketId}`);

    // Persist to DB for caching
    if (newsItems.length > 0) {
      const dbRows = newsItems.map((item) => ({
        title: item.title,
        source_name: item.sourceName,
        source_url: item.sourceUrl,
        market_id: marketId,
        category_tag: item.categoryTag,
        summary: item.summary || null,
        image_url: item.imageUrl || null,
        published_at: new Date().toISOString(),
      }));

      await supabase.from('news_items').delete().eq('market_id', marketId);
      const { error: insertError } = await supabase.from('news_items').insert(dbRows);
      if (insertError) {
        console.error('Error persisting news to DB:', insertError);
      } else {
        console.log(`Persisted ${dbRows.length} news items to DB for ${marketId}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: newsItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch news';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
