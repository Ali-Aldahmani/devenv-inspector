import { useEffect, useMemo, useRef, useState } from 'react'

function Row({ pkg, checked, onToggle }) {
  return (
    <label className="upgrade-all-row">
      <input
        type="checkbox"
        className="upgrade-all-checkbox"
        checked={checked}
        onChange={(e) => onToggle(pkg, e.target.checked)}
      />
      <span className="upgrade-all-name">{pkg.name}</span>
      <span className={`manager-badge manager-${pkg.manager}`}>{pkg.manager}</span>
      <span className="upgrade-all-version">
        <span className="upgrade-all-current">{pkg.current || '—'}</span>
        <span className="upgrade-all-arrow">→</span>
        <span className="upgrade-all-latest">{pkg.latest || 'latest'}</span>
      </span>
    </label>
  )
}

export default function UpgradeAllModal({
  open,
  initialOutdatedPackages = [],
  onClose,
  onRefreshPackages
}) {
  const [phase, setPhase] = useState('review') // review | upgrading | done
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [loadError, setLoadError] = useState('')
  const [selectedKeys, setSelectedKeys] = useState(new Set())
  const [logLines, setLogLines] = useState([])
  const [counts, setCounts] = useState({ upgraded: 0, failed: 0, skipped: 0 })
  const [progress, setProgress] = useState({ index: 0, total: 0 })
  const [errors, setErrors] = useState([])
  const [showErrors, setShowErrors] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const [allowCloseDone, setAllowCloseDone] = useState(false)
  const outputRef = useRef(null)

  const canClose = phase !== 'upgrading'

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (!canClose) return
      e.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, canClose, onClose])

  useEffect(() => {
    if (!open) return undefined
    const unsub = window.api.onUpgradeAllProgress((ev) => {
      if (!ev || typeof ev !== 'object') return
      if (ev.type === 'start') {
        setProgress({ index: 0, total: Number(ev.total) || 0 })
        setLogLines((prev) => [...prev, { text: `Starting upgrade of ${ev.total} packages...`, tone: 'muted' }])
        return
      }
      if (ev.type === 'upgrading') {
        setProgress({ index: Number(ev.index) || 0, total: Number(ev.total) || 0 })
        setLogLines((prev) => [
          ...prev,
          {
            text: `[ ${ev.index}/${ev.total} ] Upgrading ${ev.name} (${ev.manager})...`,
            tone: 'accent'
          }
        ])
        return
      }
      if (ev.type === 'success') {
        setLogLines((prev) => [...prev, { text: `  ✓ ${ev.name} upgraded successfully`, tone: 'success' }])
        return
      }
      if (ev.type === 'failed') {
        setLogLines((prev) => [...prev, { text: `  ✗ ${ev.name} failed: ${ev.error}`, tone: 'error' }])
        return
      }
      if (ev.type === 'skipped') {
        setLogLines((prev) => [...prev, { text: `  — ${ev.name} skipped (conda)`, tone: 'dim' }])
        return
      }
      if (ev.type === 'done') {
        setCounts({
          upgraded: Number(ev.upgraded) || 0,
          failed: Number(ev.failed) || 0,
          skipped: Number(ev.skipped) || 0
        })
      }
    })
    return () => unsub?.()
  }, [open])

  useEffect(() => {
    if (!open) return
    const seeded = Array.isArray(initialOutdatedPackages) ? initialOutdatedPackages : []
    const list = seeded.length > 0 ? seeded : null

    const load = async () => {
      setPhase('review')
      setAllowCloseDone(false)
      setShowErrors(false)
      setShowOutput(false)
      setLogLines([])
      setErrors([])
      setCounts({ upgraded: 0, failed: 0, skipped: 0 })
      setProgress({ index: 0, total: 0 })
      setLoadError('')
      setLoading(true)
      try {
        const outdated = list ?? (await window.electronAPI.getOutdated())
        const normalized = (Array.isArray(outdated) ? outdated : []).map((p) => ({
          name: String(p.name || ''),
          manager: String(p.manager || '').toLowerCase(),
          current: p.current || '',
          latest: p.latest || ''
        }))
        setRows(normalized)
        setSelectedKeys(new Set(normalized.map((p) => `${p.manager}/${p.name}`)))
      } catch {
        setRows([])
        setSelectedKeys(new Set())
        setLoadError('Failed to load outdated packages. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, initialOutdatedPackages])

  useEffect(() => {
    if (!outputRef.current) return
    outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [logLines, phase])

  const selectedPackages = useMemo(() => {
    return rows.filter((r) => selectedKeys.has(`${r.manager}/${r.name}`))
  }, [rows, selectedKeys])

  const hasConda = useMemo(() => rows.some((r) => r.manager === 'conda'), [rows])
  const selectableCount = selectedPackages.length

  const toggleSelection = (pkg, checked) => {
    const key = `${pkg.manager}/${pkg.name}`
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const selectAllToggle = () => {
    if (selectedKeys.size === rows.length) {
      setSelectedKeys(new Set())
      return
    }
    setSelectedKeys(new Set(rows.map((r) => `${r.manager}/${r.name}`)))
  }

  const runUpgrade = async () => {
    if (selectableCount < 1) return
    setPhase('upgrading')
    setLogLines([])
    setErrors([])
    setCounts({ upgraded: 0, failed: 0, skipped: 0 })
    setProgress({ index: 0, total: selectableCount })
    try {
      const result = await window.api.upgradeAll(selectedPackages)
      setCounts({
        upgraded: Number(result?.upgraded) || 0,
        failed: Number(result?.failed) || 0,
        skipped: Number(result?.skipped) || 0
      })
      setErrors(Array.isArray(result?.errors) ? result.errors : [])
    } catch {
      setErrors([{ name: 'bulk-upgrade', manager: 'system', error: 'Upgrade process failed to start.' }])
      setCounts({ upgraded: 0, failed: 1, skipped: 0 })
    } finally {
      setPhase('done')
      setTimeout(() => setAllowCloseDone(true), 500)
    }
  }

  if (!open) return null

  return (
    <div
      className="upgrade-all-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'all'
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        if (!canClose) return
        onClose()
      }}
    >
      <div
        className="upgrade-all-modal"
        style={{
          background: '#131417',
          border: '1px solid #252830',
          borderRadius: '12px',
          width: '520px',
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          zIndex: 100000,
          pointerEvents: 'all'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upgrade-all-header">
          <h2 className="upgrade-all-title">
            {phase === 'upgrading' ? 'Upgrading Packages...' : phase === 'done' ? 'Upgrade Complete' : 'Upgrade All Packages'}
          </h2>
          {phase === 'upgrading' ? <span className="upgrade-all-spinner">◌</span> : allowCloseDone || phase === 'review' ? (
            <button
              type="button"
              className="upgrade-all-close"
              style={{ position: 'relative', zIndex: 100001, pointerEvents: 'all', cursor: 'pointer' }}
              onClick={() => onClose()}
              aria-label="Close"
            >
              ×
            </button>
          ) : null}
        </div>

        {phase === 'review' && (
          <>
            {loading ? (
              <div className="upgrade-all-loading">Loading outdated packages...</div>
            ) : loadError ? (
              <div className="upgrade-all-error-state">{loadError}</div>
            ) : rows.length === 0 ? (
              <div className="upgrade-all-empty">✓ All packages are up to date</div>
            ) : (
              <>
                <div className="upgrade-all-summary">{rows.length} packages have updates available</div>
                <div className="upgrade-all-list">
                  {rows.map((pkg) => (
                    <Row
                      key={`${pkg.manager}/${pkg.name}`}
                      pkg={pkg}
                      checked={selectedKeys.has(`${pkg.manager}/${pkg.name}`)}
                      onToggle={toggleSelection}
                    />
                  ))}
                </div>
                {hasConda && (
                  <div className="upgrade-all-warning">⚠ conda packages are excluded from bulk upgrade</div>
                )}
              </>
            )}

            <div className="upgrade-all-footer">
              <button
                type="button"
                className="upgrade-all-link-btn"
                onClick={selectAllToggle}
                disabled={rows.length === 0}
              >
                {selectedKeys.size === rows.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="upgrade-all-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  style={{ position: 'relative', zIndex: 100001, pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={() => onClose()}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="upgrade-all-primary"
                  style={{ position: 'relative', zIndex: 100001, pointerEvents: 'all', cursor: 'pointer' }}
                  disabled={selectableCount === 0}
                  onClick={runUpgrade}
                >
                  Upgrade Selected ({selectableCount})
                </button>
              </div>
            </div>
          </>
        )}

        {phase === 'upgrading' && (
          <>
            <div className="upgrade-all-terminal" ref={outputRef}>
              {logLines.map((line, idx) => (
                <div key={idx} className={`upgrade-all-line tone-${line.tone}`}>
                  {line.text}
                </div>
              ))}
            </div>
            <div className="upgrade-all-progress-track">
              <div
                className="upgrade-all-progress-fill"
                style={{
                  width:
                    progress.total > 0
                      ? `${Math.min(100, Math.round((progress.index / progress.total) * 100))}%`
                      : '0%'
                }}
              />
            </div>
            <div className="upgrade-all-status">
              Upgrading {Math.min(progress.index, progress.total)} of {progress.total}...
            </div>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="upgrade-all-metrics">
              <div className="upgrade-metric metric-ok">✓ {counts.upgraded} Upgraded</div>
              <div className="upgrade-metric metric-fail">✗ {counts.failed} Failed</div>
              <div className="upgrade-metric metric-skip">— {counts.skipped} Skipped</div>
            </div>

            {errors.length > 0 && (
              <div className="upgrade-all-toggle-wrap">
                <button
                  type="button"
                  className="upgrade-all-toggle"
                  onClick={() => setShowErrors((v) => !v)}
                >
                  {showErrors ? '▾' : '▸'} Show failed packages ({errors.length})
                </button>
                {showErrors && (
                  <div className="upgrade-all-errors">
                    {errors.map((e, i) => (
                      <div key={`${e.manager}-${e.name}-${i}`} className="upgrade-all-error-line">
                        {e.name} ({e.manager}): {e.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="upgrade-all-toggle-wrap">
              <button
                type="button"
                className="upgrade-all-toggle"
                onClick={() => setShowOutput((v) => !v)}
              >
                {showOutput ? '▾' : '▸'} Show full output
              </button>
              {showOutput && (
                <div className="upgrade-all-terminal" ref={outputRef}>
                  {logLines.map((line, idx) => (
                    <div key={idx} className={`upgrade-all-line tone-${line.tone}`}>
                      {line.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="upgrade-all-footer">
              <span />
              <div className="upgrade-all-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  style={{ position: 'relative', zIndex: 100001, pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="upgrade-all-primary"
                  style={{ position: 'relative', zIndex: 100001, pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={() => {
                    onClose()
                    onRefreshPackages?.()
                  }}
                >
                  Refresh Packages
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
