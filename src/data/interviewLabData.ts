/**
 * Interview Lab 2.0 - Data & Types
 * Career Accelerator for college students & young professionals
 */

export type InterviewPath = 'consulting' | 'academic';
export type InterviewStage = 1 | 2 | 3 | 4 | 5 | 6;
export type ConfidencePersona = 'humble_leader' | 'tech_genius' | 'creative_dreamer';

export interface FrameworkStep {
  letter: string;
  label: string;
  prompt: string;
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

export interface MockPrompt {
  scenario: string;
  question: string;
  buzzwords: string[];
}

export interface CaseStudyTurn {
  role: 'sophia' | 'user';
  prompt: string;
  hints?: string[];
  expectedKeywords?: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  industry: string;
  turns: CaseStudyTurn[];
  summary: string;
}

// ─── Stage Labels ───
export const STAGE_LABELS: Record<InterviewStage, { label: string; icon: string; description: string }> = {
  1: { label: 'Framework', icon: 'layers', description: 'Master the MECE / Story Hero method' },
  2: { label: 'Expect', icon: 'eye', description: 'Top questions & mental math' },
  3: { label: 'Practice', icon: 'check-circle', description: 'MCQ drills & case practice' },
  4: { label: 'Mock Lab', icon: 'mic', description: 'AI interview with Sophia' },
  5: { label: 'Case Sim', icon: 'briefcase', description: 'Multi-turn case interviews' },
  6: { label: 'Analytics', icon: 'bar-chart-2', description: 'Performance & leaderboard' },
};

// ─── Confidence Personas ───
export const CONFIDENCE_PERSONAS: Record<ConfidencePersona, { label: string; emoji: string; description: string }> = {
  humble_leader: { label: 'Humble Leader', emoji: '🤝', description: 'Collaborative, team-focused language' },
  tech_genius: { label: 'Tech Genius', emoji: '🧠', description: 'Data-driven, analytical approach' },
  creative_dreamer: { label: 'Creative Dreamer', emoji: '🎨', description: 'Innovative, vision-focused narrative' },
};

// ─── Story Hero Steps (Academic Path) ───
export const STORY_HERO_STEPS: FrameworkStep[] = [
  { letter: 'S', label: 'Setup', prompt: 'Set the scene — when, where, what role?', example: 'During my junior year, I led a team of 5 in our campus sustainability initiative...' },
  { letter: 'T', label: 'Tension', prompt: 'What was the challenge or conflict?', example: 'We discovered our proposal conflicted with the administration\'s budget constraints...' },
  { letter: 'A', label: 'Action', prompt: 'What did YOU specifically do?', example: 'I organized a data-driven presentation showing long-term cost savings...' },
  { letter: 'R', label: 'Result', prompt: 'What was the measurable outcome?', example: 'The program was approved, reducing campus waste by 30% and saving $50K annually.' },
];

// ─── MECE Frameworks by industry ───
export const MECE_FRAMEWORKS: Record<string, { label: string; branches: string[]; example: string }> = {
  aerospace: { label: 'Should SpaceX enter the satellite internet market?', branches: ['Market size & demand', 'Technology readiness', 'Competition (Starlink vs OneWeb)', 'Regulatory barriers'], example: 'Notice how each branch is independent and together they cover ALL angles.' },
  'artificial-intelligence': { label: 'Should an AI startup build B2B or B2C?', branches: ['Revenue model viability', 'Customer acquisition cost', 'Data moat potential', 'Regulatory risk'], example: 'B2B and B2C are mutually exclusive paths — classic MECE split.' },
  fintech: { label: 'How should a neobank expand to new markets?', branches: ['Market selection criteria', 'Licensing & compliance', 'Product-market fit', 'Go-to-market strategy'], example: 'Each branch addresses a distinct decision area without overlap.' },
  biotech: { label: 'Should a pharma company acquire a gene therapy startup?', branches: ['Pipeline synergy', 'Valuation & deal structure', 'Regulatory pathway', 'Integration risk'], example: 'M&A cases naturally split into these 4 MECE buckets.' },
  cybersecurity: { label: 'How to prioritize a $10M security budget?', branches: ['Prevention tools', 'Detection & response', 'Compliance & training', 'Insurance & recovery'], example: 'Budget allocation forces MECE thinking — every dollar goes to ONE bucket.' },
};

// Fallback for industries not listed
const DEFAULT_MECE = { label: 'Should a company enter a new market?', branches: ['Market attractiveness', 'Competitive landscape', 'Internal capabilities', 'Financial viability'], example: 'This 4-part framework works for ANY market entry case.' };

// ─── Big Boss Questions ───
export const BIG_BOSS_QUESTIONS: Record<string, BigBossQuestion[]> = {
  aerospace: [
    { question: 'How would you evaluate the ROI of a new aircraft program?', tip: 'Think lifecycle: R&D, certification, production ramp, aftermarket revenue' },
    { question: 'What factors drive airline fleet decisions?', tip: 'Consider fuel efficiency, route network, maintenance costs, and passenger experience' },
    { question: 'How is the space economy evolving?', tip: 'Segment into launch services, satellites, ground infrastructure, and space tourism' },
    { question: 'What makes defense procurement different from commercial?', tip: 'Highlight government contracting, ITAR regulations, and long development cycles' },
    { question: 'How would you assess a satellite constellation business model?', tip: 'Focus on unit economics: cost per satellite, bandwidth capacity, and customer acquisition' },
  ],
  fintech: [
    { question: 'How do you evaluate a payment company\'s moat?', tip: 'Network effects, regulatory licenses, merchant relationships, and switching costs' },
    { question: 'What\'s driving the BNPL trend and where is it heading?', tip: 'Consumer behavior shifts, credit risk, regulation, and merchant adoption' },
    { question: 'How would you build a risk model for a lending startup?', tip: 'Alternative data sources, ML vs traditional scoring, and regulatory compliance' },
    { question: 'What makes embedded finance a $7T opportunity?', tip: 'Distribution advantage, API infrastructure, and vertical-specific solutions' },
    { question: 'How is crypto regulation shaping institutional adoption?', tip: 'Custody solutions, ETF approvals, stablecoin regulation, and DeFi compliance' },
  ],
};

const DEFAULT_BIG_BOSS: BigBossQuestion[] = [
  { question: 'What\'s the biggest disruption risk in your industry?', tip: 'Think technology, regulation, consumer behavior, and new entrants' },
  { question: 'How would you size this market?', tip: 'Top-down (TAM → SAM → SOM) or bottom-up (unit economics × addressable customers)' },
  { question: 'Walk me through a competitive analysis framework.', tip: 'Porter\'s 5 Forces + value chain analysis + strategic group mapping' },
  { question: 'How do you prioritize growth initiatives?', tip: 'ICE framework: Impact × Confidence × Ease. Quantify each dimension.' },
  { question: 'What metrics would you track for this business?', tip: 'Unit economics (CAC, LTV, payback), engagement (DAU/MAU), and financial (ARR, margins)' },
];

// ─── MCQ Questions ───
export const MCQ_QUESTIONS: Record<string, MCQQuestion[]> = {
  fintech: [
    { question: 'What is the typical CAC:LTV ratio target for a fintech startup?', options: ['1:1', '1:3', '1:5', '1:10'], correctIndex: 1, explanation: 'A 1:3 ratio means each customer generates 3x the cost to acquire them — the gold standard for sustainable growth.' },
    { question: 'Which metric best indicates product-market fit for a neobank?', options: ['Total users', 'Daily active users', 'Deposit growth rate', 'App downloads'], correctIndex: 2, explanation: 'Deposit growth shows real trust and engagement — users voting with their money.' },
    { question: 'What\'s the primary revenue model for a payment processor?', options: ['Subscription fees', 'Transaction fees (MDR)', 'Interest income', 'Data licensing'], correctIndex: 1, explanation: 'Merchant Discount Rate (MDR) is typically 1.5-3% per transaction — the core business model.' },
  ],
  aerospace: [
    { question: 'What\'s the typical development timeline for a new commercial aircraft?', options: ['2-3 years', '5-7 years', '10-15 years', '20+ years'], correctIndex: 1, explanation: 'From concept to first delivery, 5-7 years is typical (Boeing 787 took ~8 years).' },
    { question: 'Which factor most influences airline profitability?', options: ['Ticket prices', 'Fuel costs', 'Load factor', 'Aircraft type'], correctIndex: 2, explanation: 'Load factor (% of seats filled) is the single biggest driver — airlines need 75-85% to break even.' },
    { question: 'What percentage of satellite launches are now commercial?', options: ['~20%', '~40%', '~60%', '~80%'], correctIndex: 2, explanation: 'Commercial launches now dominate at ~60%, driven by SpaceX and constellation deployments.' },
  ],
};

const DEFAULT_MCQ: MCQQuestion[] = [
  { question: 'What framework is most commonly used in case interviews?', options: ['SWOT', 'MECE', 'BCG Matrix', 'Porter\'s 5 Forces'], correctIndex: 1, explanation: 'MECE (Mutually Exclusive, Collectively Exhaustive) is the foundation of structured thinking in consulting.' },
  { question: 'What does TAM stand for?', options: ['Total Adjusted Market', 'Total Addressable Market', 'Target Audience Metric', 'Technology Assessment Model'], correctIndex: 1, explanation: 'Total Addressable Market is the total revenue opportunity if you captured 100% market share.' },
  { question: 'Which is NOT a Porter\'s Five Force?', options: ['Supplier power', 'Threat of substitutes', 'Government regulation', 'Buyer power'], correctIndex: 2, explanation: 'Porter\'s 5 Forces: rivalry, new entrants, substitutes, buyer power, supplier power. Regulation is external.' },
];

// ─── Mental Math ───
export const MENTAL_MATH: Record<string, MentalMathQuestion[]> = {
  fintech: [
    { question: 'A neobank has 2M users with $5K avg deposits. What\'s total deposits?', options: ['$1B', '$10B', '$100B', '$500M'], correctIndex: 1, explanation: '2M × $5K = $10B in total deposits.' },
    { question: 'If a payment processor handles $50B GMV at 2.5% take rate, what\'s revenue?', options: ['$125M', '$500M', '$1.25B', '$2.5B'], correctIndex: 2, explanation: '$50B × 2.5% = $1.25B revenue.' },
  ],
};

// ─── Mock Prompts ───
export const MOCK_PROMPTS: Record<string, MockPrompt[]> = {
  fintech: [
    { scenario: 'A major bank approaches your fintech startup about a partnership to offer BNPL services through their credit card network.', question: 'Walk me through how you\'d evaluate this partnership opportunity.', buzzwords: ['unit economics', 'customer acquisition', 'regulatory risk', 'channel strategy', 'cannibalization'] },
    { scenario: 'Your neobank is growing 15% MoM but burning $3M/month. Investors want a path to profitability.', question: 'What would your 18-month plan look like?', buzzwords: ['burn rate', 'unit economics', 'contribution margin', 'monetization', 'cohort analysis'] },
  ],
  aerospace: [
    { scenario: 'Boeing is considering launching a new narrow-body aircraft to compete with Airbus A321neo.', question: 'Should Boeing proceed? What factors would you analyze?', buzzwords: ['development cost', 'market share', 'production rate', 'fuel efficiency', 'order backlog'] },
    { scenario: 'A satellite company wants to pivot from government contracts to commercial broadband.', question: 'How would you assess this strategic shift?', buzzwords: ['TAM', 'competitive landscape', 'spectrum allocation', 'unit economics', 'regulatory approval'] },
  ],
};

const DEFAULT_MOCK: MockPrompt[] = [
  { scenario: 'A Fortune 500 company is considering entering a new adjacent market. They have strong brand recognition but limited technical expertise in this space.', question: 'How would you structure your analysis for this market entry decision?', buzzwords: ['market sizing', 'competitive advantage', 'build vs buy', 'synergies', 'risk assessment'] },
  { scenario: 'Your client\'s revenue has been flat for 3 quarters despite increasing marketing spend by 40%.', question: 'Walk me through your diagnostic approach.', buzzwords: ['funnel analysis', 'CAC', 'retention', 'product-market fit', 'channel efficiency'] },
];

// ─── Case Studies (Multi-turn) ───
export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'market-entry-saas',
    title: 'SaaS Market Entry',
    difficulty: 'beginner',
    industry: 'general',
    turns: [
      { role: 'sophia', prompt: 'Your client is a $500M enterprise software company considering launching a vertical SaaS product for healthcare. Where would you start your analysis?' },
      { role: 'sophia', prompt: 'Good structure. Let\'s dig into market sizing. How would you estimate the TAM for healthcare SaaS in the US?' },
      { role: 'sophia', prompt: 'Now, what competitive advantages could our client leverage from their existing business?' },
      { role: 'sophia', prompt: 'Final question: What\'s your recommendation — should they enter or not? Synthesize everything.' },
    ],
    summary: 'Classic market entry case testing MECE structure, market sizing, competitive analysis, and synthesis.',
  },
  {
    id: 'profitability-airline',
    title: 'Airline Profitability Crisis',
    difficulty: 'intermediate',
    industry: 'aerospace',
    turns: [
      { role: 'sophia', prompt: 'A mid-size airline has seen profits drop 40% YoY despite passenger numbers remaining stable. What could be going on?' },
      { role: 'sophia', prompt: 'You identified cost increases. Let\'s quantify: fuel is up 25%, labor up 15%, and maintenance up 30%. Which would you prioritize and why?' },
      { role: 'sophia', prompt: 'The CEO asks: should we consider hedging fuel costs? What are the trade-offs?' },
      { role: 'sophia', prompt: 'Synthesize your findings into a 60-second recommendation for the board.' },
    ],
    summary: 'Profitability case combining cost analysis, prioritization, and strategic recommendation.',
  },
  {
    id: 'pricing-fintech',
    title: 'Fintech Pricing Strategy',
    difficulty: 'advanced',
    industry: 'fintech',
    turns: [
      { role: 'sophia', prompt: 'A B2B payments company currently charges 2.9% + $0.30 per transaction. They\'re losing enterprise clients to competitors. How would you approach repricing?' },
      { role: 'sophia', prompt: 'Interesting. Let\'s model it: an enterprise client does 1M transactions/month at $50 avg ticket. What\'s the revenue impact of moving to tiered pricing?' },
      { role: 'sophia', prompt: 'The sales team pushes back — they say enterprise clients want custom pricing, not tiers. How do you resolve this tension?' },
      { role: 'sophia', prompt: 'The CEO wants your final recommendation in under 2 minutes. Go.' },
    ],
    summary: 'Advanced pricing case testing quantitative analysis, stakeholder management, and executive communication.',
  },
];

// ─── Helper functions ───
export function getMECEForMarket(marketId: string) {
  return MECE_FRAMEWORKS[marketId] || DEFAULT_MECE;
}

export function getBigBossForMarket(marketId: string) {
  return BIG_BOSS_QUESTIONS[marketId] || DEFAULT_BIG_BOSS;
}

export function getMCQForMarket(marketId: string) {
  return MCQ_QUESTIONS[marketId] || DEFAULT_MCQ;
}

export function getMentalMathForMarket(marketId: string) {
  return MENTAL_MATH[marketId] || [];
}

export function getMockPromptsForMarket(marketId: string) {
  return MOCK_PROMPTS[marketId] || DEFAULT_MOCK;
}

export function getCaseStudiesForMarket(marketId: string) {
  return CASE_STUDIES.filter(c => c.industry === marketId || c.industry === 'general');
}
