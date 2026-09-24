import { DAYS_PER_SEASON, TOTAL_DAYS } from './syllabus';
/**
 * Derive section access without changing the global curriculum clock.
 * A section unlocks only when every lesson in all prior sections is complete.
 */
export function resolveCourseSections(globalDay, completedDays) {
    const safeGlobalDay = Math.min(TOTAL_DAYS, Math.max(1, Math.round(globalDay) || 1));
    const sectionCount = Math.ceil(TOTAL_DAYS / DAYS_PER_SEASON);
    let priorSectionsComplete = true;
    return Array.from({ length: sectionCount }, (_, index) => {
        const startDay = index * DAYS_PER_SEASON + 1;
        const endDay = Math.min(TOTAL_DAYS, startDay + DAYS_PER_SEASON - 1);
        const completedInSection = Array.from(completedDays)
            .filter(day => day >= startDay && day <= endDay)
            .sort((a, b) => a - b);
        const unlocked = index === 0 || priorSectionsComplete;
        const calendarEligibleEnd = Math.min(endDay, safeGlobalDay);
        const eligibleDays = calendarEligibleEnd >= startDay
            ? Array.from({ length: calendarEligibleEnd - startDay + 1 }, (_, offset) => startDay + offset)
            : [];
        const nextUnfinished = eligibleDays.find(day => !completedDays.has(day));
        const displayDay = unlocked
            ? nextUnfinished ?? Math.max(startDay, calendarEligibleEnd)
            : startDay;
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
            displayDay,
        };
    });
}
export function latestAccessibleSection(sections) {
    let latest = 0;
    sections.forEach(section => {
        if (section.unlocked)
            latest = section.index;
    });
    return latest;
}
