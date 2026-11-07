import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

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
