import { runInShell } from '../shell.js'
import { registerRuntime } from '../registry.js'

const ANSI_REGEX = /\x1B\[[0-?]*[ -/]*[@-~]/g

function stripAnsi(text) {
  return text.replace(ANSI_REGEX, '')
}

registerRuntime({
  name: 'nvm',
  label: 'nvm',
  color: '#7aa2f7',

  detect: async () => {
    try {
      return await runInShell('nvm', ['--version'], { timeout: 10000 })
    } catch {
      return null
    }
  },

  parseVersion: (o) => o.trim().replace(/^v/i, ''),

  list: async () => {
    try {
      const stdout = await runInShell('nvm', ['list'], { timeout: 30000, allowNonZero: true })
      const clean = stripAnsi(stdout || '')
      const statusByVersion = new Map()

      for (const raw of clean.split('\n')) {
        const line = raw.trim()
        if (!line || /N\/A/i.test(line)) continue
        if (/^(default|node|iojs|unstable|stable|lts\/)/i.test(line)) continue
        if (line === 'system' || /^->\s*system$/i.test(line)) continue

        const versionMatch = line.match(/\bv?\d+\.\d+\.\d+\b/)
        if (!versionMatch) continue

        const name = versionMatch[0].startsWith('v') ? versionMatch[0] : `v${versionMatch[0]}`
        const isActive = line.startsWith('->') || /\bcurrent\b/i.test(line)
        const existing = statusByVersion.get(name)

        if (!existing || isActive) {
          statusByVersion.set(name, isActive ? 'active' : 'installed')
        }
      }

      return Array.from(statusByVersion.entries()).map(([name, version]) => ({
        name,
        version,
        manager: 'nvm'
      }))
    } catch {
      return []
    }
  },

  uninstall: null
})
