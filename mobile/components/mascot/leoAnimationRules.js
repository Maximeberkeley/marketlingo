function leoAnimationDelay(kind, random = Math.random()) {
  return kind === "peek" ? 25e3 + Math.floor(random * 15e3) : 1e4 + Math.floor(random * 5e3);
}
function leoDoneKey(userId, marketId, localDay) {
  return `@marketlingo/leo-done-anim/${userId ?? "guest"}/${marketId}/${localDay}`;
}
function leoCallClip(isGenerating, isSpeaking) {
  if (isGenerating) return "leo-call-think";
  if (isSpeaking) return "leo-call-talk";
  return "leo-call-listen";
}
function leoMorningKey(userId, marketId, localDay) {
  return `@marketlingo/leo-morning/${userId ?? "guest"}/${marketId}/${localDay}`;
}
const LEO_MORNING_LOOK_MS = 4e3;
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
function leoArenaLine(correct, seed, context = {}) {
  if (context.secondChance) return correct ? "Locked in this time. Nicely done." : "Read the answer below once more.";
  if (correct && (context.streak ?? 0) >= 3) return `${context.streak} in a row. Keep it rolling.`;
  return leoFeedbackLine(correct, seed);
}
const LEO_TREAT_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];
const WEEK_MS = 7 * 24 * 60 * 60 * 1e3;
function leoTreatKey(userId) {
  return `@marketlingo/leo-treat/${userId ?? "guest"}`;
}
function shouldPlayLeoTreat(streak, lastTreat, today, random = Math.random()) {
  if (lastTreat === today) return false;
  if (streak && LEO_TREAT_MILESTONES.includes(streak)) return true;
  if (lastTreat) {
    const last = Date.parse(`${lastTreat}T00:00:00`);
    const now = Date.parse(`${today}T00:00:00`);
    if (!Number.isNaN(last) && now - last < WEEK_MS) return false;
  }
  return random < 0.1;
}
export {
  LEO_MORNING_LOOK_MS,
  LEO_TREAT_MILESTONES,
  leoAnimationDelay,
  leoArenaLine,
  leoCallClip,
  leoCoachClip,
  leoDoneKey,
  leoFeedbackLine,
  leoMorningKey,
  leoTreatKey,
  shouldPlayLeoTreat
};
