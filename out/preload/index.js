"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getRuntimes: () => electron.ipcRenderer.invoke("get-runtimes"),
  getPackages: () => electron.ipcRenderer.invoke("get-packages"),
  uninstallPackage: (name, manager) => electron.ipcRenderer.invoke("uninstall-package", { name, manager })
});
