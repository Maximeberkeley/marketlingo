/** Pure planning for the load-deep-cases functions, kept free of Deno APIs so tests can run it. */

export interface CaseRow {
  id: string;
  market_id: string;
  day: number;
  slot: number;
  content: unknown;
  tags: string[];
}

export interface StoredRow {
  market_id: string;
  day: number;
  slot: number;
  tags: string[] | null;
}

/** The content fingerprint a row carries in its tags ("src:" plus 12 hex characters). */
export function fingerprintOf(tags: string[] | null | undefined): string | undefined {
  return (tags ?? []).find(tag => tag.startsWith('src:'));
}

/**
 * The bundled rows the database does not yet hold in their current form: missing rows, and rows whose
 * stored fingerprint differs. Rows in the database but not in the bundle are left alone.
 */
export function rowsToWrite(bundled: CaseRow[], stored: StoredRow[]): CaseRow[] {
  const current = new Map(stored.map(row => [`${row.market_id}/${row.day}/${row.slot}`, fingerprintOf(row.tags)]));
  return bundled.filter(row => {
    const have = current.get(`${row.market_id}/${row.day}/${row.slot}`);
    return have === undefined || have !== fingerprintOf(row.tags);
  });
}

/** Days that do not hold exactly three cases, as "market day N (k cases)". */
export function dayProblems(stored: Pick<StoredRow, 'market_id' | 'day'>[], perDay = 3): string[] {
  const counts = new Map<string, number>();
  for (const row of stored) counts.set(`${row.market_id}|${row.day}`, (counts.get(`${row.market_id}|${row.day}`) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, n]) => n !== perDay)
    .map(([key, n]) => {
      const [market, day] = key.split('|');
      return `${market} day ${day} (${n} cases)`;
    })
    .sort();
}

/** Splits rows into upsert batches small enough for one request each. */
export function batches<T>(rows: T[], size = 30): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}
