const MAX_LOGS = 300
const logs = []

export function addDiagnostic({ source = 'unknown', message = 'Unknown error', details = '' }) {
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source,
    message: String(message),
    details: String(details || '')
  })
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS
}

export function getDiagnostics() {
  return [...logs]
}

export function clearDiagnostics() {
  logs.length = 0
}
