/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
const path = require('path');

// Local files — the widget must never depend on a network fetch at runtime.
const img = (name) => path.join(__dirname, name);

module.exports = () => ({
  type: 'widget',
  name: 'LeoWidget',
  displayName: 'Leo Streak',
  bundleIdentifier: '.leo-widget',
  deploymentTarget: '17.0',
  frameworks: ['WidgetKit', 'SwiftUI'],
  entitlements: {
    'com.apple.security.application-groups': [
      'group.app.marketlingo.aerospace.shared',
    ],
  },
  colors: {
    $accent: '#1A1F36',
    $widgetBackground: '#F97316',
  },
  images: {
    leoSleepy: img('leo-sleepy.png'),
    leoStern: img('leo-stern.png'),
    leoPleading: img('leo-pleading.png'),
    leoWorried: img('leo-worried.png'),
    leoSly: img('leo-sly.png'),
  },
});
