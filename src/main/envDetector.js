import os from 'os'
import path from 'path'
import { readdir, stat } from 'fs/promises'
import { addDiagnostic } from './diagnostics.js'

const TYPE_PRIORITY = {
  'Poetry env': 5,
  Pipenv: 4,
  'Python venv': 3,
  'Conda env': 2,
  'Node modules': 1
}

/** Directory names never scanned (basename match). *.egg-info matches suffix. */
const ALWAYS_EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '__pycache__',
  '.cache',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'out',
  'coverage',
  '.tox',
  '.eggs'
])

function isAlwaysExcludedDirName(name) {
  if (ALWAYS_EXCLUDED_DIR_NAMES.has(name)) return true
  if (name.endsWith('.egg-info')) return true
  return false
}

function normalizePathKey(p) {
  return path.normalize(String(p).trim())
}

/** True if absPath is exactly `ex` or a subdirectory of `ex`. */
function isPathUnderExcludedPrefix(absPath, excludedFolders) {
  const n = normalizePathKey(absPath)
  const lower = process.platform === 'win32' ? n.toLowerCase() : n
  for (const ex of excludedFolders) {
    if (!ex) continue
    const exn = normalizePathKey(ex)
    const exCmp = process.platform === 'win32' ? exn.toLowerCase() : exn
    if (lower === exCmp) return true
    const sep = path.sep
    const prefix = exCmp.endsWith(sep) ? exCmp : exCmp + sep
    if (lower.startsWith(prefix)) return true
  }
  return false
}

async function safeStat(targetPath) {
  try {
    return await stat(targetPath)
  } catch {
    return null
  }
}

async function existsFile(targetPath) {
  const s = await safeStat(targetPath)
  return Boolean(s?.isFile())
}

async function existsDir(targetPath) {
  const s = await safeStat(targetPath)
  return Boolean(s?.isDirectory())
}

async function listDirectoriesFiltered(parentPath, excludedFolders) {
  try {
    const entries = await readdir(parentPath, { withFileTypes: true })
    const dirs = []
    for (const e of entries) {
      if (!e.isDirectory()) continue
      if (isAlwaysExcludedDirName(e.name)) continue
      const childPath = path.join(parentPath, e.name)
      if (isPathUnderExcludedPrefix(childPath, excludedFolders)) continue
      dirs.push(childPath)
    }
    return dirs
  } catch {
    addDiagnostic({
      source: 'environment scan',
      message: 'Environment scanning failed',
      details: 'Unexpected scanner error'
    })
    return []
  }
}

async function detectType(projectPath) {
  try {
    const [hasPyproject, hasPoetryLock] = await Promise.all([
      existsFile(path.join(projectPath, 'pyproject.toml')),
      existsFile(path.join(projectPath, 'poetry.lock'))
    ])
    if (hasPyproject && hasPoetryLock) {
      return { type: 'Poetry env', manager: 'poetry' }
    }

    const [hasPipfile, hasPipfileLock] = await Promise.all([
      existsFile(path.join(projectPath, 'Pipfile')),
      existsFile(path.join(projectPath, 'Pipfile.lock'))
    ])
    if (hasPipfile && hasPipfileLock) {
      return { type: 'Pipenv', manager: 'pipenv' }
    }

    const venvMarkers = ['.venv', 'venv', 'env', '.env']
    for (const marker of venvMarkers) {
      if (await existsFile(path.join(projectPath, marker, 'pyvenv.cfg'))) {
        return { type: 'Python venv', manager: 'pip' }
      }
    }

    const [hasEnvironmentYaml, hasCondaMeta] = await Promise.all([
      existsFile(path.join(projectPath, 'environment.yml')),
      existsDir(path.join(projectPath, 'conda-meta'))
    ])
    if (hasEnvironmentYaml || hasCondaMeta) {
      return { type: 'Conda env', manager: 'conda' }
    }

    const [hasNodeBin, hasPackageJson] = await Promise.all([
      existsDir(path.join(projectPath, 'node_modules', '.bin')),
      existsFile(path.join(projectPath, 'package.json'))
    ])
    if (hasNodeBin && hasPackageJson) {
      return { type: 'Node modules', manager: 'npm/yarn/pnpm' }
    }
  } catch {
    // Skip unreadable projects silently.
  }

  return null
}

function getDefaultRoots() {
  const home = os.homedir()
  const roots = ['Desktop', 'Documents', 'Downloads', 'Projects', 'Developer', 'dev', 'code'].map((p) =>
    path.join(home, p)
  )

  if (process.platform === 'win32') {
    roots.push(
      path.join(home, 'Documents'),
      path.join(home, 'Desktop'),
      path.join(home, 'Projects'),
      'D:\\Projects',
      'D:\\dev'
    )
  }

  return roots
}

/**
 * @param {string[]} paths - extra scan roots from user
 * @param {1|2|3} scanDepth - 1: one level under each root; 2: two levels; 3: three levels
 * @param {string[]} excludedFolders - absolute paths to skip entirely
 */
export async function detectEnvs(paths = [], scanDepth = 2, excludedFolders = []) {
  try {
    const depth = [1, 2, 3].includes(scanDepth) ? scanDepth : 2
    const excluded = Array.isArray(excludedFolders)
      ? Array.from(
          new Set(
            excludedFolders.filter((p) => typeof p === 'string' && p.trim()).map((p) => p.trim())
          )
        )
      : []

    const mergedRoots = Array.from(
      new Set([
        ...getDefaultRoots(),
        ...((Array.isArray(paths) ? paths : []).filter((p) => typeof p === 'string' && p.trim()))
      ])
    )

    const candidates = new Set()

    for (const root of mergedRoots) {
      if (!(await existsDir(root))) continue
      if (isPathUnderExcludedPrefix(root, excluded)) continue

      const level1 = await listDirectoriesFiltered(root, excluded)
      for (const dir of level1) {
        candidates.add(dir)
      }

      if (depth >= 2) {
        for (const dir of level1) {
          if (isPathUnderExcludedPrefix(dir, excluded)) continue
          const level2 = await listDirectoriesFiltered(dir, excluded)
          for (const nested of level2) {
            candidates.add(nested)
          }

          if (depth >= 3) {
            for (const nested of level2) {
              if (isPathUnderExcludedPrefix(nested, excluded)) continue
              const level3 = await listDirectoriesFiltered(nested, excluded)
              for (const deep of level3) {
                candidates.add(deep)
              }
            }
          }
        }
      }
    }

    const byPath = new Map()
    for (const projectPath of candidates) {
      try {
        if (isPathUnderExcludedPrefix(projectPath, excluded)) continue

        const detected = await detectType(projectPath)
        if (!detected) continue

        const s = await safeStat(projectPath)
        const modified = s?.mtime ? s.mtime.toISOString() : new Date(0).toISOString()
        const next = {
          name: path.basename(projectPath),
          path: projectPath,
          type: detected.type,
          manager: detected.manager,
          modified
        }

        const prev = byPath.get(projectPath)
        if (!prev || TYPE_PRIORITY[next.type] > TYPE_PRIORITY[prev.type]) {
          byPath.set(projectPath, next)
        }
      } catch {
        // Skip unreadable directories silently.
      }
    }

    return Array.from(byPath.values()).sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    )
  } catch {
    return []
  }
}
