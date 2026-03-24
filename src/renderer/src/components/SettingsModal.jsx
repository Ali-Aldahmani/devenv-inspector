import { useEffect, useState, useCallback, useRef } from 'react'
import { APP_SETTINGS_DEFAULTS } from '../appSettingsDefaults'

const ALWAYS_EXCLUDED_PILLS = [
  'node_modules',
  '.git',
  '__pycache__',
  '.cache',
  'dist',
  'build',
  '.next',
  'out',
  'coverage'
]

export default function SettingsModal({
  open,
  onClose,
  onSettingsUpdated,
  scrollToSection = null,
  onScrollToSectionConsumed
}) {
  const [settings, setSettings] = useState(APP_SETTINGS_DEFAULTS)
  const scrollDoneRef = useRef(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [alwaysExcludedOpen, setAlwaysExcludedOpen] = useState(false)
  const [manualCheckBusy, setManualCheckBusy] = useState(false)
  const manualCheckActiveRef = useRef(false)

  const loadSettings = useCallback(async () => {
    try {
            const s = await window.electronAPI.getSettings()
      setSettings({ ...APP_SETTINGS_DEFAULTS, ...s })
    } catch {
      setSettings(APP_SETTINGS_DEFAULTS)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadSettings()
    setResetConfirm(false)
    scrollDoneRef.current = false
  }, [open, loadSettings])

  useEffect(() => {
    if (!open || !scrollToSection || scrollDoneRef.current) return
    const id =
      scrollToSection === 'packages'
        ? 'settings-section-packages'
        : scrollToSection === 'ports'
          ? 'settings-section-ports'
          : scrollToSection === 'environments'
            ? 'settings-section-environments'
            : null
    if (!id) return
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      scrollDoneRef.current = true
      onScrollToSectionConsumed?.()
    })
  }, [open, scrollToSection, onScrollToSectionConsumed])

  useEffect(() => {
    const unsub = window.api.onUpdateStatus((data) => {
      if (!manualCheckActiveRef.current) return
      if (data.status === 'checking') {
        setManualCheckBusy(true)
      } else {
        setManualCheckBusy(false)
        manualCheckActiveRef.current = false
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!manualCheckBusy) return
    const t = setTimeout(() => {
      setManualCheckBusy(false)
      manualCheckActiveRef.current = false
    }, 45000)
    return () => clearTimeout(t)
  }, [manualCheckBusy])

  const persist = async (partial) => {
    try {
      const next = await window.electronAPI.saveSettings(partial)
      setSettings({ ...APP_SETTINGS_DEFAULTS, ...next })
      onSettingsUpdated?.(next)
      return next
    } catch {
      return null
    }
  }

  const handleTheme = async (value) => {
    await persist({ theme: value })
  }

  const addExcludedFolder = async () => {
    const picked = await window.electronAPI.selectFolder()
    if (!picked) return
    const next = [...new Set([...(settings.excludedFolders || []), picked])]
    await persist({ excludedFolders: next })
  }

  const removeExcludedFolder = (folder) => {
    persist({
      excludedFolders: (settings.excludedFolders || []).filter((f) => f !== folder)
    })
  }

  const handleReset = async () => {
    try {
      const next = await window.electronAPI.resetSettings()
      setSettings({ ...APP_SETTINGS_DEFAULTS, ...next })
      onSettingsUpdated?.(next)
      setResetConfirm(false)
    } catch {
      setResetConfirm(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="settings-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-modal-header">
          <h2 id="settings-title" className="settings-modal-title">
            Settings
          </h2>
          <button type="button" className="settings-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <section className="settings-section">
          <h3 className="settings-section-heading">APPEARANCE</h3>
          <div className="settings-section-body">
            <div className="setting-row setting-row-last">
              <div className="setting-row-text">
                <div className="setting-label">Theme</div>
                <div className="setting-desc">Controls the app color scheme</div>
              </div>
              <div className="setting-row-control">
                <div className="segmented segmented-theme" role="group" aria-label="Theme">
                  {['dark', 'light', 'system'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`segmented-btn ${settings.theme === key ? 'active' : ''}`}
                      onClick={() => handleTheme(key)}
                    >
                      {key === 'dark' ? 'Dark' : key === 'light' ? 'Light' : 'System'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-heading">REFRESH</h3>
          <div className="settings-section-body">
            <div className="setting-row">
              <div className="setting-row-text">
                <div className="setting-label">Refresh on startup</div>
                <div className="setting-desc">
                  Automatically reload all data when the app launches
                </div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.refreshOnStartup ? 'on' : ''}`}
                  onClick={() => persist({ refreshOnStartup: !settings.refreshOnStartup })}
                  aria-pressed={settings.refreshOnStartup}
                  aria-label="Refresh on startup"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div
              className={`setting-row ${!settings.autoRefresh ? 'setting-row-last' : ''}`}
            >
              <div className="setting-row-text">
                <div className="setting-label">Auto-refresh</div>
                <div className="setting-desc">Periodically reload runtime and package data</div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.autoRefresh ? 'on' : ''}`}
                  onClick={() => persist({ autoRefresh: !settings.autoRefresh })}
                  aria-pressed={settings.autoRefresh}
                  aria-label="Auto-refresh"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div
              className={`setting-row setting-row-interval ${settings.autoRefresh ? 'visible setting-row-last' : ''}`}
            >
              <div className="setting-row-text">
                <div className="setting-label">Refresh every</div>
              </div>
              <div className="setting-row-control">
                <div className="segmented" role="group" aria-label="Refresh interval">
                  {[
                    { sec: 30, label: '30s' },
                    { sec: 60, label: '1 min' },
                    { sec: 300, label: '5 min' }
                  ].map(({ sec, label }) => (
                    <button
                      key={sec}
                      type="button"
                      className={`segmented-btn ${
                        settings.autoRefreshInterval === sec ? 'active' : ''
                      }`}
                      onClick={() => persist({ autoRefreshInterval: sec })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section" id="settings-section-packages">
          <h3 className="settings-section-heading">PACKAGES</h3>
          <div className="settings-section-body">
            <div className="setting-row">
              <div className="setting-row-text">
                <div className="setting-label">Show system packages</div>
                <div className="setting-desc">
                  Include built-in packages like pip, setuptools, and npm itself
                </div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.showSystemPackages ? 'on' : ''}`}
                  onClick={() => persist({ showSystemPackages: !settings.showSystemPackages })}
                  aria-pressed={settings.showSystemPackages}
                  aria-label="Show system packages"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-row-text">
                <div className="setting-label">Confirm before uninstall</div>
                <div className="setting-desc">
                  Show a confirmation dialog before removing a package
                </div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.confirmBeforeUninstall ? 'on' : ''}`}
                  onClick={() =>
                    persist({ confirmBeforeUninstall: !settings.confirmBeforeUninstall })
                  }
                  aria-pressed={settings.confirmBeforeUninstall}
                  aria-label="Confirm before uninstall"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="setting-row setting-row-last">
              <div className="setting-row-text">
                <div className="setting-label">Confirm before upgrade</div>
                <div className="setting-desc">
                  Show a confirmation dialog before upgrading a package
                </div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.confirmBeforeUpgrade ? 'on' : ''}`}
                  onClick={() => persist({ confirmBeforeUpgrade: !settings.confirmBeforeUpgrade })}
                  aria-pressed={settings.confirmBeforeUpgrade}
                  aria-label="Confirm before upgrade"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section" id="settings-section-ports">
          <h3 className="settings-section-heading">PORTS</h3>
          <div className="settings-section-body">
            <div className="setting-row setting-row-last">
              <div className="setting-row-text">
                <div className="setting-label">Confirm before killing a process</div>
                <div className="setting-desc">
                  Show a confirmation dialog before sending SIGTERM to a port process
                </div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.confirmBeforeKillPort ? 'on' : ''}`}
                  onClick={() =>
                    persist({ confirmBeforeKillPort: !settings.confirmBeforeKillPort })
                  }
                  aria-pressed={settings.confirmBeforeKillPort}
                  aria-label="Confirm before killing a process"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section" id="settings-section-environments">
          <h3 className="settings-section-heading">ENVIRONMENTS</h3>
          <div className="settings-section-body">
            <div className="setting-row setting-row-scan-depth-wrap">
              <div className="setting-row-text">
                <div className="setting-label">Scan depth</div>
                <div className="setting-desc">
                  How many folder levels deep to search for environments
                </div>
              </div>
              <div className="setting-row-control">
                <div className="segmented" role="group" aria-label="Scan depth">
                  {[
                    { d: 1, label: '1 level' },
                    { d: 2, label: '2 levels' },
                    { d: 3, label: '3 levels' }
                  ].map(({ d, label }) => (
                    <button
                      key={d}
                      type="button"
                      className={`segmented-btn ${(settings.scanDepth ?? 2) === d ? 'active' : ''}`}
                      onClick={() => persist({ scanDepth: d })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {(settings.scanDepth ?? 2) === 3 && (
                <div className="settings-scan-depth-warning">
                  ⚠ Deeper scans may be slower on large directories
                </div>
              )}
            </div>

            <div className="setting-row setting-row-last setting-row-env-excluded">
              <div className="setting-env-excluded-inner">
                <div className="setting-label">Excluded folders</div>
                <div className="setting-desc">
                  Folders to skip when scanning for environments
                </div>
                {(settings.excludedFolders || []).length === 0 ? (
                  <p className="settings-excluded-empty">No folders excluded</p>
                ) : (
                  <div className="scan-folder-tags settings-excluded-tags">
                    {(settings.excludedFolders || []).map((folder) => (
                      <span className="scan-folder-tag" key={folder} title={folder}>
                        <span className="scan-folder-path">{folder}</span>
                        <button
                          type="button"
                          className="scan-folder-remove"
                          onClick={() => removeExcludedFolder(folder)}
                          title={`Remove ${folder}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button type="button" className="btn-add-folder settings-excluded-add" onClick={addExcludedFolder}>
                  ＋ Add folder
                </button>

                <div className="settings-always-excluded">
                  <button
                    type="button"
                    className="settings-always-excluded-toggle"
                    onClick={() => setAlwaysExcludedOpen((v) => !v)}
                    aria-expanded={alwaysExcludedOpen}
                  >
                    {alwaysExcludedOpen ? '▾ Always excluded' : '▸ Always excluded by default'}
                  </button>
                  {alwaysExcludedOpen && (
                    <div className="settings-always-excluded-pills">
                      {ALWAYS_EXCLUDED_PILLS.map((name) => (
                        <span className="settings-exclude-pill" key={name}>
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section" id="settings-section-updates">
          <h3 className="settings-section-heading">UPDATES</h3>
          <div className="settings-section-body">
            <div className="setting-row">
              <div className="setting-row-text">
                <div className="setting-label">Check for updates on launch</div>
                <div className="setting-desc">
                  Automatically check for new versions when the app starts
                </div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.checkUpdatesOnLaunch ? 'on' : ''}`}
                  onClick={() => persist({ checkUpdatesOnLaunch: !settings.checkUpdatesOnLaunch })}
                  aria-pressed={settings.checkUpdatesOnLaunch}
                  aria-label="Check for updates on launch"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-row-text">
                <div className="setting-label">Auto-download updates</div>
                <div className="setting-desc">
                  Download updates automatically in the background
                </div>
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`toggle-switch ${settings.autoDownloadUpdates ? 'on' : ''}`}
                  onClick={async () => {
                    const next = !settings.autoDownloadUpdates
                    await persist({ autoDownloadUpdates: next })
                    await window.api.setAutoDownload(next)
                  }}
                  aria-pressed={settings.autoDownloadUpdates}
                  aria-label="Auto-download updates"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            <div className="setting-row setting-row-last">
              <div className="setting-row-text">
                <div className="setting-label">Update channel</div>
                <div className="setting-desc">
                  Stable receives tested releases. Beta gets new features earlier.
                </div>
              </div>
              <div className="setting-row-control">
                <div className="segmented" role="group" aria-label="Update channel">
                  {[
                    { id: 'stable', label: 'Stable' },
                    { id: 'beta', label: 'Beta' }
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className={`segmented-btn ${(settings.updateChannel ?? 'stable') === id ? 'active' : ''}`}
                      onClick={async () => {
                        await persist({ updateChannel: id })
                        await window.api.setUpdateChannel(id)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="settings-check-updates-btn"
              disabled={manualCheckBusy}
              onClick={() => {
                manualCheckActiveRef.current = true
                setManualCheckBusy(true)
                window.api.checkForUpdates({ manual: true })
              }}
            >
              {manualCheckBusy ? 'Checking…' : 'Check for updates now'}
            </button>
          </div>
        </section>

        <div className="settings-footer">
          {resetConfirm ? (
            <div className="settings-reset-confirm">
              <span className="settings-reset-confirm-text">Reset all settings to defaults?</span>
              <button type="button" className="settings-reset-inline" onClick={handleReset}>
                Confirm
              </button>
              <button type="button" className="settings-reset-inline cancel" onClick={() => setResetConfirm(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="settings-reset-link" onClick={() => setResetConfirm(true)}>
              Reset to defaults
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
