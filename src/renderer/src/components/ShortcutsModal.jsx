import { useEffect } from 'react'

function splitShortcutSegments(combo, isMac) {
  if (!combo || typeof combo !== 'string' || !combo.trim()) return null
  const parts = combo.trim().toLowerCase().split('+').map((s) => s.trim())
  const mapped = parts.map((p) => {
    if (isMac) {
      if (p === 'meta' || p === 'cmd') return '⌘'
      if (p === 'shift') return '⇧'
      if (p === 'alt') return '⌥'
      if (p === 'ctrl' || p === 'control') return '⌃'
    } else {
      if (p === 'meta' || p === 'cmd') return 'Cmd'
      if (p === 'shift') return 'Shift'
      if (p === 'alt') return 'Alt'
      if (p === 'ctrl' || p === 'control') return 'Ctrl'
    }
    if (p === 'escape') return 'Esc'
    if (p.length === 1) return p.toUpperCase()
    return p.charAt(0).toUpperCase() + p.slice(1)
  })
  return mapped
}

function ShortcutBadge({ combo, isMac }) {
  const parts = splitShortcutSegments(combo, isMac)
  if (!parts || parts.length === 0) return <span className="shortcuts-empty">—</span>
  return (
    <span className="shortcuts-badge-wrap">
      {parts.map((p, idx) => (
        <span key={`${p}-${idx}`} className="shortcuts-badge-part-wrap">
          <span className="shortcuts-badge-part">{p}</span>
          {idx < parts.length - 1 && <span className="shortcuts-badge-plus">+</span>}
        </span>
      ))}
    </span>
  )
}

function Group({ title, rows, shortcuts, isMac }) {
  return (
    <section className="shortcuts-group">
      <h3 className="shortcuts-group-title">{title}</h3>
      <div className="shortcuts-group-divider" />
      {rows.map((r, idx) => (
        <div
          key={r.action}
          className={`shortcuts-row ${idx === rows.length - 1 ? 'shortcuts-row-last' : ''}`}
        >
          <span className="shortcuts-action-label">{r.label}</span>
          <ShortcutBadge combo={shortcuts?.[r.action] ?? r.fallback} isMac={isMac} />
        </div>
      ))}
    </section>
  )
}

export default function ShortcutsModal({
  open,
  shortcuts,
  onClose,
  onOpenSettingsShortcuts,
  isMac
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null

  const toolsShortcut = isMac ? 'meta+/' : 'ctrl+/'

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <h2 className="shortcuts-modal-title">Keyboard Shortcuts</h2>
          <button type="button" className="shortcuts-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <Group
          title="GENERAL"
          shortcuts={shortcuts}
          isMac={isMac}
          rows={[
            { action: 'refresh', label: 'Refresh' },
            { action: 'openSettings', label: 'Open Settings' },
            { action: 'toggleTheme', label: 'Toggle Theme' },
            { action: 'closeModal', label: 'Close Modal' }
          ]}
        />

        <Group
          title="NAVIGATION"
          shortcuts={shortcuts}
          isMac={isMac}
          rows={[
            { action: 'focusSearch', label: 'Focus Search' },
            { action: 'switchTab1', label: 'Packages tab' },
            { action: 'switchTab2', label: 'Environments tab' },
            { action: 'switchTab3', label: 'Active Ports tab' },
            { action: 'switchTab4', label: 'Diagnostics tab' },
            { action: 'switchTab5', label: 'Plugins tab' }
          ]}
        />

        <Group
          title="DATA"
          shortcuts={shortcuts}
          isMac={isMac}
          rows={[
            { action: 'exportData', label: 'Export Data' },
            { action: 'upgradeAllPackages', label: 'Upgrade All Packages' },
            { action: '__tools', label: 'Keyboard Shortcuts', fallback: toolsShortcut }
          ]}
        />

        <div className="shortcuts-modal-footer">
          <span>Shortcuts can be remapped in </span>
          <button type="button" className="shortcuts-modal-link" onClick={onOpenSettingsShortcuts}>
            Settings → Shortcuts
          </button>
        </div>
      </div>
    </div>
  )
}
