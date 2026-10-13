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
import { Exercise, KeyTerm, Lesson } from '../types';
import { IndustryPack, getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
import { SlideLike, makeColdOpen, makeMicroInsight, sentences } from './extract';
import { splitSentences } from '../../lib/textUtils';
import { cardCopy, readingCardKind } from '../cardPresentation';

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

/** Keep industry facts, but remove direct startup-builder instructions for other goals. */
export function filterForGoal(text: string, learningGoal?: string | null): string {
  if (learningGoal === 'build_startup') return text;
  return (text || '')
    .split(/\n/)
    .map(line =>
      splitSentences(line)
        .map(stripStartup)
        .map(s => s
          .replace(/\b(?:your\s+)?startup superpower\b/gi, 'key advantage')
          .replace(/\bbuild your\b(?=[^.!?]*\bfrom day one\b)/gi, 'Develop the')
          .replace(/\bfrom day one\b/gi, 'from the start')
          .replace(/\bstartups don['’]t\b/gi, 'New companies do not'))
        .filter(s => s.trim())
        .join(' '),
    )
    .filter((line, i, all) => line.trim() || (i > 0 && all[i - 1].trim()))
    .join('\n')
    .trim();
}

/** Sanitize authored copy too, without altering IDs, sources, option order or grading. */
export function lessonForGoal(lesson: Lesson, goal?: string | null): Lesson {
  const copyFields = new Set(['title', 'subtitle', 'headline', 'kicker', 'eyebrow', 'text', 'body',
    'highlight', 'fullText', 'detailTitle', 'prompt', 'situation', 'explanation', 'takeaway',
    'line', 'term', 'definition', 'name', 'note', 'why']);
  const copyArrays = new Set(['options', 'bullets', 'consequences', 'steps', 'answer', 'distractors', 'statements']);
  const sanitize = (value: any, field = ''): any => {
    if (typeof value === 'string') return copyFields.has(field) || copyArrays.has(field) ? filterForGoal(value, goal) : value;
    if (Array.isArray(value)) return value.map(item => sanitize(item, field));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item, key)]));
    return value;
  };
  return sanitize(lesson) as Lesson;
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
    if (ex.body) out.push(...cardCopy(ex).slice(1, 2));
  }
  return out.flatMap(t => splitSentences(clean(t))).map(clean).filter(s => s.length >= 30);
}

/** Merge only adjacent insights, never across a check or into the opening/rule. */
export function mergeThinReadingCards(exercises: Exercise[], slideNumbers: number[]): BeatBuildResult {
  const merged: Exercise[] = [];
  const numbers: number[] = [];
  for (let index = 0; index < exercises.length; index += 1) {
    const first = exercises[index];
    const next = exercises[index + 1];
    const words = cardCopy(first).join(' ').trim().split(/\s+/).filter(Boolean).length;
    if (first.kind === 'microInsight' && next?.kind === 'microInsight' && words < 25 &&
      readingCardKind(first) !== 'takeaway' && readingCardKind(next) !== 'takeaway') {
      const firstCopy = cardCopy(first);
      const nextCopy = cardCopy(next);
      merged.push({ ...first, text: firstCopy[0],
        mergedCards: [{ ...first, sourceSlideNumber: slideNumbers[index] }, { ...next, sourceSlideNumber: slideNumbers[index + 1] }],
        sourceSlideNumber: slideNumbers[index],
        body: [...firstCopy.slice(1), ...nextCopy].filter(Boolean).join('\n\n'), highlight: undefined,
        fullText: [first.fullText, next.fullText].filter(Boolean).join('\n\n'),
        keyTerms: [...(first.keyTerms || (first.keyTerm ? [first.keyTerm] : [])), ...(next.keyTerms || (next.keyTerm ? [next.keyTerm] : []))],
        sources: [...(first.sources || []), ...(next.sources || [])],
      });
      numbers.push(slideNumbers[index]);
      index += 1;
    } else {
      merged.push(first);
      numbers.push(slideNumbers[index]);
    }
  }
  return { lesson: { id: '', title: '', exercises: merged }, slideNumbers: numbers };
}

export function buildBeats(
  stackTitle: string,
  rawSlides: SlideLike[],
  metadata?: StackMetadataLike,
  industry?: IndustryInput,
): BeatBuildResult {
  const goal = industry?.learningGoal;
  const slides: SlideLike[] = rawSlides
    .map(s => ({ ...s, title: filterForGoal(s.title || '', goal), body: filterForGoal(s.body, goal) }))
    .filter(s => s.body.trim().length > 0);
  const pack: IndustryPack | null = getIndustryPack(industry?.marketId);

  const exercises: Exercise[] = [];
  const slideNumbers: number[] = [];
  const seen: string[] = [];
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

  // Legacy slide-only lessons are reading-only. Real written checks live in
  // authored_lesson; never invent questions from numbers or a takeaway.
  slides.forEach(slide => {
    push(makeMicroInsight(slide, `beat-insight-${slide.slideNumber}`, slide.title), slide.slideNumber);
  });

  const takeaway = filterForGoal((metadata?.key_takeaway || '').trim(), goal) ||
    seen[seen.length - 1] || splitSentences(slides[slides.length - 1]?.body || '')[0] || '';
  if (takeaway.length >= 12) {
    push(
      {
        kind: 'microInsight',
        id: 'beat-takeaway',
        eyebrow: 'Lock it in',
        text: takeaway,
        highlight: metadata?.next_preview?.trim() ? `Tomorrow: ${filterForGoal(metadata.next_preview.trim(), goal)}` : undefined,
        fullText: [metadata?.recap_bridge, takeaway, metadata?.next_preview]
          .map(value => filterForGoal(value || '', goal))
          .filter(value => Boolean(value.trim()))
          .join('\n\n'),
        detailTitle: 'What to remember',
      },
      lastSlide,
    );
  }

  const merged = mergeThinReadingCards(exercises, slideNumbers);
  return {
    lesson: {
      id: stackTitle,
      title: stackTitle,
      exercises: merged.lesson.exercises,

    },
    slideNumbers: merged.slideNumbers,
  };
}

// Kept for type compatibility with callers that import these names.
export type { KeyTerm, DrillRow };
export { sentences };
