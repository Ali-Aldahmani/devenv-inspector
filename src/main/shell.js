import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const IS_WINDOWS = process.platform === 'win32'
const SHELL = IS_WINDOWS ? 'powershell.exe' : (process.env.SHELL || '/bin/zsh')

function quotePosix(arg) {
  return `'${String(arg).replace(/'/g, `'\\''`)}'`
}

function quotePowerShell(arg) {
  return `'${String(arg).replace(/'/g, "''")}'`
}

function buildCommand(cmd, args) {
  if (IS_WINDOWS) {
    return `& ${quotePowerShell(cmd)} ${args.map(quotePowerShell).join(' ')}`
  }

  return [cmd, ...args].map(quotePosix).join(' ')
}

/**
 * Run a command through the user's login shell.
 * Flags:
 *  -i  interactive — ensures .zshrc runs fully (bypasses "[[ $- != *i* ]] && return" guards)
 *  -l  login       — sources .zprofile / .zshrc / conda init / nvm / pyenv etc.
 *  -c  run command
 */
export async function runInShell(cmd, args, options = {}) {
  const cmdStr = buildCommand(cmd, args)
  const shellArgs = IS_WINDOWS
    ? ['-NoProfile', '-Command', cmdStr]
    : ['-i', '-l', '-c', cmdStr]

  try {
    const { stdout, stderr } = await execFileAsync(
      SHELL,
      shellArgs,
      { timeout: options.timeout || 15000 }
    )
    return stdout || stderr || ''
  } catch (err) {
    if (options.allowNonZero) return err.stdout || err.stderr || ''
    throw err
  }
}
