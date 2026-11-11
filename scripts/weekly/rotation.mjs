#!/usr/bin/env node
/**
 * node scripts/weekly/rotation.mjs [--today YYYY-MM-DD]
 * Prints the Monday to write for, whether it already has a case, and which industries are free to use.
 * The authoring run stops quietly when the upcoming Monday is already covered.
 */
import { loadCases } from './lib/files.mjs';
import { eligibleMarkets } from './lib/validate.mjs';
import { addDaysISO } from './lib/mapping.mjs';
import { TIMEZONE } from './lib/constants.mjs';

const i = process.argv.indexOf('--today');
const today = i >= 0 ? process.argv[i + 1] : new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 Sunday .. 6 Saturday
// The next Monday strictly after today.
const target = addDaysISO(today, ((8 - dow) % 7) || 7);
const cases = loadCases().filter(c => c.data);
const existing = cases.find(c => c.data.week_start === target);

console.log(JSON.stringify({
  today,
  target_week_start: target,
  already_written: Boolean(existing),
  existing_file: existing?.file ?? null,
  eligible_markets: eligibleMarkets(cases, target),
  recent: cases.slice(-6).map(c => ({ week_start: c.data.week_start, market_id: c.data.market_id, title: c.data.title })),
}, null, 2));
