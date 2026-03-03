"use strict";
const electron = require("electron");
const path = require("path");
const child_process = require("child_process");
const util = require("util");
const execFileAsync$2 = util.promisify(child_process.execFile);
async function runCommand(cmd, args) {
  try {
    const { stdout } = await execFileAsync$2(cmd, args, { timeout: 1e4 });
    return stdout.trim();
  } catch {
    return null;
  }
}
async function detectRuntimes() {
  const [pythonOut, condaOut, nodeOut, npmOut] = await Promise.all([
    runCommand("python3", ["--version"]).then(
      (out) => out || runCommand("python", ["--version"])
    ),
    runCommand("conda", ["--version"]),
    runCommand("node", ["--version"]),
    runCommand("npm", ["--version"])
  ]);
  return {
    python: pythonOut ? { installed: true, version: pythonOut.replace(/^Python\s+/i, "") } : { installed: false, version: null },
    conda: condaOut ? { installed: true, version: condaOut.replace(/^conda\s+/i, "") } : { installed: false, version: null },
    node: nodeOut ? { installed: true, version: nodeOut.replace(/^v/, "") } : { installed: false, version: null },
    npm: npmOut ? { installed: true, version: npmOut } : { installed: false, version: null }
  };
}
const execFileAsync$1 = util.promisify(child_process.execFile);
async function runJson(cmd, args) {
  try {
    const { stdout } = await execFileAsync$1(cmd, args, { timeout: 3e4 });
    return JSON.parse(stdout);
  } catch (err) {
    console.error(`[parsers] ${cmd} failed:`, err.message);
    return null;
  }
}
async function getPipPackages() {
  const data = await runJson("pip", ["list", "--format=json"]);
  if (!Array.isArray(data)) return [];
  return data.map((p) => ({ name: p.name, version: p.version, manager: "pip" }));
}
async function getCondaPackages() {
  const data = await runJson("conda", ["list", "--json"]);
  if (!Array.isArray(data)) return [];
  return data.map((p) => ({ name: p.name, version: p.version, manager: "conda" }));
}
async function getNpmPackages() {
  try {
    const { stdout } = await execFileAsync$1("npm", ["list", "-g", "--depth=0", "--json"], {
      timeout: 3e4
    });
    const data = JSON.parse(stdout);
    const deps = data.dependencies || {};
    return Object.entries(deps).map(([name, info]) => ({
      name,
      version: info.version || "unknown",
      manager: "npm"
    }));
  } catch (err) {
    if (err.stdout) {
      try {
        const data = JSON.parse(err.stdout);
        const deps = data.dependencies || {};
        return Object.entries(deps).map(([name, info]) => ({
          name,
          version: info.version || "unknown",
          manager: "npm"
        }));
      } catch {
      }
    }
    console.error("[parsers] npm list failed:", err.message);
    return [];
  }
}
async function getAllPackages(runtimes) {
  const tasks = [];
  if (runtimes.python?.installed) tasks.push(getPipPackages());
  else tasks.push(Promise.resolve([]));
  if (runtimes.conda?.installed) tasks.push(getCondaPackages());
  else tasks.push(Promise.resolve([]));
  if (runtimes.npm?.installed) tasks.push(getNpmPackages());
  else tasks.push(Promise.resolve([]));
  const [pip, conda, npm] = await Promise.all(tasks);
  return [...pip, ...conda, ...npm];
}
const execFileAsync = util.promisify(child_process.execFile);
const PACKAGE_NAME_RE = /^[a-zA-Z0-9._\-@/]+$/;
let cachedRuntimes = null;
function registerIpcHandlers() {
  electron.ipcMain.handle("get-runtimes", async () => {
    cachedRuntimes = await detectRuntimes();
    return cachedRuntimes;
  });
  electron.ipcMain.handle("get-packages", async () => {
    if (!cachedRuntimes) {
      cachedRuntimes = await detectRuntimes();
    }
    return getAllPackages(cachedRuntimes);
  });
  electron.ipcMain.handle("uninstall-package", async (_event, { name, manager }) => {
    if (!PACKAGE_NAME_RE.test(name)) {
      return { success: false, error: "Invalid package name." };
    }
    const commandMap = {
      pip: ["pip", ["uninstall", name, "-y"]],
      conda: ["conda", ["remove", name, "-y"]],
      npm: ["npm", ["uninstall", "-g", name]]
    };
    const entry = commandMap[manager];
    if (!entry) {
      return { success: false, error: `Unknown manager: ${manager}` };
    }
    const [cmd, args] = entry;
    try {
      await execFileAsync(cmd, args, { timeout: 6e4 });
      return { success: true };
    } catch (err) {
      const message = err.stderr || err.message || "Unknown error";
      console.error(`[ipc] uninstall ${manager}/${name} failed:`, message);
      return { success: false, error: message };
    }
  });
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: "DevEnv Inspector",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  if (process.env.NODE_ENV === "development") {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
