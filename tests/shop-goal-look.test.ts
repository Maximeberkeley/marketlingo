import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const read = (p: string) => readFileSync(p, 'utf8');

describe('shop goal', () => {
  const sql = read('drizzle/migrations/0072_shop_goal.sql');
  it('is one row per learner, readable and writable only by its owner', () => {
    expect(sql).toContain('user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    for (const verb of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) expect(sql).toMatch(new RegExp(`FOR ${verb} TO authenticated`));
    expect(sql.match(/user_id = auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(5);
  });
  it('is in the migration journal', () => {
    expect(read('drizzle/migrations/meta/_journal.json')).toContain('"tag": "0072_shop_goal"');
  });
  it('is pinned only on single, buyable, drawn items not owned yet', () => {
    expect(read('mobile/app/shop-item.tsx')).toContain('const canGoal = !bundle && !isLook && !owned && !earnOnly && art && price !== null;');
  });
  it('shows on Home only once the shop is live, and a goal already owned is cleared', () => {
    expect(read('mobile/app/(tabs)/home.tsx')).toContain('{shop.available && <GoalCard />}');
    expect(read('mobile/hooks/useShop.ts')).toContain("if (!id || !cosmetic(id) || (owned[id]?.qty ?? 0) > 0) return null;");
  });
});

describe('get this look', () => {
  it('offers only drawn pieces XP can buy, and charges only for the ones not owned', () => {
    const friends = read('mobile/app/friends.tsx');
    expect(friends).toContain("c.acquisition === 'purchase' && hasArt(c.id)");
    expect(friends).toContain('lookIds.filter(id => !shop.owns(id))');
    const item = read('mobile/app/shop-item.tsx');
    expect(item).toContain("const toBuy = isLook ? parts.filter(p => !shop.owns(p.id)) : parts;");
    expect(item).toContain('isLook ? toBuy.reduce((sum, p) => sum + (priceOf(p) ?? 0), 0)');
  });
});
