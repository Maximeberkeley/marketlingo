/**
 * Centralised logger.
 *
 * Rules:
 *  - `debug` / `info` are stripped in production builds (no-ops) so release
 *    binaries never leak internal state to the device console.
 *  - `warn` / `error` always run: they are cheap, rare, and useful for crash
 *    triage via Xcode / Console.app on TestFlight builds.
 *
 * Never log tokens, emails, or raw API payloads.
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

type LogArgs = unknown[];

function prefix(scope: string | undefined) {
  return scope ? `[${scope}]` : '[app]';
}

export const log = {
  debug(...args: LogArgs) {
    if (isDev) console.log(...args);
  },
  info(...args: LogArgs) {
    if (isDev) console.log(...args);
  },
  warn(...args: LogArgs) {
    console.warn(...args);
  },
  error(...args: LogArgs) {
    console.error(...args);
  },
  /** Scoped logger, e.g. `const l = log.scope('tts')`. */
  scope(scope: string) {
    return {
      debug: (...args: LogArgs) => {
        if (isDev) console.log(prefix(scope), ...args);
      },
      info: (...args: LogArgs) => {
        if (isDev) console.log(prefix(scope), ...args);
      },
      warn: (...args: LogArgs) => console.warn(prefix(scope), ...args),
      error: (...args: LogArgs) => console.error(prefix(scope), ...args),
    };
  },
};

export default log;
