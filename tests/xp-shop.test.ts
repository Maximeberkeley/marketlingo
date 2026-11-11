import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import {
  BUNDLES, COSMETICS, CROWN_ID, DEFAULT_HAT, MAX_FREEZES_HELD, PERKS, POWER_UPS, RARITY_PRICE, STREAK_FREEZE_PRICE,
  bundleFullPrice, priceOf,
} from '../mobile/lib/shopCatalog';
import {
  avatarLayers, buyBlock, dailyDeals, dealPrice, formatCountdown, isoWeekKey, lookFromJson, lookFromRows,
  milestoneProgress, msUntilLocalMidnight, msUntilNextMonday, requirementProgress, spendable, weeklyFeature,
} from '../mobile/lib/shopEconomy';
import { ART_READY_IDS, ICON_IDS } from '../mobile/lib/shopArtIds';

const read = (p: string) => readFileSync(p, 'utf8');
// The shop's schema migration plus the catalog additions that came after it, in order.
const migrationFile = readdirSync('drizzle/migrations').find(f => f.endsWith('_xp_shop.sql'))!;
const migration = [migrationFile, ...readdirSync('drizzle/migrations').filter(f => /^\d+_shop_catalog_.*\.sql$/.test(f)).sort()]
  .map(f => read(`drizzle/migrations/${f}`)).join('\n');
const stats = { bestStreak: 12, xpEarned: 9120, weeklyCasesSubmitted: 0, lessonsCompleted: 8 };

describe('one XP balance, earned kept apart', () => {
  it('is earned minus spent, never below zero, and spending never lowers earned', () => {
    expect(spendable(9120, 2880)).toEqual({ earned: 9120, spent: 2880, balance: 6240 });
    expect(spendable(100, 400).balance).toBe(0);
    expect(spendable(100, 400).earned).toBe(100);
  });
  it('counts milestones on XP earned', () => {
    const m = milestoneProgress(9120);
    expect(m.reached).toEqual([1000, 2500, 5000]);
    expect(m.next).toBe(10000);
    expect(m.toGo).toBe(880);
    expect(milestoneProgress(200000).next).toBeNull();
  });
  it('reads balance from the server and keeps races on earned XP', () => {
    expect(migration).toContain('SELECT e.v, s.v, GREATEST(0, e.v - s.v)');
    // the spend ledger is the only thing spending writes; xp_transactions and user_xp are untouched
    expect(migration).not.toMatch(/(UPDATE|DELETE FROM|INSERT INTO) public\.(user_xp|xp_transactions)/);
  });
});

describe('purchase rules', () => {
  const ok = { price: 800, balance: 6240, hasArt: true };
  it('blocks in the order a learner needs to hear it', () => {
    expect(buyBlock(ok)).toBeNull();
    expect(buyBlock({ ...ok, comingSoon: true, owned: true })).toBe('coming_soon');
    expect(buyBlock({ ...ok, price: null })).toBe('earn_only');
    expect(buyBlock({ ...ok, hasArt: false })).toBe('no_art');
    expect(buyBlock({ ...ok, owned: true })).toBe('owned');
    expect(buyBlock({ ...ok, held: MAX_FREEZES_HELD })).toBe('max_held');
    expect(buyBlock({ ...ok, requirementsMet: false })).toBe('requirement');
    expect(buyBlock({ ...ok, balance: 799 })).toBe('not_enough');
  });
  it('prices by rarity tier, freezes at 400, earn-only and default items at no price', () => {
    for (const c of COSMETICS) {
      if (c.acquisition === 'purchase') expect(priceOf(c), c.id).toBe(c.price ?? RARITY_PRICE[c.rarity]);
      else expect(priceOf(c), c.id).toBeNull();
    }
    expect(RARITY_PRICE).toEqual({ common: 300, uncommon: 500, rare: 800, epic: 2000, legendary: 4000 });
    expect(STREAK_FREEZE_PRICE).toBe(400);
    // a founder-set price overrides the tier, and only on items that are sold
    expect(COSMETICS.find(c => c.id === 'sapphire-tiara')).toMatchObject({ rarity: 'legendary', acquisition: 'purchase', price: 10000 });
    expect(priceOf(COSMETICS.find(c => c.id === 'sapphire-tiara')!)).toBe(10000);
    for (const c of COSMETICS.filter(c => c.price !== undefined)) expect(c.acquisition, c.id).toBe('purchase');
    expect(COSMETICS.find(c => c.id === DEFAULT_HAT)?.acquisition).toBe('default');
  });
  it('makes bundles cheaper than their pieces', () => {
    for (const b of BUNDLES) expect(b.price, b.id).toBeLessThan(bundleFullPrice(b));
  });
  it('keeps undecided power-ups and every perk unsellable', () => {
    expect(POWER_UPS.filter(p => p.live).map(p => p.id)).toEqual(['streak-freeze']);
    expect(migration).toContain("'perk', NULL, NULL");
    expect(migration).toMatch(/'perk-founder-call', 'perk',[^\n]*'coming_soon'/);
    // no partner is named anywhere on the phone or in the seed
    for (const name of ['SkyDeck', 'Cal Hacks', 'Fetch.ai']) {
      expect(read('mobile/lib/shopCatalog.ts')).not.toContain(name);
      expect(migration).not.toContain(name);
    }
  });
  it('gates one perk on a submitted Weekly Case, checked on the server', () => {
    expect(PERKS.filter(p => p.requires?.requires_weekly_case_submission).map(p => p.id)).toEqual(['perk-case-badge']);
    expect(migration).toContain("v_unmet := public.shop_unmet_requirement(v_user, v_item.requirements);");
    expect(migration).toContain("FROM public.weekly_case_submissions WHERE user_id = p_user AND status = 'submitted'");
  });
  it('locks the balance check per learner and replays a retried tap', () => {
    expect(migration).toContain("pg_advisory_xact_lock(hashtext('shop:' || v_user::text))");
    expect(migration).toContain("UNIQUE (user_id, idem_key)");
    expect(migration).toContain("'replay', true");
  });
});

describe('daily deals and the weekly feature', () => {
  const ready = COSMETICS.filter(c => ART_READY_IDS.includes(c.id));
  it('gives everyone the same picks on a date and new ones the next day', () => {
    const a = dailyDeals(COSMETICS, '2026-11-10');
    expect(a).toHaveLength(3);
    expect(dailyDeals(COSMETICS, '2026-11-10')).toEqual(a);
    expect(dailyDeals(COSMETICS, '2026-11-11').map(d => d.item.id)).not.toEqual(a.map(d => d.item.id));
    for (const d of a) {
      expect(d.item.acquisition).toBe('purchase');
      expect(d.dealPrice).toBe(dealPrice(d.price));
      expect(d.dealPrice).toBeLessThan(d.price);
    }
    expect(dealPrice(800)).toBe(560);
    expect(dailyDeals(ready, '2026-11-10').every(d => ART_READY_IDS.includes(d.item.id))).toBe(true);
  });
  it('rotates the featured offer by ISO week', () => {
    const c = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const mon = new Date(2026, 10, 9, 9);
    const sun = new Date(2026, 10, 15, 21);
    expect(isoWeekKey(mon)).toBe('2026-W46');
    expect(weeklyFeature(c, mon)).toEqual(weeklyFeature(c, sun));
    expect(weeklyFeature([], mon)).toBeNull();
  });
  it('counts down to local midnight and to next Monday', () => {
    const t = new Date(2026, 10, 10, 17, 17, 50);
    expect(formatCountdown(msUntilLocalMidnight(t))).toBe('06:42:10');
    expect(formatCountdown(msUntilNextMonday(t))).toBe('5d 6h 42m');
  });
});

describe('earn-only items', () => {
  it('read the best streak, XP earned and submitted weekly cases', () => {
    const feather = COSMETICS.find(c => c.id === 'phoenix-feather')!;
    expect(requirementProgress(feather.requires, stats)).toEqual({ met: false, current: 12, target: 30, label: 'Reach a 30-day streak' });
    expect(requirementProgress(feather.requires, { ...stats, bestStreak: 31 }).met).toBe(true);
    const tenK = COSMETICS.find(c => c.id === 'frame-10k-club')!;
    expect(requirementProgress(tenK.requires, stats)).toMatchObject({ current: 9120, target: 10000 });
    const first = COSMETICS.find(c => c.id === 'frame-first-case')!;
    expect(requirementProgress(first.requires, stats).label).toBe('Submit a Weekly Case');
  });
  it('are never sold and are granted once on the server, from the best streak ever', () => {
    for (const c of COSMETICS.filter(c => c.acquisition === 'reward')) expect(c.requires, c.id).toBeTruthy();
    expect(migration).toContain('MAX(longest_streak)');
    expect(migration).toContain("ON CONFLICT (user_id, item_id) DO NOTHING");
    expect(migration).toContain("IF v_item.acquisition <> 'purchase' OR v_item.price IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'earn_only')");
  });
  it('keep the crown live from standings, never bought or equipped', () => {
    const crown = COSMETICS.find(c => c.id === CROWN_ID)!;
    expect(crown).toMatchObject({ acquisition: 'reward', hidden: true, requires: { crown_live: true } });
    expect(migration).toContain("v_item.requirements ? 'crown_live'");
    expect(migration).toContain('public.shop_wears_crown(a.uid)');
  });
});

describe("Leo's look", () => {
  const all = () => true;
  it('stacks background, cape, base, outfit, glasses, hat, held, frame', () => {
    expect(avatarLayers({ frame: 'f', held: 'h', hat: 'astro-helmet', glasses: 'g', outfit: 'o', cape: 'c', background: 'b' }, { hasArt: all }))
      .toEqual(['b', 'c', 'base', 'o', 'g', 'astro-helmet', 'h', 'f']);
  });
  it('wears the graduation cap by default, a bare head on purpose, and the crown over the hat while held', () => {
    expect(avatarLayers({}, { hasArt: all })).toEqual(['base', 'grad-cap']);
    expect(avatarLayers({ hat: '' }, { hasArt: all })).toEqual(['base']);
    expect(avatarLayers({ hat: 'astro-helmet' }, { hasArt: all, crown: true })).toEqual(['base', 'monthly-crown']);
    expect(avatarLayers({ hat: 'founder-cap' }, { hasArt: id => id !== 'founder-cap' })).toEqual(['base']);
  });
  it('reads empty slots from the server as bare', () => {
    expect(lookFromRows([{ slot: 'glasses', item_id: null }, { slot: 'hat', item_id: 'top-hat' }, { slot: 'nope', item_id: 'x' }])).toEqual({ glasses: '', hat: 'top-hat' });
    expect(lookFromJson({ hat: 'astro-helmet', glasses: null })).toEqual({ hat: 'astro-helmet', glasses: '' });
  });
});

describe('art and the server catalog stay in step', () => {
  it('ships every registered layer and icon as a local file', () => {
    const art = read('mobile/lib/shopArt.ts');
    for (const id of ART_READY_IDS) expect(art, id).toMatch(new RegExp(`'${id}': require\\('\\.\\./assets/shop/\\w+/${id}\\.png'\\)`));
    for (const id of ICON_IDS) expect(existsSync(`mobile/assets/shop/icons/${id}.png`), id).toBe(true);
    expect(existsSync('mobile/assets/shop/base/leo-base.png')).toBe(true);
    expect(art).not.toMatch(/https?:/);
    for (const id of ART_READY_IDS) expect(COSMETICS.some(c => c.id === id), `${id} is in the catalog`).toBe(true);
  });
  it('seeds every catalog item with its price into shop_items', () => {
    for (const c of COSMETICS) {
      const price = priceOf(c);
      expect(migration, c.id).toContain(`('${c.id}', 'cosmetic', '${c.slot}', '${c.rarity}', `);
      expect(migration, c.id).toMatch(new RegExp(`\\('${c.id}', 'cosmetic',[^\\n]*, ${price ?? 'NULL'}, '${c.acquisition}'`));
    }
    for (const b of BUNDLES) expect(migration, b.id).toContain(`('${b.id}', 'bundle'`);
  });
  it('marks art_ready in the seed for exactly the drawn items', () => {
    for (const c of COSMETICS) {
      // the latest migration's row is the one in force
      const row = migration.split('\n').filter(l => l.startsWith(`  ('${c.id}', 'cosmetic'`)).pop()!;
      expect(row.includes(`'live', ${ART_READY_IDS.includes(c.id)},`), c.id).toBe(true);
    }
  });
  it('allows two bought freezes in a week without touching the free one', () => {
    expect(migration).toContain("ON public.streak_freezes (user_id, market_id, week_of, kind) WHERE kind <> 'shop'");
    expect(migration).toContain("ON public.streak_freezes (user_id, market_id, freeze_date) WHERE kind = 'shop'");
    expect(read('mobile/hooks/useStreakFreeze.ts')).not.toContain('999');
  });
});
