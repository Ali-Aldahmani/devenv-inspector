import { app } from 'electron'
import path from 'path'
import { readFile, writeFile } from 'fs/promises'
import { readFileSync as readFileSyncFs, existsSync } from 'fs'

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json')

function buildDefaultShortcuts() {
  const mod = process.platform === 'darwin' ? 'meta' : 'ctrl'
  return {
    refresh: `${mod}+r`,
    focusSearch: `${mod}+f`,
    openSettings: `${mod}+,`,
    switchTab1: `${mod}+1`,
    switchTab2: `${mod}+2`,
    switchTab3: `${mod}+3`,
    switchTab4: `${mod}+4`,
    switchTab5: `${mod}+5`,
    switchTab6: `${mod}+6`,
    toggleTheme: `${mod}+shift+t`,
    exportData: `${mod}+e`,
    upgradeAllPackages: `${mod}+shift+u`,
    closeModal: 'escape'
  }
}

function mergeShortcutsObject(raw, defaults) {
  const out = { ...defaults }
  if (!raw || typeof raw !== 'object') return out
  for (const key of Object.keys(defaults)) {
    if (Object.prototype.hasOwnProperty.call(raw, key) && typeof raw[key] === 'string') {
      const t = raw[key].trim().toLowerCase()
      out[key] = t
    }
  }
  return out
}

const DEFAULTS = {
  theme: 'system',
  autoRefresh: false,
  autoRefreshInterval: 60,
  refreshOnStartup: true,
  showSystemPackages: false,
  confirmBeforeUninstall: true,
  confirmBeforeUpgrade: true,
  confirmBeforeKillPort: true,
  scanDepth: 2,
  excludedFolders: [],
  checkUpdatesOnLaunch: true,
  autoDownloadUpdates: false,
  updateChannel: 'stable',
  accentColor: '#4a9eda',
  fontSize: 'medium',
  compactMode: false,
  notifyNewPort: false,
  notifyPackageUpdates: true,
  notifyPluginFailure: true,
  shortcuts: buildDefaultShortcuts()
}

function mergeWithDefaults(raw) {
  return {
    theme: ['dark', 'light', 'system'].includes(raw?.theme) ? raw.theme : DEFAULTS.theme,
    autoRefresh: typeof raw?.autoRefresh === 'boolean' ? raw.autoRefresh : DEFAULTS.autoRefresh,
    autoRefreshInterval: [30, 60, 300].includes(raw?.autoRefreshInterval)
      ? raw.autoRefreshInterval
      : DEFAULTS.autoRefreshInterval,
    refreshOnStartup:
      typeof raw?.refreshOnStartup === 'boolean' ? raw.refreshOnStartup : DEFAULTS.refreshOnStartup,
    showSystemPackages:
      typeof raw?.showSystemPackages === 'boolean' ? raw.showSystemPackages : DEFAULTS.showSystemPackages,
    confirmBeforeUninstall:
      typeof raw?.confirmBeforeUninstall === 'boolean'
        ? raw.confirmBeforeUninstall
        : DEFAULTS.confirmBeforeUninstall,
    confirmBeforeUpgrade:
      typeof raw?.confirmBeforeUpgrade === 'boolean'
        ? raw.confirmBeforeUpgrade
        : DEFAULTS.confirmBeforeUpgrade,
    confirmBeforeKillPort:
      typeof raw?.confirmBeforeKillPort === 'boolean'
        ? raw.confirmBeforeKillPort
        : DEFAULTS.confirmBeforeKillPort,
    scanDepth: [1, 2, 3].includes(raw?.scanDepth) ? raw.scanDepth : DEFAULTS.scanDepth,
    excludedFolders: Array.isArray(raw?.excludedFolders)
      ? Array.from(
          new Set(
            raw.excludedFolders.filter((p) => typeof p === 'string' && p.trim()).map((p) => p.trim())
          )
        )
      : DEFAULTS.excludedFolders,
    checkUpdatesOnLaunch:
      typeof raw?.checkUpdatesOnLaunch === 'boolean'
        ? raw.checkUpdatesOnLaunch
        : DEFAULTS.checkUpdatesOnLaunch,
    autoDownloadUpdates:
      typeof raw?.autoDownloadUpdates === 'boolean'
        ? raw.autoDownloadUpdates
        : DEFAULTS.autoDownloadUpdates,
    updateChannel: ['stable', 'beta'].includes(raw?.updateChannel)
      ? raw.updateChannel
      : DEFAULTS.updateChannel,
    accentColor: /^#[0-9A-Fa-f]{6}$/.test(String(raw?.accentColor || '').trim())
      ? raw.accentColor.trim().toLowerCase()
      : DEFAULTS.accentColor,
    fontSize: ['small', 'medium', 'large'].includes(raw?.fontSize) ? raw.fontSize : DEFAULTS.fontSize,
    compactMode: typeof raw?.compactMode === 'boolean' ? raw.compactMode : DEFAULTS.compactMode,
    notifyNewPort: typeof raw?.notifyNewPort === 'boolean' ? raw.notifyNewPort : DEFAULTS.notifyNewPort,
    notifyPackageUpdates:
      typeof raw?.notifyPackageUpdates === 'boolean'
        ? raw.notifyPackageUpdates
        : DEFAULTS.notifyPackageUpdates,
    notifyPluginFailure:
      typeof raw?.notifyPluginFailure === 'boolean'
        ? raw.notifyPluginFailure
        : DEFAULTS.notifyPluginFailure,
    shortcuts: mergeShortcutsObject(raw?.shortcuts, buildDefaultShortcuts())
  }
}

export function getSettingsSync() {
  try {
    if (!existsSync(SETTINGS_FILE)) return { ...DEFAULTS }
    const raw = JSON.parse(readFileSyncFs(SETTINGS_FILE, 'utf8'))
    return mergeWithDefaults(raw)
  } catch {
    return { ...DEFAULTS }
  }
}

export async function getSettings() {
  try {
    const raw = JSON.parse(await readFile(SETTINGS_FILE, 'utf8'))
    return mergeWithDefaults(raw)
  } catch {
    return { ...DEFAULTS }
  }
}

export async function saveSettings(partial) {
  const current = await getSettings()
  const merged = { ...current, ...partial }
  if (partial && Object.prototype.hasOwnProperty.call(partial, 'shortcuts')) {
    merged.shortcuts = mergeShortcutsObject(
      { ...current.shortcuts, ...partial.shortcuts },
      buildDefaultShortcuts()
    )
  }
  const next = mergeWithDefaults(merged)
  await writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8')
  return next
}

export async function resetSettings() {
  await writeFile(SETTINGS_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf8')
  return { ...DEFAULTS }
}
