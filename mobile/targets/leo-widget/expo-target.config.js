/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
const sleepy = require('./leo-sleepy.png.asset.json');
const stern = require('./leo-stern.png.asset.json');
const pleading = require('./leo-pleading.png.asset.json');
const worried = require('./leo-worried.png.asset.json');
const sly = require('./leo-sly.png.asset.json');

const assetUrl = (asset) => `https://marketlingo-marketverse.lovable.app${asset.url}`;

module.exports = (config) => ({
  type: 'widget',
  name: 'LeoWidget',
  displayName: 'Leo Streak',
  bundleIdentifier: '.leo-widget',
  deploymentTarget: '17.0',
  frameworks: ['WidgetKit', 'SwiftUI'],
  entitlements: {
    'com.apple.security.application-groups': [
      `group.${config.ios.bundleIdentifier}.shared`,
    ],
  },
  colors: {
    $accent: '#1A1F36',
    $widgetBackground: '#F97316',
  },
  images: {
    leoSleepy: assetUrl(sleepy),
    leoStern: assetUrl(stern),
    leoPleading: assetUrl(pleading),
    leoWorried: assetUrl(worried),
    leoSly: assetUrl(sly),
  },
});