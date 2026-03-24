/** Apply theme preference to document and localStorage (devenv-theme). */
export function applyThemePreference(theme) {
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('light-mode', !isDark)
  } else {
    document.documentElement.classList.toggle('light-mode', theme === 'light')
  }
  localStorage.setItem('devenv-theme', theme)
}

export function getEffectiveLight(theme, systemIsDark) {
  if (theme === 'light') return true
  if (theme === 'dark') return false
  return !systemIsDark
}

export function applyInitialTheme() {
  const raw = localStorage.getItem('devenv-theme') ?? 'system'
  const theme = ['dark', 'light', 'system'].includes(raw) ? raw : 'system'
  applyThemePreference(theme)
}
