import type { StationResult } from '../engine/types'
import { categoryLabelEs } from './categoryInfo'

export function buildNarrative(r: StationResult): string {
  const cat = categoryLabelEs(r.category).toLowerCase()
  const base = `La calidad del agua en ${r.station} es ${cat} (WQI ${r.wqi.toFixed(0)}).`
  if (r.failedParams.length === 0) {
    return `${base} Ningún parámetro incumplió su guía en el periodo evaluado.`
  }
  const params = r.failedParams.join(', ')
  return `${base} ${r.failedParams.length} de ${r.nParams} parámetros incumplieron su guía (${params}), en ${r.nFailedTests} de ${r.nTests} pruebas.`
}
