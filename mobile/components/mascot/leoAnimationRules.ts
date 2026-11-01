export function leoAnimationDelay(kind: 'peek' | 'play', random = Math.random()): number {
  return kind === 'peek' ? 25000 + Math.floor(random * 15000) : 10000 + Math.floor(random * 5000);
}

export function leoDoneKey(userId: string | undefined, marketId: string, localDay: string): string {
  return `@marketlingo/leo-done-anim/${userId ?? 'guest'}/${marketId}/${localDay}`;
}

export function leoCallClip(isGenerating: boolean, isSpeaking: boolean) {
  return isGenerating ? 'leo-call-think' : isSpeaking ? 'leo-teach-loop' : 'leo-call-listen';
}

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
