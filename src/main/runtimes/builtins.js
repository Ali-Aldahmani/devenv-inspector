/**
 * Built-in runtime plugins.
 *
 * Each call to registerRuntime() adds one entry to the registry.
 * To add a NEW manager (e.g. Bun), create a new file alongside this one
 * and import it in src/main/index.js — no other files need to change.
 */

import { runInShell } from '../shell.js'
import { registerRuntime } from '../registry.js'

async function tryCommand(cmd, args) {
  try {
    return await runInShell(cmd, args, { timeout: 10000 })
  } catch {
    return null
  }
}

// ── Python / pip ──────────────────────────────────────────────────────────────
registerRuntime({
  name:  'python',
  label: 'Python',
  color: '#4b9eff',

  detect: () =>
    tryCommand('python3', ['--version']).then((o) => o || tryCommand('python', ['--version'])),

  parseVersion: (o) => o.trim().replace(/^Python\s+/i, ''),

  list: async () => {
    try {
      const stdout = await runInShell(
        'python3', ['-m', 'pip', 'list', '--format=json'],
        { timeout: 30000 }
      )
      const data = JSON.parse(stdout)
      if (!Array.isArray(data)) return []
      return data.map((p) => ({ name: p.name, version: p.version }))
    } catch (err) {
      console.error('[builtins] pip list failed:', err.message)
      return []
    }
  },

  outdated: async () => {
    try {
      const stdout = await runInShell(
        'python3', ['-m', 'pip', 'list', '--outdated', '--format=json'],
        { timeout: 30000, allowNonZero: true }
      )
      const data = JSON.parse(stdout || '[]')
      if (!Array.isArray(data)) return []
      return data.map((p) => ({
        name: p.name,
        current: p.version,
        latest: p.latest_version
      }))
    } catch (err) {
      console.error('[builtins] pip outdated failed:', err.message)
      return []
    }
  },

  uninstall: (pkg) => ['python3', ['-m', 'pip', 'uninstall', pkg, '-y']]
})

// ── Conda ─────────────────────────────────────────────────────────────────────
registerRuntime({
  name:  'conda',
  label: 'Conda',
  color: '#44c98b',

  detect: () => tryCommand('conda', ['--version']),

  parseVersion: (o) => o.trim().replace(/^conda\s+/i, ''),

  list: async () => {
    try {
      const stdout = await runInShell('conda', ['list', '--json'], { timeout: 30000 })
      const data = JSON.parse(stdout)
      if (!Array.isArray(data)) return []
      return data.map((p) => ({ name: p.name, version: p.version }))
    } catch (err) {
      console.error('[builtins] conda list failed:', err.message)
      return []
    }
  },

  outdated: null,

  uninstall: (pkg) => ['conda', ['remove', pkg, '-y']]
})

// ── Node.js ───────────────────────────────────────────────────────────────────
// Node is detected as a runtime but packages are managed via npm / yarn / pnpm.
registerRuntime({
  name:  'node',
  label: 'Node.js',
  color: '#339933',

  detect: () => tryCommand('node', ['--version']),

  parseVersion: (o) => o.trim().replace(/^v/, ''),

  list:      null,
  outdated:  null,
  uninstall: null
})

// ── npm ───────────────────────────────────────────────────────────────────────
registerRuntime({
  name:  'npm',
  label: 'npm',
  color: '#e05454',

  detect: () => tryCommand('npm', ['--version']),

  parseVersion: (o) => o.trim(),

  list: async () => {
    try {
      const stdout = await runInShell(
        'npm', ['list', '-g', '--depth=0', '--json'],
        { timeout: 30000, allowNonZero: true }
      )
      const data = JSON.parse(stdout)
      const deps = data.dependencies || {}
      return Object.entries(deps).map(([name, info]) => ({
        name,
        version: info.version || 'unknown'
      }))
    } catch (err) {
      console.error('[builtins] npm list failed:', err.message)
      return []
    }
  },

  outdated: async () => {
    try {
      const stdout = await runInShell('npm', ['outdated', '-g', '--json'], { timeout: 30000 })
      const data = JSON.parse(stdout || '{}')
      return Object.entries(data).map(([name, info]) => ({
        name,
        current: info.current || 'unknown',
        latest: info.latest || info.wanted || 'unknown'
      }))
    } catch (err) {
      const hasStderr = Boolean((err.stderr || '').trim())
      if (hasStderr) {
        console.error('[builtins] npm outdated failed:', err.stderr || err.message)
        return []
      }

      try {
        const data = JSON.parse(err.stdout || '{}')
        return Object.entries(data).map(([name, info]) => ({
          name,
          current: info.current || 'unknown',
          latest: info.latest || info.wanted || 'unknown'
        }))
      } catch {
        return []
      }
    }
  },

  uninstall: (pkg) => ['npm', ['uninstall', '-g', pkg]]
})

// ── Yarn ──────────────────────────────────────────────────────────────────────
registerRuntime({
  name:  'yarn',
  label: 'Yarn',
  color: '#2c8ebb',

  detect: () => tryCommand('yarn', ['--version']),

  parseVersion: (o) => o.trim().replace(/^yarn\s+v?/i, ''),

  list: async () => {
    try {
      const stdout = await runInShell(
        'yarn', ['global', 'list', '--json'],
        { timeout: 30000, allowNonZero: true }
      )
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        try {
          const obj = JSON.parse(line)
          if (obj.type === 'tree' && Array.isArray(obj.data?.trees)) {
            return obj.data.trees.map((t) => {
              const lastAt  = t.name.lastIndexOf('@')
              const name    = lastAt > 0 ? t.name.slice(0, lastAt) : t.name
              const version = lastAt > 0 ? t.name.slice(lastAt + 1) : 'unknown'
              return { name, version }
            })
          }
        } catch {}
      }
      return []
    } catch (err) {
      console.error('[builtins] yarn list failed:', err.message)
      return []
    }
  },

  outdated: async () => {
    try {
      const stdout = await runInShell(
        'yarn', ['global', 'outdated', '--json'],
        { timeout: 30000, allowNonZero: true }
      )
      const lines = (stdout || '').trim().split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const obj = JSON.parse(line)
          if (obj.type === 'table' && Array.isArray(obj.data?.body)) {
            return obj.data.body.map((row) => ({
              name: row[0],
              current: row[1] || 'unknown',
              latest: row[3] || row[2] || 'unknown'
            }))
          }
        } catch {}
      }
      return []
    } catch (err) {
      console.error('[builtins] yarn outdated failed:', err.message)
      return []
    }
  },

  uninstall: (pkg) => ['yarn', ['global', 'remove', pkg]]
})

// ── pnpm ──────────────────────────────────────────────────────────────────────
registerRuntime({
  name:  'pnpm',
  label: 'pnpm',
  color: '#f69220',

  detect: () => tryCommand('pnpm', ['--version']),

  parseVersion: (o) => o.trim(),

  list: async () => {
    try {
      const stdout = await runInShell(
        'pnpm', ['list', '-g', '--json'],
        { timeout: 30000, allowNonZero: true }
      )
      const data = JSON.parse(stdout)
      const deps = (Array.isArray(data) ? data[0] : data)?.dependencies || {}
      return Object.entries(deps).map(([name, info]) => ({
        name,
        version: info.version || 'unknown'
      }))
    } catch (err) {
      console.error('[builtins] pnpm list failed:', err.message)
      return []
    }
  },

  outdated: async () => {
    const parseOutdated = (output) => {
      const clean = String(output || '')
        .replace(/\x1B\[[0-9;]*[mGKHF]/g, '')
        .trim()
      const firstArray = clean.indexOf('[')
      const firstObject = clean.indexOf('{')
      const jsonStart =
        firstArray !== -1 && (firstObject === -1 || firstArray < firstObject)
          ? firstArray
          : firstObject
      if (jsonStart === -1) return []

      const jsonStr = clean.slice(jsonStart)
      try {
        const data = JSON.parse(jsonStr)
        const arr = Array.isArray(data) ? data : [data]
        return arr.map((p) => ({
          name: p.packageName || p.name,
          current: p.current || 'unknown',
          latest: p.latest || 'unknown'
        }))
      } catch {
        return []
      }
    }

    try {
      const stdout = await runInShell(
        'pnpm', ['outdated', '-g', '--format', 'json'],
        { timeout: 30000 }
      )
      return parseOutdated(stdout)
    } catch (err) {
      if ((err.stdout || '').trim()) {
        return parseOutdated(err.stdout)
      }
      console.error('[builtins] pnpm outdated failed:', err.message)
      return []
    }
  },

  uninstall: (pkg) => ['pnpm', ['remove', '-g', pkg]]
})
