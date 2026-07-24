import { describe, it, expect } from 'vitest'
import { computeStations } from './computeStations'
import type { GuidelineRow, GuidelineTable, DataRow } from './types'

function table(rows: GuidelineRow[]): GuidelineTable {
  const m: GuidelineTable = new Map()
  for (const r of rows) {
    const arr = m.get(r.parameterId) ?? []
    arr.push(r)
    m.set(r.parameterId, arr)
  }
  return m
}

const gl = table([
  { parameterId: 'DO', ruleType: 'min', lowerLimit: 5, upperLimit: null },
  { parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 },
])

const rows: DataRow[] = [
  { station: 'S1', date: new Date(2020, 0, 1), values: { DO: '6', TP: '0.10' } }, // TP falla (0.10>0.05)
  { station: 'S1', date: new Date(2020, 1, 1), values: { DO: '4', TP: '0.02' } }, // DO falla (4<5)
]

describe('computeStations', () => {
  it('cuenta parámetros, pruebas y fallas por estación', () => {
    const res = computeStations(rows, gl)
    expect(res).toHaveLength(1)
    const s = res[0]
    expect(s.station).toBe('S1')
    expect(s.nParams).toBe(2) // DO y TP
    expect(s.nTests).toBe(4) // 2 fechas × 2 parámetros
    expect(s.nFailedTests).toBe(2)
    expect(s.failedParams.sort()).toEqual(['DO', 'TP'])
    expect(s.f1).toBe(100) // 2 de 2 parámetros fallan
    expect(s.f2).toBe(50) // 2 de 4 pruebas
  })

  it('excluye celdas vacías del conteo de pruebas', () => {
    const r: DataRow[] = [
      { station: 'A', date: new Date(2020, 0, 1), values: { TP: '0.02' } },
      { station: 'A', date: new Date(2020, 1, 1), values: { TP: '' } },
    ]
    const res = computeStations(r, table([
      { parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 },
    ]))
    expect(res[0].nTests).toBe(1)
  })

  it('regla del límite de detección: si LD > guía, se usa el LD como guía (no falla)', () => {
    const r: DataRow[] = [
      { station: 'A', date: new Date(2020, 0, 1), values: { CD: '<0.1' } },
    ]
    const res = computeStations(r, table([
      { parameterId: 'CD', ruleType: 'max', lowerLimit: null, upperLimit: 0.05 },
    ]))
    expect(res[0].nFailedTests).toBe(0) // el no-detectado a 0.1 no cuenta como falla
  })

  it('usa dureza/pH/temp de columnas configurables', () => {
    const r: DataRow[] = [
      { station: 'A', date: new Date(2020, 0, 1), values: { HARDNESS: '312', CU: '5' } },
    ]
    const res = computeStations(r, table([
      { parameterId: 'CU', ruleType: 'cuHardness', lowerLimit: null, upperLimit: null },
    ]))
    // dureza 312 -> guía cobre 4 µg/L; valor 5 > 4 -> falla
    expect(res[0].nFailedTests).toBe(1)
  })
})
