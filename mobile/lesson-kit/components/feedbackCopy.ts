/**
 * What the feedback footer says after Check, shared by lessons, the Arena and Cases.
 *
 * The right option is already highlighted on screen for single-pick questions,
 * so the footer never prints it again (as an "Answer:" line or as a quote of the
 * same sentence). It uses the space for one distinction instead: what the
 * learner's own pick got wrong.
 */
import type { Exercise, ReviewCard } from '../types';
import type { SlideLike } from '../sequencer/extract';
import { normalizedCopy } from '../cardPresentation';

const CITE = /^straight from what you just read:\s*/i;
/** Kinds whose screen already shows the right option after Check. */
const ANSWER_ON_SCREEN = new Set(['multipleChoice', 'theCall', 'faceOff', 'spotFake', 'mapMarket']);

export function correctAnswerOf(exercise: Exercise | null | undefined): string | undefined {
  if (!exercise) return undefined;
  if (exercise.kind === 'multipleChoice') return exercise.options[exercise.correctIndex];
  if (exercise.kind === 'wordBank') return exercise.answer.join(' ');
  if (exercise.kind === 'theCall') return exercise.options[exercise.correctIndex];
  if (exercise.kind === 'faceOff') return exercise.correctIndex === 0 ? exercise.left.name : exercise.right.name;
  if (exercise.kind === 'spotFake') return exercise.statements[exercise.fakeIndex];
  if (exercise.kind === 'mapMarket') return exercise.nodes[exercise.correctIndex]?.label;
  return undefined;
}

/** Same words, ignoring case, punctuation and a short lead-in or tail. */
export function sameCopy(a: string, b: string): boolean {
  const x = normalizedCopy(a);
  const y = normalizedCopy(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length < y.length ? [x, y] : [y, x];
  return long.includes(short) && short.length / long.length >= 0.8;
}

export interface FeedbackCopy {
  /** Only when the right answer is not visible on screen. */
  answer?: string;
  insight?: string;
  whyWrong?: string;
}

export function feedbackCopy(exercise: Exercise, isCorrect: boolean, selectedIndex?: number): FeedbackCopy {
  const explanation = ('explanation' in exercise && exercise.explanation) || '';
  const correct = correctAnswerOf(exercise);
  const insight = correct && sameCopy(explanation.replace(CITE, ''), correct) ? '' : explanation;
  const answerShown = ANSWER_ON_SCREEN.has(exercise.kind) || Boolean(correct && insight && normalizedCopy(insight).includes(normalizedCopy(correct)));
  const why = !isCorrect && selectedIndex != null && 'whyWrong' in exercise ? exercise.whyWrong?.[selectedIndex] : null;
  return {
    answer: !isCorrect && correct && !answerShown ? correct : undefined,
    insight: insight || undefined,
    whyWrong: why || undefined,
  };
}

const card = (slide: SlideLike): ReviewCard => ({
  title: (slide.title || 'From your lesson').trim(),
  body: (slide.body || '').trim(),
});

/**
 * The lesson card a question came from: the slide that contains the quoted
 * sentence, else the slide sharing the most words with the question and its answer.
 */
export function reviewCardFor(slides: SlideLike[], exercise: Exercise): ReviewCard | undefined {
  const usable = slides.filter(s => (s.body || '').trim());
  if (!usable.length) return undefined;
  const explanation = ('explanation' in exercise && exercise.explanation) || '';
  const quoted = normalizedCopy(explanation.replace(CITE, ''));
  if (quoted.length >= 20) {
    const hit = usable.find(s => normalizedCopy(s.body || '').includes(quoted));
    if (hit) return card(hit);
  }
  const prompt = 'prompt' in exercise ? String(exercise.prompt || '') : '';
  const words = new Set(wordsOf([prompt, correctAnswerOf(exercise) || '', explanation].join(' ')));
  if (!words.size) return undefined;
  // Rare words decide: a company or term on one card outweighs a name every card repeats.
  const slideWords = usable.map(s => new Set(wordsOf(`${s.title || ''} ${s.body || ''}`)));
  const spread = (word: string) => slideWords.filter(set => set.has(word)).length || 1;
  let best = -1;
  let bestScore = 0;
  slideWords.forEach((set, index) => {
    const shared = [...words].filter(word => set.has(word));
    const score = shared.reduce((sum, word) => sum + 1 / spread(word), 0);
    if (shared.length >= 2 && score > bestScore) { best = index; bestScore = score; }
  });
  return best >= 0 && bestScore >= 1.5 ? card(usable[best]) : undefined;
}

/** Content words, lightly stemmed so "suppliers" matches "supplier". */
function wordsOf(text: string): string[] {
  return normalizedCopy(text).split(' ')
    .filter(word => word.length > 3)
    .map(word => (word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word));
}

/** Reading cards of a lesson, as slides a later question can point back to. */
export function readingSlides(exercises: Exercise[]): SlideLike[] {
  const slides: SlideLike[] = [];
  const add = (title: string | undefined, parts: Array<string | undefined>) => {
    const body = parts.filter(Boolean).join(' ').trim();
    if (body) slides.push({ slideNumber: slides.length + 1, title: (title || '').trim(), body });
  };
  for (const e of exercises) {
    if (e.kind === 'microInsight') add(e.eyebrow, [e.text, e.body]);
    else if (e.kind === 'info') add(e.title || e.eyebrow, [e.body, ...(e.bullets || [])]);
    else if (e.kind === 'coldOpen') add(e.detailTitle || e.eyebrow, [e.headline, e.fullText]);
  }
  return slides;
}
