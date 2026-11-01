export function leoAnimationDelay(kind: 'peek' | 'play', random = Math.random()): number {
  return kind === 'peek' ? 12000 + Math.floor(random * 8000) : 10000 + Math.floor(random * 5000);
}

export function leoDoneKey(userId: string | undefined, marketId: string, localDay: string): string {
  return `@marketlingo/leo-done-anim/${userId ?? 'guest'}/${marketId}/${localDay}`;
}

export function leoCallClip(isGenerating: boolean, isSpeaking: boolean) {
  return isGenerating ? 'leo-call-think' : isSpeaking ? 'leo-call-talk' : 'leo-call-listen';
}

export function leoCoachClip(mood: string, intro: boolean) {
  if (mood === 'incorrect') return 'leo-encourage' as const;
  if (mood === 'idle' && intro) return 'leo-ready' as const;
  return null;
}