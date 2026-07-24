import type {
  DataRow, GuidelineTable, StationResult, ComputeOptions, SampleContext,
} from './types'
import { parseValue } from './parseValue'
import { resolveGuideline } from './resolveGuideline'
import { evaluate } from './excursion'
import { computeF1, computeF2, computeNse, computeF3, computeWQI, category } from './indexCalc'

export function computeStations(
  rows: DataRow[],
  guidelines: GuidelineTable,
  options: ComputeOptions = {},
): StationResult[] {
  const hardnessCol = options.hardnessCol ?? 'HARDNESS'
  const phCol = options.phCol ?? 'PH'
  const tempCol = options.tempCol ?? 'TEMP'

  // agrupar filas por estación
  const byStation = new Map<string, DataRow[]>()
  for (const r of rows) {
    const arr = byStation.get(r.station) ?? []
    arr.push(r)
    byStation.set(r.station, arr)
  }

  const results: StationResult[] = []

  for (const [station, srows] of byStation) {
    const paramsPresent = new Set<string>()
    const failedParams = new Set<string>()
    let totalTests = 0
    let failedTests = 0
    const excursions: number[] = []

    for (const r of srows) {
      const ctx: SampleContext = {
        hardness: parseValue(r.values[hardnessCol]).value,
        pH: parseValue(r.values[phCol]).value,
        temp: parseValue(r.values[tempCol]).value,
        date: r.date,
      }

      for (const [paramId, glRows] of guidelines) {
        const raw = r.values[paramId]
        const parsed = parseValue(raw)
        if (parsed.value == null) continue // dato faltante

        const resolved = resolveGuideline(glRows, ctx)
        if (resolved == null) continue // sin guía aplicable / falta contexto

        // Regla del manual: si el LD supera la guía, usar el LD como guía.
        let g = resolved
        if (parsed.nonDetect && resolved.mode === 'max' && typeof resolved.target === 'number') {
          if (parsed.value > resolved.target) g = { target: parsed.value, mode: 'max' }
        }

        paramsPresent.add(paramId)
        totalTests += 1
        const { fail, excursion } = evaluate(parsed.value, g)
        if (fail) {
          failedTests += 1
          failedParams.add(paramId)
          excursions.push(excursion)
        }
      }
    }

    const nParams = paramsPresent.size
    const f1 = computeF1(failedParams.size, nParams)
    const f2 = computeF2(failedTests, totalTests)
    const nse = computeNse(excursions, totalTests)
    const f3 = computeF3(nse)
    const wqi = computeWQI(f1, f2, f3)

    results.push({
      station,
      nParams,
      nTests: totalTests,
      failedParams: [...failedParams].sort(),
      nFailedTests: failedTests,
      f1, f2, f3, nse, wqi,
      category: category(wqi),
    })
  }

  return results
}
