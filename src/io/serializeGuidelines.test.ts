import { describe, it, expect } from 'vitest'
import { serializeGuidelinesCsv } from './serializeGuidelines'
import { parseGuidelinesCsv } from './parseGuidelines'

const CSV = `PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID
ARSENIC_TOTAL_ugL,>,,5,,,,,CCME 1997,ug/L
PH,<>,6.5,9,,,,,CCME 1987,
LEAD_TOTAL_ugL,HARDNESS,,1,0,60,,,CCME 1987,ug/L
LEAD_TOTAL_ugL,HARDNESS,,7,180,,,,CCME 1987,ug/L
`

describe('serializeGuidelinesCsv', () => {
  it('round-trip: parsear -> serializar -> parsear conserva la tabla', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const out = serializeGuidelinesCsv(table)
    const { table: table2, issues } = parseGuidelinesCsv(out)
    expect(issues).toHaveLength(0)
    expect(table2.get('ARSENIC_TOTAL_ugL')![0].upperLimit).toBe(5)
    expect(table2.get('ARSENIC_TOTAL_ugL')![0].ruleType).toBe('max')
    expect(table2.get('PH')![0].ruleType).toBe('range')
    expect(table2.get('LEAD_TOTAL_ugL')).toHaveLength(2)
    expect(table2.get('LEAD_TOTAL_ugL')![1].hardnessLower).toBe(180)
  })
  it('la primera línea es el encabezado oficial', () => {
    const { table } = parseGuidelinesCsv(CSV)
    const out = serializeGuidelinesCsv(table)
    expect(out.split('\n')[0]).toBe(
      'PARAMETER_ID,EXCEED_IF,LOWER_LIMIT,UPPER_LIMIT,HARDNESS_LOWER,HARDNESS_UPPER,SEASON_START,SEASON_FINISH,GUIDELINE_SOURCE,UNIT_ID',
    )
  })
})
