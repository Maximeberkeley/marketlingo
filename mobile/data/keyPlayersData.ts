// Key Players data for mobile app - mirrors web app keyPlayersData.ts

export interface CompanySlide {
  title: string;
  content: string;
  highlight?: string;
  type?: 'insight' | 'competitive' | 'investment';
}

export interface Company {
  id: string;
  name: string;
  ticker?: string;
  logo: string;
  logoUrl?: string;
  description: string;
  ceo: string;
  founded: string;
  headquarters: string;
  employees: string;
  marketCap?: string;
  keyProducts: string[];
  recentNews?: string;
  segment: string;
  industryRole: string;
  slides: CompanySlide[];
  keyStats?: { label: string; value: string }[];
  competitors?: string[];
}

export interface MarketCompanies {
  [marketId: string]: Company[];
}

const getLogoUrl = (domain: string) =>
  `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`;

export const marketCompanies: MarketCompanies = {
  aerospace: [
    {
      id: 'boeing', name: 'Boeing', ticker: 'BA', logo: '✈️',
      logoUrl: getLogoUrl('boeing.com'), segment: 'commercial',
      description: "The world's largest aerospace company and leading manufacturer of commercial jetliners, defense, space and security systems.",
      industryRole: 'Boeing is one of two major commercial aircraft manufacturers globally (duopoly with Airbus). They define industry standards for wide-body aircraft.',
      ceo: 'Kelly Ortberg', founded: '1916', headquarters: 'Arlington, Virginia', employees: '170,000+', marketCap: '$120B+',
      keyProducts: ['737 MAX', '787 Dreamliner', '777X', 'Defense & Space'],
      slides: [
        { title: 'Industry Giant', content: 'Boeing commands ~40% of the global commercial aircraft market, delivering 500+ aircraft annually. Their backlog exceeds $500B.', highlight: '$500B+ backlog', type: 'insight' },
        { title: 'Vertical Integration', content: 'Unlike Airbus, Boeing owns more of its supply chain. This gives control but also concentration risk.', highlight: 'Vertically integrated', type: 'insight' },
        { title: 'Defense Pillar', content: "Boeing's defense segment generates ~40% of revenue. Key programs: F-15EX and KC-46 tanker.", highlight: '40% defense revenue', type: 'insight' },
        { title: 'Competitive Position', content: 'Boeing trails Airbus in orders but dominates wide-body with 787/777. Quality issues have eroded trust.', highlight: 'Wide-body leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Turnaround play with new CEO. Massive backlog provides visibility. Key risks: quality execution, MAX reputation.', highlight: 'Turnaround story', type: 'investment' },
      ],
      keyStats: [{ label: 'Aircraft Delivered', value: '528' }, { label: 'Order Backlog', value: '5,600+' }, { label: 'Revenue', value: '$77.8B' }],
    },
    {
      id: 'airbus', name: 'Airbus', ticker: 'AIR.PA', logo: '🌐',
      logoUrl: getLogoUrl('airbus.com'), segment: 'commercial',
      description: 'European multinational aerospace corporation and one of the largest aircraft manufacturers.',
      industryRole: "Airbus is Boeing's only true competitor in large commercial aircraft. They've captured market share through the A320neo family.",
      ceo: 'Guillaume Faury', founded: '1970', headquarters: 'Leiden, Netherlands', employees: '130,000+', marketCap: '$150B+',
      keyProducts: ['A320neo', 'A350', 'A380', 'Helicopters'],
      slides: [
        { title: 'Market Leader', content: 'Airbus delivered 735 aircraft in 2023, outselling Boeing. A320neo dominates single-aisle with 60%+ market share.', highlight: '735 deliveries in 2023', type: 'insight' },
        { title: 'Innovation Focus', content: 'Leading the ZEROe hydrogen aircraft initiative, targeting zero-emission commercial flight by 2035.', highlight: 'Hydrogen by 2035', type: 'insight' },
        { title: 'Helicopter Dominance', content: 'Airbus Helicopters is the largest civil helicopter manufacturer with 50%+ market share.', highlight: '#1 in helicopters', type: 'insight' },
        { title: 'Competitive Position', content: 'Winning the single-aisle war with A320neo. Risks: supply chain constraints, engine availability.', highlight: 'Single-aisle winner', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Premium aerospace franchise with pricing power. Decade of deliveries locked in. Best pure-play on aviation recovery.', highlight: 'Quality compounder', type: 'investment' },
      ],
      keyStats: [{ label: 'Aircraft Delivered', value: '735' }, { label: 'Order Backlog', value: '8,600+' }, { label: 'Revenue', value: '€65.4B' }],
    },
    {
      id: 'lockheed', name: 'Lockheed Martin', ticker: 'LMT', logo: '🛡️',
      logoUrl: getLogoUrl('lockheedmartin.com'), segment: 'defense',
      description: 'Global security and aerospace company focused on defense, space, and advanced technology systems.',
      industryRole: "The world's largest defense contractor. Lockheed sets the standard for 5th-generation fighters.",
      ceo: 'Jim Taiclet', founded: '1995 (merger)', headquarters: 'Bethesda, Maryland', employees: '116,000+', marketCap: '$140B+',
      keyProducts: ['F-35 Lightning II', 'C-130 Hercules', 'Missiles & Fire Control', 'Sikorsky Helicopters'],
      slides: [
        { title: 'Defense Titan', content: 'Lockheed receives more U.S. defense dollars than any other company—$75B+ annually. The F-35 alone is a $1.7 trillion lifetime program.', highlight: '$1.7T F-35 program', type: 'insight' },
        { title: 'F-35 Dominance', content: 'The F-35 is the backbone of Western air power, with 900+ delivered to 18 nations.', highlight: '900+ F-35s delivered', type: 'insight' },
        { title: 'Space Systems', content: 'Lockheed builds GPS satellites, missile warning systems, and the Orion spacecraft for NASA.', highlight: 'Artemis partner', type: 'insight' },
        { title: 'Competitive Position', content: 'Unassailable in 5th-gen fighters. F-35 lock-in creates 50+ year revenue stream.', highlight: 'Fighter monopoly', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Defense budget tailwinds for decade. F-35 annuity business. 3% dividend yield. Sleep-well-at-night defense.', highlight: 'Defense bond', type: 'investment' },
      ],
      keyStats: [{ label: 'Revenue (2023)', value: '$67.6B' }, { label: 'Backlog', value: '$160B+' }, { label: 'F-35 Delivered', value: '950+' }],
    },
    {
      id: 'northrop', name: 'Northrop Grumman', ticker: 'NOC', logo: '🦅',
      logoUrl: getLogoUrl('northropgrumman.com'), segment: 'defense',
      description: 'Global aerospace and defense technology company known for stealth aircraft and space systems.',
      industryRole: 'Northrop is the stealth technology leader, building America\'s most advanced bombers.',
      ceo: 'Kathy Warden', founded: '1994 (merger)', headquarters: 'Falls Church, Virginia', employees: '95,000+', marketCap: '$80B+',
      keyProducts: ['B-21 Raider', 'James Webb Telescope', 'Global Hawk', 'Sentinel ICBM'],
      slides: [
        { title: 'Stealth Pioneer', content: 'Northrop built the B-2 Spirit and now the B-21 Raider—the most advanced stealth bombers. Only they have this capability.', highlight: 'Only B-21 maker', type: 'insight' },
        { title: 'Nuclear Triad', content: 'Building the Sentinel ICBM to replace Minuteman III, a $100B+ program for U.S. nuclear deterrence.', highlight: '$100B Sentinel', type: 'insight' },
        { title: 'Space Excellence', content: 'Built the James Webb Space Telescope and key national security satellites.', highlight: 'James Webb builder', type: 'insight' },
        { title: 'Competitive Position', content: 'Sole-source on B-21 and Sentinel—crown jewels. Moat in stealth unmatched.', highlight: 'Stealth monopoly', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Highest-quality defense franchise. B-21 and Sentinel provide 30+ year visibility. Premium valuation deserved.', highlight: 'Premium defense', type: 'investment' },
      ],
      keyStats: [{ label: 'Revenue (2023)', value: '$39.3B' }, { label: 'Backlog', value: '$84B+' }, { label: 'Employees', value: '95,000' }],
    },
    {
      id: 'spacex', name: 'SpaceX', logo: '🚀',
      logoUrl: getLogoUrl('spacex.com'), segment: 'space',
      description: 'Private space transportation company revolutionizing access to space with reusable rockets.',
      industryRole: "SpaceX has disrupted the launch industry by making rockets reusable, cutting costs by 10x and capturing 60%+ of global commercial launches.",
      ceo: 'Elon Musk', founded: '2002', headquarters: 'Hawthorne, California', employees: '13,000+', marketCap: '$180B+ (private)',
      keyProducts: ['Falcon 9', 'Falcon Heavy', 'Starship', 'Starlink', 'Dragon'],
      slides: [
        { title: 'Launch Monopoly', content: 'SpaceX controls 60%+ of global commercial launches. Falcon 9 has flown 200+ times with >95% success rate.', highlight: '60%+ market share', type: 'insight' },
        { title: 'Starlink Revenue Engine', content: 'Starlink has 2M+ subscribers generating billions in recurring revenue, funding Starship development.', highlight: '2M+ subscribers', type: 'insight' },
        { title: 'Starship Ambition', content: 'The fully reusable Starship aims to reduce launch costs to $10/kg from $2,700/kg. A 270x improvement.', highlight: '270x cheaper', type: 'insight' },
        { title: 'Competitive Position', content: 'No commercial competitor can match Falcon 9 cost. Blue Origin years behind. ULA dependent on government.', highlight: 'Competitive moat', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Private. Key secondary market investment. Starlink IPO potential. Starship changes everything if successful.', highlight: 'Private opportunity', type: 'investment' },
      ],
      keyStats: [{ label: 'Launches (2023)', value: '96' }, { label: 'Starlink Users', value: '2M+' }, { label: 'Valuation', value: '$180B+' }],
    },
    {
      id: 'raytheon', name: 'RTX (Raytheon)', ticker: 'RTX', logo: '🎯',
      logoUrl: getLogoUrl('rtx.com'), segment: 'defense',
      description: 'Aerospace and defense conglomerate formed from Raytheon and United Technologies merger.',
      industryRole: 'RTX is the missiles and sensors powerhouse. Precision-guided weapons and advanced radar.',
      ceo: 'Chris Calio', founded: '2020 (merger)', headquarters: 'Arlington, Virginia', employees: '180,000+', marketCap: '$150B+',
      keyProducts: ['Patriot Missiles', 'Stinger', 'Pratt & Whitney Engines', 'Collins Aerospace'],
      slides: [
        { title: 'Merged Giant', content: '2020 merger of Raytheon (missiles) and United Technologies (Pratt engines, Collins avionics) created a $70B+ revenue powerhouse.', highlight: '$70B+ revenue', type: 'insight' },
        { title: 'Missile Monopoly', content: 'Raytheon makes Patriot, Stinger, Tomahawk, and AMRAAM missiles. Ukraine conflict depleted inventories.', highlight: 'Ukraine surge', type: 'insight' },
        { title: 'Engine Empire', content: 'Pratt & Whitney powers 25% of commercial aircraft and 100% of F-35s.', highlight: '25% of aircraft', type: 'insight' },
        { title: 'Competitive Position', content: 'Only Lockheed competes broadly. Pratt duopoly with GE. Collins near-monopoly on avionics.', highlight: 'Diversified leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Best balance of defense + commercial. Ukraine restocking drives missiles. Dividend aristocrat. Core holding.', highlight: 'Balanced exposure', type: 'investment' },
      ],
      keyStats: [{ label: 'Revenue (2023)', value: '$68.9B' }, { label: 'Backlog', value: '$196B' }, { label: 'Employees', value: '180,000' }],
    },
    {
      id: 'ge', name: 'GE Aerospace', ticker: 'GE', logo: '⚙️',
      logoUrl: getLogoUrl('geaerospace.com'), segment: 'propulsion',
      description: 'Leading manufacturer of jet engines and propulsion systems for commercial and military aircraft.',
      industryRole: 'GE Aerospace powers roughly half of the world\'s commercial aircraft. Their LEAP and GE9X engines are industry benchmarks.',
      ceo: 'Larry Culp', founded: '1917', headquarters: 'Evendale, Ohio', employees: '40,000+', marketCap: '$200B+',
      keyProducts: ['LEAP Engine', 'GE9X', 'GE90', 'Military Engines'],
      slides: [
        { title: 'Engine Duopoly', content: 'GE and Pratt & Whitney dominate commercial engines. Together they power 90%+ of the global fleet.', highlight: 'Engine duopoly', type: 'insight' },
        { title: 'LEAP Success', content: 'LEAP engine powers the A320neo and 737 MAX. 30,000+ orders make it the most sold engine family ever.', highlight: '30,000+ LEAP orders', type: 'insight' },
        { title: 'Services Gold Mine', content: 'Engine maintenance and services generate 70%+ of GE Aerospace revenue with recurring, high-margin streams.', highlight: '70% services', type: 'insight' },
        { title: 'Competitive Position', content: 'Duopoly with Pratt means pricing power. Military engine dominance (F110, T700) provides diversification.', highlight: 'Pricing power', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Pure-play aerospace after spinoffs. Aftermarket tailwind as global fleet ages. Strong free cash flow.', highlight: 'Pure-play aerospace', type: 'investment' },
      ],
      keyStats: [{ label: 'Engines in Service', value: '44,000+' }, { label: 'LEAP Orders', value: '30,000+' }, { label: 'Revenue', value: '$32B+' }],
    },
    {
      id: 'joby', name: 'Joby Aviation', ticker: 'JOBY', logo: '🛸',
      logoUrl: getLogoUrl('jobyaviation.com'), segment: 'commercial',
      description: 'Leading eVTOL company developing all-electric air taxis for urban mobility.',
      industryRole: 'Joby is the frontrunner in urban air mobility, with FAA certification advanced further than any competitor.',
      ceo: 'JoeBen Bevirt', founded: '2009', headquarters: 'Santa Cruz, California', employees: '1,200+',
      keyProducts: ['Joby S4 eVTOL', 'Air Taxi Network'],
      slides: [
        { title: 'eVTOL Leader', content: 'Joby has flown its aircraft 1,000+ test flights and is closest to FAA certification among air taxi companies.', highlight: '1,000+ test flights', type: 'insight' },
        { title: 'Toyota Backing', content: 'Toyota invested $894M in Joby, providing manufacturing expertise and financial credibility.', highlight: '$894M Toyota deal', type: 'insight' },
        { title: 'Dubai Launch', content: 'Agreement with Dubai to launch commercial air taxi service, potentially generating $700M+ in revenue.', highlight: 'Dubai agreement', type: 'insight' },
        { title: 'Competitive Position', content: 'Leads Archer, Lilium (bankrupt), Vertical Aerospace in certification progress. FAA Stage 4 certification ongoing.', highlight: 'Certification leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'High risk/reward. First-mover advantage in $1T+ urban air mobility market. Cash burn requires execution.', highlight: '$1T+ TAM', type: 'investment' },
      ],
      keyStats: [{ label: 'Test Flights', value: '1,000+' }, { label: 'Range', value: '150 miles' }, { label: 'Valuation', value: '$5B+' }],
    },
  ],

  ai: [
    {
      id: 'openai', name: 'OpenAI', logo: '🤖',
      logoUrl: getLogoUrl('openai.com'), segment: 'models',
      description: 'Creator of GPT and ChatGPT, pioneering the AI revolution with foundation models.',
      industryRole: 'OpenAI defined the modern AI era with ChatGPT. They set the benchmark all competitors chase.',
      ceo: 'Sam Altman', founded: '2015', headquarters: 'San Francisco, CA', employees: '1,500+', marketCap: '$157B+ (private)',
      keyProducts: ['GPT-4', 'ChatGPT', 'DALL-E', 'Sora', 'API Platform'],
      slides: [
        { title: 'AI Originator', content: 'ChatGPT reached 100M users in 2 months—fastest product in history. GPT-4 remains the benchmark.', highlight: '100M users in 2 months', type: 'insight' },
        { title: 'Microsoft Alliance', content: 'Microsoft invested $13B+ and integrates OpenAI across Azure, Office, and Bing, creating massive distribution.', highlight: '$13B Microsoft deal', type: 'insight' },
        { title: 'Revenue Ramp', content: 'OpenAI is on track for $4B+ ARR, growing from essentially zero in 2022. API business diversifies from consumer.', highlight: '$4B+ ARR', type: 'insight' },
        { title: 'Competitive Position', content: 'Leads Anthropic and Google on consumer mindshare. Model performance competitive. Enterprise adoption accelerating.', highlight: 'Consumer leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Private with secondary market access. IPO likely. Network effects and Microsoft moat. Regulatory risk exists.', highlight: 'Pre-IPO opportunity', type: 'investment' },
      ],
      keyStats: [{ label: 'ARR', value: '$4B+' }, { label: 'ChatGPT Users', value: '100M+' }, { label: 'Valuation', value: '$157B+' }],
    },
    {
      id: 'anthropic', name: 'Anthropic', logo: '🧠',
      logoUrl: getLogoUrl('anthropic.com'), segment: 'models',
      description: 'AI safety company building Claude, competitive with GPT in reasoning and safety benchmarks.',
      industryRole: "Founded by ex-OpenAI team, Anthropic focuses on AI safety while building frontier models. Claude is GPT's strongest competitor.",
      ceo: 'Dario Amodei', founded: '2021', headquarters: 'San Francisco, CA', employees: '800+', marketCap: '$60B+ (private)',
      keyProducts: ['Claude 3', 'Claude Haiku', 'Claude API'],
      slides: [
        { title: 'Safety-First AI', content: "Anthropic's Constitutional AI approach embeds safety at training. Claude scores top on safety benchmarks.", highlight: 'Constitutional AI', type: 'insight' },
        { title: 'Amazon Alliance', content: 'Amazon invested $4B in Anthropic, integrating Claude into AWS Bedrock and giving massive cloud distribution.', highlight: '$4B Amazon deal', type: 'insight' },
        { title: 'Enterprise Focus', content: 'Claude leads for enterprise coding, legal, and analysis tasks. 200K context window enables long documents.', highlight: '200K context', type: 'insight' },
        { title: 'Competitive Position', content: 'Strong #2 to OpenAI. Beats GPT-4 on many coding benchmarks. Amazon distribution vs Microsoft/OpenAI.', highlight: 'Strong #2', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Safety narrative differentiator as regulation increases. Amazon cloud moat. Still private—secondary market.', highlight: 'Safety premium', type: 'investment' },
      ],
      keyStats: [{ label: 'Funding', value: '$7.3B+' }, { label: 'Valuation', value: '$60B+' }, { label: 'Context Window', value: '200K tokens' }],
    },
    {
      id: 'nvidia', name: 'NVIDIA', ticker: 'NVDA', logo: '💻',
      logoUrl: getLogoUrl('nvidia.com'), segment: 'hardware',
      description: 'The dominant GPU manufacturer powering the entire AI industry.',
      industryRole: 'NVIDIA controls 80%+ of AI training hardware. Without H100/H200 GPUs, most AI companies cannot operate.',
      ceo: 'Jensen Huang', founded: '1993', headquarters: 'Santa Clara, CA', employees: '30,000+', marketCap: '$3T+',
      keyProducts: ['H100 GPU', 'H200 GPU', 'CUDA Platform', 'DGX Systems', 'Jetson'],
      slides: [
        { title: 'AI Infrastructure King', content: 'NVIDIA sells the "picks and shovels" of AI. Every major AI lab—OpenAI, Google, Meta—runs on H100s.', highlight: 'AI infrastructure', type: 'insight' },
        { title: 'CUDA Lock-in', content: 'CUDA software platform has 4M+ developers. Switching costs are enormous—CUDA is the de facto AI standard.', highlight: '4M+ CUDA devs', type: 'insight' },
        { title: 'Revenue Explosion', content: 'Revenue grew from $7B (2020) to $60B+ (2024). Data center segment grew 400%+ year-over-year.', highlight: '400% growth', type: 'insight' },
        { title: 'Competitive Position', content: 'AMD is #2 but years behind. Intel still catching up. Custom silicon (Google TPU, Amazon Trainium) threatens edges.', highlight: 'Dominant position', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Expensive but justified. AI infrastructure spending secular trend. CUDA moat protects against competition.', highlight: 'AI backbone', type: 'investment' },
      ],
      keyStats: [{ label: 'Market Cap', value: '$3T+' }, { label: 'Data Center Rev', value: '$47B+' }, { label: 'Gross Margin', value: '78%+' }],
    },
    {
      id: 'google_deepmind', name: 'Google DeepMind', ticker: 'GOOGL', logo: '🔍',
      logoUrl: getLogoUrl('deepmind.com'), segment: 'models',
      description: "Alphabet's AI research lab, creator of Gemini, AlphaFold, and Gemini 1.5.",
      industryRole: "Google has AI infrastructure (TPUs), distribution (Search, Android), and research (DeepMind) that no pure-play AI company can match.",
      ceo: 'Demis Hassabis', founded: '2010 (DeepMind)', headquarters: 'London / Mountain View', employees: '30,000+ (AI)',
      keyProducts: ['Gemini 1.5', 'AlphaFold', 'Google TPU', 'Vertex AI'],
      slides: [
        { title: 'AI Native Giant', content: "Google invented the Transformer architecture that powers all modern LLMs. They created the technology others are disrupting them with.", highlight: 'Transformer inventors', type: 'insight' },
        { title: 'AlphaFold Breakthrough', content: 'AlphaFold solved the protein folding problem—one of biology\'s greatest challenges. Used by 1M+ researchers.', highlight: 'AlphaFold: 50yr breakthrough', type: 'insight' },
        { title: 'Distribution Moat', content: 'Gemini integrates into Search (8.5B+ queries/day), Android (3B devices), and Google Workspace (3B users).', highlight: '3B device reach', type: 'insight' },
        { title: 'Competitive Position', content: 'Gemini 1.5 Pro competitive with GPT-4. Unique in combining frontier research, cloud, and consumer distribution.', highlight: 'Unique combination', type: 'competitive' },
        { title: 'Investment Thesis', content: 'AI risks are overblown for Google. Strong moats plus AI integration. Defensive core holding in AI portfolio.', highlight: 'AI-enabled Google', type: 'investment' },
      ],
      keyStats: [{ label: 'Search Queries/day', value: '8.5B+' }, { label: 'Android Devices', value: '3B+' }, { label: 'Cloud Revenue', value: '$33B+' }],
    },
    {
      id: 'microsoft', name: 'Microsoft', ticker: 'MSFT', logo: '🖥️',
      logoUrl: getLogoUrl('microsoft.com'), segment: 'enterprise',
      description: 'Enterprise software giant leveraging OpenAI partnership to lead enterprise AI adoption.',
      industryRole: 'Microsoft is the leading enterprise AI platform through Azure OpenAI and Copilot across its entire product suite.',
      ceo: 'Satya Nadella', founded: '1975', headquarters: 'Redmond, WA', employees: '220,000+', marketCap: '$3T+',
      keyProducts: ['Azure OpenAI', 'Copilot 365', 'GitHub Copilot', 'Azure AI'],
      slides: [
        { title: 'OpenAI Proxy', content: "Microsoft's $13B OpenAI investment gives enterprise access to GPT-4 through Azure. Copilot monetizes 300M+ Office users.", highlight: 'OpenAI distributor', type: 'insight' },
        { title: 'GitHub Copilot', content: 'GitHub Copilot has 1.8M+ paid subscribers at $19-39/month. Fastest-growing Microsoft product ever.', highlight: '1.8M Copilot users', type: 'insight' },
        { title: 'Azure Growth', content: 'Azure is #2 cloud with 29% market share. AI workloads are accelerating growth beyond traditional cloud peers.', highlight: '29% cloud share', type: 'insight' },
        { title: 'Competitive Position', content: 'Unique position: OpenAI model quality + enterprise relationships + Azure cloud + Office distribution.', highlight: 'Unmatched combo', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Core AI holding with lower risk than pure-plays. Copilot monetization just beginning. Dividend + buybacks.', highlight: 'Lower-risk AI', type: 'investment' },
      ],
      keyStats: [{ label: 'Market Cap', value: '$3T+' }, { label: 'Copilot Users', value: '1.8M+' }, { label: 'Azure Growth', value: '29%+ YoY' }],
    },
    {
      id: 'mistral', name: 'Mistral AI', logo: '🌪️',
      logoUrl: getLogoUrl('mistral.ai'), segment: 'models',
      description: 'French AI startup building open and efficient frontier models as an alternative to closed AI.',
      industryRole: 'Mistral champions open-source AI, providing EU-independent models that outperform larger closed models.',
      ceo: 'Arthur Mensch', founded: '2023', headquarters: 'Paris, France', employees: '200+', marketCap: '$6B+ (private)',
      keyProducts: ['Mistral 7B', 'Mixtral 8x7B', 'Mistral Large', 'Le Chat'],
      slides: [
        { title: 'Open-Source Champion', content: 'Mistral released Mistral 7B and Mixtral openly, becoming the leading open-source AI provider in Europe.', highlight: 'Open-source leader', type: 'insight' },
        { title: 'Efficiency Leader', content: 'Mixtral 8x7B matches GPT-3.5 performance at 5x lower inference cost using Mixture of Experts architecture.', highlight: '5x more efficient', type: 'insight' },
        { title: 'EU AI Strategy', content: 'Europe\'s leading AI company, receiving EU sovereign support as an alternative to US-dominated AI.', highlight: 'EU champion', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes on efficiency vs. raw capability. Target: enterprises needing on-premise or EU-compliant AI.', highlight: 'EU compliance angle', type: 'competitive' },
        { title: 'Investment Thesis', content: 'EU AI regulation creates moat. Private with $6B+ valuation. Open-source community as competitive advantage.', highlight: 'EU AI play', type: 'investment' },
      ],
      keyStats: [{ label: 'Funding', value: '$1B+' }, { label: 'Valuation', value: '$6B+' }, { label: 'Downloads', value: '10M+' }],
    },
  ],

  fintech: [
    {
      id: 'stripe', name: 'Stripe', logo: '💳',
      logoUrl: getLogoUrl('stripe.com'), segment: 'payments',
      description: 'The leading developer-first payment infrastructure powering millions of businesses globally.',
      industryRole: "Stripe is the default payment infrastructure for startups and enterprises. If you've bought anything online, Stripe likely processed it.",
      ceo: 'Patrick Collison', founded: '2010', headquarters: 'San Francisco / Dublin', employees: '8,000+', marketCap: '$65B+ (private)',
      keyProducts: ['Stripe Payments', 'Stripe Connect', 'Stripe Treasury', 'Radar', 'Stripe Atlas'],
      slides: [
        { title: 'Payments Standard', content: 'Stripe processes $1T+ in annual payment volume for 1M+ businesses, from early-stage startups to Fortune 500s.', highlight: '$1T+ processed', type: 'insight' },
        { title: 'Developer Moat', content: "Stripe's API is legendary. Integrate in minutes with 7 lines of code. Developer advocacy creates product-led growth.", highlight: 'Developer standard', type: 'insight' },
        { title: 'Financial Suite', content: 'Beyond payments: Treasury (banking), Radar (fraud), Atlas (company formation), Capital (lending). Full financial stack.', highlight: 'Full financial suite', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes with Adyen (enterprise) and Braintree. Leads on developer experience. Pricing pressure from competition.', highlight: 'Developer leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'One of most anticipated private tech IPOs. $65B valuation discounted from $95B peak. IPO timing: 2024-2025.', highlight: 'IPO candidate', type: 'investment' },
      ],
      keyStats: [{ label: 'Payment Volume', value: '$1T+' }, { label: 'Valuation', value: '$65B+' }, { label: 'Countries', value: '46+' }],
    },
    {
      id: 'robinhood', name: 'Robinhood', ticker: 'HOOD', logo: '📈',
      logoUrl: getLogoUrl('robinhood.com'), segment: 'investing',
      description: 'Commission-free investing app that democratized retail trading.',
      industryRole: 'Robinhood pioneered zero-commission trading, forcing TD Ameritrade, E*TRADE, and Fidelity to eliminate fees.',
      ceo: 'Vlad Tenev', founded: '2013', headquarters: 'Menlo Park, CA', employees: '2,800+', marketCap: '$15B+',
      keyProducts: ['Robinhood Invest', 'Robinhood Gold', 'Robinhood Crypto', 'Robinhood Retirement'],
      slides: [
        { title: 'Zero-Commission Pioneer', content: "Robinhood's commission-free model forced the entire brokerage industry to eliminate trading fees, saving investors billions.", highlight: 'Changed the industry', type: 'insight' },
        { title: 'Gold Subscription', content: 'Robinhood Gold ($5/month) has 2M+ subscribers, providing stable recurring revenue beyond trading volume.', highlight: '2M Gold subscribers', type: 'insight' },
        { title: 'Crypto & Options', content: 'Crypto trading and options are high-margin products. Crypto revenue surged in 2024 bull market.', highlight: 'Crypto tailwind', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes with WeBull, Public, and traditional brokerages. Unique: youngest user base (avg age 31).', highlight: 'Young investor leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Post-PFOF regulatory risk and meme stock volatility priced in. Gold subscription de-risks. Cheap valuation.', highlight: 'Contrarian value', type: 'investment' },
      ],
      keyStats: [{ label: 'Funded Accounts', value: '24M+' }, { label: 'Gold Subscribers', value: '2M+' }, { label: 'AUC', value: '$120B+' }],
    },
    {
      id: 'plaid', name: 'Plaid', logo: '🏦',
      logoUrl: getLogoUrl('plaid.com'), segment: 'infrastructure',
      description: 'The financial data network connecting consumer bank accounts to fintech applications.',
      industryRole: 'Plaid is the invisible infrastructure behind most fintech apps. If an app shows your bank balance, Plaid is likely powering it.',
      ceo: 'Zach Perret', founded: '2013', headquarters: 'San Francisco, CA', employees: '1,400+', marketCap: '$13B+ (private)',
      keyProducts: ['Plaid Link', 'Plaid Core Exchange', 'Identity Verification', 'Signal'],
      slides: [
        { title: 'Financial Data Layer', content: 'Plaid connects 12,000+ financial institutions to 8,000+ apps. Used by Coinbase, Venmo, Robinhood, and 8,000+ apps.', highlight: '8,000+ app integrations', type: 'insight' },
        { title: 'Avoided Visa Acquisition', content: "Visa's $5.3B acquisition was blocked by DOJ in 2021. Independence proved correct—now worth $13B+ independently.", highlight: 'DOJ blocked $5.3B deal', type: 'insight' },
        { title: 'Open Banking Wave', content: 'New CFPB data sharing rules mandate bank connectivity by 2027, creating Plaid\'s moment as open banking expands.', highlight: 'CFPB tailwind', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes with MX, Finicity (Mastercard). First-mover advantage in bank connectivity moat.', highlight: 'Infrastructure moat', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Private infrastructure play. Open banking regulation is a forcing function. Strong IPO candidate.', highlight: 'Open banking bet', type: 'investment' },
      ],
      keyStats: [{ label: 'Institutions Connected', value: '12,000+' }, { label: 'App Integrations', value: '8,000+' }, { label: 'Valuation', value: '$13B+' }],
    },
    {
      id: 'affirm', name: 'Affirm', ticker: 'AFRM', logo: '💰',
      logoUrl: getLogoUrl('affirm.com'), segment: 'lending',
      description: 'Buy Now, Pay Later pioneer offering transparent installment loans at checkout.',
      industryRole: 'Affirm leads the BNPL revolution in the US, partnering with Amazon, Shopify, and major retailers for checkout financing.',
      ceo: 'Max Levchin', founded: '2012', headquarters: 'San Francisco, CA', employees: '2,900+', marketCap: '$18B+',
      keyProducts: ['Affirm Pay-Over-Time', 'Affirm Card', 'Adaptive Checkout', 'Affirm Savings'],
      slides: [
        { title: 'BNPL Leader', content: 'Affirm generated $26B+ in Gross Merchandise Volume (GMV) with no hidden fees—differentiating from Klarna and Afterpay.', highlight: '$26B+ GMV', type: 'insight' },
        { title: 'Amazon Partnership', content: 'Affirm is the exclusive BNPL partner for Amazon in the US, giving access to 200M+ Prime members at checkout.', highlight: 'Amazon exclusive', type: 'insight' },
        { title: 'Shopify Integration', content: 'Shop Pay Installments (powered by Affirm) reaches 100M+ Shopify merchants, creating massive distribution.', highlight: '100M+ merchant reach', type: 'insight' },
        { title: 'Competitive Position', content: 'Leads in transparency vs. Klarna/Afterpay. Amazon/Shopify moat is substantial. Higher rates in rising rate environment.', highlight: 'Transparency moat', type: 'competitive' },
        { title: 'Investment Thesis', content: 'High rate sensitivity creates volatility. But Amazon/Shopify lock-in provides floor. Rate cuts are catalyst.', highlight: 'Rate cut beneficiary', type: 'investment' },
      ],
      keyStats: [{ label: 'GMV (2024)', value: '$26B+' }, { label: 'Active Users', value: '18M+' }, { label: 'Merchant Partners', value: '300,000+' }],
    },
    {
      id: 'chime', name: 'Chime', logo: '🔔',
      logoUrl: getLogoUrl('chime.com'), segment: 'neobank',
      description: 'America\'s largest neobank offering fee-free banking to underserved consumers.',
      industryRole: 'Chime proved neobanks could scale in the US by targeting lower-income consumers overlooked by traditional banks.',
      ceo: 'Chris Britt', founded: '2013', headquarters: 'San Francisco, CA', employees: '1,500+', marketCap: '$25B+ (private)',
      keyProducts: ['Chime Checking', 'SpotMe Overdraft', 'Credit Builder', 'Chime Savings'],
      slides: [
        { title: 'Neobank Champion', content: 'Chime has 21M+ accounts—more than many regional US banks. Grew by offering fee-free banking to overlooked consumers.', highlight: '21M+ accounts', type: 'insight' },
        { title: 'SpotMe Innovation', content: 'SpotMe lets users overdraft up to $200 with no fees. Radical departure from $35 bank overdraft fees.', highlight: '$0 overdraft fees', type: 'insight' },
        { title: 'Credit Builder', content: 'Chime Credit Builder secured card reports to all bureaus with no deposit. Serves credit-invisible consumers.', highlight: 'Credit builder moat', type: 'insight' },
        { title: 'Competitive Position', content: 'Leads US neobanks vs. Current, Dave, Varo. Network effects as payroll direct deposit drives sticky retention.', highlight: 'US neobank leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'IPO delayed due to market conditions but strong fundamentals. Fintech infrastructure play on underbanked America.', highlight: 'IPO imminent', type: 'investment' },
      ],
      keyStats: [{ label: 'Active Accounts', value: '21M+' }, { label: 'Valuation', value: '$25B+' }, { label: 'Revenue (est)', value: '$1B+' }],
    },
    {
      id: 'block', name: 'Block (Square)', ticker: 'SQ', logo: '⬛',
      logoUrl: getLogoUrl('block.xyz'), segment: 'payments',
      description: 'Payments and financial services ecosystem serving both merchants (Square) and consumers (Cash App).',
      industryRole: "Block uniquely serves both B2B (Square POS) and B2C (Cash App), creating a closed-loop financial ecosystem.",
      ceo: 'Jack Dorsey', founded: '2009', headquarters: 'Oakland, CA', employees: '12,000+', marketCap: '$45B+',
      keyProducts: ['Cash App', 'Square POS', 'Afterpay', 'TIDAL', 'Bitcoin Mining'],
      slides: [
        { title: 'Two-Sided Ecosystem', content: 'Square serves 4M+ merchants; Cash App serves 53M+ consumers. Together they create a closed payments loop.', highlight: '53M Cash App users', type: 'insight' },
        { title: 'Cash App Monetization', content: 'Cash App generates $15B+ gross profit. Bitcoin, stocks, Afterpay, and banking all monetize the base.', highlight: '$15B+ gross profit', type: 'insight' },
        { title: 'Afterpay Integration', content: "Block's $29B Afterpay acquisition (bought at peak) integrates BNPL into Square/Cash App ecosystem.", highlight: '$29B Afterpay', type: 'insight' },
        { title: 'Competitive Position', content: 'Square faces Clover, Toast in POS. Cash App competes with Venmo/Zelle. Bitcoin differentiates from both.', highlight: 'Unique Bitcoin angle', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Afterpay written down. Core business undervalued. Bitcoin optionality. Jack Dorsey building long-term.', highlight: 'Undervalued core', type: 'investment' },
      ],
      keyStats: [{ label: 'Cash App Users', value: '53M+' }, { label: 'Square Merchants', value: '4M+' }, { label: 'Gross Profit', value: '$7B+' }],
    },
  ],

  neuroscience: [
    {
      id: 'neuralink', name: 'Neuralink', logo: '🧠',
      logoUrl: getLogoUrl('neuralink.com'), segment: 'devices',
      description: 'Elon Musk-backed BCI company implanting coin-sized chips to restore neurological function.',
      industryRole: 'Neuralink is the most famous BCI company, pushing the frontier of human-computer interfaces for paralysis patients.',
      ceo: 'Jared Birchall', founded: '2016', headquarters: 'Austin, TX', employees: '400+', marketCap: '$8.5B+ (private)',
      keyProducts: ['N1 Chip', 'R1 Robot Surgeon', 'Link Device'],
      slides: [
        { title: 'BCI Breakthrough', content: 'First human Neuralink implant (Jan 2024) enabled a paralyzed patient to control a computer cursor with their thoughts.', highlight: 'First human implant', type: 'insight' },
        { title: 'N1 Chip', content: "N1 chip has 1,024 electrodes vs. Utah Array's 100. 10x more data resolution enables finer motor control.", highlight: '1,024 electrodes', type: 'insight' },
        { title: 'Robotic Surgery', content: 'R1 surgical robot implants Neuralink in 15 minutes with sub-millimeter precision—safer than traditional neurosurgery.', highlight: '15-min surgical implant', type: 'insight' },
        { title: 'Competitive Position', content: 'Leads in fundraising and media attention. Synchron has safer stentrode approach. Precision competes in cortical stim.', highlight: 'Funding leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Private. Elon Musk brand amplifies hype. Long path to mainstream: regulatory, safety, reimbursement. Decade+ horizon.', highlight: 'Long-term vision', type: 'investment' },
      ],
      keyStats: [{ label: 'Human Implants', value: '3+' }, { label: 'Electrodes', value: '1,024' }, { label: 'Valuation', value: '$8.5B+' }],
    },
    {
      id: 'synchron', name: 'Synchron', logo: '💡',
      logoUrl: getLogoUrl('synchron.com'), segment: 'devices',
      description: 'BCI company using minimally invasive stentrode implanted through blood vessels.',
      industryRole: 'Synchron offers a safer, less invasive path to BCIs using endovascular implantation—no open brain surgery required.',
      ceo: 'Tom Oxley', founded: '2016', headquarters: 'New York, NY', employees: '120+',
      keyProducts: ['Stentrode', 'BrainOS Platform'],
      slides: [
        { title: 'No Surgery Needed', content: 'Stentrode is implanted via blood vessel (like a cardiac stent), avoiding open brain surgery. Radically safer than competitors.', highlight: 'No open brain surgery', type: 'insight' },
        { title: 'First US Human Trial', content: 'First US BCI human trial (2023). Patients can browse web, send texts, and use apps with their thoughts.', highlight: 'First US trial', type: 'insight' },
        { title: 'Jeff Bezos Backing', content: 'Bezos Expeditions led $75M Series B. Top-tier investor validation for the stentrode approach.', highlight: 'Bezos-backed', type: 'insight' },
        { title: 'Competitive Position', content: 'Safer implant than Neuralink. Fewer electrodes (16 vs 1,024) but much lower surgical risk. Regulatory path clearer.', highlight: 'Safer alternative', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Private. Safety advantage may win regulatory race before Neuralink. First-to-reimbursement wins the market.', highlight: 'Safety-first path', type: 'investment' },
      ],
      keyStats: [{ label: 'Human Trials', value: '6+' }, { label: 'Funding', value: '$145M+' }, { label: 'Electrodes', value: '16' }],
    },
    {
      id: 'compass_pathways', name: 'Compass Pathways', ticker: 'CMPS', logo: '🧪',
      logoUrl: getLogoUrl('compasspathways.com'), segment: 'pharma',
      description: 'Mental health company developing psilocybin therapy for treatment-resistant depression.',
      industryRole: 'Compass leads the psychedelic medicine revolution, advancing COMP360 psilocybin through Phase 2b clinical trials.',
      ceo: 'Kabir Nath', founded: '2016', headquarters: 'London, UK', employees: '200+', marketCap: '$1B+',
      keyProducts: ['COMP360 Psilocybin', 'Precision Psychiatry Platform'],
      slides: [
        { title: 'Psychedelic Medicine Leader', content: 'Compass has the largest psilocybin clinical trial ever (233 patients). Phase 2b showed 29% remission rates.', highlight: '29% remission rate', type: 'insight' },
        { title: 'TRD Opportunity', content: 'Treatment-resistant depression affects 30M+ people globally with no good options. Psilocybin addresses unmet need.', highlight: '30M+ TRD patients', type: 'insight' },
        { title: 'Regulatory Pathway', content: 'FDA Breakthrough Therapy Designation accelerates review. Phase 3 trial ongoing. Approval potential 2025-2026.', highlight: 'FDA Breakthrough status', type: 'insight' },
        { title: 'Competitive Position', content: 'Leads MAPS (MDMA), MindMed, atai Life Sciences in trial size and funding. First-mover in psilocybin therapy.', highlight: 'Psilocybin leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Binary outcome on Phase 3. If approved, captures $8B+ TRD market. If fails, significant downside. High risk/reward.', highlight: '$8B+ TRD market', type: 'investment' },
      ],
      keyStats: [{ label: 'Trial Patients', value: '233+' }, { label: 'Remission Rate', value: '29%' }, { label: 'Market Cap', value: '$1B+' }],
    },
    {
      id: 'kernel', name: 'Kernel', logo: '🖥️',
      logoUrl: getLogoUrl('kernel.com'), segment: 'devices',
      description: 'Non-invasive brain measurement company building next-gen neuroimaging helmets.',
      industryRole: 'Kernel is building the "iPhone of brain scanners" — wearable neuroimaging that could democratize brain health monitoring.',
      ceo: 'Bryan Johnson', founded: '2016', headquarters: 'Los Angeles, CA', employees: '100+',
      keyProducts: ['Flow (TD-fNIRS)', 'Flux (OPM-MEG)', 'Kernel Flow'],
      slides: [
        { title: 'Consumer Neuroimaging', content: 'Kernel Flow is the first portable, high-resolution brain scanner. Traditional fMRI costs $5M+; Kernel targets $50K.', highlight: '100x cost reduction', type: 'insight' },
        { title: 'Bryan Johnson Backing', content: 'Founder Bryan Johnson (sold Braintree to PayPal for $800M) invested $53M personally. Total funding $110M+.', highlight: '$53M founder commitment', type: 'insight' },
        { title: 'Research to Consumer', content: 'Initial target: research, pharma, and military. Long-term: consumer brain health monitoring like wearables.', highlight: 'Consumer brain health', type: 'insight' },
        { title: 'Competitive Position', content: 'Unique in building both TD-fNIRS and OPM-MEG platforms. Competes with Emotiv, InteraXon in consumer; Siemens in research.', highlight: 'Dual-modality platform', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Pre-revenue. Bryan Johnson credibility. Long product development cycle. Options value in brain-computer interface era.', highlight: 'Options value', type: 'investment' },
      ],
      keyStats: [{ label: 'Funding', value: '$110M+' }, { label: 'Resolution vs fMRI', value: '10x better time', value: '10x better' }, { label: 'Price Target', value: '$50K' }],
    },
    {
      id: 'emotiv', name: 'Emotiv', logo: '🎭',
      logoUrl: getLogoUrl('emotiv.com'), segment: 'devices',
      description: 'Consumer EEG headset company making brain-computer interfaces accessible for research and wellness.',
      industryRole: 'Emotiv makes the most accessible EEG headsets for researchers, developers, and consumers interested in brain data.',
      ceo: 'Tan Le', founded: '2011', headquarters: 'San Francisco, CA', employees: '200+',
      keyProducts: ['EPOC X', 'Insight', 'FLEX', 'EmotivPRO'],
      slides: [
        { title: 'EEG for Everyone', content: 'Emotiv has sold 150,000+ EEG headsets globally, making brain data accessible at $299 vs. $50,000+ clinical systems.', highlight: '150K+ headsets sold', type: 'insight' },
        { title: 'Research Platform', content: 'Used in 10,000+ academic studies. The de facto standard for BCI research in universities.', highlight: '10K+ research studies', type: 'insight' },
        { title: 'Enterprise Applications', content: 'Emotiv is used for pilot fatigue monitoring, workplace safety, and driver alertness in real deployments.', highlight: 'Enterprise deployments', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes with Muse (InteraXon) in consumer, g.tec and Natus in clinical. Price-performance leader.', highlight: 'Best price/performance', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Private. Consumer BCI market is early. Enterprise safety applications provide near-term revenue. AI + brain data is the bet.', highlight: 'AI + brain data', type: 'investment' },
      ],
      keyStats: [{ label: 'Headsets Sold', value: '150,000+' }, { label: 'Research Studies', value: '10,000+' }, { label: 'EEG Channels', value: '32' }],
    },
    {
      id: 'atai', name: 'atai Life Sciences', ticker: 'ATAI', logo: '🔬',
      logoUrl: getLogoUrl('atai.life'), segment: 'pharma',
      description: 'Psychedelic medicine holding company funding multiple drug development programs.',
      industryRole: 'atai is the "SoftBank of psychedelic medicine" — backing 10+ companies developing novel mental health treatments.',
      ceo: 'Florian Brand', founded: '2018', headquarters: 'Berlin, Germany', employees: '100+', marketCap: '$400M+',
      keyProducts: ['PCN-101 (R-ketamine)', 'RL-007', 'Perception Neuroscience', 'EmpathBio'],
      slides: [
        { title: 'Psychedelic Platform', content: 'atai has 10+ portfolio companies pursuing ketamine, psilocybin, ibogaine, and DMT for mental health conditions.', highlight: '10+ programs', type: 'insight' },
        { title: 'Peter Thiel Backing', content: 'Peter Thiel is the largest individual investor with $100M+ invested. His involvement signals serious commercial potential.', highlight: 'Peter Thiel backed', type: 'insight' },
        { title: 'Diversified Portfolio', content: 'Unlike single-asset biotechs, atai holds 10+ assets across multiple indications and compound classes.', highlight: 'Diversified pipeline', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes with Compass, MindMed as a holding company approach vs. single-asset focus.', highlight: 'Platform approach', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Portfolio approach reduces binary risk. Thiel credibility. Mental health unmet need is massive. High-risk biotech.', highlight: 'Diversified psychedelic', type: 'investment' },
      ],
      keyStats: [{ label: 'Portfolio Companies', value: '10+' }, { label: 'Funding', value: '$400M+' }, { label: 'Indications', value: '5+' }],
    },
  ],

  ev: [
    {
      id: 'tesla', name: 'Tesla', ticker: 'TSLA', logo: '⚡',
      logoUrl: getLogoUrl('tesla.com'), segment: 'commercial',
      description: 'The company that proved electric vehicles could be desirable, profitable, and mainstream.',
      industryRole: "Tesla didn't just build EVs—they forced the entire auto industry to electrify. Elon Musk's Tesla changed the trajectory of transportation.",
      ceo: 'Elon Musk', founded: '2003', headquarters: 'Austin, TX', employees: '140,000+', marketCap: '$800B+',
      keyProducts: ['Model Y', 'Model 3', 'Model S', 'Cybertruck', 'Powerwall', 'FSD'],
      slides: [
        { title: 'EV Market Creator', content: 'Tesla delivered 1.8M vehicles in 2023. Created the premium EV segment that others now compete in.', highlight: '1.8M vehicles delivered', type: 'insight' },
        { title: 'Software Revenue', content: 'Full Self-Driving (FSD) at $12K or $199/month is the highest-margin product. 100M+ miles of training data.', highlight: 'FSD $12K upsell', type: 'insight' },
        { title: 'Energy Business', content: "Tesla's Energy segment (Powerwall, Megapack, Solar) is growing faster than automotive. $10B+ revenue potential.", highlight: 'Energy = next Tesla', type: 'insight' },
        { title: 'Competitive Position', content: 'Price cuts hurt margins but defend market share vs. BYD, Rivian, legacy OEMs. Supercharger network is a moat.', highlight: 'Network moat', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Bull case: robotaxi + FSD + Optimus robot. Bear case: margin compression + competition. Highly polarizing.', highlight: 'Robotaxi optionality', type: 'investment' },
      ],
      keyStats: [{ label: 'Vehicles Delivered', value: '1.8M' }, { label: 'Superchargers', value: '55,000+' }, { label: 'Energy Storage', value: '14.7GWh' }],
    },
    {
      id: 'rivian', name: 'Rivian', ticker: 'RIVN', logo: '🚚',
      logoUrl: getLogoUrl('rivian.com'), segment: 'commercial',
      description: 'Electric truck and van maker targeting adventure vehicles and Amazon delivery.',
      industryRole: 'Rivian proves electric trucks can be aspirational. Their R1T is the first electric pickup truck in production.',
      ceo: 'RJ Scaringe', founded: '2009', headquarters: 'Irvine, CA', employees: '15,000+', marketCap: '$15B+',
      keyProducts: ['R1T Pickup', 'R1S SUV', 'EDV Amazon Van', 'R2 Platform'],
      slides: [
        { title: 'First Electric Truck', content: "R1T was America's first electric pickup truck in production. 70,000+ units delivered with strong customer satisfaction.", highlight: 'First e-pickup', type: 'insight' },
        { title: 'Amazon Partnership', content: "Amazon ordered 100,000 Electric Delivery Vans. 15,000 already deployed—Rivian's guaranteed revenue floor.", highlight: '100K Amazon vans', type: 'insight' },
        { title: 'R2 Expansion', content: 'R2 platform (coming 2026) at ~$45K will triple addressable market. Same technology, lower price point.', highlight: 'R2 at $45K', type: 'insight' },
        { title: 'Competitive Position', content: 'Leads Ford F-150 Lightning on range/tech. GM Silverado EV competes. Cybertruck polarizes. R2 is the real battle.', highlight: 'Truck tech leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Path to profitability in 2024. Amazon floor provides stability. R2 could change trajectory. Cash burn is key risk.', highlight: 'Profitability path', type: 'investment' },
      ],
      keyStats: [{ label: 'Vehicles Delivered', value: '70,000+' }, { label: 'Amazon Vans', value: '15,000+' }, { label: 'Range (R1T)', value: '400+ miles' }],
    },
    {
      id: 'byd', name: 'BYD', ticker: 'BYDDY', logo: '🔋',
      logoUrl: getLogoUrl('byd.com'), segment: 'commercial',
      description: "China's largest EV maker and the world's best-selling electric vehicle brand in 2023.",
      industryRole: 'BYD overtook Tesla in global EV sales in Q4 2023. They control the entire supply chain from batteries to vehicles.',
      ceo: 'Wang Chuanfu', founded: '1995', headquarters: 'Shenzhen, China', employees: '700,000+', marketCap: '$80B+',
      keyProducts: ['Seal', 'Atto 3', 'Han', 'Blade Battery', 'e6'],
      slides: [
        { title: 'EV Sales King', content: 'BYD sold 3M+ EVs in 2023, surpassing Tesla globally. Dominant in China (50%+ market share) and expanding globally.', highlight: '3M+ EVs sold', type: 'insight' },
        { title: 'Blade Battery Advantage', content: "BYD's Blade Battery has 50% higher energy density than traditional LFP. More range, safer, and cheaper.", highlight: 'Blade Battery tech', type: 'insight' },
        { title: 'Vertical Integration', content: 'BYD makes its own batteries, chips, motors, and software. Lowest cost structure in the EV industry.', highlight: 'Full vertical integration', type: 'insight' },
        { title: 'Competitive Position', content: 'Dominates China; expanding to Europe, Southeast Asia, Brazil. Western tariffs threaten but cannot stop global expansion.', highlight: 'Global expansion', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Warren Buffett-backed (Berkshire owns 8%). China discount applies. Tariff risks in West. Best value in EVs globally.', highlight: 'Buffett-backed', type: 'investment' },
      ],
      keyStats: [{ label: 'EVs Sold (2023)', value: '3M+' }, { label: 'Revenue', value: '$85B+' }, { label: 'Battery Factories', value: '10+' }],
    },
    {
      id: 'chargepoint', name: 'ChargePoint', ticker: 'CHPT', logo: '🔌',
      logoUrl: getLogoUrl('chargepoint.com'), segment: 'charging',
      description: 'The largest EV charging network in North America and Europe.',
      industryRole: "ChargePoint operates the largest independent charging network—not tied to one OEM. The Switzerland of charging.",
      ceo: 'Rick Wilmer', founded: '2007', headquarters: 'Campbell, CA', employees: '3,000+', marketCap: '$1.5B+',
      keyProducts: ['Level 2 Commercial Chargers', 'DC Fast Chargers', 'ChargePoint Home Flex', 'Cloud Software'],
      slides: [
        { title: 'Network Leader', content: 'ChargePoint operates 250,000+ ports globally, more than any non-Tesla network. Hardware-agnostic and open standard.', highlight: '250K+ charging ports', type: 'insight' },
        { title: 'Software Revenue', content: 'SaaS subscription model generates recurring revenue. Fleet management software stickiness creates lock-in.', highlight: 'SaaS recurring revenue', type: 'insight' },
        { title: 'BipartisanInfrastructure Act', content: '$7.5B in federal charging funding creating infrastructure buildout. ChargePoint well-positioned as independent network.', highlight: '$7.5B federal funding', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes with Tesla Supercharger (now open), Blink, EVgo, Electrify America. OEM-agnostic is competitive advantage.', highlight: 'OEM-agnostic leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Highly diluted from losses. Path to profitability unclear. But infrastructure play on EV adoption. High risk.', highlight: 'Infrastructure lottery', type: 'investment' },
      ],
      keyStats: [{ label: 'Charging Ports', value: '250,000+' }, { label: 'Countries', value: '14+' }, { label: 'Fleet Customers', value: '6,000+' }],
    },
    {
      id: 'quantumscape', name: 'QuantumScape', ticker: 'QS', logo: '⚛️',
      logoUrl: getLogoUrl('quantumscape.com'), segment: 'battery',
      description: 'Solid-state battery company backed by Volkswagen aiming to make breakthrough battery technology.',
      industryRole: "QuantumScape is the leading pre-production solid-state battery company. If successful, they could make EV batteries 50% more energy dense.",
      ceo: 'Siva Sivaram', founded: '2010', headquarters: 'San Jose, CA', employees: '800+', marketCap: '$3B+',
      keyProducts: ['Solid-State Battery', 'Anode-Free Design'],
      slides: [
        { title: 'Solid-State Promise', content: "QuantumScape's solid-state batteries offer 80% more range, 15-minute charging, and better safety vs. lithium-ion.", highlight: '80% more range potential', type: 'insight' },
        { title: 'Volkswagen Partnership', content: 'VW invested $300M+ and has a JV agreement to manufacture QuantumScape batteries for their ID. series EVs.', highlight: '$300M VW partnership', type: 'insight' },
        { title: 'Bill Gates Backing', content: 'Gates Ventures was an early investor. Gates has called solid-state batteries critical to the energy transition.', highlight: 'Bill Gates backed', type: 'insight' },
        { title: 'Competitive Position', content: 'Most advanced solid-state battery company. Competes with Toyota (solid-state focus), Samsung SDI, and CATL.', highlight: 'SSB leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Pre-revenue. Binary bet on manufacturing breakthrough. If batteries work at scale, transforms EVs. Decade timeline.', highlight: 'Binary moonshot', type: 'investment' },
      ],
      keyStats: [{ label: 'Funding', value: '$1.5B+' }, { label: 'VW Investment', value: '$300M+' }, { label: 'Energy Density', value: '+80% vs Li-ion' }],
    },
    {
      id: 'lucid', name: 'Lucid Motors', ticker: 'LCID', logo: '🚗',
      logoUrl: getLogoUrl('lucidmotors.com'), segment: 'commercial',
      description: 'Ultra-luxury EV maker led by former Tesla engineers with best-in-class efficiency.',
      industryRole: 'Lucid defines the ultra-luxury EV segment with 500+ mile range and technology licensed to Aston Martin and others.',
      ceo: 'Marc Winterbottom', founded: '2007', headquarters: 'Newark, CA', employees: '6,000+', marketCap: '$6B+',
      keyProducts: ['Lucid Air', 'Lucid Gravity SUV', 'Powertrain Technology'],
      slides: [
        { title: 'Range King', content: 'Lucid Air achieves 516 miles on a single charge—the longest range of any EV ever tested by EPA.', highlight: '516-mile range', type: 'insight' },
        { title: 'Technology Licensor', content: "Lucid's electric drivetrain technology is licensed to Aston Martin and the Saudi government. Technology royalties diversify revenue.", highlight: 'Aston Martin deal', type: 'insight' },
        { title: 'Saudi Backing', content: 'Saudi Arabia (PIF) owns 67%+ of Lucid after $8B+ investment. Government buyer of 100,000 vehicles provides revenue floor.', highlight: 'Saudi $8B backing', type: 'insight' },
        { title: 'Competitive Position', content: 'Competes with Tesla Model S, Mercedes EQS in ultra-luxury. Tech superiority but manufacturing is challenge.', highlight: 'Tech leader', type: 'competitive' },
        { title: 'Investment Thesis', content: 'Saudi backstop reduces bankruptcy risk. Technology value is real. Production ramp is the pivotal risk factor.', highlight: 'Saudi safety net', type: 'investment' },
      ],
      keyStats: [{ label: 'Range', value: '516 miles' }, { label: 'Saudi Investment', value: '$8B+' }, { label: 'Price', value: '$70K-$250K' }],
    },
  ],
};

// Default companies for markets without full data
export const defaultCompanies: Company[] = marketCompanies.aerospace.slice(0, 6);
