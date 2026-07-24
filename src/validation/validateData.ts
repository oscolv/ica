import type { DataRow, GuidelineTable } from '../engine/types'
import type { ValidationIssue } from './types'
import { parseValue } from '../engine/parseValue'

export interface DataValidationResult {
  matched: string[]
  dataWithoutGuideline: string[]
  guidelineWithoutData: string[]
  issues: ValidationIssue[]
}

const HARDNESS_RULES = new Set(['cdHardness', 'cuHardness', 'niHardness', 'pbHardness', 'znHardness', 'hardnessStep'])

export function validateData(
  rows: DataRow[],
  columns: string[],
  table: GuidelineTable,
  opts: { hardnessCol?: string; phCol?: string; tempCol?: string } = {},
): DataValidationResult {
  const hardnessCol = opts.hardnessCol ?? 'HARDNESS'
  const phCol = opts.phCol ?? 'PH'
  const tempCol = opts.tempCol ?? 'TEMP'

  const issues: ValidationIssue[] = []
  const colSet = new Set(columns)
  const contextCols = new Set([hardnessCol, phCol, tempCol].map((c) => c.toUpperCase()))

  const matched = columns.filter((c) => table.has(c))
  const dataWithoutGuideline = columns.filter((c) => !table.has(c) && !contextCols.has(c.toUpperCase()))
  const guidelineWithoutData = [...table.keys()].filter((p) => !colSet.has(p))

  // Dependencias de contexto (dureza/pH/temp) por tipo de regla.
  for (const p of matched) {
    const rt = table.get(p)![0].ruleType
    if (HARDNESS_RULES.has(rt) && !colSet.has(hardnessCol)) {
      issues.push({ severity: 'error', code: 'FALTA_DUREZA', parameterId: p, message: `"${p}" usa una guía por dureza pero no existe la columna "${hardnessCol}".` })
    }
    if (rt === 'alPh' && !colSet.has(phCol)) {
      issues.push({ severity: 'error', code: 'FALTA_PH', parameterId: p, message: `"${p}" usa una guía por pH pero no existe la columna "${phCol}".` })
    }
    if (rt === 'ammonia' && (!colSet.has(phCol) || !colSet.has(tempCol))) {
      issues.push({ severity: 'error', code: 'FALTA_PH_TEMP', parameterId: p, message: `"${p}" (amoníaco) requiere columnas "${phCol}" y "${tempCol}".` })
    }
  }

  // Validación por celda (solo columnas emparejadas).
  rows.forEach((r, i) => {
    const rowNum = i + 2
    for (const p of matched) {
      const raw = r.values[p]
      if (raw == null || raw === '') continue
      const { value } = parseValue(raw)
      if (value == null) {
        issues.push({ severity: 'error', code: 'VALOR_NO_NUMERICO', parameterId: p, column: p, row: rowNum, message: `Fila ${rowNum}, "${p}": valor no numérico "${raw}".` })
        continue
      }
      if (p.toUpperCase() === phCol.toUpperCase() && (value < 0 || value > 14)) {
        issues.push({ severity: 'warn', code: 'PH_FUERA_DE_RANGO', parameterId: p, column: p, row: rowNum, message: `Fila ${rowNum}: pH ${value} fuera del rango físico 0–14.` })
      }
      if (value < 0 && p.toUpperCase() !== phCol.toUpperCase()) {
        issues.push({ severity: 'warn', code: 'VALOR_NEGATIVO', parameterId: p, column: p, row: rowNum, message: `Fila ${rowNum}, "${p}": valor negativo (${value}).` })
      }
    }
  })

  // Requisitos del índice.
  if (matched.length < 8) {
    issues.push({ severity: 'warn', code: 'POCOS_PARAMETROS', message: `Solo ${matched.length} parámetros emparejados; el manual recomienda al menos 8.` })
  }

  return { matched, dataWithoutGuideline, guidelineWithoutData, issues }
}
