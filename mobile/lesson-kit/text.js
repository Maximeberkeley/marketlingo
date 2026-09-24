import { cleanMarkdown, extractSentences, truncateAtSentence } from '../lib/textUtils';
/** One idea per beat: usually two short sentences, never a cut-off word. */
export function shortText(text, maxSentences = 2, maxLength = 170) {
    const clean = cleanMarkdown((text || '').replace(/\s+/g, ' ').trim());
    return truncateAtSentence(extractSentences(clean, maxSentences), maxLength);
}
export const shortPrompt = (text) => shortText(text, 2, 120);
export const shortLabel = (text) => shortText(text, 1, 72);
