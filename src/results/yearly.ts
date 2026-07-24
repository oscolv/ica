import { computeStations } from '../engine'
import type { DataRow, GuidelineTable } from '../engine/types'

export interface YearlyWqi {
  station: string
  year: number
  wqi: number
}

export function computeYearlyWqi(
  rows: DataRow[],
  guidelines: GuidelineTable,
  options?: { hardnessCol?: string; phCol?: string; tempCol?: string },
): YearlyWqi[] {
  // Agrupar filas por año (ignorando las que no tienen fecha).
  const byYear = new Map<number, DataRow[]>()
  for (const r of rows) {
    if (!r.date) continue
    const y = r.date.getFullYear()
    const arr = byYear.get(y) ?? []
    arr.push(r)
    byYear.set(y, arr)
  }

  const out: YearlyWqi[] = []
  for (const [year, yearRows] of byYear) {
    for (const s of computeStations(yearRows, guidelines, options)) {
      out.push({ station: s.station, year, wqi: s.wqi })
    }
  }

  out.sort((a, b) => (a.station === b.station ? a.year - b.year : a.station < b.station ? -1 : 1))
  return out
}
