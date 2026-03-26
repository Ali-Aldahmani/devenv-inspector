import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SHORTCUT_ACTION_ORDER,
  SHORTCUT_LABELS,
  buildDefaultShortcutsClient,
  formatShortcut,
  eventKeyNormalized
} from '../shortcutFormat'

function comboFromEvent(e) {
  if (e.key === 'Escape') return '__cancel__'
  if (e.key === 'Backspace') return ''
  const parts = []
  if (e.metaKey) parts.push('meta')
  else if (e.ctrlKey) parts.push('ctrl')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')
  const k = eventKeyNormalized(e)
  if (['control', 'meta', 'shift', 'alt'].includes(k)) return null
  parts.push(k)
  return parts.join('+')
}

export default function ShortcutsSettingsSection({ settings, persist, isMac }) {
  const shortcuts = settings.shortcuts || {}
  const [recording, setRecording] = useState(null)

  const conflictFor = useMemo(() => {
    const map = new Map()
    for (const name of SHORTCUT_ACTION_ORDER) {
      const c = (shortcuts[name] || '').trim().toLowerCase()
      if (!c) continue
      if (!map.has(c)) map.set(c, [])
      map.get(c).push(name)
    }
    const out = {}
    for (const [combo, names] of map) {
      if (names.length > 1) {
        for (const n of names) {
          const other = names.find((x) => x !== n)
          if (other) out[n] = other
        }
      }
    }
    return out
  }, [shortcuts])

  useEffect(() => {
    if (!recording) return undefined

    const onKey = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const raw = comboFromEvent(e)
      if (raw === '__cancel__') {
        setRecording(null)
        return
      }
      if (raw === null) return
      void persist({ shortcuts: { ...shortcuts, [recording]: raw } })
      setRecording(null)
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [recording, persist, shortcuts])

  const handleReset = useCallback(async () => {
    await persist({ shortcuts: buildDefaultShortcutsClient() })
  }, [persist])

  return (
    <section className="settings-section" id="settings-section-shortcuts">
      <h3 className="settings-section-heading">SHORTCUTS</h3>
      <div className="settings-section-body">
        <div className="settings-shortcuts-desc">
          Customize keyboard shortcuts. Click a shortcut to remap it.
        </div>

        {SHORTCUT_ACTION_ORDER.map((actionKey) => {
          const label = SHORTCUT_LABELS[actionKey]
          const value = shortcuts[actionKey] ?? ''
          const isRecording = recording === actionKey
          const conflict = conflictFor[actionKey]

          return (
            <div className="setting-row setting-row-shortcut" key={actionKey}>
              <div className="setting-row-text">
                <div className="setting-label">{label}</div>
                {conflict && (
                  <div className="settings-shortcut-conflict">
                    ⚠ Already used by: {SHORTCUT_LABELS[conflict] || conflict}
                  </div>
                )}
              </div>
              <div className="setting-row-control">
                <button
                  type="button"
                  className={`settings-shortcut-badge ${isRecording ? 'recording' : ''}`}
                  onClick={() => setRecording(isRecording ? null : actionKey)}
                >
                  {isRecording ? 'Press keys…' : formatShortcut(value, isMac)}
                </button>
              </div>
            </div>
          )
        })}

        <button type="button" className="settings-reset-shortcuts-link" onClick={handleReset}>
          Reset shortcuts to defaults
        </button>
      </div>
    </section>
  )
}
