import chalk from 'chalk'
import { detectRuntimes } from '../detectors.js'
import { getAllPackages } from '../parsers.js'
import { getRegisteredRuntimes, getRuntime } from '../registry.js'

export async function infoCommand(runtime) {
  const key = runtime.toLowerCase()
  const rt  = getRuntime(key)

  if (!rt) {
    const valid = getRegisteredRuntimes().map((r) => r.name).join(', ')
    console.error(chalk.red(`\n  Unknown runtime "${runtime}". Valid values: ${valid}\n`))
    process.exit(1)
  }

  if (process.stdout.isTTY) process.stdout.write(`  Loading info for ${rt.label}...`)

  const runtimes = await detectRuntimes()

  if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(40) + '\r')

  const info = runtimes[key]

  console.log(chalk.bold(`\n  ${rt.label}\n`))
  console.log(`  Status   ${info?.installed ? chalk.green('Installed') : chalk.dim('Not Installed')}`)

  if (!info?.installed) {
    console.log()
    return
  }

  console.log(`  Version  ${chalk.cyan(info.version)}`)

  // Show package count if this runtime supports package listing
  if (rt.list) {
    if (process.stdout.isTTY) process.stdout.write('  Counting packages...')
    const allPkgs = await getAllPackages(runtimes)
    if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(30) + '\r')

    const count = allPkgs.filter((p) => p.manager === key).length
    console.log(`  Packages ${chalk.yellow(count)} global ${rt.label} packages`)
  }

  console.log()
}
