import { useEffect, useMemo, useRef, useState } from 'react'

export default function RuntimeUpdateModal({
  open,
  runtime,
  label,
  currentVersion,
  latestVersion,
  onClose,
  onRestart,
  onRefreshLatest
}) {
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const outputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const unsub = window.api.onRuntimeUpdateProgress((data) => {
      if (!data || data.runtime !== runtime) return
      setLogs((prev) => [...prev, String(data.line || '')])
    })
    return () => unsub?.()
  }, [open, runtime])

  useEffect(() => {
    if (!open) return
    setRunning(false)
    setLogs([])
    setResult(null)
  }, [open, runtime])

  useEffect(() => {
    if (!outputRef.current) return
    outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [logs])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (running) return
      e.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, running, onClose])

  const canDirectUpdate = useMemo(
    () => ['npm', 'yarn', 'pnpm', 'conda', 'node'].includes(runtime),
    [runtime]
  )

  const runUpdate = async () => {
    if (!canDirectUpdate || running) return
    setRunning(true)
    setLogs([])
    setResult(null)
    try {
      const r = await window.api.updateRuntime(runtime)
      setResult(r)
      if (r?.success) {
        setLogs((prev) => [...prev, '✓ Updated successfully — restart app to see new version'])
        onRefreshLatest?.()
      }
    } catch {
      setResult({ success: false, error: 'Update failed.' })
    } finally {
      setRunning(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="runtime-update-overlay"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        if (running) return
        onClose()
      }}
    >
      <div className="runtime-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="runtime-update-header">
          <h2 className="runtime-update-title">Update {label}</h2>
          {!running && (
            <button type="button" className="runtime-update-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>

        <div className="runtime-update-versions">
          <span>Current: v{currentVersion || '—'}</span>
          <span className="runtime-update-arrow">→</span>
          <span>Latest: v{latestVersion || '—'}</span>
        </div>

        {runtime === 'node' && result?.manual ? (
          <div className="runtime-update-manual">
            <p>
              Node.js is best updated via your system package manager or the official installer.
            </p>
            <button
              type="button"
              className="upgrade-all-primary"
              onClick={() => window.api.openExternalUrl('https://nodejs.org/en/download')}
            >
              Download Node.js
            </button>
          </div>
        ) : (
          <>
            <div className="runtime-update-terminal" ref={outputRef}>
              {logs.length === 0 ? (
                <div className="upgrade-all-line tone-muted">No output yet.</div>
              ) : (
                logs.map((line, i) => (
                  <div key={`${line}-${i}`} className="upgrade-all-line tone-muted">
                    {line}
                  </div>
                ))
              )}
            </div>

            {result?.success ? (
              <div className="runtime-update-success">
                <button type="button" className="upgrade-all-primary" onClick={onRestart}>
                  Restart
                </button>
              </div>
            ) : (
              <div className="runtime-update-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={running}>
                  Cancel
                </button>
                <button type="button" className="upgrade-all-primary" onClick={runUpdate} disabled={running}>
                  {running ? 'Updating…' : 'Update'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

