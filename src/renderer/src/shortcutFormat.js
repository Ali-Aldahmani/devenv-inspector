/** Default shortcut map — must stay in sync with settingsStore buildDefaultShortcuts */
export function buildDefaultShortcutsClient() {
  const mod = typeof window !== 'undefined' && window.api?.platform === 'darwin' ? 'meta' : 'ctrl'
  return {
    refresh: `${mod}+r`,
    focusSearch: `${mod}+f`,
    openSettings: `${mod}+,`,
    switchTab1: `${mod}+1`,
    switchTab2: `${mod}+2`,
    switchTab3: `${mod}+3`,
    switchTab4: `${mod}+4`,
    switchTab5: `${mod}+5`,
    switchTab6: `${mod}+6`,
    toggleTheme: `${mod}+shift+t`,
    exportData: `${mod}+e`,
    upgradeAllPackages: `${mod}+shift+u`,
    closeModal: 'escape'
  }
}

export function isMacClient() {
  return typeof window !== 'undefined' && window.api?.platform === 'darwin'
}

/** Normalize KeyboardEvent.key to shortcut token (lowercase). */
export function eventKeyNormalized(e) {
  const k = e.key
  if (k === 'Escape') return 'escape'
  if (k === 'Backspace') return 'backspace'
  if (k === 'Tab') return 'tab'
  if (k === ' ') return 'space'
  if (k === ',') return ','
  if (k === '.') return '.'
  if (k.length === 1) return k.toLowerCase()
  return k.toLowerCase()
}

/**
 * Display string for UI hints (toolbar, placeholders).
 * macOS: ⌘ instead of Ctrl/Meta text where applicable.
 */
export function formatShortcutHint(combo, isMac) {
  if (!combo || typeof combo !== 'string') return ''
  const c = combo.trim().toLowerCase()
  if (!c) return ''
  const parts = c.split('+').map((s) => s.trim())
  if (isMac) {
    const out = []
    for (const p of parts) {
      if (p === 'meta' || p === 'cmd') out.push('⌘')
      else if (p === 'ctrl' || p === 'control') out.push('⌃')
      else if (p === 'shift') out.push('⇧')
      else if (p === 'alt') out.push('⌥')
      else if (p === 'escape') out.push('Esc')
      else if (p === ',') out.push(',')
      else if (p.length === 1) out.push(p.toUpperCase())
      else out.push(p.charAt(0).toUpperCase() + p.slice(1))
    }
    return out.join('')
  }
  const out = []
  for (const p of parts) {
    if (p === 'meta' || p === 'cmd') out.push('Cmd')
    else if (p === 'ctrl' || p === 'control') out.push('Ctrl')
    else if (p === 'shift') out.push('Shift')
    else if (p === 'alt') out.push('Alt')
    else if (p === 'escape') out.push('Esc')
    else if (p === ',') out.push(',')
    else if (p.length === 1) out.push(p.toUpperCase())
    else out.push(p.charAt(0).toUpperCase() + p.slice(1))
  }
  return out.join('+')
}

/**
 * Rich label for settings badges (mac: ⌘⇧T style).
 */
export function formatShortcut(combo, isMac) {
  if (!combo || typeof combo !== 'string') return '—'
  const c = combo.trim().toLowerCase()
  if (!c) return '—'
  const parts = c.split('+').map((s) => s.trim())
  if (isMac) {
    let s = ''
    for (const p of parts) {
      if (p === 'meta' || p === 'cmd') s += '⌘'
      else if (p === 'ctrl' || p === 'control') s += '⌃'
      else if (p === 'shift') s += '⇧'
      else if (p === 'alt') s += '⌥'
      else if (p === 'escape') s += 'Esc'
      else if (p === ',') s += ','
      else if (p.length === 1) s += p.toUpperCase()
      else s += p.charAt(0).toUpperCase() + p.slice(1)
    }
    return s
  }
  return parts
    .map((p) => {
      if (p === 'meta' || p === 'cmd') return 'Cmd'
      if (p === 'ctrl' || p === 'control') return 'Ctrl'
      if (p === 'shift') return 'Shift'
      if (p === 'alt') return 'Alt'
      if (p === 'escape') return 'Esc'
      if (p === ',') return ','
      if (p.length === 1) return p.toUpperCase()
      return p.charAt(0).toUpperCase() + p.slice(1)
    })
    .join('+')
}

export const SHORTCUT_ACTION_ORDER = [
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
  'exportData',
  'upgradeAllPackages',
  'closeModal'
]

export const SHORTCUT_LABELS = {
  refresh: 'Refresh',
  focusSearch: 'Focus search',
  openSettings: 'Open settings',
  switchTab1: 'Switch to Packages',
  switchTab2: 'Switch to Environments',
  switchTab3: 'Switch to Active Ports',
  switchTab4: 'Switch to Diagnostics',
  switchTab5: 'Switch to Plugins',
  switchTab6: 'Switch to Settings',
  toggleTheme: 'Toggle theme',
  exportData: 'Export data',
  upgradeAllPackages: 'Upgrade all packages',
  closeModal: 'Close modal'
}
