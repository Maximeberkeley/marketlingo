/**
 * Lesson-anchored checks.
 *
 * Every builder here produces a question that can ONLY be answered by someone
 * who read THIS lesson: its own figures, its own definitions, its own
 * mechanism, its own claims. Explanations always point back at the passage
 * that contains the answer.
 *
 * Mixed-recall material (market packs, industry statistics, fact-check drills)
 * deliberately lives elsewhere — Practice and spaced review — so the lesson's
 * check tests the lesson.
 */
import {
  BuildChainExercise,
  Exercise,
  KeyTerm,
  MultipleChoiceExercise,
  SpotFakeExercise,
} from '../types';
import { SlideLike, norm, sentences, shuffle } from './extract';

const UP = ['grow', 'growing', 'growth', 'rise', 'rising', 'increase', 'increasing', 'surge', 'expand', 'expanding'];
const DOWN = ['fall', 'falling', 'decline', 'declining', 'drop', 'dropping', 'shrink', 'shrinking', 'slow', 'slowing'];

/**
 * Direction words paired with a counterpart in the SAME grammatical form, so an
 * altered sentence still reads like English ("growth" becomes "decline", never
 * "fallth"). Swaps only ever happen on whole words.
 */
const OPPOSITES: Array<[string, string]> = [
  ['grow', 'shrink'],
  ['grows', 'shrinks'],
  ['growing', 'shrinking'],
  ['growth', 'decline'],
  ['rise', 'fall'],
  ['rises', 'falls'],
  ['rising', 'falling'],
  ['increase', 'decrease'],
  ['increases', 'decreases'],
  ['increasing', 'decreasing'],
  ['surge', 'collapse'],
  ['surges', 'collapses'],
  ['expand', 'contract'],
  ['expands', 'contracts'],
  ['expanding', 'contracting'],
  ['accelerate', 'slow'],
  ['accelerating', 'slowing'],
  ['cheaper', 'more expensive'],
  ['higher', 'lower'],
  ['more', 'less'],
  ['most', 'least'],
  ['largest', 'smallest'],
  ['fastest', 'slowest'],
  ['always', 'never'],
];

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

/** "From this lesson:" framing — the learner can always find the answer again. */
const cite = (sentence: string) => `Straight from what you just read: ${clean(sentence)}`;

// ── 1. Definition check — this lesson's own key terms ──────────────
export function checkDefinition(terms: KeyTerm[], id: string): MultipleChoiceExercise | null {
  const usable = terms.filter(t => t.term?.trim() && (t.definition || '').trim().length > 14);
  const unique = usable.filter(
    (t, i) => usable.findIndex(o => norm(o.term) === norm(t.term)) === i,
  );
  if (unique.length < 3) return null;
  const target = shuffle(unique)[0];
  const decoys = shuffle(unique.filter(t => norm(t.term) !== norm(target.term))).slice(0, 2);
  const options = shuffle([target.term, ...decoys.map(d => d.term)]);
  return {
    kind: 'multipleChoice',
    id,
    prompt: `This lesson defined it as: "${clean(target.definition)}". Which term is that?`,
    options,
    correctIndex: options.indexOf(target.term),
    explanation: `${target.term}: ${clean(target.definition)}`,
  };
}

// ── 2. Figure check — a number the lesson actually stated ──────────
function formatLike(sample: string, value: number): string {
  const fraction = sample.split(/[.,]/)[1] || '';
  const decimals = Math.min(3, fraction.length);
  const shown = value.toFixed(decimals);
  return sample.includes(',') && decimals ? shown.replace('.', ',') : shown;
}

/**
 * A quantity worth asking about: money, a share, or a scale word. Model names
 * and designations ("KC-46", "767", "GPT-4") are never quantities.
 */
const FIGURE = /(?:(\$|US\$|€)\s?(\d{1,4}(?:[.,]\d{1,3})?)\s?(thousand|million|billion|trillion)?|(\d{1,4}(?:[.,]\d{1,3})?)\s?(%|percent|thousand|million|billion|trillion))/i;

export function checkFigure(slides: SlideLike[], id: string): MultipleChoiceExercise | null {
  for (const slide of shuffle(slides)) {
    const body = clean(slide.body || '');
    const match = body.match(FIGURE);
    if (!match) continue;
    const numberText = match[2] || match[4];
    if (!numberText) continue;
    // Reject designations: a letter or hyphen immediately before the number.
    const at = match.index ?? 0;
    if (/[A-Za-z-]$/.test(body.slice(Math.max(0, at - 1), at))) continue;
    const raw = parseFloat(numberText.replace(',', '.'));
    if (!isFinite(raw) || raw <= 0) continue;
    const sentence = sentences(body, 25, 300).find(s => s.includes(match[0].trim()));
    if (!sentence) continue;

    const unit = (match[3] || match[5] || '').trim();
    const prefix = (match[1] || '').trim();
    const isPct = /^(%|percent)$/i.test(unit);
    const label = (n: number) => {
      const shown = `${prefix}${formatLike(numberText, n)}`;
      return isPct ? `${shown}${unit === '%' ? '%' : ' percent'}` : `${shown}${unit ? ` ${unit}` : ''}`;
    };

    const candidates = [raw * 0.25, raw * 3, raw * 10].map(n => (isPct ? Math.min(99, n) : n));
    const decoys = candidates
      .map(n => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10))
      .filter(n => n > 0 && Math.abs(n - raw) > raw * 0.2)
      .map(label)
      .filter((v, i, arr) => arr.indexOf(v) === i && v !== label(raw))
      .slice(0, 3);
    if (decoys.length < 2) continue;

    const options = shuffle([label(raw), ...decoys]);
    return {
      kind: 'multipleChoice',
      id,
      prompt: `Fill the gap: ${sentence.replace(match[0].trim(), '_____')}`,
      options,
      correctIndex: options.indexOf(label(raw)),
      explanation: cite(sentence),
    };
  }
  return null;
}

// ── 3. Mechanism check — the lesson's own cause-and-effect order ───
export function checkMechanism(slides: SlideLike[], id: string): BuildChainExercise | null {
  const ranked = slides
    .map(slide => ({ slide, lines: sentences(slide.body || '', 20, 110) }))
    .filter(entry => entry.lines.length >= 3)
    .sort((a, b) => b.lines.length - a.lines.length);
  const best = ranked[0];
  if (!best) return null;
  return {
    kind: 'buildChain',
    id,
    prompt: `Rebuild the mechanism behind "${clean(best.slide.title || 'today’s concept')}"`,
    steps: best.lines.slice(0, 4).map(clean),
    explanation: 'That is the order this lesson laid it out — cause, then effect.',
  };
}

// ── 4. Claim check — true line vs. tampered lines from this lesson ─
/** A year, a model designation or an ordinal is never a quantity to alter. */
const isYear = (value: number) => Number.isInteger(value) && value >= 1900 && value <= 2099;

function falsify(sentence: string): string | null {
  // Alter a real quantity, walking every number so a date at the start of the
  // sentence never becomes a nonsense year.
  for (const match of sentence.matchAll(/\d{1,4}(?:[.,]\d{1,2})?/g)) {
    const token = match[0];
    const at = match.index ?? 0;
    // Skip designations ("KC-46", "GPT-4") and years ("in 2024").
    if (/[A-Za-z-]$/.test(sentence.slice(Math.max(0, at - 1), at))) continue;
    const raw = parseFloat(token.replace(',', '.'));
    if (!isFinite(raw) || raw <= 0 || isYear(raw)) continue;
    const next = raw > 10 ? Math.max(1, Math.round(raw * 0.2)) : Math.round(raw * 7);
    if (next === raw || isYear(next)) continue;
    return sentence.slice(0, at) + String(next) + sentence.slice(at + token.length);
  }
  // Whole-word direction swaps, in both directions, keeping the same form.
  for (const [a, b] of OPPOSITES) {
    for (const [from, to] of [[a, b], [b, a]] as const) {
      const re = new RegExp(`\\b${from.replace(/ /g, '\\s+')}\\b`, 'i');
      if (re.test(sentence)) return sentence.replace(re, to);
    }
  }
  return null;
}

export function checkClaim(slides: SlideLike[], id: string): MultipleChoiceExercise | null {
  const pool = shuffle(slides.flatMap(s => sentences(s.body || '', 40, 170)));
  for (const truth of pool) {
    const others = pool.filter(s => norm(s) !== norm(truth));
    const lies = others.map(falsify).filter((s): s is string => Boolean(s) && norm(s!) !== norm(truth)).slice(0, 2);
    if (lies.length < 2) continue;
    const options = shuffle([clean(truth), ...lies.map(clean)]);
    if (new Set(options.map(norm)).size !== options.length) continue;
    return {
      kind: 'multipleChoice',
      id,
      prompt: 'Only one of these matches what this lesson actually said. Which?',
      options,
      correctIndex: options.indexOf(clean(truth)),
      explanation: cite(truth),
    };
  }
  return null;
}

// ── 5. Tamper check — spot the altered version of a real line ──────
export function checkTamper(slides: SlideLike[], id: string): SpotFakeExercise | null {
  const pool = shuffle(slides.flatMap(s => sentences(s.body || '', 45, 160)));
  if (pool.length < 3) return null;
  for (const candidate of pool) {
    const fake = falsify(candidate);
    if (!fake || norm(fake) === norm(candidate)) continue;
    const truths = pool.filter(s => norm(s) !== norm(candidate)).slice(0, 2).map(clean);
    if (truths.length < 2) continue;
    const statements = shuffle([clean(fake), ...truths]);
    return {
      kind: 'spotFake',
      id,
      prompt: 'One of these has been altered. Which one contradicts the lesson?',
      statements,
      fakeIndex: statements.indexOf(clean(fake)),
      explanation: cite(candidate),
    };
  }
  return null;
}

/** Sentence openers that are never the term being defined. */
const NOT_A_TERM = new Set([
  'that', 'this', 'those', 'these', 'there', 'here', 'it', 'they', 'we', 'you',
  'one', 'two', 'three', 'first', 'second', 'third', 'when', 'under', 'every',
  'same', 'so', 'and', 'but', 'note', 'compare', 'example', 'result', 'say',
  'pick', 'find', 'remember', 'today', 'tomorrow', 'now', 'then',
]);

/**
 * Terms the lesson itself defines, written as "Term: definition" or
 * "Term — definition". These beat the market-wide glossary, because a check
 * should only ask about words this lesson actually taught.
 */
export function termsFromSlides(slides: SlideLike[]): KeyTerm[] {
  const found: KeyTerm[] = [];
  for (const slide of slides) {
    for (const sentence of sentences(slide.body || '', 20, 320)) {
      const hit = sentence.match(/^([A-Z][A-Za-z0-9'’\-/ ]{2,42})\s*(?::|—|–)\s*(.{18,})$/);
      if (!hit) continue;
      const term = clean(hit[1]);
      const definition = clean(hit[2]);
      const words = term.split(' ');
      if (words.length > 4) continue;
      if (words.some(w => NOT_A_TERM.has(norm(w)))) continue;
      if (norm(term).length < 4) continue;
      if (found.some(f => norm(f.term) === norm(term))) continue;
      found.push({ term, definition });
    }
  }
  return found;
}

/**
 * The ordered pool of checks for one lesson. Each returns null when the
 * lesson's own text can't support an honest question, so the sequencer falls
 * back rather than inventing material.
 */
export function lessonCheckFactories(
  slides: SlideLike[],
  terms: KeyTerm[],
  nextId: () => string,
): (() => Exercise | null)[] {
  const lessonTerms = termsFromSlides(slides);
  const body = norm(slides.map(s => s.body || '').join(' '));
  // Glossary terms only count when the lesson actually used the word.
  const mentioned = terms.filter(t => t.term && body.includes(norm(t.term)));
  const termPool = lessonTerms.length >= 3 ? lessonTerms : [...lessonTerms, ...mentioned];

  return [
    () => checkFigure(slides, nextId()),
    () => checkDefinition(termPool, nextId()),
    () => checkMechanism(slides, nextId()),
    () => checkClaim(slides, nextId()),
    () => checkTamper(slides, nextId()),
  ];
}
