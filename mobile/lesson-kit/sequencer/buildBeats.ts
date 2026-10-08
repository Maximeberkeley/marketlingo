/**
 * Beat sequencer — turns a stack of slides into a daily lesson made of reading
 * cards (cold open, one insight per slide, takeaway) plus checks.
 *
 * Rule: a check may only test text the learner has ALREADY SEEN on a card
 * earlier in this lesson, and only the text visible on that card — never the
 * full briefing behind "Go deeper" / "Read briefing".
 *
 * Generated games (speed rounds, word-swap fakes, term definitions, sentence
 * ordering, sort-by-title, fill-the-gap numbers, market packs) are no longer
 * produced here. Their components stay in the kit for hand-written lessons.
 */
import { Exercise, KeyTerm, Lesson, MultipleChoiceExercise } from '../types';
import { IndustryPack, getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
import { SlideLike, makeColdOpen, makeMicroInsight, norm, sentences, shuffle } from './extract';
import { splitSentences } from '../../lib/textUtils';

export interface StackMetadataLike {
  learning_objectives?: string[];
  key_takeaway?: string;
  recap_bridge?: string;
  next_preview?: string;
}

export interface IndustryInput {
  marketId?: string;
  marketName?: string;
  trainer?: TrainerScenarioRow[];
  drills?: DrillRow[];
  /** Real, sourced industry numbers and trends for this market. */
  stats?: IndustryStatRow[];
  /** Stored learning goal; startup-only lines are shown to startup builders only. */
  learningGoal?: string | null;
}

export interface BeatBuildResult {
  lesson: Lesson;
  /** Slide number behind each beat, for Note / Save actions. */
  slideNumbers: number[];
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

const STARTUP_PREFIX = /^\s*for your startup\s*[:,\u2014\u2013-]?\s*/i;
/** Keep the sentence, minus its "For your startup:" lead-in. */
const stripStartup = (s: string) => {
  const rest = s.replace(STARTUP_PREFIX, '');
  return rest === s ? s : rest.charAt(0).toUpperCase() + rest.slice(1);
};

/** Strip the "For your startup:" prefix unless the learner is building a startup. */
export function filterForGoal(text: string, learningGoal?: string | null): string {
  if (learningGoal === 'build_startup') return text;
  return (text || '')
    .split(/\n/)
    .map(line =>
      splitSentences(line)
        .map(stripStartup)
        .filter(s => s.trim())
        .join(' '),
    )
    .filter((line, i, all) => line.trim() || (i > 0 && all[i - 1].trim()))
    .join('\n')
    .trim();
}

/** The exact text a card shows on screen (respecting its display limits). */
function visibleLines(ex: Exercise): string[] {
  const e = ex as any;
  const out: string[] = [];
  if (ex.kind === 'coldOpen') {
    if (e.headline && e.headline.length <= 260) out.push(e.headline);
  } else if (ex.kind === 'microInsight') {
    if (e.text && e.text.length <= 150) out.push(e.text);
    if (e.highlight && e.highlight.length <= 100) out.push(e.highlight);
  }
  return out.flatMap(t => splitSentences(clean(t))).map(clean).filter(s => s.length >= 30);
}

const isYear = (n: number) => Number.isInteger(n) && n >= 1900 && n <= 2099;

/** Change one real quantity in a sentence (never a year or a designation). */
function alterNumber(sentence: string): string | null {
  for (const match of sentence.matchAll(/\d{1,4}(?:[.,]\d{1,2})?/g)) {
    const token = match[0];
    const at = match.index ?? 0;
    if (/[A-Za-z-]$/.test(sentence.slice(Math.max(0, at - 1), at))) continue;
    const raw = parseFloat(token.replace(',', '.'));
    if (!isFinite(raw) || raw <= 0 || isYear(raw)) continue;
    const next = raw > 10 ? Math.max(1, Math.round(raw * 0.2)) : Math.round(raw * 7);
    if (next === raw || isYear(next)) continue;
    return sentence.slice(0, at) + String(next) + sentence.slice(at + token.length);
  }
  return null;
}

/** "Which matches what you read?" — answer and altered options all come from shown text. */
function checkShown(seen: string[], used: Set<string>, id: string): MultipleChoiceExercise | null {
  for (const truth of shuffle(seen)) {
    if (used.has(norm(truth))) continue;
    const lies = [truth, ...seen.filter(s => norm(s) !== norm(truth))]
      .map(alterNumber)
      .filter((s): s is string => typeof s === 'string' && norm(s) !== norm(truth))
      .filter(s => !used.has(`lie:${norm(s)}`));
    const uniqueLies = lies.filter((s, i) => lies.findIndex(o => norm(o) === norm(s)) === i).slice(0, 2);
    if (uniqueLies.length < 2) continue;
    const options = shuffle([truth, ...uniqueLies]);
    if (new Set(options.map(norm)).size !== options.length) continue;
    used.add(norm(truth));
    uniqueLies.forEach(l => used.add(`lie:${norm(l)}`));
    return {
      kind: 'multipleChoice',
      id,
      prompt: 'Which of these matches what you just read?',
      options,
      correctIndex: options.indexOf(truth),
      explanation: `Straight from what you just read: ${truth}`,
    };
  }
  return null;
}

export function buildBeats(
  stackTitle: string,
  rawSlides: SlideLike[],
  metadata?: StackMetadataLike,
  industry?: IndustryInput,
): BeatBuildResult {
  const goal = industry?.learningGoal;
  const slides: SlideLike[] = rawSlides
    .map(s => ({ ...s, body: filterForGoal(s.body, goal) }))
    .filter(s => s.body.trim().length > 0);
  const pack: IndustryPack | null = getIndustryPack(industry?.marketId);

  const exercises: Exercise[] = [];
  const slideNumbers: number[] = [];
  const seen: string[] = [];
  const usedTruths = new Set<string>();
  const push = (ex: Exercise | null, slideNumber: number, leo?: Exercise['leo']) => {
    if (!ex) return false;
    exercises.push(leo ? { ...ex, leo } : ex);
    slideNumbers.push(slideNumber);
    if (ex.kind === 'coldOpen' || ex.kind === 'microInsight') seen.push(...visibleLines(ex));
    return true;
  };

  const firstSlide = slides[0]?.slideNumber ?? 1;
  const lastSlide = slides[slides.length - 1]?.slideNumber ?? firstSlide;

  // 1. Cold open — the lesson's own line.
  push(makeColdOpen(slides, 'beat-open', pack ? pack.eyebrow : undefined), firstSlide);

  // 2. Insight card per slide, with a check on already-shown text in between.
  let checkCount = 0;
  slides.forEach((slide, slideIdx) => {
    push(makeMicroInsight(slide, `beat-insight-${slide.slideNumber}`, slide.title), slide.slideNumber);
    const isLast = slideIdx === slides.length - 1;
    if (!isLast && slideIdx % 2 === 1) {
      const added = push(checkShown(seen, usedTruths, `beat-check-${checkCount + 1}`), slide.slideNumber);
      if (added) checkCount += 1;
    }
  });

  // 3. Final check — still only what was shown.
  push(checkShown(seen, usedTruths, 'beat-check-final'), lastSlide);

  // 4. Takeaway, plus a cliffhanger for tomorrow.
  const takeaway = filterForGoal((metadata?.key_takeaway || '').trim(), goal);
  if (takeaway.length >= 12) {
    push(
      {
        kind: 'microInsight',
        id: 'beat-takeaway',
        eyebrow: 'Lock it in',
        text: takeaway,
        highlight: metadata?.next_preview?.trim() ? `Tomorrow: ${metadata.next_preview.trim()}` : undefined,
        fullText: [metadata?.recap_bridge, takeaway, metadata?.next_preview]
          .map(value => filterForGoal(value || '', goal))
          .filter(value => Boolean(value.trim()))
          .join('\n\n'),
        detailTitle: 'What to remember',
      },
      lastSlide,
    );
  }

  return {
    lesson: {
      id: stackTitle,
      title: stackTitle,
      exercises,

    },
    slideNumbers,
  };
}

// Kept for type compatibility with callers that import these names.
export type { KeyTerm, DrillRow };
export { sentences };
