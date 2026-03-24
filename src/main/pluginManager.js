import { app } from 'electron'
import path from 'path'
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { pathToFileURL } from 'url'
import { addDiagnostic } from './diagnostics.js'
import { getRegisteredRuntimes, registerRuntime } from './registry.js'
import { runInShell } from './shell.js'
const getDisabledFilePath = () => path.join(app.getPath('userData'), 'plugins-disabled.json')
const runtimeToFile = new Map()
const sessionDisabledRuntimeNames = new Set()
const loadErrors = new Map()
let disabledFilesCache = new Set()

function parsePluginMeta(content) {
  const nameMatch = content.match(/name\s*:\s*['"`]([^'"`]+)['"`]/)
  const labelMatch = content.match(/label\s*:\s*['"`]([^'"`]+)['"`]/)
  const descMatch = content.match(/description\s*:\s*['"`]([^'"`]+)['"`]/)
  return {
    name: nameMatch?.[1] || null,
    label: labelMatch?.[1] || null,
    description: descMatch?.[1] || ''
  }
}

async function readDisabledFiles() {
  try {
    const raw = await readFile(getDisabledFilePath(), 'utf8')
    const arr = JSON.parse(raw)
    disabledFilesCache = new Set(
      (Array.isArray(arr) ? arr : []).filter((x) => typeof x === 'string' && x.trim())
    )
  } catch {
    disabledFilesCache = new Set()
  }
  return [...disabledFilesCache]
}

async function writeDisabledFiles(list) {
  const clean = Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)))
  await writeFile(getDisabledFilePath(), JSON.stringify(clean, null, 2), 'utf8')
  disabledFilesCache = new Set(clean)
  return clean
}

export async function getPluginsDir() {
  const dir = path.join(app.getPath('userData'), 'plugins')
  await mkdir(dir, { recursive: true })
  return dir
}

function rewritePluginForRuntimeLoad(content) {
  const withoutImports = content
    .replace(/^\s*import\s+\{\s*registerRuntime\s*\}\s+from\s+['"`]\.\.\/registry\.js['"`]\s*;?\s*$/gm, '')
    .replace(/^\s*import\s+\{\s*runInShell\s*\}\s+from\s+['"`]\.\.\/shell\.js['"`]\s*;?\s*$/gm, '')

  return `
const registerRuntime = globalThis.__devenv_registerRuntime
const runInShell = globalThis.__devenv_runInShell
${withoutImports}
`
}

export async function loadUserPlugins() {
  const loaded = []
  const failed = []
  loadErrors.clear()

  const pluginsDir = await getPluginsDir()
  const disabled = new Set(await readDisabledFiles())
  const entries = await readdir(pluginsDir)
  const files = entries.filter((f) => f.endsWith('.js'))

  globalThis.__devenv_registerRuntime = (config) => {
    registerRuntime(config)
  }
  globalThis.__devenv_runInShell = runInShell

  for (const filename of files) {
    if (disabled.has(filename)) continue
    const fullPath = path.join(pluginsDir, filename)
    try {
      const source = await readFile(fullPath, 'utf8')
      const meta = parsePluginMeta(source)
      if (!meta.name) throw new Error('Missing runtime name in plugin')
      if (getRegisteredRuntimes().some((r) => r.name === meta.name)) {
        throw new Error(`Runtime name conflict: "${meta.name}"`)
      }

      const transformed = rewritePluginForRuntimeLoad(source)
      const tempPath = path.join(pluginsDir, `.load-${filename}.mjs`)
      await writeFile(tempPath, transformed, 'utf8')

      const beforeNames = new Set(getRegisteredRuntimes().map((r) => r.name))
      const moduleUrl = `${pathToFileURL(tempPath).href}?t=${Date.now()}`
      await import(moduleUrl)
      const after = getRegisteredRuntimes().filter((r) => !beforeNames.has(r.name))
      for (const rt of after) {
        runtimeToFile.set(rt.name, filename)
      }
      await rm(tempPath, { force: true })
      loaded.push(filename)
    } catch (err) {
      const message = err.message || String(err)
      loadErrors.set(filename, message)
      addDiagnostic({ source: `plugin load:${filename}`, message: 'Failed to load plugin', details: message })
      failed.push({ name: filename, error: message })
    }
  }

  delete globalThis.__devenv_registerRuntime
  delete globalThis.__devenv_runInShell

  return { loaded, failed }
}

export async function getInstalledPlugins() {
  const pluginsDir = await getPluginsDir()
  const disabled = new Set(await readDisabledFiles())
  const files = (await readdir(pluginsDir)).filter((f) => f.endsWith('.js'))

  const results = []
  for (const filename of files) {
    try {
      const content = await readFile(path.join(pluginsDir, filename), 'utf8')
      const meta = parsePluginMeta(content)
      const enabled = !disabled.has(filename) && !(meta.name && sessionDisabledRuntimeNames.has(meta.name))
      results.push({
        filename,
        name: meta.name || filename.replace(/\.js$/, ''),
        label: meta.label || meta.name || filename,
        description: meta.description || '',
        enabled,
        loadError: loadErrors.get(filename) || null
      })
    } catch (err) {
      results.push({
        filename,
        name: filename.replace(/\.js$/, ''),
        label: filename,
        description: '',
        enabled: !disabled.has(filename),
        loadError: err.message || String(err)
      })
    }
  }
  return results
}

export async function togglePlugin(filename, enabled) {
  const current = new Set(await readDisabledFiles())
  if (enabled) {
    current.delete(filename)
  } else {
    current.add(filename)
    const installed = await getInstalledPlugins()
    const plugin = installed.find((p) => p.filename === filename)
    if (plugin?.name) sessionDisabledRuntimeNames.add(plugin.name)
  }
  return writeDisabledFiles([...current])
}

export async function deletePlugin(filename) {
  const pluginsDir = await getPluginsDir()
  await rm(path.join(pluginsDir, filename), { force: true })
  const next = (await readDisabledFiles()).filter((f) => f !== filename)
  await writeDisabledFiles(next)
  for (const [runtimeName, file] of runtimeToFile.entries()) {
    if (file === filename) {
      runtimeToFile.delete(runtimeName)
      sessionDisabledRuntimeNames.delete(runtimeName)
    }
  }
  loadErrors.delete(filename)
  return { success: true }
}

export async function savePlugin(filename, content) {
  if (!filename?.endsWith('.js')) {
    return { success: false, error: 'Filename must end with .js' }
  }
  if (!String(content || '').includes('registerRuntime(')) {
    return { success: false, error: 'Plugin must contain registerRuntime(' }
  }
  const pluginsDir = await getPluginsDir()
  await writeFile(path.join(pluginsDir, filename), content, 'utf8')
  return { success: true }
}

export function isRuntimeEnabled(runtimeName) {
  const file = runtimeToFile.get(runtimeName)
  if (file && disabledFilesCache.has(file)) return false
  if (sessionDisabledRuntimeNames.has(runtimeName)) return false
  return true
}
