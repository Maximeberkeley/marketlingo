import { checkClaim, checkDefinition, checkFigure, checkTamper, termsFromSlides, } from '../sequencer/lessonChecks';
const dedupe = (items, key) => {
    const seen = new Set();
    return items.filter(item => {
        const k = key(item).toLowerCase().slice(0, 90);
        if (seen.has(k))
            return false;
        seen.add(k);
        return true;
    });
};
const lessonLabel = (lesson) => lesson.day ? `Day ${lesson.day} · ${lesson.title}` : lesson.title;
/**
 * Multiple-choice questions built from studied lessons, newest lesson first.
 * Each lesson contributes up to three questions, so a session spans several
 * days of material rather than drilling one lesson to death.
 */
export function lessonQuestions(studied, limit = 5) {
    const out = [];
    studied.forEach((lesson, lessonIdx) => {
        if (out.length >= limit)
            return;
        const slides = lesson.slides || [];
        if (!slides.length)
            return;
        const terms = termsFromSlides(slides);
        const label = lessonLabel(lesson);
        const built = [
            checkFigure(slides, `lq-fig-${lessonIdx}`),
            checkDefinition(terms, `lq-def-${lessonIdx}`),
            checkClaim(slides, `lq-claim-${lessonIdx}`),
        ].filter(Boolean);
        built.forEach(item => {
            if (!item || out.length >= limit)
                return;
            out.push({
                id: item.id,
                question: item.prompt,
                options: item.options,
                correctAnswer: item.correctIndex,
                explanation: item.explanation || label,
                pattern: label,
            });
        });
        // A tampered-sentence beat, rendered as a multiple choice question.
        const tamper = checkTamper(slides, `lq-tamper-${lessonIdx}`);
        if (tamper && out.length < limit) {
            out.push({
                id: tamper.id,
                question: tamper.prompt,
                options: tamper.statements,
                correctAnswer: tamper.fakeIndex,
                explanation: tamper.explanation || label,
                pattern: label,
            });
        }
    });
    return dedupe(out, q => q.question).slice(0, limit);
}
/**
 * True/false statements built from studied lessons: one altered sentence and
 * the real sentences that surround it, each explained by the passage it came
 * from.
 */
export function lessonStatements(studied, limit = 10) {
    const out = [];
    studied.forEach((lesson, lessonIdx) => {
        if (out.length >= limit)
            return;
        const slides = lesson.slides || [];
        if (!slides.length)
            return;
        const label = lessonLabel(lesson);
        const tamper = checkTamper(slides, `ls-${lessonIdx}`);
        if (!tamper)
            return;
        tamper.statements.forEach((statement, i) => {
            if (out.length >= limit)
                return;
            const isFake = i === tamper.fakeIndex;
            out.push({
                id: `${tamper.id}-${i}`,
                statement,
                isTrue: !isFake,
                explanation: isFake
                    ? `Altered. ${tamper.explanation || ''}`.trim()
                    : tamper.explanation || `This is what ${label} said.`,
                category: label,
            });
        });
    });
    return dedupe(out, s => s.statement).slice(0, limit);
}
