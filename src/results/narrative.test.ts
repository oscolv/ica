import { describe, it, expect } from 'vitest'
import { buildNarrative } from './narrative'
import type { StationResult } from '../engine/types'

const base: StationResult = {
  station: 'S1', nParams: 10, nTests: 100, failedParams: [], nFailedTests: 0,
  f1: 0, f2: 0, f3: 0, nse: 0, wqi: 96, category: 'Excellent',
}

describe('buildNarrative', () => {
  it('describe un caso sin fallas', () => {
    const t = buildNarrative(base)
    expect(t).toContain('S1')
    expect(t.toLowerCase()).toContain('excelente')
    expect(t).toMatch(/Ning[uú]n par[aá]metro/i)
  })
  it('describe los parámetros que fallan', () => {
    const r: StationResult = { ...base, failedParams: ['ALUMINUM', 'IRON'], nFailedTests: 8, wqi: 41, category: 'Poor' }
    const t = buildNarrative(r)
    expect(t.toLowerCase()).toContain('mala')
    expect(t).toContain('ALUMINUM')
    expect(t).toContain('IRON')
    expect(t).toContain('41')
  })
})
