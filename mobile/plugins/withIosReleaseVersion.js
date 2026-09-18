const { withXcodeProject } = require('expo/config-plugins');

module.exports = function withIosReleaseVersion(config) {
  return withXcodeProject(config, (nextConfig) => {
    const version = nextConfig.version;
    const buildNumber = nextConfig.ios?.buildNumber;
    const buildConfigurations = nextConfig.modResults.pbxXCBuildConfigurationSection();

    for (const [key, configuration] of Object.entries(buildConfigurations)) {
      if (key.endsWith('_comment') || !configuration?.buildSettings) continue;
      if (version) configuration.buildSettings.MARKETING_VERSION = version;
      if (buildNumber) configuration.buildSettings.CURRENT_PROJECT_VERSION = buildNumber;
    }

    return nextConfig;
  });
};