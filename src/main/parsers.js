import { runInShell } from './shell.js'

async function runJson(cmd, args, options = {}) {
  try {
    const stdout = await runInShell(cmd, args, options)
    return JSON.parse(stdout)
  } catch (err) {
    console.error(`[parsers] ${cmd} failed:`, err.message)
    return null
  }
}

async function getPipPackages() {
  // Use `python3 -m pip` — more reliable than hunting for a `pip` binary in PATH
  const data = await runJson('python3', ['-m', 'pip', 'list', '--format=json'], { timeout: 30000 })
  if (!Array.isArray(data)) return []
  return data.map((p) => ({ name: p.name, version: p.version, manager: 'pip' }))
}

async function getCondaPackages() {
  const data = await runJson('conda', ['list', '--json'], { timeout: 30000 })
  if (!Array.isArray(data)) return []
  return data.map((p) => ({ name: p.name, version: p.version, manager: 'conda' }))
}

async function getNpmPackages() {
  try {
    const stdout = await runInShell(
      'npm', ['list', '-g', '--depth=0', '--json'],
      { timeout: 30000, allowNonZero: true }
    )
    const data = JSON.parse(stdout)
    const deps = data.dependencies || {}
    return Object.entries(deps).map(([name, info]) => ({
      name,
      version: info.version || 'unknown',
      manager: 'npm'
    }))
  } catch (err) {
    console.error('[parsers] npm list failed:', err.message)
    return []
  }
}

export async function getAllPackages(runtimes) {
  const tasks = [
    runtimes.python?.installed ? getPipPackages()   : Promise.resolve([]),
    runtimes.conda?.installed  ? getCondaPackages() : Promise.resolve([]),
    runtimes.npm?.installed    ? getNpmPackages()   : Promise.resolve([])
  ]
  const [pip, conda, npm] = await Promise.all(tasks)
  return [...pip, ...conda, ...npm]
}
