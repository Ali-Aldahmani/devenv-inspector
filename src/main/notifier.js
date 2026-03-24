import { Notification } from 'electron'
import { app } from 'electron'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { getSettingsSync } from './settingsStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null

function resolveIconPath() {
  const candidates = [
    path.join(__dirname, 'resources', 'icon.png'),
    path.join(__dirname, '..', 'resources', 'icon.png'),
    path.join(app.getAppPath(), 'resources', 'icon.png')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

const iconPath = resolveIconPath()

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

export function initNotifier(win) {
  mainWindow = win
}

export function sendNotification(title, body, onClick) {
  try {
    const opts = { title, body }
    if (iconPath) opts.icon = iconPath
    const n = new Notification(opts)
    if (typeof onClick === 'function') {
      n.on('click', () => {
        try {
          onClick()
        } catch {
          /* ignore */
        }
      })
    }
    n.show()
  } catch {
    /* never crash on notification failure */
  }
}

export function notifyNewPort(port, processName) {
  if (!getSettingsSync().notifyNewPort) return
  const proc = processName && String(processName).trim() ? String(processName) : 'unknown'
  sendNotification('New Port Opened', `Port ${port} is now in use by ${proc}`, () => {
    focusMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('switch-tab', 'ports')
    }
  })
}

export function notifyPackageUpdates(count) {
  if (!getSettingsSync().notifyPackageUpdates) return
  const n = Number(count) || 0
  const body = `${n} package${n > 1 ? 's have' : ' has'} updates available`
  sendNotification('Package Updates Available', body, () => {
    focusMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('switch-tab', 'packages')
      mainWindow.webContents.send('activate-filter', 'updates')
    }
  })
}

export function notifyPluginFailure(pluginName, error) {
  if (!getSettingsSync().notifyPluginFailure) return
  const name = String(pluginName || 'plugin')
  const err = error != null ? String(error) : 'Unknown error'
  sendNotification('Plugin Load Failed', `${name} failed to load: ${err}`, () => {
    focusMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('switch-tab', 'plugins')
    }
  })
}
