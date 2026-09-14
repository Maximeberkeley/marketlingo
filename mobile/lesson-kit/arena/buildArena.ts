/**
 * Arena builder — three escalating waves of the market's own material.
 *
 * Wave 1 "Warm-up": recognition beats (face-offs, true/false).
 * Wave 2 "Pressure": mechanics (chains, maps, number sense, spot the fake).
 * Wave 3 "Sudden death": the hardest beats, double points, no second chances.
 *
 * Nothing is invented: every beat comes from an authored industry pack, a real
 * trainer scenario, a fact-checked drill or a sourced industry statistic.
 */
import { Exercise } from '../types';
import { getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
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

export interface ArenaInput {
  marketId?: string;
  marketName?: string;
  trainer: TrainerScenarioRow[];
  drills: DrillRow[];
  stats: IndustryStatRow[];
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

export function buildArena(input: ArenaInput): ArenaWave[] {
  const pack = getIndustryPack(input.marketId);
  const { trainer, drills, stats } = input;
  const trainerPool = shuffle(trainer);

  // ── Wave 1 — recognition, generous clock ──
  const wave1 = clean(
    [
      pack ? packFaceOff(pack, 'a1-faceoff') : null,
      statFaceOff(stats, 'a1-statface'),
      drillTrueFalse(drills, 'a1-tf1'),
      drillTrueFalse(drills, 'a1-tf2'),
      statTrend(stats, 'a1-trend'),
      pack ? packFaceOff(pack, 'a1-faceoff2') : null,
    ],
    4,
  );

  // ── Wave 2 — mechanics under pressure ──
  const wave2 = clean(
    [
      pack ? packChain(pack, 'a2-chain') : null,
      pack ? packMap(pack, 'a2-map') : null,
      statNumberSense(stats, 'a2-number'),
      pack ? packNumber(pack, 'a2-packnumber') : null,
      drillSpotFake(drills, 'a2-fake', 'One of these is not true. Find it.'),
      pack ? packSpeedRound(pack, 'a2-speed') : null,
    ],
    4,
  );

  // ── Wave 3 — sudden death, double points ──
  const wave3 = clean(
    [
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
