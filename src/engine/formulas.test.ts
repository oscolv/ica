import { describe, it, expect } from 'vitest'
import {
  cadmiumGuideline,
  copperGuideline,
  nickelGuideline,
  leadGuideline,
  zincGuideline,
  aluminumGuideline,
  ammoniaTotalGuideline,
} from './formulas'

describe('fórmulas dependientes de dureza/pH (verificadas vs binario oficial)', () => {
  it('cadmio: techo/piso y fórmula', () => {
    expect(cadmiumGuideline(10)).toBeCloseTo(0.04, 5) // H<17 -> 0.04
    expect(cadmiumGuideline(400)).toBeCloseTo(0.37, 5) // H>280 -> 0.37
    expect(cadmiumGuideline(100)).toBeCloseTo(0.1585, 3) // 10^(0.83*2-2.46)
  })
  it('cobre: mesetas y fórmula', () => {
    expect(copperGuideline(50)).toBe(2) // H<82
    expect(copperGuideline(312)).toBe(4) // H>180
    expect(copperGuideline(100)).toBeCloseTo(2.364, 2)
  })
  it('níquel: mesetas y fórmula', () => {
    expect(nickelGuideline(50)).toBe(25) // H<=60
    expect(nickelGuideline(312)).toBe(150) // H>180
    expect(nickelGuideline(100)).toBeCloseTo(95.58, 2)
  })
  it('plomo: mesetas y fórmula', () => {
    expect(leadGuideline(50)).toBe(1) // H<60
    expect(leadGuideline(312)).toBe(7) // H>180
    expect(leadGuideline(100)).toBeCloseTo(3.18, 2)
  })
  it('zinc: lineal por dureza', () => {
    expect(zincGuideline(50)).toBe(7.5) // H<90
    expect(zincGuideline(312)).toBeCloseTo(174, 5) // 7.5+0.75*(312-90)
  })
  it('aluminio: por pH', () => {
    expect(aluminumGuideline(6.0)).toBe(0.005)
    expect(aluminumGuideline(7.0)).toBe(0.1)
  })
  it('amoníaco: guía de amoníaco total desde el límite no ionizado', () => {
    // f = 1/(1+10^(0.09018 + 2729.92/(273.2+T) - pH)); guía_total = límite/f
    expect(ammoniaTotalGuideline(0.0152, 8, 20)).toBeCloseTo(0.398, 2)
  })
})
