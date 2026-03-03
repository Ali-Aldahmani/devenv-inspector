import chalk from 'chalk'
import Table from 'cli-table3'
import { getActivePorts } from '../ports.js'

export async function portsCommand() {
  console.log(chalk.bold('\n  DevEnv Inspector — Active Local Ports\n'))

  const spinner = process.stdout.isTTY
  if (spinner) process.stdout.write('  Scanning ports...')

  const ports = await getActivePorts()

  if (spinner) process.stdout.write('\r' + ' '.repeat(30) + '\r')

  if (ports.length === 0) {
    console.log(chalk.dim('  No active listening ports found.\n'))
    return
  }

  const table = new Table({
    head: [
      chalk.white.bold('Port'),
      chalk.white.bold('Protocol'),
      chalk.white.bold('PID'),
      chalk.white.bold('Process')
    ],
    style: { head: [], border: [] },
    colWidths: [10, 12, 10, 30]
  })

  for (const p of ports) {
    const proto =
      p.protocol === 'TCP'
        ? chalk.hex('#4b9eff')(p.protocol)
        : chalk.hex('#f69220')(p.protocol)

    table.push([
      chalk.white.bold(String(p.port)),
      proto,
      chalk.dim(String(p.pid)),
      chalk.white(p.process)
    ])
  }

  console.log(table.toString())
  console.log(chalk.dim(`\n  ${ports.length} active port${ports.length !== 1 ? 's' : ''}\n`))
}
