import { describe, it, expect } from 'vitest'
import { parseGuidelinesCsv } from './parseGuidelines'

const CSV = `PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID
ARSENIC_TOTAL_ugL,>,,5,,,,,CCME 1997,ug/L
DISSOLVED_OXYGEN_mgL,<,9.5,,,,,,CCME 1999,mg/L
PH,<>,6.5,9,,,,,CCME 1987,
LEAD_TOTAL_ugL,HARDNESS,,1,0,60,,,CCME 1987,ug/L
LEAD_TOTAL_ugL,HARDNESS,,7,180,,,,CCME 1987,ug/L
PHOSPHORUS_TOTAL_mgL,SEASON,,0.02,,,1-May,31-Oct,CCME 2004,mg/L
COPPER_TOTAL_ugL,CuHardness,,,,,,,CCME 1987,ug/L
WEIRD_PARAM,MB CdHardness,,,,,,,x,ug/L
`

describe('parseGuidelinesCsv', () => {
  it('agrupa filas por parámetro y mapea tipos de regla', () => {
    const { table } = parseGuidelinesCsv(CSV)
    expect(table.get('ARSENIC_TOTAL_ugL')![0].ruleType).toBe('max')
    expect(table.get('ARSENIC_TOTAL_ugL')![0].upperLimit).toBe(5)
    expect(table.get('DISSOLVED_OXYGEN_mgL')![0].ruleType).toBe('min')
    expect(table.get('DISSOLVED_OXYGEN_mgL')![0].lowerLimit).toBe(9.5)
    expect(table.get('PH')![0].ruleType).toBe('range')
    expect(table.get('COPPER_TOTAL_ugL')![0].ruleType).toBe('cuHardness')
  })
  it('agrupa las dos filas de plomo (escalones) bajo el mismo parámetro', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const pb = table.get('LEAD_TOTAL_ugL')!
    expect(pb).toHaveLength(2)
    expect(pb[0].hardnessLower).toBe(0)
    expect(pb[0].hardnessUpper).toBe(60)
    expect(pb[1].hardnessLower).toBe(180)
    expect(pb[1].hardnessUpper).toBeNull()
  })
  it('conserva ventanas de estación', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const p = table.get('PHOSPHORUS_TOTAL_mgL')![0]
    expect(p.ruleType).toBe('season')
    expect(p.seasonStart).toBe('1-May')
    expect(p.seasonFinish).toBe('31-Oct')
    expect(p.upperLimit).toBe(0.02)
  })
  it('registra un issue y omite parámetros con código no soportado', () => {
    const { table, issues } = parseGuidelinesCsv(CSV)
    expect(table.has('WEIRD_PARAM')).toBe(false)
    expect(issues.some((i) => i.parameterId === 'WEIRD_PARAM')).toBe(true)
  })
})
