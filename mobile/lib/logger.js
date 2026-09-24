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
function prefix(scope) {
    return scope ? `[${scope}]` : '[app]';
}
export const log = {
    debug(...args) {
        if (isDev)
            console.log(...args);
    },
    info(...args) {
        if (isDev)
            console.log(...args);
    },
    warn(...args) {
        console.warn(...args);
    },
    error(...args) {
        console.error(...args);
    },
    /** Scoped logger, e.g. `const l = log.scope('tts')`. */
    scope(scope) {
        return {
            debug: (...args) => {
                if (isDev)
                    console.log(prefix(scope), ...args);
            },
            info: (...args) => {
                if (isDev)
                    console.log(prefix(scope), ...args);
            },
            warn: (...args) => console.warn(prefix(scope), ...args),
            error: (...args) => console.error(prefix(scope), ...args),
        };
    },
};
export default log;
