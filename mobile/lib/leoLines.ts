/**
 * Leo's speech-bubble lines: one short, contextual thought (about 8 words).
 * Lines are built whole — never cut mid-sentence to fit.
 */
export const LEO_MAX_WORDS = 8;

export const wordCount = (text?: string | null) => (text || '').trim().split(/\s+/).filter(Boolean).length;

/** True when a line fits Leo's bubble. */
export const fitsBubble = (text?: string | null) => {
  const n = wordCount(text);
  return n > 0 && n <= LEO_MAX_WORDS;
};

/** First candidate that fits the bubble, or the last-resort fallback. */
export function pickBubbleLine(candidates: Array<string | null | undefined>, fallback = 'Ready when you are.'): string {
  for (const c of candidates) {
    const clean = (c || '').replace(/\s+/g, ' ').trim();
    if (fitsBubble(clean)) return clean;
  }
  return fallback;
}

/** A topic short enough to quote inside a line (≤4 words), or null. */
function shortTopic(title?: string | null): string | null {
  const clean = (title || '').replace(/^day\s*\d+\s*[:·—-]\s*/i, '').replace(/[.!?]+$/, '').trim();
  if (!clean || wordCount(clean) > 4) return null;
  return clean;
}

export interface LeoLineContext {
  day?: number | null;
  streak?: number | null;
  yesterdayTopic?: string | null;
  todayHook?: string | null;
  lessonDone?: boolean;
}

/** One contextual line: day + yesterday, streak, or today's hook. */
export function contextualLeoLine(ctx: LeoLineContext, seed = new Date().getHours()): string {
  const yesterday = shortTopic(ctx.yesterdayTopic);
  const today = shortTopic(ctx.todayHook);
  const day = ctx.day && ctx.day > 0 ? ctx.day : null;
  const streak = ctx.streak && ctx.streak > 0 ? ctx.streak : 0;
  if (ctx.lessonDone) {
    return pickBubbleLine([
      streak > 1 ? `${streak} days straight. See you tomorrow.` : null,
      'Today’s done. Your streak is safe.',
    ]);
  }
  const options = [
    day && yesterday ? `Day ${day}. Yesterday: ${yesterday}.` : null,
    today ? `Today: ${today}.` : null,
    streak > 1 ? `${streak}-day streak. Keep it going.` : null,
    day ? `Day ${day} is ready for you.` : null,
  ].filter(Boolean) as string[];
  if (!options.length) return 'Today’s lesson is ready.';
  const rotated = [...options.slice(seed % options.length), ...options.slice(0, seed % options.length)];
  return pickBubbleLine(rotated, 'Today’s lesson is ready.');
}
