import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const app = JSON.parse(read('mobile/app.json')).expo;
const auth = read('mobile/app/auth.tsx');
const apple = read('mobile/lib/appleAuth.ts');

describe('Sign in with Apple', () => {
  it('ships the native module and entitlement in a new app version', () => {
    expect(JSON.parse(read('mobile/package.json')).dependencies['expo-apple-authentication']).toMatch(/^~8\./);
    expect(app.ios.usesAppleSignIn).toBe(true);
    expect(app.plugins).toContain('expo-apple-authentication');
    // A native package means OTA updates must not reach 1.2.4 binaries, which lack it.
    expect(app.version).not.toBe('1.2.4');
  });
  it('signs in to Supabase with the Apple token and a hashed nonce', () => {
    expect(apple).toContain("provider: 'apple'");
    expect(apple).toContain('CryptoDigestAlgorithm.SHA256');
    expect(apple).toMatch(/nonce: rawNonce/);
    expect(apple).toMatch(/nonce: hashedNonce/);
    expect(apple).toContain("'ERR_REQUEST_CANCELED'");
  });
  it('shows the button only where Apple sign-in exists, and continues like email sign-up', () => {
    expect(auth).toContain('appleSignInAvailable()');
    expect(auth).toContain('{appleBlock}');
    expect(auth).toContain("params: { resume: '1' }");
    expect(auth).not.toContain('Social sign-in has been removed');
  });
});
