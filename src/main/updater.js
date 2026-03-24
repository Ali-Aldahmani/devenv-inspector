import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { getSettingsSync } from './settingsStore.js'
import { addDiagnostic } from './diagnostics.js'

let mainWindow = null
let lastCheckWasManual = false

function send(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', payload)
  }
}

/** Re-apply channel and autoDownload from persisted settings (call after save/reset). */
export function applyUpdaterSettingsFromStore() {
  const s = getSettingsSync()
  autoUpdater.channel = s.updateChannel === 'beta' ? 'beta' : 'latest'
  autoUpdater.autoDownload = Boolean(s.autoDownloadUpdates)
  autoUpdater.allowDowngrade = false
}

export function initUpdater(win) {
  mainWindow = win
  applyUpdaterSettingsFromStore()

  autoUpdater.on('checking-for-update', () => {
    send({ status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    send({
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', () => {
    send({ status: 'up-to-date', manual: lastCheckWasManual })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    send({
      status: 'downloading',
      percent: Math.round(progressObj.percent ?? 0)
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send({
      status: 'downloaded',
      version: info.version
    })
  })

  autoUpdater.on('error', (err) => {
    const message = err?.message || 'Unknown error'
    addDiagnostic({ source: 'updater', message: 'Update error', details: message })
    send({
      status: 'error',
      message
    })
  })
}

export async function checkForUpdates(manual = false) {
  lastCheckWasManual = manual
  if (!app.isPackaged) {
    if (manual) {
      send({
        status: 'error',
        message: 'Updates are only available in the installed release build.'
      })
    }
    return
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    const message = err?.message || 'Unknown error'
    addDiagnostic({ source: 'updater', message: 'checkForUpdates failed', details: message })
    send({ status: 'error', message })
  }
}

export async function downloadUpdate() {
  if (!app.isPackaged) return
  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    const message = err?.message || 'Unknown error'
    addDiagnostic({ source: 'updater', message: 'downloadUpdate failed', details: message })
    send({ status: 'error', message })
  }
}

export function installUpdate() {
  if (!app.isPackaged) return
  autoUpdater.quitAndInstall(false, true)
}

export function setAutoDownload(value) {
  autoUpdater.autoDownload = Boolean(value)
}

/** @param {'stable' | 'beta'} channel */
export function setUpdateChannel(channel) {
  autoUpdater.channel = channel === 'beta' ? 'beta' : 'latest'
}
