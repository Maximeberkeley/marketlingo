import { DAYS_PER_SEASON, TOTAL_DAYS } from "./syllabus";
function resolveCourseSections(globalDay, completedDays) {
  const safeGlobalDay = Math.min(TOTAL_DAYS, Math.max(1, Math.round(globalDay) || 1));
  const sectionCount = Math.ceil(TOTAL_DAYS / DAYS_PER_SEASON);
  let priorSectionsComplete = true;
  return Array.from({ length: sectionCount }, (_, index) => {
    const startDay = index * DAYS_PER_SEASON + 1;
    const endDay = Math.min(TOTAL_DAYS, startDay + DAYS_PER_SEASON - 1);
    const completedInSection = Array.from(completedDays).filter((day) => day >= startDay && day <= endDay).sort((a, b) => a - b);
    const unlocked = index === 0 || priorSectionsComplete;
    const calendarEligibleEnd = Math.min(endDay, safeGlobalDay);
    const eligibleDays = calendarEligibleEnd >= startDay ? Array.from({ length: calendarEligibleEnd - startDay + 1 }, (_2, offset) => startDay + offset) : [];
    const nextUnfinished = eligibleDays.find((day) => !completedDays.has(day));
    const displayDay = unlocked ? nextUnfinished ?? Math.max(startDay, calendarEligibleEnd) : startDay;
    const sectionComplete = completedInSection.length === endDay - startDay + 1;
    priorSectionsComplete = priorSectionsComplete && sectionComplete;
    return {
      index,
      startDay,
      endDay,
      completedDays: completedInSection,
      completedCount: completedInSection.length,
      unlocked,
      calendarEligibleEnd,
      displayDay
    };
  });
}
function latestAccessibleSection(sections) {
  let latest = 0;
  sections.forEach((section) => {
    if (section.unlocked) latest = section.index;
  });
  return latest;
}
function todaysCredit(lessons, doneToday, stackId, currentDay) {
  if (!doneToday) return { done: false };
  const lesson = stackId ? lessons.find((entry) => entry.stackId === stackId) : void 0;
  if (lesson && lesson.day > Math.max(1, Math.round(currentDay) || 1)) return { done: false };
  return { done: true, lesson };
}
export {
  latestAccessibleSection,
  resolveCourseSections,
  todaysCredit
};
