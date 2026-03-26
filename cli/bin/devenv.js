#!/usr/bin/env node
import '../src/runtimes/builtins.js'
import { Command } from 'commander'
import { listCommand } from '../src/commands/list.js'
import { packagesCommand } from '../src/commands/packages.js'
import { uninstallCommand } from '../src/commands/uninstall.js'
import { infoCommand } from '../src/commands/info.js'
import { portsCommand } from '../src/commands/ports.js'
import { outdatedCommand } from '../src/commands/outdated.js'
import { upgradeCommand } from '../src/commands/upgrade.js'
import { exportCommand } from '../src/commands/export.js'
import { envsCommand } from '../src/commands/envs.js'

const program = new Command()

program
  .name('devenv')
  .description('Inspect and manage your development runtimes and global packages')
  .version('0.5.0')

program
  .command('list')
  .description('Show all installed runtimes and their versions')
  .action(listCommand)

program
  .command('packages')
  .description('List all global packages')
  .option('-r, --runtime <manager>', 'filter by manager: pip, conda, or npm')
  .action(packagesCommand)

program
  .command('uninstall <package>')
  .description('Uninstall a package')
  .requiredOption('-r, --runtime <manager>', 'package manager: pip, conda, or npm')
  .action(uninstallCommand)

program
  .command('info <runtime>')
  .description('Show detailed info for a runtime (python, conda, node, npm)')
  .action(infoCommand)

program
  .command('ports')
  .description('Show all active local listening ports and their processes')
  .option('--kill <port>', 'kill the process listening on a specific port')
  .action(portsCommand)

program
  .command('outdated')
  .description('List outdated global packages')
  .option('-r, --runtime <manager>', 'filter by manager: pip, npm, yarn, pnpm')
  .action(outdatedCommand)

program
  .command('upgrade [package]')
  .description('Upgrade a package, or all outdated packages')
  .option('-r, --runtime <manager>', 'package manager: pip, npm, yarn, pnpm')
  .option('--all', 'upgrade all outdated packages')
  .action(upgradeCommand)

program
  .command('export')
  .description('Export global packages as JSON or CSV')
  .option('-r, --runtime <manager>', 'filter by manager: pip, conda, npm, yarn, pnpm')
  .option('-f, --format <format>', 'json or csv', 'json')
  .option('-o, --output <file>', 'write output to a file instead of stdout')
  .action(exportCommand)

program
  .command('envs')
  .description('Scan and list detected development environments')
  .option('--path <dir>', 'scan a specific directory instead of default roots')
  .action(envsCommand)

await program.parseAsync(process.argv)
