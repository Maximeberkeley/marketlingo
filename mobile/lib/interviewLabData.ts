// Interview Lab - Types, personas, and local data fallbacks
// Questions are now fetched from Supabase; this file contains types and constants only.
// ============================================================

export type InterviewPath = 'consulting' | 'academic';
export type InterviewStage = 1 | 2 | 3 | 4;
export type InterviewPersona = 'consultant' | 'tech_lead' | 'recruiter';

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
  id?: string;
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
  id?: string;
  scenario: string;
  question: string;
  buzzwords: string[];
  sampleAnswer: string;
  heroProblem?: string;
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

// ─── NEW PERSONAS ───
export const INTERVIEW_PERSONAS: Record<InterviewPersona, {
  label: string;
  icon: string;
  description: string;
  reviewFocus: string;
  color: string;
}> = {
  consultant: {
    label: 'The Consultant',
    icon: 'briefcase',
    description: 'Frameworks, ROI, and structured thinking.',
    reviewFocus: 'MECE logic, quantitative reasoning, and business impact',
    color: '#7C3AED',
  },
  tech_lead: {
    label: 'The Tech Lead',
    icon: 'cpu',
    description: 'Deep-dives into specs and compliance.',
    reviewFocus: 'technical accuracy, regulatory compliance, and engineering trade-offs',
    color: '#3B82F6',
  },
  recruiter: {
    label: 'The Recruiter',
    icon: 'users',
    description: 'Cultural fit and behavioral answers.',
    reviewFocus: 'storytelling, teamwork, growth mindset, and authenticity',
    color: '#10B981',
  },
};

// Legacy type kept for backwards compatibility
export type ConfidencePersona = 'humble_leader' | 'tech_genius' | 'creative_dreamer';
export const CONFIDENCE_PERSONAS = INTERVIEW_PERSONAS;

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

// Top 5 "Big Boss" questions — now fetched from DB, kept as fallback
export const BIG_BOSS_QUESTIONS: Record<string, BigBossQuestion[]> = {
  aerospace: [
    { question: 'How would you reduce the cost of a satellite launch by 40%?', tip: 'Think reusable rockets, rideshare missions, and manufacturing at scale.' },
    { question: 'Boeing vs Airbus — who wins the next decade and why?', tip: 'Consider order backlogs, production capacity, and innovation pipeline.' },
    { question: 'Should an airline buy or lease its fleet?', tip: 'Compare capital efficiency, flexibility, and maintenance costs.' },
    { question: 'How would you pitch a new drone delivery service to the FAA?', tip: 'Focus on safety data, airspace management, and public benefit.' },
    { question: 'What makes supersonic travel economically viable in 2025?', tip: 'Think fuel efficiency, route selection, and premium market sizing.' },
  ],
};

// ─── Helper functions to parse DB questions into local types ───

export function dbToMockPrompt(row: any): MockPrompt {
  return {
    id: row.id,
    scenario: row.scenario || '',
    question: row.question,
    buzzwords: row.buzzwords || [],
    sampleAnswer: row.sample_answer || '',
    heroProblem: row.hero_problem || '',
  };
}

export function dbToMCQ(row: any): MCQQuestion {
  const opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
  return {
    id: row.id,
    question: row.question,
    options: opts,
    correctIndex: row.correct_index ?? 0,
    explanation: row.explanation || '',
  };
}

export function dbToMentalMath(row: any): MentalMathQuestion {
  const opts = typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || []);
  return {
    question: row.question,
    options: opts,
    correctIndex: row.correct_index ?? 0,
    explanation: row.explanation || '',
  };
}

export function dbToBigBoss(row: any): BigBossQuestion {
  return {
    question: row.question,
    tip: row.explanation || '',
  };
}

// ─── Role-track mock questions (on-device bank) ───
// Technical and behavioral questions by market. Technical roles never get
// consulting cases or mental math; these fill the gap until the question table
// carries enough rows for the track.
export type TrackKey = 'technical' | 'behavioral';
export const TRACK_MOCKS: Record<string, Partial<Record<TrackKey, Omit<MockPrompt, 'sampleAnswer'>[]>>> = {
  aerospace: {
    technical: [
      { id: 'aero-tech-1', scenario: 'Your team is adding a new software feature to a flight control computer.', question: 'How would you show the certification authority that this software is safe to fly?', buzzwords: ['design assurance level', 'requirements traceability', 'verification', 'structural coverage', 'certification plan'] },
      { id: 'aero-tech-2', scenario: 'A supplier part fails a fatigue test late in the program.', question: 'Walk me through how you would find the root cause and decide what to do next.', buzzwords: ['root cause analysis', 'fatigue life', 'test evidence', 'margin of safety', 'corrective action'] },
      { id: 'aero-tech-3', scenario: 'Engineers want a lighter composite panel, but the stress team is worried.', question: 'How would you weigh the weight saving against the risk?', buzzwords: ['trade study', 'damage tolerance', 'weight budget', 'inspection interval', 'failure mode'] },
      { id: 'aero-tech-4', scenario: 'A sensor gives a wrong reading during a test flight and the system reacts to it.', question: 'How would you redesign the system so one bad sensor cannot cause harm?', buzzwords: ['redundancy', 'voting logic', 'single point of failure', 'fault detection', 'safety assessment'] },
      { id: 'aero-tech-5', scenario: 'You join a satellite team two months before launch.', question: 'What tests would you insist on before the satellite ships to the launch site?', buzzwords: ['thermal vacuum', 'vibration test', 'acceptance test', 'test campaign', 'flight readiness'] },
      { id: 'aero-tech-6', scenario: 'A change request arrives that touches wiring in an aircraft already in service.', question: 'How do you keep the change safe and fully documented?', buzzwords: ['configuration control', 'change impact', 'airworthiness', 'service bulletin', 'regression testing'] },
      { id: 'aero-tech-7', scenario: 'Production keeps finding the same drilling defect on one assembly.', question: 'How would you fix the process, not just the parts?', buzzwords: ['process capability', 'first article inspection', 'nonconformance', 'standard work', 'quality escape'] },
      { id: 'aero-tech-8', scenario: 'A new engine control update saves fuel but changes how the engine responds.', question: 'How would you prove the update is ready for line pilots?', buzzwords: ['flight test', 'envelope', 'human factors', 'simulation', 'acceptance criteria'] },
      { id: 'aero-tech-9', scenario: 'Your drone program needs approval to fly beyond the pilot’s line of sight.', question: 'What technical case would you build for the regulator?', buzzwords: ['detect and avoid', 'risk assessment', 'command and control link', 'operational limits', 'safety case'] },
      { id: 'aero-tech-10', scenario: 'Two teams disagree on whether a requirement is testable.', question: 'How would you rewrite the requirement and settle the disagreement?', buzzwords: ['verifiable requirement', 'acceptance criteria', 'interface control', 'systems engineering', 'traceability'] },
    ],
    behavioral: [
      { id: 'aero-beh-1', scenario: 'Interviewers want to see how you handle safety pressure.', question: 'Tell me about a time you raised a concern when others wanted to move faster.', buzzwords: ['safety culture', 'escalation', 'evidence', 'stakeholder', 'outcome'] },
      { id: 'aero-beh-2', scenario: 'Aerospace programs run for years with many teams.', question: 'Tell me about a time you worked with a team you did not control to hit a deadline.', buzzwords: ['cross-functional', 'alignment', 'schedule', 'trade-off', 'result'] },
      { id: 'aero-beh-3', scenario: 'Mistakes in this industry must be reported, not hidden.', question: 'Tell me about a mistake you made and what you changed afterwards.', buzzwords: ['ownership', 'root cause', 'lesson learned', 'process change', 'transparency'] },
      { id: 'aero-beh-4', scenario: 'The role involves explaining technical work to non-engineers.', question: 'Tell me about a time you explained something complex to someone without your background.', buzzwords: ['clarity', 'audience', 'simplify', 'decision', 'feedback'] },
      { id: 'aero-beh-5', scenario: 'Plans change when tests fail.', question: 'Tell me about a time a plan fell apart and how you recovered.', buzzwords: ['adaptability', 'prioritisation', 'recovery plan', 'communication', 'result'] },
      { id: 'aero-beh-6', scenario: 'They want to know why you chose this industry.', question: 'Why aerospace, and what part of it do you want to own in five years?', buzzwords: ['motivation', 'specific interest', 'career path', 'impact', 'learning'] },
    ],
  },
};

/** On-device mocks for a market and role track ('case' and role-neutral use the question table). */
export function trackMocks(marketId: string | null | undefined, track: string | null | undefined): MockPrompt[] {
  if (!marketId || (track !== 'technical' && track !== 'behavioral')) return [];
  return (TRACK_MOCKS[marketId]?.[track] || []).map(m => ({ ...m, sampleAnswer: '' }));
}
