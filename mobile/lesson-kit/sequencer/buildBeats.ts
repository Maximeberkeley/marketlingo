/**
 * Beat sequencer — turns a stack of slides into a rhythm of short beats:
 * cold open, insight, game, insight, game, boss round, takeaway.
 * Never more than one text beat in a row.
 */
import { Exercise, KeyTerm, Lesson } from '../types';
import {
  SlideLike,
  makeBuildChain,
  makeChartRead,
  makeColdOpen,
  makeMapMarket,
  makeMicroInsight,
  makeNumberSense,
  makeRecall,
  makeSortSignal,
  makeSpeedRound,
  makeSpotFake,
  sentences,
  shuffle,
} from './extract';

export interface StackMetadataLike {
  learning_objectives?: string[];
  key_takeaway?: string;
  recap_bridge?: string;
  next_preview?: string;
}

export interface BeatBuildResult {
  lesson: Lesson;
  /** Slide number behind each beat, for Note / Save actions. */
  slideNumbers: number[];
}

export function buildBeats(
  stackTitle: string,
  slides: SlideLike[],
  metadata?: StackMetadataLike,
): BeatBuildResult {
  const exercises: Exercise[] = [];
  const slideNumbers: number[] = [];
  const push = (ex: Exercise | null, slideNumber: number) => {
    if (!ex) return false;
    exercises.push(ex);
    slideNumbers.push(slideNumber);
    return true;
  };

  const firstSlide = slides[0]?.slideNumber ?? 1;
  const lastSlide = slides[slides.length - 1]?.slideNumber ?? firstSlide;
  const allTerms: KeyTerm[] = slides.flatMap(s => s.keyTerms || []);
  const bodyPool = slides.map(s => sentences(s.body));

  // 1. Cold open — a number that earns attention.
  push(makeColdOpen(slides, 'beat-open', metadata?.recap_bridge ? 'Picking up where you left off' : undefined), firstSlide);

  // 2. Game generators, rotated so no two lessons feel the same.
  const gameFactories: ((slideIdx: number) => Exercise | null)[] = shuffle([
    () => makeMapMarket(allTerms, `beat-map-${exercises.length}`),
    () => makeSpeedRound(allTerms, `beat-speed-${exercises.length}`),
    () => makeSortSignal(slides, `beat-sort-${exercises.length}`),
    () => makeNumberSense(slides, `beat-num-${exercises.length}`),
    (slideIdx: number) =>
      makeBuildChain(
        sentences(slides[slideIdx]?.body || '', 20, 90),
        `beat-chain-${exercises.length}`,
        `Order the steps behind "${slides[slideIdx]?.title ?? stackTitle}"`,
      ),
    () => makeChartRead(slides, `beat-chart-${exercises.length}`),
  ]);
  let gameCursor = 0;

  const nextGame = (slideIdx: number): Exercise | null => {
    for (let tries = 0; tries < gameFactories.length; tries++) {
      const factory = gameFactories[(gameCursor + tries) % gameFactories.length];
      const built = factory(slideIdx);
      if (built) {
        gameCursor = (gameCursor + tries + 1) % gameFactories.length;
        return built;
      }
    }
    // Last resort: a recall question built from real sentences.
    const others = bodyPool.filter((_, i) => i !== slideIdx).flat();
    return slides[slideIdx] ? makeRecall(slides[slideIdx], others, `beat-recall-${exercises.length}`) : null;
  };

  // 3. Alternate insight → game across the slides.
  slides.forEach((slide, slideIdx) => {
    push(
      makeMicroInsight(slide, `beat-insight-${slide.slideNumber}`, slide.title),
      slide.slideNumber,
    );
    const isLast = slideIdx === slides.length - 1;
    if (!isLast || slides.length === 1) {
      push(nextGame(slideIdx), slide.slideNumber);
    }
  });

  // 4. Boss round — tamper detection over everything just covered.
  push(makeSpotFake(slides, 'beat-boss'), lastSlide);

  // 5. Takeaway, plus a cliffhanger for tomorrow.
  const takeaway = (metadata?.key_takeaway || '').trim();
  if (takeaway.length >= 12) {
    push(
      {
        kind: 'microInsight',
        id: 'beat-takeaway',
        eyebrow: 'Lock it in',
        text: takeaway,
        highlight: metadata?.next_preview?.trim()
          ? `Tomorrow: ${metadata.next_preview.trim()}`
          : undefined,
      },
      lastSlide,
    );
  }

  return { lesson: { id: stackTitle, title: stackTitle, exercises }, slideNumbers };
}
