import { spawn } from 'child_process'
import { platform } from 'process'
import { join } from 'path'
import { runInShell } from './shell.js'

const IS_WINDOWS = platform === 'win32'
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

function streamLines(stream, onLine) {
  let buffer = ''
  stream.on('data', (chunk) => {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) onLine(line)
  })
  stream.on('end', () => {
    if (buffer.trim()) onLine(buffer)
  })
}

async function runWithProgress(cmd, args, onProgress, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const cmdStr = buildCommand(cmd, args)
    const shellArgs = IS_WINDOWS
      ? ['-NoProfile', '-Command', cmdStr]
      : ['-i', '-l', '-c', cmdStr]

    onProgress(`$ ${cmd} ${args.join(' ')}`, 'info')
    const child = spawn(SHELL, shellArgs, { windowsHide: true })
    const killTimer = setTimeout(() => {
      child.kill()
      reject(new Error('Command timed out'))
    }, timeout)

    streamLines(child.stdout, (line) => onProgress(line, 'info'))
    streamLines(child.stderr, (line) => onProgress(line, 'error'))

    child.on('error', (err) => {
      clearTimeout(killTimer)
      reject(err)
    })
    child.on('close', (code) => {
      clearTimeout(killTimer)
      if (code === 0) resolve()
      else reject(new Error(`Command failed with exit code ${code}`))
    })
  })
}

function toPackageSpec(pkg) {
  if (!pkg?.name) return null
  return pkg.version ? `${pkg.name}==${pkg.version}` : pkg.name
}

export async function createEnv(targetPath, type, pythonVersion = null) {
  try {
    if (type === 'venv') {
      await runInShell('python3', ['-m', 'venv', join(targetPath, '.venv')], { timeout: 120000 })
      return { success: true, message: 'Python virtual environment created.' }
    }
    if (type === 'conda') {
      await runInShell(
        'conda',
        ['create', '-y', '-p', join(targetPath, '.conda-env'), `python=${pythonVersion || '3.11'}`],
        { timeout: 180000 }
      )
      return { success: true, message: 'Conda environment created.' }
    }
    if (type === 'node') {
      await runInShell('npm', ['init', '-y', '--prefix', targetPath], { timeout: 60000 })
      return { success: true, message: 'Node project initialized.' }
    }
    if (type === 'poetry') {
      await runInShell('poetry', ['new', targetPath], { timeout: 120000 })
      return { success: true, message: 'Poetry project created.' }
    }
    return { success: false, message: `Unknown environment type: ${type}` }
  } catch (err) {
    return { success: false, message: err.stderr || err.message || 'Failed to create environment.' }
  }
}

export async function installPackages(targetPath, envType, packages = [], onProgress = () => {}) {
  const wanted = (Array.isArray(packages) ? packages : [])
    .map(toPackageSpec)
    .filter(Boolean)

  if (wanted.length === 0) {
    return { success: true, installed: [], failed: [] }
  }

  try {
    if (envType === 'venv' || envType === 'conda venv') {
      const pipPath = IS_WINDOWS
        ? join(targetPath, '.venv', 'Scripts', 'pip.exe')
        : join(targetPath, '.venv', 'bin', 'pip')
      await runWithProgress(pipPath, ['install', ...wanted], onProgress, 180000)
      return { success: true, installed: wanted, failed: [] }
    }

    if (envType === 'conda') {
      await runWithProgress(
        'conda',
        ['install', '-y', '-p', join(targetPath, '.conda-env'), ...wanted],
        onProgress,
        180000
      )
      return { success: true, installed: wanted, failed: [] }
    }

    if (envType === 'node') {
      await runWithProgress('npm', ['install', '--prefix', targetPath, ...wanted], onProgress, 180000)
      return { success: true, installed: wanted, failed: [] }
    }

    return { success: false, installed: [], failed: wanted }
  } catch (err) {
    onProgress(err.message || 'Package installation failed', 'error')
    return { success: false, installed: [], failed: wanted }
  }
}

export async function getPopularPackages(envType) {
  const python = [
    'numpy', 'pandas', 'matplotlib', 'scikit-learn', 'requests',
    'flask', 'fastapi', 'django', 'pytest', 'torch', 'tensorflow',
    'pillow', 'sqlalchemy', 'pydantic', 'black'
  ]
  const node = [
    'typescript', 'eslint', 'prettier', 'nodemon', 'express',
    'axios', 'lodash', 'dotenv', 'jest', 'react', 'next', 'vite',
    'tailwindcss', 'prisma', 'zod'
  ]

  if (envType === 'node') return node
  return python
}
