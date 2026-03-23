import { useMemo } from 'react'

function formatTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export default function DiagnosticsPanel({ logs, loading, onRefresh, onClear, onCopy }) {
  const textBlob = useMemo(() => {
    return (logs || [])
      .map((l) => `[${l.timestamp}] ${l.source} :: ${l.message}${l.details ? `\n${l.details}` : ''}`)
      .join('\n\n')
  }, [logs])

  return (
    <section className="packages-section">
      <div className="table-controls">
        <span className="package-count">{logs.length} log{logs.length !== 1 ? 's' : ''}</span>
        <button className="btn-add-folder" onClick={onRefresh}>Refresh Logs</button>
        <button className="btn-add-folder" onClick={() => onCopy(textBlob)}>Copy Logs</button>
        <button className="btn-add-folder" onClick={onClear}>Clear Logs</button>
      </div>

      {loading ? (
        <div className="table-placeholder">Loading diagnostics...</div>
      ) : logs.length === 0 ? (
        <div className="table-placeholder">No diagnostics recorded.</div>
      ) : (
        <div className="diagnostics-list">
          {logs.map((log) => (
            <div key={log.id} className="diagnostic-item">
              <div className="diagnostic-head">
                <span className="diagnostic-source">{log.source}</span>
                <span className="diagnostic-time">{formatTime(log.timestamp)}</span>
              </div>
              <div className="diagnostic-message">{log.message}</div>
              {log.details && <pre className="diagnostic-details">{log.details}</pre>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
