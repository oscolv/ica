import type { RuleType } from '../../engine/types'

export const RULE_LABELS: Record<RuleType, string> = {
  max: 'Máximo',
  min: 'Mínimo',
  range: 'Rango',
  hardnessStep: 'Por dureza (escalones)',
  season: 'Estacional',
  ammonia: 'Amoníaco',
  alPh: 'Por pH (Aluminio)',
  cdHardness: 'Por dureza (Cadmio)',
  cuHardness: 'Por dureza (Cobre)',
  niHardness: 'Por dureza (Níquel)',
  pbHardness: 'Por dureza (Plomo)',
  znHardness: 'Por dureza (Zinc)',
}

export function ruleLabel(rt: RuleType): string {
  return RULE_LABELS[rt]
}
