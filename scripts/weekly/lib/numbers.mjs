import { MONTHS } from './constants.mjs';

const MONTH_RE = [...MONTHS, ...MONTHS.map(m => m.slice(0, 3))].join('|');
// Dates are not statistics: "November 9, 2026", "Nov 9", "2026-11-09", "November 2026".
const DATE_RES = [
  new RegExp(`\\b(?:${MONTH_RE})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?`, 'g'),
  new RegExp(`\\b(?:${MONTH_RE})\\s+\\d{4}\\b`, 'g'),
  /\b\d{4}-\d{2}-\d{2}\b/g,
];

export const NUM_RE = /(?<![\w.])[$€£]?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|bps\b|MW\b|GW\b|kV\b|km\b|M\b|B\b|K\b|x\b|million\b|billion\b|thousand\b))?/g;

const UNIT_CLASS = { million: 'M', billion: 'B', thousand: 'K' };

/** Replace dates with a blank so their digits are not read as figures. */
export function stripDates(text) {
  let out = String(text).replace(/−/g, '-').replace(/(\d)-(kV|MW|GW|km)\b/g, '$1 $2');
  for (const re of DATE_RES) out = out.replace(re, ' ');
  return out;
}

/** Numeric tokens in a piece of text, as { raw, core, unit }. */
export function numberTokens(text) {
  const tokens = [];
  for (const match of stripDates(text).matchAll(NUM_RE)) {
    const raw = match[0].trim();
    const core = raw.replace(/^[$€£]/, '').replace(/,/g, '').match(/^\d+(?:\.\d+)?/)?.[0];
    if (!core) continue;
    const unitRaw = raw.replace(/^[$€£]?[\d,]+(?:\.\d+)?\s?/, '');
    tokens.push({ raw, core, unit: UNIT_CLASS[unitRaw] || unitRaw });
  }
  return tokens;
}

export const tokenKey = t => `${t.core}|${t.unit}`;

/** A token that needs no source: a year, or a small whole number used as a count. */
export function isFreeToken(t) {
  if (t.unit) return false;
  if (/^(19|20)\d{2}$/.test(t.core)) return true;
  return /^\d{1,2}$/.test(t.core) && Number(t.core) <= 10;
}

export function round(value, decimals) {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}
