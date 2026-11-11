# Over-the-air updates

The app has expo-updates from version 1.2.4 onward. Changes to code, text, screens and bundled art (new shop items
included) can reach phones without an App Store review. Each phone downloads an update in the background (on launch,
and when the app comes back to the foreground at most every 4 hours) and applies it on the **next launch**. It never
reloads mid-lesson.

## Ship an update

```bash
cd mobile
npx eas-cli update --channel production --message "Fix the shop promo title on small phones"
```

- Only builds with the same `version` in app.json get it (runtime policy `appVersion`). Today that's 1.2.4.
- Test first with a preview build: install one with `npx eas-cli build --profile preview`, then publish with
  `--channel preview`.
- Undo a bad update: `npx eas-cli update:rollback`, then pick the channel. Phones go back to the previous update on
  their next launch.

## What still needs a store build

A new native package, an Expo SDK upgrade, a config plugin change, new permissions, the app icon or the splash screen.
For those, **bump `version` in app.json** (for example 1.2.4 → 1.2.5) before `eas build`. Otherwise an update made
for the new build could reach phones on the old one and crash them.

## Cost

Expo's free plan covers 1,000 monthly users who download an update. Starter costs $19 a month for 3,000, then
$0.005 per extra user (expo.dev/pricing, checked Nov 11 2026).
