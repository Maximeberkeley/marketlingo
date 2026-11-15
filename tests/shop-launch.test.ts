import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { spendable } from '../mobile/lib/shopEconomy';
import { OPENING_GIFT, giftOpen } from '../mobile/lib/shopGift';
import { REPAIR_COPY } from '../mobile/lib/boosts';

const read = (p: string) => readFileSync(p, 'utf8');

describe('shop opening gift', () => {
  const sql = read('drizzle/migrations/0073_opening_gift.sql');
  it('raises the balance, never XP earned or spent', () => {
    expect(spendable(1000, 800, 750)).toEqual({ earned: 1000, spent: 800, balance: 950 });
    expect(spendable(0, 0, 750).balance).toBe(750);
    expect(spendable(1000, 800).balance).toBe(200);
  });
  it('matches the migration: 750 XP, Dec 17 2026 to Jan 31 2027, one claim per learner', () => {
    expect(sql).toContain(`'${OPENING_GIFT.id}', 'gift'`);
    expect(sql).toContain(`"amount":${OPENING_GIFT.amount},"starts":"${OPENING_GIFT.starts}","ends":"${OPENING_GIFT.ends}"`);
    expect(sql).toContain("v_key := md5('gift:' || p_gift || ':' || v_user::text)::uuid;");
    expect(sql).toContain("COALESCE(-SUM(amount) FILTER (WHERE reason = 'gift'), 0)");
    expect(OPENING_GIFT.amount).toBe(750);
  });
  it('is asked for only inside the window', () => {
    expect(giftOpen('2026-12-16')).toBe(false);
    expect(giftOpen('2026-12-17')).toBe(true);
    expect(giftOpen('2027-01-31')).toBe(true);
    expect(giftOpen('2027-02-01')).toBe(false);
  });
  it('splits into schema then data for Lovable, and is journaled', () => {
    expect(read('drizzle/migrations/0073a_opening_gift_schema.sql')).toContain('CREATE OR REPLACE FUNCTION public.shop_claim_gift(p_gift text)');
    expect(read('drizzle/migrations/0073b_opening_gift_data.sql')).toContain("'opening-gift-2026'");
    expect(read('drizzle/migrations/meta/_journal.json')).toContain('"tag": "0073_opening_gift"');
  });
});

describe('shop analytics', () => {
  it('tracks views, item views, purchases, not-enough, goals and the gift', () => {
    const shop = read('mobile/app/(tabs)/shop.tsx'), item = read('mobile/app/shop-item.tsx'), hook = read('mobile/hooks/useShop.ts'), home = read('mobile/app/(tabs)/home.tsx');
    expect(shop).toContain("trackEvent('shop_view'");
    expect(item).toContain("trackEvent('shop_item_view'");
    expect(item).toContain("trackEvent('shop_not_enough'");
    expect(hook).toContain("trackEvent('shop_purchase'");
    expect(hook).toContain("trackEvent('shop_goal_set'");
    expect(home).toContain("trackEvent('shop_gift_claimed'");
  });
});

describe('streak repair', () => {
  it('a failed check offers a retry instead of a dead end', () => {
    expect(REPAIR_COPY.unavailable).not.toMatch(/not ready/);
    expect(read('mobile/app/shop-repair.tsx')).toContain('<ChunkyButton label="Try again"');
  });
});
