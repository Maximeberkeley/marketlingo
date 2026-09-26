/**
 * The deliverable: one living document per learner, shaped by their goal.
 *
 *  career        → Interview Brief
 *  build_startup → Idea Dossier
 *  invest        → Thesis Sheet
 *  curiosity     → Market Map
 *
 * Every section is filled from the learner's own words — lines they write on
 * consolidation days, notes they keep, calls they defend. Completion is simply
 * how many sections have at least one line in them.
 */
export type DeliverableGoal = 'career' | 'build_startup' | 'invest' | 'curiosity';

export interface DeliverableSection {
  key: string;
  title: string;
  /** What the learner is being asked for, in their words. */
  prompt: string;
}

export interface DeliverableTemplate {
  goal: DeliverableGoal;
  title: string;
  subtitle: string;
  /** What finishing it gets them. */
  payoff: string;
  sections: DeliverableSection[];
}

const TEMPLATES: Record<DeliverableGoal, DeliverableTemplate> = {
  career: {
    goal: 'career',
    title: 'Interview Brief',
    subtitle: 'The document you read on the train to the interview.',
    payoff: 'Finish it and you can talk about this industry for twenty minutes without notes.',
    sections: [
      { key: 'how_money_moves', title: 'How money moves here', prompt: 'In one line: who pays whom, and for what?' },
      { key: 'players', title: 'The players that matter', prompt: 'Name a company and why it holds power.' },
      { key: 'numbers', title: 'Numbers I can quote', prompt: 'One figure you would say out loud, and what it proves.' },
      { key: 'risk', title: 'What keeps them awake', prompt: 'The risk or rule that decides who wins.' },
      { key: 'my_view', title: 'My own view', prompt: 'Something you believe about this industry that others miss.' },
      { key: 'questions', title: 'Questions I would ask them', prompt: 'A question only an insider would think to ask.' },
    ],
  },
  build_startup: {
    goal: 'build_startup',
    title: 'Idea Dossier',
    subtitle: 'The file where industry gaps become a defensible plan.',
    payoff: 'Finish it and you have a real, named gap with evidence behind it.',
    sections: [
      { key: 'gap', title: 'The gap', prompt: 'What is broken or missing here, in one line?' },
      { key: 'who_hurts', title: 'Who feels it', prompt: 'Who loses money or time because of that gap?' },
      { key: 'why_now', title: 'Why now', prompt: 'What changed recently that makes this possible today?' },
      { key: 'money', title: 'Where the money is', prompt: 'Who would pay, and roughly how much?' },
      { key: 'incumbents', title: 'Why the big players have not fixed it', prompt: 'What stops them?' },
      { key: 'first_test', title: 'My first test', prompt: 'The cheapest way to test whether this gap is real.' },
    ],
  },
  invest: {
    goal: 'invest',
    title: 'Thesis Sheet',
    subtitle: 'What you believe, and what would change your mind.',
    payoff: 'Finish it and you hold a thesis you can defend or kill on evidence.',
    sections: [
      { key: 'thesis', title: 'My thesis', prompt: 'In one line: what do you believe will happen here?' },
      { key: 'drivers', title: 'What drives it', prompt: 'The mechanism that would make you right.' },
      { key: 'numbers', title: 'Numbers behind it', prompt: 'A figure that supports the thesis, and its source.' },
      { key: 'risk', title: 'What kills it', prompt: 'The thing that would prove you wrong.' },
      { key: 'watchlist', title: 'Who I am watching', prompt: 'A company or player, and what you are waiting to see.' },
      { key: 'review', title: 'When I check back', prompt: 'What must be true by when?' },
    ],
  },
  curiosity: {
    goal: 'curiosity',
    title: 'Market Map',
    subtitle: 'Your own map of the industry, drawn as you learn it.',
    payoff: 'Finish it and you can explain this whole industry to a friend.',
    sections: [
      { key: 'basics', title: 'What this industry actually does', prompt: 'Explain it in one line, no jargon.' },
      { key: 'chain', title: 'The chain', prompt: 'How does value get from start to finish here?' },
      { key: 'players', title: 'Who holds power', prompt: 'Name a player and the reason they matter.' },
      { key: 'numbers', title: 'Scale', prompt: 'One number that shows how big or small this is.' },
      { key: 'rules', title: 'The rules', prompt: 'A regulation or constraint that shapes everything.' },
      { key: 'frontier', title: 'What is next', prompt: 'The thing you find most interesting about its future.' },
    ],
  },
};

/** Map any stored goal (including 'join_industry') to its deliverable. */
export function deliverableFor(goal?: string | null): DeliverableTemplate {
  switch (goal) {
    case 'join_industry':
    case 'career':
      return TEMPLATES.career;
    case 'build_startup':
      return TEMPLATES.build_startup;
    case 'invest':
      return TEMPLATES.invest;
    default:
      return TEMPLATES.curiosity;
  }
}

/** The line a consolidation day (every 7th) asks for. */
export function consolidationSection(template: DeliverableTemplate, day: number): DeliverableSection {
  const week = Math.max(1, Math.round(day / 7));
  return template.sections[(week - 1) % template.sections.length];
}

export function isConsolidationDay(day: number): boolean {
  return day > 0 && day % 7 === 0;
}

/**
 * The status the document confers on its author. Earned, never assigned:
 * each rank is simply how much of the document exists in their own words.
 */
export interface DossierRank {
  /** What they are, now. */
  title: string;
  /** One line explaining what the document can already do for them. */
  blurb: string;
  /** Completion needed for the next rank, or null at the top. */
  nextAt: number | null;
  /** The next title, or null at the top. */
  nextTitle: string | null;
}

const RANKS: { at: number; title: string; blurb: string }[] = [
  { at: 0, title: 'Observer', blurb: 'Nothing written yet. One line starts the document.' },
  { at: 17, title: 'Analyst', blurb: 'You have your first position on this industry in writing.' },
  { at: 34, title: 'Market Reader', blurb: 'Enough to hold a real conversation about how this industry works.' },
  { at: 50, title: 'Insider', blurb: 'Half the document stands. It already reads like someone who works here.' },
  { at: 67, title: 'Operator', blurb: 'You can defend most of this without notes.' },
  { at: 84, title: 'Authority', blurb: 'One section from a document you would put your name on.' },
  { at: 100, title: 'Principal', blurb: 'Complete, in your own words, and ready to send.' },
];

export function dossierRank(completion: number): DossierRank {
  const pct = Math.max(0, Math.min(100, Math.round(completion)));
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (pct >= RANKS[i].at) index = i;
  }
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  return {
    title: current.title,
    blurb: current.blurb,
    nextAt: next ? next.at : null,
    nextTitle: next ? next.title : null,
  };
}

/** Short status word shown on each slot. */
export function slotStatus(lineCount: number): 'empty' | 'filled' | 'strong' {
  if (lineCount <= 0) return 'empty';
  return lineCount >= 2 ? 'strong' : 'filled';
}

// ---------------------------------------------------------------------------
// Automatic filling: every finished lesson drops one complete sentence from
// that lesson into the next open section. The learner can edit or delete it.
// ---------------------------------------------------------------------------

const SECTION_HINTS: Record<string, RegExp> = {
  how_money_moves: /\b(pay|pays|paid|revenue|margin|cash|price|cost|contract|fee)s?\b/i,
  money: /\b(pay|pays|paid|revenue|margin|cash|price|cost|contract|fee)s?\b/i,
  chain: /\b(supplier|supply|chain|integrat|deliver|build|assembl)/i,
  drivers: /\b(because|drives|leads to|so that|which means)\b/i,
  players: /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b.*\b(controls|owns|leads|holds|dominates|power)\b/,
  incumbents: /\b(incumbent|large|primes?|big players|established|slow)\b/i,
  who_hurts: /\b(lose|loses|wait|delay|risk|pain|cost)s?\b/i,
  numbers: /\d/,
  risk: /\b(risk|rule|regulat|certif|fail|delay|approval)/i,
  rules: /\b(rule|regulat|certif|law|approval|standard)/i,
  why_now: /\b(now|recent|since|20(2\d)|new)\b/i,
  frontier: /\b(next|future|will|emerging|new)\b/i,
};

function lessonSentences(slides: { body: string }[]): string[] {
  const out: string[] = [];
  for (const slide of slides) {
    const text = (slide.body || '').replace(/\s+/g, ' ').replace(/[*_#>`]/g, '').trim();
    for (const raw of text.split(/(?<=[.!?])\s+/)) {
      const s = raw.trim();
      // Complete, readable sentences only: never a fragment, never a question.
      if (s.length >= 40 && s.length <= 220 && /[.!]$/.test(s) && /^[A-Z0-9"]/.test(s)) out.push(s);
    }
  }
  return out;
}

/**
 * Picks the section and sentence a finished lesson should add. Returns null
 * when every section is already written or the lesson has no usable sentence.
 */
export function autoDossierLine(
  template: DeliverableTemplate,
  filledKeys: Set<string>,
  slides: { body: string }[],
  existing: Set<string>,
): { sectionKey: string; content: string } | null {
  const section = template.sections.find(s => !filledKeys.has(s.key));
  if (!section) return null;
  const sentences = lessonSentences(slides).filter(s => !existing.has(s));
  if (!sentences.length) return null;
  const hint = SECTION_HINTS[section.key];
  const match = hint ? sentences.find(s => hint.test(s)) : undefined;
  // Fallback: the lesson's closing idea (the takeaway sits at the end).
  return { sectionKey: section.key, content: match ?? sentences[sentences.length - 1] };
}
