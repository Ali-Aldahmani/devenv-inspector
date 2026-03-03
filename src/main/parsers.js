import { getRegisteredRuntimes } from './registry.js'

export async function getAllPackages(runtimes) {
  const results = await Promise.all(
    getRegisteredRuntimes()
      .filter((rt) => rt.list && runtimes[rt.name]?.installed)
      .map(async (rt) => {
        const pkgs = await rt.list()
        return pkgs.map((p) => ({ ...p, manager: rt.name }))
      })
  )
  return results.flat()
}
