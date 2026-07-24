import { describe, it, expect } from 'vitest'
import { resolveGuideline } from './resolveGuideline'
import type { GuidelineRow, SampleContext } from './types'

const ctx = (o: Partial<SampleContext> = {}): SampleContext => ({
  hardness: null, pH: null, temp: null, date: null, ...o,
})
const row = (o: Partial<GuidelineRow>): GuidelineRow => ({
  parameterId: 'X', ruleType: 'max', lowerLimit: null, upperLimit: null, ...o,
})

describe('resolveGuideline', () => {
  it('max: usa upperLimit', () => {
    expect(resolveGuideline([row({ ruleType: 'max', upperLimit: 5 })], ctx()))
      .toEqual({ target: 5, mode: 'max' })
  })
  it('min: usa lowerLimit', () => {
    expect(resolveGuideline([row({ ruleType: 'min', lowerLimit: 9.5 })], ctx()))
      .toEqual({ target: 9.5, mode: 'min' })
  })
  it('range: tupla inf/sup', () => {
    expect(resolveGuideline([row({ ruleType: 'range', lowerLimit: 6.5, upperLimit: 9 })], ctx()))
      .toEqual({ target: [6.5, 9], mode: 'range' })
  })
  it('cuHardness: calcula con la dureza de la muestra', () => {
    const r = resolveGuideline([row({ ruleType: 'cuHardness' })], ctx({ hardness: 312 }))
    expect(r).toEqual({ target: 4, mode: 'max' })
  })
  it('alPh: calcula con el pH de la muestra', () => {
    expect(resolveGuideline([row({ ruleType: 'alPh' })], ctx({ pH: 6.0 })))
      .toEqual({ target: 0.005, mode: 'max' })
  })
  it('hardnessStep: elige el tramo por dureza (plomo)', () => {
    const rows: GuidelineRow[] = [
      row({ ruleType: 'hardnessStep', upperLimit: 1, hardnessLower: 0, hardnessUpper: 60 }),
      row({ ruleType: 'hardnessStep', upperLimit: 7, hardnessLower: 180, hardnessUpper: null }),
    ]
    expect(resolveGuideline(rows, ctx({ hardness: 312 }))).toEqual({ target: 7, mode: 'max' })
  })
  it('season: elige el límite por fecha', () => {
    const rows: GuidelineRow[] = [
      row({ ruleType: 'season', upperLimit: 0.03, seasonStart: '1-Jan', seasonFinish: '30-Apr' }),
      row({ ruleType: 'season', upperLimit: 0.02, seasonStart: '1-May', seasonFinish: '31-Oct' }),
    ]
    const r = resolveGuideline(rows, ctx({ date: new Date(2008, 5, 3) })) // 3-Jun
    expect(r).toEqual({ target: 0.02, mode: 'max' })
  })
  it('devuelve null si falta el contexto requerido', () => {
    expect(resolveGuideline([row({ ruleType: 'cuHardness' })], ctx({ hardness: null }))).toBeNull()
  })
  it('devuelve null si no hay límite numérico', () => {
    expect(resolveGuideline([row({ ruleType: 'max', upperLimit: null })], ctx())).toBeNull()
  })
})
