import { runInShell } from '../shell.js'
import { registerRuntime } from '../registry.js'

registerRuntime({
  name: 'pyenv',
  label: 'pyenv',
  color: '#f7c65c',

  detect: async () => {
    try {
      return await runInShell('pyenv', ['--version'], { timeout: 10000 })
    } catch {
      return null
    }
  },

  parseVersion: (o) => o.trim().replace(/^pyenv\s+/i, ''),

  list: async () => {
    try {
      const stdout = await runInShell('pyenv', ['versions'], { timeout: 30000, allowNonZero: true })
      const statusByVersion = new Map()

      for (const raw of (stdout || '').split('\n')) {
        const trimmed = raw.trim()
        if (!trimmed) continue

        const isActive = /^\*/.test(trimmed)
        const normalized = trimmed.replace(/^\*\s*/, '').trim()
        const name = normalized.split(/\s+/)[0]

        if (!name || name.toLowerCase() === 'system') continue

        const existing = statusByVersion.get(name)
        if (!existing || isActive) {
          statusByVersion.set(name, isActive ? 'active' : 'installed')
        }
      }

      return Array.from(statusByVersion.entries()).map(([name, version]) => ({
        name,
        version,
        manager: 'pyenv'
      }))
    } catch {
      return []
    }
  },

  uninstall: null
})
