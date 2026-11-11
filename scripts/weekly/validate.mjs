#!/usr/bin/env node
/**
 * node scripts/weekly/validate.mjs [file.json ...] [--today YYYY-MM-DD]
 * With no files, validates every case in scripts/weekly/cases and the set as a whole.
 * Exit code 0 only when there are no errors. Warnings never fail the run.
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { loadCases } from './lib/files.mjs';
import { validateSet } from './lib/validate.mjs';

const args = process.argv.slice(2);
const todayIdx = args.indexOf('--today');
const today = todayIdx >= 0 ? args.splice(todayIdx, 2)[1] : undefined;

let cases;
if (args.length) {
  cases = args.map(p => ({ file: basename(p), data: JSON.parse(readFileSync(p, 'utf8')) }));
  // Rotation needs the neighbours, so load the others too.
  const given = new Set(cases.map(c => c.file));
  cases.push(...loadCases().filter(c => !given.has(c.file)).map(c => ({ ...c, neighbour: true })));
} else cases = loadCases();

const bad = cases.filter(c => !c.data);
for (const c of bad) console.error(`✗ ${c.file}: not valid JSON (${c.parseError})`);

const { results, setErrors } = validateSet(cases.filter(c => c.data), { today });
let failed = bad.length > 0;
for (const r of results) {
  const own = cases.find(c => c.file === r.file);
  if (own.neighbour) continue; // only report what was asked for
  const mark = r.errors.length ? '✗' : '✓';
  console.log(`${mark} ${r.file}  ${r.stats.words ?? '?'} words · ~${r.stats.total ?? '?'} min · ${r.stats.facts ?? '?'} facts · ${r.stats.sources ?? '?'} sources`);
  for (const e of r.errors) console.log(`    error: ${e}`);
  for (const w of r.warnings) console.log(`    warn:  ${w}`);
  if (r.errors.length) failed = true;
}
for (const e of setErrors) { console.log(`✗ set: ${e}`); failed = true; }
if (!failed) console.log('All weekly cases are valid.');
process.exit(failed ? 1 : 0);
