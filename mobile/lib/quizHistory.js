const QUIZ_WINDOW_MS = 7 * 24 * 60 * 60 * 1e3;
const normalize = (text) => text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function quizQuestionKeys(exercise) {
  if (exercise.kind === "speedRound") return exercise.rounds.map((round) => normalize(`${round.question} ${round.options[round.correctIndex] || ""}`));
  if (exercise.kind === "multipleChoice") return [normalize(`${exercise.prompt} ${exercise.options[exercise.correctIndex] || ""}`)];
  if (exercise.kind === "spotFake") return [normalize(exercise.explanation || [...exercise.statements].sort().join(" "))];
  if (exercise.kind === "buildChain") return [normalize(exercise.steps.join(" "))];
  if (exercise.kind === "numberSense") return [normalize(`${exercise.prompt} ${exercise.value} ${exercise.unit || ""}`)];
  if (exercise.kind === "theCall") return [normalize(`${exercise.situation} ${exercise.prompt} ${exercise.options[exercise.correctIndex] || ""}`)];
  if (exercise.kind === "faceOff") return [normalize(`${exercise.prompt} ${[exercise.left.name, exercise.right.name].sort().join(" ")}`)];
  if (exercise.kind === "mapMarket") return [normalize(`${exercise.prompt} ${exercise.nodes[exercise.correctIndex]?.label || ""}`)];
  const e = exercise;
  return [normalize(JSON.stringify(Object.fromEntries(Object.entries(e).filter(([key]) => !["id", "leo", "explanation"].includes(key)).sort(([a], [b]) => a.localeCompare(b)))))];
}
function recentQuizHistory(value, now = Date.now()) {
  if (!Array.isArray(value)) return [];
  return value.filter((row) => Boolean(row && typeof row.key === "string" && typeof row.seenAt === "number" && row.seenAt > now - QUIZ_WINDOW_MS));
}
function recordQuizQuestion(history, exercise, now = Date.now()) {
  const keys = new Set(quizQuestionKeys(exercise));
  return [
    ...recentQuizHistory(history, now).filter((row) => !keys.has(row.key)),
    ...Array.from(keys, (key) => ({ key, seenAt: now }))
  ];
}
export {
  QUIZ_WINDOW_MS,
  quizQuestionKeys,
  recentQuizHistory,
  recordQuizQuestion
};
