import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getRuntimes: () => ipcRenderer.invoke('get-runtimes'),
  getPackages: () => ipcRenderer.invoke('get-packages'),
  getOutdated: () => ipcRenderer.invoke('get-outdated'),
  getEnvironments: () => ipcRenderer.invoke('get-environments'),
  uninstallPackage: (name, manager) =>
    ipcRenderer.invoke('uninstall-package', { name, manager }),
  upgradePackage: (name, manager) =>
    ipcRenderer.invoke('upgrade-package', { name, manager }),
  openPath: (targetPath) => ipcRenderer.invoke('open-path', targetPath),
  getPorts: () => ipcRenderer.invoke('get-ports'),
  killPort: (pid) => ipcRenderer.invoke('kill-port', pid)
})
