import { ipcMain } from 'electron'
import { detectRuntimes } from './detectors.js'
import { getAllPackages } from './parsers.js'
import { runInShell } from './shell.js'

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

    const commandMap = {
      pip:   ['python3', ['-m', 'pip', 'uninstall', name, '-y']],
      conda: ['conda',   ['remove', name, '-y']],
      npm:   ['npm',     ['uninstall', '-g', name]]
    }

    const entry = commandMap[manager]
    if (!entry) {
      return { success: false, error: `Unknown manager: ${manager}` }
    }

    const [cmd, args] = entry
    try {
      await runInShell(cmd, args, { timeout: 60000 })
      return { success: true }
    } catch (err) {
      const message = err.stderr || err.message || 'Unknown error'
      console.error(`[ipc] uninstall ${manager}/${name} failed:`, message)
      return { success: false, error: message }
    }
  })
}
