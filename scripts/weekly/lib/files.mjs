import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const WEEKLY_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CASES_DIR = join(WEEKLY_DIR, 'cases');
export const EXPORT_DIR = join(WEEKLY_DIR, 'export');

/** Every case file in scripts/weekly/cases, oldest week first. */
export function loadCases(dir = CASES_DIR) {
  return readdirSync(dir)
    .filter(f => /^\d{4}-\d{2}-\d{2}-.+\.json$/.test(f))
    .sort()
    .map(file => {
      const text = readFileSync(join(dir, file), 'utf8');
      try { return { file, data: JSON.parse(text) }; } catch (e) { return { file, data: null, parseError: e.message }; }
    });
}
