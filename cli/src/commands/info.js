import chalk from 'chalk'
import { detectRuntimes } from '../detectors.js'
import { getAllPackages } from '../parsers.js'

const RUNTIME_META = {
  python: { label: 'Python',  manager: 'pip',   packageLabel: 'pip packages' },
  conda:  { label: 'Conda',   manager: 'conda', packageLabel: 'conda packages' },
  node:   { label: 'Node.js', manager: null,    packageLabel: null },
  npm:    { label: 'npm',     manager: 'npm',   packageLabel: 'global npm packages' },
  yarn:   { label: 'Yarn',    manager: 'yarn',  packageLabel: 'global yarn packages' },
  pnpm:   { label: 'pnpm',    manager: 'pnpm',  packageLabel: 'global pnpm packages' }
}

export async function infoCommand(runtime) {
  const key = runtime.toLowerCase()
  const meta = RUNTIME_META[key]

  if (!meta) {
    console.error(chalk.red(`\n  Unknown runtime "${runtime}". Valid values: python, conda, node, npm, yarn, pnpm\n`))
    process.exit(1)
  }

  if (process.stdout.isTTY) process.stdout.write(`  Loading info for ${meta.label}...`)

  const runtimes = await detectRuntimes()

  if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(40) + '\r')

  const rt = runtimes[key]

  console.log(chalk.bold(`\n  ${meta.label}\n`))
  console.log(`  Status   ${rt?.installed ? chalk.green('Installed') : chalk.dim('Not Installed')}`)

  if (!rt?.installed) {
    console.log()
    return
  }

  console.log(`  Version  ${chalk.cyan(rt.version)}`)

  // Show package count if this runtime has packages
  if (meta.manager) {
    if (process.stdout.isTTY) process.stdout.write('  Counting packages...')
    const allPkgs = await getAllPackages(runtimes)
    if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(30) + '\r')

    const count = allPkgs.filter((p) => p.manager === meta.manager).length
    console.log(`  Packages ${chalk.yellow(count)} ${meta.packageLabel}`)
  }

  console.log()
}
