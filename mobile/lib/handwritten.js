const HANDWRITTEN_TAG = "handwritten-v1";
const HANDWRITTEN_MAX_DAY = 60;
function lessonPriority(tags, goalTag, day) {
  const list = tags || [];
  const handwritten = day <= HANDWRITTEN_MAX_DAY && list.includes(HANDWRITTEN_TAG) ? 2 : 0;
  return handwritten + (list.includes(goalTag) ? 1 : 0);
}
export {
  HANDWRITTEN_MAX_DAY,
  HANDWRITTEN_TAG,
  lessonPriority
};
