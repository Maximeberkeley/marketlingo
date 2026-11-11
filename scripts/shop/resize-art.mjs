#!/usr/bin/env node
/**
 * Keeps shipped shop art small: Leo layers (and the base bust) at 512 px, icons at 256 px, scene backdrops at
 * 1600 px wide. Run it after dropping in new art, before gen-art-registry.mjs:
 *
 *   node scripts/shop/resize-art.mjs && node scripts/shop/gen-art-registry.mjs
 *
 * Only files larger than their target are touched (resized with bicubic sampling, transparency kept), so running
 * it twice changes nothing. Uses jimp-compact, which Expo already installs in mobile/node_modules.
 */
import { readdirSync, existsSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SHOP = join(ROOT, 'mobile', 'assets', 'shop');
const Jimp = createRequire(join(ROOT, 'mobile', 'package.json'))('jimp-compact');

export const TARGETS = { base: 512, hat: 512, glasses: 512, outfit: 512, cape: 512, held: 512, background: 512, frame: 512, icons: 256, scenes: 1600 };

let changed = 0;
let before = 0;
let after = 0;
for (const [dir, max] of Object.entries(TARGETS)) {
  const folder = join(SHOP, dir);
  if (!existsSync(folder)) continue;
  for (const f of readdirSync(folder).filter(n => n.endsWith('.png'))) {
    const path = join(folder, f);
    const size = statSync(path).size;
    before += size;
    const img = await Jimp.read(readFileSync(path));
    const { width, height } = img.bitmap;
    if (width <= max) { after += size; continue; }
    img.resize(max, Math.round((height * max) / width), Jimp.RESIZE_BICUBIC);
    const buf = await img.deflateLevel(9).getBufferAsync(Jimp.MIME_PNG);
    writeFileSync(path, buf);
    after += buf.length;
    changed++;
    console.log(`${dir}/${f}: ${width} -> ${max} px, ${Math.round(size / 1024)} -> ${Math.round(buf.length / 1024)} KB`);
  }
}
console.log(`${changed} resized; shop art ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);
