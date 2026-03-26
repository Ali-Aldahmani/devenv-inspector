import { runInShell } from './shell.js'

function normalizeVersion(v) {
  return String(v || '').trim().replace(/^v/i, '')
}

function parseVersionParts(v) {
  return normalizeVersion(v)
    .split(/[.-]/)
    .map((p) => Number.parseInt(p, 10))
    .map((n) => (Number.isFinite(n) ? n : 0))
}

function compareVersions(a, b) {
  const aa = parseVersionParts(a)
  const bb = parseVersionParts(b)
  const len = Math.max(aa.length, bb.length)
  for (let i = 0; i < len; i += 1) {
    const av = aa[i] ?? 0
    const bv = bb[i] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

function parseCondaLatest(jsonText) {
  try {
    const data = JSON.parse(jsonText)
    const rows = Array.isArray(data?.conda) ? data.conda : []
    if (rows.length === 0) return null
    const versions = rows.map((r) => normalizeVersion(r?.version)).filter(Boolean)
    if (versions.length === 0) return null
    return versions.sort((a, b) => compareVersions(a, b)).at(-1) || null
  } catch {
    return null
  }
}

export async function getLatestVersions() {
  const checks = {
    npm: () => runInShell('npm', ['view', 'npm', 'version'], { timeout: 20000 }),
    yarn: () => runInShell('npm', ['view', 'yarn', 'version'], { timeout: 20000 }),
    pnpm: () => runInShell('npm', ['view', 'pnpm', 'version'], { timeout: 20000 }),
    node: () =>
      runInShell(
        'node',
        [
          '-e',
          "require('https').get('https://nodejs.org/dist/index.json',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{const lts=JSON.parse(d).find(v=>v.lts);console.log((lts?.version||'').replace('v',''))})})"
        ],
        { timeout: 25000 }
      ),
    conda: () => runInShell('conda', ['search', 'conda', '--json'], { timeout: 25000 })
  }

  const keys = Object.keys(checks)
  const settled = await Promise.allSettled(keys.map((k) => checks[k]()))
  const out = { npm: null, yarn: null, pnpm: null, node: null, conda: null }

  keys.forEach((key, idx) => {
    const result = settled[idx]
    if (result.status !== 'fulfilled') {
      out[key] = null
      return
    }
    const raw = String(result.value || '').trim()
    if (!raw) {
      out[key] = null
      return
    }
    if (key === 'conda') {
      out.conda = parseCondaLatest(raw)
      return
    }
    out[key] = normalizeVersion(raw.split(/\r?\n/).at(-1))
  })

  return out
}

async function execWithProgress(runtime, cmd, args, onProgress) {
  onProgress({ runtime, line: `$ ${cmd} ${args.join(' ')}` })
  const out = await runInShell(cmd, args, { timeout: 60000, allowNonZero: true })
  String(out || '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .forEach((line) => onProgress({ runtime, line }))
  return out
}

export async function updateRuntime(runtime, onProgress = () => {}) {
  try {
    if (runtime === 'npm') {
      const output = await execWithProgress('npm', 'npm', ['install', '-g', 'npm@latest'], onProgress)
      return { success: true, output }
    }
    if (runtime === 'yarn') {
      const output = await execWithProgress('yarn', 'npm', ['install', '-g', 'yarn@latest'], onProgress)
      return { success: true, output }
    }
    if (runtime === 'pnpm') {
      const first = await execWithProgress('pnpm', 'pnpm', ['self-update'], onProgress)
      if (String(first).toLowerCase().includes('error')) {
        const fallback = await execWithProgress('pnpm', 'npm', ['install', '-g', 'pnpm@latest'], onProgress)
        return { success: true, output: `${first}\n${fallback}` }
      }
      return { success: true, output: first }
    }
    if (runtime === 'conda') {
      const output = await execWithProgress(
        'conda',
        'conda',
        ['update', '-n', 'base', 'conda', '-y'],
        onProgress
      )
      return { success: true, output }
    }
    if (runtime === 'node') {
      const nvmCheck = await runInShell('nvm', ['--version'], { timeout: 10000, allowNonZero: true })
      if (!String(nvmCheck || '').trim()) {
        return { success: false, manual: true, url: 'https://nodejs.org/en/download' }
      }
      const out1 = await execWithProgress('node', 'nvm', ['install', '--lts'], onProgress)
      const out2 = await execWithProgress('node', 'nvm', ['use', '--lts'], onProgress)
      return { success: true, output: `${out1}\n${out2}` }
    }
    return { success: false, error: 'Unsupported runtime.' }
  } catch (err) {
    return { success: false, error: err?.stderr || err?.message || 'Unknown error' }
  }
}

