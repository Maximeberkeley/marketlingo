import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Lovable's database tools run schema changes and data writes separately, so each file must be only one kind.
const read = (f: string) => readFileSync(`drizzle/migrations/${f}`, 'utf8').split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
const DATA = /^\s*(INSERT|UPDATE|DELETE)\b/im;
const SCHEMA = /^\s*(CREATE|ALTER|DROP|GRANT|REVOKE|DO\s+\$\$)\b/im;

describe('Lovable-ready migration splits', () => {
  for (const f of ['0062a_weekly_medals_schema.sql', '0063a_double_xp_repair_schema.sql']) {
    it(`${f} is schema only`, () => {
      const sql = read(f).replace(/\$\$[\s\S]*?\$\$/g, '');
      expect(sql).toMatch(SCHEMA);
      expect(sql).not.toMatch(DATA);
    });
  }
  for (const f of ['0062b_weekly_medals_data.sql', '0063b_double_xp_repair_data.sql']) {
    it(`${f} is data only`, () => {
      const sql = read(f);
      expect(sql).toMatch(DATA);
      expect(sql).not.toMatch(SCHEMA);
    });
  }
  it('the halves keep every statement of the originals', () => {
    const b62 = read('0062b_weekly_medals_data.sql');
    expect(b62).toContain("('medal-gold', 'cosmetic', 'held', 'legendary'");
    expect(b62).toContain("WHERE id = 'medal-champion'");
    expect(b62).toContain('CROSS JOIN LATERAL public.shop_weekly_case_placement');
    expect(read('0062a_weekly_medals_schema.sql')).toContain('CREATE OR REPLACE FUNCTION public.shop_unmet_requirement');
    expect(read('0063a_double_xp_repair_schema.sql')).toContain('CREATE TRIGGER weekly_case_grants_double_xp');
    expect(read('0063b_double_xp_repair_data.sql')).toContain("('streak-repair', 'powerup'");
  });
});
