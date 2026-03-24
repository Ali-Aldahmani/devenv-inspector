/** Default app settings — must match merge defaults in src/main/settingsStore.js */
export const APP_SETTINGS_DEFAULTS = {
  theme: 'system',
  autoRefresh: false,
  autoRefreshInterval: 60,
  refreshOnStartup: true,
  showSystemPackages: false,
  confirmBeforeUninstall: true,
  confirmBeforeUpgrade: true,
  confirmBeforeKillPort: true,
  scanDepth: 2,
  excludedFolders: []
}
