const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for aerospace news...');

    // Search for recent aerospace industry news
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'aerospace aviation SpaceX Boeing Airbus defense industry news',
        limit: 10,
        tbs: 'qdr:d', // Last 24 hours
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Search successful, processing results...');

    // Transform results to news items format
    const newsItems = (data.data || []).map((item: any, index: number) => {
      // Extract source name from URL
      let sourceName = 'News';
      try {
        const url = new URL(item.url);
        sourceName = url.hostname.replace('www.', '').split('.')[0];
        sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
      } catch (e) {
        // Keep default
      }

      // Determine category based on title/content
      let categoryTag = 'Industry';
      const titleLower = (item.title || '').toLowerCase();
      if (titleLower.includes('spacex') || titleLower.includes('rocket') || titleLower.includes('launch') || titleLower.includes('satellite')) {
        categoryTag = 'Space';
      } else if (titleLower.includes('boeing') || titleLower.includes('airbus') || titleLower.includes('airline') || titleLower.includes('aircraft')) {
        categoryTag = 'Aviation';
      } else if (titleLower.includes('defense') || titleLower.includes('military') || titleLower.includes('pentagon')) {
        categoryTag = 'Defense';
      } else if (titleLower.includes('deal') || titleLower.includes('order') || titleLower.includes('billion') || titleLower.includes('contract')) {
        categoryTag = 'Deals';
      }

      return {
        id: `news-${index}`,
        title: item.title || 'Aerospace News',
        sourceName,
        sourceUrl: item.url,
        publishedAt: 'Today',
        categoryTag,
        summary: item.description || (item.markdown ? item.markdown.substring(0, 200) + '...' : ''),
      };
    });

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
