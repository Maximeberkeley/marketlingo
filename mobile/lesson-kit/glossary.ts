import { getAcronymsForMarket } from '../data/industryAcronyms';

export interface GlossaryEntry { term: string; definition: string }

/** Plain-language terms that are not acronyms, per market. */
const PHRASES: Record<string, Record<string, string>> = {
  aerospace: {
    'Tier 1': 'A supplier that sells major systems, like engines or avionics, straight to the plane maker.',
    'Tier 2': 'A supplier that makes parts for Tier 1 suppliers, not for the plane maker directly.',
    'Tier 3': 'A supplier of basic parts and materials further down the chain.',
    'Prime contractor': 'The company that holds the main contract and hires suppliers under it.',
    Aftermarket: 'Everything sold after delivery: spare parts, repairs and upgrades.',
    Backlog: 'Orders a company has won but not yet delivered.',
    'Type certificate': 'The official approval that a new aircraft design is safe to fly.',
  },
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One regex per market; "Tier 1s" and "Tier 2/3s" resolve to their base term. */
export function glossaryFor(marketId?: string): { pattern: RegExp; lookup: (match: string) => GlossaryEntry | undefined } | null {
  const phrases = PHRASES[marketId || ''] || {};
  const entries: GlossaryEntry[] = [
    ...Object.entries(phrases).map(([term, definition]) => ({ term, definition })),
    ...getAcronymsForMarket(marketId).filter(e => e.term !== 'LEO'),
  ];
  if (!entries.length) return null;
  const tierRule = phrases['Tier 1'] ? ['Tier\\s?[1-3](?:\\/[1-3])?s?'] : [];
  const others = entries.filter(e => !/^Tier \d$/.test(e.term))
    .sort((a, b) => b.term.length - a.term.length)
    .map(e => `${escape(e.term)}s?`);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${[...tierRule, ...others].join('|')})(?![\\p{L}\\p{N}])`, 'gu');
  const lookup = (match: string) => {
    const tier = match.match(/^Tier\s?([1-3])/i);
    if (tier) return entries.find(e => e.term === `Tier ${tier[1]}`);
    const lower = match.toLowerCase();
    return entries.find(e => e.term.toLowerCase() === lower || `${e.term.toLowerCase()}s` === lower);
  };
  return { pattern, lookup };
}

/** Splits "INTERVIEW Q: '...' MODEL ANSWER: '...'" copy into its two halves. */
export function interviewQA(text: string): { question: string; answer: string; before: string } | null {
  const m = text.match(/^([\s\S]*?)\b(?:INTERVIEW\s+Q(?:UESTION)?|Q)\s*:\s*([\s\S]+?)\s*\b(?:MODEL\s+ANSWER|SAMPLE\s+ANSWER|A)\s*:\s*([\s\S]+)$/);
  if (!m) return null;
  const unquote = (s: string) => s.trim().replace(/^['"“‘]\s*/, '').replace(/\s*['"”’]$/, '').trim();
  const question = unquote(m[2]);
  const answer = unquote(m[3]);
  return question && answer ? { before: m[1].trim(), question, answer } : null;
}
