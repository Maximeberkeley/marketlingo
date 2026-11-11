import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const app = JSON.parse(read('mobile/app.json')).expo;
const eas = JSON.parse(read('mobile/eas.json'));

describe('over-the-air updates', () => {
  it('ships expo-updates in the next build, pointed at this EAS project', () => {
    expect(JSON.parse(read('mobile/package.json')).dependencies['expo-updates']).toMatch(/^~29\./);
    expect(app.updates.url).toBe(`https://u.expo.dev/${app.extra.eas.projectId}`);
    expect(app.updates.enabled).toBe(true);
  });
  it('only reaches builds of the same app version, and never makes launch wait', () => {
    expect(app.runtimeVersion).toEqual({ policy: 'appVersion' });
    expect(app.updates.checkAutomatically).toBe('ON_LOAD');
    expect(app.updates.fallbackToCacheTimeout).toBe(0);
  });
  it('gives each build profile its own channel', () => {
    expect(eas.build.production.channel).toBe('production');
    expect(eas.build.preview.channel).toBe('preview');
    expect(eas.build.development.channel).toBe('development');
  });
  it('downloads on return to the app but never reloads a running app', () => {
    const src = read('mobile/lib/otaUpdates.ts');
    expect(src).toContain("await import('expo-updates')");
    expect(src).toContain('fetchUpdateAsync');
    expect(src).not.toContain('reloadAsync');
    expect(read('mobile/app/_layout.tsx')).toContain("if (state === 'active') void fetchUpdateInBackground();");
  });
});
