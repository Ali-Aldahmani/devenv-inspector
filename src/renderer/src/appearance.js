const LS_ACCENT = 'devenv-accent'
const LS_FONT = 'devenv-font-size'
const LS_COMPACT = 'devenv-compact'

const DEFAULT_ACCENT = '#4a9eda'

export function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim())
  if (!m) return { r: 74, g: 158, b: 218 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Normalize to #rrggbb or null if invalid. */
export function normalizeHex(hex) {
  if (typeof hex !== 'string') return null
  const s = hex.trim()
  const m = /^#([a-f\d]{6})$/i.exec(s)
  return m ? `#${m[1].toLowerCase()}` : null
}

export function applyAccentColor(hex) {
  const valid = normalizeHex(hex) || DEFAULT_ACCENT
  const root = document.documentElement
  root.style.setProperty('--accent', valid)
  root.style.setProperty('--accent-bg', hexToRgba(valid, 0.13))
  root.style.setProperty('--accent-border', hexToRgba(valid, 0.33))
  try {
    localStorage.setItem(LS_ACCENT, valid)
  } catch {
    /* ignore */
  }
}

export function applyFontSize(size) {
  const root = document.documentElement
  root.classList.remove('font-small', 'font-large')
  if (size === 'small') root.classList.add('font-small')
  else if (size === 'large') root.classList.add('font-large')
  try {
    localStorage.setItem(LS_FONT, size === 'small' || size === 'large' ? size : 'medium')
  } catch {
    /* ignore */
  }
}

export function applyCompactMode(enabled) {
  document.documentElement.classList.toggle('compact-mode', Boolean(enabled))
  try {
    localStorage.setItem(LS_COMPACT, enabled ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

export function applyAppearanceFromSettings(s) {
  if (!s || typeof s !== 'object') return
  if (s.accentColor) applyAccentColor(s.accentColor)
  if (['small', 'medium', 'large'].includes(s.fontSize)) applyFontSize(s.fontSize)
  else applyFontSize('medium')
  applyCompactMode(Boolean(s.compactMode))
}

/** Cold launch: localStorage mirror, then defaults. */
export function applyInitialAppearance() {
  try {
    const accent = localStorage.getItem(LS_ACCENT) || DEFAULT_ACCENT
    applyAccentColor(accent)
  } catch {
    applyAccentColor(DEFAULT_ACCENT)
  }
  try {
    const font = localStorage.getItem(LS_FONT) || 'medium'
    applyFontSize(['small', 'large'].includes(font) ? font : 'medium')
  } catch {
    applyFontSize('medium')
  }
  try {
    applyCompactMode(localStorage.getItem(LS_COMPACT) === 'true')
  } catch {
    applyCompactMode(false)
  }
}
