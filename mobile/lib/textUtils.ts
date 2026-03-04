/**
 * Smart text truncation utilities.
 * Truncates at sentence boundaries instead of cutting mid-word/mid-sentence.
 */

/**
 * Truncates text to maxLength at the nearest sentence boundary.
 * Falls back to word boundary if no sentence fits.
 */
export function truncateAtSentence(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;

  // Try to find a sentence break within the limit
  const sentenceBreaks = /[.!?]\s+/g;
  let lastGoodIndex = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceBreaks.exec(text)) !== null) {
    // Include the punctuation but not the trailing space
    const endIndex = match.index + 1;
    if (endIndex <= maxLength) {
      lastGoodIndex = endIndex;
    } else {
      break;
    }
  }

  // Found a sentence boundary
  if (lastGoodIndex > maxLength * 0.4) {
    return text.substring(0, lastGoodIndex);
  }

  // Fallback: break at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '…';
  }

  return truncated + '…';
}

/**
 * Extracts the first N complete sentences from text.
 */
export function extractSentences(text: string, count: number): string {
  if (!text) return '';
  
  // Split into sentences
  const sentences = text.match(/[^.!?]*[.!?]+/g);
  if (!sentences || sentences.length === 0) return text;
  
  return sentences.slice(0, count).join(' ').trim();
}

/**
 * Cleans markdown formatting from text for display.
 */
export function cleanMarkdown(text: string): string {
  return text
    .replace(/#{1,4}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[•\-*]\s*/gm, '')
    .trim();
}
