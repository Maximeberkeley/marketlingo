/**
 * The Arena summary's review list: for each missed question, one line saying
 * what was asked and one saying the right answer, in the lesson's own words.
 */
import type { Exercise } from '../types';
import { correctAnswerOf } from '../components/feedbackCopy';
import { shortText } from '../text';

/** A number the way the dial showed it: 2.4B, 58%, 11 years. */
export function formatAmount(n: number, unit?: string): string {
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1_000_000_000) s = `${(n / 1_000_000_000).toFixed(1)}B`;
  else if (abs >= 1_000_000) s = `${(n / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) s = `${(n / 1_000).toFixed(1)}K`;
  else s = `${Math.round(n * 10) / 10}`;
  return unit ? `${s}${unit.length <= 2 ? unit : ' ' + unit}` : s;
}

/** What was asked, short enough for one row. A named definition or gapped line beats the generic prompt. */
export function reviewQuestion(exercise: Exercise): string {
  const pick = (text?: string) => shortText(text || '', 2, 140);
  switch (exercise.kind) {
    case 'multipleChoice':
      return pick(exercise.context ? `${exercise.prompt} "${exercise.context}"` : exercise.prompt);
    case 'theCall':
      return pick(exercise.situation || exercise.prompt);
    case 'quickFire':
      return 'True or false, on the lesson\'s own lines.';
    case 'matchPairs':
      return 'Match each term to what it means.';
    default:
      return pick('prompt' in exercise ? String(exercise.prompt || '') : '');
  }
}

/** The right answer, in a line. Undefined when there is nothing short to show. */
export function reviewAnswer(exercise: Exercise): string | undefined {
  const line = (text: string) => shortText(text, 2, 160);
  switch (exercise.kind) {
    case 'numberSense':
      return formatAmount(exercise.value, exercise.unit);
    case 'buildChain':
      return line(exercise.steps.join(' → '));
    case 'spotFake':
      return line(`False: ${exercise.statements[exercise.fakeIndex] ?? ''}`);
    case 'quickFire': {
      const falseCards = exercise.cards.filter(card => !card.isTrue);
      return falseCards.length ? line(`False: ${falseCards.map(card => card.text).join(' / ')}`) : undefined;
    }
    case 'matchPairs':
      return line(exercise.pairs.map(pair => pair.left).join(', '));
    case 'sortSignal': {
      const groups = exercise.buckets.map((bucket, index) => {
        const items = exercise.items.filter(item => item.bucket === index).map(item => item.text);
        return items.length ? `${bucket}: ${items.join(', ')}` : '';
      }).filter(Boolean);
      return groups.length ? line(groups.join('. ')) : undefined;
    }
    default: {
      const answer = correctAnswerOf(exercise);
      return answer ? line(answer) : undefined;
    }
  }
}
