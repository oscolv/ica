import ccmeCsv from './ccme.csv?raw'
import mexicoCsv from './mexico.csv?raw'
import type { GuidelineTable } from '../engine/types'
import { parseGuidelinesCsv } from '../io/parseGuidelines'

export interface Preset {
  id: string
  name: string
  description: string
  table: GuidelineTable
}

export const PRESETS: Preset[] = [
  {
    id: 'ccme',
    name: 'CCME — Vida acuática',
    description:
      'Guías canadienses (CCME) para la protección de la vida acuática. Set de referencia del programa oficial.',
    table: parseGuidelinesCsv(ccmeCsv).table,
  },
  {
    id: 'mexico',
    name: 'México — Plantilla (provisional)',
    description:
      'Plantilla editable con parámetros típicos de México (DBO, DQO, fluoruro, coliformes…). Valores provisionales: verificar contra NOM-127 / CE-CCA / NOM-001 / OMS.',
    table: parseGuidelinesCsv(mexicoCsv).table,
  },
]

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
