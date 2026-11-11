import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { BUNDLES, COSMETICS, bundleFullPrice, priceOf } from '../mobile/lib/shopCatalog';
import { raceLine } from '../mobile/lib/rankRace';
import { avatarLayers } from '../mobile/lib/shopEconomy';

const read = (p: string) => readFileSync(p, 'utf8');
const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const friends = read('mobile/app/friends.tsx');
const podium = read('mobile/components/social/LeoPodium.tsx');
const looks = read('mobile/hooks/useEquippedLooks.ts');
const sql = read('drizzle/migrations/0059_shop_public_looks.sql');

describe('the Global podium of Leos', () => {
  it("stands each of the top three's own Leo on their block, first bigger, glowing and crowned while held", () => {
    expect(friends).toContain('<LeoPodium');
    expect(friends).not.toContain('<SocialAvatar name={e.isCurrentUser ?');
    expect(podium).toContain('const LEO = [108, 88, 84];');
    expect(podium).toContain('<LeoAvatar look={p.look} crown={p.crown} size={leo} crop={false} name={p.name} />');
    expect(podium).toContain('<Pop delay=');
    expect(podium).toContain('<FloorShadow');
    expect(podium).toMatch(/i === 0 && \(\s*<>\s*<Sunburst/);
    expect(friends).toContain('<MotionScope active={focused}>');
  });

  it('draws everyone on the board as a Leo: their look, or the default Leo, never a letter', () => {
    expect(friends).toContain("publicLooks[id]?.look ?? looks[id]?.look ?? {}");
    expect(friends).toContain('look={globalLook(entry.user_id, entry.isCurrentUser)}');
    expect(looks).toContain("supabase.rpc('get_public_looks', { p_market_id: marketId, p_user_ids: ids })");
  });

  it('shares only cosmetic equip data, and only for people on that market\'s standings', () => {
    expect(sql).toContain('RETURNS TABLE(user_id uuid, look jsonb, wears_crown boolean)');
    expect(sql).toContain('WHERE EXISTS (SELECT 1 FROM public.user_xp ux WHERE ux.user_id = u AND ux.market_id = p_market_id)');
    expect(sql).toContain('unnest(p_user_ids[1:100])');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.get_public_looks(text, uuid[]) FROM anon, public;');
    for (const leak of ['display_name', 'email', 'user_inventory', 'spend_ledger', 'total_xp']) expect(sql, leak).not.toContain(leak);
  });
});

describe('the rank card', () => {
  const p = (name: string, xp: number) => ({ name, xp, look: {} });
  it('races you to the next person on XP earned, never "costs"', () => {
    expect(raceLine(5, p('You', 1100), p('Tom', 1200), p('Marcus', 2910))).toEqual({ text: '101 XP to pass Tom', fill: 1100 / 1200 });
    expect(raceLine(1, p('You', 3480), null, p('Marcus', 2910))).toEqual({ text: "You're on top · 570 XP ahead of Marcus", fill: 1 });
    expect(raceLine(null, null, null, null).text).toBe('One lesson puts you on the board.');
    expect(friends).not.toMatch(/costs/i);
    for (const r of [5, 1, null]) expect(raceLine(r, p('You', 10), p('Tom', 20), p('Ann', 5)).text).not.toMatch(/cost/i);
  });
  it('shows your Leo, the rank and a bar that fills on the native driver', () => {
    const card = read('mobile/components/social/RankCard.tsx');
    expect(friends).toContain('<RankCard');
    expect(card).toContain('<LeoAvatar look={me?.look ?? {}} crown={!!me?.crown} size={96} crop={false} name="You" />');
    expect(card).toContain("useNativeDriver: true");
    expect(card).toContain('transform: [{ scaleX: bar }]');
    expect(card).toContain('if (reduce) { bar.setValue(race.fill); return; }');
  });
});

describe('Winter royal', () => {
  it('sells the ermine cape at its founder-set price, seeded by its own migration', () => {
    const cape = COSMETICS.find(c => c.id === 'ermine-cape')!;
    expect(cape).toMatchObject({ slot: 'outfit', rarity: 'legendary', collection: 'royal', price: 7000 });
    expect(priceOf(cape)).toBe(7000);
    expect(read('drizzle/migrations/0060_shop_catalog_legendary_looks.sql')).toContain("('ermine-cape', 'cosmetic', 'outfit', 'legendary', 'Ermine cape', 7000, 'purchase'");
    expect(read('mobile/lib/shopArtIds.ts')).toContain("'ermine-cape'");
    const crow = COSMETICS.find(c => c.id === 'crow-cape')!;
    expect(crow).toMatchObject({ slot: 'outfit', rarity: 'legendary', acquisition: 'purchase', price: 7000 });
    expect(read('drizzle/migrations/0060_shop_catalog_legendary_looks.sql')).toContain("('crow-cape', 'cosmetic', 'outfit', 'legendary', 'Crow cape', 7000, 'purchase'");
    expect(read('mobile/lib/shopArtIds.ts')).toContain("'crow-cape'");
    // the Crow set: raven crown at the legendary tier for now, paired both ways
    const raven = COSMETICS.find(c => c.id === 'raven-crown')!;
    expect(raven).toMatchObject({ slot: 'hat', rarity: 'legendary', acquisition: 'purchase', pairsWith: ['crow-cape'] });
    expect(priceOf(raven)).toBe(4000);
    expect(crow.pairsWith?.[0]).toBe('raven-crown');
    expect(read('drizzle/migrations/0060_shop_catalog_legendary_looks.sql')).toContain("('raven-crown', 'cosmetic', 'hat', 'legendary', 'Raven crown', 4000, 'purchase'");
    expect(read('mobile/app/shop-item.tsx')).toContain('const paired = (lead.pairsWith ?? [])');
    const coat = COSMETICS.find(c => c.id === 'commander-coat')!;
    expect(coat).toMatchObject({ slot: 'outfit', rarity: 'legendary', acquisition: 'purchase' });
    expect(priceOf(coat)).toBe(10000);
    expect(read('drizzle/migrations/0060_shop_catalog_legendary_looks.sql')).toContain("('commander-coat', 'cosmetic', 'outfit', 'legendary', 'Commander coat', 10000, 'purchase'");
    expect(read('mobile/lib/shopArtIds.ts')).toContain("'commander-coat'");
    // holiday antlers: a common Seasonal hat that takes the featured card in December
    const antlers = COSMETICS.find(c => c.id === 'holiday-antlers')!;
    expect(antlers).toMatchObject({ slot: 'hat', rarity: 'common', collection: 'seasonal', featuredIn: [12] });
    expect(priceOf(antlers)).toBe(300);
    expect(read('drizzle/migrations/0060_shop_catalog_legendary_looks.sql')).toContain("('holiday-antlers', 'cosmetic', 'hat', 'common', 'Holiday antlers', 300, 'purchase'");
    expect(read('mobile/app/(tabs)/shop.tsx')).toContain('const pool = seasonal.length ? seasonal : sets.length ? sets : items;');
    // the Christmas set: antlers + collar, both common, cheaper together, featured as a set in December
    const collar = COSMETICS.find(c => c.id === 'holiday-collar')!;
    expect(collar).toMatchObject({ slot: 'outfit', rarity: 'common', collection: 'seasonal', featuredIn: [12] });
    expect(COSMETICS.find(c => c.id === 'reindeer-nose')).toMatchObject({ slot: 'glasses', rarity: 'common', collection: 'seasonal', featuredIn: [12] });
    const xmas = BUNDLES.find(b => b.id === 'bundle-christmas')!;
    expect(xmas.items).toEqual(['holiday-antlers', 'holiday-collar', 'reindeer-nose']);
    expect(xmas.price).toBeLessThan(bundleFullPrice(xmas));
    const sql = read('drizzle/migrations/0060_shop_catalog_legendary_looks.sql');
    expect(sql).toContain("('holiday-collar', 'cosmetic', 'outfit', 'common', 'Holiday collar', 300, 'purchase'");
    expect(sql).toContain("('reindeer-nose', 'cosmetic', 'glasses', 'common', 'Reindeer nose', 300, 'purchase'");
    expect(sql).toContain("('bundle-christmas', 'bundle', NULL, NULL, 'Christmas set', 680, 'purchase'");
  });
});

describe('Holly wreath and the champion medal', () => {
  const sql = read('drizzle/migrations/0061_shop_catalog_holly_wreath.sql');
  it('sells the holly wreath as an uncommon Seasonal outfit, suggested with the antlers, outside the Christmas set', () => {
    const wreath = COSMETICS.find(c => c.id === 'holly-wreath')!;
    expect(wreath).toMatchObject({ slot: 'outfit', rarity: 'uncommon', acquisition: 'purchase', collection: 'seasonal' });
    expect(priceOf(wreath)).toBe(500);
    expect(COSMETICS.find(c => c.id === 'holiday-antlers')!.pairsWith).toContain('holly-wreath');
    expect(BUNDLES.find(b => b.id === 'bundle-christmas')!.items).toEqual(['holiday-antlers', 'holiday-collar', 'reindeer-nose']);
    expect(sql).toContain("('holly-wreath', 'cosmetic', 'outfit', 'uncommon', 'Holly wreath', 500, 'purchase'");
    expect(read('mobile/app/shop-item.tsx')).toContain(".slice(0, 3);");
  });
  it('sells the sun diamond necklace as a rare Royal outfit, paired with the Sapphire tiara both ways', () => {
    const necklace = COSMETICS.find(c => c.id === 'sun-diamond-necklace')!;
    expect(necklace).toMatchObject({ slot: 'outfit', rarity: 'rare', acquisition: 'purchase', pairsWith: ['sapphire-tiara'] });
    expect(priceOf(necklace)).toBe(800);
    expect(COSMETICS.find(c => c.id === 'sapphire-tiara')!.pairsWith).toContain('sun-diamond-necklace');
    expect(sql).toContain("('sun-diamond-necklace', 'cosmetic', 'outfit', 'rare', 'Sun diamond necklace', 800, 'purchase'");
  });
  it('keeps the dropped lion mane out', () => {
    expect(COSMETICS.some(c => c.id === 'lion-mane')).toBe(false);
    expect(read('mobile/lib/shopArt.ts')).not.toContain('lion-mane');
  });
  it('draws the earn-only Case champion medal pinned on the chest, above outfits; hats stay above outfits too', () => {
    expect(read('mobile/lib/shopArt.ts')).toContain("'medal-champion': require('../assets/shop/held/medal-champion.png')");
    expect(avatarLayers({ outfit: 'commander-coat', held: 'medal-champion' }, { hasArt: () => true })).toEqual(['base', 'commander-coat', 'grad-cap', 'medal-champion']);
    expect(avatarLayers({ hat: 'raven-crown', outfit: 'ermine-cape', glasses: 'aviators' }, { hasArt: () => true })).toEqual(['base', 'ermine-cape', 'aviators', 'raven-crown']);
    expect(sql).toContain("'medal-champion']::text[])) WHERE kind = 'cosmetic'");
  });
});

describe('JavaScript copies', () => {
  it('match their source', () => {
    for (const [path, loader] of [['app/friends', 'tsx'], ['components/social/LeoPodium', 'tsx'], ['components/social/RankCard', 'tsx'], ['lib/rankRace', 'ts'], ['hooks/useEquippedLooks', 'ts'], ['lib/shopCatalog', 'ts']]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 60000);
});
