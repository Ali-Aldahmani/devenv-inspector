import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getRuntimes: () => ipcRenderer.invoke('get-runtimes'),
  getPackages: () => ipcRenderer.invoke('get-packages'),
  getOutdated: () => ipcRenderer.invoke('get-outdated'),
  getEnvironments: (extraPaths = []) => ipcRenderer.invoke('get-environments', extraPaths),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getScanFolders: () => ipcRenderer.invoke('get-scan-folders'),
  setScanFolders: (folders) => ipcRenderer.invoke('set-scan-folders', folders),
  createEnv: (targetPath, type, pythonVersion = null) =>
    ipcRenderer.invoke('create-env', { targetPath, type, pythonVersion }),
  installPackages: (targetPath, envType, packages) =>
    ipcRenderer.invoke('install-packages', { targetPath, envType, packages }),
  getPopularPackages: (envType) => ipcRenderer.invoke('get-popular-packages', envType),
  exportPackages: (format, data) => ipcRenderer.invoke('export-packages', { format, data }),
  exportEnvironments: (format, data) => ipcRenderer.invoke('export-environments', { format, data }),
  getPluginCatalog: () => ipcRenderer.invoke('get-plugin-catalog'),
  getInstalledPlugins: () => ipcRenderer.invoke('get-installed-plugins'),
  togglePlugin: (filename, enabled) => ipcRenderer.invoke('toggle-plugin', { filename, enabled }),
  deletePlugin: (filename) => ipcRenderer.invoke('delete-plugin', filename),
  savePlugin: (filename, content) => ipcRenderer.invoke('save-plugin', { filename, content }),
  getPluginsDir: () => ipcRenderer.invoke('get-plugins-dir'),
  openPluginsDir: () => ipcRenderer.invoke('open-plugins-dir'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  getDiagnostics: () => ipcRenderer.invoke('get-diagnostics'),
  clearDiagnostics: () => ipcRenderer.invoke('clear-diagnostics'),
  onEnvCreateProgress: (handler) => {
    const listener = (_event, payload) => handler(payload)
    ipcRenderer.on('env-create-progress', listener)
    return () => ipcRenderer.removeListener('env-create-progress', listener)
  },
  onMenuAction: (handler) => {
    const listener = (_event, payload) => handler(payload)
    ipcRenderer.on('menu-action', listener)
    return () => ipcRenderer.removeListener('menu-action', listener)
  },
  uninstallPackage: (name, manager) =>
    ipcRenderer.invoke('uninstall-package', { name, manager }),
  upgradePackage: (name, manager) =>
    ipcRenderer.invoke('upgrade-package', { name, manager }),
  openPath: (targetPath) => ipcRenderer.invoke('open-path', targetPath),
  getPorts: () => ipcRenderer.invoke('get-ports'),
  killPort: (pid) => ipcRenderer.invoke('kill-port', pid),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  resetSettings: () => ipcRenderer.invoke('reset-settings')
}

contextBridge.exposeInMainWorld('electronAPI', api)
contextBridge.exposeInMainWorld('api', api)
