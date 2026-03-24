import { useMemo, useState } from 'react'

const TEMPLATE = `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name: 'my-runtime',
  label: 'My Runtime',
  color: '#888888',
  detect: () => runInShell('my-cmd', ['--version'], { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim(),
  list: null,
  uninstall: null
})
`

function categoryClass(category) {
  if (category === 'framework') return 'plugin-cat-framework'
  if (category === 'tools') return 'plugin-cat-tools'
  return 'plugin-cat-language'
}

export default function PluginsTab({
  installed,
  catalog,
  restartRequired,
  onRestartNow,
  onRefreshInstalled,
  onToggle,
  onDelete,
  onInstallCatalog,
  onOpenPluginsDir,
  onSaveCustom
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [filename, setFilename] = useState('')
  const [code, setCode] = useState(TEMPLATE)
  const [showCustom, setShowCustom] = useState(false)

  const installedNames = new Set((installed || []).map((p) => p.name))

  const filteredCatalog = useMemo(() => {
    const q = search.toLowerCase()
    return (catalog || []).filter((item) => {
      const matchesText =
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || item.category === category
      return matchesText && matchesCategory
    })
  }, [catalog, search, category])

  return (
    <section className="packages-section plugins-tab">
      {restartRequired && (
        <div className="plugin-restart-banner">
          <span>⚠ Restart required to activate plugin changes</span>
          <button className="btn-add-folder" onClick={onRestartNow}>Restart Now</button>
        </div>
      )}

      <div className="plugin-section">
        <div className="table-controls">
          <h3 className="plugin-heading">Installed Plugins</h3>
          <button className="btn-add-folder" onClick={onRefreshInstalled}>Refresh</button>
          <button className="btn-add-folder" onClick={onOpenPluginsDir}>Open plugins folder</button>
        </div>
        {installed.length === 0 ? (
          <div className="table-placeholder">No plugins installed yet - browse the catalog below.</div>
        ) : (
          <table className="package-table">
            <thead>
              <tr><th>NAME</th><th>STATUS</th><th>ACTION</th></tr>
            </thead>
            <tbody>
              {installed.map((p) => (
                <tr key={p.filename}>
                  <td className="col-name">
                    {p.label}
                    <div className="plugin-filename">{p.description || p.filename}</div>
                  </td>
                  <td>
                    {p.loadError ? (
                      <span className="plugin-status plugin-status-failed" title={p.loadError}>Load Failed</span>
                    ) : p.enabled ? (
                      <span className="plugin-status plugin-status-enabled">enabled</span>
                    ) : (
                      <span className="plugin-status plugin-status-disabled">disabled</span>
                    )}
                  </td>
                  <td className="col-action">
                    <button className="btn-add-folder" onClick={() => onToggle(p.filename, !p.enabled)}>
                      {p.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-delete-row" onClick={() => onDelete(p.filename)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="plugin-section">
        <div className="table-controls">
          <h3 className="plugin-heading">Plugin Catalog</h3>
          <input
            className="search-input"
            placeholder="Search plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-tabs">
            {['all', 'language', 'framework', 'tools'].map((c) => (
              <button
                key={c}
                className={`filter-tab ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="plugin-grid">
          {filteredCatalog.map((item) => {
            const isInstalled = installedNames.has(item.name)
            return (
              <div className="plugin-card" key={item.id}>
                <div className="plugin-icon">{item.icon}</div>
                <div className="plugin-label">{item.label}</div>
                <div className="plugin-desc">{item.description}</div>
                <span className={`manager-badge ${categoryClass(item.category)}`}>{item.category}</span>
                <button
                  className={`btn-add-folder ${isInstalled ? 'plugin-installed-btn' : ''}`}
                  disabled={isInstalled}
                  onClick={() => onInstallCatalog(item)}
                >
                  {isInstalled ? 'Installed ✓' : 'Install'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="plugin-section">
        <button className="btn-add-folder" onClick={() => setShowCustom((v) => !v)}>
          {showCustom ? 'Hide Custom Plugin' : 'Custom Plugin'}
        </button>
        {showCustom && (
          <div className="custom-plugin-box">
            <input
              className="search-input"
              placeholder="my-runtime.js"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
            <textarea
              className="custom-plugin-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn-add-folder" onClick={() => onSaveCustom(filename, code)}>
              Save Plugin
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
