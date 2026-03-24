import './runtimes/builtins.js'
import './runtimes/nvm.js'
import './runtimes/pyenv.js'
import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipcHandlers.js'
import { loadUserPlugins } from './pluginManager.js'
import { getSettingsSync } from './settingsStore.js'
import { initUpdater, checkForUpdates } from './updater.js'

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: 'DevEnv Inspector',
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
    }
  ])
  Menu.setApplicationMenu(menu)
  return win
}

app.whenReady().then(async () => {
  await loadUserPlugins()
  registerIpcHandlers()
  const mainWindow = createWindow()
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
      initUpdater(w)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
