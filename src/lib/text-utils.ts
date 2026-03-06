/**
 * Smart text truncation utilities
 * Prevents mid-word and mid-sentence cuts for professional readability
 */

/**
 * Truncates text at the last complete sentence boundary within maxLength.
 * Falls back to word boundary if no sentence fits.
 */
export function smartTruncate(text: string, maxLength: number = 280): string {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  
  // Try to find last complete sentence
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclaim = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclaim, lastQuestion);
  
  // Use sentence boundary if it's at least 30% of max length (lowered from 50%)
  if (lastSentenceEnd > maxLength * 0.3) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // Fall back to last word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '…';
  }
  
  return truncated + '…';
}

/**
 * Truncates text for option labels (shorter, single line)
 */
export function truncateOption(text: string, maxLength: number = 80): string {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '…';
  }
  
  return truncated + '…';
}

/**
 * Fisher-Yates shuffle algorithm - shuffles array in place and returns it
 * Also returns the mapping of old indices to new indices
 */
export function shuffleWithMapping<T>(array: T[]): { shuffled: T[]; indexMap: number[] } {
  const shuffled = [...array];
  const indexMap = array.map((_, i) => i); // Track original positions
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    [indexMap[i], indexMap[j]] = [indexMap[j], indexMap[i]];
  }
  
  return { shuffled, indexMap };
}

/**
 * Shuffles options array and returns new correct answer index
 */
export function shuffleOptions<T>(
  options: T[],
  correctIndex: number
): { shuffledOptions: T[]; newCorrectIndex: number } {
  const { shuffled, indexMap } = shuffleWithMapping(options);
  
  // Find where the original correct index ended up
  const newCorrectIndex = indexMap.indexOf(correctIndex);
  
  return { shuffledOptions: shuffled, newCorrectIndex };
}
