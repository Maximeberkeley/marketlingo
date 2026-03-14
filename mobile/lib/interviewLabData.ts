// Interview Lab - Industry-specific content for all 15 markets
// ============================================================

export type InterviewPath = 'consulting' | 'academic';
export type InterviewStage = 1 | 2 | 3 | 4;
export type ConfidencePersona = 'humble_leader' | 'tech_genius' | 'creative_dreamer';

export interface FrameworkStep {
  label: string;
  branches: string[];
  example: string;
}

export interface BigBossQuestion {
  question: string;
  tip: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MentalMathQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MarketSizingQuestion {
  question: string;
  hints: string[];
  reasonableRange: string;
}

export interface MockPrompt {
  scenario: string;
  question: string;
  buzzwords: string[];
  sampleAnswer: string;
}

export interface StoryHeroStep {
  letter: string;
  label: string;
  prompt: string;
  example: string;
}

export const STORY_HERO_STEPS: StoryHeroStep[] = [
  { letter: 'S', label: 'Situation', prompt: 'Set the scene — where were you?', example: 'During my sophomore year, our robotics club faced a budget cut...' },
  { letter: 'T', label: 'Task', prompt: 'What was YOUR job?', example: 'I needed to find sponsorships to keep the team running.' },
  { letter: 'O', label: 'Obstacle', prompt: 'What got in the way?', example: 'Companies said we were too small and unproven.' },
  { letter: 'R', label: 'Result', prompt: 'What happened? Use numbers!', example: 'I pitched 12 companies, landed 3 sponsors, and raised $4,500.' },
];

export const CONFIDENCE_PERSONAS: Record<ConfidencePersona, { label: string; emoji: string; description: string; reviewFocus: string }> = {
  humble_leader: { label: 'The Humble Leader', emoji: '🤝', description: 'You lead through empathy and teamwork.', reviewFocus: 'collaboration, empathy, team dynamics' },
  tech_genius: { label: 'The Tech Genius', emoji: '🧠', description: 'You dazzle with data and technical depth.', reviewFocus: 'data-driven arguments, technical accuracy, analytical depth' },
  creative_dreamer: { label: 'The Creative Dreamer', emoji: '🎨', description: 'You inspire with vision and bold ideas.', reviewFocus: 'creativity, vision, innovative thinking' },
};

// MECE Framework example per industry
export const MECE_FRAMEWORKS: Record<string, FrameworkStep> = {
  aerospace: { label: "Boeing's profits are down", branches: ['Revenue (fewer orders, pricing pressure)', 'Costs (supply chain delays, labor costs, R&D spend)'], example: 'Start with: "I\'d break this into Revenue and Cost drivers..."' },
  ai: { label: "An AI startup's growth is slowing", branches: ['Demand (market saturation, competition)', 'Supply (talent shortage, compute costs, model quality)'], example: 'Start with: "Let me look at demand-side and supply-side factors..."' },
  fintech: { label: "A neobank is losing customers", branches: ['Acquisition (marketing ROI, brand awareness)', 'Retention (UX issues, fees, competitor switching)'], example: 'Start with: "I\'d segment this into acquisition vs retention..."' },
  biotech: { label: "A drug company missed its revenue target", branches: ['Pipeline (trial failures, delays)', 'Commercial (pricing pressure, market access, competition)'], example: 'Start with: "Let me split this into pipeline risk and commercial execution..."' },
  neuroscience: { label: "A brain-computer interface company can't scale", branches: ['Technology (accuracy, safety, FDA hurdles)', 'Market (adoption, pricing, insurance coverage)'], example: 'Start with: "I see two core challenges: technology readiness and market adoption..."' },
  ev: { label: "An EV maker's margins are shrinking", branches: ['Revenue (price cuts, mix shift)', 'Costs (battery costs, factory ramp, raw materials)'], example: 'Start with: "Margins are Revenue minus Costs, so let me check both..."' },
  cleanenergy: { label: "A solar company's installations dropped 30%", branches: ['Demand (policy changes, interest rates)', 'Operations (supply chain, installer capacity)'], example: 'Start with: "I\'d investigate demand drivers and operational bottlenecks..."' },
  agtech: { label: "A precision agriculture startup isn't profitable", branches: ['Revenue (pricing, farmer adoption)', 'Costs (hardware, data processing, field operations)'], example: 'Start with: "Let me look at the revenue model and cost structure separately..."' },
  climatetech: { label: "A carbon capture company can't attract investors", branches: ['Technology (efficiency, scalability)', 'Business (unit economics, policy dependency, competition)'], example: 'Start with: "Investors care about tech readiness and business viability..."' },
  cybersecurity: { label: "A cybersecurity firm lost a major contract", branches: ['Product (feature gaps, compliance)', 'Sales (pricing, relationship, competitor offering)'], example: 'Start with: "Let me evaluate product fit and sales execution..."' },
  spacetech: { label: "A satellite company's launch costs are too high", branches: ['Technical (vehicle choice, payload efficiency)', 'Operational (launch frequency, partnerships, vertical integration)'], example: 'Start with: "I\'d break launch costs into technical and operational factors..."' },
  robotics: { label: "A warehouse robotics company can't grow revenue", branches: ['Market (customer readiness, ROI proof)', 'Product (reliability, integration complexity, pricing)'], example: 'Start with: "Let me look at market demand and product-market fit..."' },
  healthtech: { label: "A telehealth platform's user engagement is dropping", branches: ['Product (UX, feature set, wait times)', 'Market (regulation, insurance coverage, competition)'], example: 'Start with: "I\'d segment into product experience and market forces..."' },
  logistics: { label: "A last-mile delivery startup is burning cash", branches: ['Revenue (volume, pricing per delivery)', 'Costs (drivers, routes, technology, returns)'], example: 'Start with: "Unit economics: what\'s the revenue vs cost per delivery?"' },
  web3: { label: "A DeFi protocol's TVL is declining", branches: ['Yield (APY competitiveness, token inflation)', 'Trust (security audits, team reputation, regulatory risk)'], example: 'Start with: "TVL depends on yield attractiveness and platform trust..."' },
};

// Top 5 "Big Boss" questions per industry
export const BIG_BOSS_QUESTIONS: Record<string, BigBossQuestion[]> = {
  aerospace: [
    { question: 'How would you reduce the cost of a satellite launch by 40%?', tip: 'Think reusable rockets, rideshare missions, and manufacturing at scale.' },
    { question: 'Boeing vs Airbus — who wins the next decade and why?', tip: 'Consider order backlogs, production capacity, and innovation pipeline.' },
    { question: 'Should an airline buy or lease its fleet?', tip: 'Compare capital efficiency, flexibility, and maintenance costs.' },
    { question: 'How would you pitch a new drone delivery service to the FAA?', tip: 'Focus on safety data, airspace management, and public benefit.' },
    { question: 'What makes supersonic travel economically viable in 2025?', tip: 'Think fuel efficiency, route selection, and premium market sizing.' },
  ],
  ai: [
    { question: 'How would you monetize a large language model?', tip: 'API pricing, enterprise licenses, vertical apps, or consumer subscription.' },
    { question: 'Should a company build or buy its AI capabilities?', tip: 'Consider time-to-market, data moats, and talent availability.' },
    { question: 'How do you evaluate an AI startup\'s defensibility?', tip: 'Data flywheel, proprietary models, switching costs, network effects.' },
    { question: 'What\'s the biggest risk of deploying AI in healthcare?', tip: 'Bias, regulatory approval, liability, and patient trust.' },
    { question: 'How would you size the market for AI coding assistants?', tip: 'Bottom-up: number of developers × willingness to pay × adoption rate.' },
  ],
  fintech: [
    { question: 'How would you launch a neobank in a new country?', tip: 'Licensing, partnerships, localization, and customer acquisition strategy.' },
    { question: 'Buy Now Pay Later — sustainable or bubble?', tip: 'Analyze default rates, regulatory trends, and merchant economics.' },
    { question: 'How do you reduce fraud in digital payments by 50%?', tip: 'ML models, biometric auth, behavioral analytics, and consortium data.' },
    { question: 'Should a traditional bank acquire a fintech startup?', tip: 'Culture fit, tech integration, talent retention, and regulatory synergies.' },
    { question: 'How would you price a B2B payments API?', tip: 'Transaction-based, tiered pricing, or value-based on volume.' },
  ],
  // Default template for remaining industries
  biotech: [
    { question: 'How do you evaluate a biotech company with no revenue?', tip: 'Pipeline value, probability of success, and market size per indication.' },
    { question: 'Should a pharma company develop a drug in-house or license it?', tip: 'Compare R&D costs, time, expertise, and revenue-sharing models.' },
    { question: 'How would you price a gene therapy that cures a disease?', tip: 'Value-based pricing, outcomes data, and payer willingness.' },
    { question: 'What makes a biotech IPO successful?', tip: 'Phase 2+ data, strong KOLs, clear market, and capital runway.' },
    { question: 'How would you accelerate clinical trial enrollment?', tip: 'Decentralized trials, patient advocacy, and site optimization.' },
  ],
  neuroscience: [
    { question: 'How would you commercialize a brain-computer interface?', tip: 'Start with medical applications, then consumer. Focus on FDA path.' },
    { question: 'What\'s the TAM for digital mental health solutions?', tip: 'Prevalence rates × treatment gap × willingness to pay.' },
    { question: 'Should a neurotech company pursue B2B or B2C first?', tip: 'B2B for enterprise wellness; B2C for consumer brain training.' },
    { question: 'How do you prove ROI for a cognitive training app?', tip: 'Clinical studies, employer productivity data, and user retention metrics.' },
    { question: 'What regulatory path would you take for a neurostimulation device?', tip: '510(k) vs PMA, predicate devices, and clinical evidence requirements.' },
  ],
  ev: [
    { question: 'How would you choose a location for an EV gigafactory?', tip: 'Supply chain proximity, labor, incentives, energy costs, and logistics.' },
    { question: 'Tesla vs. legacy automakers — who wins in 2030?', tip: 'Software edge, charging network, scale, and brand loyalty.' },
    { question: 'How would you size the EV charging market in a city?', tip: 'EV registrations × charging needs × utilization rates.' },
    { question: 'Should an EV company make its own batteries?', tip: 'Vertical integration: cost control vs capital intensity vs flexibility.' },
    { question: 'How do you make EVs affordable for the mass market?', tip: 'Battery cost reduction, simplified design, and financing models.' },
  ],
  cleanenergy: [
    { question: 'How would you finance a $500M solar farm?', tip: 'Project finance, tax equity, PPAs, and green bonds.' },
    { question: 'What\'s the levelized cost of energy for offshore wind?', tip: 'Capex, capacity factor, O&M costs, and project lifetime.' },
    { question: 'Should a utility invest in storage or generation?', tip: 'Grid needs, peak demand, renewable intermittency, and ROI timeline.' },
    { question: 'How would you convince a state to adopt clean energy policy?', tip: 'Jobs data, cost savings, health benefits, and energy security.' },
    { question: 'What makes a clean energy startup investable?', tip: 'Technology readiness, unit economics, scalability, and policy tailwinds.' },
  ],
  agtech: [
    { question: 'How would you convince a farmer to adopt precision agriculture?', tip: 'ROI proof, ease of use, crop yield data, and peer testimonials.' },
    { question: 'What\'s the market size for vertical farming?', tip: 'Urban population × premium produce demand × year-round growing.' },
    { question: 'Should an agtech company own farms or sell to farmers?', tip: 'Asset-light SaaS vs vertically integrated — capital needs differ.' },
    { question: 'How do you reduce food waste by 30% using technology?', tip: 'Supply chain visibility, demand forecasting, and cold chain optimization.' },
    { question: 'What makes agricultural data valuable?', tip: 'Granularity, historical depth, geographic coverage, and actionable insights.' },
  ],
  climatetech: [
    { question: 'How do you make carbon credits trustworthy?', tip: 'MRV technology, third-party verification, and blockchain transparency.' },
    { question: 'Should a company buy offsets or invest in direct reduction?', tip: 'Timeline, credibility, regulatory requirements, and cost comparison.' },
    { question: 'How would you size the carbon removal market?', tip: 'Gigatons needed × cost per ton × corporate commitments.' },
    { question: 'What makes a climate tech company venture-backable?', tip: 'Massive TAM, technology edge, unit economics path, and team.' },
    { question: 'How would you prioritize climate interventions with a $1B budget?', tip: 'Impact per dollar, scalability, and time to deployment.' },
  ],
  cybersecurity: [
    { question: 'How would you build a security operations center from scratch?', tip: 'People, process, technology stack, and 24/7 coverage model.' },
    { question: 'What\'s the cost of a data breach for a mid-size company?', tip: 'Direct costs, regulatory fines, reputation damage, and lost business.' },
    { question: 'Should a company use a MSSP or build in-house security?', tip: 'Compare expertise, cost, control, and response time.' },
    { question: 'How would you sell zero-trust architecture to a CEO?', tip: 'Business risk reduction, insurance savings, and compliance benefits.' },
    { question: 'How do you prioritize vulnerabilities when you have 10,000?', tip: 'CVSS scores, exploitability, asset criticality, and threat intelligence.' },
  ],
  spacetech: [
    { question: 'How would you monetize satellite data?', tip: 'Government contracts, agriculture, insurance, logistics, and defense.' },
    { question: 'Build vs buy for a small satellite constellation?', tip: 'Compare COTS components, custom builds, and time-to-orbit.' },
    { question: 'What\'s the business case for in-space manufacturing?', tip: 'Unique materials, pharma crystals, fiber optics in microgravity.' },
    { question: 'How would you size the space tourism market?', tip: 'HNW individuals × willingness to pay × flight frequency.' },
    { question: 'Should a space company go public or stay private?', tip: 'Capital needs, revenue predictability, and investor appetite.' },
  ],
  robotics: [
    { question: 'How would you calculate ROI for warehouse robots?', tip: 'Labor cost savings, throughput increase, error reduction, and payback period.' },
    { question: 'Should a robotics company sell hardware or RaaS?', tip: 'Recurring revenue vs upfront capital; customer preference and financing.' },
    { question: 'How do you design a robot that works safely alongside humans?', tip: 'Force limiting, vision systems, predictable motion, and standards.' },
    { question: 'What\'s the TAM for surgical robotics?', tip: 'Procedures suitable × hospital adoption rate × system price.' },
    { question: 'How would you enter the agricultural robotics market?', tip: 'Start with high-value crops, prove ROI, then expand to staples.' },
  ],
  healthtech: [
    { question: 'How would you get a hospital to adopt your healthtech product?', tip: 'Clinical evidence, workflow integration, ROI data, and champion physicians.' },
    { question: 'Should a healthtech company pursue FDA clearance?', tip: 'Clinical claims, reimbursement, credibility, and competitive positioning.' },
    { question: 'How do you size the remote patient monitoring market?', tip: 'Chronic disease patients × eligible for RPM × reimbursement rates.' },
    { question: 'What makes a digital health startup defensible?', tip: 'Clinical data moat, payer relationships, and regulatory approvals.' },
    { question: 'How would you reduce hospital readmissions using technology?', tip: 'Predictive models, remote monitoring, care coordination, and patient engagement.' },
  ],
  logistics: [
    { question: 'How would you optimize last-mile delivery in a dense city?', tip: 'Micro-fulfillment, route optimization, EVs, and crowd-sourcing.' },
    { question: 'Should a logistics company build its own fleet or use contractors?', tip: 'Control, cost, scalability, and regulatory considerations.' },
    { question: 'How do you reduce supply chain disruption risk?', tip: 'Diversification, visibility platforms, safety stock, and nearshoring.' },
    { question: 'What\'s the business case for autonomous trucks?', tip: 'Driver cost savings, utilization, safety, and regulatory timeline.' },
    { question: 'How would you size the cold chain logistics market?', tip: 'Pharma + food volumes × temperature-sensitive % × cost per unit.' },
  ],
  web3: [
    { question: 'How would you explain DeFi to a traditional banker?', tip: 'Compare to existing financial services but with smart contracts and transparency.' },
    { question: 'What makes a blockchain L2 solution valuable?', tip: 'Transaction throughput, cost reduction, security inheritance, and ecosystem.' },
    { question: 'Should a company launch a token for its protocol?', tip: 'Utility, regulatory risk, community alignment, and tokenomics design.' },
    { question: 'How do you evaluate an NFT marketplace\'s viability?', tip: 'Transaction volume, creator ecosystem, and fee structure sustainability.' },
    { question: 'How would you size the institutional crypto custody market?', tip: 'AUM in crypto × institutional % × custody fee rates.' },
  ],
};

// MCQ Practice questions (Stage 3) - sample per industry
export const MCQ_QUESTIONS: Record<string, MCQQuestion[]> = {
  aerospace: [
    { question: 'An interviewer asks "Walk me through how you\'d analyze why an airline is losing money." What\'s the best opening?', options: ['Jump straight into fuel costs since that\'s the biggest expense', 'Ask clarifying questions, then structure into Revenue vs Costs', 'Talk about your passion for aviation first', 'List every possible reason you can think of'], correctIndex: 1, explanation: 'Always clarify scope first, then show a structured framework. This signals you think before you speak.' },
    { question: 'How many commercial airports are there in the USA?', options: ['About 200', 'About 500', 'About 5,000', 'About 20,000'], correctIndex: 2, explanation: 'There are roughly 5,000 public airports in the US, about 500 with commercial service. Market sizing tip: start from population and work down.' },
    { question: 'A client asks you to estimate Boeing\'s annual revenue. Best approach?', options: ['Google it on your phone', 'Estimate: ~800 planes/year × ~$100M avg price = ~$80B', 'Say "I don\'t know exact numbers"', 'Compare it to Apple\'s revenue'], correctIndex: 1, explanation: 'Back-of-envelope math shows analytical thinking. Boeing delivers ~700-800 planes/year, average selling price ~$100M, so ~$70-80B is in the right range.' },
  ],
  ai: [
    { question: 'How would you estimate the market size for AI coding assistants?', options: ['Look at GitHub\'s user count and multiply by $20/month', 'Start with global developers (~30M), segment by willingness to pay, and apply adoption rate', 'Compare to the IDE market size', 'Ask the interviewer for the answer'], correctIndex: 1, explanation: 'Bottom-up sizing: Total developers × segment adoption × price point gives a defensible estimate.' },
    { question: 'An AI startup has 10x more users but 2x less revenue than its competitor. What should you investigate first?', options: ['Whether they have a freemium model with low conversion', 'Their office space costs', 'How many employees they have', 'Their social media following'], correctIndex: 0, explanation: 'The user-revenue disconnect strongly suggests a monetization/conversion issue, likely a generous free tier.' },
    { question: 'If training a large AI model costs $100M, what\'s the minimum revenue needed per year to justify the investment over 3 years?', options: ['$33M/year', '$50M/year (with profit margin)', '$100M/year', '$10M/year'], correctIndex: 1, explanation: 'At minimum: $100M ÷ 3 = $33M just to break even on training. With operating costs and margin, ~$50M+ is more realistic.' },
  ],
  fintech: [
    { question: 'A neobank has 5 million users but isn\'t profitable. What\'s the FIRST thing you\'d analyze?', options: ['Revenue per user vs. cost to serve per user', 'The CEO\'s background', 'How many physical branches they have', 'Their app store rating'], correctIndex: 0, explanation: 'Unit economics (revenue per user vs. cost per user) is the foundation of fintech profitability analysis.' },
    { question: 'If a payment processor charges 2.9% per transaction, how much does it make on $1 billion in transactions?', options: ['$2.9 million', '$29 million', '$290 million', '$2.9 billion'], correctIndex: 1, explanation: '$1B × 2.9% = $29M. Quick mental math: 1% of $1B = $10M, so ~3% ≈ $30M.' },
    { question: 'Which metric best indicates a fintech company\'s health?', options: ['Number of app downloads', 'Monthly Active Users (MAU) and transaction volume', 'Total funding raised', 'Number of employees'], correctIndex: 1, explanation: 'Active engagement and actual transaction volume show real product-market fit, not vanity metrics.' },
  ],
};

// Default MCQ for industries without specific ones
export const DEFAULT_MCQ: MCQQuestion[] = [
  { question: 'An interviewer asks "Tell me about yourself." What\'s the best structure?', options: ['Start from childhood', 'Present → Past → Future (2 minutes max)', 'Read your resume out loud', 'Ask them to go first'], correctIndex: 1, explanation: 'The Present-Past-Future format is concise and compelling: where you are now, how you got here, and where you\'re headed.' },
  { question: 'You don\'t know the answer to a technical question. Best response?', options: ['"I don\'t know"', '"Great question — here\'s how I\'d think about it..." then reason through it', 'Change the subject', 'Make up an answer confidently'], correctIndex: 1, explanation: 'Showing your thought process is more valuable than knowing every answer. Interviewers test HOW you think.' },
  { question: 'An interviewer says "Any questions for us?" What should you ask?', options: ['"What\'s the salary?"', '"What does success look like in this role in the first 90 days?"', '"No, I\'m good"', '"When do I start?"'], correctIndex: 1, explanation: 'This shows you\'re thinking about impact and have a growth mindset. Always have 2-3 thoughtful questions prepared.' },
];

// Mental Math questions
export const MENTAL_MATH: Record<string, MentalMathQuestion[]> = {
  aerospace: [
    { question: 'A plane has 200 seats, 80% occupancy, and $300 avg ticket. What\'s the revenue per flight?', options: ['$36,000', '$48,000', '$60,000', '$24,000'], correctIndex: 1, explanation: '200 × 0.8 × $300 = $48,000' },
    { question: 'If a rocket costs $60M per launch and carries 20 satellites, what\'s the cost per satellite?', options: ['$1M', '$2M', '$3M', '$4M'], correctIndex: 2, explanation: '$60M ÷ 20 = $3M per satellite' },
  ],
  ai: [
    { question: 'An AI API costs $0.01 per query. A company makes 10 million queries/month. Monthly cost?', options: ['$10,000', '$100,000', '$1,000,000', '$50,000'], correctIndex: 1, explanation: '10,000,000 × $0.01 = $100,000' },
    { question: 'If an AI model improves a worker\'s productivity by 20% and they earn $80K/year, what\'s the annual value per worker?', options: ['$8,000', '$12,000', '$16,000', '$20,000'], correctIndex: 2, explanation: '$80K × 20% = $16,000 value per worker per year' },
  ],
  fintech: [
    { question: 'A lending app has $100M in loans at 8% interest. Annual interest income?', options: ['$4M', '$6M', '$8M', '$12M'], correctIndex: 2, explanation: '$100M × 8% = $8M' },
    { question: 'If 2% of $50M in transactions are fraudulent, what\'s the fraud loss?', options: ['$500K', '$1M', '$2M', '$5M'], correctIndex: 1, explanation: '$50M × 2% = $1M' },
  ],
};

// Mock Lab prompts (Stage 4)
export const MOCK_PROMPTS: Record<string, MockPrompt[]> = {
  aerospace: [
    { scenario: 'You\'re consulting for a regional airline that\'s losing $10M/year.', question: 'Walk me through how you\'d identify the top 3 areas to cut costs — WITHOUT reducing flight quality.', buzzwords: ['load factor', 'fuel hedging', 'route optimization', 'fleet utilization', 'OEM', 'MRO', 'ancillary revenue', 'yield management'], sampleAnswer: 'First, I\'d analyze the cost structure by looking at fuel (typically 30-35% of costs), labor, and maintenance. Second, I\'d examine route profitability to cut underperforming routes. Third, I\'d look at fleet utilization — are planes sitting idle?' },
    { scenario: 'SpaceX just announced a 30% price cut for satellite launches.', question: 'You\'re advising a competing launch provider. What\'s your strategic recommendation?', buzzwords: ['vertical integration', 'rideshare', 'payload capacity', 'reusability', 'launch cadence', 'constellation'], sampleAnswer: 'First, I\'d assess our cost structure to find where we can compete. Second, I\'d explore differentiation — maybe reliability, specific orbits, or faster timelines. Third, I\'d consider partnering with satellite manufacturers for bundled deals.' },
  ],
  ai: [
    { scenario: 'An enterprise software company is considering adding AI features to its product.', question: 'Should they build their own AI model or integrate an existing one? Walk me through your framework.', buzzwords: ['fine-tuning', 'API', 'data moat', 'inference cost', 'latency', 'hallucination', 'RAG', 'embedding'], sampleAnswer: 'First, I\'d evaluate their data assets — if they have proprietary data, building makes more sense. Second, I\'d compare build costs vs API costs at their scale. Third, I\'d assess competitive dynamics — is AI a core differentiator or a feature?' },
    { scenario: 'A hospital wants to deploy AI for diagnosing X-rays.', question: 'What are the key risks and how would you mitigate them?', buzzwords: ['FDA clearance', 'bias', 'sensitivity', 'specificity', 'clinical validation', 'radiologist', 'liability'], sampleAnswer: 'First, I\'d address regulatory risk — FDA 510(k) or De Novo pathway. Second, I\'d mitigate bias by ensuring diverse training data. Third, I\'d design it as a decision support tool, keeping radiologists in the loop.' },
  ],
  fintech: [
    { scenario: 'A traditional bank wants to launch a digital-only sub-brand targeting Gen Z.', question: 'Design the go-to-market strategy.', buzzwords: ['CAC', 'LTV', 'viral loop', 'neobank', 'embedded finance', 'debit card', 'social features', 'gamification'], sampleAnswer: 'First, I\'d identify the value proposition — what does Gen Z want that existing banks don\'t offer? Second, I\'d design a referral-first acquisition strategy. Third, I\'d plan the product roadmap starting with a debit card and savings features.' },
    { scenario: 'A BNPL (Buy Now Pay Later) company is facing increasing default rates.', question: 'How would you restructure their risk model?', buzzwords: ['credit scoring', 'default rate', 'underwriting', 'collections', 'merchant', 'APR', 'late fees'], sampleAnswer: 'First, I\'d analyze default patterns by customer segment and merchant category. Second, I\'d tighten underwriting criteria for high-risk segments. Third, I\'d implement dynamic credit limits based on repayment behavior.' },
  ],
};

// Default mock prompts
export const DEFAULT_MOCK_PROMPTS: MockPrompt[] = [
  { scenario: 'You\'re interviewing for a strategy role at a fast-growing tech company.', question: 'Tell me about a time you led a team through a difficult challenge.', buzzwords: ['leadership', 'stakeholder', 'KPI', 'pivot', 'iteration', 'cross-functional'], sampleAnswer: 'Using the STAR method: Situation — our product launch was delayed by 3 weeks. Task — I needed to coordinate 4 teams to hit a revised deadline. Action — I set up daily stand-ups and identified the critical path. Result — we launched 2 days early with 95% feature completion.' },
  { scenario: 'You\'re consulting for a company entering a new market.', question: 'How would you determine if this market is worth entering?', buzzwords: ['TAM', 'SAM', 'SOM', 'competitive landscape', 'barriers to entry', 'market sizing', 'unit economics'], sampleAnswer: 'First, I\'d size the market using top-down and bottom-up approaches. Second, I\'d map the competitive landscape and identify white space. Third, I\'d build a P&L model to test unit economics at different market share scenarios.' },
];

// Academic path: Values & Impact questions
export const ACADEMIC_QUESTIONS: Record<string, MCQQuestion[]> = {
  aerospace: [
    { question: 'A scholarship asks "Why aerospace?" Which answer shows the most impact?', options: ['I\'ve loved planes since I was a kid', 'I want to make space access affordable so developing nations can launch weather satellites for climate resilience', 'The pay in aerospace is really good', 'My parents want me to be an engineer'], correctIndex: 1, explanation: 'Impact storytelling connects your passion to a real-world problem. "Affordable space for climate resilience" shows vision and social awareness.' },
  ],
  ai: [
    { question: 'An admissions essay asks about AI ethics. Best framing?', options: ['AI is dangerous and should be regulated', 'I believe in building AI that augments human capability while ensuring fairness and accountability', 'AI will replace all jobs', 'I haven\'t thought about ethics much'], correctIndex: 1, explanation: 'Balanced, constructive framing shows maturity. Mentioning specific values (fairness, accountability) demonstrates genuine thought.' },
  ],
  fintech: [
    { question: 'A scholarship asks how fintech can change the world. Best answer approach?', options: ['Talk about becoming rich in fintech', 'Share how 1.4 billion unbanked adults could access financial services through mobile money', 'Discuss cryptocurrency prices', 'Say you want to work at a bank'], correctIndex: 1, explanation: 'Financial inclusion is a powerful narrative. Using specific data (1.4B unbanked) shows you\'ve done your research.' },
  ],
};

export function getMCQForMarket(marketId: string): MCQQuestion[] {
  return MCQ_QUESTIONS[marketId] || DEFAULT_MCQ;
}

export function getMockPromptsForMarket(marketId: string): MockPrompt[] {
  return MOCK_PROMPTS[marketId] || DEFAULT_MOCK_PROMPTS;
}

export function getMentalMathForMarket(marketId: string): MentalMathQuestion[] {
  return MENTAL_MATH[marketId] || MENTAL_MATH['ai'] || [];
}

export function getAcademicQuestionsForMarket(marketId: string): MCQQuestion[] {
  return ACADEMIC_QUESTIONS[marketId] || DEFAULT_MCQ;
}
