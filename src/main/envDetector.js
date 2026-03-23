import os from 'os'
import path from 'path'
import { readdir, stat } from 'fs/promises'

const TYPE_PRIORITY = {
  'Poetry env': 5,
  Pipenv: 4,
  'Python venv': 3,
  'Conda env': 2,
  'Node modules': 1
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

async function listDirectories(parentPath) {
  try {
    const entries = await readdir(parentPath, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => path.join(parentPath, e.name))
  } catch {
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

export async function detectEnvs() {
  try {
    const home = os.homedir()
    const roots = [
      'Desktop',
      'Documents',
      'Downloads',
      'Projects',
      'Developer',
      'dev',
      'code'
    ].map((p) => path.join(home, p))

    const candidates = new Set()
    for (const root of roots) {
      if (!(await existsDir(root))) continue
      const levelOne = await listDirectories(root)
      for (const dir of levelOne) {
        candidates.add(dir)
      }
      for (const dir of levelOne) {
        const levelTwo = await listDirectories(dir)
        for (const nested of levelTwo) {
          candidates.add(nested)
        }
      }
    }

    const byPath = new Map()
    for (const projectPath of candidates) {
      try {
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
