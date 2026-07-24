import Papa from 'papaparse'
import type { DataRow } from '../engine/types'
import { parseFlexibleDate } from './parseDate'

export interface DataParseResult {
  rows: DataRow[]
  columns: string[]
  issues: { row: number; message: string }[]
}

function findCol(headers: string[], preferred: string, fallbacks: string[]): string | null {
  const wanted = [preferred, ...fallbacks].map((w) => w.toLowerCase())
  for (const h of headers) {
    if (wanted.includes(h.trim().toLowerCase())) return h
  }
  return null
}

export function parseDataCsv(
  csv: string,
  opts: { stationCol?: string; dateCol?: string } = {},
): DataParseResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  })
  const headers = parsed.meta.fields ?? []
  const issues: { row: number; message: string }[] = []

  const stationCol = opts.stationCol ?? findCol(headers, 'Station', ['Estacion', 'Estación', 'Sitio'])
  const dateCol = opts.dateCol ?? findCol(headers, 'Date', ['Fecha'])

  if (!stationCol) issues.push({ row: 1, message: 'No se encontró la columna de estación (Station).' })
  if (!dateCol) issues.push({ row: 1, message: 'No se encontró la columna de fecha (Date).' })

  const columns = headers.filter((h) => h !== stationCol && h !== dateCol)

  const rows: DataRow[] = []
  parsed.data.forEach((r, i) => {
    const station = stationCol ? String(r[stationCol] ?? '').trim() : ''
    const dateRaw = dateCol ? String(r[dateCol] ?? '').trim() : ''
    const date = dateRaw ? parseFlexibleDate(dateRaw) : null
    const values: Record<string, string> = {}
    for (const c of columns) values[c] = String(r[c] ?? '').trim()
    rows.push({ station, date, values })
    if (dateCol && dateRaw && date == null) {
      issues.push({ row: i + 2, message: `Fecha no reconocida: "${dateRaw}".` })
    }
  })

  return { rows, columns, issues }
}
