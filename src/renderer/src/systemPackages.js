/** Names treated as system/built-in when filtering the Packages list (case-insensitive). */
const SYSTEM_PACKAGE_NAMES = new Set([
  'pip',
  'setuptools',
  'wheel',
  'distlib',
  'filelock',
  'platformdirs',
  'virtualenv',
  'npm',
  'corepack'
])

export function isSystemPackageName(name) {
  return SYSTEM_PACKAGE_NAMES.has(String(name).toLowerCase())
}
