#!/usr/bin/env node
/**
 * Workaround for expo/expo#49214 / #49426.
 *
 * expo-modules-jsi >= 57.0.5 marks the RuntimeScheduler constructors with
 * SWIFT_RETURNS_RETAINED. Swift 6.2.x (Xcode 26.2 / 26.3) rejects that attribute
 * on a constructor, which fails the iOS build with:
 *
 *   'RuntimeScheduler' cannot be annotated with either SWIFT_RETURNS_RETAINED
 *   or SWIFT_RETURNS_UNRETAINED because it is not returning a
 *   SWIFT_SHARED_REFERENCE type
 *
 * The attribute is a no-op on constructors (newer toolchains only warn about it),
 * so stripping it is safe and restores the pre-57.0.5 behaviour.
 */
const fs = require('fs');
const path = require('path');

const header = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-jsi',
  'apple',
  'Sources',
  'ExpoModulesJSI-Cxx',
  'include',
  'RuntimeScheduler.h'
);

try {
  if (!fs.existsSync(header)) process.exit(0);
  const original = fs.readFileSync(header, 'utf8');
  const patched = original.replace(/SWIFT_RETURNS_RETAINED\s+RuntimeScheduler/g, 'RuntimeScheduler');
  if (patched !== original) {
    fs.writeFileSync(header, patched);
    console.log('[patch-expo-modules-jsi] Removed SWIFT_RETURNS_RETAINED from RuntimeScheduler constructors.');
  }
} catch (error) {
  console.warn('[patch-expo-modules-jsi] Skipped:', error.message);
}
