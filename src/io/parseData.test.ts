import { describe, it, expect } from 'vitest'
import { parseDataCsv } from './parseData'

const CSV = `Station,Date,DO,TP
S1,5/6/2007,6,0.10
S1,7/25/2007,<0.5,0.02
`

describe('parseDataCsv', () => {
  it('extrae filas, estación, fecha y columnas de parámetros', () => {
    const { rows, columns } = parseDataCsv(CSV)
    expect(columns).toEqual(['DO', 'TP'])
    expect(rows).toHaveLength(2)
    expect(rows[0].station).toBe('S1')
    expect(rows[0].date!.getFullYear()).toBe(2007)
    expect(rows[0].values).toEqual({ DO: '6', TP: '0.10' })
    expect(rows[1].values.DO).toBe('<0.5') // conserva el crudo del no-detectado
  })
  it('reconoce Station/Date sin importar mayúsculas', () => {
    const csv = `STATION,DATE,DO\nA,2008-01-01,7\n`
    const { rows, columns } = parseDataCsv(csv)
    expect(columns).toEqual(['DO'])
    expect(rows[0].station).toBe('A')
    expect(rows[0].date!.getMonth()).toBe(0)
  })
  it('registra issue si falta la columna Station o Date', () => {
    const csv = `Foo,Date,DO\nA,2008-01-01,7\n`
    const { issues } = parseDataCsv(csv)
    expect(issues.length).toBeGreaterThan(0)
  })
})
