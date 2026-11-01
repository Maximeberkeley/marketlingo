function leoAnimationDelay(kind, random = Math.random()) {
  return kind === "peek" ? 25e3 + Math.floor(random * 15e3) : 1e4 + Math.floor(random * 5e3);
}
function leoDoneKey(userId, marketId, localDay) {
  return `@marketlingo/leo-done-anim/${userId ?? "guest"}/${marketId}/${localDay}`;
}
function leoCallClip(isGenerating, isSpeaking) {
  return isGenerating ? "leo-call-think" : isSpeaking ? "leo-teach-loop" : "leo-call-listen";
}
function leoCoachClip(mood, intro) {
  if (mood === "correct" || mood === "celebrate") return "leo-success";
  if (mood === "incorrect") return "leo-encourage";
  if (mood === "idle" && intro) return "leo-ready";
  return null;
}
const RIGHT_LINES = [
  "Nailed it. That is exactly how insiders think.",
  "Sharp call. You read that one like a pro.",
  "Right on. Keep that reasoning for the next one.",
  "Clean answer. Your instincts are getting really strong."
];
const WRONG_LINES = [
  "Not quite, but that slip teaches the most.",
  "Close. Read the explanation, then try the next one.",
  "Good try. Every insider missed this one once.",
  "No stress. One miss now makes you sharper later."
];
function leoFeedbackLine(correct, seed) {
  const set = correct ? RIGHT_LINES : WRONG_LINES;
  return set[Math.abs(Math.floor(seed)) % set.length];
}
export {
  leoAnimationDelay,
  leoCallClip,
  leoCoachClip,
  leoDoneKey,
  leoFeedbackLine
};
