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
  ColdOpenExercise,
  Exercise,
  FaceOffExercise,
  MapMarketExercise,
  NumberSenseExercise,
  SpeedRoundExercise,
  SpotFakeExercise,
  TheCallExercise,
} from '../types';
import { IndustryPack } from './packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';

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

// ── Real industry numbers (industry_stats) ─────────────────────────

function fmtStat(s: IndustryStatRow): string {
  const v = s.value >= 100 ? Math.round(s.value).toLocaleString('en-US') : String(s.value);
  return s.unit ? `${v} ${s.unit}` : v;
}

/** Source credit line, so every number on screen is attributable. */
export function statCredit(s: IndustryStatRow): string {
  const bits = [s.source_name, s.period_label].filter(Boolean).join(', ');
  const approx = s.is_approximate ? 'approx. ' : '';
  return bits ? `${approx}${fmtStat(s)} — ${bits}` : `${approx}${fmtStat(s)}`;
}

/** Leo quoting a real number instead of a generic pep line. */
export function statLeoLine(s: IndustryStatRow): string {
  if (s.insight && s.insight.trim().length > 20) return s.insight.trim();
  return `${s.label}: ${statCredit(s)}.`;
}

/** Guess the real figure on a dial, then see the sourced answer. */
export function statNumberSense(stats: IndustryStatRow[], id: string): NumberSenseExercise | null {
  const s = pick(stats);
  if (!s) return null;
  return {
    kind: 'numberSense',
    id,
    prompt: s.label,
    min: s.min_value,
    max: s.max_value,
    value: s.value,
    unit: s.unit || undefined,
    tolerance: 0.15,
    explanation: `${statCredit(s)}${s.trend_note ? `. ${s.trend_note}` : ''}`,
  };
}

/** Read the direction of a real trend — rising, falling or flat. */
export function statTrend(stats: IndustryStatRow[], id: string): Exercise | null {
  const s = pick(stats);
  if (!s) return null;
  const options = ['Rising', 'Falling', 'Roughly flat'];
  const correctIndex = s.trend === 'up' ? 0 : s.trend === 'down' ? 1 : 2;
  return {
    kind: 'multipleChoice',
    id,
    prompt: `${s.label} is ${fmtStat(s)}${s.period_label ? ` (${s.period_label})` : ''}. Which way is it moving?`,
    options,
    correctIndex,
    explanation: `${s.trend_note || 'That is the direction the data has been going.'} Source: ${s.source_name || 'industry data'}.`,
  };
}

/** Which of two real figures is the bigger one? */
export function statFaceOff(stats: IndustryStatRow[], id: string): FaceOffExercise | null {
  const two = shuffle(stats).slice(0, 2);
  if (two.length < 2 || two[0].value === two[1].value) return null;
  const [a, b] = two;
  const bigger = a.value > b.value ? 0 : 1;
  return {
    kind: 'faceOff',
    id,
    prompt: 'Which number is the bigger one?',
    left: { name: a.label, note: a.unit || undefined },
    right: { name: b.label, note: b.unit || undefined },
    correctIndex: bigger as 0 | 1,
    explanation: `${statCredit(a)} vs ${statCredit(b)}.`,
  };
}

/** Open on a real, sourced figure from this market. */
export function statColdOpen(stats: IndustryStatRow[], id: string, eyebrow?: string): ColdOpenExercise | null {
  const s = pick(stats.filter(x => !!x.insight));
  if (!s) return null;
  return {
    kind: 'coldOpen',
    id,
    eyebrow: eyebrow || 'By the numbers',
    headline: `${s.label}: ${fmtStat(s)}.`,
    kicker: `${s.insight}${s.source_name ? ` (${s.source_name}${s.period_label ? `, ${s.period_label}` : ''})` : ''}`,
  };
}
