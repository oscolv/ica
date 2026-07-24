import { parseValue, resolveGuideline, evaluate } from '../engine'
import type { DataRow, GuidelineTable, SampleContext } from '../engine/types'

export type ExceedBand = 'pass' | 'lt10' | 'x10to25' | 'gt25' | 'na'

export interface CellResult {
  station: string
  date: Date | null
  parameterId: string
  raw: string
  fail: boolean
  ratio: number
  band: ExceedBand
}

function bandFor(fail: boolean, ratio: number): ExceedBand {
  if (!fail) return 'pass'
  if (ratio < 10) return 'lt10'
  if (ratio <= 25) return 'x10to25'
  return 'gt25'
}

export function computeCells(
  rows: DataRow[],
  guidelines: GuidelineTable,
  options: { hardnessCol?: string; phCol?: string; tempCol?: string } = {},
): CellResult[] {
  const hardnessCol = options.hardnessCol ?? 'HARDNESS'
  const phCol = options.phCol ?? 'PH'
  const tempCol = options.tempCol ?? 'TEMP'

  const out: CellResult[] = []

  for (const r of rows) {
    const ctx: SampleContext = {
      hardness: parseValue(r.values[hardnessCol]).value,
      pH: parseValue(r.values[phCol]).value,
      temp: parseValue(r.values[tempCol]).value,
      date: r.date,
    }
    for (const [paramId, glRows] of guidelines) {
      const raw = r.values[paramId]
      const parsed = parseValue(raw)
      if (parsed.value == null) continue // celda vacía

      const resolved = resolveGuideline(glRows, ctx)
      if (resolved == null) continue // sin guía aplicable

      // Regla del límite de detección (igual que el motor): LD > guía-máximo => usa el LD como guía.
      let g = resolved
      if (parsed.nonDetect && resolved.mode === 'max' && typeof resolved.target === 'number' && parsed.value > resolved.target) {
        g = { target: parsed.value, mode: 'max' }
      }

      const { fail, excursion } = evaluate(parsed.value, g)
      const ratio = fail ? excursion + 1 : 1 // factor de exceso (excursión = factor − 1)
      out.push({
        station: r.station,
        date: r.date,
        parameterId: paramId,
        raw,
        fail,
        ratio,
        band: bandFor(fail, ratio),
      })
    }
  }

  return out
}
