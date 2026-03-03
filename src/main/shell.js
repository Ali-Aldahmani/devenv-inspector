import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const SHELL = process.env.SHELL || '/bin/zsh'

/**
 * Run a command through the user's login shell.
 * Flags:
 *  -i  interactive — ensures .zshrc runs fully (bypasses "[[ $- != *i* ]] && return" guards)
 *  -l  login       — sources .zprofile / .zshrc / conda init / nvm / pyenv etc.
 *  -c  run command
 */
export async function runInShell(cmd, args, options = {}) {
  const cmdStr = [cmd, ...args].join(' ')
  try {
    const { stdout } = await execFileAsync(
      SHELL,
      ['-i', '-l', '-c', cmdStr],
      { timeout: options.timeout || 15000 }
    )
    return stdout
  } catch (err) {
    if (options.allowNonZero && err.stdout) return err.stdout
    throw err
  }
}
