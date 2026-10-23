const HANDWRITTEN_TAG = "handwritten-v1";
const HANDWRITTEN_MAX_DAY = 5;
function lessonPriority(tags, goalTag, day) {
  const list = tags || [];
  const handwritten = day <= HANDWRITTEN_MAX_DAY && list.includes(HANDWRITTEN_TAG) ? 2 : 0;
  return handwritten + (list.includes(goalTag) ? 1 : 0);
}
export { HANDWRITTEN_TAG, HANDWRITTEN_MAX_DAY, lessonPriority };
