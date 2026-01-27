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
  rawContent?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching aerospace news from premium sources...');

    // Search specifically from Aviation Week, SpaceNews, and FlightGlobal
    const searchQueries = [
      'site:aviationweek.com aerospace news',
      'site:spacenews.com space industry',
      'site:flightglobal.com aviation news',
    ];

    const allResults: any[] = [];

    // Fetch from each source
    for (const query of searchQueries) {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: 4,
            tbs: 'qdr:d', // Last 24 hours
            scrapeOptions: {
              formats: ['markdown'],
            },
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

    console.log(`Fetched ${allResults.length} raw results`);

    // Process and deduplicate results
    const uniqueUrls = new Set<string>();
    const processedResults: any[] = [];

    for (const item of allResults) {
      if (!uniqueUrls.has(item.url)) {
        uniqueUrls.add(item.url);
        processedResults.push(item);
      }
    }

    // Transform results to news items
    const newsItems: NewsItem[] = processedResults.slice(0, 10).map((item: any, index: number) => {
      // Extract source name from URL
      let sourceName = 'News';
      try {
        const url = new URL(item.url);
        const hostname = url.hostname.replace('www.', '');
        if (hostname.includes('aviationweek')) {
          sourceName = 'Aviation Week';
        } else if (hostname.includes('spacenews')) {
          sourceName = 'SpaceNews';
        } else if (hostname.includes('flightglobal')) {
          sourceName = 'FlightGlobal';
        } else {
          sourceName = hostname.split('.')[0];
          sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
        }
      } catch (e) {
        // Keep default
      }

      // Determine category based on title/content
      let categoryTag = 'Industry';
      const titleLower = (item.title || '').toLowerCase();
      const contentLower = (item.markdown || item.description || '').toLowerCase();
      const combined = titleLower + ' ' + contentLower;
      
      if (combined.includes('spacex') || combined.includes('rocket') || combined.includes('launch') || 
          combined.includes('satellite') || combined.includes('orbit') || combined.includes('nasa')) {
        categoryTag = 'Space';
      } else if (combined.includes('boeing') || combined.includes('airbus') || combined.includes('airline') || 
                 combined.includes('aircraft') || combined.includes('flight')) {
        categoryTag = 'Aviation';
      } else if (combined.includes('defense') || combined.includes('military') || combined.includes('pentagon') ||
                 combined.includes('lockheed') || combined.includes('northrop')) {
        categoryTag = 'Defense';
      } else if (combined.includes('deal') || combined.includes('order') || combined.includes('billion') || 
                 combined.includes('contract') || combined.includes('acquisition')) {
        categoryTag = 'Deals';
      } else if (combined.includes('evtol') || combined.includes('aam') || combined.includes('urban air') ||
                 combined.includes('saf') || combined.includes('hydrogen')) {
        categoryTag = 'Innovation';
      }

      // Create a brief summary from content
      let summary = item.description || '';
      if (item.markdown && item.markdown.length > summary.length) {
        // Extract first meaningful paragraph
        const paragraphs = item.markdown.split('\n').filter((p: string) => p.trim().length > 50);
        summary = paragraphs[0]?.substring(0, 250) || summary;
      }
      
      // Clean up summary
      summary = summary.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').trim();
      if (summary.length > 200) {
        summary = summary.substring(0, 200) + '...';
      }

      return {
        id: `news-${index}`,
        title: item.title || 'Aerospace News',
        sourceName,
        sourceUrl: item.url,
        publishedAt: 'Today',
        categoryTag,
        summary,
        rawContent: item.markdown?.substring(0, 500) || '',
      };
    });

    // Generate AI summaries if Lovable AI is available
    if (lovableKey && newsItems.length > 0) {
      console.log('Generating AI summaries...');
      
      try {
        const summaryPrompt = `You are an aerospace industry analyst. For each news headline below, provide a 1-sentence insight explaining why this matters for aerospace professionals or startups. Be specific and actionable.

Headlines:
${newsItems.map((n, i) => `${i + 1}. ${n.title} (${n.categoryTag}): ${n.summary}`).join('\n')}

Respond with a JSON array of insights, one per headline. Each insight should be 15-25 words.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are an aerospace industry analyst. Respond only with valid JSON arrays.' },
              { role: 'user', content: summaryPrompt },
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          // Try to parse the JSON from the response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              const insights = JSON.parse(jsonMatch[0]);
              // Add insights to news items
              newsItems.forEach((item, i) => {
                if (insights[i]) {
                  item.summary = typeof insights[i] === 'string' 
                    ? insights[i] 
                    : insights[i].insight || insights[i].summary || item.summary;
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
        // Continue with original summaries
      }
    }

    console.log(`Processed ${newsItems.length} news items`);

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
