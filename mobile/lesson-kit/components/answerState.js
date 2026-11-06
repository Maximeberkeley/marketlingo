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
export {
  answerTag,
  choiceA11yState,
  choiceStateFor
};
