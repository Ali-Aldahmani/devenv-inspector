import chalk from 'chalk'
import { detectRuntimes } from '../detectors.js'

const RUNTIMES = [
  { key: 'python', label: 'Python' },
  { key: 'conda',  label: 'Conda' },
  { key: 'node',   label: 'Node.js' },
  { key: 'npm',    label: 'npm' }
]

export async function listCommand() {
  console.log(chalk.bold('\n  DevEnv Inspector — Runtimes\n'))

  const spinner = process.stdout.isTTY
  if (spinner) process.stdout.write('  Detecting runtimes...')

  const runtimes = await detectRuntimes()

  if (spinner) process.stdout.write('\r' + ' '.repeat(30) + '\r')

  for (const { key, label } of RUNTIMES) {
    const rt = runtimes[key]
    const name = chalk.white.bold(label.padEnd(10))
    if (rt?.installed) {
      console.log(`  ${name}  ${chalk.green(rt.version)}`)
    } else {
      console.log(`  ${name}  ${chalk.dim('Not Installed')}`)
    }
  }
  console.log()
}
