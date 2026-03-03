import chalk from 'chalk'
import { createRequire } from 'module'
import { runInShell } from '../shell.js'

const PACKAGE_NAME_RE = /^[a-zA-Z0-9._\-@/]+$/

const VALID_MANAGERS = ['pip', 'conda', 'npm']

const UNINSTALL_COMMANDS = {
  pip:   ['python3', ['-m', 'pip', 'uninstall', '-y']],
  conda: ['conda',   ['remove', '-y']],
  npm:   ['npm',     ['uninstall', '-g']]
}

export async function uninstallCommand(pkg, options) {
  const manager = options.runtime?.toLowerCase()

  if (!VALID_MANAGERS.includes(manager)) {
    console.error(chalk.red(`\n  Unknown runtime "${manager}". Valid values: pip, conda, npm\n`))
    process.exit(1)
  }

  if (!PACKAGE_NAME_RE.test(pkg)) {
    console.error(chalk.red('\n  Invalid package name.\n'))
    process.exit(1)
  }

  // Dynamic import of inquirer (ESM)
  const { default: inquirer } = await import('inquirer')

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Uninstall ${chalk.bold(pkg)} via ${chalk.bold(manager)}?`,
      default: false
    }
  ])

  if (!confirmed) {
    console.log(chalk.dim('\n  Cancelled.\n'))
    return
  }

  console.log(chalk.dim(`\n  Running ${manager} uninstall ${pkg}...`))

  const [cmd, baseArgs] = UNINSTALL_COMMANDS[manager]
  const args = [...baseArgs, pkg]

  try {
    await runInShell(cmd, args, { timeout: 60000 })
    console.log(chalk.green(`\n  ✓ ${pkg} uninstalled successfully.\n`))
  } catch (err) {
    const msg = err.stderr || err.message || 'Unknown error'
    console.error(chalk.red(`\n  ✗ Uninstall failed: ${msg}\n`))
    process.exit(1)
  }
}
