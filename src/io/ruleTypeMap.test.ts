import { describe, it, expect } from 'vitest'
import { codeToRuleType, ruleTypeToCode } from './ruleTypeMap'

describe('codeToRuleType', () => {
  it('mapea códigos simples (case-insensitive)', () => {
    expect(codeToRuleType('>')).toBe('max')
    expect(codeToRuleType('<')).toBe('min')
    expect(codeToRuleType('<>')).toBe('range')
    expect(codeToRuleType('HARDNESS')).toBe('hardnessStep')
    expect(codeToRuleType('season')).toBe('season')
    expect(codeToRuleType('date')).toBe('season')
    expect(codeToRuleType('compute')).toBe('ammonia')
  })
  it('mapea fórmulas por dureza/pH en cualquier caja', () => {
    expect(codeToRuleType('pHDependCCME')).toBe('alPh')
    expect(codeToRuleType('CDHARDNESS')).toBe('cdHardness')
    expect(codeToRuleType('CuHardness')).toBe('cuHardness')
    expect(codeToRuleType('nihardness')).toBe('niHardness')
    expect(codeToRuleType('PbHardness')).toBe('pbHardness')
    expect(codeToRuleType('ZnHardness')).toBe('znHardness')
  })
  it('devuelve null para variantes provinciales y desconocidas', () => {
    expect(codeToRuleType('MB CdHardness')).toBeNull()
    expect(codeToRuleType('AB CdHardness')).toBeNull()
    expect(codeToRuleType('pHDependBC')).toBeNull()
    expect(codeToRuleType('MB pH dependant')).toBeNull()
    expect(codeToRuleType('loquesea')).toBeNull()
    expect(codeToRuleType('')).toBeNull()
  })
})

describe('ruleTypeToCode', () => {
  it('devuelve el código canónico oficial', () => {
    expect(ruleTypeToCode('max')).toBe('>')
    expect(ruleTypeToCode('min')).toBe('<')
    expect(ruleTypeToCode('range')).toBe('<>')
    expect(ruleTypeToCode('hardnessStep')).toBe('HARDNESS')
    expect(ruleTypeToCode('season')).toBe('SEASON')
    expect(ruleTypeToCode('ammonia')).toBe('COMPUTE')
    expect(ruleTypeToCode('alPh')).toBe('pHDependCCME')
    expect(ruleTypeToCode('cdHardness')).toBe('CdHardness')
    expect(ruleTypeToCode('cuHardness')).toBe('CuHardness')
    expect(ruleTypeToCode('niHardness')).toBe('NiHardness')
    expect(ruleTypeToCode('pbHardness')).toBe('PbHardness')
    expect(ruleTypeToCode('znHardness')).toBe('ZnHardness')
  })
})
