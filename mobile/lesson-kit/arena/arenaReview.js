import { correctAnswerOf } from "../components/feedbackCopy";
import { shortText } from "../text";
function formatAmount(n, unit) {
  const abs = Math.abs(n);
  let s;
  if (abs >= 1e9) s = `${(n / 1e9).toFixed(1)}B`;
  else if (abs >= 1e6) s = `${(n / 1e6).toFixed(1)}M`;
  else if (abs >= 1e3) s = `${(n / 1e3).toFixed(1)}K`;
  else s = `${Math.round(n * 10) / 10}`;
  return unit ? `${s}${unit.length <= 2 ? unit : " " + unit}` : s;
}
function reviewQuestion(exercise) {
  const pick = (text) => shortText(text || "", 2, 140);
  switch (exercise.kind) {
    case "multipleChoice":
      return pick(exercise.context ? `${exercise.prompt} "${exercise.context}"` : exercise.prompt);
    case "theCall":
      return pick(exercise.situation || exercise.prompt);
    case "quickFire":
      return "True or false, on the lesson's own lines.";
    case "matchPairs":
      return "Match each term to what it means.";
    default:
      return pick("prompt" in exercise ? String(exercise.prompt || "") : "");
  }
}
function reviewAnswer(exercise) {
  const line = (text) => shortText(text, 2, 160);
  switch (exercise.kind) {
    case "numberSense":
      return formatAmount(exercise.value, exercise.unit);
    case "buildChain":
      return line(exercise.steps.join(" \u2192 "));
    case "spotFake":
      return line(`False: ${exercise.statements[exercise.fakeIndex] ?? ""}`);
    case "quickFire": {
      const falseCards = exercise.cards.filter((card) => !card.isTrue);
      return falseCards.length ? line(`False: ${falseCards.map((card) => card.text).join(" / ")}`) : void 0;
    }
    case "matchPairs":
      return line(exercise.pairs.map((pair) => pair.left).join(", "));
    case "sortSignal": {
      const groups = exercise.buckets.map((bucket, index) => {
        const items = exercise.items.filter((item) => item.bucket === index).map((item) => item.text);
        return items.length ? `${bucket}: ${items.join(", ")}` : "";
      }).filter(Boolean);
      return groups.length ? line(groups.join(". ")) : void 0;
    }
    default: {
      const answer = correctAnswerOf(exercise);
      return answer ? line(answer) : void 0;
    }
  }
}
export {
  formatAmount,
  reviewAnswer,
  reviewQuestion
};
