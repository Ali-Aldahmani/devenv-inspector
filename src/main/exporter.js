import { dialog } from 'electron'
import { writeFile } from 'fs/promises'

function escapeCSV(value) {
  const text = value == null ? '' : String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCSV(data, columns) {
  const header = columns.map((c) => escapeCSV(c.label)).join(',')
  const rows = (Array.isArray(data) ? data : []).map((row) =>
    columns.map((c) => escapeCSV(row?.[c.key])).join(',')
  )
  return [header, ...rows].join('\n')
}

export function toJSON(data) {
  return JSON.stringify(Array.isArray(data) ? data : [], null, 2)
}

export async function saveFile(content, defaultFilename, filters) {
  try {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultFilename,
      filters
    })
    if (result.canceled || !result.filePath) {
      return { success: false, path: null }
    }
    await writeFile(result.filePath, content, 'utf8')
    return { success: true, path: result.filePath }
  } catch {
    return { success: false, path: null }
  }
}
