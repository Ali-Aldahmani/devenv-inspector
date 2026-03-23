import { useMemo, useState } from 'react'

function formatRelativeTime(isoDate) {
  const then = new Date(isoDate).getTime()
  if (!Number.isFinite(then)) return 'unknown'
  const diff = Date.now() - then
  const sec = Math.floor(diff / 1000)
  if (sec < 10) return 'just now'
  if (sec < 60) return `${sec} seconds ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`
  const yr = Math.floor(mo / 12)
  return `${yr} year${yr === 1 ? '' : 's'} ago`
}

function normalizeType(type) {
  if (type === 'Python venv') return 'python venv'
  if (type === 'Conda env') return 'conda'
  if (type === 'Node modules') return 'node'
  if (type === 'Poetry env') return 'poetry'
  if (type === 'Pipenv') return 'pipenv'
  return 'all'
}

function typeClass(type) {
  if (type === 'Python venv') return 'env-type-python'
  if (type === 'Conda env') return 'env-type-conda'
  if (type === 'Node modules') return 'env-type-node'
  if (type === 'Poetry env') return 'env-type-poetry'
  if (type === 'Pipenv') return 'env-type-pipenv'
  return ''
}

export default function EnvironmentsTable({ environments, loading, onOpen }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = useMemo(() => {
    return (environments || []).filter((env) => {
      const q = search.toLowerCase()
      const matchesSearch =
        env.name.toLowerCase().includes(q) ||
        env.path.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || normalizeType(env.type) === typeFilter
      return matchesSearch && matchesType
    })
  }, [environments, search, typeFilter])

  return (
    <div className="package-table-wrapper">
      <div className="table-controls">
        <input
          className="search-input"
          type="text"
          placeholder="Search environments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {['all', 'python venv', 'conda', 'node', 'poetry', 'pipenv'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${typeFilter === f ? 'active' : ''}`}
              onClick={() => setTypeFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="package-count">
          {filtered.length} environment{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="table-placeholder">Scanning environments...</div>
      ) : filtered.length === 0 ? (
        <div className="table-placeholder">No environments found.</div>
      ) : (
        <table className="package-table env-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>PATH</th>
              <th>TYPE</th>
              <th>MANAGER</th>
              <th>LAST MODIFIED</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((env) => (
              <tr key={env.path}>
                <td className="env-name">{env.name}</td>
                <td className="env-path" title={env.path}>{env.path}</td>
                <td>
                  <span className={`manager-badge ${typeClass(env.type)}`}>{env.type}</span>
                </td>
                <td className="env-manager">{env.manager}</td>
                <td className="env-modified">{formatRelativeTime(env.modified)}</td>
                <td className="col-action">
                  <button className="btn-open-row" onClick={() => onOpen(env.path)}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
