import type { RuleType } from '../engine/types'

// Códigos EXCEED_IF reconocidos (case-insensitive), mapeados a RuleType del motor.
// Las variantes provinciales (MB/AB/BC) NO se soportan y no aparecen aquí.
const CODE_TO_RULE: Record<string, RuleType> = {
  '>': 'max',
  '<': 'min',
  '<>': 'range',
  hardness: 'hardnessStep',
  season: 'season',
  date: 'season',
  compute: 'ammonia',
  phdependccme: 'alPh',
  cdhardness: 'cdHardness',
  cuhardness: 'cuHardness',
  nihardness: 'niHardness',
  pbhardness: 'pbHardness',
  znhardness: 'znHardness',
}

// Código canónico oficial por RuleType (para serializar).
const RULE_TO_CODE: Record<RuleType, string> = {
  max: '>',
  min: '<',
  range: '<>',
  hardnessStep: 'HARDNESS',
  season: 'SEASON',
  ammonia: 'COMPUTE',
  alPh: 'pHDependCCME',
  cdHardness: 'CdHardness',
  cuHardness: 'CuHardness',
  niHardness: 'NiHardness',
  pbHardness: 'PbHardness',
  znHardness: 'ZnHardness',
}

export function codeToRuleType(code: string): RuleType | null {
  const key = code.trim().toLowerCase()
  return CODE_TO_RULE[key] ?? null
}

export function ruleTypeToCode(rt: RuleType): string {
  return RULE_TO_CODE[rt]
}
