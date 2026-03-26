import chalk from 'chalk'
import { writeFile } from 'fs/promises'
import { detectRuntimes } from '../detectors.js'
import { getAllPackages } from '../parsers.js'

const RUNTIME_ALIAS = { pip: 'python', python: 'python', conda: 'conda', npm: 'npm', yarn: 'yarn', pnpm: 'pnpm' }
const SUPPORTED = ['pip', 'conda', 'npm', 'yarn', 'pnpm']

function normalizeRuntime(value) {
  if (!value) return null
  return RUNTIME_ALIAS[String(value).toLowerCase()] || null
}

function asCsv(rows) {
  const lines = ['Name,Version,Manager']
  for (const r of rows) {
    lines.push(`${r.name},${r.version},${r.manager}`)
  }
  return `${lines.join('\n')}\n`
}

export async function exportCommand(options) {
  const format = String(options.format || 'json').toLowerCase()
  if (!['json', 'csv'].includes(format)) {
    console.error(chalk.red('\n  Invalid --format. Valid values: json, csv\n'))
    process.exit(1)
  }

  const runtime = normalizeRuntime(options.runtime)
  if (options.runtime && !runtime) {
    console.error(chalk.red(`\n  Unknown runtime "${options.runtime}". Valid values: ${SUPPORTED.join(', ')}\n`))
    process.exit(1)
  }

  const runtimes = await detectRuntimes()
  let packages = await getAllPackages(runtimes)
  if (runtime) packages = packages.filter((p) => p.manager === runtime)

  const outRows = packages.map((p) => ({ name: p.name, version: p.version, manager: p.manager }))
  const output = format === 'json' ? `${JSON.stringify(outRows, null, 2)}\n` : asCsv(outRows)

  if (options.output) {
    await writeFile(options.output, output, 'utf8')
    console.log(chalk.green(`✓ Exported ${outRows.length} packages to ${options.output}`))
    return
  }

  process.stdout.write(output)
}
