const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

// Xcode 26.4+ (Apple clang 21) rejects the consteval format strings in fmt 11.0.2,
// which React Native 0.81 compiles when it is built from source:
//   "Call to consteval function 'fmt::basic_format_string<...>' is not a constant expression"
// fmt 11.0.2 already turns consteval off for old Apple clang; this extends that to every
// Apple clang, the workaround from fmtlib/fmt#4740 until React Native ships fmt 12.1.
const MARKER = '# MarketLingo: fmt consteval fix for Xcode 26.4+';
const FIX = `
    ${MARKER}
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      fmt_source = File.read(fmt_base)
      fmt_patched = fmt_source.sub(
        '#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L',
        '#elif defined(__apple_build_version__)'
      )
      if fmt_patched != fmt_source
        File.chmod(0644, fmt_base)
        File.write(fmt_base, fmt_patched)
        Pod::UI.puts '[MarketLingo] Patched fmt base.h: consteval off for Apple clang'
      end
    end
`;

/** Adds the fmt patch at the start of the Podfile's post_install block (once). */
function addFmtFix(podfile) {
  if (podfile.includes(MARKER)) return podfile;
  const hook = 'post_install do |installer|';
  if (!podfile.includes(hook)) throw new Error('withFmtXcodeFix: no post_install block found in the Podfile');
  return podfile.replace(hook, hook + FIX);
}

function withFmtXcodeFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (nextConfig) => {
      const file = path.join(nextConfig.modRequest.platformProjectRoot, 'Podfile');
      fs.writeFileSync(file, addFmtFix(fs.readFileSync(file, 'utf8')));
      return nextConfig;
    },
  ]);
}

module.exports = withFmtXcodeFix;
module.exports.addFmtFix = addFmtFix;
module.exports.MARKER = MARKER;
