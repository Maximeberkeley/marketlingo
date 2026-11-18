const SECOND_TRY_KINDS = ["multipleChoice", "spotFake", "faceOff", "theCall", "chartRead", "mapMarket", "wordBank"];
const GUESS_KINDS = ["numberSense"];
const GUESS_FLOOR = 0.25;
const stepScore = (steps, slips) => steps <= 0 ? 1 : steps / (steps + Math.max(0, slips));
function closeness(off, tolerance) {
  if (off <= tolerance) return 1;
  if (off <= tolerance * 2) return 0.5;
  return 0;
}
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
function lessonOutcome(kind, state, attempt = 0) {
  const base = Math.max(0, Math.min(1, state.score ?? (state.isCorrect ? 1 : 0)));
  if (attempt > 0) {
    return base >= 1 ? { kind: "partial", credit: 0.5, title: "Got it on the second try", note: "That still counts." } : { kind: "missed", credit: 0, title: "Here's the answer", note: "It comes back tomorrow so it sticks." };
  }
  if (base >= 1) return { kind: "right", credit: 1, title: "Correct" };
  if (GUESS_KINDS.includes(kind)) {
    return base > 0 ? { kind: "partial", credit: Math.max(base, GUESS_FLOOR), title: "Close" } : { kind: "learned", credit: GUESS_FLOOR, title: "Now you know", note: "It was a guess, so it does not count against you." };
  }
  if (base > 0) {
    const note = typeof state.slips === "number" && state.slips > 0 ? `${plural(state.slips, "slip")} on the way.` : void 0;
    return { kind: "partial", credit: base, title: "Got there", note };
  }
  if (SECOND_TRY_KINDS.includes(kind)) {
    return { kind: "retry", credit: 0, title: "Not yet", note: "Have another go. A second try still earns XP." };
  }
  return { kind: "missed", credit: 0, title: "Here's the answer", note: "It comes back tomorrow so it sticks." };
}
const creditXp = (xpPerCorrect, credit) => credit <= 0 ? 0 : Math.max(1, Math.round(xpPerCorrect * credit));
export {
  GUESS_FLOOR,
  GUESS_KINDS,
  SECOND_TRY_KINDS,
  closeness,
  creditXp,
  lessonOutcome,
  stepScore
};
