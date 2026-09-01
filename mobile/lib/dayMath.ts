/**
 * Calendar-day math for curriculum unlocking.
 *
 * Rules:
 *  - A new day unlocks at the learner's LOCAL midnight (not 24h after the
 *    previous lesson). Learners can study any time during their day.
 *  - `start_date` is stored as a plain 'YYYY-MM-DD' string. `new Date(str)`
 *    parses that as UTC midnight, which shifts the day by one for users west
 *    of UTC. We therefore parse it explicitly as a LOCAL date.
 */

/** Parse 'YYYY-MM-DD' as local midnight (timezone-safe). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** Today's date as 'YYYY-MM-DD' in the device's local timezone. */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Day number (1-180) available to the learner, based on local calendar days
 * elapsed since start_date. Rolls over at local midnight anywhere in the world.
 */
export function calculateAvailableDay(startDate?: string | null): number {
  if (!startDate) return 1;
  const start = parseLocalDate(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.min(180, Math.max(1, diffDays + 1));
}
