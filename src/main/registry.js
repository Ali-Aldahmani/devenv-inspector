/**
 * Runtime Plugin Registry
 *
 * Register a new package manager / runtime via registerRuntime().
 * See src/main/runtimes/builtins.js for examples.
 *
 * Plugin shape:
 * {
 *   name:         string       — unique key, used as `manager` in package objects
 *   label:        string       — human-readable label for UI / CLI
 *   color:        string       — hex color for badges (e.g. '#e05454')
 *   detect:       async () => string|null   — raw version output or null if absent
 *   parseVersion: (out) => string           — extract clean version string from detect() output
 *   list:         async () => [{name, version}] | null  — null if no global packages
 *   uninstall:    (pkgName) => [cmd, argsArray] | null  — null if uninstall not supported
 * }
 */

const _runtimes = []

/**
 * Register a runtime plugin.
 * @param {Object} config
 */
export function registerRuntime(config) {
  if (!config.name || typeof config.detect !== 'function') {
    throw new Error(`registerRuntime: 'name' and 'detect' are required`)
  }
  _runtimes.push(config)
}

/** Returns all registered runtimes in registration order. */
export const getRegisteredRuntimes = () => [..._runtimes]

/** Returns a single registered runtime by name, or null. */
export const getRuntime = (name) => _runtimes.find((r) => r.name === name) ?? null
