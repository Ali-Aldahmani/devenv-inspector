import { useState, useEffect, useCallback } from 'react'
import RuntimeCard from './components/RuntimeCard'
import PackageTable from './components/PackageTable'
import PortsTable from './components/PortsTable'
import EnvironmentsTable from './components/EnvironmentsTable'

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
  const [ports, setPorts] = useState([])
  const [environments, setEnvironments] = useState([])
  const [envLoading, setEnvLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('packages')
  const [theme, setTheme] = useState(
    () => (document.documentElement.classList.contains('light-mode') ? 'light' : 'dark')
  )

  const loadEnvironments = useCallback(async () => {
    setEnvLoading(true)
    try {
      const envs = await window.electronAPI.getEnvironments()
      setEnvironments(Array.isArray(envs) ? envs : [])
    } catch {
      setEnvironments([])
    } finally {
      setEnvLoading(false)
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
        await loadEnvironments()
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [loadEnvironments])

  useEffect(() => {
    loadData()
  }, [loadData])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

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
    loadEnvironments()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">DevEnv Inspector</h1>
        <span className="app-version">v0.3.0</span>
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
          />
        </section>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
