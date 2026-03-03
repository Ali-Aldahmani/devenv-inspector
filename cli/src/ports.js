import { runInShell } from './shell.js'

/**
 * Returns all locally listening ports (TCP + UDP).
 * Uses `lsof -F pcn` for structured, injection-safe parsing.
 *
 * Each entry: { port, protocol, pid, process }
 */
export async function getActivePorts() {
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

// ── Parser ────────────────────────────────────────────────────────────────────
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
