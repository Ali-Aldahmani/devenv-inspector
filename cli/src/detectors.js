import { getRegisteredRuntimes } from './registry.js'

export async function detectRuntimes() {
  const results = await Promise.all(
    getRegisteredRuntimes().map(async (rt) => {
      const out = await rt.detect()
      return [
        rt.name,
        out
          ? { installed: true,  version: rt.parseVersion(out), label: rt.label, color: rt.color, hasPackages: rt.list !== null }
          : { installed: false, version: null,                  label: rt.label, color: rt.color, hasPackages: rt.list !== null }
      ]
    })
  )
  return Object.fromEntries(results)
}
