import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// All markets to generate
const ALL_MARKETS = [
  'aerospace', 'neuroscience', 'ai', 'fintech', 'biotech', 'ev', 
  'cybersecurity', 'cleanenergy', 'spacetech', 'healthtech', 
  'robotics', 'agtech', 'climatetech', 'logistics', 'web3'
];

// Day types pattern for each week
const WEEK_PATTERN = [
  "MICRO_LESSON", "DAILY_GAME", "MICRO_LESSON", "TRAINER",
  "BOOK_SNAPSHOT", "DAILY_GAME", "MICRO_LESSON"
];

// Learning goals — each gets its own curriculum variant
const LEARNING_GOALS = ['career', 'invest', 'startup', 'curiosity'] as const;

// Goal-specific prompt lenses
const GOAL_LENS: Record<string, { label: string; focus: string; slideGuidance: string }> = {
  career: {
    label: 'Career & Workforce',
    focus: 'preparing for job interviews, understanding hiring signals, building skills employers value, and navigating career paths in this industry',
    slideGuidance: `Every slide must help a job seeker. Include: terminology interviewers test, skills gaps employers notice, team structures, career ladders, and "what would impress a hiring manager" angles. Reference real job titles, salary benchmarks, and hiring trends.`,
  },
  invest: {
    label: 'Investor & Analyst',
    focus: 'evaluating investment opportunities, understanding valuation frameworks, reading financial signals, and building analyst-level market intuition',
    slideGuidance: `Every slide must serve an investor. Include: valuation multiples, unit economics, TAM/SAM analysis, comparable company frameworks, risk factors, and "what would a VC/analyst ask" angles. Reference real funding rounds, public market data, and deal structures.`,
  },
  startup: {
    label: 'Founder & Builder',
    focus: 'identifying startup opportunities, understanding business models, avoiding common founder mistakes, and building companies in this industry',
    slideGuidance: `Every slide must help a founder. Include: business model breakdowns, go-to-market strategies, unit economics, competitive moats, common pitfalls, and "what kills startups here" angles. Reference real startups, their pivots, fundraising journeys, and failure modes.`,
  },
  curiosity: {
    label: 'Curious Learner',
    focus: 'understanding the fascinating dynamics of this industry, building mental models, discovering surprising truths, and developing transferable knowledge',
    slideGuidance: `Every slide must captivate a curious mind. Include: counterintuitive insights, historical context, cross-industry parallels, "most people don't know" facts, and transferable mental models. Make complex topics accessible without dumbing them down.`,
  },
};

// Market-specific curriculum themes
const MARKET_THEMES: Record<string, string[]> = {
  aerospace: ["Foundations", "Commercial Aviation", "Defense & Government", "Space Economy", "Emerging Technologies", "Business & Strategy"],
  neuroscience: ["Brain Science Foundations", "Neurotechnology & Devices", "Mental Health Innovation", "Neurological Disease", "Cognitive Enhancement & AI", "Neuro Business & Ethics"],
  ai: ["AI Foundations", "Large Language Models", "AI Applications", "AI Infrastructure", "AI Safety & Governance", "AI Business Strategy"],
  fintech: ["Financial Services Foundations", "Payments & Transactions", "Lending & Credit", "Wealth & Investing", "Insurance & Risk", "Fintech Strategy & Scale"],
  biotech: ["Biotech Foundations", "Clinical Development", "Modality Deep Dives", "Commercial & Market Access", "Therapeutic Areas", "Biotech Strategy"],
  ev: ["EV Industry Foundations", "Battery Technology", "Charging Infrastructure", "Commercial & Fleet EVs", "Autonomy & Software", "EV Business Strategy"],
  cybersecurity: ["Security Foundations", "Endpoint & Cloud Security", "Identity & Data", "Security Operations", "Emerging Threats", "Cyber Business Strategy"],
  cleanenergy: ["Energy Foundations", "Solar Energy", "Wind & Offshore", "Energy Storage", "Hydrogen & Alternatives", "Clean Energy Business"],
  spacetech: ["Space Industry Foundations", "Launch Services", "Satellite Systems", "Space Applications", "Beyond Earth Orbit", "Space Business Strategy"],
  healthtech: ["Healthcare Foundations", "Digital Health", "Clinical Operations", "Healthcare AI", "Specialty Healthcare", "Healthtech Strategy"],
  robotics: ["Robotics Foundations", "Industrial Robotics", "Warehouse & Logistics", "Autonomous Vehicles", "Service & Specialty Robots", "Robotics Business Strategy"],
  agtech: ["Agriculture Foundations", "Precision Agriculture", "Agricultural Inputs", "Farm Automation", "Supply Chain & Markets", "Agtech Strategy"],
  climatetech: ["Climate Science & Policy", "Decarbonization Strategies", "Carbon Removal", "Industrial Decarbonization", "Carbon Markets", "Climate Business Strategy"],
  logistics: ["Logistics Foundations", "Freight & Trucking", "Last-Mile Delivery", "Supply Chain Visibility", "Warehouse Technology", "Logistics Strategy"],
  web3: ["Blockchain Foundations", "DeFi", "NFTs & Digital Assets", "Infrastructure", "Regulation & Compliance", "Web3 Strategy"],
};

// Topics per market (simplified - one per day pattern)
const MARKET_TOPICS: Record<string, string[][]> = {
  aerospace: [
    ["OEM structure", "Certification", "Contracts", "ITAR", "Supply chain"],
    ["Airbus vs Boeing", "Fleet economics", "MRO", "Leasing", "Financing"],
    ["Defense primes", "DoD procurement", "SBIR", "Classified", "Allies"],
    ["Launch economics", "Constellations", "Space stations", "NASA", "Debris"],
    ["eVTOL", "Autonomy", "SAF", "Hydrogen", "Materials"],
    ["M&A", "Sales cycles", "Talent", "Geopolitics", "VC"]
  ],
  neuroscience: [
    ["Neuroanatomy", "Neurotransmitters", "Brain imaging", "Plasticity", "BBB"],
    ["BCIs", "Neurostimulation", "Prosthetics", "Wearables", "FDA paths"],
    ["Digital therapeutics", "Psychedelics", "AI mental health", "Precision psych", "Telepsych"],
    ["Alzheimer's", "Parkinson's", "Epilepsy", "Gene therapy", "Rare disease"],
    ["Nootropics", "Brain AI", "Sleep", "Neurofeedback", "Memory"],
    ["Fundraising", "Clinical trials", "Ethics", "Payers", "Teams"]
  ],
  ai: [
    ["ML fundamentals", "Deep learning", "Training data", "Compute", "Benchmarks"],
    ["GPT architecture", "Training costs", "Fine-tuning", "Prompting", "Open source"],
    ["Enterprise AI", "Vertical AI", "Computer vision", "NLP", "Recommendations"],
    ["MLOps", "Vector DBs", "Edge AI", "Model serving", "Monitoring"],
    ["Alignment", "Regulation", "Bias", "Explainability", "Liability"],
    ["Valuation", "Build vs buy", "Talent", "Moats", "Investors"]
  ],
  fintech: [
    ["Banking system", "Payment rails", "Regulation", "Charters", "MTL"],
    ["Card networks", "POS", "Cross-border", "RTP", "BNPL"],
    ["Underwriting", "Embedded lending", "Mortgage tech", "SMB lending", "Collections"],
    ["Robo-advisory", "Brokerage", "Alternatives", "Retirement", "Tax"],
    ["Insurtech", "AI underwriting", "Claims", "Embedded", "Reinsurance"],
    ["Unit economics", "Bank partners", "Regtech", "International", "Exits"]
  ],
  biotech: [
    ["Drug discovery", "Preclinical", "FDA paths", "Manufacturing", "Financing"],
    ["Trial design", "CROs", "Recruitment", "Biomarkers", "Submissions"],
    ["Small molecules", "Biologics", "Cell therapy", "Gene therapy", "RNA"],
    ["Drug pricing", "Payers", "Specialty pharma", "Patient programs", "International"],
    ["Oncology", "Rare disease", "Autoimmune", "Infectious", "Cardiometabolic"],
    ["Platform vs asset", "Pharma deals", "M&A", "Portfolio", "Culture"]
  ],
  ev: [
    ["Market structure", "Battery basics", "Platforms", "Manufacturing", "Regulation"],
    ["Chemistry", "Pack engineering", "Gigafactories", "Recycling", "Materials"],
    ["Charging networks", "DC fast", "Home charging", "Grid", "Payments"],
    ["Commercial trucks", "Last-mile", "Buses", "Fleet software", "TCO"],
    ["ADAS", "Sensors", "Software platforms", "Infotainment", "V2X"],
    ["SPAC history", "OEM partnerships", "Used EVs", "Incentives", "Investors"]
  ],
  cybersecurity: [
    ["Threat landscape", "Attack surfaces", "Frameworks", "IAM", "Zero trust"],
    ["EDR", "CSPM", "Container security", "Workload protection", "DevSecOps"],
    ["Identity providers", "PAM", "DLP", "Encryption", "Privacy tech"],
    ["SIEM/SOAR", "Threat intel", "Incident response", "MDR", "Metrics"],
    ["AI attacks", "Supply chain", "OT/ICS", "API security", "Post-quantum"],
    ["Enterprise sales", "Channels", "Compliance selling", "Platform strategy", "M&A"]
  ],
  cleanenergy: [
    ["Grid architecture", "LCOE", "PPAs", "Utility regulation", "Policy"],
    ["Solar tech", "Utility solar", "Residential", "Manufacturing", "Efficiency"],
    ["Onshore wind", "Offshore wind", "Turbines", "O&M", "Floating"],
    ["Battery storage", "Technology landscape", "Grid services", "BTM", "Long duration"],
    ["Green hydrogen", "Electrolyzers", "H2 storage", "Fuel cells", "Nuclear"],
    ["Project finance", "Corporate PPAs", "IPPs", "Grid modernization", "ESG"]
  ],
  spacetech: [
    ["Industry structure", "Orbital mechanics", "Launch economics", "Agencies", "Regulation"],
    ["SpaceX", "Small launch", "Heavy launch", "Manifest", "Reusability"],
    ["Satellite design", "Constellations", "Earth observation", "Comms", "Navigation"],
    ["Satellite internet", "Geospatial", "Maritime/aviation", "Weather", "Defense"],
    ["Lunar economy", "Space stations", "Tourism", "Manufacturing", "Mars"],
    ["Financing", "Government contracts", "Insurance", "Debris", "Investors"]
  ],
  healthtech: [
    ["Healthcare system", "Financing", "HIPAA", "EHRs", "Interoperability"],
    ["Telehealth", "RPM", "DTx", "Engagement", "Behavioral"],
    ["Workflow automation", "RCM", "Scheduling", "CDS", "Prior auth"],
    ["Clinical AI", "Imaging AI", "NLP", "Predictive", "FDA AI"],
    ["Oncology", "Value-based", "Chronic disease", "Women's health", "Senior care"],
    ["Sales cycles", "Health system deals", "Payers", "Evidence", "M&A"]
  ],
  robotics: [
    ["Robot taxonomy", "Components", "ROS", "Safety standards", "Supply chain"],
    ["Industrial leaders", "Welding/assembly", "Cobots", "Integration", "ROI"],
    ["Warehouse automation", "AMRs", "Picking", "Sortation", "WMS"],
    ["AV stack", "Perception", "Planning", "Trucking", "Regulation"],
    ["Surgical", "Agricultural", "Construction", "Cleaning", "Humanoid"],
    ["RaaS", "Deployment", "Hardware margins", "M&A", "Investors"]
  ],
  agtech: [
    ["Value chain", "Farm economics", "Land ownership", "Commodities", "Policy"],
    ["GPS guidance", "Variable rate", "Yield monitoring", "Soil sensing", "Remote sensing"],
    ["Seeds/genetics", "Biologicals", "Fertilizer tech", "Crop protection", "Digital agronomy"],
    ["Autonomous tractors", "Robotic harvesting", "Drones", "Livestock tech", "Indoor farming"],
    ["Grain marketing", "Traceability", "Farm software", "Ag lending", "Carbon"],
    ["Farmer adoption", "Retailer partnerships", "Seasonality", "M&A", "Investors"]
  ],
  climatetech: [
    ["Climate science", "Emissions sources", "Paris Agreement", "Carbon pricing", "Disclosure"],
    ["Corporate net-zero", "Scope 1-3", "Carbon accounting", "RE procurement", "Efficiency"],
    ["DAC", "BECCS", "Ocean CDR", "Weathering", "Nature-based"],
    ["Steel", "Cement", "Chemicals", "Shipping/aviation", "Industrial heat"],
    ["Voluntary markets", "Verification", "Compliance markets", "Quality", "Trading"],
    ["Financing", "Incentives", "Corporate procurement", "Adaptation", "Investors"]
  ],
  logistics: [
    ["Supply chain structure", "Transport modes", "Freight brokerage", "Warehousing", "Customs"],
    ["Trucking structure", "Digital freight", "Capacity", "Drivers", "Fleet management"],
    ["E-commerce fulfillment", "Last-mile economics", "Parcel carriers", "Micro-fulfillment", "Speed"],
    ["Visibility platforms", "IoT tracking", "Demand forecasting", "Inventory", "Risk"],
    ["WMS", "Warehouse robotics", "Inventory management", "Pick/pack", "Returns"],
    ["Sales", "Shipper vs carrier", "Marketplaces", "M&A", "Investors"]
  ],
  web3: [
    ["Blockchain architecture", "Bitcoin", "Ethereum", "L1 vs L2", "Wallets"],
    ["DEXs", "Lending protocols", "Stablecoins", "Yield farming", "Risk"],
    ["NFT standards", "Art/collectibles", "Gaming", "Music/media", "Enterprise"],
    ["Oracles", "Bridges", "Indexing", "Node infra", "Identity"],
    ["SEC", "AML/KYC", "Stablecoin regulation", "DAOs", "Tax"],
    ["Token economics", "Community", "Fundraising", "Market cycles", "Investors"]
  ]
};

function getMarketContext(marketId: string): string {
  const contexts: Record<string, string> = {
    aerospace: "aerospace, aviation, defense, and space industries",
    neuroscience: "neuroscience, neurotech, mental health, and brain science",
    ai: "artificial intelligence, machine learning, and AI infrastructure",
    fintech: "financial technology, payments, lending, and banking",
    biotech: "biotechnology, drug development, and life sciences",
    ev: "electric vehicles, batteries, and mobility",
    cybersecurity: "cybersecurity, enterprise security, and privacy",
    cleanenergy: "clean energy, renewables, and grid infrastructure",
    spacetech: "space technology, satellites, and launch services",
    healthtech: "healthcare technology, digital health, and medical devices",
    robotics: "robotics, automation, and autonomous systems",
    agtech: "agricultural technology, precision agriculture, and food systems",
    climatetech: "climate technology, carbon removal, and decarbonization",
    logistics: "logistics, supply chain, and freight technology",
    web3: "blockchain, cryptocurrency, DeFi, and decentralized systems",
  };
  return contexts[marketId] || `${marketId} industry`;
}

function getTopic(day: number, marketId: string): string {
  const monthIndex = Math.ceil(day / 30) - 1;
  const topics = MARKET_TOPICS[marketId]?.[monthIndex];
  if (!topics) return "Industry fundamentals";
  const dayInMonth = ((day - 1) % 30) + 1;
  const topicIndex = Math.floor((dayInMonth - 1) / 6) % topics.length;
  return topics[topicIndex];
}

function getTheme(day: number, marketId: string): string {
  const monthIndex = Math.ceil(day / 30) - 1;
  return MARKET_THEMES[marketId]?.[monthIndex] || "Foundations";
}

interface GenerationJob {
  id: string;
  market_id: string;
  status: string;
  days_completed: number;
  days_failed: number;
  current_day: number | null;
  error_log: any[];
}

async function generateDayContent(
  apiKey: string,
  day: number,
  marketId: string,
  goal: string = 'curiosity'
): Promise<any> {
  const month = Math.ceil(day / 30);
  const theme = getTheme(day, marketId);
  const topic = getTopic(day, marketId);
  const dayType = WEEK_PATTERN[(day - 1) % 7];
  const marketContext = getMarketContext(marketId);

  const isTrainer = dayType === 'TRAINER';

  // Goal-aware lens instructions baked into every prompt
  const goalLensInstruction = `
CRITICAL: Your content must serve FOUR types of learners simultaneously. Each stack should naturally weave in perspectives relevant to all goals:
- CAREER SEEKERS: What skills, terminology, and dynamics do you need to land a job in this sector?
- INVESTORS/ANALYSTS: What metrics, valuations, and market signals matter for investment decisions?
- FOUNDERS/BUILDERS: What startup opportunities exist, what are the unit economics, and what mistakes kill companies?
- CURIOUS LEARNERS: What makes this fascinating, what are the surprising truths, and what mental models transfer?

Structure your 6 slides to cover multiple lenses:
1. Core concept (universal)
2. How it works in practice (universal)
3. Real example with numbers (universal)
4. Career & Investor angle — hiring signals, valuation implications, or analyst frameworks
5. Founder angle — startup opportunities, common founder mistakes, or business model insights
6. Actionable takeaway — what to do next regardless of goal`;
  
  const systemPrompt = isTrainer
    ? `You are a senior ${marketContext} industry strategist with 25+ years of experience. Create challenging decision scenarios that build real industry judgment.
       Your audience includes career changers preparing for interviews, investors evaluating deals, founders building companies, and curious learners seeking mastery.
       Each scenario should test judgment applicable across all four perspectives.`
    : `You are a senior ${marketContext} analyst creating educational content for industry mastery. Reference REAL companies, deals, and dynamics. Each slide body MUST be UNDER 280 characters. Month ${month} theme: ${theme}. Style: Professional, insight-dense, no fluff.
       ${goalLensInstruction}`;

  const typePrompts: Record<string, string> = {
    DAILY_GAME: `Create a NEWS stack about a real development in ${marketContext} related to "${topic}". Include real companies, dollar amounts, and dates. Structure: 6 slides, each body under 280 chars. Include source citations.
      Slide 4 should highlight what this means for job seekers or investors. Slide 5 should highlight the startup opportunity or founder lesson.`,
    MICRO_LESSON: `Create a LESSON teaching "${topic}" in ${marketContext}. Use real examples, numbers, and common mistakes. Structure: 6 slides, each body under 280 chars.
      Slide 4: "Career & Investor Lens" — interview-ready insight or valuation implication. Slide 5: "Founder Lens" — startup angle or business model insight.`,
    TRAINER: `Create a decision SCENARIO about "${topic}" in ${marketContext}. 400-600 char scenario, 4 options (one correct), expert feedback including pro_reasoning, common_mistake, and mental_model.
      The scenario should be relevant whether the learner is an aspiring employee, investor, founder, or researcher. Feedback should reference how each perspective would approach it.`,
    BOOK_SNAPSHOT: `Create a HISTORY stack about a pivotal event related to "${topic}" in ${marketContext}. Include real dates, actors, and lessons. Structure: 6 slides, each body under 280 chars.
      Slide 4: What career professionals learned. Slide 5: What founders/investors learned from this event.`,
  };

  const userPrompt = isTrainer
    ? `${typePrompts[dayType]}
       Return JSON: {
         "scenario": "400-600 char scenario relevant to career seekers, investors, AND founders",
         "question": "Clear decision question",
         "options": [{"label": "Option (40-80 chars)", "isCorrect": boolean}],
         "feedback_pro_reasoning": "300-500 chars — include how a career professional, investor, AND founder would each evaluate this",
         "feedback_common_mistake": "100-150 chars",
         "feedback_mental_model": "50-100 chars — a transferable framework",
         "follow_up_question": "Reflection question applicable to any learning goal",
         "sources": [{"label": "Source", "url": "https://..."}],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}"]
       }`
    : `${typePrompts[dayType]}
       Return JSON: {
         "title": "Stack title (max 6 words)",
         "slides": [{"slide_number": 1, "title": "6 words max", "body": "Under 280 chars", "sources": []}],
         "tags": ["${topic.split(' ')[0].toLowerCase()}", "month-${month}"]
       }
       Create exactly 6 slides. Slide 4 MUST have a career/investor angle. Slide 5 MUST have a founder/builder angle.`;

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
    throw new Error(`AI error: ${response.status}`);
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content');
  
  return { ...JSON.parse(content), dayType, day, month };
}

async function saveContent(supabase: any, content: any, marketId: string) {
  const { day, month, dayType } = content;
  const baseTags = [dayType, `day-${day}`, `month-${month}`, 'MICRO_LESSON'];

  // Save trainer scenario if applicable
  if (dayType === 'TRAINER' && content.options) {
    const correctIndex = content.options.findIndex((o: any) => o.isCorrect) ?? 1;
    await supabase.from('trainer_scenarios').insert({
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

  if (stackError) throw stackError;

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

async function processMarket(
  supabase: any,
  apiKey: string,
  job: GenerationJob,
  missingDays: number[]
) {
  console.log(`Starting ${job.market_id}: ${missingDays.length} days to generate`);
  
  await supabase.from('curriculum_generation_jobs').update({
    status: 'running',
    started_at: new Date().toISOString(),
  }).eq('id', job.id);

  let completed = 0;
  let failed = 0;
  const errors: any[] = [];

  for (const day of missingDays) {
    try {
      // Update current day
      await supabase.from('curriculum_generation_jobs').update({
        current_day: day,
        days_completed: completed,
        days_failed: failed,
      }).eq('id', job.id);

      console.log(`Generating ${job.market_id} day ${day}...`);
      
      const content = await generateDayContent(apiKey, day, job.market_id);
      await saveContent(supabase, content, job.market_id);
      
      completed++;
      console.log(`✓ ${job.market_id} day ${day} complete (${completed}/${missingDays.length})`);
      
      // Rate limit: 500ms between calls
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      failed++;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ day, error: errMsg, timestamp: new Date().toISOString() });
      console.error(`✗ ${job.market_id} day ${day} failed: ${errMsg}`);
      
      // Continue despite errors
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Mark complete
  await supabase.from('curriculum_generation_jobs').update({
    status: failed === missingDays.length ? 'failed' : 'completed',
    days_completed: completed,
    days_failed: failed,
    error_log: errors,
    completed_at: new Date().toISOString(),
  }).eq('id', job.id);

  console.log(`Finished ${job.market_id}: ${completed} generated, ${failed} failed`);
}

async function runBulkGeneration(supabase: any, apiKey: string, markets: string[]) {
  console.log(`=== BULK GENERATION STARTED ===`);
  console.log(`Markets: ${markets.join(', ')}`);
  
  for (const marketId of markets) {
    // Check existing days
    const { data: existingStacks } = await supabase
      .from('stacks')
      .select('tags')
      .eq('market_id', marketId)
      .contains('tags', ['MICRO_LESSON']);

    const existingDays = new Set<number>();
    existingStacks?.forEach((stack: any) => {
      const dayTag = (stack.tags as string[])?.find(t => t.startsWith('day-'));
      if (dayTag) existingDays.add(parseInt(dayTag.replace('day-', '')));
    });

    const allDays = Array.from({ length: 180 }, (_, i) => i + 1);
    const missingDays = allDays.filter(d => !existingDays.has(d));

    if (missingDays.length === 0) {
      console.log(`${marketId}: Already complete (180/180 days)`);
      continue;
    }

    // Create or update job
    const { data: existingJob } = await supabase
      .from('curriculum_generation_jobs')
      .select('*')
      .eq('market_id', marketId)
      .single();

    let job: GenerationJob;
    
    if (existingJob) {
      const { data } = await supabase
        .from('curriculum_generation_jobs')
        .update({
          status: 'pending',
          days_target: 180,
          days_completed: 180 - missingDays.length,
          days_failed: 0,
          error_log: [],
        })
        .eq('id', existingJob.id)
        .select()
        .single();
      job = data;
    } else {
      const { data } = await supabase
        .from('curriculum_generation_jobs')
        .insert({
          market_id: marketId,
          status: 'pending',
          days_target: 180,
          days_completed: 180 - missingDays.length,
        })
        .select()
        .single();
      job = data;
    }

    // Process this market
    await processMarket(supabase, apiKey, job, missingDays);
  }

  console.log(`=== BULK GENERATION COMPLETE ===`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { action = 'status', markets = ALL_MARKETS } = body;

    // GET STATUS
    if (action === 'status') {
      const { data: jobs } = await supabase
        .from('curriculum_generation_jobs')
        .select('*')
        .order('market_id');

      const marketProgress: Record<string, any> = {};
      
      for (const marketId of ALL_MARKETS) {
        const { data: stacks } = await supabase
          .from('stacks')
          .select('tags')
          .eq('market_id', marketId)
          .contains('tags', ['MICRO_LESSON']);

        const existingDays = new Set<number>();
        stacks?.forEach((s: any) => {
          const dayTag = (s.tags as string[])?.find(t => t.startsWith('day-'));
          if (dayTag) existingDays.add(parseInt(dayTag.replace('day-', '')));
        });

        const job = jobs?.find(j => j.market_id === marketId);
        
        marketProgress[marketId] = {
          existing: existingDays.size,
          missing: 180 - existingDays.size,
          percentComplete: Math.round((existingDays.size / 180) * 100),
          jobStatus: job?.status || 'not_started',
          currentDay: job?.current_day,
          errors: job?.days_failed || 0,
        };
      }

      const totalExisting = Object.values(marketProgress).reduce((sum: number, m: any) => sum + m.existing, 0);
      const totalDays = ALL_MARKETS.length * 180;

      return new Response(JSON.stringify({
        totalProgress: `${totalExisting}/${totalDays} (${Math.round((totalExisting/totalDays)*100)}%)`,
        markets: marketProgress,
        jobs,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // START GENERATION
    if (action === 'start') {
      console.log('Starting bulk generation in background...');
      
      // Start generation (runs synchronously in edge function context)
      runBulkGeneration(supabase, apiKey, markets).catch(console.error);

      return new Response(JSON.stringify({
        message: 'Bulk generation started in background',
        markets,
        note: 'Check status endpoint for progress',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'Unknown action',
      validActions: ['status', 'start'],
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bulk generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
