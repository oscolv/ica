import { describe, it, expect } from 'vitest'
import { evaluate } from './excursion'

describe('evaluate (excursión y pass/fail)', () => {
  it('max: falla si valor > objetivo, excursión = valor/obj − 1', () => {
    expect(evaluate(0.058, { target: 0.05, mode: 'max' })).toEqual({ fail: true, excursion: 0.058 / 0.05 - 1 })
  })
  it('max: pasa si valor <= objetivo', () => {
    expect(evaluate(0.04, { target: 0.05, mode: 'max' })).toEqual({ fail: false, excursion: 0 })
  })
  it('min: falla si valor < objetivo, excursión = obj/valor − 1', () => {
    expect(evaluate(8, { target: 9.5, mode: 'min' })).toEqual({ fail: true, excursion: 9.5 / 8 - 1 })
  })
  it('range: falla por debajo del inferior', () => {
    const r = evaluate(6.0, { target: [6.5, 9], mode: 'range' })
    expect(r.fail).toBe(true)
    expect(r.excursion).toBeCloseTo(6.5 / 6.0 - 1, 6)
  })
  it('range: falla por encima del superior', () => {
    const r = evaluate(9.5, { target: [6.5, 9], mode: 'range' })
    expect(r.fail).toBe(true)
    expect(r.excursion).toBeCloseTo(9.5 / 9 - 1, 6)
  })
  it('range: pasa dentro del intervalo', () => {
    expect(evaluate(7.5, { target: [6.5, 9], mode: 'range' })).toEqual({ fail: false, excursion: 0 })
  })
  it('min: valor 0 no produce NaN, falla con excursión 0', () => {
    expect(evaluate(0, { target: 9.5, mode: 'min' })).toEqual({ fail: true, excursion: 0 })
  })
  it('range: valor 0 bajo el inferior no produce NaN, excursión 0', () => {
    expect(evaluate(0, { target: [6.5, 9], mode: 'range' })).toEqual({ fail: true, excursion: 0 })
  })
})
