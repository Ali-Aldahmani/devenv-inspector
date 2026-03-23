import { useEffect, useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

export default function PackageTable({
  packages,
  loading,
  runtimes,
  onUninstall,
  onUpgrade,
  onExportToast,
  onFilteredChange
}) {
  const [search, setSearch] = useState('')
  const [filterManager, setFilterManager] = useState('all')
  const [pendingPkg, setPendingPkg] = useState(null)
  const [uninstalling, setUninstalling] = useState(null)
  const [upgrading, setUpgrading] = useState(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportRef = useRef(null)
  const lastFilteredSignatureRef = useRef('')

  useEffect(() => {
    const onDocClick = (e) => {
      if (!exportRef.current?.contains(e.target)) setShowExportMenu(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const updatesCount = packages.filter((p) => p.hasUpdate).length
  const filtered = packages.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesManager =
      filterManager === 'all' ||
      (filterManager === 'updates' ? p.hasUpdate : p.manager === filterManager)
    return matchesSearch && matchesManager
  })

  useEffect(() => {
    const signature = filtered.map((p) => `${p.manager}/${p.name}@${p.version}`).join('|')
    if (signature === lastFilteredSignatureRef.current) return
    lastFilteredSignatureRef.current = signature
    onFilteredChange?.(filtered)
  }, [filtered, onFilteredChange])

  const handleDeleteClick = (pkg) => {
    setPendingPkg(pkg)
  }

  const handleConfirm = async () => {
    const pkg = pendingPkg
    setPendingPkg(null)
    setUninstalling(`${pkg.manager}/${pkg.name}`)
    await onUninstall(pkg.name, pkg.manager)
    setUninstalling(null)
  }

  const handleUpgradeClick = async (pkg) => {
    const ok = window.confirm(`Update "${pkg.name}" from ${pkg.version} to ${pkg.latest}?`)
    if (!ok) return
    const key = `${pkg.manager}/${pkg.name}`
    setUpgrading(key)
    await onUpgrade(pkg.name, pkg.manager)
    setUpgrading(null)
  }

  const handleExport = async (format) => {
    setShowExportMenu(false)
    const result = await window.electronAPI.exportPackages(format, filtered)
    if (result?.success && result?.path) {
      const filename = result.path.split(/[\\/]/).pop()
      onExportToast?.(`Saved to ${filename}`, 'success')
    } else {
      onExportToast?.('Export failed', 'error')
    }
  }

  return (
    <div className="package-table-wrapper">
      <div className="table-controls">
        <input
          className="search-input"
          type="text"
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {['all', 'updates', ...(runtimes
            ? Object.entries(runtimes)
                .filter(([, info]) => info.installed && info.hasPackages)
                .map(([key]) => key)
            : []
          )].map((m) => (
            <button
              key={m}
              className={`filter-tab filter-${m.toLowerCase()} ${filterManager === m ? 'active' : ''}`}
              onClick={() => setFilterManager(m)}
            >
              {m}
              {m === 'updates' && (
                <span className="updates-pill-count">{updatesCount}</span>
              )}
            </button>
          ))}
        </div>
        <span className="package-count">
          {filtered.length} package{filtered.length !== 1 ? 's' : ''}
        </span>
        <div className="export-dropdown" ref={exportRef}>
          <button className="btn-add-folder" onClick={() => setShowExportMenu((v) => !v)}>
            ↓ Export
          </button>
          {showExportMenu && (
            <div className="export-menu">
              <button className="export-item" onClick={() => handleExport('json')}>
                Export as JSON
              </button>
              <button className="export-item" onClick={() => handleExport('csv')}>
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="table-placeholder">Loading packages…</div>
      ) : filtered.length === 0 ? (
        <div className="table-placeholder">No packages found.</div>
      ) : (
        <table className="package-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Version</th>
              <th>Manager</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pkg) => {
              const key = `${pkg.manager}/${pkg.name}`
              const isBusy = uninstalling === key || upgrading === key
              return (
                <tr key={key} className={isBusy ? 'row-busy' : ''}>
                  <td className="col-name">{pkg.name}</td>
                  <td className="col-version mono">{pkg.version}</td>
                  <td className="col-manager">
                    <span className={`manager-badge manager-${pkg.manager}`}>
                      {pkg.manager}
                    </span>
                  </td>
                  <td className="col-action">
                    {pkg.hasUpdate && (
                      <button
                        className="update-badge"
                        onClick={() => handleUpgradeClick(pkg)}
                        disabled={isBusy}
                        title={`Update ${pkg.name} to ${pkg.latest}`}
                      >
                        {upgrading === key ? 'Updating…' : `↑ ${pkg.latest}`}
                      </button>
                    )}
                    <button
                      className="btn-delete-row"
                      onClick={() => handleDeleteClick(pkg)}
                      disabled={isBusy}
                      title={`Uninstall ${pkg.name}`}
                    >
                      {isBusy ? 'Removing…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {pendingPkg && (
        <ConfirmDialog
          pkg={pendingPkg}
          onConfirm={handleConfirm}
          onCancel={() => setPendingPkg(null)}
        />
      )}
    </div>
  )
}
