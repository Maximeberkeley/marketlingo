/** Shared constants for the Weekly Case pipeline. Plain ESM, no dependencies, so an unattended agent can run it anywhere. */

export const MARKETS = [
  'aerospace', 'neuroscience', 'ai', 'fintech', 'ev', 'biotech', 'cleanenergy', 'agtech',
  'climatetech', 'cybersecurity', 'spacetech', 'robotics', 'healthtech', 'logistics', 'web3',
];

/** An industry may not repeat within this many days of another weekly case. */
export const ROTATION_DAYS = 28;

export const LIMITS = {
  words: { min: 350, max: 900 },          // what the learner reads: brief, exhibits, question, part prompts
  minutes: { min: 8, max: 12 },           // reading + the time budgeted for the parts
  readWordsPerMinute: 200,
  title: 80,
  hook: 180,
  parts: { min: 3, max: 5 },
  partWords: { min: 30, max: 200 },
  partMinutes: { min: 1, max: 5 },
  exhibits: { min: 1, max: 3 },
  exhibitRows: 9,
  criteria: { min: 4, max: 6 },
  criterionWeight: { min: 10, max: 35 },
  traps: { min: 3, max: 5 },
  alternatives: { min: 2, max: 4 },
  modelAnswerWords: 450,
  keyFacts: 3,
  staleAfterDays: { min: 0, max: 21 },
};

export const SOURCE_TIERS = ['primary', 'secondary', 'partner'];
export const KINDS = ['original', 'startup'];
export const TIMEZONE = 'America/Los_Angeles';

/** Words that make a sentence time-bound. A paragraph using one must also carry an explicit date. */
export const TEMPORAL_WORDS = /\b(currently|now|today|this week|this month|this year|recently|pending|so far|upcoming|soon|latest)\b/i;

/** Phrases that assert evidence without naming it. Cases may not use them. */
export const UNSOURCED_PATTERNS = [
  /\bstudies (?:show|suggest|find|found)\b/i,
  /\bresearch (?:shows|suggests|finds|found)\b/i,
  /\bexperts? (?:say|believe|agree|estimate)\b/i,
  /\banalysts? (?:say|believe|expect|estimate)\b/i,
  /\bit is (?:well[- ]known|widely believed)\b/i,
  /\baccording to (?:sources|reports|some)\b/i,
  /\b(?:TODO|TBD|XXX|lorem ipsum)\b|\[citation needed\]/i,
];

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
