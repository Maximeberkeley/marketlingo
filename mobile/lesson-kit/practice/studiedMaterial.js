const isText = (value) => typeof value === "string" && value.trim().length > 0;
const isTextList = (value, min) => Array.isArray(value) && value.length >= min && value.every(isText);
function studiedMaterial(value) {
  const questions = [];
  const terms = /* @__PURE__ */ new Map();
  let rule;
  let takeaway;
  let headline;
  if (!value || typeof value !== "object" || !("exercises" in value) || !Array.isArray(value.exercises)) {
    return { questions, keyTerms: [] };
  }
  for (const exercise of value.exercises) {
    if (!exercise || typeof exercise !== "object") continue;
    if (exercise.id === "rule" && isText(exercise.text)) rule = exercise.text.trim();
    if (exercise.kind === "sayIt" && isText(exercise.takeaway)) takeaway = exercise.takeaway.trim();
    if (exercise.kind === "coldOpen" && isText(exercise.headline) && !headline) headline = exercise.headline.trim();
    for (const entry of [...Array.isArray(exercise.keyTerms) ? exercise.keyTerms : [], ...exercise.keyTerm ? [exercise.keyTerm] : []]) {
      if (typeof entry?.term !== "string" || typeof entry?.definition !== "string") continue;
      const term = entry.term.trim();
      const definition = entry.definition.trim();
      if (term && definition && !terms.has(term.toLowerCase())) terms.set(term.toLowerCase(), { term, definition });
    }
    if (exercise.kind === "multipleChoice" && typeof exercise.prompt === "string" && Array.isArray(exercise.options) && exercise.options.every((s) => typeof s === "string") && Number.isInteger(exercise.correctIndex) && exercise.correctIndex >= 0 && exercise.correctIndex < exercise.options.length) {
      questions.push(exercise);
    } else if (exercise.kind === "numberSense" && typeof exercise.prompt === "string" && [exercise.min, exercise.max, exercise.value].every(Number.isFinite) && exercise.min < exercise.max && exercise.value >= exercise.min && exercise.value <= exercise.max) {
      questions.push(exercise);
    } else if (exercise.kind === "sortSignal" && typeof exercise.prompt === "string" && Array.isArray(exercise.buckets) && exercise.buckets.every((s) => typeof s === "string") && Array.isArray(exercise.items) && exercise.items.length && exercise.items.every((item) => typeof item.text === "string" && Number.isInteger(item.bucket) && item.bucket >= 0 && item.bucket < exercise.buckets.length)) {
      questions.push(exercise);
    } else if (exercise.kind === "buildChain" && typeof exercise.prompt === "string" && Array.isArray(exercise.steps) && exercise.steps.length >= 2 && exercise.steps.every((s) => typeof s === "string" && s.trim().length > 0)) {
      questions.push(exercise);
    } else if (exercise.kind === "theCall" && isText(exercise.situation) && isText(exercise.prompt) && isTextList(exercise.options, 2) && Number.isInteger(exercise.correctIndex) && exercise.correctIndex >= 0 && exercise.correctIndex < exercise.options.length) {
      questions.push(exercise);
    } else if (exercise.kind === "faceOff" && isText(exercise.prompt) && isText(exercise.left?.name) && isText(exercise.right?.name) && (exercise.correctIndex === 0 || exercise.correctIndex === 1)) {
      questions.push(exercise);
    } else if (exercise.kind === "spotFake" && isText(exercise.prompt) && isTextList(exercise.statements, 3) && Number.isInteger(exercise.fakeIndex) && exercise.fakeIndex >= 0 && exercise.fakeIndex < exercise.statements.length) {
      questions.push(exercise);
    }
  }
  return { questions, keyTerms: [...terms.values()], ...rule ? { rule } : {}, ...takeaway ? { takeaway } : {}, ...headline ? { headline } : {} };
}
function lessonSource(lesson) {
  return { type: "lesson", stackId: lesson.stackId, day: lesson.day, title: lesson.title };
}
function practiceSourceLabel(exercise) {
  if (!exercise.source) return "";
  if (exercise.source.type === "industry") return "From the wider industry";
  return `From ${exercise.source.day ? `Day ${exercise.source.day} \xB7 ` : ""}${exercise.source.title}`;
}
export {
  lessonSource,
  practiceSourceLabel,
  studiedMaterial
};
