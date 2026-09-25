const filler = /* @__PURE__ */ new Set(["about", "after", "again", "along", "also", "and", "are", "before", "between", "can", "does", "each", "even", "for", "from", "have", "how", "into", "must", "only", "over", "that", "their", "then", "there", "these", "this", "those", "through", "under", "when", "where", "which", "while", "with", "your"]);
const dangling = /\b(?:a|an|and|as|at|because|by|for|from|in|into|of|or|the|to|with|without|can|will|may|must|should|than|through)\s*[.!?]?$/i;
const words = (text) => new Set((text.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !filler.has(w)));
function isCompleteGoal(text) {
  const value = text.trim();
  return value.length >= 15 && value.length <= 88 && /^[A-Z]/.test(value) && /[.!?]$/.test(value) && !dangling.test(value) && !/[,:;—–-]\s*[.!?]?$/.test(value) && value.split(/\s+/).length >= 4;
}
function isLessonGrounded(text, slides) {
  const evidence = words(slides.map((s) => `${s.title || ""} ${s.body || ""}`).join(" "));
  const subject = words(text);
  return [...subject].filter((w) => evidence.has(w)).length >= 2;
}
function lessonGoalLabels(objectives, slides) {
  const authored = Array.isArray(objectives) ? objectives.filter((o) => typeof o === "string") : [];
  const verified = authored.filter((o) => isCompleteGoal(o) && isLessonGrounded(o, slides));
  if (verified.length >= 3) return [...new Set(verified)].slice(0, 3);
  const beatTitles = [1, 2, 4, 3, 5, 0].map((i) => slides[i]?.title?.replace(/^(?:Recap|Concept|Mechanism|Case|Check|Takeaway)\s*:\s*/i, "").trim()).filter((title) => Boolean(title) && title.length >= 8 && title.length <= 65 && !dangling.test(title));
  return [...new Set(beatTitles)].slice(0, 3);
}
export {
  isCompleteGoal,
  isLessonGrounded,
  lessonGoalLabels
};
