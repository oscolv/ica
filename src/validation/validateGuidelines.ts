import type { GuidelineTable, GuidelineRow } from '../engine/types'
import type { ValidationIssue } from './types'

function checkRow(paramId: string, rows: GuidelineRow[], out: ValidationIssue[]): void {
  const rt = rows[0].ruleType

  if (rt === 'max' && rows[0].upperLimit == null) {
    out.push({ severity: 'error', code: 'MAX_SIN_LIMITE', parameterId: paramId, message: `"${paramId}": la regla de máximo requiere un límite superior.` })
  }
  if (rt === 'min' && rows[0].lowerLimit == null) {
    out.push({ severity: 'error', code: 'MIN_SIN_LIMITE', parameterId: paramId, message: `"${paramId}": la regla de mínimo requiere un límite inferior.` })
  }
  if (rt === 'range') {
    const lo = rows[0].lowerLimit
    const hi = rows[0].upperLimit
    if (lo == null && hi == null) {
      out.push({ severity: 'error', code: 'RANGO_SIN_LIMITES', parameterId: paramId, message: `"${paramId}": el rango requiere al menos un límite.` })
    } else if (lo != null && hi != null && lo >= hi) {
      out.push({ severity: 'error', code: 'RANGO_INVERTIDO', parameterId: paramId, message: `"${paramId}": el límite inferior (${lo}) debe ser menor que el superior (${hi}).` })
    }
  }
  if (rt === 'season') {
    for (const r of rows) {
      if (!r.seasonStart || !r.seasonFinish) {
        out.push({ severity: 'error', code: 'ESTACION_SIN_FECHAS', parameterId: paramId, message: `"${paramId}": una regla estacional requiere fecha de inicio y fin.` })
        break
      }
    }
  }
  if (rt === 'hardnessStep') {
    for (const r of rows) {
      if (r.upperLimit == null) {
        out.push({ severity: 'error', code: 'ESCALON_SIN_LIMITE', parameterId: paramId, message: `"${paramId}": cada tramo por dureza requiere un límite.` })
        break
      }
    }
  }
  // Unidad: aviso si falta (pH no lleva unidad, se exime).
  if (paramId.toUpperCase() !== 'PH' && !rows[0].unit) {
    out.push({ severity: 'warn', code: 'SIN_UNIDAD', parameterId: paramId, message: `"${paramId}": no tiene unidad declarada.` })
  }
}

export function validateGuidelines(table: GuidelineTable): ValidationIssue[] {
  const out: ValidationIssue[] = []
  for (const [paramId, rows] of table) {
    checkRow(paramId, rows, out)
  }
  return out
}
