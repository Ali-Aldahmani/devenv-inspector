import { runInShell } from './shell.js'
import { addDiagnostic } from './diagnostics.js'

const ALLOWED_MANAGERS = new Set(['python', 'npm', 'yarn', 'pnpm'])

function toErrorMessage(err) {
  if (!err) return 'Unknown error'
  return err.stderr || err.message || String(err)
}

function getUpgradeCommand(manager, name) {
  if (manager === 'python') return ['python3', ['-m', 'pip', 'install', '--upgrade', name]]
  if (manager === 'npm') return ['npm', ['update', '-g', name]]
  if (manager === 'yarn') return ['yarn', ['global', 'upgrade', name]]
  if (manager === 'pnpm') return ['pnpm', ['update', '-g', name]]
  return null
}

/**
 * @param {Array<{name:string, manager:string, current?:string, latest?:string}>} packages
 * @param {(event: object) => void} onProgress
 */
export async function upgradeAll(packages = [], onProgress = () => {}) {
  const list = Array.isArray(packages) ? packages : []
  const total = list.length
  let upgraded = 0
  let failed = 0
  let skipped = 0
  const errors = []

  onProgress({ type: 'start', total })

  for (let i = 0; i < list.length; i += 1) {
    const item = list[i] || {}
    const name = String(item.name || '').trim()
    const manager = String(item.manager || '').trim().toLowerCase()
    const index = i + 1

    onProgress({ type: 'upgrading', name, manager, index, total })

    if (!name || !ALLOWED_MANAGERS.has(manager)) {
      skipped += 1
      onProgress({ type: 'skipped', name, manager })
      continue
    }

    const cmd = getUpgradeCommand(manager, name)
    if (!cmd) {
      skipped += 1
      onProgress({ type: 'skipped', name, manager })
      continue
    }

    try {
      await runInShell(cmd[0], cmd[1], { timeout: 60000 })
      upgraded += 1
      onProgress({ type: 'success', name, manager })
    } catch (err) {
      failed += 1
      const message = toErrorMessage(err)
      errors.push({ name, manager, error: message })
      addDiagnostic({
        source: `upgrade-all ${manager}`,
        message: `Failed to upgrade ${name}`,
        details: message
      })
      onProgress({ type: 'failed', name, manager, error: message })
    }
  }

  onProgress({ type: 'done', upgraded, failed, skipped })
  return { upgraded, failed, skipped, errors }
}
