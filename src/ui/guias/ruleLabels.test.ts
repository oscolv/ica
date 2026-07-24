import { describe, it, expect } from 'vitest'
import { ruleLabel, RULE_LABELS } from './ruleLabels'

describe('ruleLabel', () => {
  it('traduce los tipos de regla al español', () => {
    expect(ruleLabel('max')).toBe('Máximo')
    expect(ruleLabel('min')).toBe('Mínimo')
    expect(ruleLabel('range')).toBe('Rango')
    expect(ruleLabel('cuHardness')).toBe('Por dureza (Cobre)')
    expect(ruleLabel('alPh')).toBe('Por pH (Aluminio)')
  })
  it('cubre los 12 tipos de regla', () => {
    expect(Object.keys(RULE_LABELS)).toHaveLength(12)
  })
})
