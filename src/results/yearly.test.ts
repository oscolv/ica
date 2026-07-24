import { describe, it, expect } from 'vitest'
import { computeYearlyWqi } from './yearly'
import type { GuidelineTable, DataRow } from '../engine/types'

const gl: GuidelineTable = new Map([
  ['TP', [{ parameterId: 'TP', ruleType: 'max', lowerLimit: null, upperLimit: 0.05, unit: 'mg/L' }]],
])

describe('computeYearlyWqi', () => {
  it('produce un punto por estación y año', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: new Date(2019, 0, 1), values: { TP: '0.02' } },
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.10' } },
    ]
    const out = computeYearlyWqi(rows, gl)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ station: 'S1', year: 2019 })
    expect(out[1]).toMatchObject({ station: 'S1', year: 2020 })
    expect(out[0].wqi).toBeGreaterThan(out[1].wqi) // 2019 sin fallas > 2020 con falla
  })
  it('ignora filas sin fecha', () => {
    const rows: DataRow[] = [
      { station: 'S1', date: null, values: { TP: '0.02' } },
      { station: 'S1', date: new Date(2020, 0, 1), values: { TP: '0.02' } },
    ]
    const out = computeYearlyWqi(rows, gl)
    expect(out).toHaveLength(1)
    expect(out[0].year).toBe(2020)
  })
})
