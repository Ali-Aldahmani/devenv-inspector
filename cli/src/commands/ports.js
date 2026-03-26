import chalk from 'chalk'
import Table from 'cli-table3'
import { getActivePorts } from '../ports.js'

async function confirm(message) {
  const { default: inquirer } = await import('inquirer')
  const { confirmed } = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message, default: false }])
  return confirmed
}

async function killByPort(portValue) {
  const port = Number.parseInt(String(portValue), 10)
  if (!Number.isFinite(port) || port <= 0) {
    console.error(chalk.red('\n  Invalid port number.\n'))
    process.exit(1)
  }

  const ports = await getActivePorts()
  const target = ports.find((p) => p.port === port)
  if (!target) {
    console.error(chalk.red(`\n  No process is listening on port ${port}.\n`))
    process.exit(1)
  }

  const ok = await confirm(`Kill process ${target.process} (PID ${target.pid}) on port ${port}?`)
  if (!ok) {
    console.log(chalk.dim('\n  Cancelled.\n'))
    return
  }

  try {
    process.kill(target.pid, 'SIGTERM')
    console.log(chalk.green(`\n  ✓ Process ${target.process} (PID ${target.pid}) terminated.\n`))
  } catch (err) {
    console.error(chalk.red(`\n  ✗ Failed to kill PID ${target.pid}: ${err.message}\n`))
    process.exit(1)
  }
}

export async function portsCommand(options = {}) {
  if (options.kill != null) {
    await killByPort(options.kill)
    return
  }

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
