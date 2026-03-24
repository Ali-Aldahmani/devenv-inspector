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

function buildGeneratedCode(form) {
  const cmd = (form.detectCommand || '').trim()
  const versionFlag = (form.versionFlag || '').trim()
  const regex = (form.regex || '[\\d.]+').trim()
  const listExpr = (form.listCmd || '').trim()
    ? 'async () => { /* TODO: parse list output */ }'
    : 'null'
  const uninstallExpr = (form.uninstallCmd || '').trim()
    ? `(pkg) => ['${form.uninstallCmd.trim()}', [pkg]]`
    : 'null'
  const detectArgs = versionFlag ? `['${versionFlag.replace(/'/g, "\\'")}']` : '[]'

  return `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name:         '${form.name}',
  label:        '${form.label}',
  color:        '${form.color}',
  detect:       () => runInShell('${cmd.replace(/'/g, "\\'")}', ${detectArgs}, { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => { const m = o.match(/${regex}/); return m ? m[0] : o.trim() },
  list:         ${listExpr},
  uninstall:    ${uninstallExpr}
})
`
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Runtime Name is required.'
  else if (!/^[a-z0-9-]+$/.test(form.name.trim())) errors.name = 'Use lowercase letters, numbers, hyphens only.'
  if (!form.label.trim()) errors.label = 'Display Label is required.'
  if (!form.detectCommand.trim()) errors.detectCommand = 'Detect Command is required.'
  return errors
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
  const [filename, setFilename] = useState('my-runtime.js')
  const [form, setForm] = useState({
    name: '',
    label: '',
    color: '#888888',
    category: 'language',
    detectCommand: '',
    versionFlag: '--version',
    regex: '[\\d.]+',
    listCmd: '',
    uninstallCmd: '',
    icon: ''
  })
  const [generatedCode, setGeneratedCode] = useState('')
  const [code, setCode] = useState(TEMPLATE)
  const [showCustom, setShowCustom] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)

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

  const errors = validate(form)
  const canGenerate = Object.keys(errors).length === 0

  const updateField = (key, value) => {
    const next = { ...form, [key]: value }
    if (key === 'name') {
      setFilename(value ? `${value}.js` : 'my-runtime.js')
    }
    setForm(next)
  }

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
            <div className="plugin-form-grid">
              <label className="plugin-form-label">Runtime Name <span className="required">*</span></label>
              <input className="search-input" placeholder="java" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              {errors.name && <div className="plugin-form-error">{errors.name}</div>}

              <label className="plugin-form-label">Display Label <span className="required">*</span></label>
              <input className="search-input" placeholder="Java" value={form.label} onChange={(e) => updateField('label', e.target.value)} />
              {errors.label && <div className="plugin-form-error">{errors.label}</div>}

              <label className="plugin-form-label">Badge Color</label>
              <input className="plugin-color-input" type="color" value={form.color} onChange={(e) => updateField('color', e.target.value)} />

              <label className="plugin-form-label">Category</label>
              <select className="create-env-select" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                <option value="language">language</option>
                <option value="framework">framework</option>
                <option value="tools">tools</option>
                <option value="other">other</option>
              </select>

              <label className="plugin-form-label">Detect Command <span className="required">*</span></label>
              <input className="search-input" placeholder="java -version" value={form.detectCommand} onChange={(e) => updateField('detectCommand', e.target.value)} />
              {errors.detectCommand && <div className="plugin-form-error">{errors.detectCommand}</div>}

              <label className="plugin-form-label">Version flag</label>
              <input className="search-input" placeholder="--version" value={form.versionFlag} onChange={(e) => updateField('versionFlag', e.target.value)} />

              <label className="plugin-form-label">Regex to extract version from output</label>
              <input className="search-input" placeholder="[\\d.]+" value={form.regex} onChange={(e) => updateField('regex', e.target.value)} />

              <label className="plugin-form-label">List packages cmd</label>
              <input className="search-input" placeholder="leave empty if not supported" value={form.listCmd} onChange={(e) => updateField('listCmd', e.target.value)} />

              <label className="plugin-form-label">Uninstall cmd</label>
              <input className="search-input" placeholder="leave empty if not supported" value={form.uninstallCmd} onChange={(e) => updateField('uninstallCmd', e.target.value)} />

              <label className="plugin-form-label">Icon / Emoji</label>
              <input className="search-input" maxLength={2} placeholder="☕" value={form.icon} onChange={(e) => updateField('icon', e.target.value)} />

              <label className="plugin-form-label">Filename</label>
              <input className="search-input" placeholder="my-runtime.js" value={filename} onChange={(e) => setFilename(e.target.value)} />
            </div>

            <div className="create-env-actions">
              <button
                className="btn-add-folder"
                disabled={!canGenerate}
                onClick={() => {
                  const next = buildGeneratedCode(form)
                  setGeneratedCode(next)
                  setCode(next)
                }}
              >
                Generate & Preview
              </button>
              <button className="btn-add-folder" onClick={() => setAdvancedMode((v) => !v)}>
                {advancedMode ? 'Hide Advanced' : 'Advanced mode'}
              </button>
            </div>

            {generatedCode && (
              <>
                <div className="plugin-form-label">Preview</div>
                <pre className="plugin-preview-box">{generatedCode}</pre>
                <button className="btn-add-folder" onClick={() => onSaveCustom(filename, generatedCode)}>
                  Save Plugin
                </button>
              </>
            )}

            {advancedMode && (
              <>
                <div className="plugin-form-label">Raw Editor</div>
                <textarea
                  className="custom-plugin-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button className="btn-add-folder" onClick={() => onSaveCustom(filename, code)}>
                  Save Plugin (Advanced)
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
