import './runtimes/builtins.js'
import './runtimes/nvm.js'
import './runtimes/pyenv.js'
import { app, BrowserWindow, Menu } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { registerIpcHandlers } from './ipcHandlers.js'
import { loadUserPlugins } from './pluginManager.js'
import { getSettingsSync } from './settingsStore.js'
import { initNotifier, notifyPluginFailure } from './notifier.js'
import { initUpdater, checkForUpdates } from './updater.js'

/** Title bar / taskbar icon (electron-builder `build.*.icon` only sets installer / .exe branding). */
function getWindowIconPath() {
  const file =
    process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'
  const candidates = [
    join(app.getAppPath(), 'build', file),
    join(__dirname, '..', '..', 'build', file),
    join(process.cwd(), 'build', file)
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return undefined
}

function createWindow() {
  const iconPath = getWindowIconPath()

  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: 'DevEnv Inspector',
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New Environment',
          click: () => win.webContents.send('menu-action', { action: 'new-environment' })
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' }
      ]
    },
    {
      label: 'Export',
      submenu: [
        {
          label: 'Export as JSON',
          click: () => win.webContents.send('menu-action', { action: 'export-json' })
        },
        {
          label: 'Export as CSV',
          click: () => win.webContents.send('menu-action', { action: 'export-csv' })
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: process.platform === 'darwin' ? 'Cmd+/' : 'Ctrl+/',
          click: () => win.webContents.send('open-shortcuts-modal')
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
  return win
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) {
    const dockIcon = getWindowIconPath()
    if (dockIcon) app.dock.setIcon(dockIcon)
  }

  const pluginLoadResult = await loadUserPlugins()
  registerIpcHandlers()
  const mainWindow = createWindow()
  initNotifier(mainWindow)
  if (pluginLoadResult?.failed?.length) {
    for (const f of pluginLoadResult.failed) {
      notifyPluginFailure(f.name, f.error)
    }
  }
  initUpdater(mainWindow)

  const settings = getSettingsSync()
  if (settings.checkUpdatesOnLaunch && app.isPackaged) {
    setTimeout(() => {
      checkForUpdates(false)
    }, 3000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const w = createWindow()
      initNotifier(w)
      initUpdater(w)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
