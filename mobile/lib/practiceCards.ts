/**
 * What the Practice page shows on each card, and in what order.
 *
 * Interview prep leads for learners aiming at a job; the Investment Lab leads
 * for investors. Every card says where the learner stands (state line, one
 * button) instead of describing the activity, and locked cards say what unlocks them.
 */
import { DAILY_CASES, casesDoneToday } from './homeSteps';

export type PracticeCardId = 'interview' | 'investment' | 'deep-case' | 'arena';

export interface PracticeInputs {
  goal: string | null;
  lessonsStudied: number;
  /** daily_completions counters for today. */
  gamesCompleted?: number | null;
  drillsCompleted?: number | null;
  /** The learner's mock interviews in this market, newest first. */
  mocks: { score: number | null }[];
}

export interface PracticeCardState {
  id: PracticeCardId;
  eyebrow: string;
  title: string;
  /** Short text before the bold part, the bold part, and the text after. */
  state: { before?: string; bold?: string; after?: string };
  button: string | null;
  locked: boolean;
  done: boolean;
  path: string;
}

const UNLOCK = 'Finish Day 1 to unlock';

export function practiceOrder(goal: string | null): PracticeCardId[] {
  if (goal === 'career') return ['interview', 'deep-case', 'arena'];
  if (goal === 'invest') return ['investment', 'deep-case', 'arena', 'interview'];
  return ['arena', 'deep-case', 'interview'];
}

export function practiceCards(input: PracticeInputs): PracticeCardState[] {
  const unlocked = input.lessonsStudied > 0;
  const cases = casesDoneToday(input.gamesCompleted);
  const arenaDone = (input.drillsCompleted || 0) > 0;
  const scored = input.mocks.filter(m => typeof m.score === 'number');

  const cards: Record<PracticeCardId, PracticeCardState> = {
    interview: {
      id: 'interview', eyebrow: 'Interview prep', title: 'Mock interview', path: '/interview-lab',
      locked: false, done: false,
      state: input.mocks.length === 0
        ? { before: 'Practice answering out loud. No lessons needed.' }
        : scored.length
          ? { before: 'Last mock ', bold: `${Math.round(scored[0].score as number)} / 100`, after: ` · ${input.mocks.length} ${input.mocks.length === 1 ? 'question' : 'questions'} answered` }
          : { before: `${input.mocks.length} ${input.mocks.length === 1 ? 'question' : 'questions'} answered` },
      button: input.mocks.length === 0 ? 'Start your first mock' : 'Start a new mock',
    },
    investment: {
      id: 'investment', eyebrow: 'Investment Lab', title: 'Would you invest?', path: '/investment-lab',
      locked: false, done: false,
      state: { before: 'Weigh a real company and make the call.' },
      button: 'Open the lab',
    },
    'deep-case': {
      id: 'deep-case', eyebrow: 'Deep Case', path: '/deep-case',
      locked: !unlocked,
      done: unlocked && cases >= DAILY_CASES,
      title: !unlocked ? `${DAILY_CASES} cases a day` : cases >= DAILY_CASES ? `All ${DAILY_CASES} solved` : `Case ${cases + 1} of ${DAILY_CASES} today`,
      state: !unlocked
        ? { before: 'Real situations built from your lessons.' }
        : cases >= DAILY_CASES
          ? { before: 'New cases tomorrow.' }
          : cases === 0 ? { before: 'A real situation. What would you do?' }
          : { bold: `${cases} of ${DAILY_CASES}`, after: ' solved today' },
      button: !unlocked || cases >= DAILY_CASES ? null : cases === 0 ? 'Start case 1' : `Start case ${cases + 1}`,
    },
    arena: {
      id: 'arena', eyebrow: 'Daily Arena', title: 'Three rounds', path: '/arena',
      locked: !unlocked, done: unlocked && arenaDone,
      state: !unlocked
        ? { before: 'Quick calls on what you studied.' }
        : arenaDone ? { before: 'Done today' } : { before: 'Quick calls on what you studied.' },
      button: !unlocked ? null : arenaDone ? 'Play again' : 'Start the Arena',
    },
  };
  return practiceOrder(input.goal).map(id => cards[id]);
}

export const UNLOCK_LINE = UNLOCK;
