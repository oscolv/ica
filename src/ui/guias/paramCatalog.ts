import type { RuleType, GuidelineRow } from '../../engine/types'

export interface CatalogEntry {
  id: string
  label: string
  parameterId: string
  ruleType: RuleType
  lowerLimit: number | null
  upperLimit: number | null
  unit: string
  source: string
}

// Valores de referencia PROVISIONALES (verificar contra NOM-127 / CE-CCA / OMS).
export const PARAM_CATALOG: CatalogEntry[] = [
  { id: 'bod5', label: 'DBO₅ (demanda bioquímica de oxígeno)', parameterId: 'BOD5_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 30, unit: 'mg/L', source: 'NOM-001-SEMARNAT-2021 (provisional)' },
  { id: 'cod', label: 'DQO (demanda química de oxígeno)', parameterId: 'COD_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 40, unit: 'mg/L', source: 'Referencia general (provisional)' },
  { id: 'fluoride', label: 'Fluoruro', parameterId: 'FLUORIDE_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 1.5, unit: 'mg/L', source: 'NOM-127-SSA1-2021 / OMS (provisional)' },
  { id: 'ecoli', label: 'E. coli', parameterId: 'E_COLI_NMP100mL', ruleType: 'max', lowerLimit: null, upperLimit: 0, unit: 'NMP/100mL', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'fcoli', label: 'Coliformes fecales', parameterId: 'FECAL_COLIFORM_NMP100mL', ruleType: 'max', lowerLimit: null, upperLimit: 1000, unit: 'NMP/100mL', source: 'CE-CCA-001/89 (provisional)' },
  { id: 'do', label: 'Oxígeno disuelto', parameterId: 'DISSOLVED_OXYGEN_mgL', ruleType: 'min', lowerLimit: 5, upperLimit: null, unit: 'mg/L', source: 'CE-CCA-001/89 (provisional)' },
  { id: 'ph', label: 'pH', parameterId: 'PH', ruleType: 'range', lowerLimit: 6.5, upperLimit: 8.5, unit: '', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'nitrate', label: 'Nitrato (como N)', parameterId: 'NITRATE_mgLasN', ruleType: 'max', lowerLimit: null, upperLimit: 11, unit: 'mg/L', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'tp', label: 'Fósforo total', parameterId: 'TOTAL_PHOSPHORUS_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L', source: 'Referencia general (provisional)' },
  { id: 'turbidity', label: 'Turbidez', parameterId: 'TURBIDITY_NTU', ruleType: 'max', lowerLimit: null, upperLimit: 5, unit: 'NTU', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'tds', label: 'Sólidos disueltos totales', parameterId: 'TOTAL_DISSOLVED_SOLIDS_mgL', ruleType: 'max', lowerLimit: null, upperLimit: 1000, unit: 'mg/L', source: 'NOM-127-SSA1-2021 (provisional)' },
  { id: 'arsenic', label: 'Arsénico', parameterId: 'ARSENIC_TOTAL_ugL', ruleType: 'max', lowerLimit: null, upperLimit: 10, unit: 'ug/L', source: 'NOM-127-SSA1-2021 / OMS (provisional)' },
]

export function catalogToRow(e: CatalogEntry): GuidelineRow {
  return {
    parameterId: e.parameterId,
    ruleType: e.ruleType,
    lowerLimit: e.lowerLimit,
    upperLimit: e.upperLimit,
    unit: e.unit || undefined,
    source: e.source || undefined,
  }
}
