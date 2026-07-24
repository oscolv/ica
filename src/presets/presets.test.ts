import { describe, it, expect } from 'vitest'
import { PRESETS, getPreset } from './index'

describe('presets', () => {
  it('expone CCME y México', () => {
    expect(getPreset('ccme')).toBeDefined()
    expect(getPreset('mexico')).toBeDefined()
    expect(PRESETS.map((p) => p.id).sort()).toEqual(['ccme', 'mexico'])
  })
  it('CCME parsea sin códigos no soportados y trae parámetros clave', () => {
    const ccme = getPreset('ccme')!
    expect(ccme.table.get('ARSENIC_TOTAL_ugL')![0].ruleType).toBe('max')
    expect(ccme.table.get('COPPER_TOTAL_ugL')![0].ruleType).toBe('cuHardness')
    expect(ccme.table.get('LEAD_TOTAL_ugL')).toHaveLength(4)
    expect(ccme.table.get('PHOSPHORUS_TOTAL_mgL')).toHaveLength(3)
    // corrección de unidad del hierro
    expect(ccme.table.get('IRON_TOTAL_mgL')![0].unit).toBe('mg/L')
  })
  it('México trae los parámetros mexicanos típicos', () => {
    const mx = getPreset('mexico')!
    expect(mx.table.get('BOD5_mgL')![0].upperLimit).toBe(30)
    expect(mx.table.get('FLUORIDE_mgL')![0].upperLimit).toBe(1.5)
    expect(mx.table.has('E_COLI_NMP100mL')).toBe(true)
  })
})
