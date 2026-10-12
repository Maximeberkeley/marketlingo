/** Use the title of the lesson that will actually play, never a section/facet fallback. */
export function realLessonTitle(stack: { title?: string | null; authored_lesson?: unknown }): string {
  const authored = stack.authored_lesson as { title?: unknown; exercises?: unknown } | null;
  if (authored && Array.isArray(authored.exercises) && authored.exercises.length && typeof authored.title === 'string' && authored.title.trim()) return authored.title.trim();
  return stack.title?.trim() || '';
}

export function lessonDayLabel(day: number, calendarDay: number, completed: boolean): string {
  return !completed && day < calendarDay ? `Catch up: Day ${day}` : `DAY ${day}`;
}