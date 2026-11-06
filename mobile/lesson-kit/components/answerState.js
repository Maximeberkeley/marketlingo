function choiceStateFor(index, picked, correctIndex, revealed) {
  if (revealed) {
    if (index === correctIndex) return "correct";
    if (index === picked) return "incorrect";
    return "idle";
  }
  return index === picked ? "selected" : "idle";
}
function answerTag(index, picked, correctIndex, revealed, answerName) {
  if (!revealed) return null;
  const isAnswer = index === correctIndex;
  const isPick = index === picked;
  if (isAnswer && isPick) return answerName ? `${answerName} \xB7 your answer` : "Your answer";
  if (isAnswer) return answerName ?? "Right answer";
  if (isPick) return "Your answer";
  return null;
}
function choiceA11yState(state) {
  switch (state) {
    case "selected":
      return "selected";
    case "correct":
      return "correct";
    case "incorrect":
      return "incorrect";
    default:
      return "";
  }
}
function revealDelta(target, visible, above = 60, below = 90) {
  if (visible.height <= 0) return 0;
  const top = target.top - above;
  const bottom = target.top + target.height + below;
  const visibleBottom = visible.top + visible.height;
  if (bottom > visibleBottom) return Math.max(0, Math.min(bottom - visibleBottom, top - visible.top));
  if (top < visible.top) return top - visible.top;
  return 0;
}
export {
  answerTag,
  choiceA11yState,
  choiceStateFor,
  revealDelta
};
