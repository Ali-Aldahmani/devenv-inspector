import chalk from 'chalk'
import Table from 'cli-table3'
import { detectRuntimes } from '../detectors.js'
import { getAllPackages } from '../parsers.js'

const VALID_RUNTIMES = ['pip', 'conda', 'npm', 'yarn', 'pnpm']

const MANAGER_COLORS = {
  pip:   (s) => chalk.hex('#5a7af5')(s),
  conda: (s) => chalk.hex('#44c98b')(s),
  npm:   (s) => chalk.hex('#e05454')(s),
  yarn:  (s) => chalk.hex('#2c8ebb')(s),
  pnpm:  (s) => chalk.hex('#f69220')(s)
}

export async function packagesCommand(options) {
  const filter = options.runtime?.toLowerCase()

  if (filter && !VALID_RUNTIMES.includes(filter)) {
    console.error(chalk.red(`\n  Unknown runtime "${filter}". Valid values: pip, conda, npm, yarn, pnpm\n`))
    process.exit(1)
  }

  if (filter) {
    console.log(chalk.bold(`\n  DevEnv Inspector — Packages (${filter})\n`))
  } else {
    console.log(chalk.bold('\n  DevEnv Inspector — All Packages\n'))
  }

  if (process.stdout.isTTY) process.stdout.write('  Loading packages...')

  const runtimes = await detectRuntimes()
  let packages = await getAllPackages(runtimes)

  if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(30) + '\r')

  if (filter) {
    packages = packages.filter((p) => p.manager === filter)
  }

  if (packages.length === 0) {
    console.log(chalk.dim('  No packages found.\n'))
    return
  }

  const table = new Table({
    head: [
      chalk.bold('Name'),
      chalk.bold('Version'),
      chalk.bold('Manager')
    ],
    style: { head: [], border: ['grey'] },
    colWidths: [36, 18, 10]
  })

  for (const pkg of packages) {
    const colorFn = MANAGER_COLORS[pkg.manager] || ((s) => s)
    table.push([
      pkg.name,
      chalk.dim(pkg.version),
      colorFn(pkg.manager)
    ])
  }

  console.log(table.toString())
  console.log(chalk.dim(`  ${packages.length} package${packages.length !== 1 ? 's' : ''}\n`))
}
