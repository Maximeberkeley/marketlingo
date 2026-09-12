/**
 * Turns real MarketLingo content — industry packs, trainer scenarios and
 * fact-checked drill statements — into playable exercises.
 *
 * Nothing here invents a fact: pack material is authored, trainer and drill
 * material comes straight from the database, and every builder returns null
 * rather than shipping an ambiguous question.
 */
import {
  BuildChainExercise,
  Exercise,
  FaceOffExercise,
  MapMarketExercise,
  NumberSenseExercise,
  SpeedRoundExercise,
  SpotFakeExercise,
  TheCallExercise,
} from '../types';
import { IndustryPack } from './packs';
import type { DrillRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = <T,>(arr: T[]): T | undefined => shuffle(arr)[0];

// ── Pack-driven modules ────────────────────────────────────────────

export function packFaceOff(pack: IndustryPack, id: string): FaceOffExercise | null {
  const item = pick(pack.faceOffs);
  if (!item) return null;
  return { kind: 'faceOff', id, ...item };
}

export function packChain(pack: IndustryPack, id: string): BuildChainExercise | null {
  const item = pick(pack.chains);
  if (!item || item.steps.length < 3) return null;
  return { kind: 'buildChain', id, prompt: item.prompt, steps: item.steps, explanation: item.explanation };
}

export function packMap(pack: IndustryPack, id: string): MapMarketExercise | null {
  const item = pick(pack.maps);
  if (!item || item.nodes.length < 3) return null;
  return {
    kind: 'mapMarket',
    id,
    prompt: item.prompt,
    nodes: item.nodes,
    correctIndex: item.correctIndex,
    explanation: item.explanation,
  };
}

export function packNumber(pack: IndustryPack, id: string): NumberSenseExercise | null {
  const item = pick(pack.numbers);
  if (!item) return null;
  return { kind: 'numberSense', id, ...item };
}

/** Beat the clock on the market's own vocabulary. */
export function packSpeedRound(pack: IndustryPack, id: string): SpeedRoundExercise | null {
  const clean = pack.jargon.filter(j => j.term && j.definition);
  if (clean.length < 4) return null;
  const picks = shuffle(clean).slice(0, 5);
  const rounds = picks.map(t => {
    const decoys = shuffle(clean.filter(c => c.term !== t.term)).slice(0, 2).map(c => c.term);
    const options = shuffle([t.term, ...decoys]);
    return { question: t.definition, options, correctIndex: options.indexOf(t.term) };
  });
  return {
    kind: 'speedRound',
    id,
    prompt: `${pack.label} vocabulary, against the clock`,
    seconds: Math.max(18, rounds.length * 7),
    rounds,
  };
}

// ── Database-driven modules ────────────────────────────────────────

/**
 * The boss beat, built from a real trainer scenario for this market: an
 * insider situation, four defensible options, then the consequences of the
 * call spelled out the way a mentor would.
 */
export function trainerCall(row: TrainerScenarioRow | undefined, id: string): TheCallExercise | null {
  if (!row) return null;
  const options = row.options.map(o => o.label.trim()).filter(Boolean);
  if (options.length < 2) return null;
  const flagged = row.options.findIndex(o => o.isCorrect);
  const correctIndex = flagged >= 0 ? flagged : row.correct_option_index;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  const consequences = [
    row.feedback_pro_reasoning,
    row.feedback_common_mistake ? `Common mistake: ${row.feedback_common_mistake}` : null,
    row.feedback_mental_model ? `Mental model: ${row.feedback_mental_model}` : null,
  ].filter((c): c is string => !!c && c.trim().length > 10);

  return {
    kind: 'theCall',
    id,
    situation: row.scenario.trim(),
    prompt: row.question.trim(),
    options,
    correctIndex,
    consequences: consequences.length ? consequences : undefined,
    explanation: row.feedback_mental_model?.trim() || row.feedback_pro_reasoning?.trim() || undefined,
  };
}

/**
 * Spot the fake, built from the market's own fact-checked drill bank: one
 * verified-false statement hidden among verified-true ones. No mutation of
 * real text, so the answer is never a coin flip.
 */
export function drillSpotFake(drills: DrillRow[], id: string, prompt?: string): SpotFakeExercise | null {
  const fake = pick(drills.filter(d => !d.is_true));
  const truths = shuffle(drills.filter(d => d.is_true)).slice(0, 2);
  if (!fake || truths.length < 2) return null;
  const statements = shuffle([fake.statement, ...truths.map(t => t.statement)]);
  return {
    kind: 'spotFake',
    id,
    prompt: prompt || 'One of these is false. Which one?',
    statements,
    fakeIndex: statements.indexOf(fake.statement),
    explanation: fake.explanation?.trim() || undefined,
  };
}

/** A quick true/false read on a single market fact. */
export function drillTrueFalse(drills: DrillRow[], id: string): Exercise | null {
  const row = pick(drills);
  if (!row) return null;
  const options = ['True', 'False'];
  return {
    kind: 'multipleChoice',
    id,
    prompt: row.statement,
    options,
    correctIndex: row.is_true ? 0 : 1,
    explanation: row.explanation?.trim() || undefined,
  };
}
