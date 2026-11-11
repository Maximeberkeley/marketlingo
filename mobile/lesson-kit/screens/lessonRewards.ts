export interface XpLine { label: string; xp: number }

/** The daily lesson's guaranteed XP: at least twice a top Deep Case (see CASE_XP). */
export const LESSON_BASE_XP = 80;

export function scoreHeadline(accuracy: number, total: number): string {
  if (total === 0) return 'Lesson complete';
  if (accuracy < 70) return 'Good start — review this one tomorrow';
  if (accuracy < 90) return 'Solid work';
  return 'Nailed it';
}

/**
 * One ledger supplies both the itemized display and the final total. While Double XP runs the subtotal is
 * matched by its own "Double XP" line, so the screen still shows exactly what is banked.
 */
export function lessonRewards(baseXp: number, accuracy: number, total: number,
  bestCombo: number, heartsLeft: number | undefined, timeSpentSeconds: number, doubleXp = false): XpLine[] {
  const lines: XpLine[] = [{ label: 'Daily lesson', xp: LESSON_BASE_XP }];
  if (baseXp > 0) lines.push({ label: 'Correct answers', xp: baseXp });
  if (total > 0 && accuracy === 100) lines.push({ label: 'Flawless run', xp: 25 });
  if (heartsLeft === 3 && accuracy < 100) lines.push({ label: 'All hearts intact', xp: 10 });
  if (bestCombo >= 3) lines.push({ label: `${bestCombo} in a row`, xp: bestCombo * 3 });
  if (total > 0 && timeSpentSeconds > 0 && timeSpentSeconds < 180 && accuracy >= 80)
    lines.push({ label: 'Sharp and quick', xp: 15 });
  if (doubleXp) lines.push({ label: 'Double XP', xp: lines.reduce((sum, l) => sum + l.xp, 0) });
  return lines;
}