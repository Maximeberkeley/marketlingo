/**
 * One rule for how every graded choice looks, so "picked", "right" and "wrong"
 * read the same in lessons, the Arena and Cases, and never by colour alone:
 * each state has its own mark, and graded rows say whose answer they are.
 */
export type ChoiceState = 'idle' | 'selected' | 'correct' | 'incorrect';

export function choiceStateFor(index: number, picked: number | null | undefined, correctIndex: number, revealed: boolean): ChoiceState {
  if (revealed) {
    if (index === correctIndex) return 'correct';
    if (index === picked) return 'incorrect';
    return 'idle';
  }
  return index === picked ? 'selected' : 'idle';
}

/** The small line on a graded row: whose answer it is, and which one was right. */
export function answerTag(
  index: number,
  picked: number | null | undefined,
  correctIndex: number,
  revealed: boolean,
  answerName?: string,
): string | null {
  if (!revealed) return null;
  const isAnswer = index === correctIndex;
  const isPick = index === picked;
  if (isAnswer && isPick) return answerName ? `${answerName} · your answer` : 'Your answer';
  if (isAnswer) return answerName ?? 'Right answer';
  if (isPick) return 'Your answer';
  return null;
}

/** Screen-reader wording that matches the mark and tag. */
export function choiceA11yState(state: ChoiceState): string {
  switch (state) {
    case 'selected': return 'selected';
    case 'correct': return 'correct';
    case 'incorrect': return 'incorrect';
    default: return '';
  }
}
