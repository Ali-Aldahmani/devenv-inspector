import chalk from 'chalk'
import { detectRuntimes } from '../detectors.js'

export async function listCommand() {
  console.log(chalk.bold('\n  DevEnv Inspector — Runtimes\n'))

  const spinner = process.stdout.isTTY
  if (spinner) process.stdout.write('  Detecting runtimes...')

  const runtimes = await detectRuntimes()

  if (spinner) process.stdout.write('\r' + ' '.repeat(30) + '\r')

  for (const [, info] of Object.entries(runtimes)) {
    const name = chalk.white.bold(info.label.padEnd(10))
    if (info.installed) {
      console.log(`  ${name}  ${chalk.green(info.version)}`)
    } else {
      console.log(`  ${name}  ${chalk.dim('Not Installed')}`)
    }
  }
  console.log()
}
