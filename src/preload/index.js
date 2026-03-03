import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getRuntimes: () => ipcRenderer.invoke('get-runtimes'),
  getPackages: () => ipcRenderer.invoke('get-packages'),
  uninstallPackage: (name, manager) =>
    ipcRenderer.invoke('uninstall-package', { name, manager })
})
