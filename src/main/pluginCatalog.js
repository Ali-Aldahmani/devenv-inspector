function makeSimplePluginCode({ name, label, color, detectCmd, detectArgs, parseRegex, listBody = 'return null', uninstallBody = 'return null' }) {
  return `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name: '${name}',
  label: '${label}',
  color: '${color}',
  detect: () => runInShell('${detectCmd}', ${JSON.stringify(detectArgs)}, { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim().replace(${parseRegex}, ''),
  list: async () => { ${listBody} },
  uninstall: (pkg) => { ${uninstallBody} },
  outdated: null
})
`
}

export const pluginCatalog = [
  {
    id: 'java',
    name: 'java',
    label: 'Java',
    description: 'Java runtime detection',
    category: 'language',
    detectCmd: 'java -version',
    icon: '☕',
    pluginCode: makeSimplePluginCode({
      name: 'java',
      label: 'Java',
      color: '#f89820',
      detectCmd: 'java',
      detectArgs: ['-version'],
      parseRegex: '/^.*?(\d+\\.\\d+(?:\\.\\d+)?).*$/s',
      listBody: 'return null',
      uninstallBody: 'return null'
    })
  },
  {
    id: 'kotlin',
    name: 'kotlin',
    label: 'Kotlin',
    description: 'Kotlin runtime detection',
    category: 'language',
    detectCmd: 'kotlin -version',
    icon: '🟣',
    pluginCode: makeSimplePluginCode({
      name: 'kotlin',
      label: 'Kotlin',
      color: '#7f52ff',
      detectCmd: 'kotlin',
      detectArgs: ['-version'],
      parseRegex: '/^.*?([0-9]+\\.[0-9]+(?:\\.[0-9]+)?).*$/s'
    })
  },
  {
    id: 'rust',
    name: 'rust',
    label: 'Rust',
    description: 'Rust compiler and cargo installs',
    category: 'language',
    detectCmd: 'rustc --version',
    icon: '🦀',
    pluginCode: `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name: 'rust',
  label: 'Rust',
  color: '#ce422b',
  detect: () => runInShell('rustc', ['--version'], { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim().replace(/^rustc\\s+/i, ''),
  list: async () => {
    try {
      const out = await runInShell('cargo', ['install', '--list'], { timeout: 30000, allowNonZero: true })
      const lines = out.split(/\\r?\\n/)
      return lines.filter((l) => l.includes(' v')).map((l) => {
        const m = l.match(/^([^\\s]+)\\sv([^:]+)/)
        return m ? { name: m[1], version: m[2] } : null
      }).filter(Boolean)
    } catch {
      return []
    }
  },
  uninstall: (pkg) => ['cargo', ['uninstall', pkg]],
  outdated: null
})
`
  },
  {
    id: 'go',
    name: 'go',
    label: 'Go',
    description: 'Go runtime detection',
    category: 'language',
    detectCmd: 'go version',
    icon: '🐹',
    pluginCode: makeSimplePluginCode({
      name: 'go',
      label: 'Go',
      color: '#00add8',
      detectCmd: 'go',
      detectArgs: ['version'],
      parseRegex: '/^go\\sversion\\s+/i'
    })
  },
  {
    id: 'ruby',
    name: 'ruby',
    label: 'Ruby',
    description: 'Ruby gems management',
    category: 'language',
    detectCmd: 'ruby --version',
    icon: '💎',
    pluginCode: `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name: 'ruby',
  label: 'Ruby',
  color: '#cc342d',
  detect: () => runInShell('ruby', ['--version'], { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim(),
  list: async () => {
    try {
      const out = await runInShell('gem', ['list', '--local'], { timeout: 30000 })
      return out.split(/\\r?\\n/).map((line) => {
        const m = line.match(/^([^\\s]+)\\s\\(([^)]+)\\)/)
        if (!m) return null
        return { name: m[1], version: m[2].split(',')[0].trim() }
      }).filter(Boolean)
    } catch {
      return []
    }
  },
  uninstall: (pkg) => ['gem', ['uninstall', pkg]],
  outdated: null
})
`
  },
  {
    id: 'php-composer',
    name: 'composer',
    label: 'PHP Composer',
    description: 'Composer global package manager',
    category: 'tools',
    detectCmd: 'composer --version',
    icon: '🐘',
    pluginCode: `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name: 'composer',
  label: 'Composer',
  color: '#8a6d3b',
  detect: () => runInShell('composer', ['--version'], { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim().replace(/^Composer\\sversion\\s+/i, ''),
  list: async () => {
    try {
      const out = await runInShell('composer', ['global', 'show', '--format=json'], { timeout: 30000, allowNonZero: true })
      const data = JSON.parse(out || '{}')
      return (data.installed || []).map((p) => ({ name: p.name, version: p.version || 'unknown' }))
    } catch {
      return []
    }
  },
  uninstall: (pkg) => ['composer', ['global', 'remove', pkg]],
  outdated: null
})
`
  },
  {
    id: 'dotnet',
    name: 'dotnet',
    label: '.NET',
    description: 'Global dotnet tools',
    category: 'tools',
    detectCmd: 'dotnet --version',
    icon: '🔷',
    pluginCode: `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name: 'dotnet',
  label: '.NET',
  color: '#512bd4',
  detect: () => runInShell('dotnet', ['--version'], { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim(),
  list: async () => {
    try {
      const out = await runInShell('dotnet', ['tool', 'list', '-g'], { timeout: 30000, allowNonZero: true })
      const lines = out.split(/\\r?\\n/).slice(2).filter(Boolean)
      return lines.map((line) => {
        const parts = line.trim().split(/\\s+/)
        return { name: parts[0], version: parts[1] || 'unknown' }
      })
    } catch {
      return []
    }
  },
  uninstall: (pkg) => ['dotnet', ['tool', 'uninstall', '-g', pkg]],
  outdated: null
})
`
  },
  {
    id: 'bun',
    name: 'bun',
    label: 'Bun',
    description: 'Bun runtime and global packages',
    category: 'tools',
    detectCmd: 'bun --version',
    icon: '🥟',
    pluginCode: `import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name: 'bun',
  label: 'Bun',
  color: '#f7b93e',
  detect: () => runInShell('bun', ['--version'], { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim(),
  list: async () => {
    try {
      const out = await runInShell('bun', ['pm', 'ls', '-g'], { timeout: 30000, allowNonZero: true })
      return out.split(/\\r?\\n/).map((line) => {
        const m = line.match(/^([^@\\s]+)@(.+)$/)
        return m ? { name: m[1], version: m[2] } : null
      }).filter(Boolean)
    } catch {
      return []
    }
  },
  uninstall: (pkg) => ['bun', ['remove', '-g', pkg]],
  outdated: null
})
`
  },
  {
    id: 'deno',
    name: 'deno',
    label: 'Deno',
    description: 'Deno runtime detection',
    category: 'language',
    detectCmd: 'deno --version',
    icon: '🦕',
    pluginCode: makeSimplePluginCode({
      name: 'deno',
      label: 'Deno',
      color: '#111111',
      detectCmd: 'deno',
      detectArgs: ['--version'],
      parseRegex: '/\\r?\\n.*$/s'
    })
  },
  {
    id: 'swift',
    name: 'swift',
    label: 'Swift',
    description: 'Swift runtime detection',
    category: 'language',
    detectCmd: 'swift --version',
    icon: '🧡',
    pluginCode: makeSimplePluginCode({
      name: 'swift',
      label: 'Swift',
      color: '#f05138',
      detectCmd: 'swift',
      detectArgs: ['--version'],
      parseRegex: '/\\r?\\n.*$/s'
    })
  }
]
