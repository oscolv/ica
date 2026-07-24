import { describe, it, expect } from 'vitest'
import { validateGuidelines } from './validateGuidelines'
import type { GuidelineRow, GuidelineTable } from '../engine/types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const a = m.get(r.parameterId) ?? []
    a.push(r)
    m.set(r.parameterId, a)
  }
  return m
}
const row = (o: Partial<GuidelineRow>): GuidelineRow => ({
  parameterId: 'X', ruleType: 'max', lowerLimit: null, upperLimit: null, ...o,
})

describe('validateGuidelines', () => {
  it('error si una regla max no tiene límite superior', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'AS', ruleType: 'max', upperLimit: null })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'AS')).toBe(true)
  })
  it('error si una regla min no tiene límite inferior', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'DO', ruleType: 'min', lowerLimit: null })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'DO')).toBe(true)
  })
  it('error si un rango tiene inferior >= superior', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'PH', ruleType: 'range', lowerLimit: 9, upperLimit: 6.5 })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'PH')).toBe(true)
  })
  it('error si una regla estacional no tiene ventana de fechas', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'TP', ruleType: 'season', upperLimit: 0.02, seasonStart: null, seasonFinish: null })]))
    expect(issues.some((i) => i.severity === 'error' && i.parameterId === 'TP')).toBe(true)
  })
  it('aviso si falta unidad', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'AS', ruleType: 'max', upperLimit: 5, unit: undefined })]))
    expect(issues.some((i) => i.severity === 'warn' && i.parameterId === 'AS')).toBe(true)
  })
  it('guía válida no produce errores', () => {
    const issues = validateGuidelines(table([row({ parameterId: 'AS', ruleType: 'max', upperLimit: 5, unit: 'ug/L' })]))
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })
})
