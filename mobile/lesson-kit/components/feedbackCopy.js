import { normalizedCopy } from "../cardPresentation";
const CITE = /^straight from what you just read:\s*/i;
const ANSWER_ON_SCREEN = /* @__PURE__ */ new Set(["multipleChoice", "theCall", "faceOff", "spotFake", "mapMarket"]);
function correctAnswerOf(exercise) {
  if (!exercise) return void 0;
  if (exercise.kind === "multipleChoice") return exercise.options[exercise.correctIndex];
  if (exercise.kind === "wordBank") return exercise.answer.join(" ");
  if (exercise.kind === "theCall") return exercise.options[exercise.correctIndex];
  if (exercise.kind === "faceOff") return exercise.correctIndex === 0 ? exercise.left.name : exercise.right.name;
  if (exercise.kind === "spotFake") return exercise.statements[exercise.fakeIndex];
  if (exercise.kind === "mapMarket") return exercise.nodes[exercise.correctIndex]?.label;
  return void 0;
}
function sameCopy(a, b) {
  const x = normalizedCopy(a);
  const y = normalizedCopy(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length < y.length ? [x, y] : [y, x];
  return long.includes(short) && short.length / long.length >= 0.8;
}
function feedbackCopy(exercise, isCorrect, selectedIndex) {
  const explanation = "explanation" in exercise && exercise.explanation || "";
  const correct = correctAnswerOf(exercise);
  const insight = correct && sameCopy(explanation.replace(CITE, ""), correct) ? "" : explanation;
  const answerShown = ANSWER_ON_SCREEN.has(exercise.kind) || Boolean(correct && insight && normalizedCopy(insight).includes(normalizedCopy(correct)));
  const why = !isCorrect && selectedIndex != null && "whyWrong" in exercise ? exercise.whyWrong?.[selectedIndex] : null;
  return {
    answer: !isCorrect && correct && !answerShown ? correct : void 0,
    insight: insight || void 0,
    whyWrong: why || void 0
  };
}
const card = (slide) => ({
  title: (slide.title || "From your lesson").trim(),
  body: (slide.body || "").trim()
});
function reviewCardFor(slides, exercise) {
  const usable = slides.filter((s) => (s.body || "").trim());
  if (!usable.length) return void 0;
  const explanation = "explanation" in exercise && exercise.explanation || "";
  const quoted = normalizedCopy(explanation.replace(CITE, ""));
  if (quoted.length >= 20) {
    const hit = usable.find((s) => normalizedCopy(s.body || "").includes(quoted));
    if (hit) return card(hit);
  }
  const prompt = "prompt" in exercise ? String(exercise.prompt || "") : "";
  const words = new Set(wordsOf([prompt, correctAnswerOf(exercise) || "", explanation].join(" ")));
  if (!words.size) return void 0;
  const slideWords = usable.map((s) => new Set(wordsOf(`${s.title || ""} ${s.body || ""}`)));
  const spread = (word) => slideWords.filter((set) => set.has(word)).length || 1;
  let best = -1;
  let bestScore = 0;
  slideWords.forEach((set, index) => {
    const shared = [...words].filter((word) => set.has(word));
    const score = shared.reduce((sum, word) => sum + 1 / spread(word), 0);
    if (shared.length >= 2 && score > bestScore) {
      best = index;
      bestScore = score;
    }
  });
  return best >= 0 && bestScore >= 1.5 ? card(usable[best]) : void 0;
}
function wordsOf(text) {
  return normalizedCopy(text).split(" ").filter((word) => word.length > 3).map((word) => word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word);
}
function readingSlides(exercises) {
  const slides = [];
  const add = (title, parts) => {
    const body = parts.filter(Boolean).join(" ").trim();
    if (body) slides.push({ slideNumber: slides.length + 1, title: (title || "").trim(), body });
  };
  for (const e of exercises) {
    if (e.kind === "microInsight") add(e.eyebrow, [e.text, e.body]);
    else if (e.kind === "info") add(e.title || e.eyebrow, [e.body, ...e.bullets || []]);
    else if (e.kind === "coldOpen") add(e.detailTitle || e.eyebrow, [e.headline, e.fullText]);
  }
  return slides;
}
export {
  correctAnswerOf,
  feedbackCopy,
  readingSlides,
  reviewCardFor,
  sameCopy
};
