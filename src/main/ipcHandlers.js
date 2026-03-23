import { ipcMain } from 'electron'
import { detectRuntimes } from './detectors.js'
import { getAllPackages } from './parsers.js'
import { runInShell } from './shell.js'
import { getRegisteredRuntimes, getRuntime } from './registry.js'
import { getActivePorts, killProcess } from './ports.js'

const PACKAGE_NAME_RE = /^[a-zA-Z0-9._\-@/]+$/

let cachedRuntimes = null

export function registerIpcHandlers() {
  ipcMain.handle('get-runtimes', async () => {
    cachedRuntimes = await detectRuntimes()
    return cachedRuntimes
  })

  ipcMain.handle('get-packages', async () => {
    if (!cachedRuntimes) {
      cachedRuntimes = await detectRuntimes()
    }
    return getAllPackages(cachedRuntimes)
  })

  ipcMain.handle('uninstall-package', async (_event, { name, manager }) => {
    if (!PACKAGE_NAME_RE.test(name)) {
      return { success: false, error: 'Invalid package name.' }
    }

    const rt = getRuntime(manager)
    if (!rt?.uninstall) {
      return { success: false, error: `Unknown manager: ${manager}` }
    }

    const [cmd, args] = rt.uninstall(name)
    try {
      await runInShell(cmd, args, { timeout: 60000 })
      return { success: true }
    } catch (err) {
      const message = err.stderr || err.message || 'Unknown error'
      console.error(`[ipc] uninstall ${manager}/${name} failed:`, message)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('upgrade-package', async (_event, { name, manager }) => {
    if (!PACKAGE_NAME_RE.test(name)) {
      return { success: false, error: 'Invalid package name.' }
    }

    let cmd = null
    let args = null
    if (manager === 'python') {
      cmd = 'python3'
      args = ['-m', 'pip', 'install', '--upgrade', name]
    } else if (manager === 'npm') {
      cmd = 'npm'
      args = ['update', '-g', name]
    } else if (manager === 'yarn') {
      cmd = 'yarn'
      args = ['global', 'upgrade', name]
    } else if (manager === 'pnpm') {
      cmd = 'pnpm'
      args = ['update', '-g', name]
    } else {
      return { success: false, error: `Upgrade not supported for manager: ${manager}` }
    }

    try {
      await runInShell(cmd, args, { timeout: 120000, allowNonZero: true })
      return { success: true }
    } catch (err) {
      const message = err.stderr || err.message || 'Unknown error'
      console.error(`[ipc] upgrade ${manager}/${name} failed:`, message)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('get-outdated', async () => {
    if (!cachedRuntimes) {
      cachedRuntimes = await detectRuntimes()
    }

    const all = await Promise.all(
      getRegisteredRuntimes().map(async (rt) => {
        if (!rt.outdated || !cachedRuntimes?.[rt.name]?.installed) return []
        try {
          const rows = await rt.outdated()
          if (!Array.isArray(rows)) return []
          return rows.map((r) => ({
            name: r.name,
            current: r.current,
            latest: r.latest,
            manager: rt.name
          }))
        } catch {
          return []
        }
      })
    )

    return all.flat()
  })

  ipcMain.handle('get-ports', async () => {
    return getActivePorts()
  })

  ipcMain.handle('kill-port', async (_event, pid) => {
    try {
      killProcess(pid)
      return { success: true }
    } catch (err) {
      const message = err.message || 'Unknown error'
      console.error(`[ipc] kill-port pid=${pid} failed:`, message)
      return { success: false, error: message }
    }
  })
}
