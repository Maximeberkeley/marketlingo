/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: 'widget',
  name: 'LeoWidget',
  displayName: 'Leo Streak',
  bundleIdentifier: '.leo-widget',
  deploymentTarget: '17.0',
  frameworks: ['WidgetKit', 'SwiftUI'],
  entitlements: {
    // Keep this explicit and identical to app.json. This avoids a generated
    // target ever inheriting an empty entitlement during a clean prebuild.
    'com.apple.security.application-groups': [
      'group.app.marketlingo.aerospace.shared',
    ],
  },
  colors: {
    $accent: '#1A1F36',
    $widgetBackground: '#F97316',
  },
  images: {
    // Paths are relative to this target. Absolute paths are incorrectly
    // prefixed by apple-targets during prebuild and silently skip the images.
    leoSleepy: './leo-sleepy.png',
    leoStern: './leo-stern.png',
    leoPleading: './leo-pleading.png',
    leoWorried: './leo-worried.png',
    leoSly: './leo-sly.png',
  },
});
