/**
 * The order Home walks a learner through each day, and the Deep Case quota.
 *
 * The breathing ring sits on one coin at a time: today's lesson first, then the
 * Daily Arena, then the Deep Cases until all of today's cases are solved.
 */

/** Deep Cases a learner can solve per local day. */
export const DAILY_CASES = 3;

export type HomeStep = 'lesson' | 'arena' | 'case';

/** The coin Home rings next, or null once the day's path is finished. */
export function nextHomeStep(state: { lessonDone: boolean; arenaDone: boolean; casesDone: number }): HomeStep | null {
  if (!state.lessonDone) return 'lesson';
  if (!state.arenaDone) return 'arena';
  if (state.casesDone < DAILY_CASES) return 'case';
  return null;
}

/** Today's solved Deep Cases, from the daily completion counter, clamped to the quota. */
export function casesDoneToday(gamesCompleted?: number | null): number {
  const n = Math.floor(Number(gamesCompleted) || 0);
  return Math.max(0, Math.min(DAILY_CASES, n));
}

export interface RingSegment {
  dashArray: string;
  dashOffset: number;
  done: boolean;
}

/**
 * Equal arcs around a coin, one per daily case, clockwise from the top.
 * Round caps add half a stroke at each end, so each arc is shortened by the
 * stroke width as well as the gap to keep the gaps visible.
 */
export function caseRingSegments(radius: number, strokeWidth: number, gap: number, done: number, total = DAILY_CASES): RingSegment[] {
  const circumference = 2 * Math.PI * radius;
  const slot = circumference / total;
  const arc = Math.max(0, slot - gap - strokeWidth);
  return Array.from({ length: total }, (_, index) => ({
    dashArray: `${arc} ${circumference - arc}`,
    dashOffset: -(index * slot + (gap + strokeWidth) / 2),
    done: index < done,
  }));
}
