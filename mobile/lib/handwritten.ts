/** Hand-written lessons (tag `handwritten-v1`) win Days 1–5 over legacy generated stacks. */
export const HANDWRITTEN_TAG = 'handwritten-v1';
export const HANDWRITTEN_MAX_DAY = 5;

/** Higher wins: hand-written beats goal match, goal match beats anything else. */
export function lessonPriority(tags: string[] | null | undefined, goalTag: string, day: number): number {
  const list = tags || [];
  const handwritten = day <= HANDWRITTEN_MAX_DAY && list.includes(HANDWRITTEN_TAG) ? 2 : 0;
  return handwritten + (list.includes(goalTag) ? 1 : 0);
}
