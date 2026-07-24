import { describe, it, expect } from 'vitest'
import { computeCells } from './cells'
import type { GuidelineTable, DataRow } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])

describe('computeCells', () => {
  it('marca banda de cumplimiento y magnitud del exceso', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.02' } }, // cumple
      { station: 'S1', date: new Date(2020, 1, 1), values: { TP: '0.10' } }, // 2x -> falla <10
      { station: 'S1', date: new Date(2020, 2, 1), values: { TP: '1.0' } },  // 20x -> 10-25
      { station: 'S1', date: new Date(2020, 3, 1), values: { TP: '2.0' } },  // 40x -> >25
    ]
    const cells = computeCells(rows, gl)
    expect(cells).toHaveLength(4)
    expect(cells[0]).toMatchObject({ fail: false, band: 'pass' })
    expect(cells[1]).toMatchObject({ fail: true, band: 'lt10' })
    expect(cells[2].band).toBe('x10to25')
    expect(cells[3].band).toBe('gt25')
  })
  it('omite celdas vacías y sin guía', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: null, values: { TP: '', OTRO: '5' } },
    ]
    const cells = computeCells(rows, gl)
    expect(cells).toHaveLength(0)
  })
})
