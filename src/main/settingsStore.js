import { app } from 'electron'
import path from 'path'
import { readFile, writeFile } from 'fs/promises'
import { readFileSync as readFileSyncFs, existsSync } from 'fs'

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json')

const DEFAULTS = {
  theme: 'system',
  autoRefresh: false,
  autoRefreshInterval: 60,
  refreshOnStartup: true,
  showSystemPackages: false,
  confirmBeforeUninstall: true,
  confirmBeforeUpgrade: true,
  confirmBeforeKillPort: true
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
        : DEFAULTS.confirmBeforeKillPort
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
  const next = mergeWithDefaults({ ...current, ...partial })
  await writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8')
  return next
}

export async function resetSettings() {
  await writeFile(SETTINGS_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf8')
  return { ...DEFAULTS }
}
