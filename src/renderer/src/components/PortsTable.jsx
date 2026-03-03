import { useState } from 'react'
import KillDialog from './KillDialog'

export default function PortsTable({ ports, loading, onKill }) {
  const [search, setSearch] = useState('')
  const [filterProtocol, setFilterProtocol] = useState('all')
  const [pendingPort, setPendingPort] = useState(null)
  const [killing, setKilling] = useState(null)

  const filtered = ports.filter((p) => {
    const matchesSearch =
      String(p.port).includes(search) ||
      p.process.toLowerCase().includes(search.toLowerCase()) ||
      String(p.pid).includes(search)
    const matchesProtocol = filterProtocol === 'all' || p.protocol === filterProtocol
    return matchesSearch && matchesProtocol
  })

  const handleKillClick = (port) => setPendingPort(port)

  const handleConfirm = async () => {
    const p = pendingPort
    setPendingPort(null)
    setKilling(p.pid)
    await onKill(p.pid)
    setKilling(null)
  }

  return (
    <div className="package-table-wrapper">
      <div className="table-controls">
        <input
          className="search-input"
          type="text"
          placeholder="Search port, process, or PID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {['all', 'TCP', 'UDP'].map((proto) => (
            <button
              key={proto}
              className={`filter-tab ${filterProtocol === proto ? 'active' : ''}`}
              onClick={() => setFilterProtocol(proto)}
            >
              {proto}
            </button>
          ))}
        </div>
        <span className="package-count">
          {filtered.length} port{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="table-placeholder">Scanning ports…</div>
      ) : filtered.length === 0 ? (
        <div className="table-placeholder">No active listening ports found.</div>
      ) : (
        <table className="package-table">
          <thead>
            <tr>
              <th>Port</th>
              <th>Protocol</th>
              <th>PID</th>
              <th>Process</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const key = `${p.protocol}/${p.port}/${p.pid}`
              const isBusy = killing === p.pid
              return (
                <tr key={key} className={isBusy ? 'row-busy' : ''}>
                  <td className="col-port mono">{p.port}</td>
                  <td className="col-protocol">
                    <span className={`protocol-badge protocol-${p.protocol.toLowerCase()}`}>
                      {p.protocol}
                    </span>
                  </td>
                  <td className="col-pid mono">{p.pid}</td>
                  <td className="col-process">{p.process}</td>
                  <td className="col-action">
                    <button
                      className="btn-kill-row"
                      onClick={() => handleKillClick(p)}
                      disabled={isBusy}
                      title={`Kill ${p.process} (PID ${p.pid})`}
                    >
                      {isBusy ? 'Killing…' : 'Kill'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {pendingPort && (
        <KillDialog
          port={pendingPort}
          onConfirm={handleConfirm}
          onCancel={() => setPendingPort(null)}
        />
      )}
    </div>
  )
}
