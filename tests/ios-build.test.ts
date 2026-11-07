import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fmtFix = require('../mobile/plugins/withFmtXcodeFix.js');

const app = JSON.parse(readFileSync('mobile/app.json', 'utf8')).expo;
const buildProps = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-build-properties')?.[1];

describe('iOS build', () => {
  // TestFlight build 160 crashed at launch (EXC_BAD_ACCESS in React's Props::Props while
  // registering ExpoView): the downloaded precompiled React Native did not match the code
  // compiled into the app. Compiling React Native with the app keeps them in step.
  it('compiles React Native from source instead of using the precompiled framework', () => {
    expect(buildProps.ios).toEqual({ deploymentTarget: '15.1', buildReactNativeFromSource: true });
  });

  it('does not switch to use_frameworks, which changes how everything links', () => {
    expect(buildProps.ios.useFrameworks).toBeUndefined();
  });
});

describe('fmt fix for Xcode 26.4+', () => {
  // Building React Native from source compiles fmt 11.0.2, whose consteval format strings
  // Apple clang 21 rejects ("Call to consteval function 'fmt::basic_format_string...'").
  const podfile = `target 'MarketLingo' do\n  post_install do |installer|\n    react_native_post_install(installer)\n  end\nend\n`;

  it('is registered as a config plugin', () => {
    expect(app.plugins).toContain('./plugins/withFmtXcodeFix');
  });

  it('patches fmt at the start of post_install, once', () => {
    const once = fmtFix.addFmtFix(podfile);
    expect(once.indexOf(fmtFix.MARKER)).toBeGreaterThan(once.indexOf('post_install do |installer|'));
    expect(once.indexOf(fmtFix.MARKER)).toBeLessThan(once.indexOf('react_native_post_install'));
    expect(fmtFix.addFmtFix(once)).toBe(once);
  });

  it('targets the exact Apple clang line in fmt 11.0.2 and turns consteval off for every Apple clang', () => {
    const once = fmtFix.addFmtFix(podfile);
    expect(once).toContain("'#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L'");
    expect(once).toContain("'#elif defined(__apple_build_version__)'");
    expect(once).toContain("File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')");
  });

  it('fails loudly if the Podfile has no post_install block', () => {
    expect(() => fmtFix.addFmtFix("target 'MarketLingo' do\nend\n")).toThrow(/no post_install block/);
  });
});
