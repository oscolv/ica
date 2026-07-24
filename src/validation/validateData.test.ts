import { describe, it, expect } from 'vitest'
import { validateData } from './validateData'
import type { GuidelineRow, GuidelineTable, DataRow } from '../engine/types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const a = m.get(r.parameterId) ?? []
    a.push(r); m.set(r.parameterId, a)
  }
  return m
}
const gl = table([
  { parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' },
  { parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null, unit: 'ug/L' },
  { parameterId: 'PH', ruleType: 'range', lowerLimit: 6.5, upperLimit: 9 },
])

describe('validateData', () => {
  it('clasifica columnas: emparejadas, datos sin guía, guías sin datos', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: '0.02', EXTRA: '1' } }]
    const res = validateData(rows, ['TP', 'EXTRA'], gl)
    expect(res.matched).toContain('TP')
    expect(res.dataWithoutGuideline).toContain('EXTRA')
    expect(res.guidelineWithoutData).toEqual(expect.arrayContaining(['CU', 'PH']))
  })

  it('error si una regla por dureza no tiene columna de dureza', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { CU: '5' } }]
    const res = validateData(rows, ['CU'], gl)
    expect(res.issues.some((i) => i.severity === 'error' && i.code === 'FALTA_DUREZA')).toBe(true)
  })

  it('error si un valor no es numérico', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: 'abc' } }]
    const res = validateData(rows, ['TP'], gl)
    expect(res.issues.some((i) => i.severity === 'error' && i.code === 'VALOR_NO_NUMERICO')).toBe(true)
  })

  it('aviso por pH fuera del rango físico 0–14', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { PH: '20' } }]
    const res = validateData(rows, ['PH'], gl)
    expect(res.issues.some((i) => i.severity === 'warn' && i.code === 'PH_FUERA_DE_RANGO')).toBe(true)
  })

  it('aviso si hay menos de 8 parámetros emparejados', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: '0.02' } }]
    const res = validateData(rows, ['TP'], gl)
    expect(res.issues.some((i) => i.severity === 'warn' && i.code === 'POCOS_PARAMETROS')).toBe(true)
  })

  it('acepta no-detectados sin marcarlos como no numéricos', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: '<0.01' } }]
    const res = validateData(rows, ['TP'], gl)
    expect(res.issues.some((i) => i.code === 'VALOR_NO_NUMERICO')).toBe(false)
  })

  it('no lista columnas de contexto (HARDNESS) como datos sin guía', () => {
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { TP: '0.02', HARDNESS: '150' } }]
    const res = validateData(rows, ['TP', 'HARDNESS'], gl)
    expect(res.dataWithoutGuideline).not.toContain('HARDNESS')
  })
  it('error FALTA_PH para regla por pH sin columna PH, y FALTA_PH_TEMP para amoníaco', () => {
    const gl2 = table([
      { parameterId: 'AL', ruleType: 'alPh', lowerLimit: null, upperLimit: null, unit: 'mg/L' },
      { parameterId: 'NH3', ruleType: 'ammonia', lowerLimit: 0.0152, upperLimit: null, unit: 'mg/L' },
    ])
    const rows: DataRow[] = [{ station: 'A', date: new Date(2020, 0, 1), values: { AL: '0.1', NH3: '0.5' } }]
    const res = validateData(rows, ['AL', 'NH3'], gl2)
    expect(res.issues.some((i) => i.code === 'FALTA_PH')).toBe(true)
    expect(res.issues.some((i) => i.code === 'FALTA_PH_TEMP')).toBe(true)
  })
})
