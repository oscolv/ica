import { describe, it, expect } from 'vitest'
import { computeF1, computeF2, computeNse, computeF3, computeWQI, category } from './indexCalc'

describe('factores del índice', () => {
  it('F1 = % de parámetros que fallan', () => {
    expect(computeF1(2, 10)).toBe(20)
  })
  it('F2 = % de pruebas que fallan', () => {
    expect(computeF2(4, 103)).toBeCloseTo(3.883, 3)
  })
  it('F3 = nse/(0.01·nse+0.01)', () => {
    expect(computeF3(0)).toBe(0)
    expect(computeF3(1)).toBe(50)
  })
  it('categorías', () => {
    expect(category(97)).toBe('Excellent')
    expect(category(88)).toBe('Good')
    expect(category(70)).toBe('Fair')
    expect(category(50)).toBe('Marginal')
    expect(category(30)).toBe('Poor')
  })
})

describe('REGRESIÓN: ejemplo del manual (río North Saskatchewan, 1997)', () => {
  it('reproduce F1=20, F2≈3.9, F3≈2.8, WQI≈88', () => {
    const f1 = computeF1(2, 10)
    const f2 = computeF2(4, 103)
    const nse = computeNse([0.16, 1.16, 1.35, 0.275], 103)
    const f3 = computeF3(nse)
    const wqi = computeWQI(f1, f2, f3)
    expect(f1).toBe(20)
    expect(f2).toBeCloseTo(3.9, 1)
    expect(f3).toBeCloseTo(2.8, 1)
    expect(Math.round(wqi)).toBe(88)
  })
})
