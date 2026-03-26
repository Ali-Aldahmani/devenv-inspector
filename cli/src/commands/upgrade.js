import chalk from 'chalk'
import { spawn } from 'child_process'
import { fetchOutdatedPackages } from './outdated.js'

const PACKAGE_NAME_RE = /^[a-zA-Z0-9._\-@/]+$/
const RUNTIME_ALIAS = { pip: 'pip', python: 'pip', npm: 'npm', yarn: 'yarn', pnpm: 'pnpm' }
const SUPPORTED = ['pip', 'npm', 'yarn', 'pnpm']
const SHELL = process.env.SHELL || '/bin/zsh'
const isWin = process.platform === 'win32'

const UPGRADE_COMMANDS = {
  pip: (pkg) => `python3 -m pip install --upgrade ${pkg}`,
  npm: (pkg) => `npm update -g ${pkg}`,
  yarn: (pkg) => `yarn global upgrade ${pkg}`,
  pnpm: (pkg) => `pnpm update -g ${pkg}`
}

function normalizeRuntime(value) {
  if (!value) return null
  return RUNTIME_ALIAS[String(value).toLowerCase()] || null
}

async function confirm(message) {
  const { default: inquirer } = await import('inquirer')
  const { confirmed } = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message, default: false }])
  return confirmed
}

function runUpgradeStream(manager, pkg) {
  return new Promise((resolve) => {
    const cmdStr = UPGRADE_COMMANDS[manager](pkg)
    const child = spawn(isWin ? 'cmd.exe' : SHELL, isWin ? ['/c', cmdStr] : ['-i', '-l', '-c', cmdStr], {
      stdio: ['inherit', 'pipe', 'pipe']
    })
    let stderr = ''
    child.stdout.on('data', (d) => process.stdout.write(d))
    child.stderr.on('data', (d) => {
      stderr += String(d)
      process.stderr.write(d)
    })
    child.on('close', (code) => resolve({ ok: code === 0, error: stderr.trim() || `exit code ${code}` }))
  })
}

async function upgradeOne(pkg, manager) {
  if (!SUPPORTED.includes(manager)) {
    console.error(chalk.red(`\n  Unknown runtime "${manager}". Valid values: ${SUPPORTED.join(', ')}\n`))
    process.exit(1)
  }
  if (!PACKAGE_NAME_RE.test(pkg)) {
    console.error(chalk.red('\n  Invalid package name.\n'))
    process.exit(1)
  }
  const confirmed = await confirm(`Upgrade ${chalk.bold(pkg)} via ${chalk.bold(manager)}?`)
  if (!confirmed) {
    console.log(chalk.dim('\n  Cancelled.\n'))
    return
  }
  console.log(chalk.dim(`\n  Running ${manager} upgrade ${pkg}...`))
  const result = await runUpgradeStream(manager, pkg)
  if (result.ok) console.log(chalk.green(`\n  ✓ ${pkg} upgraded successfully.\n`))
  else {
    console.error(chalk.red(`\n  ✗ Upgrade failed: ${result.error}\n`))
    process.exit(1)
  }
}

async function upgradeAll() {
  const outdated = await fetchOutdatedPackages(null)
  if (outdated.length === 0) {
    console.log(chalk.green('\n  ✓ All packages are up to date\n'))
    return
  }

  const confirmed = await confirm(`Upgrade ${outdated.length} package${outdated.length !== 1 ? 's' : ''}?`)
  if (!confirmed) {
    console.log(chalk.dim('\n  Cancelled.\n'))
    return
  }

  console.log()
  let ok = 0
  let failed = 0
  for (let i = 0; i < outdated.length; i += 1) {
    const p = outdated[i]
    console.log(chalk.bold(`  [${i + 1}/${outdated.length}] Upgrading ${p.name} (${p.manager})...`))
    const result = await runUpgradeStream(p.manager, p.name)
    if (result.ok) {
      ok += 1
      console.log(chalk.green(`  ✓ ${p.name} upgraded to ${p.latest}`))
    } else {
      failed += 1
      console.log(chalk.red(`  ✗ ${p.name} failed: ${result.error}`))
    }
  }
  console.log(chalk.bold(`\n  ✓ ${ok} upgraded  ✗ ${failed} failed\n`))
}

export async function upgradeCommand(pkg, options) {
  if (options.all) {
    await upgradeAll()
    return
  }
  const manager = normalizeRuntime(options.runtime)
  if (!pkg) {
    console.error(chalk.red('\n  Missing package name. Usage: devenv upgrade <package> --runtime <mgr>\n'))
    process.exit(1)
  }
  if (!manager) {
    console.error(chalk.red(`\n  Missing or invalid --runtime. Valid values: ${SUPPORTED.join(', ')}\n`))
    process.exit(1)
  }
  await upgradeOne(pkg, manager)
}
