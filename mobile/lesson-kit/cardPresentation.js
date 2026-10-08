import { shortLabel, shortText } from './text';
/** Presentation only: preserve all authored/generated text and grading. */
export function readingCardKind(exercise) {
    const label = ['eyebrow', 'title', 'detailTitle'].map(key => {
        const value = exercise[key];
        return typeof value === 'string' ? value : '';
    }).join(' ');
    if (/takeaway/i.test(exercise.id) || /\b(lock it in|takeaway|the rule|what to remember)\b/i.test(label))
        return 'takeaway';
    if (/\b(evidence|proof|quote|case study|in the real world)\b/i.test(label))
        return 'evidence';
    return 'idea';
}
/** Compare rendered copy, not formatting or hidden briefing text. */
export function normalizedCopy(text = '') {
    return text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
export function cardCopy(exercise) {
    switch (exercise.kind) {
        case 'coldOpen':
            return [shortText(exercise.headline, 4, 260), shortText(exercise.kicker, 1, 80)];
        case 'microInsight':
            return [shortText(exercise.text, 2, 150), shortText(exercise.highlight, 1, 100)];
        case 'info':
            return [shortText(exercise.title, 1, 80), shortText(exercise.body, 2, 150),
                ...(exercise.bullets || []).slice(0, 2).map(b => shortText(b, 1, 90))];
        default:
            return [];
    }
}
export function cardTerms(exercise) {
    if (!('keyTerms' in exercise) && !('keyTerm' in exercise))
        return [];
    const terms = ('keyTerms' in exercise ? exercise.keyTerms : undefined) ||
        ('keyTerm' in exercise && exercise.keyTerm ? [exercise.keyTerm] : []);
    const copy = ` ${normalizedCopy(cardCopy(exercise).join(' '))} `;
    return terms.filter(t => {
        const term = normalizedCopy(t.term);
        return Boolean(term) && copy.includes(` ${term} `);
    });
}
export function hasExtraBriefing(exercise) {
    if (!('fullText' in exercise))
        return false;
    const full = normalizedCopy(shortText(exercise.fullText, 10000, 1000000));
    if (!full)
        return false;
    const visible = [...cardCopy(exercise)];
    if ('title' in exercise)
        visible.push(shortLabel(exercise.title));
    if ('eyebrow' in exercise)
        visible.push(shortLabel(exercise.eyebrow));
    const copy = normalizedCopy(visible.join(' '));
    if (copy.includes(full))
        return false;
    // A briefing that only repeats the card's blocks in another order adds nothing.
    let remainder = ` ${full} `;
    visible.map(normalizedCopy).filter(Boolean).sort((a, b) => b.length - a.length)
        .forEach(block => { remainder = remainder.split(` ${block} `).join(' '); });
    return Boolean(remainder.trim());
}
