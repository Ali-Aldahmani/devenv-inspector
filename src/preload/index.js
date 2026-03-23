import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getRuntimes: () => ipcRenderer.invoke('get-runtimes'),
  getPackages: () => ipcRenderer.invoke('get-packages'),
  getOutdated: () => ipcRenderer.invoke('get-outdated'),
  getEnvironments: (extraPaths = []) => ipcRenderer.invoke('get-environments', extraPaths),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getScanFolders: () => ipcRenderer.invoke('get-scan-folders'),
  setScanFolders: (folders) => ipcRenderer.invoke('set-scan-folders', folders),
  uninstallPackage: (name, manager) =>
    ipcRenderer.invoke('uninstall-package', { name, manager }),
  upgradePackage: (name, manager) =>
    ipcRenderer.invoke('upgrade-package', { name, manager }),
  openPath: (targetPath) => ipcRenderer.invoke('open-path', targetPath),
  getPorts: () => ipcRenderer.invoke('get-ports'),
  killPort: (pid) => ipcRenderer.invoke('kill-port', pid)
})
