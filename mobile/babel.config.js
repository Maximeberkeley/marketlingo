module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    // Reanimated 4 moved its Babel transform into react-native-worklets.
    // Keeping the old "react-native-reanimated/plugin" here leaves animation
    // worklets untransformed, which crashes release builds at launch.
    plugins: ["react-native-worklets/plugin"],
  };
};
