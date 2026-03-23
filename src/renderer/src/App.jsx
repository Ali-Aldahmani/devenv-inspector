import { useState, useEffect, useCallback } from 'react'
import RuntimeCard from './components/RuntimeCard'
import PackageTable from './components/PackageTable'
import PortsTable from './components/PortsTable'
import EnvironmentsTable from './components/EnvironmentsTable'
import CreateEnvironmentModal from './components/CreateEnvironmentModal'

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
  const [runtimes, setRuntimes] = useState(null)
  const [packages, setPackages] = useState([])
  const [visiblePackages, setVisiblePackages] = useState([])
  const [ports, setPorts] = useState([])
  const [environments, setEnvironments] = useState([])
  const [visibleEnvironments, setVisibleEnvironments] = useState([])
  const [scanFolders, setScanFolders] = useState([])
  const [envLoading, setEnvLoading] = useState(false)
  const [showCreateEnvModal, setShowCreateEnvModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [exportToast, setExportToast] = useState(null)
  const [activeTab, setActiveTab] = useState('packages')
  const [theme, setTheme] = useState(
    () => (document.documentElement.classList.contains('light-mode') ? 'light' : 'dark')
  )

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

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.classList.toggle('light-mode', nextTheme === 'light')
    localStorage.setItem('devenv-theme', nextTheme)
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
        <span className="app-version">v0.5.0</span>
        <button
          className="btn-theme-toggle"
          onClick={handleThemeToggle}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
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

      {showCreateEnvModal && (
        <CreateEnvironmentModal
          scanFolders={scanFolders}
          onClose={() => setShowCreateEnvModal(false)}
          onSuccess={handleCreateEnvSuccess}
        />
      )}

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
