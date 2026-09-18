/**
 * Arena builder — three escalating waves built on the lessons this learner has
 * already studied, in EVERY market.
 *
 * Wave 1 "Warm-up": recognition of what the lessons defined and claimed.
 * Wave 2 "Pressure": the mechanisms and figures those lessons taught.
 * Wave 3 "Sudden death": tampered claims and a real call from the market.
 *
 * Studied-lesson material always comes first; authored packs, trainer
 * scenarios, fact-checked drills and sourced statistics fill any gap so a
 * market with thin lesson text still plays.
 */
import { Exercise } from '../types';
import { getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
import type { SlideLike } from '../sequencer/extract';
import {
  checkClaim,
  checkDefinition,
  checkFigure,
  checkMechanism,
  checkTamper,
  termsFromSlides,
} from '../sequencer/lessonChecks';
import {
  drillSpotFake,
  drillTrueFalse,
  packChain,
  packFaceOff,
  packMap,
  packNumber,
  packSpeedRound,
  statFaceOff,
  statNumberSense,
  statTrend,
  trainerCall,
} from '../industry/build';

export interface ArenaWave {
  key: string;
  name: string;
  tagline: string;
  /** Seconds allowed per beat in this wave. */
  seconds: number;
  /** Points multiplier for the wave. */
  multiplier: number;
  exercises: Exercise[];
}

/** A lesson the learner has already read, used as practice material. */
export interface StudiedLessonInput {
  stackId?: string;
  title: string;
  day?: number | null;
  slides: SlideLike[];
}

export interface ArenaInput {
  marketId?: string;
  marketName?: string;
  trainer: TrainerScenarioRow[];
  drills: DrillRow[];
  stats: IndustryStatRow[];
  /** Lessons behind the learner, newest first. */
  studied?: StudiedLessonInput[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const clean = (list: (Exercise | null)[], limit: number): Exercise[] =>
  shuffle(list.filter((e): e is Exercise => !!e)).slice(0, limit);

type LessonCheck = (slides: SlideLike[], id: string) => Exercise | null;

/**
 * One beat per studied lesson, tagged with the lesson it came from so the
 * learner recognises the material as their own.
 */
function fromStudied(
  studied: StudiedLessonInput[] | undefined,
  build: LessonCheck,
  prefix: string,
): (Exercise | null)[] {
  if (!studied?.length) return [];
  return studied.slice(0, 4).map((lesson, i) => build(lesson.slides, `${prefix}-${i}`));
}

export function buildArena(input: ArenaInput): ArenaWave[] {
  const pack = getIndustryPack(input.marketId);
  const { trainer, drills, stats, studied } = input;
  const trainerPool = shuffle(trainer);

  // ── Wave 1 — recognition of what the lessons taught ──
  const wave1 = clean(
    [
      ...fromStudied(studied, (slides, id) => checkDefinition(termsFromSlides(slides), id), 'a1-def'),
      ...fromStudied(studied, checkClaim, 'a1-claim'),
      pack ? packFaceOff(pack, 'a1-faceoff') : null,
      statFaceOff(stats, 'a1-statface'),
      drillTrueFalse(drills, 'a1-tf1'),
      statTrend(stats, 'a1-trend'),
    ],
    4,
  );

  // ── Wave 2 — the mechanisms and figures from those lessons ──
  const wave2 = clean(
    [
      ...fromStudied(studied, checkMechanism, 'a2-mech'),
      ...fromStudied(studied, checkFigure, 'a2-fig'),
      pack ? packChain(pack, 'a2-chain') : null,
      statNumberSense(stats, 'a2-number'),
      drillSpotFake(drills, 'a2-fake', 'One of these is not true. Find it.'),
      pack ? packMap(pack, 'a2-map') : null,
      pack ? packNumber(pack, 'a2-packnumber') : null,
    ],
    4,
  );

  // ── Wave 3 — sudden death, double points ──
  const wave3 = clean(
    [
      ...fromStudied(studied, checkTamper, 'a3-tamper'),
      trainerCall(trainerPool[0], 'a3-call1'),
      trainerCall(trainerPool[1], 'a3-call2'),
      drillSpotFake(drills, 'a3-fake', 'Sudden death. Spot the false claim.'),
      pack ? packSpeedRound(pack, 'a3-speed') : null,
    ],
    3,
  );

  const waves: ArenaWave[] = [
    {
      key: 'warmup',
      name: 'Warm-up',
      tagline: 'Get your eye in. 20 seconds a call.',
      seconds: 20,
      multiplier: 1,
      exercises: wave1,
    },
    {
      key: 'pressure',
      name: 'Pressure',
      tagline: 'Clock tightens. Combos pay double.',
      seconds: 15,
      multiplier: 2,
      exercises: wave2,
    },
    {
      key: 'sudden',
      name: 'Sudden death',
      tagline: 'Triple points. One miss ends the run.',
      seconds: 25,
      multiplier: 3,
      exercises: wave3,
    },
  ];

  return waves.filter(w => w.exercises.length > 0);
}

export interface ArenaRank {
  key: string;
  label: string;
  color: string;
  min: number;
}

export const ARENA_RANKS: ArenaRank[] = [
  { key: 'diamond', label: 'Diamond Desk', color: '#38BDF8', min: 900 },
  { key: 'gold', label: 'Gold Desk', color: '#F59E0B', min: 600 },
  { key: 'silver', label: 'Silver Desk', color: '#94A3B8', min: 350 },
  { key: 'bronze', label: 'Bronze Desk', color: '#FB923C', min: 0 },
];

export function rankForScore(score: number): ArenaRank {
  return ARENA_RANKS.find(r => score >= r.min) || ARENA_RANKS[ARENA_RANKS.length - 1];
}
