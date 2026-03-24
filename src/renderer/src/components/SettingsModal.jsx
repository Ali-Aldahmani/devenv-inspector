import { useEffect, useState, useCallback } from 'react'
const DEFAULT_SETTINGS = {
  theme: 'system',
  autoRefresh: false,
  autoRefreshInterval: 60,
  refreshOnStartup: true
}

export default function SettingsModal({ open, onClose, onSettingsUpdated }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [resetConfirm, setResetConfirm] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const s = await window.electronAPI.getSettings()
      setSettings({ ...DEFAULT_SETTINGS, ...s })
    } catch {
      setSettings(DEFAULT_SETTINGS)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadSettings()
    setResetConfirm(false)
  }, [open, loadSettings])

  const persist = async (partial) => {
    try {
      const next = await window.electronAPI.saveSettings(partial)
      setSettings({ ...DEFAULT_SETTINGS, ...next })
      onSettingsUpdated?.(next)
      return next
    } catch {
      return null
    }
  }

  const handleTheme = async (value) => {
    await persist({ theme: value })
  }

  const handleReset = async () => {
    try {
      const next = await window.electronAPI.resetSettings()
      setSettings({ ...DEFAULT_SETTINGS, ...next })
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
