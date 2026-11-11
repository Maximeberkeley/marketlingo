/** Pure planning for the load-handwritten-lessons functions, kept free of Deno APIs so tests can run it. */

export interface SlideRow {
  id: string;
  slide_number: number;
  title: string;
  body: string;
  sources: unknown;
}

export interface LessonStack {
  id: string;
  market_id: string;
  title: string;
  stack_type: string;
  tags: string[];
  duration_minutes: number;
  authored_lesson: unknown;
  /** Content fingerprint (12 hex characters) of everything above plus the slides. */
  fingerprint: string;
  slides: SlideRow[];
}

export interface StoredStack {
  id: string;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
}

/** Where a loaded stack keeps its fingerprint: stacks.metadata.handwritten_src (tags stay as the migration writes them). */
export const FINGERPRINT_KEY = 'handwritten_src';

/** The bundled stacks the database does not hold in their current form: missing, or a different fingerprint. */
export function stacksToWrite(bundled: LessonStack[], stored: StoredStack[]): LessonStack[] {
  const current = new Map(stored.map(row => [row.id, row.metadata?.[FINGERPRINT_KEY]]));
  return bundled.filter(row => current.get(row.id) !== row.fingerprint);
}

/** The stacks row to upsert: existing metadata and publish date are kept, the fingerprint is recorded. */
export function stackRecord(row: LessonStack, stored: StoredStack | undefined, now: string) {
  return {
    id: row.id,
    market_id: row.market_id,
    title: row.title,
    stack_type: row.stack_type,
    tags: row.tags,
    duration_minutes: row.duration_minutes,
    authored_lesson: row.authored_lesson,
    metadata: { ...(stored?.metadata ?? {}), [FINGERPRINT_KEY]: row.fingerprint },
    published_at: stored?.published_at ?? now,
  };
}

/** The slides rows for a stack, replacing whatever it had. */
export function slideRecords(row: LessonStack) {
  return row.slides.map(slide => ({ ...slide, stack_id: row.id }));
}

/** Days (from the stacks' day-N tags) that do not hold one stack per learner goal, as "market day N (k stacks)". */
export function dayProblems(stored: { market_id: string; tags: string[] | null }[], perDay = 4): string[] {
  const counts = new Map<string, number>();
  for (const row of stored) {
    const day = (row.tags ?? []).find(tag => /^day-\d+$/.test(tag));
    if (!day) continue;
    const key = `${row.market_id}|${day.slice(4)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n !== perDay)
    .map(([key, n]) => {
      const [market, day] = key.split('|');
      return `${market} day ${day} (${n} stacks)`;
    })
    .sort();
}

export function batches<T>(rows: T[], size = 20): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}
