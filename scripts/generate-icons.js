/**
 * electron-icon-builder is CLI-only (no generateIcons export).
 * We invoke its CLI, then copy outputs to paths expected by electron-builder.
 */
const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const input = path.join(root, 'media', 'logo.png')
const outDir = path.join(root, 'build')
const builder = path.join(root, 'node_modules', 'electron-icon-builder', 'index.js')

if (!fs.existsSync(input)) {
  console.error('Missing input:', input)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

execFileSync(process.execPath, [builder, '--input', input, '--output', outDir], {
  stdio: 'inherit',
  cwd: root
})

const icnsSrc = path.join(outDir, 'icons', 'mac', 'icon.icns')
const icoSrc = path.join(outDir, 'icons', 'win', 'icon.ico')
const png512 = path.join(outDir, 'icons', 'png', '512x512.png')

for (const [src, msg] of [
  [icnsSrc, 'icon.icns'],
  [icoSrc, 'icon.ico'],
  [png512, 'icon.png']
]) {
  if (!fs.existsSync(src)) {
    console.error('Expected file missing:', src)
    process.exit(1)
  }
}

fs.copyFileSync(icnsSrc, path.join(outDir, 'icon.icns'))
fs.copyFileSync(icoSrc, path.join(outDir, 'icon.ico'))
fs.copyFileSync(png512, path.join(outDir, 'icon.png'))

console.log('Copied build/icon.icns, build/icon.ico, build/icon.png (512×512)')
