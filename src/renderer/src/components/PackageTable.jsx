import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

export default function PackageTable({ packages, loading, onUninstall }) {
  const [search, setSearch] = useState('')
  const [filterManager, setFilterManager] = useState('all')
  const [pendingPkg, setPendingPkg] = useState(null)
  const [uninstalling, setUninstalling] = useState(null)

  const filtered = packages.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesManager = filterManager === 'all' || p.manager === filterManager
    return matchesSearch && matchesManager
  })

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
          {['all', 'pip', 'conda', 'npm', 'yarn', 'pnpm'].map((m) => (
            <button
              key={m}
              className={`filter-tab ${filterManager === m ? 'active' : ''}`}
              onClick={() => setFilterManager(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="package-count">
          {filtered.length} package{filtered.length !== 1 ? 's' : ''}
        </span>
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
              const isBusy = uninstalling === key
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
