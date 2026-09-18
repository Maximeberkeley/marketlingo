/**
 * Deep Case builder — one long-form, four-stage case per run.
 *
 * Stage 1 Brief      — the real situation, in two short lines.
 * Stage 2 Evidence   — separate the signal from the noise.
 * Stage 3 Numbers    — size the thing before deciding.
 * Stage 4 The Call   — commit, with a confidence level.
 *
 * Evidence and Numbers are drawn from the lessons the learner has already
 * studied in this market, so the case rewards what they read rather than
 * general market trivia. Drills, statistics and authored pack material fill any
 * gap. Nothing is invented.
 */
import { Exercise } from '../types';
import { getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
import type { StudiedLessonInput } from '../arena/buildArena';
import { checkClaim, checkFigure, checkMechanism } from '../sequencer/lessonChecks';
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
  /** Lessons the learner has already studied, newest first. */
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

function caseLead(text: string, fallback: string): string {
  const first = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/)[0]?.trim();
  if (first && first.length <= 190) return first;
  const clause = first?.slice(0, 190).split(/[,;:]/)[0]?.trim();
  return clause && clause.length >= 55 ? `${clause}.` : fallback;
}

/** Slides from the lessons the learner has studied, newest lesson first. */
const studiedSlides = (studied?: StudiedLessonInput[]) => (studied ?? []).flatMap(l => l.slides);

export function buildCase(input: CaseInput): DeepCase | null {
  const pack = getIndustryPack(input.marketId);
  const scenario = shuffle(input.trainer)[0];
  const lessonSlides = studiedSlides(input.studied);
  const lead = input.studied?.[0];

  // The call tests the lesson first: a claim from what the learner actually read.
  // A real market scenario only stands in when no studied lesson can carry it.
  const call =
    checkClaim(lessonSlides, 'case-call-claim') || trainerCall(scenario, 'case-call');
  if (!call) return null;

  const stages: CaseStage[] = [];

  // The brief is framed by the learner's own lesson whenever there is one, so the
  // case reads as a continuation of what they studied rather than market trivia.
  const briefHeadline = lead
    ? caseLead(
        lead.slides?.[0]?.body || lead.title,
        `You are back on ${lead.title}. Time to use it.`,
      )
    : scenario
      ? caseLead(scenario.scenario, scenario.question)
      : `You are back on ${input.marketName} fundamentals. Time to use it.`;
  const briefDetail = lead?.title || scenario?.question || `${input.marketName} case`;


  stages.push({
    key: 'brief',
    label: 'Brief',
    hint: 'Read the room before you read the numbers.',
    exercise: {
      kind: 'coldOpen',
      id: 'case-brief',
      eyebrow: `${input.marketName.toUpperCase()} CASE`,
      headline: briefHeadline,
      kicker: lead?.day
        ? `Built on what you studied — day ${lead.day}. Four stages, one call.`
        : 'Four stages. One call at the end.',
      fullText: lead?.slides?.[1]?.body || lead?.slides?.[0]?.body || scenario?.scenario,
      detailTitle: briefDetail,
      leo: { line: 'Take the brief slowly. The trap is usually in the first sentence.', mood: 'thinking' },
    } as Exercise,
  });

  // Evidence and Numbers come from the learner's own lessons first.
  const evidence =
    checkMechanism(lessonSlides, 'case-evidence-lesson') ||
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
    checkFigure(lessonSlides, 'case-numbers-lesson') ||
    statNumberSense(input.stats, 'case-numbers') ||
    (pack ? packNumber(pack, 'case-numbers-pack') : null);

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
    id: lead ? `lesson-case-${lead.day ?? 1}-${lead.stackId ?? 'x'}` : scenario?.id || 'market-case',
    title: briefDetail,
    situation: lead?.slides?.[0]?.body || scenario?.scenario || briefHeadline,
    stages,
    proReasoning: scenario?.feedback_pro_reasoning ?? null,
    commonMistake: scenario?.feedback_common_mistake ?? null,
    mentalModel: scenario?.feedback_mental_model ?? null,
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
