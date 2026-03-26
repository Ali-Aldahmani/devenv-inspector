import { useEffect } from 'react'
import { eventKeyNormalized } from '../shortcutFormat.js'

function isTypingContext(target) {
  if (!target) return false
  const el = target
  if (el.isContentEditable) return true
  const tag = el.tagName && el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return false
}

function hasDialogOverlay() {
  return Boolean(document.querySelector('.dialog-overlay'))
}

function hasCreateEnvOverlay() {
  return Boolean(document.querySelector('.create-env-overlay'))
}

function matchesCombo(e, comboStr) {
  if (!comboStr || typeof comboStr !== 'string') return false
  const trimmed = comboStr.trim().toLowerCase()
  if (!trimmed) return false

  const parts = trimmed.split('+').map((s) => s.trim())
  let needCtrl = false
  let needMeta = false
  let needShift = false
  let needAlt = false
  let key = ''

  for (const p of parts) {
    if (p === 'ctrl' || p === 'control') needCtrl = true
    else if (p === 'meta' || p === 'cmd') needMeta = true
    else if (p === 'shift') needShift = true
    else if (p === 'alt') needAlt = true
    else key = p
  }

  if (e.ctrlKey !== needCtrl) return false
  if (e.metaKey !== needMeta) return false
  if (e.shiftKey !== needShift) return false
  if (e.altKey !== needAlt) return false

  return eventKeyNormalized(e) === key
}

/**
 * @param {Record<string, string>} shortcuts
 * @param {Record<string, () => void>} handlers — same keys as shortcuts
 * @param {{ enabled?: boolean }} options
 */
export function useShortcuts(shortcuts, handlers, options = {}) {
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) return undefined

    const onKeyDown = (e) => {
      if (isTypingContext(e.target)) return
      if (e.repeat && eventKeyNormalized(e) !== 'escape') return

      const order = [
        'closeModal',
        'openShortcutsModal',
        'refresh',
        'focusSearch',
        'openSettings',
        'switchTab1',
        'switchTab2',
        'switchTab3',
        'switchTab4',
        'switchTab5',
        'switchTab6',
        'toggleTheme',
        'exportData'
      ]

      for (const name of order) {
        const combo = shortcuts?.[name]
        const fn = handlers?.[name]
        if (!combo || typeof fn !== 'function') continue
        if (!matchesCombo(e, combo)) continue

        if (name === 'closeModal') {
          if (hasDialogOverlay()) return
          if (hasCreateEnvOverlay()) return
          e.preventDefault()
          fn()
          return
        }

        e.preventDefault()
        fn()
        return
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shortcuts, handlers, enabled])
}

export { matchesCombo }
