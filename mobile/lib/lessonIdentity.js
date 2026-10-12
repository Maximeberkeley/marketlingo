function realLessonTitle(stack) {
  const authored = stack.authored_lesson;
  if (authored && Array.isArray(authored.exercises) && authored.exercises.length && typeof authored.title === "string" && authored.title.trim()) return authored.title.trim();
  return stack.title?.trim() || "";
}
function lessonDayLabel(day, calendarDay, completed) {
  return !completed && day < calendarDay ? `Catch up: Day ${day}` : `DAY ${day}`;
}
export {
  lessonDayLabel,
  realLessonTitle
};
