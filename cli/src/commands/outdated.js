import chalk from 'chalk'
import Table from 'cli-table3'
import { runInShell } from '../shell.js'
import { getRuntime } from '../registry.js'

const ANSI_RE = /\u001b\[[0-9;]*m/g
const RUNTIME_ALIAS = { pip: 'pip', python: 'pip', npm: 'npm', yarn: 'yarn', pnpm: 'pnpm' }
const SUPPORTED = ['pip', 'npm', 'yarn', 'pnpm']

function normalizeRuntime(value) {
  if (!value) return null
  return RUNTIME_ALIAS[String(value).toLowerCase()] || null
}

async function getPipOutdated() {
  try {
    const stdout = await runInShell('python3', ['-m', 'pip', 'list', '--outdated', '--format=json'], { timeout: 30000 })
    const data = JSON.parse(stdout)
    if (!Array.isArray(data)) return []
    return data.map((p) => ({
      name: p.name,
      current: p.version || 'unknown',
      latest: p.latest_version || 'unknown',
      manager: 'pip'
    }))
  } catch {
    return []
  }
}

async function getNpmOutdated() {
  try {
    const stdout = await runInShell('npm', ['outdated', '-g', '--json'], { timeout: 30000, allowNonZero: true })
    const data = JSON.parse(stdout || '{}')
    return Object.entries(data).map(([name, info]) => ({
      name,
      current: info?.current || 'unknown',
      latest: info?.latest || 'unknown',
      manager: 'npm'
    }))
  } catch {
    return []
  }
}

async function getYarnOutdated() {
  try {
    const stdout = await runInShell('yarn', ['global', 'outdated', '--json'], { timeout: 30000, allowNonZero: true })
    const lines = String(stdout || '').split('\n').map((s) => s.trim()).filter(Boolean)
    for (const line of lines) {
      try {
        const obj = JSON.parse(line)
        if (obj?.type !== 'table') continue
        const body = obj?.data?.body
        if (!Array.isArray(body)) return []
        return body.map((row) => ({
          name: row[0],
          current: row[1] || 'unknown',
          latest: row[3] || row[2] || 'unknown',
          manager: 'yarn'
        }))
      } catch {}
    }
    return []
  } catch {
    return []
  }
}

async function getPnpmOutdated() {
  try {
    const stdout = await runInShell('pnpm', ['outdated', '-g', '--format', 'json'], {
      timeout: 30000,
      allowNonZero: true
    })
    const cleaned = String(stdout || '').replace(ANSI_RE, '').trim()
    if (!cleaned) return []
    const data = JSON.parse(cleaned)
    if (!Array.isArray(data)) return []
    return data.map((p) => ({
      name: p.name,
      current: p.current || 'unknown',
      latest: p.latest || 'unknown',
      manager: 'pnpm'
    }))
  } catch {
    return []
  }
}

export async function fetchOutdatedPackages(filterRuntime = null) {
  const include = filterRuntime ? [filterRuntime] : SUPPORTED
  const out = []
  if (include.includes('pip')) out.push(...(await getPipOutdated()))
  if (include.includes('npm')) out.push(...(await getNpmOutdated()))
  if (include.includes('yarn')) out.push(...(await getYarnOutdated()))
  if (include.includes('pnpm')) out.push(...(await getPnpmOutdated()))
  return out
}

export async function outdatedCommand(options) {
  const filter = normalizeRuntime(options.runtime)
  if (options.runtime && !filter) {
    console.error(chalk.red(`\n  Unknown runtime "${options.runtime}". Valid values: ${SUPPORTED.join(', ')}\n`))
    process.exit(1)
  }

  if (filter) console.log(chalk.bold(`\n  DevEnv Inspector — Outdated Packages (${filter})\n`))
  else console.log(chalk.bold('\n  DevEnv Inspector — Outdated Packages\n'))

  if (process.stdout.isTTY) process.stdout.write('  Checking outdated packages...')
  const outdated = await fetchOutdatedPackages(filter)
  if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(40) + '\r')

  if (outdated.length === 0) {
    console.log(chalk.green('  ✓ All packages are up to date\n'))
    return
  }

  const table = new Table({
    head: [chalk.bold('NAME'), chalk.bold('CURRENT'), chalk.bold('LATEST'), chalk.bold('MANAGER')],
    style: { head: [], border: ['grey'] },
    colWidths: [34, 16, 16, 12]
  })

  for (const p of outdated) {
    const runtimeKey = p.manager === 'pip' ? 'python' : p.manager
    const color = getRuntime(runtimeKey)?.color ?? '#ffffff'
    table.push([p.name, chalk.dim(p.current), chalk.green(p.latest), chalk.hex(color)(p.manager)])
  }

  console.log(table.toString())
  console.log(chalk.dim(`  ${outdated.length} outdated package${outdated.length !== 1 ? 's' : ''}\n`))
}
