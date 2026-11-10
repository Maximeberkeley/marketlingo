/**
 * Hand-written Deep Cases (table deep_cases): three per course day. A case
 * shares its situation, evidence and numbers across learner goals; the final
 * call and the debrief are written for each goal.
 */
import type { Exercise, Source } from '../types';
import type { CaseStage, DeepCase } from './buildCase';

export type CaseGoal = 'career' | 'invest' | 'build_startup' | 'curiosity';
const GOALS: CaseGoal[] = ['career', 'invest', 'build_startup', 'curiosity'];

export interface AuthoredCaseCall {
  call: Exercise;
  proReasoning?: string;
  commonMistake?: string;
  mentalModel?: string;
}

export interface AuthoredCaseContent {
  id: string;
  title: string;
  /** The day's lesson title, shown as where the case comes from. */
  lessonTitle?: string;
  brief: { headline: string; kicker?: string; fullText?: string; sources?: Source[] };
  evidence: Exercise;
  numbers?: Exercise;
  calls: Partial<Record<CaseGoal, AuthoredCaseCall>>;
}

export interface AuthoredCaseRow {
  day: number;
  slot: number;
  content: unknown;
}

const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const EVIDENCE_KINDS = new Set(['sortSignal', 'spotFake', 'buildChain', 'multipleChoice', 'faceOff']);
const CALL_KINDS = new Set(['theCall', 'multipleChoice']);

/** A stage exercise is usable when it has a kind this case can play and a prompt. */
function playable(e: unknown, kinds: Set<string>): e is Exercise {
  if (!e || typeof e !== 'object') return false;
  const x = e as Record<string, unknown>;
  return typeof x.kind === 'string' && kinds.has(x.kind) && (text(x.prompt) || text(x.situation));
}

/** The goal's call, or the curiosity call (every case writes one), or any call written. */
export function callForGoal(content: AuthoredCaseContent, goal?: string | null): AuthoredCaseCall | null {
  const pick = (g?: string | null) => (g && GOALS.includes(g as CaseGoal) ? content.calls?.[g as CaseGoal] : undefined);
  // The stored goal "join_industry" reads the career call.
  const call = pick(goal === 'join_industry' ? 'career' : goal) ?? pick('curiosity') ?? GOALS.map(g => content.calls?.[g]).find(Boolean);
  return call && playable(call.call, CALL_KINDS) ? call : null;
}

/** Turns a stored row into the four-stage case the Deep Case screen plays. */
export function caseFromAuthored(
  row: AuthoredCaseRow,
  goal: string | null | undefined,
  marketName: string,
  total: number,
): DeepCase | null {
  const content = row.content as AuthoredCaseContent | null;
  if (!content || typeof content !== 'object' || !text(content.id) || !content.brief || !text(content.brief.headline)) return null;
  if (!playable(content.evidence, EVIDENCE_KINDS)) return null;
  const chosen = callForGoal(content, goal);
  if (!chosen) return null;
  const source = { type: 'lesson' as const, day: row.day, title: content.lessonTitle || content.title };
  const stages: CaseStage[] = [
    {
      key: 'brief',
      label: 'Brief',
      hint: '',
      exercise: {
        kind: 'coldOpen',
        id: `${content.id}-brief`,
        eyebrow: `${marketName.toUpperCase()} · CASE ${row.slot} OF ${total}`,
        headline: content.brief.headline,
        kicker: content.brief.kicker || `Built on your day ${row.day} lesson.`,
        fullText: content.brief.fullText,
        detailTitle: content.title,
        sources: content.brief.sources,
        source,
        leo: { line: 'Read the first sentence carefully.', mood: 'thinking' },
      } as Exercise,
    },
    {
      key: 'evidence',
      label: 'Evidence',
      hint: '',
      exercise: { ...content.evidence, id: `${content.id}-evidence`, source, leo: { line: 'Check the facts first.', mood: 'idle' } },
    },
  ];
  if (playable(content.numbers, new Set(['numberSense']))) {
    stages.push({
      key: 'numbers',
      label: 'Numbers',
      hint: '',
      exercise: { ...content.numbers, id: `${content.id}-numbers`, source, leo: { line: 'Get roughly the right size.', mood: 'idle' } },
    });
  }
  stages.push({
    key: 'call',
    label: 'Your choice',
    hint: '',
    exercise: { ...chosen.call, id: `${content.id}-call`, source, leo: { line: 'Pick the answer you could explain.', mood: 'thinking' } },
  });
  return {
    id: `authored-${content.id}`,
    title: content.title,
    situation: content.brief.headline,
    stages,
    proReasoning: chosen.proReasoning ?? null,
    commonMistake: chosen.commonMistake ?? null,
    mentalModel: chosen.mentalModel ?? null,
  };
}

/** The course day a case should come from: the newest studied day at or before the requested one. */
export function caseDay(studiedDays: Array<number | null | undefined>, requested?: number): number | null {
  const days = studiedDays.filter((d): d is number => typeof d === 'number' && d > 0).sort((a, b) => b - a);
  if (!days.length) return null;
  if (requested && requested > 0) return days.find(d => d <= requested) ?? days[days.length - 1];
  return days[0];
}
