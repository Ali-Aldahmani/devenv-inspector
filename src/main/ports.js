import { runInShell } from './shell.js'

/**
 * Returns all locally listening ports (TCP + UDP).
 * Uses `lsof -F pcn` for structured, injection-safe parsing.
 *
 * Each entry: { port, protocol, pid, process }
 */
export async function getActivePorts() {
  if (process.platform === 'win32') {
    return getActivePortsWindows()
  }

  const ports = []

  // TCP: only LISTEN state (servers waiting for connections)
  try {
    const out = await runInShell(
      'lsof',
      ['-iTCP', '-sTCP:LISTEN', '-P', '-n', '-F', 'pcn'],
      { timeout: 10000 }
    )
    if (out) parseFOutput(out, 'TCP', ports)
  } catch { /* lsof unavailable or no TCP listeners */ }

  // UDP: connectionless — all bound UDP sockets
  try {
    const out = await runInShell(
      'lsof',
      ['-iUDP', '-P', '-n', '-F', 'pcn'],
      { timeout: 10000 }
    )
    if (out) parseFOutput(out, 'UDP', ports)
  } catch { /* lsof unavailable or no UDP sockets */ }

  // Deduplicate: same process can bind both IPv4 and IPv6 on the same port
  const seen = new Set()
  return ports
    .filter((p) => {
      const key = `${p.port}|${p.protocol}|${p.pid}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.port - b.port)
}

async function getActivePortsWindows() {
  const script = [
    '$ErrorActionPreference = "SilentlyContinue"',
    '$tcp = Get-NetTCPConnection -State Listen | Select-Object LocalPort, OwningProcess',
    '$udp = Get-NetUDPEndpoint | Select-Object LocalPort, OwningProcess',
    '$items = @()',
    'foreach ($t in $tcp) {',
    '  $items += [pscustomobject]@{ port = [int]$t.LocalPort; protocol = "TCP"; pid = [int]$t.OwningProcess }',
    '}',
    'foreach ($u in $udp) {',
    '  $items += [pscustomobject]@{ port = [int]$u.LocalPort; protocol = "UDP"; pid = [int]$u.OwningProcess }',
    '}',
    '$items = $items | Where-Object { $_.port -gt 0 -and $_.pid -gt 0 } | Sort-Object port, protocol, pid -Unique',
    '$withName = foreach ($i in $items) {',
    '  $procName = (Get-Process -Id $i.pid -ErrorAction SilentlyContinue).ProcessName',
    '  if (-not $procName) { $procName = "unknown" }',
    '  [pscustomobject]@{ port = $i.port; protocol = $i.protocol; pid = $i.pid; process = $procName }',
    '}',
    '$withName | ConvertTo-Json -Compress'
  ].join('; ')

  try {
    const out = await runInShell('powershell.exe', ['-NoProfile', '-Command', script], { timeout: 15000 })
    if (!out || !out.trim()) return []
    const data = JSON.parse(out)
    const arr = Array.isArray(data) ? data : [data]
    return arr.sort((a, b) => a.port - b.port)
  } catch {
    return []
  }
}

/**
 * Send SIGTERM to a process by PID.
 * Uses Node's built-in process.kill — no shell spawn needed.
 */
export function killProcess(pid) {
  process.kill(pid, 'SIGTERM')
}

// ── Parser ────────────────────────────────────────────────────────────────────
// lsof -F pcn emits lines prefixed with a field identifier:
//   p<pid>   — start of a new process block
//   c<name>  — command / process name
//   n<addr>  — network address, e.g.  *:3000  or  127.0.0.1:8080
// One process block can have multiple `n` lines (IPv4 + IPv6 duplicates).

function parseFOutput(output, protocol, result) {
  let pid = null
  let cmd = null

  for (const raw of output.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const id = line[0]

    if (id === 'p') {
      pid = parseInt(line.slice(1), 10) || null
      cmd = null
    } else if (id === 'c') {
      cmd = line.slice(1)
    } else if (id === 'n' && pid && cmd) {
      // Address format: "*:3000", "127.0.0.1:8080", "[::1]:443"
      const portMatch = line.slice(1).match(/:(\d+)$/)
      if (portMatch) {
        const port = parseInt(portMatch[1], 10)
        if (!isNaN(port) && port > 0) {
          result.push({ port, protocol, pid, process: cmd })
        }
      }
    }
  }
}
