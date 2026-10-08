export interface XpLine { label: string; xp: number }

export function scoreHeadline(accuracy: number, total: number): string {
  if (total === 0) return 'Lesson complete';
  if (accuracy < 70) return 'Good start — review this one tomorrow';
  if (accuracy < 90) return 'Solid work';
  return 'Nailed it';
}

/** One ledger supplies both the itemized display and the final total. */
export function lessonRewards(baseXp: number, accuracy: number, total: number,
  bestCombo: number, heartsLeft: number | undefined, timeSpentSeconds: number): XpLine[] {
  const lines: XpLine[] = [{ label: 'Correct answers', xp: baseXp }];
  if (total > 0 && accuracy === 100) lines.push({ label: 'Flawless run', xp: 25 });
  if (heartsLeft === 3 && accuracy < 100) lines.push({ label: 'All hearts intact', xp: 10 });
  if (bestCombo >= 3) lines.push({ label: `${bestCombo} in a row`, xp: bestCombo * 3 });
  if (total > 0 && timeSpentSeconds > 0 && timeSpentSeconds < 180 && accuracy >= 80)
    lines.push({ label: 'Sharp and quick', xp: 15 });
  lines.push({ label: 'Daily lesson', xp: 5 + Math.floor(Math.random() * 16) });
  return lines;
}