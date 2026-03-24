import { useState, useEffect, useCallback, useRef } from 'react'
import RuntimeCard from './components/RuntimeCard'
import PackageTable from './components/PackageTable'
import PortsTable from './components/PortsTable'
import EnvironmentsTable from './components/EnvironmentsTable'
import CreateEnvironmentModal from './components/CreateEnvironmentModal'
import DiagnosticsPanel from './components/DiagnosticsPanel'
import PluginsTab from './components/PluginsTab'
import SettingsModal from './components/SettingsModal'
import { applyThemePreference } from './theme'

function mergePackagesWithOutdated(packages, outdatedRows) {
  const byKey = new Map(
    (outdatedRows || []).map((row) => [
      `${String(row.manager).toLowerCase()}/${String(row.name).toLowerCase()}`,
      row
    ])
  )

  return (packages || []).map((pkg) => {
    const key = `${String(pkg.manager).toLowerCase()}/${String(pkg.name).toLowerCase()}`
    const match = byKey.get(key)
    return {
      ...pkg,
      latest: match?.latest || null,
      current: match?.current || null,
      hasUpdate: Boolean(match?.latest)
    }
  })
}

export default function App() {
  if (!window.api) {
    console.error('Preload API not available')
    return null
  }
  return <AppContent />
}

function AppContent() {
  const [runtimes, setRuntimes] = useState(null)
  const [packages, setPackages] = useState([])
  const [visiblePackages, setVisiblePackages] = useState([])
  const [ports, setPorts] = useState([])
  const [environments, setEnvironments] = useState([])
  const [visibleEnvironments, setVisibleEnvironments] = useState([])
  const [scanFolders, setScanFolders] = useState([])
  const [envLoading, setEnvLoading] = useState(false)
  const [diagnostics, setDiagnostics] = useState([])
  const [diagLoading, setDiagLoading] = useState(false)
  const [installedPlugins, setInstalledPlugins] = useState([])
  const [pluginCatalog, setPluginCatalog] = useState([])
  const [pluginsLoading, setPluginsLoading] = useState(false)
  const [pluginRestartRequired, setPluginRestartRequired] = useState(false)
  const loadDiagnostics = useCallback(async () => {
    setDiagLoading(true)
    try {
      const rows = await window.electronAPI.getDiagnostics()
      setDiagnostics(Array.isArray(rows) ? rows : [])
    } catch {
      setDiagnostics([])
    } finally {
      setDiagLoading(false)
    }
  }, [])

  const loadPlugins = useCallback(async () => {
    setPluginsLoading(true)
    try {
      const [installed, catalog] = await Promise.all([
        window.electronAPI.getInstalledPlugins(),
        window.electronAPI.getPluginCatalog()
      ])
      setInstalledPlugins(Array.isArray(installed) ? installed : [])
      setPluginCatalog(Array.isArray(catalog) ? catalog : [])
    } catch {
      setInstalledPlugins([])
      setPluginCatalog([])
    } finally {
      setPluginsLoading(false)
    }
  }, [])

  const [showCreateEnvModal, setShowCreateEnvModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [exportToast, setExportToast] = useState(null)
  const [activeTab, setActiveTab] = useState('packages')
  const [themePreference, setThemePreference] = useState(() => {
    const raw = localStorage.getItem('devenv-theme') ?? 'system'
    return ['dark', 'light', 'system'].includes(raw) ? raw : 'system'
  })
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const activeTabRef = useRef(activeTab)
  const loadDataRef = useRef(null)
  const autoRefreshTimerRef = useRef(null)

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  const loadEnvironments = useCallback(async (customFolders = scanFolders) => {
    setEnvLoading(true)
    try {
      const envs = await window.electronAPI.getEnvironments(customFolders)
      setEnvironments(Array.isArray(envs) ? envs : [])
    } catch {
      setEnvironments([])
    } finally {
      setEnvLoading(false)
    }
  }, [scanFolders])

  const loadScanFolders = useCallback(async () => {
    try {
      const folders = await window.electronAPI.getScanFolders()
      const clean = Array.isArray(folders) ? folders : []
      setScanFolders(clean)
      return clean
    } catch {
      setScanFolders([])
      return []
    }
  }, [])

  const loadData = useCallback(async ({ includeEnvironments = false } = {}) => {
    setLoading(true)
    try {
      const [rt, pkgs, outdated, pts] = await Promise.all([
        window.electronAPI.getRuntimes(),
        window.electronAPI.getPackages(),
        window.electronAPI.getOutdated(),
        window.electronAPI.getPorts()
      ])
      setRuntimes(rt)
      setPackages(mergePackagesWithOutdated(pkgs, outdated))
      setPorts(pts)
      if (includeEnvironments) {
        await loadEnvironments(scanFolders)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [loadEnvironments, scanFolders])

  const clearAutoRefresh = useCallback(() => {
    if (autoRefreshTimerRef.current != null) {
      clearInterval(autoRefreshTimerRef.current)
      autoRefreshTimerRef.current = null
    }
  }, [])

  const startAutoRefresh = useCallback(
    (intervalSeconds) => {
      clearAutoRefresh()
      autoRefreshTimerRef.current = setInterval(() => {
        loadDataRef.current?.({
          includeEnvironments: activeTabRef.current === 'environments'
        })
      }, intervalSeconds * 1000)
    },
    [clearAutoRefresh]
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      setSystemDark(mq.matches)
      if (themePreference === 'system') {
        applyThemePreference('system')
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [themePreference])

  useEffect(() => {
    applyThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    loadDataRef.current = loadData
  }, [loadData])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let s = null
      try {
        s = await window.electronAPI.getSettings()
      } catch {
        s = null
      }
      if (cancelled) return
      if (s?.theme) {
        setThemePreference(s.theme)
      }
      const shouldRefreshStartup = s?.refreshOnStartup !== false
      if (shouldRefreshStartup) {
        await loadData({ includeEnvironments: false })
      } else {
        setLoading(false)
      }
      if (s?.autoRefresh) {
        startAutoRefresh(s.autoRefreshInterval ?? 60)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [startAutoRefresh])

  useEffect(
    () => () => {
      clearAutoRefresh()
    },
    [clearAutoRefresh]
  )

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const showExportToast = (message, type = 'success') => {
    setExportToast({ message, type })
    setTimeout(() => setExportToast(null), 3000)
  }

  const runExportFromMenu = useCallback(async (format) => {
    const isEnvTab = activeTab === 'environments'
    const result = isEnvTab
      ? await window.electronAPI.exportEnvironments(format, visibleEnvironments)
      : await window.electronAPI.exportPackages(format, visiblePackages)
    if (result?.success && result?.path) {
      const filename = result.path.split(/[\\/]/).pop()
      showExportToast(`Saved to ${filename}`, 'success')
    } else {
      showExportToast('Export failed', 'error')
    }
  }, [activeTab, visibleEnvironments, visiblePackages])

  useEffect(() => {
    const unsub = window.electronAPI.onMenuAction(async ({ action }) => {
      if (action === 'new-environment') {
        setActiveTab('environments')
        setShowCreateEnvModal(true)
        return
      }
      if (action === 'export-json') {
        await runExportFromMenu('json')
        return
      }
      if (action === 'export-csv') {
        await runExportFromMenu('csv')
      }
    })
    return () => unsub?.()
  }, [runExportFromMenu])

  const handleUninstall = async (name, manager) => {
    const result = await window.electronAPI.uninstallPackage(name, manager)
    if (result.success) {
      showToast(`"${name}" removed successfully.`, 'success')
      const [pkgs, outdated] = await Promise.all([
        window.electronAPI.getPackages(),
        window.electronAPI.getOutdated()
      ])
      setPackages(mergePackagesWithOutdated(pkgs, outdated))
    } else {
      showToast(`Failed to remove "${name}": ${result.error}`, 'error')
    }
  }

  const handleUpgrade = async (name, manager) => {
    const result = await window.electronAPI.upgradePackage(name, manager)
    if (result.success) {
      showToast(`"${name}" updated successfully.`, 'success')
      const [pkgs, outdated] = await Promise.all([
        window.electronAPI.getPackages(),
        window.electronAPI.getOutdated()
      ])
      setPackages(mergePackagesWithOutdated(pkgs, outdated))
    } else {
      showToast(`Failed to update "${name}": ${result.error}`, 'error')
    }
  }

  const handleKillPort = async (pid) => {
    const result = await window.electronAPI.killPort(pid)
    if (result.success) {
      showToast(`Process ${pid} terminated.`, 'success')
      // Refresh ports list only
      const pts = await window.electronAPI.getPorts()
      setPorts(pts)
    } else {
      showToast(`Failed to kill process ${pid}: ${result.error}`, 'error')
    }
  }

  const effectiveLight =
    themePreference === 'light' || (themePreference === 'system' && !systemDark)

  const handleThemeToggle = () => {
    const nextTheme = effectiveLight ? 'dark' : 'light'
    setThemePreference(nextTheme)
    applyThemePreference(nextTheme)
    window.electronAPI.saveSettings({ theme: nextTheme }).catch(() => {})
  }

  const handleSettingsUpdated = (s) => {
    setThemePreference(s.theme)
    applyThemePreference(s.theme)
    clearAutoRefresh()
    if (s.autoRefresh) {
      startAutoRefresh(s.autoRefreshInterval ?? 60)
    }
  }

  const handleOpenPath = async (targetPath) => {
    const result = await window.electronAPI.openPath(targetPath)
    if (!result?.success) {
      showToast(`Failed to open path: ${result?.error || 'Unknown error'}`, 'error')
    }
  }

  const handleOpenEnvironmentsTab = () => {
    setActiveTab('environments')
    ;(async () => {
      const folders = await loadScanFolders()
      await loadEnvironments(folders)
    })()
  }

  const handleOpenDiagnosticsTab = () => {
    setActiveTab('diagnostics')
    loadDiagnostics()
  }

  const handleOpenPluginsTab = () => {
    setActiveTab('plugins')
    loadPlugins()
  }
  const handleClearDiagnostics = async () => {
    await window.electronAPI.clearDiagnostics()
    await loadDiagnostics()
  }

  const handleCopyDiagnostics = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '')
      showToast('Diagnostics copied to clipboard.', 'success')
    } catch {
      showToast('Failed to copy diagnostics.', 'error')
    }
  }

  const handleTogglePlugin = async (filename, enabled) => {
    await window.electronAPI.togglePlugin(filename, enabled)
    if (enabled) setPluginRestartRequired(true)
    await loadData()
    await loadPlugins()
  }

  const handleDeletePlugin = async (filename) => {
    await window.electronAPI.deletePlugin(filename)
    showToast('Plugin deleted.', 'success')
    await loadPlugins()
  }

  const handleInstallCatalogPlugin = async (item) => {
    const result = await window.electronAPI.savePlugin(`${item.name}.js`, item.pluginCode)
    if (result?.success) {
      showToast(`${item.label} plugin installed - restart to activate.`, 'success')
      setPluginRestartRequired(true)
      await loadPlugins()
    } else {
      showToast(result?.error || 'Failed to install plugin.', 'error')
    }
  }

  const handleSaveCustomPlugin = async (filename, content) => {
    const result = await window.electronAPI.savePlugin(filename, content)
    if (result?.success) {
      showToast('Plugin saved - restart to activate.', 'success')
      setPluginRestartRequired(true)
      await loadPlugins()
    } else {
      showToast(result?.error || 'Failed to save plugin.', 'error')
    }
  }


  const handleCreateEnvSuccess = async () => {
    await loadEnvironments(scanFolders)
  }

  const handleAddScanFolder = async () => {
    const selected = await window.electronAPI.selectFolder()
    if (!selected) return

    const updated = Array.from(new Set([...scanFolders, selected]))
    const saved = await window.electronAPI.setScanFolders(updated)
    const next = Array.isArray(saved) ? saved : updated
    setScanFolders(next)
    await loadEnvironments(next)
  }

  const handleRemoveScanFolder = async (targetPath) => {
    const updated = scanFolders.filter((p) => p !== targetPath)
    const saved = await window.electronAPI.setScanFolders(updated)
    const next = Array.isArray(saved) ? saved : updated
    setScanFolders(next)
    await loadEnvironments(next)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">DevEnv Inspector</h1>
        <span className="app-version">v0.6.0</span>
        <button
          type="button"
          className="btn-settings-open"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          ⚙
        </button>
        <button
          type="button"
          className="btn-theme-toggle"
          onClick={handleThemeToggle}
          title={effectiveLight ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {effectiveLight ? '🌙' : '☀️'}
        </button>
        <button
          className="btn-refresh"
          onClick={() => loadData({ includeEnvironments: activeTab === 'environments' })}
          disabled={loading}
          title="Refresh all data"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      <section className="runtimes-row">
        {runtimes
          ? Object.entries(runtimes).map(([key, info]) => (
              <RuntimeCard
                key={key}
                label={info.label}
                info={info}
                loading={loading}
              />
            ))
          : // Render placeholder cards while loading
            Array.from({ length: 6 }).map((_, i) => (
              <RuntimeCard key={i} label="" info={null} loading={true} />
            ))
        }
      </section>

      {/* ── Section tabs ── */}
      <div className="section-tabs">
        <button
          className={`section-tab ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          Packages
        </button>
        <button
          className={`section-tab ${activeTab === 'environments' ? 'active' : ''}`}
          onClick={handleOpenEnvironmentsTab}
        >
          Environments
          <span className="tab-count tab-count-env">{environments.length}</span>
        </button>
        <button
          className={`section-tab ${activeTab === 'ports' ? 'active' : ''}`}
          onClick={() => setActiveTab('ports')}
        >
          Active Ports
          {!loading && ports.length > 0 && <span className="tab-count tab-count-ports">{ports.length}</span>}
        </button>
        <button
          className={`section-tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={handleOpenDiagnosticsTab}
        >
          Diagnostics
          {diagnostics.length > 0 && <span className="tab-count">{diagnostics.length}</span>}
        </button>
        <button
          className={`section-tab ${activeTab === 'plugins' ? 'active' : ''}`}
          onClick={handleOpenPluginsTab}
        >
          ⚙ Plugins
          <span className="tab-count">{installedPlugins.filter((p) => p.enabled).length}</span>
        </button>
      </div>

      {activeTab === 'packages' && (
        <section className="packages-section">
          <PackageTable
            packages={packages}
            loading={loading}
            runtimes={runtimes}
            onUninstall={handleUninstall}
            onUpgrade={handleUpgrade}
            onExportToast={showExportToast}
            onFilteredChange={setVisiblePackages}
          />
        </section>
      )}

      {activeTab === 'ports' && (
        <section className="packages-section">
          <PortsTable
            ports={ports}
            loading={loading}
            onKill={handleKillPort}
          />
        </section>
      )}

      {activeTab === 'environments' && (
        <section className="packages-section">
          <EnvironmentsTable
            environments={environments}
            loading={envLoading}
            onOpen={handleOpenPath}
            scanFolders={scanFolders}
            onAddFolder={handleAddScanFolder}
            onRemoveFolder={handleRemoveScanFolder}
            onNewEnvironment={() => setShowCreateEnvModal(true)}
            onExportToast={showExportToast}
            onFilteredChange={setVisibleEnvironments}
          />
        </section>
      )}

      {activeTab === 'diagnostics' && (
        <DiagnosticsPanel
          logs={diagnostics}
          loading={diagLoading}
          onRefresh={loadDiagnostics}
          onClear={handleClearDiagnostics}
          onCopy={handleCopyDiagnostics}
        />
      )}

      {activeTab === 'plugins' && (
        <PluginsTab
          installed={installedPlugins}
          catalog={pluginCatalog}
          restartRequired={pluginRestartRequired}
          onRestartNow={() => window.electronAPI.restartApp()}
          onRefreshInstalled={loadPlugins}
          onToggle={handleTogglePlugin}
          onDelete={handleDeletePlugin}
          onInstallCatalog={handleInstallCatalogPlugin}
          onOpenPluginsDir={() => window.electronAPI.openPluginsDir()}
          onSaveCustom={handleSaveCustomPlugin}
          loading={pluginsLoading}
        />
      )}

      {showCreateEnvModal && (
        <CreateEnvironmentModal
          scanFolders={scanFolders}
          onClose={() => setShowCreateEnvModal(false)}
          onSuccess={handleCreateEnvSuccess}
        />
      )}

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsUpdated={handleSettingsUpdated}
      />

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
      {exportToast && (
        <div className={`export-toast export-toast-${exportToast.type}`}>
          {exportToast.message}
        </div>
      )}
    </div>
  )
}
