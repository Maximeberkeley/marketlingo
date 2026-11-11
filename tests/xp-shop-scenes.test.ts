import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { COLLECTIONS, PERKS } from '../mobile/lib/shopCatalog';

const read = (p: string) => readFileSync(p, 'utf8');
const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const shop = read('mobile/app/(tabs)/shop.tsx');
const item = read('mobile/app/shop-item.tsx');
const scene = read('mobile/components/shop/Scene.tsx');
const motion = read('mobile/components/shop/Motion.tsx');

describe('shop scenes', () => {
  it('gives every collection and perk a scene, and Leo breaks out of the card', () => {
    for (const c of COLLECTIONS) expect(scene, c.id).toMatch(new RegExp(`\\n  ${c.id}: \\{ bg:`));
    for (const p of PERKS) {
      expect(scene, p.id).toContain(`'${p.id}': { bg:`);
      expect(scene, p.id).toContain(`'${p.id}': () => (`);
    }
    expect(shop).toContain('<LeoAvatar look={{ ...look, ...wear }} size={leo} crop={false} />');
    expect(shop).toContain('padTop={40}');
    expect(item).toContain('<LeoAvatar look={{ ...shop.look, ...wearing }} size={LEO_TRY} crop={false} />');
  });

  it('lets a dropped scene PNG replace the coded backdrop', () => {
    expect(read('mobile/lib/shopArt.ts')).toContain('export const SHOP_SCENES');
    expect(read('scripts/shop/gen-art-registry.mjs')).toContain("const scenes = pngs('scenes');");
    expect(scene).toContain('const art = sceneId ? SHOP_SCENES[sceneId] : undefined;');
  });

  it('moves on the native driver, only transforms and opacity, and rests under reduced motion', () => {
    for (const src of [motion, scene]) expect(src).not.toContain('useNativeDriver: false');
    for (const fn of ['Spin', 'Twinkle', 'Pop', 'PressScale', 'Float', 'Sheen']) expect(motion, fn).toContain(`export function ${fn}(`);
    expect((motion.match(/useNativeDriver: true/g) ?? []).length).toBeGreaterThanOrEqual(10);
    expect((motion.match(/if \(reduce\)/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(motion).toContain("triggerHaptic('light')");
  });
});

describe('clean on the phone', () => {
  const pngWidth = (p: string) => readFileSync(p).readUInt32BE(16);

  it('rests looping motion when the tab is behind, a section is off screen, or a carousel card is not in front', () => {
    for (const fn of ['Sheen', 'Float', 'Spin', 'Twinkle']) {
      const body = motion.slice(motion.indexOf(`export function ${fn}(`));
      expect(body.slice(0, 200), fn).toContain('useMotionOff()');
    }
    expect(motion).toContain('<MotionScope active={seen}>{children}</MotionScope>');
    expect(shop).toContain('<MotionScope active={focused}>');
    expect(shop).toContain('return () => setFocused(false);');
    expect(shop).toContain('const now = useNow(focused, 60_000);');
    expect(read('mobile/components/shop/ShopKit.tsx')).toContain('<MotionScope active={i === Math.min(index, items.length - 1)}>');
    // countdowns re-render only their own text
    expect(shop).toContain('<Countdown until={msUntilLocalMidnight}');
    // one reduced-motion subscription for all of them
    expect((motion.match(/addEventListener\?\.\('reduceMotionChanged'/g) ?? []).length).toBe(1);
    expect(item).toContain('<ConfettiBurst show={!reduce}');
  });

  it('ships layers at 512 px, icons at 256 and keeps a script for it', () => {
    for (const dir of ['base', 'hat', 'glasses', 'outfit']) {
      for (const f of readdirSync(`mobile/assets/shop/${dir}`)) expect(pngWidth(`mobile/assets/shop/${dir}/${f}`), `${dir}/${f}`).toBeLessThanOrEqual(512);
    }
    for (const f of readdirSync('mobile/assets/shop/icons')) expect(pngWidth(`mobile/assets/shop/icons/${f}`), f).toBeLessThanOrEqual(256);
    expect(read('scripts/shop/resize-art.mjs')).toContain('hat: 512');
  });

  it('caps text growth so buttons and cards hold at large Dynamic Type sizes', () => {
    expect(read('mobile/components/social/ChunkyButton.tsx')).toContain('maxFontSizeMultiplier={1.3} adjustsFontSizeToFit');
    expect(shop).not.toMatch(/<Text style=/);
    expect(item).not.toMatch(/<Text style=/);
  });
});

describe('the Shop page and the celebration', () => {
  it('keeps inventory off the page: a bag button with the freeze count, and "You have" on the freeze card', () => {
    expect(shop).not.toContain('title="Your items"');
    expect(shop).not.toContain('<ItemTile');
    expect(shop).toContain('styles.freezeBadge');
    expect(shop).toContain('`You have ${freezes}`');
    expect(read('mobile/app/wardrobe.tsx')).toContain('Streak Freeze <Text maxFontSizeMultiplier={1.3} style={styles.freezeCount}>×{freezes}</Text>');
  });

  it('celebrates in the rarity colour with Wear it first and no XP on screen', () => {
    const success = item.slice(item.indexOf('function SuccessView('), item.indexOf('function shade('));
    expect(success).toContain('const color = RARITY_COLOR[rarity];');
    expect(success).toContain('<Sunburst');
    expect(success).toContain('<ConfettiBurst');
    expect(success).toContain("triggerHaptic('success')");
    expect(success).toContain("label={worn ? 'Wearing it' : 'Wear it'}");
    expect(success).toContain('Keep shopping');
    for (const gone of ['XPChip', 'Flask', 'balance', 'roll']) expect(success, gone).not.toContain(gone);
  });

  it('has JavaScript copies that match', () => {
    for (const [path, loader] of [
      ['app/(tabs)/shop', 'tsx'], ['app/shop-item', 'tsx'], ['app/wardrobe', 'tsx'], ['components/shop/Scene', 'tsx'],
      ['components/shop/Motion', 'tsx'], ['components/shop/ShopKit', 'tsx'], ['components/shop/LeoAvatar', 'tsx'], ['components/social/ChunkyButton', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 60000);
});

describe('taking an item off', () => {
  it('offers Remove on an item Leo is wearing, which empties its slot', () => {
    const page = readFileSync('mobile/app/shop-item.tsx', 'utf8');
    expect(page).toContain('label="Remove"');
    expect(page).toContain('await shop.equip(p.slot, null)');
    expect(page).not.toContain('disabled={worn}');
  });
});
