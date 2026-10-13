import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { glossaryFor } from '../mobile/lesson-kit/glossary';

function highlighted(text: string, market = 'aerospace') {
  const glossary = glossaryFor(market);
  if (!glossary) return [];
  return [...text.matchAll(glossary.pattern)].filter(m => glossary.lookup(m[0])).map(m => m[0]);
}

describe('Lesson terms throughout the early curriculum', () => {
  it.each([
    'Tier 1 OEMs supply chain aftermarket',
    'installed base working capital milestone payments',
    'switching costs qualification sole-source',
    'system integration intellectual property',
    'FAR DFARS production approval',
    'vertical integration AS9102',
    'AS9100 DO-178C EASA',
    'TC STC DO-160 DO-254',
    'QMS ODA DER',
    'DAL NRE FCF',
    'airworthiness traceability certification',
    'AS9100D DAR first article inspection',
    'cost-plus fixed-price FPI CPFF',
    'CP FP EVM DSO',
    'CPIF FPIF FFP EAC',
  ])('finds useful terms in day/topic sample: %s', text => {
    expect(highlighted(text).length).toBeGreaterThanOrEqual(2);
  });

  it('handles normal case, plurals, hyphens and tier ranges without changing text', () => {
    expect(highlighted('tier 1, Tier-2, Tier 2/3s, Tier 1-3, aftermarket and Backlogs.'))
      .toEqual(['tier 1', 'Tier-2', 'Tier 2/3s', 'Tier 1-3', 'aftermarket', 'Backlogs']);
  });

  it('does not turn ordinary words or product names into acronyms', () => {
    expect(highlighted('far away from a faraway OEMish company')).toEqual([]);
    expect(highlighted('LEO is your coach')).toEqual([]);
  });

  it('uses a card’s authored terms in any industry and prefers its definition', () => {
    const glossary = glossaryFor('fintech', [{ term: 'Settlement', definition: 'The final transfer of funds.' }]);
    expect(glossary?.lookup('settlement')?.definition).toBe('The final transfer of funds.');
    const custom = glossaryFor('aerospace', [{ term: 'Backlog', definition: 'The lesson-specific definition.' }]);
    expect(custom?.lookup('backlog')?.definition).toBe('The lesson-specific definition.');
  });

  it('finds definitions across every exported early day that has slides', () => {
    const csv = readFileSync('exports/aerospace_lessons.csv', 'utf8');
    for (const day of [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15]) {
      const lines = csv.split('\n').filter(line => new RegExp(`day-${day}(?![0-9])`).test(line));
      expect(highlighted(lines.join('\n')).length, `Day ${day}`).toBeGreaterThan(0);
    }
  });

  it('keeps graded prompts and choices definition-free', () => {
    for (const file of ['exercises/MultipleChoice.tsx', 'components/ChoiceCard.tsx']) {
      expect(readFileSync(`mobile/lesson-kit/${file}`, 'utf8')).not.toMatch(/glossary[ =/>]/);
    }
  });
});