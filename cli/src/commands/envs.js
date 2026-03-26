import chalk from 'chalk'
import Table from 'cli-table3'
import { access, readdir, stat } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import os from 'os'

function truncatePath(p, max = 40) {
  if (p.length <= max) return p
  return `...${p.slice(-max)}`
}

function relTime(dateMs) {
  const diff = Date.now() - dateMs
  const sec = Math.floor(diff / 1000)
  if (sec < 10) return 'just now'
  if (sec < 60) return `${sec} seconds ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}

async function exists(p) {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function detectEnvType(dir) {
  if (await exists(path.join(dir, '.venv', 'pyvenv.cfg'))) return 'Python venv'
  if (await exists(path.join(dir, 'venv', 'pyvenv.cfg'))) return 'Python venv'
  if (await exists(path.join(dir, 'environment.yml'))) return 'Conda'
  if (await exists(path.join(dir, 'node_modules', '.bin'))) return 'Node modules'
  if (await exists(path.join(dir, 'pyproject.toml'))) return 'Poetry'
  if (await exists(path.join(dir, 'Pipfile'))) return 'Pipenv'
  return null
}

async function scanDir(root, depth, maxDepth, out) {
  if (depth > maxDepth) return
  let entries = []
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const full = path.join(root, entry.name)
    const envType = await detectEnvType(full)
    if (envType) {
      const st = await stat(full).catch(() => null)
      out.push({
        name: path.basename(full),
        path: full,
        type: envType,
        modified: st?.mtimeMs || Date.now()
      })
    }
    await scanDir(full, depth + 1, maxDepth, out)
  }
}

export async function envsCommand(options) {
  const roots = []
  if (options.path) {
    roots.push(path.resolve(options.path))
  } else {
    const home = os.homedir()
    roots.push(path.join(home, 'Documents'), path.join(home, 'Desktop'), path.join(home, 'Projects'), path.join(home, 'dev'))
  }

  const existingRoots = []
  for (const root of roots) {
    if (await exists(root)) existingRoots.push(root)
  }

  console.log(chalk.bold('\n  DevEnv Inspector — Environments\n'))
  if (process.stdout.isTTY) process.stdout.write('  Scanning directories...')

  const found = []
  for (const root of existingRoots) {
    await scanDir(root, 0, 2, found)
  }

  if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(30) + '\r')

  if (found.length === 0) {
    console.log(chalk.dim('  No environments found.\n'))
    return
  }

  const table = new Table({
    head: [chalk.bold('NAME'), chalk.bold('PATH'), chalk.bold('TYPE'), chalk.bold('LAST MODIFIED')],
    style: { head: [], border: ['grey'] },
    colWidths: [22, 46, 18, 20]
  })

  for (const env of found) {
    table.push([env.name, chalk.dim(truncatePath(env.path)), env.type, relTime(env.modified)])
  }
  console.log(table.toString())
  console.log(chalk.dim(`  ${found.length} environment${found.length !== 1 ? 's' : ''}\n`))
}
