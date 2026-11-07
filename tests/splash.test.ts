import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const app = JSON.parse(readFileSync('mobile/app.json', 'utf8')).expo;
// Width and height straight from the PNG header.
const pngSize = (path: string) => {
  const png = readFileSync(path);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

describe('purple splash screen', () => {
  it('fills the iPhone screen with the purple MarketLingo image', () => {
    expect(app.ios.splash).toEqual({ image: './assets/splash-purple.png', resizeMode: 'cover', backgroundColor: '#8B5CF6' });
    expect(pngSize('mobile/assets/splash-purple.png')).toEqual([1284, 2778]);
  });

  it('shows the white wordmark on the same purple elsewhere', () => {
    expect(app.splash).toEqual({ image: './assets/splash-wordmark.png', resizeMode: 'contain', backgroundColor: '#8B5CF6' });
    expect(pngSize('mobile/assets/splash-wordmark.png')).toEqual([1024, 1024]);
  });

  it('uses the theme purple', () => {
    expect(readFileSync('mobile/lib/constants.ts', 'utf8')).toContain("accent: '#8B5CF6',");
  });
});
