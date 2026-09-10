# Fix the final iOS build failures

## Confirmed diagnosis

- `home.tsx` imports `@expo/vector-icons`, as do many other mobile screens, but that package is not declared in `mobile/package.json` or the lockfile. This accounts for the red “Unable to resolve module @expo/vector-icons” error.
- The current mobile dependency files contain `expo-audio` and no `expo-av`; the tracked mobile source also contains no `EXAV` imports. Therefore, any remaining Xcode `EXAV` target is stale generated iOS/Pods state on the Mac, not the pasted Home screen.

## Implementation

1. Add the Expo SDK 57-compatible `@expo/vector-icons` dependency to the mobile package and lockfile using Expo’s compatible installer.
2. Verify every mobile import resolves from a clean dependency installation.
3. Run focused checks across the migrated audio files and confirm there are no remaining `expo-av` or `EXAV` references in source or dependency metadata.
4. Regenerate the iOS project and CocoaPods from a clean state, then confirm:
   - `@expo/vector-icons` resolves;
   - no `EXAV` pod/target remains;
   - `expo-audio` is linked;
   - the existing RuntimeScheduler postinstall patch still applies.
5. Validate Expo Doctor and the mobile TypeScript/bundle path, then provide one exact Mac command sequence for the final Xcode Archive retry.

## Mac cleanup included in the final instructions

The retry will remove only generated local state (`node_modules`, generated `ios`, and CocoaPods output), reinstall from the committed lockfile, regenerate iOS, and open `MarketLingo.xcworkspace`. It will not discard app source changes.
