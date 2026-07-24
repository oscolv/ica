import { describe, it, expect } from 'vitest'
import { loadExample } from './index'
import { computeStations } from '../engine'

describe('loadExample (Tabla 1 del manual)', () => {
  it('carga guía y datos', () => {
    const ex = loadExample()
    expect(ex.guidelineTable.size).toBe(10)
    expect(ex.rows.length).toBe(12)
    expect(ex.columns).toContain('TP')
  })
  it('reproduce el WQI del manual (≈88)', () => {
    const ex = loadExample()
    const results = computeStations(ex.rows, ex.guidelineTable)
    expect(results).toHaveLength(1)
    expect(Math.round(results[0].wqi)).toBe(88)
    expect(results[0].failedParams.sort()).toEqual(['PB', 'TP'])
  })
})
