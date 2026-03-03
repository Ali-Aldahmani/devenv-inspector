import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

async function runJson(cmd, args) {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 30000 })
    return JSON.parse(stdout)
  } catch (err) {
    console.error(`[parsers] ${cmd} failed:`, err.message)
    return null
  }
}

async function getPipPackages() {
  // pip list --format=json returns [{name, version}]
  const data = await runJson('pip', ['list', '--format=json'])
  if (!Array.isArray(data)) return []
  return data.map((p) => ({ name: p.name, version: p.version, manager: 'pip' }))
}

async function getCondaPackages() {
  // conda list --json returns [{name, version, ...}]
  const data = await runJson('conda', ['list', '--json'])
  if (!Array.isArray(data)) return []
  return data.map((p) => ({ name: p.name, version: p.version, manager: 'conda' }))
}

async function getNpmPackages() {
  // npm list -g --depth=0 --json returns {dependencies: {pkgName: {version}}}
  try {
    const { stdout } = await execFileAsync('npm', ['list', '-g', '--depth=0', '--json'], {
      timeout: 30000
    })
    const data = JSON.parse(stdout)
    const deps = data.dependencies || {}
    return Object.entries(deps).map(([name, info]) => ({
      name,
      version: info.version || 'unknown',
      manager: 'npm'
    }))
  } catch (err) {
    // npm exits non-zero if there are peer dep issues but still outputs valid JSON
    if (err.stdout) {
      try {
        const data = JSON.parse(err.stdout)
        const deps = data.dependencies || {}
        return Object.entries(deps).map(([name, info]) => ({
          name,
          version: info.version || 'unknown',
          manager: 'npm'
        }))
      } catch {
        // ignore
      }
    }
    console.error('[parsers] npm list failed:', err.message)
    return []
  }
}

export async function getAllPackages(runtimes) {
  const tasks = []

  if (runtimes.python?.installed) tasks.push(getPipPackages())
  else tasks.push(Promise.resolve([]))

  if (runtimes.conda?.installed) tasks.push(getCondaPackages())
  else tasks.push(Promise.resolve([]))

  if (runtimes.npm?.installed) tasks.push(getNpmPackages())
  else tasks.push(Promise.resolve([]))

  const [pip, conda, npm] = await Promise.all(tasks)
  return [...pip, ...conda, ...npm]
}
