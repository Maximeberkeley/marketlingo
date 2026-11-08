/**
 * The order to show answer options in. Authored lessons put the right answer
 * first almost every time, so showing them as written made every question
 * "pick the first one". This mixes them, the same way each time for a given
 * question (seeded by its id and prompt), so a re-render never reshuffles.
 * Callers keep using the original indexes for grading and feedback; only the
 * on-screen order changes.
 */
export function choiceOrder(count: number, seed: string): number[] {
  const order = Array.from({ length: Math.max(0, count) }, (_, i) => i);
  let state = hash(seed);
  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Finish with a murmur3-style mix so near-identical prompts still spread out.
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
