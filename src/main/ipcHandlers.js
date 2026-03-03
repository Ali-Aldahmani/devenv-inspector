import { ipcMain } from 'electron'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { detectRuntimes } from './detectors.js'
import { getAllPackages } from './parsers.js'

const execFileAsync = promisify(execFile)

// Only allow valid package name characters to prevent command injection
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
      pip: ['pip', ['uninstall', name, '-y']],
      conda: ['conda', ['remove', name, '-y']],
      npm: ['npm', ['uninstall', '-g', name]]
    }

    const entry = commandMap[manager]
    if (!entry) {
      return { success: false, error: `Unknown manager: ${manager}` }
    }

    const [cmd, args] = entry
    try {
      await execFileAsync(cmd, args, { timeout: 60000 })
      return { success: true }
    } catch (err) {
      const message = err.stderr || err.message || 'Unknown error'
      console.error(`[ipc] uninstall ${manager}/${name} failed:`, message)
      return { success: false, error: message }
    }
  })
}
