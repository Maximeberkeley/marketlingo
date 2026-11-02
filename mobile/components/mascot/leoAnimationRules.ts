export function leoAnimationDelay(kind: 'peek' | 'play', random = Math.random()): number {
  return kind === 'peek' ? 25000 + Math.floor(random * 15000) : 10000 + Math.floor(random * 5000);
}

export function leoDoneKey(userId: string | undefined, marketId: string, localDay: string): string {
  return `@marketlingo/leo-done-anim/${userId ?? 'guest'}/${marketId}/${localDay}`;
}

/** The call uses only Leo's three desk clips. */
export function leoCallClip(isGenerating: boolean, isSpeaking: boolean) {
  if (isGenerating) return 'leo-call-think';
  if (isSpeaking) return 'leo-call-talk';
  return 'leo-call-listen';
}

export function leoMorningKey(userId: string | undefined, marketId: string, localDay: string): string {
  return `@marketlingo/leo-morning/${userId ?? 'guest'}/${marketId}/${localDay}`;
}

/** How long Leo looks at the learner during the morning wake-up before dozing again. */
export const LEO_MORNING_LOOK_MS = 4000;

export function leoCoachClip(mood: string, intro: boolean) {
  if (mood === 'correct' || mood === 'celebrate') return 'leo-success' as const;
  if (mood === 'incorrect') return 'leo-encourage' as const;
  if (mood === 'idle' && intro) return 'leo-ready' as const;
  return null;
}
const RIGHT_LINES = [
  'Nailed it. That is exactly how insiders think.',
  'Sharp call. You read that one like a pro.',
  'Right on. Keep that reasoning for the next one.',
  'Clean answer. Your instincts are getting really strong.',
];
const WRONG_LINES = [
  'Not quite, but that slip teaches the most.',
  'Close. Read the explanation, then try the next one.',
  'Good try. Every insider missed this one once.',
  'No stress. One miss now makes you sharper later.',
];

/** A short reaction for graded questions without an authored line; wrong lines never hint at the answer. */
export function leoFeedbackLine(correct: boolean, seed: number): string {
  const set = correct ? RIGHT_LINES : WRONG_LINES;
  return set[Math.abs(Math.floor(seed)) % set.length];
}

export const LEO_TREAT_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function leoTreatKey(userId: string | undefined): string {
  return `@marketlingo/leo-treat/${userId ?? 'guest'}`;
}

/** Rare tail-chase treat: streak milestones (once that day), else 1 in 10 with a 7-day cooldown. */
export function shouldPlayLeoTreat(streak: number | undefined, lastTreat: string | null, today: string, random = Math.random()): boolean {
  if (lastTreat === today) return false;
  if (streak && LEO_TREAT_MILESTONES.includes(streak)) return true;
  if (lastTreat) {
    const last = Date.parse(`${lastTreat}T00:00:00`);
    const now = Date.parse(`${today}T00:00:00`);
    if (!Number.isNaN(last) && now - last < WEEK_MS) return false;
  }
  return random < 0.1;
}
