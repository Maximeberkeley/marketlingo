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

/**
 * How far to scroll so a graded right answer (with room for its row) sits
 * inside the visible part of the question, above the feedback panel. Never
 * pushes the top of the row out of view to show its bottom. 0 when it already shows.
 */
export function revealDelta(
  target: { top: number; height: number },
  visible: { top: number; height: number },
  above = 60,
  below = 90,
): number {
  if (visible.height <= 0) return 0;
  const top = target.top - above;
  const bottom = target.top + target.height + below;
  const visibleBottom = visible.top + visible.height;
  if (bottom > visibleBottom) return Math.max(0, Math.min(bottom - visibleBottom, top - visible.top));
  if (top < visible.top) return top - visible.top;
  return 0;
}
