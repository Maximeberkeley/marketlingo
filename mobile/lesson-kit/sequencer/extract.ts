/**
 * Content extractors: turn real lesson text into playable game modules.
 * Every extractor is defensive — it returns null when the text can't support
 * an honest, unambiguous exercise, so the sequencer can fall back.
 */
import {
  BuildChainExercise,
  ChartReadExercise,
  ColdOpenExercise,
  Exercise,
  KeyTerm,
  MapMarketExercise,
  MicroInsightExercise,
  NumberSenseExercise,
  SortSignalExercise,
  SpeedRoundExercise,
  SpotFakeExercise,
  Source,
} from '../types';

export interface SlideLike {
  slideNumber: number;
  title: string;
  body: string;
  sources?: Source[];
  keyTerms?: KeyTerm[];
}

const UP_WORDS = ['grow', 'growing', 'growth', 'rise', 'rising', 'increase', 'increasing', 'surge', 'expand', 'expanding', 'accelerate'];
const DOWN_WORDS = ['fall', 'falling', 'decline', 'declining', 'drop', 'dropping', 'shrink', 'shrinking', 'slow', 'slowing', 'contract'];

export const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function sentences(text: string, min = 40, max = 200): string[] {
  return (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= min && s.length <= max);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sentences carrying a number are the most arresting — use them for openers. */
function numericSentences(text: string): string[] {
  return sentences(text, 30, 170).filter(s => /\d/.test(s));
}

// ── Cold open ──────────────────────────────────────────────────────
export function makeColdOpen(
  slides: SlideLike[],
  id: string,
  eyebrow?: string,
): ColdOpenExercise | null {
  const pool = slides.flatMap(s => numericSentences(s.body));
  const headline = pool.sort((a, b) => a.length - b.length)[0];
  if (!headline) return null;
  return {
    kind: 'coldOpen',
    id,
    eyebrow: eyebrow || 'Today in your market',
    headline,
    kicker: "Here's why that number matters.",
  };
}

// ── Micro-insight ──────────────────────────────────────────────────
export function makeMicroInsight(
  slide: SlideLike,
  id: string,
  eyebrow?: string,
): MicroInsightExercise | null {
  const list = sentences(slide.body, 30, 190);
  if (!list.length) return null;
  const text = list[0];
  return {
    kind: 'microInsight',
    id,
    eyebrow: eyebrow || slide.title,
    text,
    highlight: list[1],
    keyTerm: slide.keyTerms?.[0],
    sources: slide.sources?.length ? slide.sources : undefined,
  };
}

// ── Beat the Clock (from key terms) ────────────────────────────────
export function makeSpeedRound(terms: KeyTerm[], id: string): SpeedRoundExercise | null {
  const clean = terms.filter(t => t.term && t.definition && t.definition.length > 12);
  if (clean.length < 3) return null;
  const picks = shuffle(clean).slice(0, Math.min(5, clean.length));
  const rounds = picks.map(t => {
    const decoys = shuffle(clean.filter(c => c.term !== t.term)).slice(0, 2).map(c => c.term);
    const options = shuffle([t.term, ...decoys]);
    return { question: t.definition, options, correctIndex: options.indexOf(t.term) };
  });
  if (rounds.some(r => r.options.length < 3)) return null;
  return {
    kind: 'speedRound',
    id,
    prompt: 'Which term is being described?',
    seconds: Math.max(15, rounds.length * 7),
    rounds,
  };
}

// ── Map the Market (from key terms) ────────────────────────────────
export function makeMapMarket(terms: KeyTerm[], id: string): MapMarketExercise | null {
  const clean = terms.filter(t => t.term && t.definition && t.definition.length > 12);
  if (clean.length < 3) return null;
  const nodes = shuffle(clean).slice(0, 5);
  const targetIdx = Math.floor(Math.random() * nodes.length);
  return {
    kind: 'mapMarket',
    id,
    prompt: nodes[targetIdx].definition,
    nodes: nodes.map(n => ({ label: n.term })),
    correctIndex: targetIdx,
    explanation: `${nodes[targetIdx].term}: ${nodes[targetIdx].definition}`,
  };
}

// ── Build the Chain (from an ordered list) ─────────────────────────
export function makeBuildChain(items: string[], id: string, prompt?: string): BuildChainExercise | null {
  const steps = items
    .map(s => s.replace(/^\s*(\d+[.)]|[-•–])\s*/, '').trim())
    .filter(s => s.length >= 8 && s.length <= 90);
  if (steps.length < 3) return null;
  return {
    kind: 'buildChain',
    id,
    prompt: prompt || 'Put these in the order they actually happen',
    steps: steps.slice(0, 5),
    explanation: 'This is the order the lesson lays out.',
  };
}

// ── Sort the Signal (which theme does this line belong to?) ────────
export function makeSortSignal(slides: SlideLike[], id: string): SortSignalExercise | null {
  const usable = slides
    .map(s => ({ title: s.title.trim(), lines: sentences(s.body, 45, 130) }))
    .filter(s => s.title.length > 3 && s.title.length <= 34 && s.lines.length >= 2);
  if (usable.length < 2) return null;
  const picked = shuffle(usable).slice(0, Math.min(3, usable.length));
  const items = picked.flatMap((p, bucket) =>
    shuffle(p.lines)
      .slice(0, 2)
      .map(text => ({ text, bucket, why: `That line is from "${p.title}".` })),
  );
  if (items.length < 4) return null;
  return {
    kind: 'sortSignal',
    id,
    prompt: 'Drag each line under the idea it supports',
    buckets: picked.map(p => p.title),
    items,
  };
}

// ── Number Sense (from a magnitude in the text) ────────────────────
const SCALE: Record<string, number> = { thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12 };

export function makeNumberSense(slides: SlideLike[], id: string): NumberSenseExercise | null {
  for (const slide of shuffle(slides)) {
    const text = (slide.body || '').replace(/\s+/g, ' ');
    const m = text.match(
      /(?:\$|US\$)?\s?(\d{1,4}(?:[.,]\d{1,2})?)\s?(thousand|million|billion|trillion|%|percent)/i,
    );
    if (!m) continue;
    const raw = parseFloat(m[1].replace(',', '.'));
    if (!isFinite(raw) || raw <= 0) continue;
    const word = m[2].toLowerCase();
    const isPct = word === '%' || word === 'percent';
    const value = isPct ? raw : raw * SCALE[word];
    if (isPct && raw > 100) continue;
    const sentence = sentences(text, 25, 200).find(s => s.includes(m[0].trim()));
    if (!sentence) continue;
    const prompt = sentence.replace(m[0].trim(), '_____');
    return {
      kind: 'numberSense',
      id,
      prompt: `Fill the gap: ${prompt}`,
      min: 0,
      max: isPct ? 100 : Math.max(value * 2.5, value + 1),
      value,
      unit: isPct ? '%' : undefined,
      tolerance: isPct ? 0.1 : 0.12,
      explanation: sentence,
    };
  }
  return null;
}

// ── Spot the Fake (one mutated sentence among real ones) ───────────
function mutate(sentence: string): string | null {
  const num = sentence.match(/\d{1,4}(?:[.,]\d{1,2})?/);
  if (num) {
    const raw = parseFloat(num[0].replace(',', '.'));
    if (isFinite(raw) && raw > 0) {
      const factor = raw > 10 ? 0.25 : 6;
      const next = raw > 10 ? Math.max(1, Math.round(raw * factor)) : Math.round(raw * factor);
      if (next !== raw) return sentence.replace(num[0], String(next));
    }
  }
  const lower = sentence.toLowerCase();
  for (const [from, to] of [[UP_WORDS, DOWN_WORDS], [DOWN_WORDS, UP_WORDS]] as const) {
    for (let i = 0; i < from.length; i++) {
      const w = from[i];
      const at = lower.indexOf(w);
      if (at >= 0) {
        return sentence.slice(0, at) + to[i % to.length] + sentence.slice(at + w.length);
      }
    }
  }
  return null;
}

export function makeSpotFake(slides: SlideLike[], id: string): SpotFakeExercise | null {
  const pool = shuffle(slides.flatMap(s => sentences(s.body, 45, 150)));
  if (pool.length < 3) return null;
  for (const candidate of pool) {
    const fake = mutate(candidate);
    if (!fake || norm(fake) === norm(candidate)) continue;
    const truths = pool.filter(s => norm(s) !== norm(candidate)).slice(0, 2);
    if (truths.length < 2) return null;
    const statements = shuffle([fake, ...truths]);
    return {
      kind: 'spotFake',
      id,
      prompt: 'One of these has been tampered with. Which one?',
      statements,
      fakeIndex: statements.indexOf(fake),
      explanation: `The real line reads: ${candidate}`,
    };
  }
  return null;
}

// ── Chart Read (direction implied by the text) ─────────────────────
export function makeChartRead(slides: SlideLike[], id: string): ChartReadExercise | null {
  const text = slides.map(s => s.body).join(' ').toLowerCase();
  const up = UP_WORDS.some(w => text.includes(w));
  const down = DOWN_WORDS.some(w => text.includes(w));
  if (up === down) return null; // ambiguous or silent — skip
  const history = [0.3, 0.36, 0.42, 0.4, 0.5, 0.55];
  const rising = [0.62, 0.7, 0.8, 0.92];
  const flat = [0.55, 0.54, 0.56, 0.55];
  const falling = [0.46, 0.38, 0.28, 0.18];
  const options = [rising, flat, falling];
  return {
    kind: 'chartRead',
    id,
    prompt: up
      ? 'The lesson says this market is expanding. Which continuation fits?'
      : 'The lesson says this market is contracting. Which continuation fits?',
    history,
    options,
    correctIndex: up ? 0 : 2,
    explanation: up
      ? 'Growth language means the line keeps climbing.'
      : 'Contraction language means the line rolls over.',
  };
}

// ── Comprehension fallback ─────────────────────────────────────────
export function makeRecall(slide: SlideLike, others: string[], id: string): Exercise | null {
  const own = sentences(slide.body);
  if (!own.length) return null;
  const correct = own[Math.floor(own.length / 2)] || own[0];
  const decoys = shuffle(others.filter(s => norm(s) !== norm(correct))).slice(0, 3);
  if (decoys.length < 2) return null;
  const options = shuffle([correct, ...decoys]);
  if (new Set(options.map(norm)).size !== options.length) return null;
  return {
    kind: 'multipleChoice',
    id,
    prompt: `Which line belongs to "${slide.title}"?`,
    options,
    correctIndex: options.indexOf(correct),
    explanation: 'This is stated directly in what you just read.',
  };
}
