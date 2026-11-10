const DAILY_CASES = 3;
function nextHomeStep(state) {
  if (!state.lessonDone) return "lesson";
  if (!state.arenaDone) return "arena";
  if (state.casesDone < DAILY_CASES) return "case";
  return null;
}
function casesDoneToday(gamesCompleted) {
  const n = Math.floor(Number(gamesCompleted) || 0);
  return Math.max(0, Math.min(DAILY_CASES, n));
}
function caseRingSegments(radius, strokeWidth, gap, done, total = DAILY_CASES) {
  const circumference = 2 * Math.PI * radius;
  const slot = circumference / total;
  const arc = Math.max(0, slot - gap - strokeWidth);
  return Array.from({ length: total }, (_, index) => ({
    dashArray: `${arc} ${circumference - arc}`,
    dashOffset: -(index * slot + (gap + strokeWidth) / 2),
    done: index < done
  }));
}
export {
  DAILY_CASES,
  caseRingSegments,
  casesDoneToday,
  nextHomeStep
};
