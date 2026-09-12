import { cleanMarkdown, extractSentences, truncateAtSentence } from '../lib/textUtils';

/** One idea per beat: usually two short sentences, never a cut-off word. */
export function shortText(text?: string, maxSentences = 2, maxLength = 170): string {
  const clean = cleanMarkdown((text || '').replace(/\s+/g, ' ').trim());
  return truncateAtSentence(extractSentences(clean, maxSentences), maxLength);
}

export const shortPrompt = (text?: string) => shortText(text, 2, 120);
export const shortLabel = (text?: string) => shortText(text, 1, 72);
