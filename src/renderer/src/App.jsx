import { useState, useEffect, useCallback } from 'react'
import RuntimeCard from './components/RuntimeCard'
import PackageTable from './components/PackageTable'
import PortsTable from './components/PortsTable'

export default function App() {
  const [runtimes, setRuntimes] = useState(null)
  const [packages, setPackages] = useState([])
  const [ports, setPorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('packages')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rt, pkgs, pts] = await Promise.all([
        window.electronAPI.getRuntimes(),
        window.electronAPI.getPackages(),
        window.electronAPI.getPorts()
      ])
      setRuntimes(rt)
      setPackages(pkgs)
      setPorts(pts)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
      // Refresh only packages (runtimes unchanged)
      const pkgs = await window.electronAPI.getPackages()
      setPackages(pkgs)
    } else {
      showToast(`Failed to remove "${name}": ${result.error}`, 'error')
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

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">DevEnv Inspector</h1>
        <span className="app-version">v0.2.0</span>
        <button
          className="btn-refresh"
          onClick={loadData}
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
          className={`section-tab ${activeTab === 'ports' ? 'active' : ''}`}
          onClick={() => setActiveTab('ports')}
        >
          Active Ports
          {!loading && ports.length > 0 && (
            <span className="tab-count">{ports.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'packages' && (
        <section className="packages-section">
          <PackageTable
            packages={packages}
            loading={loading}
            runtimes={runtimes}
            onUninstall={handleUninstall}
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

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
