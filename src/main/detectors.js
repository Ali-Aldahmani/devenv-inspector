import { runInShell } from './shell.js'

async function tryCommand(cmd, args) {
  try {
    return await runInShell(cmd, args, { timeout: 10000 })
  } catch {
    return null
  }
}

export async function detectRuntimes() {
  const [pythonOut, condaOut, nodeOut, npmOut, yarnOut, pnpmOut] = await Promise.all([
    tryCommand('python3', ['--version']).then(
      (out) => out || tryCommand('python', ['--version'])
    ),
    tryCommand('conda', ['--version']),
    tryCommand('node', ['--version']),
    tryCommand('npm', ['--version']),
    tryCommand('yarn', ['--version']),
    tryCommand('pnpm', ['--version'])
  ])

  return {
    python: pythonOut
      ? { installed: true, version: pythonOut.trim().replace(/^Python\s+/i, '') }
      : { installed: false, version: null },
    conda: condaOut
      ? { installed: true, version: condaOut.trim().replace(/^conda\s+/i, '') }
      : { installed: false, version: null },
    node: nodeOut
      ? { installed: true, version: nodeOut.trim().replace(/^v/, '') }
      : { installed: false, version: null },
    npm: npmOut
      ? { installed: true, version: npmOut.trim() }
      : { installed: false, version: null },
    yarn: yarnOut
      ? { installed: true, version: yarnOut.trim().replace(/^yarn\s+v?/i, '') }
      : { installed: false, version: null },
    pnpm: pnpmOut
      ? { installed: true, version: pnpmOut.trim() }
      : { installed: false, version: null }
  }
}
