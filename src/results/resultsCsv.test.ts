import { describe, it, expect } from 'vitest'
import { resultsToCsv } from './resultsCsv'
import type { StationResult } from '../engine/types'

const r: StationResult = {
  station: 'S1', nParams: 20, nTests: 253, failedParams: ['AL', 'FE'], nFailedTests: 39,
  f1: 20, f2: 15.4, f3: 98.88, nse: 88, wqi: 41.1, category: 'Poor',
}

describe('resultsToCsv', () => {
  it('genera encabezado y una fila por estación', () => {
    const csv = resultsToCsv([r])
    const lines = csv.trim().split('\n')
    expect(lines[0]).toContain('Station')
    expect(lines[0]).toContain('WQI')
    expect(lines[1]).toContain('S1')
    expect(lines[1]).toContain('41.1')
    expect(lines[1]).toContain('Poor')
    expect(lines[1]).toContain('AL; FE')
  })

  it('escapa las comillas internas en nombres (RFC 4180)', () => {
    const r2 = { ...r, station: 'Sitio "A"' }
    const csv = resultsToCsv([r2])
    expect(csv).toContain('"Sitio ""A"""')
  })
})
