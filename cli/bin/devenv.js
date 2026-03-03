#!/usr/bin/env node
import '../src/runtimes/builtins.js'
import { Command } from 'commander'
import { listCommand } from '../src/commands/list.js'
import { packagesCommand } from '../src/commands/packages.js'
import { uninstallCommand } from '../src/commands/uninstall.js'
import { infoCommand } from '../src/commands/info.js'
import { portsCommand } from '../src/commands/ports.js'

const program = new Command()

program
  .name('devenv')
  .description('Inspect and manage your development runtimes and global packages')
  .version('0.3.0')

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
  .action(portsCommand)

await program.parseAsync(process.argv)
