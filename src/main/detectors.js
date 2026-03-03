import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

async function runCommand(cmd, args) {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 10000 })
    return stdout.trim()
  } catch {
    return null
  }
}

export async function detectRuntimes() {
  const [pythonOut, condaOut, nodeOut, npmOut] = await Promise.all([
    runCommand('python3', ['--version']).then(
      (out) => out || runCommand('python', ['--version'])
    ),
    runCommand('conda', ['--version']),
    runCommand('node', ['--version']),
    runCommand('npm', ['--version'])
  ])

  return {
    python: pythonOut
      ? { installed: true, version: pythonOut.replace(/^Python\s+/i, '') }
      : { installed: false, version: null },
    conda: condaOut
      ? { installed: true, version: condaOut.replace(/^conda\s+/i, '') }
      : { installed: false, version: null },
    node: nodeOut
      ? { installed: true, version: nodeOut.replace(/^v/, '') }
      : { installed: false, version: null },
    npm: npmOut
      ? { installed: true, version: npmOut }
      : { installed: false, version: null }
  }
}
