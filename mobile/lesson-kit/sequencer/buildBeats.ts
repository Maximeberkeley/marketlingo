/**
 * Beat sequencer — turns a stack of slides plus the market's own content into a
 * rhythm of short beats: cold open, insight, industry game, insight, game,
 * boss call, takeaway. Leo speaks over every beat.
 *
 * Industry-specific material (authored packs, trainer scenarios, fact-checked
 * drills) is always preferred; slide-derived games are the fallback so any
 * market still plays.
 */
import { Exercise, KeyTerm, Lesson } from '../types';
import { IndustryPack, getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
import {
  drillSpotFake,
  drillTrueFalse,
  packChain,
  packFaceOff,
  packMap,
  packNumber,
  packSpeedRound,
  statColdOpen,
  statFaceOff,
  statLeoLine,
  statNumberSense,
  statTrend,
  trainerCall,
} from '../industry/build';
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

export interface IndustryInput {
  marketId?: string;
  marketName?: string;
  trainer?: TrainerScenarioRow[];
  drills?: DrillRow[];
  /** Real, sourced industry numbers and trends for this market. */
  stats?: IndustryStatRow[];
}

export interface BeatBuildResult {
  lesson: Lesson;
  /** Slide number behind each beat, for Note / Save actions. */
  slideNumbers: number[];
}

const rotate = <T,>(list: T[]) => shuffle(list);

function leoLine(pool: string[] | undefined, i: number): string | undefined {
  if (!pool?.length) return undefined;
  return pool[i % pool.length];
}

export function buildBeats(
  stackTitle: string,
  slides: SlideLike[],
  metadata?: StackMetadataLike,
  industry?: IndustryInput,
): BeatBuildResult {
  const pack: IndustryPack | null = getIndustryPack(industry?.marketId);
  const marketLabel = pack?.label || industry?.marketName || 'your market';
  const trainerRows = industry?.trainer ?? [];
  const drills = industry?.drills ?? [];
  const stats = industry?.stats ?? [];
  // Leo speaks with real figures whenever the market has them.
  const statLines = shuffle(stats).map(statLeoLine);

  const exercises: Exercise[] = [];
  const slideNumbers: number[] = [];
  const push = (ex: Exercise | null, slideNumber: number, leo?: Exercise['leo']) => {
    if (!ex) return false;
    exercises.push(leo ? { ...ex, leo } : ex);
    slideNumbers.push(slideNumber);
    return true;
  };

  const firstSlide = slides[0]?.slideNumber ?? 1;
  const lastSlide = slides[slides.length - 1]?.slideNumber ?? firstSlide;
  const allTerms: KeyTerm[] = slides.flatMap(s => s.keyTerms || []);
  const bodyPool = slides.map(s => sentences(s.body));

  // 1. Cold open — the day's own number, or the market's signature hook.
  const opened = push(
    makeColdOpen(slides, 'beat-open', pack ? pack.eyebrow : undefined) ||
      statColdOpen(stats, 'beat-open-stat', pack?.eyebrow),
    firstSlide,
    {
      line: statLines[0] || leoLine(pack?.leo.open, 0) || `Two minutes inside ${marketLabel}. Let's go.`,
      mood: 'idle',
    },
  );
  if (!opened && pack) {
    push(
      {
        kind: 'coldOpen',
        id: 'beat-open-pack',
        eyebrow: pack.eyebrow,
        headline: pack.coldOpen.headline,
        kicker: pack.coldOpen.kicker,
      },
      firstSlide,
      { line: leoLine(pack.leo.open, 0), mood: 'idle' },
    );
  }

  // 2. Games — industry-specific first, slide-derived as backup.
  const industryFactories: (() => Exercise | null)[] = pack
    ? rotate([
        () => packMap(pack, `ind-map-${exercises.length}`),
        () => packFaceOff(pack, `ind-face-${exercises.length}`),
        () => packChain(pack, `ind-chain-${exercises.length}`),
        () => packNumber(pack, `ind-num-${exercises.length}`),
        () => packSpeedRound(pack, `ind-speed-${exercises.length}`),
      ])
    : [];
  if (stats.length >= 1) {
    industryFactories.unshift(() => statNumberSense(stats, `stat-num-${exercises.length}`));
    industryFactories.push(() => statTrend(stats, `stat-trend-${exercises.length}`));
  }
  if (stats.length >= 2) {
    industryFactories.push(() => statFaceOff(stats, `stat-face-${exercises.length}`));
  }
  if (drills.length >= 3) {
    industryFactories.push(() =>
      drillSpotFake(drills, `ind-fake-${exercises.length}`, `One of these ${marketLabel} facts is false. Which one?`),
    );
    industryFactories.push(() => drillTrueFalse(drills, `ind-tf-${exercises.length}`));
  }

  const slideFactories: ((slideIdx: number) => Exercise | null)[] = rotate([
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

  let industryCursor = 0;
  let slideCursor = 0;

  const nextGame = (slideIdx: number): Exercise | null => {
    // Prefer the market's own material.
    for (let tries = 0; tries < industryFactories.length; tries++) {
      const factory = industryFactories[(industryCursor + tries) % industryFactories.length];
      const built = factory();
      if (built) {
        industryCursor = (industryCursor + tries + 1) % industryFactories.length;
        return built;
      }
    }
    for (let tries = 0; tries < slideFactories.length; tries++) {
      const factory = slideFactories[(slideCursor + tries) % slideFactories.length];
      const built = factory(slideIdx);
      if (built) {
        slideCursor = (slideCursor + tries + 1) % slideFactories.length;
        return built;
      }
    }
    const others = bodyPool.filter((_, i) => i !== slideIdx).flat();
    return slides[slideIdx] ? makeRecall(slides[slideIdx], others, `beat-recall-${exercises.length}`) : null;
  };

  // 3. Alternate insight → game across the slides.
  let gameCount = 0;
  slides.forEach((slide, slideIdx) => {
    push(makeMicroInsight(slide, `beat-insight-${slide.slideNumber}`, slide.title), slide.slideNumber, {
      line: undefined,
      mood: 'idle',
    });
    const isLast = slideIdx === slides.length - 1;
    if (!isLast || slides.length === 1) {
      const added = push(nextGame(slideIdx), slide.slideNumber, {
        line: statLines.length
          ? statLines[gameCount % statLines.length]
          : leoLine(pack?.leo.game, gameCount),
        mood: 'thinking',
      });
      if (added) gameCount += 1;
    }
  });

  // 4. Boss beat — a real scenario from this market, or tamper detection.
  const boss =
    trainerCall(shuffle(trainerRows)[0], 'beat-boss-call') ||
    drillSpotFake(drills, 'beat-boss-fake', `One of these ${marketLabel} facts is false. Which one?`) ||
    makeSpotFake(slides, 'beat-boss');
  push(boss, lastSlide, {
    line: pack?.leo.boss || `Your call. Read it the way an insider in ${marketLabel} would.`,
    mood: 'thinking',
  });

  // 5. Takeaway, plus a cliffhanger for tomorrow.
  const takeaway = (metadata?.key_takeaway || '').trim();
  if (takeaway.length >= 12) {
    push(
      {
        kind: 'microInsight',
        id: 'beat-takeaway',
        eyebrow: 'Lock it in',
        text: takeaway,
        highlight: metadata?.next_preview?.trim() ? `Tomorrow: ${metadata.next_preview.trim()}` : undefined,
      },
      lastSlide,
      { line: pack?.leo.takeaway, mood: 'celebrate' },
    );
  }

  return {
    lesson: {
      id: stackTitle,
      title: stackTitle,
      exercises,
      leoReactions: {
        win: ['That is exactly how an insider reads it.', 'Clean. You are building real instinct.', 'Yes — you followed the money.'],
        miss: ['Not it, but now you know where to look.', 'Close. Re-read who carries the risk.', 'Wrong turn — this is the one people get wrong.'],
      },
    },
    slideNumbers,
  };
}
