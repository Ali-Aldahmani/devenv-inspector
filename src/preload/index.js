import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
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
  onEnvCreateProgress: (handler) => {
    const listener = (_event, payload) => handler(payload)
    ipcRenderer.on('env-create-progress', listener)
    return () => ipcRenderer.removeListener('env-create-progress', listener)
  },
  uninstallPackage: (name, manager) =>
    ipcRenderer.invoke('uninstall-package', { name, manager }),
  upgradePackage: (name, manager) =>
    ipcRenderer.invoke('upgrade-package', { name, manager }),
  openPath: (targetPath) => ipcRenderer.invoke('open-path', targetPath),
  getPorts: () => ipcRenderer.invoke('get-ports'),
  killPort: (pid) => ipcRenderer.invoke('kill-port', pid)
})
