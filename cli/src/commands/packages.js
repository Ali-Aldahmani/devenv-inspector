import chalk from 'chalk'
import Table from 'cli-table3'
import { detectRuntimes } from '../detectors.js'
import { getAllPackages } from '../parsers.js'
import { getRegisteredRuntimes, getRuntime } from '../registry.js'

export async function packagesCommand(options) {
  const filter = options.runtime?.toLowerCase()

  const validRuntimes = getRegisteredRuntimes().filter((rt) => rt.list).map((rt) => rt.name)

  if (filter && !validRuntimes.includes(filter)) {
    console.error(chalk.red(`\n  Unknown runtime "${filter}". Valid values: ${validRuntimes.join(', ')}\n`))
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
    const color  = getRuntime(pkg.manager)?.color ?? '#ffffff'
    const colorFn = (s) => chalk.hex(color)(s)
    table.push([
      pkg.name,
      chalk.dim(pkg.version),
      colorFn(pkg.manager)
    ])
  }

  console.log(table.toString())
  console.log(chalk.dim(`  ${packages.length} package${packages.length !== 1 ? 's' : ''}\n`))
}
