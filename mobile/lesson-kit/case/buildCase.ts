/**
 * Deep Case builder — one long-form, four-stage case per run.
 *
 * Stage 1 Brief      — the real situation, in two short lines.
 * Stage 2 Evidence   — separate the signal from the noise.
 * Stage 3 Numbers    — size the thing before deciding.
 * Stage 4 The Call   — commit, with a confidence level.
 *
 * All material is real: trainer scenarios and fact-checked drills come from the
 * database, statistics are sourced, pack material is hand-authored.
 */
import { Exercise } from '../types';
import { getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
import {
  drillSpotFake,
  packChain,
  packMap,
  packNumber,
  statNumberSense,
  trainerCall,
} from '../industry/build';

export interface CaseStage {
  key: string;
  label: string;
  hint: string;
  exercise: Exercise;
}

export interface DeepCase {
  id: string;
  title: string;
  situation: string;
  stages: CaseStage[];
  proReasoning?: string | null;
  commonMistake?: string | null;
  mentalModel?: string | null;
}

export interface CaseInput {
  marketId?: string;
  marketName: string;
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

export function buildCase(input: CaseInput): DeepCase | null {
  const pack = getIndustryPack(input.marketId);
  const scenario = shuffle(input.trainer)[0];
  if (!scenario) return null;

  const call = trainerCall(scenario, 'case-call');
  if (!call) return null;

  const stages: CaseStage[] = [];

  stages.push({
    key: 'brief',
    label: 'Brief',
    hint: 'Read the room before you read the numbers.',
    exercise: {
      kind: 'coldOpen',
      id: 'case-brief',
      eyebrow: `${input.marketName.toUpperCase()} CASE`,
      headline: scenario.scenario,
      kicker: 'Four stages. One call at the end.',
      leo: { line: 'Take the brief slowly. The trap is usually in the first sentence.', mood: 'thinking' },
    } as Exercise,
  });

  const evidence =
    drillSpotFake(input.drills, 'case-evidence', 'One of these claims does not hold. Which one?') ||
    (pack ? packMap(pack, 'case-evidence-map') : null) ||
    (pack ? packChain(pack, 'case-evidence-chain') : null);

  if (evidence) {
    stages.push({
      key: 'evidence',
      label: 'Evidence',
      hint: 'Separate the signal from the noise.',
      exercise: { ...evidence, leo: { line: 'Weak evidence sinks strong calls. Check it first.', mood: 'idle' } },
    });
  }

  const numbers =
    statNumberSense(input.stats, 'case-numbers') || (pack ? packNumber(pack, 'case-numbers-pack') : null);

  if (numbers) {
    stages.push({
      key: 'numbers',
      label: 'Numbers',
      hint: 'Size it before you decide.',
      exercise: { ...numbers, leo: { line: 'Get the order of magnitude right. Precision comes later.', mood: 'idle' } },
    });
  }

  stages.push({
    key: 'call',
    label: 'The Call',
    hint: 'Commit, then live with it.',
    exercise: { ...call, leo: { line: 'This is the moment. Make the call you would defend out loud.', mood: 'thinking' } },
  });

  return {
    id: scenario.id,
    title: scenario.question,
    situation: scenario.scenario,
    stages,
    proReasoning: scenario.feedback_pro_reasoning,
    commonMistake: scenario.feedback_common_mistake,
    mentalModel: scenario.feedback_mental_model,
  };
}

export type CaseGrade = 'A' | 'B' | 'C' | 'D';

/** Grade combines accuracy with how well confidence was calibrated. */
export function gradeCase(
  correct: number,
  total: number,
  callCorrect: boolean,
  confidence: 'low' | 'medium' | 'high',
): { grade: CaseGrade; note: string } {
  const accuracy = total > 0 ? correct / total : 0;
  const boldRight = callCorrect && confidence === 'high';
  const boldWrong = !callCorrect && confidence === 'high';

  if (callCorrect && accuracy >= 0.85) {
    return {
      grade: 'A',
      note: boldRight
        ? 'Right call, high conviction, evidence to back it. That is how a desk earns trust.'
        : 'Right call with clean work. Next time back it with more conviction.',
    };
  }
  if (callCorrect) {
    return { grade: 'B', note: 'You got the call. Tighten the evidence work and this becomes an A.' };
  }
  if (accuracy >= 0.6) {
    return {
      grade: 'C',
      note: boldWrong
        ? 'Solid analysis, wrong call, too much conviction. Calibration is the lesson here.'
        : 'The analysis held up. The final judgement did not. Re-read the brief.',
    };
  }
  return { grade: 'D', note: 'The evidence slipped early and the call followed it. Run this case again.' };
}
