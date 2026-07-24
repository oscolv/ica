import { describe, it, expect } from 'vitest'
import { PARAM_CATALOG, catalogToRow } from './paramCatalog'

describe('paramCatalog', () => {
  it('incluye parámetros mexicanos típicos', () => {
    const ids = PARAM_CATALOG.map((e) => e.parameterId)
    expect(ids).toContain('BOD5_mgL')
    expect(ids).toContain('FLUORIDE_mgL')
    expect(ids).toContain('E_COLI_NMP100mL')
  })
  it('convierte una entrada del catálogo en una fila de guía', () => {
    const e = PARAM_CATALOG.find((x) => x.parameterId === 'FLUORIDE_mgL')!
    const row = catalogToRow(e)
    expect(row.parameterId).toBe('FLUORIDE_mgL')
    expect(row.ruleType).toBe('max')
    expect(row.upperLimit).toBe(1.5)
    expect(row.unit).toBe('mg/L')
  })
})
