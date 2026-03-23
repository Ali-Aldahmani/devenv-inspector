import { app, dialog, ipcMain, shell } from 'electron'
import { detectRuntimes } from './detectors.js'
import { getAllPackages } from './parsers.js'
import { runInShell } from './shell.js'
import { getRegisteredRuntimes, getRuntime } from './registry.js'
import { getActivePorts, killProcess } from './ports.js'
import { detectEnvs } from './envDetector.js'
import path from 'path'
import { readFile, writeFile } from 'fs/promises'

const PACKAGE_NAME_RE = /^[a-zA-Z0-9._\-@/]+$/

let cachedRuntimes = null
const SCAN_FOLDERS_FILE = path.join(app.getPath('userData'), 'scan-folders.json')

async function readScanFolders() {
  try {
    const raw = await readFile(SCAN_FOLDERS_FILE, 'utf8')
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return Array.from(new Set(data.filter((p) => typeof p === 'string' && p.trim())))
  } catch {
    return []
  }
}

async function writeScanFolders(paths) {
  const clean = Array.from(
    new Set((Array.isArray(paths) ? paths : []).filter((p) => typeof p === 'string' && p.trim()))
  )
  await writeFile(SCAN_FOLDERS_FILE, JSON.stringify(clean, null, 2), 'utf8')
  return clean
}

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

  ipcMain.handle('get-environments', async (_event, extraPaths = []) => {
    try {
      return await detectEnvs(extraPaths)
    } catch {
      return []
    }
  })

  ipcMain.handle('select-folder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })
      if (result.canceled || !result.filePaths?.length) return null
      return result.filePaths[0]
    } catch {
      return null
    }
  })

  ipcMain.handle('get-scan-folders', async () => {
    return readScanFolders()
  })

  ipcMain.handle('set-scan-folders', async (_event, folders = []) => {
    try {
      return await writeScanFolders(folders)
    } catch {
      return []
    }
  })

  ipcMain.handle('open-path', async (_event, targetPath) => {
    try {
      if (!targetPath || typeof targetPath !== 'string') {
        return { success: false, error: 'Invalid path.' }
      }
      const error = await shell.openPath(targetPath)
      if (error) return { success: false, error }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Unknown error' }
    }
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
