module.exports = function (api) {
  api.cache(true);
  // Plain Expo preset. NativeWind was removed because no screen used `className`,
  // yet its JSX runtime wrapped every element and pulled the Reanimated worklet
  // runtime into the release bundle, which closed the app at launch.
  return {
    presets: ["babel-preset-expo"],
  };
};
