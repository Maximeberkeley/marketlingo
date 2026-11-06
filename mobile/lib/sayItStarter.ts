/**
 * "Say it in one sentence" needs a concrete question right after a first
 * lesson, not an abstract Brief prompt. This picks one from today's lesson
 * (a company it named, a number it quoted) and offers an optional sentence
 * starter with blanks. The learner always writes the sentence; nothing here
 * ever fills a blank for them.
 */
import { standaloneQuantities } from '../lesson-kit/sequencer/extract';

export interface SayItContext {
  company?: string;
  number?: string;
  industry?: string;
}

export interface SayItPrompt {
  question: string;
  starter: string;
}

export const BLANK = '___';

/** Capitalised words that are never the company a lesson is about. */
const NOT_NAMES = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'we', 'you', 'your', 'our', 'their',
  'in', 'on', 'at', 'for', 'from', 'with', 'and', 'but', 'or', 'if', 'when', 'each', 'every', 'most', 'some',
  'day', 'layer', 'layers', 'tier', 'tiers', 'region', 'step', 'first', 'then', 'finally', 'today', 'why', 'what',
  'how', 'who', 'one', 'two', 'three', 'call', 'say', 'pick', 'oem', 'oems', 'mro', 'ceo', 'cfo', 'ai', 'us', 'u.s',
  'eu', 'uk', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
  'november', 'december', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'engines', 'maintenance', 'source', 'sources', 'note', 'example', 'rule', 'takeaway',
]);

const isName = (word: string) => /^[A-Z][A-Za-z0-9&'’.-]*[A-Za-z0-9]$/.test(word) && !NOT_NAMES.has(word.toLowerCase());

/** The company or organisation today's lesson names most, never a sentence's first word. */
export function lessonCompany(slides: { title?: string; body: string }[]): string | undefined {
  const counts = new Map<string, { n: number; order: number }>();
  let order = 0;
  for (const slide of slides) {
    const sentences = (slide.body || '').replace(/\s+/g, ' ').split(/(?<=[.!?:])\s+/);
    for (const sentence of sentences) {
      const words = sentence.split(' ').map(w => w.replace(/^[("“‘']+|[)"”’',;:.!?]+$/g, ''));
      for (let i = 1; i < words.length; i++) {
        if (!isName(words[i])) continue;
        // Join a following capitalised word: "Collins Aerospace", "General Electric".
        const name = i + 1 < words.length && isName(words[i + 1]) ? `${words[i]} ${words[i + 1]}` : words[i];
        if (name.includes(' ')) i += 1;
        const seen = counts.get(name);
        counts.set(name, { n: (seen?.n ?? 0) + 1, order: seen?.order ?? order++ });
      }
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1].n - a[1].n || a[1].order - b[1].order);
  return ranked[0]?.[0];
}

/** The first standalone figure the lesson quotes (never a year). */
export function lessonNumber(slides: { title?: string; body: string }[]): string | undefined {
  for (const slide of slides) {
    const found = standaloneQuantities(`${slide.body || ''}`).find(n => !/^(19|20)\d\d$/.test(n));
    if (found) {
      // Keep the unit that follows the figure in the text ("80%", "86 billion").
      const at = slide.body.indexOf(found);
      const tail = slide.body.slice(at + found.length).match(/^\s?(%|percent\b|billion\b|million\b|trillion\b)/i)?.[0] ?? '';
      return `${found}${tail}`.trim();
    }
  }
  return undefined;
}

export function sayItContext(slides: { title?: string; body: string }[], industry?: string): SayItContext {
  return { company: lessonCompany(slides), number: lessonNumber(slides), industry: industry?.trim() || undefined };
}

/** One concrete question and an optional starter for a Brief / Map section. */
export function sayItPrompt(sectionKey: string, context: SayItContext): SayItPrompt {
  const company = context.company;
  const industry = context.industry || 'this industry';
  const number = context.number;
  switch (sectionKey) {
    case 'how_money_moves':
    case 'money':
      return { question: `Who pays whom in ${industry}, and for what?`, starter: `In ${industry}, ${BLANK} pays ${BLANK} for ${BLANK}.` };
    case 'players':
    case 'watchlist':
      return company
        ? { question: `Why does ${company} matter?`, starter: `${company} matters because ${BLANK}.` }
        : { question: 'Which company from today holds power, and why?', starter: `${BLANK} holds power because ${BLANK}.` };
    case 'numbers':
      return number
        ? { question: `What does ${number} tell you?`, starter: `${number} matters because it shows ${BLANK}.` }
        : { question: 'Which number from today would you quote?', starter: `${BLANK} matters because it shows ${BLANK}.` };
    case 'risk':
    case 'rules':
      return { question: 'What rule or risk decides who wins here?', starter: `The rule that decides who wins is ${BLANK}, because ${BLANK}.` };
    case 'my_view':
    case 'thesis':
      return { question: 'What do most people miss about this?', starter: `Most people think ${BLANK}, but ${BLANK}.` };
    case 'questions':
      return company
        ? { question: `What would you ask someone at ${company}?`, starter: `I'd ask them: how do you ${BLANK} when ${BLANK}?` }
        : { question: 'What would you ask someone who works there?', starter: `I'd ask them: how do you ${BLANK} when ${BLANK}?` };
    case 'basics':
      return { question: `What does ${industry} actually do, in plain words?`, starter: `${industry} is about ${BLANK}.` };
    case 'chain':
      return { question: 'How does value get from start to finish?', starter: `It starts with ${BLANK}, then ${BLANK}, and ends with ${BLANK}.` };
    case 'frontier':
    case 'why_now':
      return { question: 'What is changing here right now?', starter: `What's changing is ${BLANK}, which means ${BLANK}.` };
    case 'drivers':
      return { question: 'What mechanism would make you right?', starter: `This works because ${BLANK} leads to ${BLANK}.` };
    case 'gap':
      return { question: 'What is broken or missing here?', starter: `What's missing is ${BLANK}.` };
    case 'who_hurts':
      return { question: 'Who loses money or time because of it?', starter: `${BLANK} loses ${BLANK} because ${BLANK}.` };
    case 'incumbents':
      return { question: 'Why haven’t the big players fixed it?', starter: `The big players haven't fixed it because ${BLANK}.` };
    case 'first_test':
      return { question: 'What is the cheapest way to test it?', starter: `I'd test it by ${BLANK}.` };
    case 'review':
      return { question: 'What must be true, and by when?', starter: `By ${BLANK}, ${BLANK} must be true.` };
    default:
      return { question: 'What is the one thing from today you would say out loud?', starter: `The key idea is ${BLANK}.` };
  }
}

const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * Words the learner wrote beyond the starter. A line built from a starter only
 * counts as theirs with at least 3 of their own words and no blank left.
 */
export function ownWordCount(text: string, starter: string): number {
  if (text.includes(BLANK)) return 0;
  const left = new Map<string, number>();
  for (const w of words(starter.split(BLANK).join(' '))) left.set(w, (left.get(w) ?? 0) + 1);
  let own = 0;
  for (const w of words(text)) {
    const n = left.get(w) ?? 0;
    if (n > 0) left.set(w, n - 1);
    else own += 1;
  }
  return own;
}

/** Where the cursor goes after "Use a starter": the first blank, selected so typing replaces it. */
export function firstBlank(text: string): { start: number; end: number } | null {
  const at = text.indexOf(BLANK);
  return at < 0 ? null : { start: at, end: at + BLANK.length };
}
